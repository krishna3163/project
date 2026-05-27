package com.dsatracker.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

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

    private int rank;

    private long totalUsers;

    private Instant submittedAt = Instant.now();

    /** Badge: GOLD / SILVER / BRONZE / PARTICIPANT */
    private String badge;
}
