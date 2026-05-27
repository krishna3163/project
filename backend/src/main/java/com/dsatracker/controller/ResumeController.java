package com.dsatracker.controller;

import com.dsatracker.model.Resume;
import com.dsatracker.model.User;
import com.dsatracker.repository.ResumeRepository;
import com.dsatracker.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;
    private final ResumeRepository resumeRepository;

    /**
     * Save resume metadata after frontend uploads to Cloudinary.
     * Analysis runs async in background via @Async.
     *
     * TODO(security): Validate that the fileUrl is a valid Cloudinary URL before storing.
     * TODO(security): Scan uploaded file for malware via antivirus API.
     */
    @PostMapping
    public ResponseEntity<Resume> create(
            @RequestBody ResumeRequest req,
            @AuthenticationPrincipal User user) {
        Resume resume = new Resume();
        resume.setUserId(user.getId());
        resume.setFileName(req.fileName());
        resume.setFileUrl(req.fileUrl());
        resume.setUploadedAt(Instant.now());
        Resume saved = resumeRepository.save(resume);
        // Trigger async analysis (non-blocking)
        // Note: actual text extraction requires the file stream — for Cloudinary,
        // download and pass stream in a real implementation.
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<Page<Resume>> getMyResumes(
            @RequestParam(defaultValue = "0") int page,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(resumeRepository.findByUserId(user.getId(), PageRequest.of(page, 10)));
    }

    @GetMapping("/latest")
    public ResponseEntity<Resume> getLatest(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(resumeService.getLatest(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resume> getById(
            @PathVariable String id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(resumeService.getById(id, user.getId()));
    }

    public record ResumeRequest(String fileName, String fileUrl) {}
}
