package com.dsatracker.controller;

import com.dsatracker.model.InterviewSession;
import com.dsatracker.security.JwtUtil;
import com.dsatracker.service.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/interviews")
@RequiredArgsConstructor
public class MockInterviewController {

    private final InterviewService interviewService;
    private final JwtUtil jwtUtil;

    public record ScheduleRequest(Instant scheduledTime) {}
    public record ReviewRequest(int rating, String feedback) {}

    @PostMapping("/schedule")
    public ResponseEntity<InterviewSession> scheduleInterview(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ScheduleRequest request) {
        String userId = extractUserId(authHeader);
        InterviewSession session = interviewService.scheduleOrMatch(userId, request.scheduledTime());
        return ResponseEntity.ok(session);
    }

    @GetMapping("/my-schedule")
    public ResponseEntity<List<InterviewSession>> getMySchedule(
            @RequestHeader("Authorization") String authHeader) {
        String userId = extractUserId(authHeader);
        List<InterviewSession> sessions = interviewService.getMySessions(userId);
        return ResponseEntity.ok(sessions);
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<InterviewSession> submitReview(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id,
            @RequestBody ReviewRequest request) {
        String userId = extractUserId(authHeader);
        InterviewSession session = interviewService.submitReview(id, userId, request.rating(), request.feedback());
        return ResponseEntity.ok(session);
    }

    @PostMapping("/{id}/regenerate-problem")
    public ResponseEntity<InterviewSession> regenerateProblem(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id) {
        String userId = extractUserId(authHeader);
        InterviewSession session = interviewService.regenerateProblem(id, userId);
        return ResponseEntity.ok(session);
    }

    private String extractUserId(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtUtil.extractUserId(authHeader.substring(7));
        }
        throw new IllegalArgumentException("Invalid Authorization header");
    }
}
