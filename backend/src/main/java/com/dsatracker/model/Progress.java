package com.dsatracker.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

/**
 * Daily progress snapshot per user.
 */
@Data
@NoArgsConstructor
@Document(collection = "progress")
@CompoundIndex(name = "userId_date_unique", def = "{'userId': 1, 'date': 1}", unique = true)
public class Progress {

    @Id
    private String id;

    private String userId;

    private LocalDate date;

    private int dsaSolved;

    private double mockScoreAvg;

    private int notesCount;

    private int resumeScore;
}
