package com.dsatracker.service;

import com.dsatracker.model.RevisionSchedule;
import com.dsatracker.repository.RevisionScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RevisionService {

    private final RevisionScheduleRepository revisionRepository;

    /**
     * Called when a user solves a problem for the first time.
     */
    public void scheduleFirstRevision(String userId, String problemId) {
        Optional<RevisionSchedule> existing = revisionRepository.findByUserIdAndProblemId(userId, problemId);
        if (existing.isEmpty()) {
            RevisionSchedule schedule = new RevisionSchedule();
            schedule.setUserId(userId);
            schedule.setProblemId(problemId);
            schedule.setEaseFactor(2.5);
            schedule.setIntervalDays(1);
            schedule.setRevisionCount(0);
            schedule.setNextRevisionDate(LocalDate.now().plusDays(1)); // First revision tomorrow
            revisionRepository.save(schedule);
        }
    }

    /**
     * Remove from revision schedule if marked unsolved.
     */
    public void removeSchedule(String userId, String problemId) {
        revisionRepository.deleteByUserIdAndProblemId(userId, problemId);
    }

    public List<RevisionSchedule> getDueRevisions(String userId) {
        return revisionRepository.findDueRevisions(userId, LocalDate.now());
    }

    /**
     * Updates the revision schedule using a simplified SM-2 algorithm.
     * Quality: 1 (Hard), 2 (Good), 3 (Easy)
     */
    public RevisionSchedule updateRevision(String userId, String problemId, int quality) {
        RevisionSchedule schedule = revisionRepository.findByUserIdAndProblemId(userId, problemId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));

        if (quality < 1 || quality > 3) {
            throw new IllegalArgumentException("Quality must be between 1 and 3");
        }

        int newInterval;
        double easeFactor = schedule.getEaseFactor();

        if (quality == 1) { // Hard
            // Reset interval, decrease ease factor heavily
            newInterval = 1;
            easeFactor = Math.max(1.3, easeFactor - 0.2);
            schedule.setRevisionCount(0);
        } else {
            // Good or Easy
            if (schedule.getRevisionCount() == 0) {
                newInterval = 1;
            } else if (schedule.getRevisionCount() == 1) {
                newInterval = 3; // Standard second interval
            } else {
                newInterval = (int) Math.round(schedule.getIntervalDays() * easeFactor);
            }
            
            // Adjust ease factor
            if (quality == 3) { // Easy
                easeFactor += 0.1;
                newInterval = (int) (newInterval * 1.3); // Bonus multiplier for easy
            } else { // Good
                // easeFactor remains similar or slight bump
                easeFactor += 0.02;
            }
            schedule.setRevisionCount(schedule.getRevisionCount() + 1);
        }

        schedule.setIntervalDays(newInterval);
        schedule.setEaseFactor(easeFactor);
        schedule.setLastRevisedDate(LocalDate.now());
        schedule.setNextRevisionDate(LocalDate.now().plusDays(newInterval));

        return revisionRepository.save(schedule);
    }
}
