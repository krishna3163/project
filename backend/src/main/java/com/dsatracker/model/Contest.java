package com.dsatracker.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Coding contest fetched from external APIs.
 * Unique index on (platform, name) for upsert deduplication.
 */
@Data
@NoArgsConstructor
@Document(collection = "contests")
@CompoundIndex(name = "platform_name_unique", def = "{'platform': 1, 'name': 1}", unique = true)
public class Contest {

    @Id
    private String id;

    private String platform; // LEETCODE / HACKERRANK / HACKEREARTH / CODEFORCES

    private String name;

    @Indexed
    private Instant startTime;

    private Instant endTime;

    private String url;

    private boolean notified = false;

    @CreatedDate
    private Instant fetchedAt;
}
