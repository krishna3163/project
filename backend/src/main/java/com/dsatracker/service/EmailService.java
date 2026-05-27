package com.dsatracker.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Email service using Gmail SMTP.
 * - All sends are async (@Async) so callers never block.
 * - Retries up to 3 times with exponential backoff on failure.
 * - HTML templates used for beautiful branded emails.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000, multiplier = 2))
    public void sendOtp(String to, String otp) {
        String subject = "🔐 Your DSA Tracker OTP";
        String html = """
            <div style="font-family: Inter, Arial, sans-serif; max-width:600px; margin:auto;
                        background: linear-gradient(135deg, #0f172a, #1e293b); padding:40px;
                        border-radius:16px; color:#f1f5f9;">
              <h1 style="color:#6366f1; margin-bottom:8px;">DSA Tracker</h1>
              <h2 style="margin-top:0;">Your One-Time Password</h2>
              <div style="background:#1e3a5f; border-radius:12px; padding:24px; text-align:center;
                          margin:24px 0; border:1px solid #3b82f6;">
                <span style="font-size:48px; font-weight:700; letter-spacing:12px; color:#60a5fa;">%s</span>
              </div>
              <p style="color:#94a3b8;">This OTP expires in <strong style="color:#f1f5f9;">5 minutes</strong>.</p>
              <p style="color:#94a3b8;">If you didn't request this, please ignore this email.</p>
              <hr style="border-color:#334155; margin:24px 0;">
              <p style="color:#64748b; font-size:12px;">© 2025 DSA Tracker Platform</p>
            </div>
            """.formatted(otp);
        sendHtml(to, subject, html);
    }

    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000, multiplier = 2))
    public void sendCongratulations(String to, String name, String achievement) {
        String subject = "🎉 Congratulations! – " + achievement;
        String html = """
            <div style="font-family: Inter, Arial, sans-serif; max-width:600px; margin:auto;
                        background: linear-gradient(135deg, #0f172a, #1e293b); padding:40px;
                        border-radius:16px; color:#f1f5f9;">
              <h1 style="color:#f59e0b;">🏆 Achievement Unlocked!</h1>
              <h2>Hey %s!</h2>
              <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed); border-radius:12px;
                          padding:24px; margin:24px 0; text-align:center;">
                <p style="font-size:20px; font-weight:600; margin:0;">%s</p>
              </div>
              <p style="color:#94a3b8;">Keep up the amazing work! Your dedication is paying off.</p>
              <a href="%s/dashboard" style="display:inline-block; background:#6366f1; color:#fff;
                 padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:600;
                 margin-top:16px;">View Dashboard</a>
              <hr style="border-color:#334155; margin:24px 0;">
              <p style="color:#64748b; font-size:12px;">© 2025 DSA Tracker Platform</p>
            </div>
            """.formatted(name, achievement, frontendUrl);
        sendHtml(to, subject, html);
    }

    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000, multiplier = 2))
    public void sendContestReminder(String to, String contestName, String platform,
                                    String startTime, String contestUrl) {
        String subject = "⏰ Contest Reminder: " + contestName;
        String html = """
            <div style="font-family: Inter, Arial, sans-serif; max-width:600px; margin:auto;
                        background: linear-gradient(135deg, #0f172a, #1e293b); padding:40px;
                        border-radius:16px; color:#f1f5f9;">
              <h1 style="color:#22d3ee;">⏰ Contest Starts in 1 Hour!</h1>
              <div style="background:#164e63; border-radius:12px; padding:24px; margin:24px 0;
                          border-left:4px solid #22d3ee;">
                <h2 style="margin:0 0 8px 0; color:#f1f5f9;">%s</h2>
                <p style="margin:0; color:#7dd3fc;">Platform: <strong>%s</strong></p>
                <p style="margin:4px 0 0 0; color:#7dd3fc;">Starts: <strong>%s</strong></p>
              </div>
              <a href="%s" style="display:inline-block; background:#0891b2; color:#fff;
                 padding:14px 32px; border-radius:8px; text-decoration:none; font-weight:700;
                 font-size:16px; margin-top:8px;">Join Contest →</a>
              <hr style="border-color:#334155; margin:24px 0;">
              <p style="color:#64748b; font-size:12px;">© 2025 DSA Tracker Platform</p>
            </div>
            """.formatted(contestName, platform, startTime, contestUrl);
        sendHtml(to, subject, html);
    }

    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000, multiplier = 2))
    public void sendMockTestResult(String to, String name, int score, int rank,
                                   long totalUsers, String badge, String testTitle) {
        String subject = "📊 Your Mock Test Results – " + testTitle;
        String badgeColor = switch (badge) {
            case "GOLD" -> "#f59e0b";
            case "SILVER" -> "#94a3b8";
            case "BRONZE" -> "#b45309";
            default -> "#6366f1";
        };
        String html = """
            <div style="font-family: Inter, Arial, sans-serif; max-width:600px; margin:auto;
                        background: linear-gradient(135deg, #0f172a, #1e293b); padding:40px;
                        border-radius:16px; color:#f1f5f9;">
              <h1 style="color:#6366f1;">📊 Test Results</h1>
              <h2 style="color:#f1f5f9;">%s</h2>
              <div style="display:flex; gap:16px; margin:24px 0; flex-wrap:wrap;">
                <div style="flex:1; background:#1e293b; border:1px solid #334155; border-radius:12px;
                            padding:20px; text-align:center; min-width:120px;">
                  <p style="color:#94a3b8; margin:0;">Score</p>
                  <p style="font-size:36px; font-weight:700; color:#60a5fa; margin:8px 0;">%d</p>
                </div>
                <div style="flex:1; background:#1e293b; border:1px solid #334155; border-radius:12px;
                            padding:20px; text-align:center; min-width:120px;">
                  <p style="color:#94a3b8; margin:0;">Rank</p>
                  <p style="font-size:36px; font-weight:700; color:#34d399; margin:8px 0;">#%d</p>
                </div>
                <div style="flex:1; background:#1e293b; border:1px solid #334155; border-radius:12px;
                            padding:20px; text-align:center; min-width:120px;">
                  <p style="color:#94a3b8; margin:0;">Badge</p>
                  <p style="font-size:24px; font-weight:700; color:%s; margin:8px 0;">%s</p>
                </div>
              </div>
              <p style="color:#94a3b8;">Total participants: %d. Keep practicing!</p>
              <hr style="border-color:#334155; margin:24px 0;">
              <p style="color:#64748b; font-size:12px;">© 2025 DSA Tracker Platform</p>
            </div>
            """.formatted(testTitle, score, rank, badgeColor, badge, totalUsers);
        sendHtml(to, subject, html);
    }

    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000, multiplier = 2))
    public void sendMockTestResultWithPdf(String to, String name, int score, int rank,
                                          long totalUsers, String badge, String testTitle,
                                          byte[] pdfData, String pdfFilename) {
        String subject = "🎯 Your Mock Test Results & Report - " + testTitle;
        String badgeColor = switch (badge) {
            case "GOLD" -> "#f59e0b";
            case "SILVER" -> "#94a3b8";
            case "BRONZE" -> "#b45309";
            default -> "#6366f1";
        };
        String html = """
            <div style="font-family: Inter, Arial, sans-serif; max-width:600px; margin:auto;
                        background: linear-gradient(135deg, #0f172a, #1e293b); padding:40px;
                        border-radius:16px; color:#f1f5f9;">
              <h1 style="color:#6366f1;">🎯 PrepNest Test Report</h1>
              <h2 style="color:#f1f5f9;">Congratulations, %s! 🎉</h2>
              <p style="color:#94a3b8;">You have successfully completed <strong>%s</strong>.</p>
              <div style="display:flex; gap:16px; margin:24px 0; flex-wrap:wrap;">
                <div style="flex:1; background:#1e293b; border:1px solid #334155; border-radius:12px;
                            padding:20px; text-align:center; min-width:120px;">
                  <p style="color:#94a3b8; margin:0;">Score</p>
                  <p style="font-size:36px; font-weight:700; color:#60a5fa; margin:8px 0;">%d</p>
                </div>
                <div style="flex:1; background:#1e293b; border:1px solid #334155; border-radius:12px;
                            padding:20px; text-align:center; min-width:120px;">
                  <p style="color:#94a3b8; margin:0;">Rank</p>
                  <p style="font-size:36px; font-weight:700; color:#34d399; margin:8px 0;">#%d</p>
                </div>
                <div style="flex:1; background:#1e293b; border:1px solid #334155; border-radius:12px;
                            padding:20px; text-align:center; min-width:120px;">
                  <p style="color:#94a3b8; margin:0;">Badge</p>
                  <p style="font-size:24px; font-weight:700; color:%s; margin:8px 0;">%s</p>
                </div>
              </div>
              <p style="color:#94a3b8;">Your detailed candidate performance report has been compiled and is attached as a PDF file to this email.</p>
              <p style="color:#94a3b8;">Keep up the hard work and continue honing your DSA skills on PrepNest!</p>
              <hr style="border-color:#334155; margin:24px 0;">
              <p style="color:#64748b; font-size:12px;">© 2026 PrepNest by DSA Tracker</p>
            </div>
            """.formatted(name, testTitle, score, rank, badgeColor, badge);

        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);

            // Attach PDF
            helper.addAttachment(pdfFilename, new org.springframework.core.io.ByteArrayResource(pdfData), "application/pdf");

            mailSender.send(msg);
            log.info("Mock test results email with PDF report sent successfully to: [REDACTED]");
        } catch (Exception e) {
            log.error("Failed to send mock test email with PDF: {}", e.getMessage());
            throw new RuntimeException("Email report dispatch failed", e);
        }
    }

    private void sendHtml(String to, String subject, String html) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(msg);
            log.info("Email sent to: [REDACTED] subject: {}", subject);
        } catch (MessagingException e) {
            log.error("Failed to send email: {}", e.getMessage());
            throw new RuntimeException("Email send failed", e);
        }
    }
}
