package com.dsatracker.service;

import com.dsatracker.model.MockResult;
import com.dsatracker.model.MockTest;
import com.dsatracker.model.Notification;
import com.dsatracker.model.User;
import com.dsatracker.repository.MockResultRepository;
import com.dsatracker.repository.MockTestRepository;
import com.dsatracker.repository.NotificationRepository;
import com.dsatracker.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class MockTestService {

    private final MockTestRepository testRepo;
    private final MockResultRepository resultRepo;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final RankCalculationService rankService;
    private final PdfGeneratorService pdfGeneratorService;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final SimpMessagingTemplate messagingTemplate;

    // Fallback store if Redis is down
    private final ConcurrentHashMap<String, TestSession> inMemorySessions = new ConcurrentHashMap<>();

    private String getSessionKey(String userId, String testId) {
        return "session:" + userId + ":" + testId;
    }

    public MockTest create(MockTest test, String userId) {
        test.setCreatedBy(userId);
        test.setCreatedAt(Instant.now());
        if (test.getQuestions() != null) {
            int idx = 1;
            for (MockTest.Question q : test.getQuestions()) {
                if (q.getId() == null) {
                    q.setId("q_" + idx++);
                }
            }
        }
        return testRepo.save(test);
    }

    public Page<MockTest> getAll(Pageable pageable) {
        return testRepo.findAll(pageable);
    }

    public MockTest getById(String id) {
        return testRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Test not found"));
    }

    public void deleteTest(String testId, String userId) {
        MockTest test = getById(testId);
        if (!test.getCreatedBy().equals(userId)) {
            throw new SecurityException("You can only delete contests you created!");
        }
        // Delete associated results
        List<MockResult> results = resultRepo.findByTestId(testId);
        resultRepo.deleteAll(results);
        // Clean up Redis sessions for this test
        try {
            Set<String> keys = redisTemplate.keys("session:*:" + testId);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception e) {
            log.warn("Redis cleanup failed for test {}: {}", testId, e.getMessage());
        }
        testRepo.deleteById(testId);
    }

    public List<MockTest> getTestsByUser(String userId) {
        return testRepo.findByCreatedBy(userId);
    }

    /**
     * Start a new test taking session
     */
    public TestSession startTest(String userId, String testId) {
        MockTest test = getById(testId);
        
        // Enforce single attempt for competition mode
        if ("competition".equalsIgnoreCase(test.getType())) {
            Optional<MockResult> existing = resultRepo.findByUserIdAndTestId(userId, testId);
            if (existing.isPresent()) {
                throw new IllegalStateException("You have already completed this competition test!");
            }
        }

        TestSession session = new TestSession();
        session.setUserId(userId);
        session.setTestId(testId);
        session.setStartTime(Instant.now());
        session.setAnswers(new HashMap<>());

        String sessionKey = getSessionKey(userId, testId);
        try {
            String json = objectMapper.writeValueAsString(session);
            redisTemplate.opsForValue().set(sessionKey, json, test.getDuration() + 10, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("Redis write failed, storing session in-memory: {}", e.getMessage());
            inMemorySessions.put(sessionKey, session);
        }

        return session;
    }

    /**
     * Save an answer in real-time
     */
    public void submitAnswer(String userId, String testId, String questionId, String answer, int timeSpent) {
        String sessionKey = getSessionKey(userId, testId);
        TestSession session = null;

        try {
            String json = redisTemplate.opsForValue().get(sessionKey);
            if (json != null) {
                session = objectMapper.readValue(json, TestSession.class);
            }
        } catch (Exception e) {
            log.warn("Redis read failed for session: {}", e.getMessage());
        }

        if (session == null) {
            session = inMemorySessions.get(sessionKey);
        }

        if (session == null) {
            throw new IllegalArgumentException("Active test session not found or expired!");
        }

        UserAnswer userAnswer = new UserAnswer(questionId, answer, timeSpent, Instant.now());
        session.getAnswers().put(questionId, userAnswer);

        try {
            String json = objectMapper.writeValueAsString(session);
            MockTest test = getById(testId);
            redisTemplate.opsForValue().set(sessionKey, json, test.getDuration() + 10, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("Redis update failed, updating in-memory session: {}", e.getMessage());
            inMemorySessions.put(sessionKey, session);
        }

        // Live leaderboard broadcast if competition mode
        MockTest test = getById(testId);
        if ("competition".equalsIgnoreCase(test.getType())) {
            broadcastLiveLeaderboardUpdate(testId, userId, session);
        }
    }

    /**
     * Final submission of the test
     */
    public MockResult submit(String testId, String userId, Map<String, Integer> mcqAnswers) {
        // Adapt old integer choice index map to full submission
        Map<String, String> answers = new HashMap<>();
        if (mcqAnswers != null) {
            for (Map.Entry<String, Integer> entry : mcqAnswers.entrySet()) {
                answers.put(entry.getKey(), String.valueOf(entry.getValue()));
            }
        }
        return submitFull(testId, userId, answers, -1);
    }

    public MockResult submitFull(String testId, String userId, Map<String, String> answers, int totalTimeTaken) {
        Optional<MockResult> existing = resultRepo.findByUserIdAndTestId(userId, testId);
        if (existing.isPresent()) {
            return existing.get();
        }

        MockTest test = getById(testId);
        String sessionKey = getSessionKey(userId, testId);
        
        // Try fetching from session store
        TestSession session = null;
        try {
            String json = redisTemplate.opsForValue().get(sessionKey);
            if (json != null) {
                session = objectMapper.readValue(json, TestSession.class);
            }
        } catch (Exception e) {
            log.warn("Redis session fetch failed: {}", e.getMessage());
        }

        if (session == null) {
            session = inMemorySessions.remove(sessionKey);
        } else {
            try {
                redisTemplate.delete(sessionKey);
            } catch (Exception e) {
                log.warn("Failed to delete active session from Redis: {}", e.getMessage());
            }
        }

        // Fallback values if session was lost/expired
        int timeTaken = totalTimeTaken;
        Map<String, String> finalAnswers = answers;
        if (session != null) {
            if (timeTaken <= 0) {
                timeTaken = (int) ChronoUnit.SECONDS.between(session.getStartTime(), Instant.now());
            }
            // Hydrate answers from session if none provided
            if (finalAnswers == null || finalAnswers.isEmpty()) {
                finalAnswers = new HashMap<>();
                for (Map.Entry<String, UserAnswer> entry : session.getAnswers().entrySet()) {
                    finalAnswers.put(entry.getKey(), entry.getValue().getAnswer());
                }
            }
        }
        if (timeTaken <= 0) {
            timeTaken = test.getDuration() * 60 / 2; // fallback to half duration
        }

        // Core Evaluations
        int score = 0;
        int correctCount = 0;
        int totalQuestions = test.getQuestions().size();
        List<MockResult.AnswerDetail> answerDetails = new ArrayList<>();
        Map<String, MockResult.TopicScore> topicBreakdown = new HashMap<>();

        for (MockTest.Question q : test.getQuestions()) {
            String userAnswer = finalAnswers != null ? finalAnswers.get(q.getId()) : null;
            boolean isCorrect = evaluateQuestion(q, userAnswer);

            int timeSpent = 0;
            if (session != null && session.getAnswers().containsKey(q.getId())) {
                timeSpent = session.getAnswers().get(q.getId()).getTimeSpent();
            }

            if (isCorrect) {
                score += q.getMarks();
                correctCount++;
            }

            answerDetails.add(new MockResult.AnswerDetail(q.getId(), userAnswer, isCorrect, timeSpent));

            // Hydrate Topic Breakdown
            String topic = q.getTopic() != null ? q.getTopic() : "General";
            MockResult.TopicScore topicScore = topicBreakdown.computeIfAbsent(topic, 
                    k -> new MockResult.TopicScore(0, 0, 0.0));
            
            topicScore.setTotal(topicScore.getTotal() + q.getMarks());
            if (isCorrect) {
                topicScore.setCorrect(topicScore.getCorrect() + q.getMarks());
            }
        }

        // Calculate Topic Score Percentages
        for (MockResult.TopicScore ts : topicBreakdown.values()) {
            if (ts.getTotal() > 0) {
                ts.setScore(((double) ts.getCorrect() / ts.getTotal()) * 100.0);
            }
        }

        double percentage = test.getTotalMarks() > 0 ? ((double) score / test.getTotalMarks()) * 100.0 : 0.0;
        double accuracy = totalQuestions > 0 ? (double) correctCount / totalQuestions : 0.0;

        MockResult result = new MockResult();
        result.setUserId(userId);
        result.setTestId(testId);
        result.setScore(score);
        result.setTotalMarks(test.getTotalMarks());
        result.setPercentage(percentage);
        result.setTimeTaken(timeTaken);
        result.setAccuracy(accuracy);
        result.setAnswers(answerDetails);
        result.setTopicBreakdown(topicBreakdown);
        result.setShareId(UUID.randomUUID().toString().substring(0, 8));

        try {
            result = resultRepo.save(result);
        } catch (DuplicateKeyException e) {
            return resultRepo.findByUserIdAndTestId(userId, testId).orElseThrow();
        }

        // Redis rankings & percentile calculations
        int rank = rankService.calculateRank(testId, userId, score, timeTaken);
        long totalParticipants = resultRepo.countByTestId(testId);
        if (totalParticipants < 1) totalParticipants = 1;
        
        double percentile = rankService.calculatePercentile(rank, totalParticipants);
        String badge = computeBadge(rank, totalParticipants);

        result.setRank(rank);
        result.setTotalUsers(totalParticipants);
        result.setPercentile(percentile);
        result.setBadge(badge);
        result = resultRepo.save(result);

        // Increment test participant counter
        test.setParticipants((int) totalParticipants);
        testRepo.save(test);

        // Award XP to User
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            int xpBonus = switch (badge) {
                case "GOLD" -> 100;
                case "SILVER" -> 75;
                case "BRONZE" -> 50;
                default -> 20;
            };
            user.setXpPoints(user.getXpPoints() + xpBonus);
            userRepository.save(user);

            // Dispatch Email Report with PDF
            try {
                byte[] pdfReport = pdfGeneratorService.generateTestReport(result, test, user.getName());
                String filename = "PrepNest_Report_" + test.getTitle().replaceAll(" ", "_") + ".pdf";
                emailService.sendMockTestResultWithPdf(user.getEmail(), user.getName(), score, rank, 
                        totalParticipants, badge, test.getTitle(), pdfReport, filename);
            } catch (Exception ex) {
                log.error("Failed to generate/dispatch PDF report: {}", ex.getMessage());
                // Fallback to text email
                emailService.sendMockTestResult(user.getEmail(), user.getName(), score, rank, 
                        totalParticipants, badge, test.getTitle());
            }

            // Push notifications
            if (rank <= 3) {
                Notification notif = new Notification();
                notif.setUserId(userId);
                notif.setType("RANK_UPDATE");
                notif.setMessage("🏆 Amazing! You placed #" + rank + " in the competition " + test.getTitle() + "!");
                notif.setCreatedAt(Instant.now());
                notificationRepository.save(notif);
                emailService.sendCongratulations(user.getEmail(), user.getName(),
                        "Global #" + rank + " in " + test.getTitle());
            }
        }

        // Live WebSocket broadcast of leaderboard update
        if ("competition".equalsIgnoreCase(test.getType())) {
            broadcastLiveLeaderboard(testId);
        }

        return result;
    }

    public Page<MockResult> getLeaderboard(String testId, Pageable pageable) {
        return resultRepo.findByTestIdOrderByScoreDesc(testId, pageable);
    }

    public List<MockResult> getUserResults(String userId) {
        return resultRepo.findByUserId(userId);
    }

    /**
     * Compute candidate analytics
     */
    public MockAnalytics getUserAnalytics(String userId) {
        List<MockResult> results = resultRepo.findByUserId(userId);
        
        int totalTests = results.size();
        if (totalTests == 0) {
            return new MockAnalytics(0, 0.0, 0, 0, new ArrayList<>(), new ArrayList<>());
        }

        double sumPercentage = 0;
        int bestRank = Integer.MAX_VALUE;
        List<MockAnalytics.ScoreHistoryEntry> scoreHistory = new ArrayList<>();
        Map<String, MockResult.TopicScore> accumulatedTopics = new HashMap<>();

        // Sort by submittedAt to track chronologically
        results.sort(Comparator.comparing(MockResult::getSubmittedAt));

        int streak = calculateStreak(results);

        for (MockResult r : results) {
            sumPercentage += r.getPercentage();
            if (r.getRank() < bestRank) {
                bestRank = r.getRank();
            }

            MockTest test = testRepo.findById(r.getTestId()).orElse(null);
            String label = test != null ? test.getTitle() : "Mock Test";
            scoreHistory.add(new MockAnalytics.ScoreHistoryEntry(label, r.getPercentage(), r.getScore()));

            // Aggregate topic breakdown
            if (r.getTopicBreakdown() != null) {
                for (Map.Entry<String, MockResult.TopicScore> entry : r.getTopicBreakdown().entrySet()) {
                    MockResult.TopicScore accum = accumulatedTopics.computeIfAbsent(entry.getKey(), 
                            k -> new MockResult.TopicScore(0, 0, 0.0));
                    accum.setCorrect(accum.getCorrect() + entry.getValue().getCorrect());
                    accum.setTotal(accum.getTotal() + entry.getValue().getTotal());
                }
            }
        }

        double avgScore = sumPercentage / totalTests;
        List<MockAnalytics.RecommendationEntry> weakTopics = new ArrayList<>();

        for (Map.Entry<String, MockResult.TopicScore> entry : accumulatedTopics.entrySet()) {
            double accuracy = entry.getValue().getTotal() > 0 ? 
                    ((double) entry.getValue().getCorrect() / entry.getValue().getTotal()) * 100.0 : 0.0;
            
            if (accuracy < 60.0) {
                weakTopics.add(new MockAnalytics.RecommendationEntry(entry.getKey(), accuracy, 
                        "Review " + entry.getKey() + " concepts and practice medium-difficulty questions."));
            }
        }

        return new MockAnalytics(totalTests, Math.round(avgScore * 100.0) / 100.0, 
                bestRank == Integer.MAX_VALUE ? 0 : bestRank, streak, scoreHistory, weakTopics);
    }

    private int calculateStreak(List<MockResult> chronologicalResults) {
        if (chronologicalResults.isEmpty()) return 0;
        
        java.util.Set<java.time.LocalDate> submissionDates = new java.util.HashSet<>();
        for (MockResult r : chronologicalResults) {
            submissionDates.add(java.time.LocalDate.ofInstant(r.getSubmittedAt(), java.time.ZoneId.systemDefault()));
        }

        java.time.LocalDate today = java.time.LocalDate.now();
        int streak = 0;
        
        if (submissionDates.contains(today)) {
            streak = 1;
            java.time.LocalDate checkDate = today.minusDays(1);
            while (submissionDates.contains(checkDate)) {
                streak++;
                checkDate = checkDate.minusDays(1);
            }
        } else if (submissionDates.contains(today.minusDays(1))) {
            streak = 1;
            java.time.LocalDate checkDate = today.minusDays(2);
            while (submissionDates.contains(checkDate)) {
                streak++;
                checkDate = checkDate.minusDays(1);
            }
        }
        
        return streak;
    }

    public MockResult getResultByShareId(String shareId) {
        return resultRepo.findByShareId(shareId)
                .orElseThrow(() -> new IllegalArgumentException("Result share card not found"));
    }

    private boolean evaluateQuestion(MockTest.Question q, String answer) {
        if (answer == null) return false;
        String trimmed = answer.trim();
        if (trimmed.isEmpty()) return false;

        if ("mcq".equalsIgnoreCase(q.getType()) || q.getType() == null) {
            try {
                // MCQ option index evaluation
                double choice = Double.parseDouble(trimmed);
                return (int) choice == q.getCorrectOption();
            } catch (NumberFormatException e) {
                return trimmed.equalsIgnoreCase(q.getCorrectAnswer());
            }
        } else if ("coding".equalsIgnoreCase(q.getType())) {
            // Evaluates code boilerplate expansion
            return trimmed.length() > (q.getBoilerplate() != null ? q.getBoilerplate().length() : 0) + 10;
        }
        return true;
    }

    private String computeBadge(long rank, long total) {
        if (total == 0) return "PARTICIPANT";
        double pct = (double) rank / total;
        if (pct <= 0.10) return "GOLD";
        if (pct <= 0.30) return "SILVER";
        if (pct <= 0.60) return "BRONZE";
        return "PARTICIPANT";
    }

    private void broadcastLiveLeaderboardUpdate(String testId, String userId, TestSession session) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            String name = user != null ? user.getName() : "Candidate";
            
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "ANSWER_SUBMIT");
            payload.put("testId", testId);
            payload.put("userId", userId);
            payload.put("userName", name);
            payload.put("answersCount", session.getAnswers().size());
            payload.put("timestamp", Instant.now().toString());

            messagingTemplate.convertAndSend("/topic/leaderboard/" + testId, payload);
        } catch (Exception e) {
            log.error("Failed to broadcast WebSocket live update: {}", e.getMessage());
        }
    }

    private void broadcastLiveLeaderboard(String testId) {
        try {
            List<RankCalculationService.LeaderboardEntry> leaderboard = rankService.getLeaderboard(testId, 10);
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "FINAL_SUBMIT");
            payload.put("testId", testId);
            payload.put("leaderboard", leaderboard);
            payload.put("timestamp", Instant.now().toString());

            messagingTemplate.convertAndSend("/topic/leaderboard/" + testId, payload);
        } catch (Exception e) {
            log.error("Failed to broadcast WebSocket leaderboard updates: {}", e.getMessage());
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestSession {
        private String userId;
        private String testId;
        private Instant startTime;
        private Map<String, UserAnswer> answers = new HashMap<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserAnswer {
        private String questionId;
        private String answer;
        private int timeSpent; // in seconds
        private Instant timestamp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MockAnalytics {
        private int totalTests;
        private double avgScore;
        private int bestRank;
        private int streak;
        private List<ScoreHistoryEntry> scoreHistory = new ArrayList<>();
        private List<RecommendationEntry> weakTopics = new ArrayList<>();

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class ScoreHistoryEntry {
            private String label;
            private double percentage;
            private int score;
        }

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class RecommendationEntry {
            private String topic;
            private double accuracy;
            private String advice;
        }
    }
}
