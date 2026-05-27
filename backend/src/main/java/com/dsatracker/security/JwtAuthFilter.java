package com.dsatracker.security;

import com.dsatracker.model.User;
import com.dsatracker.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.stream.Collectors;

/**
 * Validates Bearer JWT token on every protected request.
 * Fail-safe: any error → SecurityContext stays empty → 401.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        try {
            String token = extractToken(request);
            if (token != null && jwtUtil.validateToken(token)) {
                String userId = jwtUtil.extractUserId(token);
                User user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    // Verify single active device session ID matches
                    String sid = jwtUtil.extractSessionId(token);
                    if (user.getActiveSessionId() != null && !user.getActiveSessionId().isEmpty() && !user.getActiveSessionId().equals(sid)) {
                        log.warn("Stale session detected for user {}. Invalidating duplicate device login.", user.getEmail());
                        SecurityContextHolder.clearContext();
                        chain.doFilter(request, response);
                        return;
                    }
                    var authorities = user.getRoles().stream()
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());
                    var auth = new UsernamePasswordAuthenticationToken(user, null, authorities);
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        } catch (Exception e) {
            // Fail safe: deny access
            log.warn("JWT filter error: {}", e.getClass().getSimpleName());
            SecurityContextHolder.clearContext();
        }
        chain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
