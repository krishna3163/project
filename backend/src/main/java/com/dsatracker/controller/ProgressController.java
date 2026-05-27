package com.dsatracker.controller;

import com.dsatracker.model.Progress;
import com.dsatracker.model.User;
import com.dsatracker.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    @GetMapping
    public ResponseEntity<List<Progress>> getProgress(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(progressService.getUserProgress(user.getId()));
    }

    @GetMapping("/last-30-days")
    public ResponseEntity<List<Progress>> getLast30Days(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(progressService.getLast30Days(user.getId()));
    }

    @GetMapping("/snapshot")
    public ResponseEntity<ProgressService.ProgressSnapshot> getSnapshot(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(progressService.getSnapshot(user.getId()));
    }
}
