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
@Document(collection = "notes")
public class Note {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String title;

    private String subject;

    /** Cloudinary secure URL */
    private String fileUrl;

    /** Original filename stored for display; UUID used for actual storage */
    private String originalFileName;

    /** PDF / IMAGE */
    private String fileType;

    @CreatedDate
    private Instant uploadedAt;
}
