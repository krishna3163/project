package com.dsatracker.controller;

import com.dsatracker.model.DailyChallenge;
import com.dsatracker.model.DsaProblem;
import com.dsatracker.model.User;
import com.dsatracker.repository.DailyChallengeRepository;
import com.dsatracker.repository.DsaProblemRepository;
import com.dsatracker.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Optional;

@RestController
@RequestMapping("/api/daily-challenge")
@RequiredArgsConstructor
public class DailyChallengeController {

    private final DailyChallengeRepository dailyChallengeRepository;
    private final DsaProblemRepository dsaProblemRepository;
    private final UserRepository userRepository;

    @GetMapping("/today")
    public ResponseEntity<?> getTodayChallenge(@AuthenticationPrincipal User user) {
        String userId = user.getId();
        LocalDate today = LocalDate.now();
        
        Optional<DailyChallenge> challengeOpt = dailyChallengeRepository.findByUserIdAndDate(userId, today);
        if (challengeOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DailyChallenge challenge = challengeOpt.get();
        Optional<DsaProblem> problemOpt = dsaProblemRepository.findById(challenge.getDsaProblemId());
        
        if (problemOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ChallengeResponse response = new ChallengeResponse();
        response.setId(challenge.getId());
        response.setDate(challenge.getDate());
        response.setCompleted(challenge.isCompleted());
        response.setProblem(problemOpt.get());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeChallenge(@AuthenticationPrincipal User user, @PathVariable String id) {
        String userId = user.getId();
        
        Optional<DailyChallenge> challengeOpt = dailyChallengeRepository.findById(id);
        if (challengeOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DailyChallenge challenge = challengeOpt.get();
        if (!challenge.getUserId().equals(userId)) {
            return ResponseEntity.status(403).body("Unauthorized");
        }

        if (challenge.isCompleted()) {
            return ResponseEntity.badRequest().body("Already completed");
        }

        challenge.setCompleted(true);
        dailyChallengeRepository.save(challenge);

        // Update user stats
        userRepository.findById(userId).ifPresent(u -> {
            u.setXpPoints(u.getXpPoints() + 100);
            
            // Streak updates
            int currentStreak = u.getDailyStreak() + 1;
            u.setDailyStreak(currentStreak);
            if (currentStreak > u.getMaxStreak()) {
                u.setMaxStreak(currentStreak);
            }
            
            // Badge: 7 Day Warrior
            if (currentStreak >= 7) {
                u.getBadges().add("7 Day Warrior");
            }
            
            // Badge: Month Master
            long completedCount = dailyChallengeRepository.countByUserIdAndCompletedTrue(userId);
            if (completedCount >= 30) {
                u.getBadges().add("Month Master");
            }
            
            // Badge: Night Owl (between 11 PM and 4 AM)
            int hour = java.time.LocalTime.now().getHour();
            if (hour >= 23 || hour < 4) {
                u.getBadges().add("Night Owl");
            }
            
            userRepository.save(u);
        });

        return ResponseEntity.ok("Challenge completed");
    }

    @Data
    public static class ChallengeResponse {
        private String id;
        private LocalDate date;
        private boolean completed;
        private DsaProblem problem;
    }
}
