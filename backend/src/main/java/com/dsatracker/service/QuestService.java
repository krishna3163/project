package com.dsatracker.service;

import com.dsatracker.model.User;
import com.dsatracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class QuestService {

    private final UserRepository userRepository;

    public void initializeDailyQuests(User user) {
        String today = LocalDate.now().toString();
        
        // We prefix quests with date so they naturally reset.
        Map<String, Boolean> quests = user.getDailyQuests();
        if (quests == null) {
            quests = new HashMap<>();
        }
        
        // Check if today's quests exist
        boolean hasTodaysQuests = quests.keySet().stream().anyMatch(k -> k.startsWith(today));
        
        if (!hasTodaysQuests) {
            // Clean up old quests to prevent map from growing infinitely
            quests.clear();
            
            // Assign 3 random/fixed quests for today
            quests.put(today + "_SOLVE_POTD", false);
            quests.put(today + "_TAKE_MOCK_TEST", false);
            quests.put(today + "_UPLOAD_NOTE", false);
            
            user.setDailyQuests(quests);
            userRepository.save(user);
        }
    }

    public boolean completeQuest(String userId, String questSuffix, int coinReward) {
        User user = userRepository.findById(userId).orElseThrow();
        String today = LocalDate.now().toString();
        String questKey = today + "_" + questSuffix;
        
        Map<String, Boolean> quests = user.getDailyQuests();
        if (quests != null && quests.containsKey(questKey)) {
            if (!quests.get(questKey)) {
                // Mark complete and reward coins
                quests.put(questKey, true);
                user.setCoins(user.getCoins() + coinReward);
                userRepository.save(user);
                return true;
            }
        }
        return false;
    }
}
