package com.dsatracker.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document(collection = "interview_sessions")
public class InterviewSession {

    public enum Status {
        PENDING,
        MATCHED,
        COMPLETED,
        CANCELLED
    }

    @Id
    private String id;

    @Indexed
    private String hostUserId;

    @Indexed
    private String peerUserId;

    @Indexed
    private Instant scheduledTime;

    private String jitsiRoomName;

    private String problemId;

    @Indexed
    private Status status = Status.PENDING;

    // Rating given by host to the peer
    private Integer hostRatingOfPeer;
    
    // Rating given by peer to the host
    private Integer peerRatingOfHost;
    
    private String feedbackFromHost;
    private String feedbackFromPeer;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();
}
