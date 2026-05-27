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
        String calUrl = generateGoogleCalendarUrl(testTitle, "Practice session on mock contest " + testTitle + ". Score: " + score + "/" + totalUsers + ". Let's keep refining our skills!");
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
              <div style="margin:24px 0; text-align:center;">
                <a href="%s" style="display:inline-block; background:#0f9d58; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px; box-shadow: 0 4px 12px rgba(15,157,88,0.3);">
                  📅 Add Next Practice to Google Calendar
                </a>
              </div>
              <hr style="border-color:#334155; margin:24px 0;">
              <p style="color:#64748b; font-size:12px;">© 2025 DSA Tracker Platform</p>
            </div>
            """.formatted(testTitle, score, rank, badgeColor, badge, totalUsers, calUrl);
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
        String calUrl = generateGoogleCalendarUrl(testTitle, "Detailed analysis practice on PrepNest: " + testTitle + ". Solved score: " + score + ". Let's make it to the top leaderboard next!");
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
              <div style="margin:24px 0; text-align:center;">
                <a href="%s" style="display:inline-block; background:#0f9d58; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px; box-shadow: 0 4px 12px rgba(15,157,88,0.3);">
                  📅 Add Next Practice to Google Calendar
                </a>
              </div>
              <hr style="border-color:#334155; margin:24px 0;">
              <p style="color:#64748b; font-size:12px;">© 2026 PrepNest by DSA Tracker</p>
            </div>
            """.formatted(name, testTitle, score, rank, badgeColor, badge, calUrl);

        String htmlWithQuote = injectQuote(html);

        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromEmail, "PrepNest (no-reply)");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlWithQuote, true);

            // Attach PDF
            helper.addAttachment(pdfFilename, new org.springframework.core.io.ByteArrayResource(pdfData), "application/pdf");

            mailSender.send(msg);
            log.info("Mock test results email with PDF report sent successfully to: [REDACTED]");
        } catch (Exception e) {
            log.error("Failed to send mock test email with PDF: {}", e.getMessage());
            throw new RuntimeException("Email report dispatch failed", e);
        }
    }

    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000, multiplier = 2))
    public void sendWelcomeEmail(String to, String name) {
        String subject = "🚀 Welcome to PrepNest! Let's Master DSA Together!";
        String html = """
            <div style="font-family: Inter, Arial, sans-serif; max-width:600px; margin:auto;
                        background: linear-gradient(135deg, #0f172a, #1e293b); padding:40px;
                        border-radius:16px; color:#f1f5f9;">
              <h1 style="color:#6366f1;">🚀 Welcome to PrepNest, %s!</h1>
              <h2>Your Ultimate DSA & Mock Test Partner</h2>
              <p style="color:#94a3b8; font-size:14px; line-height:1.6;">
                We are thrilled to have you join our elite community of developers! PrepNest is built to help you track your learning journey, synchronize external submissions, compete on leaderboards, and excel in SDE interviews.
              </p>
              <div style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:20px; margin:24px 0;">
                <h3 style="color:#60a5fa; margin-top:0;">Key Features You Can Explore:</h3>
                <ul style="color:#cbd5e1; font-size:13px; line-height:1.8; padding-left:20px; margin-bottom:0;">
                  <li><strong>DSA Tracker:</strong> Interactive DSA sheets spanning Arrays to Graphs.</li>
                  <li><strong>Mock Arena:</strong> Take user contests and seed tests under practice or competition modes.</li>
                  <li><strong>Aggregated Profiles:</strong> Sync your GitHub active pushes and LeetCode submissions onto a beautiful Contribution Calendar grid.</li>
                  <li><strong>Single-Device Concurrency:</strong> Maintain session security automatically across devices.</li>
                </ul>
              </div>
              <p style="color:#94a3b8; font-size:13px;">Get started today by syncing your LeetCode and GitHub profiles on your dashboard!</p>
              <a href="%s/profile" style="display:inline-block; background:#6366f1; color:#fff;
                 padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:600;
                 margin-top:16px;">Complete Your Profile</a>
              <hr style="border-color:#334155; margin:24px 0;">
              <p style="color:#64748b; font-size:12px;">© 2026 PrepNest by DSA Tracker</p>
            </div>
            """.formatted(name, frontendUrl);
        sendHtml(to, subject, html);
    }

    private void sendHtml(String to, String subject, String html) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromEmail, "PrepNest (no-reply)");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(injectQuote(html), true);
            mailSender.send(msg);
            log.info("Email sent to: [REDACTED] subject: {}", subject);
        } catch (Exception e) {
            log.error("Failed to send email: {}", e.getMessage());
            throw new RuntimeException("Email send failed", e);
        }
    }

    private static final String[] QUOTES = {
        "First, solve the problem. Then, write the code. — John Johnson",
        "Make it work, make it right, make it fast. — Kent Beck",
        "Clean code always looks like it was written by someone who cares. — Michael Feathers",
        "The only way to learn a new programming language is by writing programs in it. — Dennis Ritchie",
        "Talk is cheap. Show me the code. — Linus Torvalds",
        "Consistency is the key to mastering Data Structures and Algorithms! — PrepNest Team",
        "The best way to predict the future is to invent it. — Alan Kay"
    };

    private String injectQuote(String html) {
        String quote = QUOTES[new java.util.Random().nextInt(QUOTES.length)];
        String quoteBox = """
            <div style="margin-top: 30px; padding: 16px; background: rgba(255,255,255,0.03); 
                        border-left: 4px solid #6366f1; border-radius: 8px; font-style: italic; color: #cbd5e1;">
                💡 <strong>Motivational Quote of the Day:</strong><br/>
                "%s"
            </div>
            """.formatted(quote);

        int bodyCloseIdx = html.lastIndexOf("</div>");
        if (bodyCloseIdx != -1) {
            return html.substring(0, bodyCloseIdx) + quoteBox + html.substring(bodyCloseIdx);
        }
        return html + quoteBox;
    }

    private String generateGoogleCalendarUrl(String title, String details) {
        try {
            java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'")
                    .withZone(java.time.ZoneOffset.UTC);
            java.time.Instant start = java.time.Instant.now().plus(1, java.time.temporal.ChronoUnit.DAYS);
            java.time.Instant end = start.plus(1, java.time.temporal.ChronoUnit.HOURS);
            
            String startStr = fmt.format(start);
            String endStr = fmt.format(end);
            
            return "https://www.google.com/calendar/render?action=TEMPLATE&text="
                    + java.net.URLEncoder.encode("PrepNest Mock Arena: " + title, "UTF-8")
                    + "&dates=" + startStr + "/" + endStr
                    + "&details=" + java.net.URLEncoder.encode(details, "UTF-8")
                    + "&location=" + java.net.URLEncoder.encode("https://prepnest.com/mock-arena", "UTF-8");
        } catch (Exception e) {
            return "https://calendar.google.com";
        }
    }
}
