package com.dsatracker.service;

import com.dsatracker.model.DsaProblem;
import com.dsatracker.model.Notification;
import com.dsatracker.model.User;
import com.dsatracker.repository.DsaProblemRepository;
import com.dsatracker.repository.NotificationRepository;
import com.dsatracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DsaService {

    private final DsaProblemRepository dsaProblemRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    public Page<DsaProblem> getAll(Pageable pageable) {
        return dsaProblemRepository.findAll(pageable);
    }

    public Page<DsaProblem> searchByTitle(String title, Pageable pageable) {
        return dsaProblemRepository.findByTitleContainingIgnoreCase(title, pageable);
    }

    public Page<DsaProblem> filterByDifficulty(String difficulty, Pageable pageable) {
        return dsaProblemRepository.findByDifficulty(difficulty.toUpperCase(), pageable);
    }

    public Page<DsaProblem> filterByTag(String tag, Pageable pageable) {
        return dsaProblemRepository.findByTagsContaining(tag, pageable);
    }

    /**
     * Deterministically fetches a consistent Problem of the Day (POTD) based on date hash.
     */
    public DsaProblem getProblemOfTheDay() {
        List<DsaProblem> all = dsaProblemRepository.findAll();
        if (all.isEmpty()) return null;
        String dateKey = java.time.LocalDate.now().toString(); // e.g. "2026-05-27"
        int hash = dateKey.hashCode();
        int index = Math.abs(hash) % all.size();
        return all.get(index);
    }

    /**
     * Syncs a user's LeetCode profile statistics and solved submissions via public GraphQL.
     */
    public User syncLeetCodeProfile(String userId, String leetcodeUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (leetcodeUsername == null || leetcodeUsername.isBlank()) {
            throw new IllegalArgumentException("LeetCode username cannot be empty");
        }
        user.setLeetcodeUsername(leetcodeUsername.trim());

        try {
            String url = "https://leetcode.com/graphql";
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

            // Single optimized GraphQL query for stats & recent solved submissions
            String query = "{\"query\":\"query userLeetcodeInfo($username: String!) { " +
                    "matchedUser(username: $username) { " +
                        "profile { ranking } " +
                        "submitStats { acSubmissionNum { difficulty count } } " +
                    "} " +
                    "recentAcSubmissionList(username: $username, limit: 100) { " +
                        "titleSlug timestamp " +
                    "} " +
                    "}\",\"variables\":{\"username\":\"" + leetcodeUsername.trim() + "\"}}";

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("Content-Type", "application/json");
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(query, headers);

            String response = restTemplate.postForObject(url, entity, String.class);
            com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(response);
            com.fasterxml.jackson.databind.JsonNode data = root.path("data");
            com.fasterxml.jackson.databind.JsonNode matchedUser = data.path("matchedUser");

            if (!matchedUser.isMissingNode() && !matchedUser.isNull()) {
                int ranking = matchedUser.path("profile").path("ranking").asInt();
                user.setLeetcodeRanking(ranking);

                com.fasterxml.jackson.databind.JsonNode acSubmissions = matchedUser.path("submitStats").path("acSubmissionNum");
                if (acSubmissions.isArray()) {
                    for (com.fasterxml.jackson.databind.JsonNode node : acSubmissions) {
                        String difficulty = node.path("difficulty").asText();
                        int count = node.path("count").asInt();
                        if ("Easy".equalsIgnoreCase(difficulty)) {
                            user.setLeetcodeEasySolved(count);
                        } else if ("Medium".equalsIgnoreCase(difficulty)) {
                            user.setLeetcodeMediumSolved(count);
                        } else if ("Hard".equalsIgnoreCase(difficulty)) {
                            user.setLeetcodeHardSolved(count);
                        }
                    }
                }
            }

            com.fasterxml.jackson.databind.JsonNode submissions = data.path("recentAcSubmissionList");
            int newlySolvedCount = 0;
            if (submissions.isArray() && submissions.size() > 0) {
                List<DsaProblem> localProblems = dsaProblemRepository.findAll();
                for (com.fasterxml.jackson.databind.JsonNode subNode : submissions) {
                    String titleSlug = subNode.path("titleSlug").asText().toLowerCase().trim();
                    if (titleSlug.isEmpty()) continue;

                    // Parse timestamp to record active day
                    long timestamp = subNode.path("timestamp").asLong();
                    if (timestamp > 0) {
                        try {
                            String dateStr = java.time.Instant.ofEpochSecond(timestamp)
                                    .atZone(java.time.ZoneId.systemDefault())
                                    .toLocalDate()
                                    .toString();
                            if (user.getActiveDates() == null) {
                                user.setActiveDates(new java.util.HashSet<>());
                            }
                            user.getActiveDates().add(dateStr);
                        } catch (Exception ex) {
                            log.warn("Failed to parse submission timestamp: {}", ex.getMessage());
                        }
                    }

                    String normalizedMatch = "/problems/" + titleSlug;
                    for (DsaProblem problem : localProblems) {
                        if (problem.getLeetcodeLink() != null) {
                            String link = problem.getLeetcodeLink().toLowerCase().trim();
                            if (link.contains(normalizedMatch) && !problem.getUserSolvedList().contains(userId)) {
                                problem.getUserSolvedList().add(userId);
                                dsaProblemRepository.save(problem);
                                user.setXpPoints(user.getXpPoints() + 10);
                                newlySolvedCount++;
                            }
                        }
                    }
                }
            }

            user = userRepository.save(user);

            if (newlySolvedCount > 0) {
                Notification notif = new Notification();
                notif.setUserId(userId);
                notif.setType("CONGRATS");
                notif.setMessage("🔄 Synced " + newlySolvedCount + " solved questions from LeetCode! +" + (newlySolvedCount * 10) + " XP 🎉");
                notif.setCreatedAt(Instant.now());
                notificationRepository.save(notif);
                
                checkDsaMilestone(userId);
            }
        } catch (Exception e) {
            log.error("Failed to sync LeetCode profile: {}", e.getMessage());
        }

        return user;
    }

    /**
     * Mark a problem as solved by the user.
     * Awards 30 XP if it's the POTD, else 10 XP. Checks milestones.
     */
    public DsaProblem markSolved(String problemId, String userId) {
        DsaProblem problem = dsaProblemRepository.findById(problemId)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found"));
        if (!problem.getUserSolvedList().contains(userId)) {
            problem.getUserSolvedList().add(userId);
            dsaProblemRepository.save(problem);

            DsaProblem potd = getProblemOfTheDay();
            int xpAwarded = (potd != null && potd.getId().equals(problemId)) ? 30 : 10;
            awardXp(userId, xpAwarded);
            checkDsaMilestone(userId);

            if (xpAwarded == 30) {
                Notification notif = new Notification();
                notif.setUserId(userId);
                notif.setType("CONGRATS");
                notif.setMessage("🔥 You solved the Problem of the Day! +30 XP! 🎉");
                notif.setCreatedAt(Instant.now());
                notificationRepository.save(notif);
            }
        }
        return problem;
    }

    public DsaProblem markUnsolved(String problemId, String userId) {
        DsaProblem problem = dsaProblemRepository.findById(problemId)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found"));
        problem.getUserSolvedList().remove(userId);
        return dsaProblemRepository.save(problem);
    }

    public long getSolvedCount(String userId) {
        return dsaProblemRepository.countByUserSolvedListContaining(userId);
    }

    /** Checks for milestone achievements (50, 100, 200 problems). */
    private void checkDsaMilestone(String userId) {
        long count = getSolvedCount(userId);
        if (count == 50 || count == 100 || count == 200 || count == 500) {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return;
            String achievement = count + " DSA Problems Solved! 🎉";
            emailService.sendCongratulations(user.getEmail(), user.getName(), achievement);

            Notification notif = new Notification();
            notif.setUserId(userId);
            notif.setType("CONGRATS");
            notif.setMessage("🏆 Milestone reached: " + achievement);
            notif.setCreatedAt(Instant.now());
            notificationRepository.save(notif);

            user.getBadges().add(count + "_PROBLEMS");
            user.setXpPoints(user.getXpPoints() + 100);
            userRepository.save(user);
        }
    }

    private void awardXp(String userId, int xp) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setXpPoints(user.getXpPoints() + xp);
            userRepository.save(user);
        });
    }
}
