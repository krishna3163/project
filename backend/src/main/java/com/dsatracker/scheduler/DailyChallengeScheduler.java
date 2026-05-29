package com.dsatracker.scheduler;

import com.dsatracker.model.DailyChallenge;
import com.dsatracker.model.DsaProblem;
import com.dsatracker.model.User;
import com.dsatracker.repository.DailyChallengeRepository;
import com.dsatracker.repository.DsaProblemRepository;
import com.dsatracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DailyChallengeScheduler {

    private final UserRepository userRepository;
    private final DsaProblemRepository dsaProblemRepository;
    private final DailyChallengeRepository dailyChallengeRepository;

    @Scheduled(cron = "0 0 0 * * *", zone = "UTC") // Every midnight UTC
    public void assignDailyChallenge() {
        log.info("Starting Daily Challenge Assignment");
        
        List<DsaProblem> allProblems = dsaProblemRepository.findAll();
        if (allProblems.isEmpty()) {
            log.error("No DSA problems found to assign for daily challenge.");
            return;
        }
        LocalDate today = LocalDate.now();

        // Get users active in the last 7 days
        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        List<User> activeUsers = userRepository.findByLastActiveDateAfter(sevenDaysAgo);

        for (User user : activeUsers) {
            try {
                // Assign new challenge
                Optional<DailyChallenge> existing = dailyChallengeRepository.findByUserIdAndDate(user.getId(), today);
                if (existing.isEmpty()) {
                    DsaProblem problem = getWeakAreaProblemForUser(user, allProblems);
                    if (problem == null) continue;
                    
                    DailyChallenge challenge = new DailyChallenge();
                    challenge.setUserId(user.getId());
                    challenge.setDsaProblemId(problem.getId());
                    challenge.setDate(today);
                    challenge.setCompleted(false);
                    dailyChallengeRepository.save(challenge);
                    
                    // Reset streak if they missed yesterday's challenge
                    LocalDate yesterday = today.minusDays(1);
                    Optional<DailyChallenge> yesterdayChallenge = dailyChallengeRepository.findByUserIdAndDate(user.getId(), yesterday);
                    if (yesterdayChallenge.isPresent() && !yesterdayChallenge.get().isCompleted() && user.getDailyStreak() > 0) {
                        user.setDailyStreak(0);
                        userRepository.save(user);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to assign daily challenge to user {}", user.getId(), e);
            }
        }
        log.info("Daily Challenge assigned to {} users.", activeUsers.size());
    }

    private DsaProblem getWeakAreaProblemForUser(User user, List<DsaProblem> allProblems) {
        if (allProblems.isEmpty()) return null;
        
        // Group solved vs total by tag
        java.util.Map<String, Integer> totalByTag = new java.util.HashMap<>();
        java.util.Map<String, Integer> solvedByTag = new java.util.HashMap<>();
        
        for (DsaProblem p : allProblems) {
            boolean solved = p.getUserSolvedList().contains(user.getId());
            for (String tag : p.getTags()) {
                totalByTag.put(tag, totalByTag.getOrDefault(tag, 0) + 1);
                if (solved) {
                    solvedByTag.put(tag, solvedByTag.getOrDefault(tag, 0) + 1);
                }
            }
        }
        
        // Find tag with minimum solved problems
        String weakTag = null;
        double minRatio = Double.MAX_VALUE;
        
        for (String tag : totalByTag.keySet()) {
            int total = totalByTag.get(tag);
            int solved = solvedByTag.getOrDefault(tag, 0);
            double ratio = (double) solved / total;
            if (ratio < minRatio) {
                minRatio = ratio;
                weakTag = tag;
            }
        }
        
        // Find an unsolved problem in this weak tag
        if (weakTag != null) {
            final String targetTag = weakTag;
            List<DsaProblem> weakProblems = allProblems.stream()
                .filter(p -> p.getTags().contains(targetTag) && !p.getUserSolvedList().contains(user.getId()))
                .collect(java.util.stream.Collectors.toList());
                
            if (!weakProblems.isEmpty()) {
                return weakProblems.get(new java.util.Random().nextInt(weakProblems.size()));
            }
        }
        
        // Fallback to any unsolved problem
        List<DsaProblem> unsolved = allProblems.stream()
            .filter(p -> !p.getUserSolvedList().contains(user.getId()))
            .collect(java.util.stream.Collectors.toList());
            
        if (!unsolved.isEmpty()) {
            return unsolved.get(new java.util.Random().nextInt(unsolved.size()));
        }
        
        // Fallback to any problem
        return allProblems.get(new java.util.Random().nextInt(allProblems.size()));
    }
}
