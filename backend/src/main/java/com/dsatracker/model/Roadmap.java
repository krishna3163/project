package com.dsatracker.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@Document(collection = "roadmaps")
public class Roadmap {
    @Id
    private String id;
    private String companyName;
    private String difficulty;
    private String avgPackage;
    private List<Stage> stages;
    private int totalWeeks;
    private Instant createdAt;
    private Instant updatedAt;
}
