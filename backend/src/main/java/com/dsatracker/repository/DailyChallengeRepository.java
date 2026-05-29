package com.dsatracker.repository;

import com.dsatracker.model.DailyChallenge;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyChallengeRepository extends MongoRepository<DailyChallenge, String> {
    Optional<DailyChallenge> findByUserIdAndDate(String userId, LocalDate date);
    long countByUserIdAndCompletedTrue(String userId);
    List<DailyChallenge> findByCompletedTrueAndDateGreaterThanEqual(LocalDate date);
}
