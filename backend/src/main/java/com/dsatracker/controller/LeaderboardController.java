package com.dsatracker.controller;

import com.dsatracker.model.User;
import com.dsatracker.model.DailyChallenge;
import com.dsatracker.repository.UserRepository;
import com.dsatracker.repository.DailyChallengeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final UserRepository userRepository;
    private final DailyChallengeRepository dailyChallengeRepository;

    @GetMapping("/global")
    public ResponseEntity<Page<User>> getGlobalLeaderboard(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        // Return users sorted by xpPoints descending
        Page<User> topUsers = userRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "xpPoints"))
        );
        
        return ResponseEntity.ok(topUsers);
    }

    @GetMapping("/monthly")
    public ResponseEntity<?> getMonthlyLeaderboard() {
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        List<DailyChallenge> challenges = dailyChallengeRepository.findByCompletedTrueAndDateGreaterThanEqual(startOfMonth);
        
        // Count completions per user ID
        Map<String, Long> userCounts = challenges.stream()
                .collect(Collectors.groupingBy(DailyChallenge::getUserId, Collectors.counting()));
                
        // Fetch all active users and sort
        List<User> users = userRepository.findAll();
        List<MonthlyLeaderboardEntry> leaderboard = users.stream()
                .map(u -> new MonthlyLeaderboardEntry(
                        u.getId(),
                        u.getName(),
                        u.getEmail(),
                        u.getDailyStreak(),
                        userCounts.getOrDefault(u.getId(), 0L).intValue()
                ))
                .sorted(Comparator.comparingInt(MonthlyLeaderboardEntry::getCompletedCount).reversed())
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(leaderboard);
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class MonthlyLeaderboardEntry {
        private String userId;
        private String name;
        private String email;
        private int dailyStreak;
        private int completedCount;
    }
}
