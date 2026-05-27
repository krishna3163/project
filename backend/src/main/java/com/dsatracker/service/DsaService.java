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
     * Mark a problem as solved by the user.
     * Awards XP and checks milestones.
     */
    public DsaProblem markSolved(String problemId, String userId) {
        DsaProblem problem = dsaProblemRepository.findById(problemId)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found"));
        if (!problem.getUserSolvedList().contains(userId)) {
            problem.getUserSolvedList().add(userId);
            dsaProblemRepository.save(problem);
            awardXp(userId, 10);
            checkDsaMilestone(userId);
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
            // Send congratulations email
            emailService.sendCongratulations(user.getEmail(), user.getName(), achievement);
            // Create in-app notification
            Notification notif = new Notification();
            notif.setUserId(userId);
            notif.setType("CONGRATS");
            notif.setMessage("🏆 Milestone reached: " + achievement);
            notif.setCreatedAt(Instant.now());
            notificationRepository.save(notif);
            // Award badge
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
