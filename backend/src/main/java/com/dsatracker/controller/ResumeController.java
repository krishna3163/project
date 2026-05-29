package com.dsatracker.controller;

import com.dsatracker.model.Resume;
import com.dsatracker.model.ResumeUploadResponse;
import com.dsatracker.service.ResumeAnalyzerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/resume")
@CrossOrigin(origins = "*") // Changed to * for dev
public class ResumeController {
    
    @Autowired
    private ResumeAnalyzerService resumeService;
    
    @PostMapping("/upload")
    public ResponseEntity<?> uploadResume(
            @RequestParam("file") MultipartFile file,
            @RequestHeader("userId") String userId) {
        
        if(file.getContentType() == null || !file.getContentType().equals("application/pdf")) {
            return ResponseEntity.badRequest().body("Only PDF files are allowed");
        }
        
        if(file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest().body("File size must be less than 5MB");
        }
        
        ResumeUploadResponse response = resumeService.uploadResume(file, userId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/result/{resumeId}")
    public ResponseEntity<?> getAnalysisResult(
            @PathVariable String resumeId,
            @RequestHeader("userId") String userId) {
        
        Resume resume = resumeService.getAnalysisResult(resumeId, userId);
        return ResponseEntity.ok(resume);
    }
    
    @GetMapping("/history")
    public ResponseEntity<?> getResumeHistory(@RequestHeader("userId") String userId) {
        List<Resume> history = resumeService.getUserResumeHistory(userId);
        return ResponseEntity.ok(history);
    }
}
