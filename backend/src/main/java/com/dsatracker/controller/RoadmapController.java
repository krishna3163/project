package com.dsatracker.controller;

import com.dsatracker.model.Roadmap;
import com.dsatracker.repository.RoadmapRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roadmaps")
@RequiredArgsConstructor
public class RoadmapController {

    private final RoadmapRepository roadmapRepository;

    @GetMapping
    public ResponseEntity<List<Roadmap>> getAll() {
        return ResponseEntity.ok(roadmapRepository.findAll());
    }

    @GetMapping("/{company}")
    public ResponseEntity<Roadmap> getByCompany(@PathVariable String company) {
        return ResponseEntity.ok(
                roadmapRepository.findByCompanyNameIgnoreCase(company)
                        .orElseThrow(() -> new IllegalArgumentException("Roadmap not found")));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Roadmap> create(@RequestBody Roadmap roadmap) {
        return ResponseEntity.ok(roadmapRepository.save(roadmap));
    }
}
