package com.dsatracker.repository;

import com.dsatracker.model.DsaProblem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DsaProblemRepository extends MongoRepository<DsaProblem, String> {
    Page<DsaProblem> findByDifficulty(String difficulty, Pageable pageable);
    Page<DsaProblem> findByTagsContaining(String tag, Pageable pageable);
    Page<DsaProblem> findByTitleContainingIgnoreCase(String title, Pageable pageable);
    long countByUserSolvedListContaining(String userId);
    List<DsaProblem> findByUserSolvedListContaining(String userId);

    @org.springframework.data.mongodb.repository.Aggregation(pipeline = { "{ $sample: { size: 1 } }" })
    List<DsaProblem> findRandomProblem();
}
