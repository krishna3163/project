package com.dsatracker.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@Document(collection = "user_progress")
public class UserRoadmapProgress {
    @Id
    private String id;
    private String userId;
    private String companyRoadmapId;
    private List<TopicProgress> progress;
    private int overallProgress;
    private Instant startedAt;
    private Instant lastActiveAt;
}
