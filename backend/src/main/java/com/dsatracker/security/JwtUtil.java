package com.dsatracker.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT utility using jjwt 0.12.x.
 *
 * Security rules enforced:
 * - Algorithm hardcoded to HS256 (never derived from token header).
 * - 'none' algorithm rejected by jjwt by default with hardcoded verifier.
 * - 'exp' claim set and validated on every parse.
 * - Secret loaded from env-var; app fails-fast if absent.
 */
@Slf4j
@Component
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String jwtSecretStr;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        // Fail fast if secret is missing or too short
        if (jwtSecretStr == null || jwtSecretStr.isBlank()) {
            throw new IllegalStateException("JWT_SECRET env variable is not set. Refusing to start.");
        }
        if (jwtSecretStr.length() < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 characters long.");
        }
        this.secretKey = Keys.hmacShaKeyFor(jwtSecretStr.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String userId) {
        return generateToken(userId, "");
    }

    public String generateToken(String userId, String sessionId) {
        return Jwts.builder()
                .subject(userId)
                .claim("sid", sessionId != null ? sessionId : "")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(String userId) {
        return buildToken(userId, refreshExpirationMs);
    }

    private String buildToken(String subject, long ttlMs) {
        return Jwts.builder()
                .subject(subject)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + ttlMs))
                .signWith(secretKey, SignatureAlgorithm.HS256) // algorithm hardcoded
                .compact();
    }

    /** Returns userId extracted from a valid, non-expired token; throws on error. */
    public String extractUserId(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractSessionId(String token) {
        Object sid = parseClaims(token).get("sid");
        return sid != null ? String.valueOf(sid) : "";
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            // Do NOT log the token itself — it is a credential
            log.warn("JWT validation failed: {}", e.getClass().getSimpleName());
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
