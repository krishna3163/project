package com.dsatracker.controller;

import com.dsatracker.model.Contest;
import com.dsatracker.service.ContestService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contests")
@RequiredArgsConstructor
public class ContestController {

    private final ContestService contestService;

    @GetMapping("/upcoming")
    public ResponseEntity<Page<Contest>> getUpcoming(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(contestService.getUpcoming(PageRequest.of(page, Math.min(size, 50))));
    }

    /** Admin-only: trigger manual contest fetch */
    @PostMapping("/fetch")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> triggerFetch() {
        contestService.fetchContests();
        return ResponseEntity.ok(java.util.Map.of("message", "Contest fetch triggered"));
    }
}
