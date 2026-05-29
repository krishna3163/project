package com.dsatracker.dto;

import com.dsatracker.model.User;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.Set;

@Data
@NoArgsConstructor
public class UserDto {
    private String id;
    private String name;
    private String email;
    private Set<String> roles;
    private boolean emailVerified;
    private Instant createdAt;
    private Instant updatedAt;
    private int xpPoints;
    private int coins;
    private int dailyStreak;
    private int maxStreak;
    private Instant lastActiveDate;
    private Set<String> badges;
    private java.util.Map<String, Boolean> dailyQuests;
    private boolean contestRemindersEnabled;
    private String leetcodeUsername;
    private int leetcodeEasySolved;
    private int leetcodeMediumSolved;
    private int leetcodeHardSolved;
    private int leetcodeRanking;
    private String dob;
    private String phone;
    private String githubLink;
    private String hackerrankLink;
    private String hackerearthLink;
    private String linkedinLink;
    private Set<String> activeDates;
    private java.util.List<String> leetcodeFriends;
    private long globalRank;

    public static UserDto fromEntity(User user) {
        if (user == null) return null;
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRoles(user.getRoles());
        dto.setEmailVerified(user.isEmailVerified());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setXpPoints(user.getXpPoints());
        dto.setCoins(user.getCoins());
        dto.setDailyStreak(user.getDailyStreak());
        dto.setMaxStreak(user.getMaxStreak());
        dto.setLastActiveDate(user.getLastActiveDate());
        dto.setBadges(user.getBadges());
        dto.setDailyQuests(user.getDailyQuests());
        dto.setContestRemindersEnabled(user.isContestRemindersEnabled());
        dto.setLeetcodeUsername(user.getLeetcodeUsername());
        dto.setLeetcodeEasySolved(user.getLeetcodeEasySolved());
        dto.setLeetcodeMediumSolved(user.getLeetcodeMediumSolved());
        dto.setLeetcodeHardSolved(user.getLeetcodeHardSolved());
        dto.setLeetcodeRanking(user.getLeetcodeRanking());
        dto.setDob(user.getDob());
        dto.setPhone(user.getPhone());
        dto.setGithubLink(user.getGithubLink());
        dto.setHackerrankLink(user.getHackerrankLink());
        dto.setHackerearthLink(user.getHackerearthLink());
        dto.setLinkedinLink(user.getLinkedinLink());
        dto.setActiveDates(user.getActiveDates());
        dto.setLeetcodeFriends(user.getLeetcodeFriends());
        dto.setGlobalRank(user.getGlobalRank());
        return dto;
    }
}
