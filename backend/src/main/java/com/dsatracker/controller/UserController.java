package com.dsatracker.controller;

import com.dsatracker.model.User;
import com.dsatracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<User> getMe(@AuthenticationPrincipal User user) {
        // Fetch fresh from DB to ensure latest data
        return ResponseEntity.ok(userRepository.findById(user.getId()).orElseThrow());
    }

    @PatchMapping("/me")
    public ResponseEntity<User> updateMe(
            @RequestBody UpdateRequest req,
            @AuthenticationPrincipal User user) {
        User u = userRepository.findById(user.getId()).orElseThrow();
        if (req.name() != null && !req.name().isBlank()) {
            u.setName(req.name().trim());
        }
        return ResponseEntity.ok(userRepository.save(u));
    }

    public record UpdateRequest(String name) {}
}
