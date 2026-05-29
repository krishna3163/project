package com.dsatracker.repository;

import com.dsatracker.model.Resume;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ResumeRepository extends MongoRepository<Resume, String> {
    Page<Resume> findByUserId(String userId, Pageable pageable);
    Optional<Resume> findTopByUserIdOrderByUploadedAtDesc(String userId);
    java.util.List<Resume> findByUserIdOrderByUploadedAtDesc(String userId);
    java.util.List<Resume> findByRequestFeedbackTrueOrderByUploadedAtDesc();
}
