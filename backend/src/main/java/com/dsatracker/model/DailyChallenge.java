package com.dsatracker.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@Document(collection = "daily_challenges")
@CompoundIndex(name = "userId_date_idx", def = "{'userId': 1, 'date': -1}", unique = true)
public class DailyChallenge {

    @Id
    private String id;

    private String userId;

    private String dsaProblemId;

    private LocalDate date;

    private boolean completed = false;
}
