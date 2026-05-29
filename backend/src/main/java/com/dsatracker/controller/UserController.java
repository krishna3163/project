package com.dsatracker.controller;

import com.dsatracker.model.User;
import com.dsatracker.repository.UserRepository;
import com.dsatracker.service.DsaService;
import com.dsatracker.service.QuestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.data.redis.core.StringRedisTemplate;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final DsaService dsaService;
    private final QuestService questService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final StringRedisTemplate redisTemplate;

    @GetMapping("/me")
    public ResponseEntity<User> getMe(@AuthenticationPrincipal User user) {
        User u = userRepository.findById(user.getId()).orElseThrow();
        
        // Cache daily quest initialization check in Redis with a 24-hour TTL to prevent redundant DB writes
        String questCacheKey = "user:quests:init:" + u.getId() + ":" + java.time.LocalDate.now();
        if (Boolean.FALSE.equals(redisTemplate.hasKey(questCacheKey))) {
            questService.initializeDailyQuests(u);
            redisTemplate.opsForValue().set(questCacheKey, "true", 1, TimeUnit.DAYS);
        }
        
        long rank = userRepository.countByXpPointsGreaterThan(u.getXpPoints()) + 1;
        u.setGlobalRank(rank);
        return ResponseEntity.ok(u);
    }

    @PatchMapping("/me")
    public ResponseEntity<User> updateMe(
            @RequestBody UpdateRequest req,
            @AuthenticationPrincipal User user) {
        User u = userRepository.findById(user.getId()).orElseThrow();
        if (req.name() != null && !req.name().isBlank()) {
            u.setName(req.name().trim());
        }
        User saved = userRepository.save(u);
        long rank = userRepository.countByXpPointsGreaterThan(saved.getXpPoints()) + 1;
        saved.setGlobalRank(rank);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/leetcode")
    public ResponseEntity<User> updateLeetCode(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        String username = body.get("leetcodeUsername");
        User u = dsaService.syncLeetCodeProfile(user.getId(), username);
        long rank = userRepository.countByXpPointsGreaterThan(u.getXpPoints()) + 1;
        u.setGlobalRank(rank);
        return ResponseEntity.ok(u);
    }

    @PostMapping("/leetcode/sync")
    public ResponseEntity<User> syncLeetCode(@AuthenticationPrincipal User user) {
        User u = userRepository.findById(user.getId()).orElseThrow();
        if (u.getLeetcodeUsername() == null || u.getLeetcodeUsername().isBlank()) {
            throw new IllegalArgumentException("No LeetCode account linked");
        }
        User synced = dsaService.syncLeetCodeProfile(user.getId(), u.getLeetcodeUsername());
        long rank = userRepository.countByXpPointsGreaterThan(synced.getXpPoints()) + 1;
        synced.setGlobalRank(rank);
        return ResponseEntity.ok(synced);
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(
            @Valid @RequestBody ProfileUpdateRequest req,
            @AuthenticationPrincipal User user) {
        User u = userRepository.findById(user.getId()).orElseThrow();
        if (req.name() != null) u.setName(req.name().trim());
        if (req.dob() != null) u.setDob(req.dob().trim());
        if (req.phone() != null) u.setPhone(req.phone().trim());
        if (req.githubLink() != null) u.setGithubLink(req.githubLink().trim());
        if (req.hackerrankLink() != null) u.setHackerrankLink(req.hackerrankLink().trim());
        if (req.hackerearthLink() != null) u.setHackerearthLink(req.hackerearthLink().trim());
        if (req.linkedinLink() != null) u.setLinkedinLink(req.linkedinLink().trim());
        
        if (req.leetcodeUsername() != null && !req.leetcodeUsername().isBlank()) {
            u.setLeetcodeUsername(req.leetcodeUsername().trim());
        }

        User saved = userRepository.save(u);
        long rank = userRepository.countByXpPointsGreaterThan(saved.getXpPoints()) + 1;
        saved.setGlobalRank(rank);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/profile/sync")
    public ResponseEntity<User> syncProfile(@AuthenticationPrincipal User user) {
        User u = userRepository.findById(user.getId()).orElseThrow();
        
        // 1. Sync LeetCode
        if (u.getLeetcodeUsername() != null && !u.getLeetcodeUsername().isBlank()) {
            try {
                u = dsaService.syncLeetCodeProfile(u.getId(), u.getLeetcodeUsername());
            } catch (Exception e) {
                // Ignore LeetCode sync error
            }
        }
        
        // 2. Sync GitHub events using our timeout-safe RestTemplate
        if (u.getGithubLink() != null && !u.getGithubLink().isBlank()) {
            String githubUsername = extractGithubUsername(u.getGithubLink());
            if (githubUsername != null && !githubUsername.isBlank()) {
                try {
                    String ghUrl = "https://api.github.com/users/" + githubUsername + "/events";
                    org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                    headers.set("User-Agent", "PrepNest-App");
                    org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
                    
                    org.springframework.http.ResponseEntity<String> ghResponse = restTemplate.exchange(ghUrl, org.springframework.http.HttpMethod.GET, entity, String.class);
                    if (ghResponse.getStatusCode().is2xxSuccessful() && ghResponse.getBody() != null) {
                        JsonNode root = objectMapper.readTree(ghResponse.getBody());
                        if (root.isArray()) {
                            for (JsonNode event : root) {
                                String createdAt = event.path("created_at").asText();
                                if (createdAt != null && createdAt.length() >= 10) {
                                    String dateStr = createdAt.substring(0, 10);
                                    if (u.getActiveDates() == null) {
                                        u.setActiveDates(new java.util.HashSet<>());
                                    }
                                    u.getActiveDates().add(dateStr);
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    // Ignore GitHub fetch failure
                }
            }
        }
        
        // 3. Removed simulated HackerEarth & HackerRank mock spreads to prevent data corruption.
        // Third-party connections will remain authentic and display actual synced dates.
        
        User saved = userRepository.save(u);
        long rank = userRepository.countByXpPointsGreaterThan(saved.getXpPoints()) + 1;
        saved.setGlobalRank(rank);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/friends")
    public ResponseEntity<User> addFriend(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        String friendUsername = body.get("leetcodeUsername");
        if (friendUsername == null || friendUsername.isBlank()) {
            throw new IllegalArgumentException("LeetCode username cannot be blank");
        }
        friendUsername = friendUsername.trim();
        
        User u = userRepository.findById(user.getId()).orElseThrow();
        if (u.getLeetcodeFriends() == null) {
            u.setLeetcodeFriends(new java.util.ArrayList<>());
        }
        
        if (u.getLeetcodeFriends().size() >= 5) {
            throw new IllegalStateException("You can compare at most 5 friends!");
        }
        
        if (!u.getLeetcodeFriends().contains(friendUsername)) {
            u.getLeetcodeFriends().add(friendUsername);
            userRepository.save(u);
        }
        return ResponseEntity.ok(u);
    }

    @DeleteMapping("/friends/{username}")
    public ResponseEntity<User> removeFriend(
            @PathVariable String username,
            @AuthenticationPrincipal User user) {
        User u = userRepository.findById(user.getId()).orElseThrow();
        if (u.getLeetcodeFriends() != null) {
            u.getLeetcodeFriends().remove(username.trim());
            userRepository.save(u);
        }
        return ResponseEntity.ok(u);
    }

    @GetMapping("/friends/compare")
    public ResponseEntity<java.util.List<User>> compareFriends(@AuthenticationPrincipal User user) {
        User u = userRepository.findById(user.getId()).orElseThrow();
        java.util.List<User> compared = new java.util.ArrayList<>();
        
        long myRank = userRepository.countByXpPointsGreaterThan(u.getXpPoints()) + 1;
        u.setGlobalRank(myRank);
        compared.add(u);
        
        if (u.getLeetcodeFriends() != null) {
            for (String friendUsername : u.getLeetcodeFriends()) {
                try {
                    User fStats = dsaService.getLeetcodeStatsOnly(friendUsername);
                    if (fStats != null) {
                        compared.add(fStats);
                    }
                } catch (Exception e) {
                    // Ignore individual failure
                }
            }
        }
        return ResponseEntity.ok(compared);
    }

    private String extractGithubUsername(String link) {
        if (link == null) return null;
        link = link.trim();
        if (link.startsWith("http://") || link.startsWith("https://")) {
            if (link.endsWith("/")) {
                link = link.substring(0, link.length() - 1);
            }
            String[] parts = link.split("/");
            if (parts.length > 0) {
                return parts[parts.length - 1];
            }
        }
        return link;
    }

    public record UpdateRequest(String name) {}

    public record ProfileUpdateRequest(
            @Size(max = 50, message = "Name must be less than 50 characters")
            String name,

            @Pattern(regexp = "^$|^\\d{4}-\\d{2}-\\d{2}$", message = "Date of Birth must be in YYYY-MM-DD format")
            String dob,

            @Pattern(regexp = "^$|^\\+?[0-9]{10,15}$", message = "Invalid phone number format")
            String phone,

            @Pattern(regexp = "^$|^https?:\\/\\/(www\\.)?github\\.com\\/.*", message = "Invalid GitHub link")
            String githubLink,

            @Pattern(regexp = "^$|^https?:\\/\\/(www\\.)?hackerrank\\.com\\/.*", message = "Invalid HackerRank link")
            String hackerrankLink,

            @Pattern(regexp = "^$|^https?:\\/\\/(www\\.)?hackerearth\\.com\\/.*", message = "Invalid HackerEarth link")
            String hackerearthLink,

            @Pattern(regexp = "^$|^https?:\\/\\/(www\\.)?linkedin\\.com\\/.*", message = "Invalid LinkedIn link")
            String linkedinLink,

            @Size(max = 30, message = "LeetCode username must be less than 30 characters")
            String leetcodeUsername
    ) {}
}
