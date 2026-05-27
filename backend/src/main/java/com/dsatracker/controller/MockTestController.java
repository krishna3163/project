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

    @PostMapping("/{testId}/submit")
    public ResponseEntity<MockResult> submit(
            @PathVariable String testId,
            @RequestBody Map<String, Integer> answers,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(mockTestService.submit(testId, user.getId(), answers));
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
}
