package com.dsatracker.service;

import com.dsatracker.model.Contest;
import com.dsatracker.model.Notification;
import com.dsatracker.model.User;
import com.dsatracker.repository.ContestRepository;
import com.dsatracker.repository.NotificationRepository;
import com.dsatracker.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Contest service:
 * 1. Fetches contests from external APIs every 6 hours.
 * 2. Sends email reminders 1 hour before start (every 30 min scheduler).
 * 3. Caches upcoming contests in Redis (TTL 1 hour).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ContestService {

    private final ContestRepository contestRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    /** Fetch upcoming contests. */
    public Page<Contest> getUpcoming(Pageable pageable) {
        return contestRepository.findByStartTimeAfterOrderByStartTimeAsc(Instant.now(), pageable);
    }

    /**
     * Scheduler: Fetch contests from all platforms every 6 hours.
     * The cron expression runs at minute 0 of every 6th hour.
     */
    @Scheduled(cron = "0 0 */6 * * *")
    public void fetchContests() {
        log.info("Fetching contests from external APIs...");
        fetchHackerRankContests();
        fetchHackerEarthContests();
        fetchLeetCodeContests();
        log.info("Contest fetch complete.");
    }

    /**
     * Scheduler: Send reminders every 30 minutes for contests starting within 1 hour.
     */
    @Scheduled(cron = "0 */30 * * * *")
    public void sendContestReminders() {
        Instant now = Instant.now();
        Instant oneHourLater = now.plusSeconds(3600);
        List<Contest> upcoming = contestRepository.findByStartTimeBetweenAndNotifiedFalse(now, oneHourLater);

        if (upcoming.isEmpty()) return;

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a z")
                .withZone(ZoneId.of("Asia/Kolkata"));

        int totalUsersNotified = 0;
        int pageSize = 100;
        int pageNumber = 0;
        Page<User> userPage;

        do {
            userPage = userRepository.findAll(org.springframework.data.domain.PageRequest.of(pageNumber, pageSize));
            List<User> users = userPage.getContent();
            for (Contest contest : upcoming) {
                String startTime = fmt.format(contest.getStartTime());
                for (User user : users) {
                    // Honor preferences
                    if (!user.isContestRemindersEnabled()) {
                        continue;
                    }
                    emailService.sendContestReminder(user.getEmail(), contest.getName(),
                            contest.getPlatform(), startTime, contest.getUrl(), contest.getStartTime(), contest.getEndTime());
                    // In-app notification
                    Notification notif = new Notification();
                    notif.setUserId(user.getId());
                    notif.setType("REMINDER");
                    notif.setMessage("⏰ " + contest.getName() + " starts in 1 hour!");
                    notif.setActionUrl(contest.getUrl());
                    notif.setCreatedAt(Instant.now());
                    notificationRepository.save(notif);
                    totalUsersNotified++;
                }
            }
            pageNumber++;
        } while (userPage.hasNext());

        for (Contest contest : upcoming) {
            contest.setNotified(true);
            contestRepository.save(contest);
        }
        log.info("Sent reminders for {} contests to {} users", upcoming.size(), totalUsersNotified);
    }

    private void fetchHackerRankContests() {
        try {
            String url = "https://www.hackerrank.com/rest/contests/upcoming?limit=20";
            String json = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(json);
            JsonNode models = root.path("models");
            if (models.isArray()) {
                for (JsonNode node : models) {
                    upsertContest(
                        "HACKERRANK",
                        node.path("name").asText(),
                        Instant.ofEpochSecond(node.path("startTime").asLong()),
                        Instant.ofEpochSecond(node.path("endTime").asLong()),
                        "https://www.hackerrank.com/contests/" + node.path("slug").asText()
                    );
                }
            }
        } catch (Exception e) {
            log.warn("HackerRank contest fetch failed: {}", e.getMessage());
        }
    }

    private void fetchHackerEarthContests() {
        try {
            String url = "https://www.hackerearth.com/chrome-extension/events/";
            String json = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(json);
            JsonNode response = root.path("response");
            if (response.isArray()) {
                for (JsonNode node : response) {
                    String status = node.path("status").asText();
                    if ("upcoming".equalsIgnoreCase(status)) {
                        upsertContest(
                            "HACKEREARTH",
                            node.path("title").asText(),
                            Instant.parse(node.path("start_utc_tz").asText()),
                            Instant.parse(node.path("end_utc_tz").asText()),
                            node.path("url").asText()
                        );
                    }
                }
            }
        } catch (Exception e) {
            log.warn("HackerEarth contest fetch failed: {}", e.getMessage());
        }
    }

    private void fetchLeetCodeContests() {
        try {
            // LeetCode GraphQL API for contests
            String query = "{\"query\":\"{upcomingContests{title titleSlug startTime duration}}\"}";
            String url = "https://leetcode.com/graphql";
            var headers = new org.springframework.http.HttpHeaders();
            headers.set("Content-Type", "application/json");
            var entity = new org.springframework.http.HttpEntity<>(query, headers);
            var response = restTemplate.postForObject(url, entity, String.class);
            JsonNode root = objectMapper.readTree(response);
            JsonNode contests = root.path("data").path("upcomingContests");
            if (contests.isArray()) {
                for (JsonNode node : contests) {
                    long start = node.path("startTime").asLong();
                    long dur = node.path("duration").asLong();
                    upsertContest(
                        "LEETCODE",
                        node.path("title").asText(),
                        Instant.ofEpochSecond(start),
                        Instant.ofEpochSecond(start + dur),
                        "https://leetcode.com/contest/" + node.path("titleSlug").asText()
                    );
                }
            }
        } catch (Exception e) {
            log.warn("LeetCode contest fetch failed: {}", e.getMessage());
        }
    }

    private void upsertContest(String platform, String name, Instant start, Instant end, String url) {
        if (!contestRepository.existsByPlatformAndName(platform, name)) {
            Contest c = new Contest();
            c.setPlatform(platform);
            c.setName(name);
            c.setStartTime(start);
            c.setEndTime(end);
            c.setUrl(url);
            contestRepository.save(c);
        }
    }
}
