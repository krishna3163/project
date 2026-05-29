package com.dsatracker.model;

import lombok.Data;
import java.time.Instant;

@Data
public class TopicProgress {
    private int stageWeek;
    private String topicName;
    private boolean completed;
    private Instant completedAt;
    private String notes;
}
