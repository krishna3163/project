package com.dsatracker.repository;

import com.dsatracker.model.Progress;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ProgressRepository extends MongoRepository<Progress, String> {
    List<Progress> findByUserIdOrderByDateAsc(String userId);
    Optional<Progress> findByUserIdAndDate(String userId, LocalDate date);
    List<Progress> findByUserIdAndDateBetween(String userId, LocalDate from, LocalDate to);
}
