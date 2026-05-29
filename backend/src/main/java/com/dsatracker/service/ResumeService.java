package com.dsatracker.service;

import com.dsatracker.model.Resume;
import com.dsatracker.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Resume analysis using Apache Tika for text extraction.
 * Analysis is async (@Async) so upload endpoint returns immediately.
 *
 * TODO(security): Consider integrating antivirus scanning before permanent storage.
 * TODO(security): Consider CDR (Content Disarm & Reconstruct) to strip active content.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final Tika tika = new Tika();

    // Keyword categories for scoring
    private static final Map<String, Integer> KEYWORD_WEIGHTS = Map.ofEntries(
        Map.entry("java", 5),
        Map.entry("spring", 5),
        Map.entry("spring boot", 5),
        Map.entry("microservices", 4),
        Map.entry("rest api", 4),
        Map.entry("mongodb", 3),
        Map.entry("redis", 3),
        Map.entry("docker", 3),
        Map.entry("kubernetes", 4),
        Map.entry("aws", 4),
        Map.entry("sql", 3),
        Map.entry("mysql", 3),
        Map.entry("postgresql", 3),
        Map.entry("git", 2),
        Map.entry("dsa", 3),
        Map.entry("data structures", 3),
        Map.entry("algorithms", 3),
        Map.entry("system design", 4),
        Map.entry("react", 3),
        Map.entry("typescript", 3),
        Map.entry("agile", 2),
        Map.entry("ci/cd", 3),
        Map.entry("jenkins", 2),
        Map.entry("junit", 2),
        Map.entry("python", 3),
        Map.entry("machine learning", 4)
    );

    public Resume getById(String id, String userId) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Resume not found"));
        if (!resume.getUserId().equals(userId)) {
            throw new SecurityException("Access denied");
        }
        return resume;
    }

    public Resume getLatest(String userId) {
        return resumeRepository.findTopByUserIdOrderByUploadedAtDesc(userId)
                .orElseThrow(() -> new IllegalArgumentException("No resume found"));
    }

    /**
     * Extract text from uploaded file stream using Tika.
     * Called after file is uploaded to Cloudinary.
     */
    @Async
    public void analyzeAsync(String resumeId, InputStream contentStream) {
        resumeRepository.findById(resumeId).ifPresent(resume -> {
            try {
                String text = tika.parseToString(contentStream);
                resume.setParsedText(text);
                ResumeAnalysisResult result = analyze(text);
                resume.setAnalysisScore(result.score());
                resume.setSuggestions(result.suggestions());
                resume.setMatchedKeywords(result.matchedKeywords());
                resume.setAiFeedback(result.aiFeedback());
                resumeRepository.save(resume);
                log.info("Resume analysis complete for resumeId: {}", resumeId);
            } catch (Exception e) {
                log.error("Resume analysis failed for resumeId: {} error: {}", resumeId, e.getMessage());
            }
        });
    }

    private ResumeAnalysisResult analyze(String text) {
        String lower = text.toLowerCase(Locale.ROOT);
        List<String> matched = new ArrayList<>();
        int totalWeight = 0;
        int maxWeight = 0;

        for (Map.Entry<String, Integer> entry : KEYWORD_WEIGHTS.entrySet()) {
            maxWeight += entry.getValue();
            if (lower.contains(entry.getKey())) {
                matched.add(entry.getKey());
                totalWeight += entry.getValue();
            }
        }

        int score = Math.min(100, (int) ((double) totalWeight / maxWeight * 100));
        List<String> suggestions = generateSuggestions(lower, matched);
        String aiFeedback = generateAiFeedback(score, matched, suggestions);
        return new ResumeAnalysisResult(score, suggestions, matched, aiFeedback);
    }

    private List<String> generateSuggestions(String text, List<String> matched) {
        List<String> suggestions = new ArrayList<>();
        if (!matched.contains("projects") && !text.contains("project"))
            suggestions.add("Add a Projects section to showcase your work.");
        if (!matched.contains("git"))
            suggestions.add("Mention Git/GitHub for version control experience.");
        if (!matched.contains("system design"))
            suggestions.add("Add System Design experience or courses.");
        if (!matched.contains("docker"))
            suggestions.add("Add Docker/containerization skills.");
        if (!text.contains("intern") && !text.contains("experience"))
            suggestions.add("Add internship or work experience section.");
        if (!text.contains("certification") && !text.contains("certificate"))
            suggestions.add("Add certifications (AWS, Google Cloud, etc.).");
        if (text.length() < 500)
            suggestions.add("Resume seems short. Add more details about your experience and skills.");
        if (suggestions.isEmpty())
            suggestions.add("Great resume! Consider adding quantified achievements (e.g., improved performance by 30%).");
        return suggestions;
    }

    private String generateAiFeedback(int score, List<String> matched, List<String> suggestions) {
        StringBuilder fb = new StringBuilder();
        fb.append("### AI Resume Analysis Report\n\n");
        
        if (score >= 80) {
            fb.append("🌟 **Excellent Profile!** Your resume hits many highly-valued industry keywords.\n\n");
        } else if (score >= 50) {
            fb.append("👍 **Solid Start.** You have a good foundation, but there is room for optimization.\n\n");
        } else {
            fb.append("⚠️ **Needs Work.** Your resume is missing key technical terms that ATS scanners look for.\n\n");
        }

        fb.append("#### Strengths\n");
        if (matched.isEmpty()) {
            fb.append("- No major tech keywords detected. Make sure you explicitly mention technologies like Java, React, or Docker.\n");
        } else {
            fb.append("- Strong keyword matches: `").append(String.join("`, `", matched)).append("`.\n");
            fb.append("- Formatted well for basic text extraction.\n");
        }

        fb.append("\n#### Areas for Improvement\n");
        for (String s : suggestions) {
            fb.append("- ").append(s).append("\n");
        }

        fb.append("\n#### ATS Optimization Tips\n");
        fb.append("- Ensure action verbs (e.g., *Spearheaded*, *Architected*) begin your bullet points.\n");
        fb.append("- Include metrics (e.g., *Improved latency by 40%*).\n");
        
        return fb.toString();
    }

    @Async
    public void analyzeFromUrlAsync(String resumeId, String fileUrl) {
        resumeRepository.findById(resumeId).ifPresent(resume -> {
            try {
                resume.setStatus("processing");
                resumeRepository.save(resume);

                java.net.URL url = new java.net.URL(fileUrl);
                try (java.io.InputStream in = url.openStream()) {
                    String text = tika.parseToString(in);
                    resume.setParsedText(text);
                    ResumeAnalysisResult result = analyze(text);
                    resume.setAnalysisScore(result.score());
                    resume.setSuggestions(result.suggestions());
                    resume.setMatchedKeywords(result.matchedKeywords());
                    resume.setAiFeedback(result.aiFeedback());
                    resume.setAtsScore(result.score());
                    resume.setStatus("completed");
                    resume.setProcessedAt(Instant.now());
                    resumeRepository.save(resume);
                    log.info("Resume URL analysis complete for resumeId: {}", resumeId);
                }
            } catch (Exception e) {
                log.error("Resume URL analysis failed for resumeId: {} error: {}", resumeId, e.getMessage());
                resume.setStatus("failed");
                resumeRepository.save(resume);
            }
        });
    }

    private record ResumeAnalysisResult(int score, List<String> suggestions, List<String> matchedKeywords, String aiFeedback) {}
}
