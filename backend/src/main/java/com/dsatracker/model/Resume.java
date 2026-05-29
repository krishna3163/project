package com.dsatracker.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.UUID;

@Data
@Document(collection = "resumes")
public class Resume {
    @Id
    private String id;
    private String userId;
    private String fileName;
    private String fileUrl;
    private Instant uploadedAt;
    private String status;
    private String parsedText;
    private int analysisScore;
    private ResumeSections sections;
    private Map<String, KeywordMatch> keywordMatches;
    private List<String> suggestions;
    private List<String> matchedKeywords;
    private String aiFeedback;
    private int atsScore;
    private List<String> formattingIssues;
    private Instant processedAt;
    private boolean requestFeedback = false;
    private List<CommunityReview> communityReviews = new ArrayList<>();

    @Data
    public static class CommunityReview {
        private String id = UUID.randomUUID().toString();
        private String reviewerUserId;
        private String reviewerName;
        private String feedbackText;
        private int rating;
        private Instant createdAt = Instant.now();
    }
}
