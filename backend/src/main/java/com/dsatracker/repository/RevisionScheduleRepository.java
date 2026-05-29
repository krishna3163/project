package com.dsatracker.repository;

import com.dsatracker.model.RevisionSchedule;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RevisionScheduleRepository extends MongoRepository<RevisionSchedule, String> {

    Optional<RevisionSchedule> findByUserIdAndProblemId(String userId, String problemId);

    // Find all schedules for a user where the next revision date is on or before today
    @Query("{ 'userId' : ?0, 'nextRevisionDate' : { $lte: ?1 } }")
    List<RevisionSchedule> findDueRevisions(String userId, LocalDate today);
    
    void deleteByUserIdAndProblemId(String userId, String problemId);
    List<RevisionSchedule> findByUserId(String userId);
}
