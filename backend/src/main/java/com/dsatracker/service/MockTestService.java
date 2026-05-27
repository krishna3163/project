package com.dsatracker.service;

import com.dsatracker.model.MockResult;
import com.dsatracker.model.MockTest;
import com.dsatracker.model.Notification;
import com.dsatracker.model.User;
import com.dsatracker.repository.MockResultRepository;
import com.dsatracker.repository.MockTestRepository;
import com.dsatracker.repository.NotificationRepository;
import com.dsatracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MockTestService {

    private final MockTestRepository testRepo;
    private final MockResultRepository resultRepo;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    public MockTest create(MockTest test, String userId) {
        test.setCreatedBy(userId);
        return testRepo.save(test);
    }

    public Page<MockTest> getAll(Pageable pageable) {
        return testRepo.findAll(pageable);
    }

    public MockTest getById(String id) {
        return testRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Test not found"));
    }

    /**
     * Submit answers and calculate score + rank.
     * Idempotent: duplicate submission (same userId+testId) returns existing result.
     */
    public MockResult submit(String testId, String userId, Map<String, Integer> answers) {
        // Idempotency: return existing result if already submitted
        return resultRepo.findByUserIdAndTestId(userId, testId).orElseGet(() -> {
            MockTest test = getById(testId);
            int score = calculateScore(test, answers);
            MockResult result = new MockResult();
            result.setUserId(userId);
            result.setTestId(testId);
            result.setScore(score);

            try {
                result = resultRepo.save(result); // save first to count in rank
            } catch (DuplicateKeyException e) {
                // Race condition: another request submitted simultaneously
                return resultRepo.findByUserIdAndTestId(userId, testId).orElseThrow();
            }

            // Calculate rank: count users with strictly higher score + 1
            long better = resultRepo.countByTestIdAndScoreGreaterThan(testId, score);
            long total = resultRepo.countByTestId(testId);
            int rank = (int) better + 1;
            String badge = computeBadge(rank, total);

            result.setRank(rank);
            result.setTotalUsers(total);
            result.setBadge(badge);
            result = resultRepo.save(result);

            // Send result email
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                emailService.sendMockTestResult(user.getEmail(), user.getName(),
                        score, rank, total, badge, test.getTitle());
                // Notify if top 3
                if (rank <= 3) {
                    Notification notif = new Notification();
                    notif.setUserId(userId);
                    notif.setType("RANK_UPDATE");
                    notif.setMessage("🏆 You ranked #" + rank + " in " + test.getTitle() + "!");
                    notif.setCreatedAt(Instant.now());
                    notificationRepository.save(notif);
                    emailService.sendCongratulations(user.getEmail(), user.getName(),
                            "Rank #" + rank + " in " + test.getTitle());
                }
            }
            return result;
        });
    }

    /** Top 100 leaderboard for a test */
    public Page<MockResult> getLeaderboard(String testId, Pageable pageable) {
        return resultRepo.findByTestIdOrderByScoreDesc(testId, pageable);
    }

    public List<MockResult> getUserResults(String userId) {
        return resultRepo.findByUserId(userId);
    }

    private int calculateScore(MockTest test, Map<String, Integer> answers) {
        int score = 0;
        for (MockTest.Question q : test.getQuestions()) {
            Integer chosen = answers.get(q.getId());
            if (chosen != null && chosen == q.getCorrectOption()) {
                score += q.getMarks();
            }
        }
        return score;
    }

    private String computeBadge(long rank, long total) {
        if (total == 0) return "PARTICIPANT";
        double pct = (double) rank / total;
        if (pct <= 0.10) return "GOLD";
        if (pct <= 0.30) return "SILVER";
        if (pct <= 0.60) return "BRONZE";
        return "PARTICIPANT";
    }
}
