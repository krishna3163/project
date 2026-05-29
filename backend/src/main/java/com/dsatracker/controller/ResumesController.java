package com.dsatracker.controller;

import com.dsatracker.model.Resume;
import com.dsatracker.model.User;
import com.dsatracker.model.Notification;
import com.dsatracker.repository.ResumeRepository;
import com.dsatracker.repository.UserRepository;
import com.dsatracker.repository.NotificationRepository;
import com.dsatracker.service.ResumeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
@Slf4j
public class ResumesController {

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final ResumeService resumeService;

    @GetMapping
    public ResponseEntity<?> getResumes(@AuthenticationPrincipal User user) {
        List<Resume> history = resumeRepository.findByUserIdOrderByUploadedAtDesc(user.getId());
        return ResponseEntity.ok(Map.of("content", history));
    }

    @PostMapping
    public ResponseEntity<?> uploadResume(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        String fileName = body.get("fileName");
        String fileUrl = body.get("fileUrl");

        if (fileUrl == null || fileUrl.isBlank()) {
            return ResponseEntity.badRequest().body("File URL is required");
        }

        Resume resume = new Resume();
        resume.setUserId(user.getId());
        resume.setFileName(fileName != null && !fileName.isBlank() ? fileName.trim() : "resume_" + System.currentTimeMillis() + ".pdf");
        resume.setFileUrl(fileUrl.trim());
        resume.setStatus("processing");
        resume.setUploadedAt(Instant.now());
        resume.setAnalysisScore(0);
        resume.setAtsScore(0);

        Resume saved = resumeRepository.save(resume);
        
        // Trigger asynchronous analysis from URL
        resumeService.analyzeFromUrlAsync(saved.getId(), saved.getFileUrl());

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/feed")
    public ResponseEntity<?> getCommunityFeed(@AuthenticationPrincipal User user) {
        // Fetch all resumes requesting feedback except current user's
        List<Resume> feed = resumeRepository.findByRequestFeedbackTrueOrderByUploadedAtDesc();
        List<Resume> filtered = feed.stream()
                .filter(r -> !r.getUserId().equals(user.getId()))
                .toList();
        return ResponseEntity.ok(filtered);
    }

    @PostMapping("/{id}/request-feedback")
    public ResponseEntity<?> toggleFeedback(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Resume not found"));

        if (!resume.getUserId().equals(user.getId())) {
            return ResponseEntity.status(403).body("Not authorized to share this resume");
        }

        resume.setRequestFeedback(!resume.isRequestFeedback());
        Resume saved = resumeRepository.save(resume);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<?> reviewResume(
            @AuthenticationPrincipal User user,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        String feedbackText = (String) body.get("feedbackText");
        Integer rating = (Integer) body.get("rating");

        if (feedbackText == null || feedbackText.isBlank()) {
            return ResponseEntity.badRequest().body("Feedback text is required");
        }
        if (rating == null || rating < 1 || rating > 5) {
            return ResponseEntity.badRequest().body("Rating must be between 1 and 5");
        }

        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Resume not found"));

        Resume.CommunityReview review = new Resume.CommunityReview();
        review.setReviewerUserId(user.getId());
        review.setReviewerName(user.getName() != null ? user.getName() : "Anonymous Peer");
        review.setFeedbackText(feedbackText.trim());
        review.setRating(rating);
        review.setCreatedAt(Instant.now());

        resume.getCommunityReviews().add(review);
        resumeRepository.save(resume);

        // Award 50 XP to the reviewer user
        userRepository.findById(user.getId()).ifPresent(reviewer -> {
            reviewer.setXpPoints(reviewer.getXpPoints() + 50);
            userRepository.save(reviewer);

            Notification notif = new Notification();
            notif.setUserId(reviewer.getId());
            notif.setType("CONGRATS");
            notif.setMessage("✍️ You reviewed a peer's resume! +50 XP awarded! 🎉");
            notif.setCreatedAt(Instant.now());
            notificationRepository.save(notif);
        });

        // Notify the resume owner
        Notification ownerNotif = new Notification();
        ownerNotif.setUserId(resume.getUserId());
        ownerNotif.setType("INFO");
        ownerNotif.setMessage("✨ A peer just reviewed your resume \"" + resume.getFileName() + "\": \"" + feedbackText + "\"");
        ownerNotif.setCreatedAt(Instant.now());
        notificationRepository.save(ownerNotif);

        return ResponseEntity.ok(resume);
    }

    @GetMapping("/samples")
    public ResponseEntity<?> getPlacedSamples() {
        // Return simulated sample placed SDE resumes
        List<Map<String, Object>> samples = List.of(
            Map.of(
                "id", "sample1",
                "name", "Aarav Sharma",
                "placedAt", "Google (SDE-1)",
                "atsScore", 94,
                "role", "Full Stack Engineer",
                "fileUrl", "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                "fileName", "Google_Placed_Aarav_Resume.pdf"
            ),
            Map.of(
                "id", "sample2",
                "name", "Priya Nair",
                "placedAt", "Amazon (SDE-1)",
                "atsScore", 89,
                "role", "Backend Developer",
                "fileUrl", "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                "fileName", "Amazon_SDE_Priya_Resume.pdf"
            ),
            Map.of(
                "id", "sample3",
                "name", "Kabir Sen",
                "placedAt", "Microsoft (SDE-1)",
                "atsScore", 92,
                "role", "Systems Engineer",
                "fileUrl", "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                "fileName", "Microsoft_Kabir_SDE_Resume.pdf"
            )
        );
        return ResponseEntity.ok(samples);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getAtsStats() {
        List<Resume> allResumes = resumeRepository.findAll();
        int total = allResumes.size();
        double avg = allResumes.stream().mapToInt(Resume::getAnalysisScore).average().orElse(74.0);
        int max = allResumes.stream().mapToInt(Resume::getAnalysisScore).max().orElse(92);

        return ResponseEntity.ok(Map.of(
            "totalAnalyzed", total,
            "averageScore", Math.round(avg),
            "highestScore", max
        ));
    }
}
