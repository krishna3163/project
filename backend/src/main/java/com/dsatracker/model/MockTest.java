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
@Document(collection = "mock_tests")
public class MockTest {

    @Id
    private String id;

    private String title;

    private List<Question> questions = new ArrayList<>();

    @Indexed
    private String createdBy; // userId

    private int duration; // minutes

    private int totalMarks;

    @CreatedDate
    private Instant createdAt;

    @Data
    @NoArgsConstructor
    public static class Question {
        private String id;
        private String text;
        private List<String> options = new ArrayList<>();
        private int correctOption; // 0-based index
        private int marks;
    }
}
