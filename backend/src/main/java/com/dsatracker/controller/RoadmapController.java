package com.dsatracker.controller;

import com.dsatracker.model.Roadmap;
import com.dsatracker.model.User;
import com.dsatracker.model.UserRoadmapProgress;
import com.dsatracker.service.RoadmapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/roadmaps")
@CrossOrigin(origins = "*")
public class RoadmapController {

    @Autowired
    private RoadmapService roadmapService;

    @GetMapping
    public ResponseEntity<List<Roadmap>> getAllRoadmaps() {
        return ResponseEntity.ok(roadmapService.getAllRoadmaps());
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<Roadmap> getRoadmap(@PathVariable String companyId) {
        return ResponseEntity.ok(roadmapService.getRoadmapById(companyId));
    }

    @GetMapping("/progress/{companyId}")
    public ResponseEntity<UserRoadmapProgress> getProgress(
            @PathVariable String companyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(roadmapService.getUserProgress(user.getId(), companyId));
    }

    @PostMapping("/mark-complete")
    public ResponseEntity<?> markComplete(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {
        
        String companyId = (String) body.get("companyId");
        int week = (Integer) body.get("week");
        String topicName = (String) body.get("topicName");
        
        roadmapService.markTopicComplete(user.getId(), companyId, week, topicName);
        return ResponseEntity.ok().build();
    }
}
