# DSA Tracker – Full-Stack Placement Preparation Platform

A production-ready, full-stack web platform for placement preparation.

## 🏗 Architecture

```
frontend/   ← React + Vite + TypeScript (deploy on Vercel)
backend/    ← Spring Boot 3.x + MongoDB + Redis (deploy on Render)
```

## 🚀 Quick Start

### Backend

```bash
cd backend

# Set required environment variables by copying .env.example to .env
# JWT_SECRET, MONGO_URI, REDIS_URL, EMAIL_USERNAME, EMAIL_PASSWORD

# Run locally (requires MongoDB + Redis running)
./mvnw spring-boot:run
```

> Note: `backend/.env` is loaded automatically by Spring Boot when `spring.config.import=optional:dotenv:./.env` is enabled.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # Edit VITE_API_BASE_URL if needed
npm run dev                   # http://localhost:5173
```

## 🌐 Deployment

### Backend → Render
- Build command: `./mvnw clean package -DskipTests`
- Start command: `java -jar target/dsa-tracker-backend-*.jar`
- Set all env vars from `.env.example` in Render dashboard

### Frontend → Vercel
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_BASE_URL` env var to your Render backend URL

## ✨ Features

| Feature | Status |
|---------|--------|
| OTP Authentication (Redis TTL) | ✅ |
| JWT Access + Refresh Tokens | ✅ |
| DSA Problem Tracker (solve/unsolve, XP) | ✅ |
| Mock Tests with Rank Calculation | ✅ |
| Mock Test Rank Card (html2canvas) | ✅ |
| Notes Upload (Cloudinary URL) | ✅ |
| Resume Analyzer (Apache Tika) | ✅ |
| Company Roadmaps (Google/Amazon/Microsoft) | ✅ |
| Contest Fetcher (LeetCode/HackerRank/HackerEarth) | ✅ |
| Contest Reminders (Scheduler + Email) | ✅ |
| Progress Analytics (Recharts) | ✅ |
| Email Templates (OTP/Congrats/Reminder/Results) | ✅ |
| In-app Notifications | ✅ |
| Gamification (XP, Badges, Streaks) | ✅ |
| Dark Mode Glassmorphism UI | ✅ |
| Leaderboard | ✅ |

## 🔐 Security Features

- OTP via Redis with 5-min TTL (single-use)
- JWT HS256 (algorithm hardcoded, no alg:none)
- Tokens stored in memory (NOT localStorage)
- BCrypt password hashing (strength 12)
- Strict CORS (allowedOrigins from env)
- Security headers: CSP, X-Frame-Options, X-Content-Type-Options
- Global exception handler (no internal details exposed)
- Resource ownership validated on every request
- No secrets hardcoded anywhere
