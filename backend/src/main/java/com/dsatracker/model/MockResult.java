package com.dsatracker.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Stores a user's result for a mock test.
 * Idempotency: unique compound index on (userId, testId) prevents double submission.
 */
@Data
@NoArgsConstructor
@Document(collection = "mock_results")
@CompoundIndex(name = "userId_testId_unique", def = "{'userId': 1, 'testId': 1}", unique = true)
public class MockResult {

    @Id
    private String id;

    private String userId;

    private String testId;

    private int score;
    
    private int totalMarks;
    
    private double percentage;

    private int rank;

    private long totalUsers; // also behaves as totalParticipants
    
    private double percentile;
    
    private int timeTaken; // minutes or seconds
    
    private double accuracy;

    private Instant submittedAt = Instant.now();

    /** Badge: GOLD / SILVER / BRONZE / PARTICIPANT */
    private String badge;
    
    private String shareId;
    
    private List<AnswerDetail> answers = new ArrayList<>();
    
    private Map<String, TopicScore> topicBreakdown = new HashMap<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerDetail {
        private String questionId;
        private String userAnswer;
        private boolean isCorrect;
        private int timeSpent; // in seconds
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopicScore {
        private int correct;
        private int total;
        private double score; // score percentage
    }
}
