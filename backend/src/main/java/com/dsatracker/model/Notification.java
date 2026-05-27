package com.dsatracker.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    @Indexed
    private String userId;

    /** REMINDER / CONGRATS / RANK_UPDATE / SYSTEM */
    private String type;

    private String message;

    private boolean read = false;

    private String actionUrl;

    @CreatedDate
    private Instant createdAt;
}
