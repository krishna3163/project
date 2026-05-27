package com.dsatracker.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "roadmaps")
public class Roadmap {

    @Id
    private String id;

    private String companyName;

    private String logoUrl;

    private List<Stage> stages = new ArrayList<>();

    @Data
    @NoArgsConstructor
    public static class Stage {
        private int week;
        private String title;
        private List<String> topics = new ArrayList<>();
        private List<Resource> resources = new ArrayList<>();
    }

    @Data
    @NoArgsConstructor
    public static class Resource {
        private String title;
        private String url;
        private String type; // VIDEO / ARTICLE / PROBLEM
    }
}
