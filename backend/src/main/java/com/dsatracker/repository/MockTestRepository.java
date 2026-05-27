package com.dsatracker.repository;

import com.dsatracker.model.MockTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface MockTestRepository extends MongoRepository<MockTest, String> {
    Page<MockTest> findByCreatedBy(String userId, Pageable pageable);
}
