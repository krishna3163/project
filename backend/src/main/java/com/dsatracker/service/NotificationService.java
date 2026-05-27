package com.dsatracker.service;

import com.dsatracker.model.Notification;
import com.dsatracker.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public Page<Notification> getUserNotifications(String userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    /** Mark a single notification as read — only if owned by userId */
    public Notification markRead(String notifId, String userId) {
        Notification n = notificationRepository.findById(notifId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!n.getUserId().equals(userId)) throw new SecurityException("Access denied");
        n.setRead(true);
        return notificationRepository.save(n);
    }

    /** Mark all of user's notifications as read */
    public void markAllRead(String userId) {
        Page<Notification> page = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, Pageable.unpaged());
        page.forEach(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }
}
