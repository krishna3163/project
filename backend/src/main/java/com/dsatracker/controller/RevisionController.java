package com.dsatracker.controller;

import com.dsatracker.model.DsaProblem;
import com.dsatracker.model.RevisionSchedule;
import com.dsatracker.model.User;
import com.dsatracker.model.Notification;
import com.dsatracker.repository.DsaProblemRepository;
import com.dsatracker.repository.RevisionScheduleRepository;
import com.dsatracker.repository.UserRepository;
import com.dsatracker.repository.NotificationRepository;
import com.dsatracker.service.RevisionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/revisions")
@RequiredArgsConstructor
public class RevisionController {

    private final RevisionService revisionService;
    private final RevisionScheduleRepository revisionScheduleRepository;
    private final DsaProblemRepository dsaProblemRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public record DueRevisionResponse(
            String scheduleId,
            DsaProblem problem,
            int intervalDays,
            double easeFactor,
            int revisionCount,
            LocalDate nextRevisionDate,
            LocalDate lastRevisedDate
    ) {}

    @GetMapping("/due")
    public ResponseEntity<List<DueRevisionResponse>> getDueRevisions(@AuthenticationPrincipal User user) {
        List<RevisionSchedule> dueSchedules = revisionService.getDueRevisions(user.getId());
        List<DueRevisionResponse> response = new ArrayList<>();

        for (RevisionSchedule s : dueSchedules) {
            Optional<DsaProblem> problemOpt = dsaProblemRepository.findById(s.getProblemId());
            if (problemOpt.isPresent()) {
                response.add(new DueRevisionResponse(
                        s.getId(),
                        problemOpt.get(),
                        s.getIntervalDays(),
                        s.getEaseFactor(),
                        s.getRevisionCount(),
                        s.getNextRevisionDate(),
                        s.getLastRevisedDate()
                ));
            }
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{problemId}/complete")
    public ResponseEntity<?> completeRevision(
            @AuthenticationPrincipal User user,
            @PathVariable String problemId,
            @RequestBody Map<String, Integer> body) {
        
        Integer quality = body.get("quality");
        if (quality == null || quality < 1 || quality > 3) {
            return ResponseEntity.badRequest().body("Quality must be between 1 (Hard) and 3 (Easy)");
        }

        RevisionSchedule updated = revisionService.updateRevision(user.getId(), problemId, quality);

        // Award 15 XP points to the user for revision
        userRepository.findById(user.getId()).ifPresent(u -> {
            u.setXpPoints(u.getXpPoints() + 15);
            userRepository.save(u);

            // Trigger notification
            Optional<DsaProblem> probOpt = dsaProblemRepository.findById(problemId);
            String problemTitle = probOpt.isPresent() ? probOpt.get().getTitle() : "Problem";

            Notification notif = new Notification();
            notif.setUserId(u.getId());
            notif.setType("CONGRATS");
            notif.setMessage("🧠 Revised \"" + problemTitle + "\"! Next revision scheduled in " + updated.getIntervalDays() + " days. +15 XP! 🎉");
            notif.setCreatedAt(Instant.now());
            notificationRepository.save(notif);
        });

        return ResponseEntity.ok(updated);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getRevisionStats(@AuthenticationPrincipal User user) {
        List<RevisionSchedule> all = revisionScheduleRepository.findByUserId(user.getId());
        long total = all.size();
        long completed = all.stream().filter(s -> s.getRevisionCount() > 0).count();
        long due = revisionService.getDueRevisions(user.getId()).size();

        double retentionRate = total == 0 ? 100.0 : ((double) completed / total) * 100.0;

        return ResponseEntity.ok(Map.of(
            "totalRevisions", total,
            "completedRevisions", completed,
            "dueRevisions", due,
            "retentionRate", Math.round(retentionRate)
        ));
    }
}
