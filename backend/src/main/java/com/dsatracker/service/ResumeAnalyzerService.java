package com.dsatracker.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.dsatracker.model.KeywordAnalysis;
import com.dsatracker.model.KeywordMatch;
import com.dsatracker.model.Resume;
import com.dsatracker.model.ResumeSections;
import com.dsatracker.model.ResumeUploadResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class ResumeAnalyzerService {
    
    @Autowired
    private Cloudinary cloudinary;
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private EmailService emailService;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private ResumeAnalyzerService self;
    
    // Keyword database (can be stored in MongoDB/Redis)
    private static final Map<String, List<String>> KEYWORDS_BY_ROLE = Map.of(
        "BACKEND", List.of("Java", "Spring Boot", "Microservices", "REST API", "SQL", "MongoDB", "Redis", "Kafka"),
        "FRONTEND", List.of("React", "Angular", "Vue", "JavaScript", "TypeScript", "HTML5", "CSS3", "Tailwind"),
        "FULLSTACK", List.of("Node.js", "Express", "MongoDB", "React", "REST API", "GraphQL", "AWS"),
        "DSA", List.of("Data Structures", "Algorithms", "Dynamic Programming", "Graph Theory", "LeetCode"),
        "SYSTEM_DESIGN", List.of("Load Balancing", "Caching", "Database Design", "Microservices", "Message Queue"),
        "DEVOPS", List.of("Docker", "Kubernetes", "Jenkins", "CI/CD", "AWS", "Terraform", "Prometheus")
    );
    
    // Upload resume (sync - returns immediately)
    public ResumeUploadResponse uploadResume(MultipartFile file, String userId) {
        try {
            byte[] fileBytes = file.getBytes();
            
            // Upload to Cloudinary
            Map uploadResult = cloudinary.uploader().upload(fileBytes, 
                ObjectUtils.asMap(
                    "folder", "resumes/" + userId,
                    "resource_type", "auto"
                )
            );
            
            String fileUrl = (String) uploadResult.get("secure_url");
            
            // Create resume document
            Resume resume = new Resume();
            resume.setUserId(userId);
            resume.setFileName(file.getOriginalFilename());
            resume.setFileUrl(fileUrl);
            resume.setStatus("processing");
            resume.setUploadedAt(Instant.now());
            
            Resume savedResume = mongoTemplate.save(resume);
            
            // Start async analysis via lazy self-invocation proxy
            self.analyzeResumeAsync(savedResume.getId(), fileBytes, file.getOriginalFilename());
            
            return new ResumeUploadResponse(savedResume.getId(), "Resume uploaded successfully. Analysis in progress.");
            
        } catch (Exception e) {
            log.error("Resume upload failed", e);
            throw new RuntimeException("Failed to upload resume: " + e.getMessage());
        }
    }
    
    // Async analysis method
    @Async("resumeExecutor")
    public void analyzeResumeAsync(String resumeId, byte[] fileBytes, String originalFilename) {
        try {
            log.info("Starting resume analysis for ID: {}", resumeId);
            
            // Update status to processing
            updateResumeStatus(resumeId, "processing");
            
            // Step 1: Extract text from PDF
            String extractedText = extractTextWithTika(fileBytes, originalFilename);
            
            // Step 2: Parse sections
            ResumeSections sections = parseSections(extractedText);
            
            // Step 3: Keyword matching & scoring
            KeywordAnalysis keywordAnalysis = analyzeKeywords(extractedText);
            
            // Step 4: Generate suggestions
            List<String> suggestions = generateSuggestions(keywordAnalysis, sections);
            
            // Step 5: Calculate ATS score
            int atsScore = calculateATSScore(extractedText, keywordAnalysis);
            
            // Step 6: Check formatting issues
            List<String> formattingIssues = checkFormatting(extractedText);
            
            // Step 7: Save complete analysis to DB
            Resume resume = mongoTemplate.findById(resumeId, Resume.class);
            if (resume != null) {
                resume.setParsedText(extractedText);
                resume.setSections(sections);
                resume.setKeywordMatches(keywordAnalysis.getMatches());
                resume.setAnalysisScore(keywordAnalysis.getOverallScore());
                resume.setSuggestions(suggestions);
                resume.setAtsScore(atsScore);
                resume.setFormattingIssues(formattingIssues);
                resume.setStatus("completed");
                resume.setProcessedAt(Instant.now());
                mongoTemplate.save(resume);
                
                // Step 8: Send notifications
                notificationService.createNotification(resume.getUserId(), "RESUME_ANALYZED", 
                        "Your resume analysis for '" + resume.getFileName() + "' is complete! ATS Score: " + atsScore + "/100");
            }
            log.info("Resume analysis completed for ID: {}", resumeId);
        } catch (Exception e) {
            log.error("Resume analysis failed for ID: {}", resumeId, e);
            updateResumeStatus(resumeId, "failed");
            
            String userId = getUserIdByResumeId(resumeId);
            if (userId != null) {
                notificationService.createNotification(userId, "RESUME_ERROR", "Failed to analyze your uploaded resume.");
            }
        }
    }
    
    private void updateResumeStatus(String resumeId, String status) {
        Resume resume = mongoTemplate.findById(resumeId, Resume.class);
        if (resume != null) {
            resume.setStatus(status);
            mongoTemplate.save(resume);
        }
    }
    
    private String getUserIdByResumeId(String resumeId) {
        Resume resume = mongoTemplate.findById(resumeId, Resume.class);
        return resume != null ? resume.getUserId() : null;
    }
    
    // Text extraction using Apache Tika
    private String extractTextWithTika(byte[] fileBytes, String filename) throws Exception {
        Tika tika = new Tika();
        try (java.io.InputStream is = new java.io.ByteArrayInputStream(fileBytes)) {
            return tika.parseToString(is);
        }
    }
    
    // Parse resume sections using regex patterns
    private ResumeSections parseSections(String text) {
        ResumeSections sections = new ResumeSections();
        
        Pattern eduPattern = Pattern.compile("(?i)(education|academic|qualifications)[:\\s]*(.*?)(?=(experience|skills|projects|$))", Pattern.DOTALL);
        Matcher eduMatcher = eduPattern.matcher(text);
        if(eduMatcher.find()) {
            sections.setEducation(eduMatcher.group(2).trim());
        }
        
        Pattern expPattern = Pattern.compile("(?i)(experience|work history|employment)[:\\s]*(.*?)(?=(education|skills|projects|$))", Pattern.DOTALL);
        Matcher expMatcher = expPattern.matcher(text);
        if(expMatcher.find()) {
            sections.setExperience(expMatcher.group(2).trim());
        }
        
        Pattern skillsPattern = Pattern.compile("(?i)(skills|technologies|tech stack)[:\\s]*(.*?)(?=(experience|education|projects|$))", Pattern.DOTALL);
        Matcher skillsMatcher = skillsPattern.matcher(text);
        if(skillsMatcher.find()) {
            sections.setSkills(skillsMatcher.group(2).trim());
        }
        
        Pattern projectsPattern = Pattern.compile("(?i)(projects|portfolio)[:\\s]*(.*?)(?=(experience|skills|education|$))", Pattern.DOTALL);
        Matcher projectsMatcher = projectsPattern.matcher(text);
        if(projectsMatcher.find()) {
            sections.setProjects(projectsMatcher.group(2).trim());
        }
        
        return sections;
    }
    
    // Keyword analysis & scoring
    private KeywordAnalysis analyzeKeywords(String text) {
        Map<String, KeywordMatch> matches = new HashMap<>();
        int totalPossibleScore = 0;
        int achievedScore = 0;
        
        for(Map.Entry<String, List<String>> role : KEYWORDS_BY_ROLE.entrySet()) {
            for(String keyword : role.getValue()) {
                totalPossibleScore += 2; // 2 points per keyword
                
                int count = countOccurrences(text, keyword);
                boolean found = count > 0;
                
                if(found) {
                    achievedScore += 2;
                    if(count > 3) achievedScore += 1; // Bonus for multiple mentions
                }
                
                matches.put(keyword, new KeywordMatch(found, count));
            }
        }
        
        int overallScore = (int) ((double) achievedScore / totalPossibleScore * 100);
        return new KeywordAnalysis(matches, overallScore);
    }
    
    private int countOccurrences(String text, String keyword) {
        Pattern pattern = Pattern.compile("\\b" + Pattern.quote(keyword) + "\\b", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        int count = 0;
        while(matcher.find()) count++;
        return count;
    }
    
    // AI-like suggestion generation
    private List<String> generateSuggestions(KeywordAnalysis analysis, ResumeSections sections) {
        List<String> suggestions = new ArrayList<>();
        
        analysis.getMatches().entrySet().stream()
            .filter(entry -> !entry.getValue().isFound())
            .limit(5)
            .forEach(entry -> 
                suggestions.add("Add '" + entry.getKey() + "' to your skills section - it's highly valued by recruiters")
            );
        
        if(sections.getProjects() == null || sections.getProjects().length() < 100) {
            suggestions.add("Add more details to your projects section. Include technologies used, your role, and measurable outcomes.");
        }
        
        if(sections.getExperience() != null && !sections.getExperience().contains("%")) {
            suggestions.add("Add quantifiable achievements in your experience section (e.g., 'Improved performance by 40%')");
        }
        
        if(sections.getSkills() != null && sections.getSkills().split(",").length < 8) {
            suggestions.add("List at least 8-10 relevant skills to pass ATS filters");
        }
        
        if(analysis.getMatches().get("Data Structures") == null || !analysis.getMatches().get("Data Structures").isFound()) {
            suggestions.add("Mention DSA proficiency - companies heavily filter for this");
        }
        
        return suggestions;
    }
    
    // ATS score calculation
    private int calculateATSScore(String text, KeywordAnalysis analysis) {
        int score = 0;
        
        int wordCount = text.split("\\s+").length;
        if(wordCount >= 400 && wordCount <= 800) score += 20;
        else if(wordCount >= 300) score += 10;
        
        score += Math.min(20, analysis.getOverallScore() / 5);
        
        if(text.matches(".*\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b.*")) score += 5;
        if(text.matches(".*\\b\\d{10}\\b.*")) score += 5;
        
        if(text.toLowerCase().contains("linkedin.com/in/")) score += 5;
        if(text.toLowerCase().contains("github.com/")) score += 5;
        
        return Math.min(100, score);
    }
    
    // Check formatting issues
    private List<String> checkFormatting(String text) {
        List<String> issues = new ArrayList<>();
        
        if(text.contains("\t")) {
            issues.add("Replace tabs with spaces for better readability");
        }
        
        if(text.length() > 10000) {
            issues.add("Resume too long (> 2 pages). Keep it concise - 1 page ideal for freshers");
        }
        
        if(!text.contains("•") && !text.contains("-")) {
            issues.add("Use bullet points to make achievements scannable");
        }
        
        return issues;
    }
    
    // Get analysis results (for frontend polling)
    public Resume getAnalysisResult(String resumeId, String userId) {
        Resume resume = mongoTemplate.findById(resumeId, Resume.class);
        if(resume != null && !resume.getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized to view this resume");
        }
        return resume;
    }
    
    public List<Resume> getUserResumeHistory(String userId) {
        org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query();
        query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("userId").is(userId));
        return mongoTemplate.find(query, Resume.class);
    }
}
