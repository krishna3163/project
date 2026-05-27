package com.dsatracker.repository;

import com.dsatracker.model.Contest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface ContestRepository extends MongoRepository<Contest, String> {
    Page<Contest> findByStartTimeAfterOrderByStartTimeAsc(Instant now, Pageable pageable);
    List<Contest> findByStartTimeBetweenAndNotifiedFalse(Instant from, Instant to);
    boolean existsByPlatformAndName(String platform, String name);
}
