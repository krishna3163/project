package com.dsatracker.controller;

import com.dsatracker.model.DsaProblem;
import com.dsatracker.model.User;
import com.dsatracker.service.DsaService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dsa")
@RequiredArgsConstructor
public class DsaController {

    private final DsaService dsaService;

    @GetMapping
    public ResponseEntity<Page<DsaProblem>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String tag,
            @AuthenticationPrincipal User user) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        if (search != null && !search.isBlank())
            return ResponseEntity.ok(dsaService.searchByTitle(search.trim(), pageable));
        if (difficulty != null && !difficulty.isBlank())
            return ResponseEntity.ok(dsaService.filterByDifficulty(difficulty, pageable));
        if (tag != null && !tag.isBlank())
            return ResponseEntity.ok(dsaService.filterByTag(tag, pageable));
        return ResponseEntity.ok(dsaService.getAll(pageable));
    }

    @PostMapping("/{problemId}/solve")
    public ResponseEntity<DsaProblem> markSolved(
            @PathVariable String problemId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(dsaService.markSolved(problemId, user.getId()));
    }

    @DeleteMapping("/{problemId}/solve")
    public ResponseEntity<DsaProblem> markUnsolved(
            @PathVariable String problemId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(dsaService.markUnsolved(problemId, user.getId()));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> stats(@AuthenticationPrincipal User user) {
        long count = dsaService.getSolvedCount(user.getId());
        return ResponseEntity.ok(java.util.Map.of("solvedCount", count));
    }
}
