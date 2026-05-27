package com.dsatracker.controller;

import com.dsatracker.service.AuthService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Auth controller: OTP flow + JWT refresh.
 * - OTP sent to email in request body, not query params.
 * - Rate limiting: TODO(security) add spring-rate-limiter or Redis-based rate limiting.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

    private final AuthService authService;

    public static record SendOtpRequest(
            @Email(message = "Invalid email") @NotBlank String email) {
    }

    public static record VerifyOtpRequest(
            @Email(message = "Invalid email") @NotBlank String email,
            @NotBlank @Pattern(regexp = "\\d{6}", message = "OTP must be 6 digits") String otp) {
    }

    public static record RefreshRequest(
            @NotBlank @Size(min = 10) String refreshToken) {
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        authService.sendOtp(request.email().toLowerCase().trim());
        return ResponseEntity.ok(Map.of("message", "OTP sent to email"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        AuthService.AuthResult result = authService.verifyOtp(request.email().toLowerCase().trim(), request.otp());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@Valid @RequestBody RefreshRequest request) {
        AuthService.AuthResult result = authService.refreshToken(request.refreshToken());
        return ResponseEntity.ok(result);
    }
}
