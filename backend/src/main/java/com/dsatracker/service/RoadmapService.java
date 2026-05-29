package com.dsatracker.service;

import com.dsatracker.model.Roadmap;
import com.dsatracker.model.TopicProgress;
import com.dsatracker.model.UserRoadmapProgress;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
public class RoadmapService {
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    @Autowired
    private NotificationService notificationService;
    
    // Get all company roadmaps
    public List<Roadmap> getAllRoadmaps() {
        String cacheKey = "roadmaps:all";
        List<Roadmap> cached = (List<Roadmap>) redisTemplate.opsForValue().get(cacheKey);
        if(cached != null) return cached;
        
        List<Roadmap> roadmaps = mongoTemplate.findAll(Roadmap.class);
        redisTemplate.opsForValue().set(cacheKey, roadmaps, 3600, TimeUnit.SECONDS);
        return roadmaps;
    }
    
    // Get roadmap by id
    public Roadmap getRoadmapById(String companyId) {
        return mongoTemplate.findById(companyId, Roadmap.class);
    }
    
    // Get user's progress for a specific company
    public UserRoadmapProgress getUserProgress(String userId, String companyId) {
        Query query = new Query();
        query.addCriteria(Criteria.where("userId").is(userId)
            .and("companyRoadmapId").is(companyId));
        
        UserRoadmapProgress progress = mongoTemplate.findOne(query, UserRoadmapProgress.class);
        
        if(progress == null) {
            // Initialize new progress
            progress = new UserRoadmapProgress();
            progress.setUserId(userId);
            progress.setCompanyRoadmapId(companyId);
            progress.setProgress(new ArrayList<>());
            progress.setOverallProgress(0);
            progress.setStartedAt(Instant.now());
            progress = mongoTemplate.save(progress);
        }
        
        return progress;
    }
    
    // Mark topic as completed
    public void markTopicComplete(String userId, String companyId, int week, String topicName) {
        UserRoadmapProgress progress = getUserProgress(userId, companyId);
        
        // Update or add progress entry
        Optional<TopicProgress> existing = progress.getProgress().stream()
            .filter(p -> p.getStageWeek() == week && p.getTopicName().equals(topicName))
            .findFirst();
        
        if(existing.isPresent()) {
            existing.get().setCompleted(true);
            existing.get().setCompletedAt(Instant.now());
        } else {
            TopicProgress newProgress = new TopicProgress();
            newProgress.setStageWeek(week);
            newProgress.setTopicName(topicName);
            newProgress.setCompleted(true);
            newProgress.setCompletedAt(Instant.now());
            progress.getProgress().add(newProgress);
        }
        
        // Recalculate overall progress
        Roadmap roadmap = mongoTemplate.findById(companyId, Roadmap.class);
        if (roadmap == null) return;
        
        int totalTopics = roadmap.getStages().stream()
            .mapToInt(stage -> stage.getTopics().size())
            .sum();
        
        int completedTopics = (int) progress.getProgress().stream()
            .filter(TopicProgress::isCompleted)
            .count();
        progress.setOverallProgress((completedTopics * 100) / totalTopics);
        progress.setLastActiveAt(Instant.now());
        
        mongoTemplate.save(progress);
        
        // Send achievement notification if milestone reached
        if(progress.getOverallProgress() == 100) {
            notificationService.createNotification(userId, "MILESTONE", "🎉 Congratulations! You completed the " + roadmap.getCompanyName() + " preparation roadmap!");
        } else if(progress.getOverallProgress() > 0 && progress.getOverallProgress() % 25 == 0) {
            notificationService.createNotification(userId, "MILESTONE", "Milestone Unlocked! You're " + progress.getOverallProgress() + "% through your " + roadmap.getCompanyName() + " roadmap. Keep going!");
        }
    }
}
