package com.dsatracker.controller;

import com.dsatracker.model.User;
import com.dsatracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final UserRepository userRepository;

    @GetMapping("/global")
    public ResponseEntity<Page<User>> getGlobalLeaderboard(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        // Return users sorted by xpPoints descending
        Page<User> topUsers = userRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "xpPoints"))
        );
        
        return ResponseEntity.ok(topUsers);
    }
}
