package com.dsatracker.service;

import com.dsatracker.model.User;
import com.dsatracker.repository.UserRepository;
import com.dsatracker.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.TimeUnit;

/**
 * Authentication service: OTP generation/verification, JWT issuance.
 *
 * OTP Security:
 * - 6-digit numeric OTP generated via SecureRandom (RandomStringUtils uses java.security.SecureRandom).
 * - Stored in Redis with 5-minute TTL (key: otp:{email}).
 * - Deleted immediately after successful verification.
 * - OTP value never logged.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StringRedisTemplate redisTemplate;
    private final EmailService emailService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.otp.ttl-seconds}")
    private long otpTtlSeconds;

    private final java.util.concurrent.ConcurrentHashMap<String, OtpValue> inMemoryOtpStore = new java.util.concurrent.ConcurrentHashMap<>();

    private record OtpValue(String otp, Instant expiresAt) {}

    /** Generates OTP, stores in Redis, sends email. */
    public void sendOtp(String email) {
        // Use cryptographically secure random numeric OTP
        String otp = String.format("%06d", new java.security.SecureRandom().nextInt(1000000));
        try {
            redisTemplate.opsForValue().set(otpKey(email), otp, otpTtlSeconds, TimeUnit.SECONDS);
            log.info("Saved OTP to Redis for email: [REDACTED]");
        } catch (Exception e) {
            log.warn("Redis is not available. Falling back to in-memory store. Error: {}", e.getMessage());
            inMemoryOtpStore.put(otpKey(email), new OtpValue(otp, Instant.now().plusSeconds(otpTtlSeconds)));
        }
        emailService.sendOtp(email, otp);
        log.info("OTP sent for email: [REDACTED]");
    }

    /** Verifies OTP; returns JWT tokens on success. */
    public AuthResult verifyOtp(String email, String otp) {
        String stored = null;
        boolean usingRedis = true;
        try {
            stored = redisTemplate.opsForValue().get(otpKey(email));
        } catch (Exception e) {
            log.warn("Redis is not available. Reading OTP from in-memory store. Error: {}", e.getMessage());
            usingRedis = false;
            OtpValue val = inMemoryOtpStore.get(otpKey(email));
            if (val != null) {
                if (val.expiresAt().isAfter(Instant.now())) {
                    stored = val.otp();
                } else {
                    inMemoryOtpStore.remove(otpKey(email));
                }
            }
        }

        if (stored == null || !stored.equals(otp)) {
            throw new IllegalArgumentException("Invalid or expired OTP");
        }

        // Delete OTP immediately after use (single-use)
        if (usingRedis) {
            try {
                redisTemplate.delete(otpKey(email));
            } catch (Exception e) {
                log.warn("Failed to delete OTP from Redis: {}", e.getMessage());
            }
        } else {
            inMemoryOtpStore.remove(otpKey(email));
        }

        User user = userRepository.findByEmail(email).orElseGet(() -> registerNewUser(email));
        user.setEmailVerified(true);
        user.setLastActiveDate(Instant.now());

        // Generate new active Session ID for single-device concurrency limits
        String sessionId = java.util.UUID.randomUUID().toString();
        user.setActiveSessionId(sessionId);

        userRepository.save(user);

        String accessToken = jwtUtil.generateToken(user.getId(), sessionId);
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());
        return new AuthResult(accessToken, refreshToken, user.getId(), user.getName(), user.getEmail());
    }

    public AuthResult refreshToken(String refreshToken) {
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new IllegalArgumentException("Invalid refresh token");
        }
        String userId = jwtUtil.extractUserId(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Pass the user's active session ID to the new access token
        String newAccess = jwtUtil.generateToken(userId, user.getActiveSessionId());
        return new AuthResult(newAccess, refreshToken, user.getId(), user.getName(), user.getEmail());
    }

    private User registerNewUser(String email) {
        User u = new User();
        u.setEmail(email);
        u.setName(email.split("@")[0]); // default name from email prefix
        u.setCreatedAt(Instant.now());
        User saved = userRepository.save(u);
        try {
            emailService.sendWelcomeEmail(saved.getEmail(), saved.getName());
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}: {}", saved.getEmail(), e.getMessage());
        }
        return saved;
    }

    private String otpKey(String email) {
        return "otp:" + email.toLowerCase().trim();
    }

    public record AuthResult(String accessToken, String refreshToken,
                             String userId, String name, String email) {}
}
