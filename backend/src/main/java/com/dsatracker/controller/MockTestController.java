package com.dsatracker.controller;

import com.dsatracker.model.MockResult;
import com.dsatracker.model.MockTest;
import com.dsatracker.model.User;
import com.dsatracker.service.MockTestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mock-tests")
@RequiredArgsConstructor
public class MockTestController {

    private final MockTestService mockTestService;

    @GetMapping
    public ResponseEntity<Page<MockTest>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(mockTestService.getAll(PageRequest.of(page, Math.min(size, 50))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MockTest> getById(@PathVariable String id) {
        return ResponseEntity.ok(mockTestService.getById(id));
    }

    @PostMapping
    public ResponseEntity<MockTest> create(
            @Valid @RequestBody MockTest test,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(mockTestService.create(test, user.getId()));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<MockTestService.TestSession> startTest(
            @PathVariable String id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(mockTestService.startTest(user.getId(), id));
    }

    @PostMapping("/{id}/submit-answer")
    public ResponseEntity<Void> submitAnswer(
            @PathVariable String id,
            @RequestBody Map<String, Object> req,
            @AuthenticationPrincipal User user) {
        String questionId = (String) req.get("questionId");
        String answer = String.valueOf(req.get("answer"));
        int timeSpent = ((Number) req.getOrDefault("timeSpent", 0)).intValue();
        mockTestService.submitAnswer(user.getId(), id, questionId, answer, timeSpent);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{testId}/submit")
    public ResponseEntity<MockResult> submit(
            @PathVariable String testId,
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal User user) {
        if (payload.containsKey("answers")) {
            Map<String, String> answers = (Map<String, String>) payload.get("answers");
            int timeTaken = ((Number) payload.getOrDefault("timeTaken", 0)).intValue();
            return ResponseEntity.ok(mockTestService.submitFull(testId, user.getId(), answers, timeTaken));
        } else {
            // fallback to older style choices map
            Map<String, Integer> mcqAnswers = new HashMap<>();
            for (Map.Entry<String, Object> entry : payload.entrySet()) {
                try {
                    double d = Double.parseDouble(String.valueOf(entry.getValue()));
                    mcqAnswers.put(entry.getKey(), (int) d);
                } catch (Exception ex) {
                    // ignore
                }
            }
            return ResponseEntity.ok(mockTestService.submit(testId, user.getId(), mcqAnswers));
        }
    }

    @GetMapping("/{testId}/leaderboard")
    public ResponseEntity<Page<MockResult>> leaderboard(
            @PathVariable String testId,
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(mockTestService.getLeaderboard(testId, PageRequest.of(page, 100)));
    }

    @GetMapping("/my-results")
    public ResponseEntity<List<MockResult>> myResults(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(mockTestService.getUserResults(user.getId()));
    }

    @GetMapping("/analytics/{userId}")
    public ResponseEntity<MockTestService.MockAnalytics> getAnalytics(
            @PathVariable String userId) {
        return ResponseEntity.ok(mockTestService.getUserAnalytics(userId));
    }

    @GetMapping("/share/{shareId}")
    public ResponseEntity<MockResult> getByShareId(@PathVariable String shareId) {
        return ResponseEntity.ok(mockTestService.getResultByShareId(shareId));
    }
}
