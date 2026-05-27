package com.dsatracker.repository;

import com.dsatracker.model.MockResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface MockResultRepository extends MongoRepository<MockResult, String> {
    Optional<MockResult> findByUserIdAndTestId(String userId, String testId);
    Page<MockResult> findByTestIdOrderByScoreDesc(String testId, Pageable pageable);
    List<MockResult> findByUserId(String userId);
    List<MockResult> findByTestId(String testId);
    long countByTestIdAndScoreGreaterThan(String testId, int score);
    long countByTestId(String testId);
}
