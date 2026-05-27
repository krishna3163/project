package com.dsatracker.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;

/**
 * Enables Spring @Retryable annotation support.
 * Used by EmailService for retry-on-failure with exponential backoff.
 * Requires spring-retry on the classpath (included via spring-boot-starter).
 */
@Configuration
@EnableRetry
public class RetryConfig {
}
