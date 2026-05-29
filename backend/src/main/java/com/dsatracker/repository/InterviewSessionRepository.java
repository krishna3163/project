package com.dsatracker.repository;

import com.dsatracker.model.InterviewSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewSessionRepository extends MongoRepository<InterviewSession, String> {

    List<InterviewSession> findByHostUserIdOrPeerUserIdOrderByScheduledTimeAsc(String hostUserId, String peerUserId);

    List<InterviewSession> findByScheduledTimeAfterAndStatus(Instant time, InterviewSession.Status status);

    @Query("{ 'scheduledTime' : ?0, 'status' : 'PENDING', 'hostUserId' : { $ne: ?1 } }")
    Optional<InterviewSession> findAvailableSlotForTime(Instant scheduledTime, String excludedUserId);

    Optional<InterviewSession> findByHostUserIdAndScheduledTime(String hostUserId, Instant scheduledTime);
}
