package com.dsatracker.service;

import com.dsatracker.model.DsaProblem;
import com.dsatracker.model.InterviewSession;
import com.dsatracker.model.User;
import com.dsatracker.model.Notification;
import com.dsatracker.repository.DsaProblemRepository;
import com.dsatracker.repository.InterviewSessionRepository;
import com.dsatracker.repository.UserRepository;
import com.dsatracker.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewSessionRepository sessionRepository;
    private final DsaProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    public InterviewSession scheduleOrMatch(String userId, Instant scheduledTime) {
        // Truncate to hours to enforce 1-hour slots
        Instant normalizedTime = scheduledTime.truncatedTo(ChronoUnit.HOURS);

        // Check if user already has a session at this time
        if (sessionRepository.findByHostUserIdAndScheduledTime(userId, normalizedTime).isPresent()) {
            throw new IllegalArgumentException("You already have an interview scheduled at this time.");
        }

        // Try to find a pending slot from another user
        Optional<InterviewSession> availableSlot = sessionRepository.findAvailableSlotForTime(normalizedTime, userId);

        if (availableSlot.isPresent()) {
            InterviewSession session = availableSlot.get();
            session.setPeerUserId(userId);
            session.setStatus(InterviewSession.Status.MATCHED);
            session.setJitsiRoomName("prepnest-mock-" + UUID.randomUUID().toString());
            
            // Assign a random problem from the DB
            List<DsaProblem> problems = problemRepository.findAll();
            if (!problems.isEmpty()) {
                DsaProblem randomProblem = problems.get(new java.util.Random().nextInt(problems.size()));
                session.setProblemId(randomProblem.getId());
            }

            session.setUpdatedAt(Instant.now());
            sessionRepository.save(session);
            
            // Send matching emails
            sendMatchEmails(session);
            
            return session;
        } else {
            // Create a new pending slot
            InterviewSession newSession = new InterviewSession();
            newSession.setHostUserId(userId);
            newSession.setScheduledTime(normalizedTime);
            newSession.setStatus(InterviewSession.Status.PENDING);
            return sessionRepository.save(newSession);
        }
    }

    public List<InterviewSession> getMySessions(String userId) {
        return sessionRepository.findByHostUserIdOrPeerUserIdOrderByScheduledTimeAsc(userId, userId);
    }

    public InterviewSession submitReview(String sessionId, String userId, int rating, String feedback) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!session.getStatus().equals(InterviewSession.Status.MATCHED) && !session.getStatus().equals(InterviewSession.Status.COMPLETED)) {
            throw new IllegalArgumentException("Cannot review a session that is not matched.");
        }

        boolean isHost = userId.equals(session.getHostUserId());
        boolean isPeer = userId.equals(session.getPeerUserId());

        if (!isHost && !isPeer) {
            throw new IllegalArgumentException("You are not part of this session.");
        }

        if (isHost) {
            session.setHostRatingOfPeer(rating);
            session.setFeedbackFromHost(feedback);
        } else {
            session.setPeerRatingOfHost(rating);
            session.setFeedbackFromPeer(feedback);
        }

        // If both have reviewed, mark as completed
        if (session.getHostRatingOfPeer() != null && session.getPeerRatingOfHost() != null) {
            session.setStatus(InterviewSession.Status.COMPLETED);
        }

        session.setUpdatedAt(Instant.now());
        InterviewSession saved = sessionRepository.save(session);

        // Award 50 XP to the reviewer
        userRepository.findById(userId).ifPresent(reviewer -> {
            reviewer.setXpPoints(reviewer.getXpPoints() + 50);
            userRepository.save(reviewer);

            Notification notif = new Notification();
            notif.setUserId(reviewer.getId());
            notif.setType("CONGRATS");
            notif.setMessage("🤝 Thank you for reviewing your peer! +50 XP awarded! 🎉");
            notif.setCreatedAt(Instant.now());
            notificationRepository.save(notif);
        });

        return saved;
    }

    public InterviewSession regenerateProblem(String sessionId, String userId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!session.getHostUserId().equals(userId) && (session.getPeerUserId() == null || !session.getPeerUserId().equals(userId))) {
            throw new SecurityException("Not part of this mock interview session");
        }

        List<DsaProblem> problems = problemRepository.findAll();
        if (!problems.isEmpty()) {
            DsaProblem randomProblem = problems.get(new java.util.Random().nextInt(problems.size()));
            session.setProblemId(randomProblem.getId());
            session.setUpdatedAt(Instant.now());
            sessionRepository.save(session);
        }

        return session;
    }

    private void sendMatchEmails(InterviewSession session) {
        try {
            User host = userRepository.findById(session.getHostUserId()).orElse(null);
            User peer = userRepository.findById(session.getPeerUserId()).orElse(null);

            if (host != null && peer != null) {
                log.info("Matched {} with {} for mock interview at {}", host.getEmail(), peer.getEmail(), session.getScheduledTime());
                
                // Add match notifications for both
                Notification n1 = new Notification();
                n1.setUserId(host.getId());
                n1.setType("INFO");
                n1.setMessage("🎯 Matched with peer " + peer.getName() + " for mock interview!");
                n1.setCreatedAt(Instant.now());
                notificationRepository.save(n1);

                Notification n2 = new Notification();
                n2.setUserId(peer.getId());
                n2.setType("INFO");
                n2.setMessage("🎯 Matched with peer " + host.getName() + " for mock interview!");
                n2.setCreatedAt(Instant.now());
                notificationRepository.save(n2);
            }
        } catch (Exception e) {
            log.error("Failed to send match emails", e);
        }
    }

    // Runs every 15 minutes to send 1-hour reminders
    @Scheduled(fixedRate = 900000)
    public void sendReminders() {
        Instant oneHourFromNow = Instant.now().plus(1, ChronoUnit.HOURS);
        List<InterviewSession> upcoming = sessionRepository.findByScheduledTimeAfterAndStatus(Instant.now(), InterviewSession.Status.MATCHED)
            .stream()
            .filter(s -> s.getScheduledTime().isBefore(oneHourFromNow.plus(15, ChronoUnit.MINUTES)))
            .collect(Collectors.toList());

        for (InterviewSession session : upcoming) {
            log.info("Sending reminder for session {}", session.getId());
            // Create in-app system notifications for both peers
            if (session.getHostUserId() != null) {
                Notification n1 = new Notification();
                n1.setUserId(session.getHostUserId());
                n1.setType("INFO");
                n1.setMessage("⏰ Upcoming Mock Interview in 1 hour! Get ready!");
                n1.setCreatedAt(Instant.now());
                notificationRepository.save(n1);
            }
            if (session.getPeerUserId() != null) {
                Notification n2 = new Notification();
                n2.setUserId(session.getPeerUserId());
                n2.setType("INFO");
                n2.setMessage("⏰ Upcoming Mock Interview in 1 hour! Get ready!");
                n2.setCreatedAt(Instant.now());
                notificationRepository.save(n2);
            }
        }
    }
}
