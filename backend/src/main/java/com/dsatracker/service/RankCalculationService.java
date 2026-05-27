package com.dsatracker.service;

import com.dsatracker.model.User;
import com.dsatracker.model.MockResult;
import com.dsatracker.repository.UserRepository;
import com.dsatracker.repository.MockResultRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class RankCalculationService {

    private final StringRedisTemplate redisTemplate;
    private final UserRepository userRepository;
    private final MockResultRepository mockResultRepository;

    private static final int MAX_TIME = 86400; // 24 hours in seconds max limit

    private String getLeaderboardKey(String testId) {
        return "leaderboard:" + testId;
    }

    /**
     * Calculate rank in real-time using Redis Sorted Sets.
     * Fallback to MongoDB list sort on Redis error.
     */
    public int calculateRank(String testId, String userId, int score, int timeTaken) {
        try {
            String leaderboardKey = getLeaderboardKey(testId);
            long rankScore = ((long) score * 1000000L) + (long) Math.max(0, MAX_TIME - timeTaken);
            redisTemplate.opsForZSet().add(leaderboardKey, userId, rankScore);
            Long rank = redisTemplate.opsForZSet().reverseRank(leaderboardKey, userId);
            return rank != null ? rank.intValue() + 1 : 1;
        } catch (Exception e) {
            log.warn("Redis rank calculation failed, falling back to MongoDB database-driven rankings: {}", e.getMessage());
            try {
                List<MockResult> allResults = mockResultRepository.findByTestId(testId);
                boolean found = false;
                for (MockResult r : allResults) {
                    if (r.getUserId().equals(userId)) {
                        r.setScore(score);
                        r.setTimeTaken(timeTaken);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    MockResult temp = new MockResult();
                    temp.setUserId(userId);
                    temp.setScore(score);
                    temp.setTimeTaken(timeTaken);
                    allResults.add(temp);
                }

                // Sort by score DESC, then timeTaken ASC
                allResults.sort((a, b) -> {
                    if (b.getScore() != a.getScore()) {
                        return Integer.compare(b.getScore(), a.getScore());
                    }
                    return Integer.compare(a.getTimeTaken(), b.getTimeTaken());
                });

                for (int i = 0; i < allResults.size(); i++) {
                    if (allResults.get(i).getUserId().equals(userId)) {
                        return i + 1;
                    }
                }
            } catch (Exception ex) {
                log.error("MongoDB backup rank calculation failed: {}", ex.getMessage());
            }
            return 1;
        }
    }

    @Async
    public CompletableFuture<Integer> calculateRankAsync(String testId, String userId, int score, int timeTaken) {
        return CompletableFuture.completedFuture(calculateRank(testId, userId, score, timeTaken));
    }

    /**
     * Get leaderboard list with user details
     */
    public List<LeaderboardEntry> getLeaderboard(String testId, int size) {
        try {
            String leaderboardKey = getLeaderboardKey(testId);
            Set<ZSetOperations.TypedTuple<String>> topUsers =
                    redisTemplate.opsForZSet().reverseRangeWithScores(leaderboardKey, 0, size - 1);

            List<LeaderboardEntry> entries = new ArrayList<>();
            if (topUsers == null) return entries;

            int rank = 1;
            for (ZSetOperations.TypedTuple<String> tuple : topUsers) {
                String userId = tuple.getValue();
                Double doubleScore = tuple.getScore();
                if (userId == null || doubleScore == null) continue;

                long scoreValue = doubleScore.longValue();
                int actualScore = (int) (scoreValue / 1000000L);
                int timeTaken = MAX_TIME - (int) (scoreValue % 1000000L);

                User user = userRepository.findById(userId).orElse(null);
                String name = user != null ? user.getName() : "Unknown User";
                String email = user != null ? user.getEmail() : "";
                int xp = user != null ? user.getXpPoints() : 0;

                entries.add(new LeaderboardEntry(rank++, userId, name, email, actualScore, timeTaken, xp));
            }
            return entries;
        } catch (Exception e) {
            log.warn("Redis leaderboard failed, falling back to MongoDB database-driven rankings: {}", e.getMessage());
            List<LeaderboardEntry> entries = new ArrayList<>();
            try {
                List<MockResult> allResults = mockResultRepository.findByTestId(testId);
                allResults.sort((a, b) -> {
                    if (b.getScore() != a.getScore()) {
                        return Integer.compare(b.getScore(), a.getScore());
                    }
                    return Integer.compare(a.getTimeTaken(), b.getTimeTaken());
                });

                int limit = Math.min(size, allResults.size());
                for (int i = 0; i < limit; i++) {
                    MockResult r = allResults.get(i);
                    User user = userRepository.findById(r.getUserId()).orElse(null);
                    String name = user != null ? user.getName() : "Unknown User";
                    String email = user != null ? user.getEmail() : "";
                    int xp = user != null ? user.getXpPoints() : 0;

                    entries.add(new LeaderboardEntry(i + 1, r.getUserId(), name, email, r.getScore(), r.getTimeTaken(), xp));
                }
            } catch (Exception ex) {
                log.error("MongoDB backup leaderboard calculation failed: {}", ex.getMessage());
            }
            return entries;
        }
    }

    public int getUserRank(String testId, String userId) {
        try {
            String leaderboardKey = getLeaderboardKey(testId);
            Long rank = redisTemplate.opsForZSet().reverseRank(leaderboardKey, userId);
            return rank != null ? rank.intValue() + 1 : -1;
        } catch (Exception e) {
            log.warn("Redis getUserRank failed, falling back to MongoDB database-driven rankings: {}", e.getMessage());
            try {
                List<MockResult> allResults = mockResultRepository.findByTestId(testId);
                allResults.sort((a, b) -> {
                    if (b.getScore() != a.getScore()) {
                        return Integer.compare(b.getScore(), a.getScore());
                    }
                    return Integer.compare(a.getTimeTaken(), b.getTimeTaken());
                });

                for (int i = 0; i < allResults.size(); i++) {
                    if (allResults.get(i).getUserId().equals(userId)) {
                        return i + 1;
                    }
                }
            } catch (Exception ex) {
                log.error("MongoDB backup getUserRank calculation failed: {}", ex.getMessage());
            }
            return -1;
        }
    }

    public double calculatePercentile(int rank, long totalParticipants) {
        if (totalParticipants <= 1) return 100.0;
        double percentile = ((double) (totalParticipants - rank) / totalParticipants) * 100.0;
        return Math.max(0.0, Math.min(100.0, Math.round(percentile * 100.0) / 100.0));
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaderboardEntry {
        private int rank;
        private String userId;
        private String name;
        private String email;
        private int score;
        private int timeTaken;
        private int xpPoints;
    }
}
