package com.dsatracker.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "resumes")
public class Resume {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String fileName;

    /** Cloudinary secure URL */
    private String fileUrl;

    /** Text extracted by Apache Tika */
    private String parsedText;

    /** 0-100 score */
    private int analysisScore;

    private List<String> suggestions = new ArrayList<>();

    private List<String> matchedKeywords = new ArrayList<>();

    @CreatedDate
    private Instant uploadedAt;
}
