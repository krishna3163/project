package com.dsatracker.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

/**
 * Core user document.
 * Passwords are stored as BCrypt hashes — never plaintext.
 * TODO(security): Consider adding OAuth2 provider integration.
 * TODO(security): Consider adding MFA (TOTP) support.
 * TODO(security): Consider leaked-password detection on registration.
 */
@Data
@NoArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    /** BCrypt-hashed password. Never store plaintext. */
    private String password;

    private Set<String> roles = new HashSet<>(Set.of("ROLE_USER"));

    private boolean emailVerified = false;

    @CreatedDate
    private Instant createdAt;

    private Instant updatedAt;

    // Gamification
    private int xpPoints = 0;
    private int dailyStreak = 0;
    private Instant lastActiveDate;
    private Set<String> badges = new HashSet<>();

    // LeetCode Integration
    private String leetcodeUsername;
    private int leetcodeEasySolved = 0;
    private int leetcodeMediumSolved = 0;
    private int leetcodeHardSolved = 0;
    private int leetcodeRanking = 0;

    // Advanced Profile Information
    private String dob;
    private String phone;
    private String githubLink;
    private String hackerrankLink;
    private String hackerearthLink;
    private String linkedinLink;
    private Set<String> activeDates = new HashSet<>();
    private String activeSessionId;
    private java.util.List<String> leetcodeFriends = new java.util.ArrayList<>();

    @org.springframework.data.annotation.Transient
    private long globalRank;
}
