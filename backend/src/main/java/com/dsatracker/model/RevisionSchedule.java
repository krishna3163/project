package com.dsatracker.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Data
@Document(collection = "revision_schedules")
public class RevisionSchedule {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String problemId;

    // SM-2 specific fields
    private double easeFactor = 2.5;
    private int intervalDays = 1;
    private int revisionCount = 0;

    @Indexed
    private LocalDate nextRevisionDate;

    private LocalDate lastRevisedDate;
}
