package com.dsatracker.controller;

import com.dsatracker.model.User;
import com.dsatracker.repository.UserRepository;
import com.dsatracker.service.DsaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final DsaService dsaService;

    @GetMapping("/me")
    public ResponseEntity<User> getMe(@AuthenticationPrincipal User user) {
        User u = userRepository.findById(user.getId()).orElseThrow();
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

    public record UpdateRequest(String name) {}
}
