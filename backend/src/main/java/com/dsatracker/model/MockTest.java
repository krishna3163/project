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
    
    private String description;
    
    private String type; // practice or competition

    private List<Question> questions = new ArrayList<>();

    @Indexed
    private String createdBy; // userId

    private int duration; // minutes

    private int totalMarks;
    
    private int passingMarks;
    
    private String difficulty; // easy, medium, hard
    
    private List<String> topics = new ArrayList<>();
    
    private Instant startTime;
    
    private Instant endTime;
    
    private int participants;
    
    private boolean isActive = true;

    @CreatedDate
    private Instant createdAt;

    @Data
    @NoArgsConstructor
    public static class Question {
        private String id;
        private String text;
        private String type; // mcq, coding, subjective
        private List<String> options = new ArrayList<>();
        private int correctOption; // 0-based index for MCQ
        private String correctAnswer; // correct answer text/code
        private String explanation;
        private String boilerplate; // coding boilerplate
        private List<String> testCases = new ArrayList<>(); // format: "[2,7,11,15],9 -> [0,1]"
        private int marks;
        private String topic;
    }
}
