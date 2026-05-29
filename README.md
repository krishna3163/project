<div align="center">
  <img src="frontend/public/logo.png" alt="PrepNest Logo" width="120"/>
  
  # 🚀 PrepNest: The Ultimate DSA, Career & Gamified Tracker
  
  **Track your Coding journey, ace your Mock Tests, build the perfect Resume, and climb the Global Leaderboard in one gamified glassmorphic ecosystem.**
  
  [![Vercel Deployment](https://img.shields.io/badge/Deploy%20to%20Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](#frontend-deployment---vercel)
  [![Render Deployment](https://img.shields.io/badge/Deploy%20to%20Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](#backend-deployment---render)
  
  ![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
  ![Spring Boot](https://img.shields.io/badge/Spring_Boot-F2F4F9?style=flat&logo=spring-boot)
  ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)
  ![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?&style=flat&logo=redis&logoColor=white)
  ![JWT](https://img.shields.io/badge/JWT-black?style=flat&logo=JSON%20web%20tokens)
  ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

  <br/>
  <i>Elevating the Software Engineering Interview Experience.</i>
</div>

---

## 📑 Table of Contents

1. [🌟 Overview & Mission](#-overview--mission)
2. [✨ Core Features Breakdown](#-core-features-breakdown)
   - [Gamified Dashboard](#1-gamified-dashboard)
   - [Automated LeetCode Sync](#2-automated-leetcode-sync)
   - [AI-Powered Resume Analyzer](#3-ai-powered-resume-analyzer)
   - [Global Social Leaderboard](#4-global-social-leaderboard)
   - [System Administration](#5-system-administration)
3. [🏗️ Comprehensive Architecture](#-comprehensive-architecture)
   - [Full System View](#full-system-view)
   - [Frontend Architecture](#frontend-architecture)
   - [Backend Architecture](#backend-architecture)
   - [Authentication Flow](#authentication-flow)
   - [AI Resume Parsing Flow](#ai-resume-parsing-flow)
4. [🗄️ Database Schemas & Data Models](#️-database-schemas--data-models)
5. [🌐 API Documentation](#-api-documentation)
6. [📂 Extensive Project Structure](#-extensive-project-structure)
7. [🚀 Deployment Guides](#-deployment-guides)
   - [Vercel (Frontend)](#frontend-deployment---vercel)
   - [Render (Backend)](#backend-deployment---render)
   - [Docker Compose (Local/VPS)](#docker-compose-localvps)
8. [💻 Local Development Guide](#-local-development-guide)
9. [🤝 Contribution Guidelines](#-contribution-guidelines)
10. [🛡️ Security Posture](#️-security-posture)
11. [❓ FAQ](#-faq)

---

## 🌟 Overview & Mission

**PrepNest** is not just another tracker; it is a meticulously crafted, gamified command center for aspiring and veteran software engineers. The platform bridges the gap between chaotic interview preparation and structured, quantifiable success. By integrating external data sources (LeetCode, GitHub) and utilizing AI-driven heuristics for resume building, PrepNest offers a 360-degree view of a candidate's readiness.

### The Problem It Solves:
Software engineers often track their progress on fragmented platforms: LeetCode for algorithms, Google Docs for notes, standalone timers for mock interviews, and expensive third-party tools for resume reviews. PrepNest brings all of this into a single, beautifully animated, glassmorphic UI.

---

## ✨ Core Features Breakdown

### 1. Gamified Dashboard
- **Daily Quests:** Users receive randomized daily objectives (e.g., "Solve POTD", "Take a Mock Test").
- **Coin System & XP:** Earning coins by maintaining streaks and completing quests.
- **Dynamic Heatmaps:** A GitHub-style contribution graph mapping coding consistency over the last 126 days.

### 2. Automated LeetCode Sync
- Connects to LeetCode's public GraphQL endpoints to fetch real-time stats.
- Auto-syncs "Problem of the Day" (POTD) and awards bonus XP for daily completions.
- Friend Comparison: Track your friends' LeetCode progress and compare stats visually.

### 3. AI-Powered Resume Analyzer
- Users upload their PDF resumes to the platform (stored securely in Cloudinary).
- The backend utilizes **Apache Tika** to perform raw text extraction.
- A custom AI heuristic engine analyzes the text for ATS (Applicant Tracking System) compatibility.
- Generates a rich **Markdown Report** rendered in React, providing actionable feedback, missing keywords, and an overall ATS score.

### 4. Global Social Leaderboard
- A highly stylized podium (Top 3) UI element.
- Ranks users globally based on their accumulated XP and Daily Streaks.
- Encourages competitive programming by displaying current streaks alongside user avatars.

### 5. System Administration
- Role-based Access Control (RBAC) utilizing JWT claims (`ROLE_ADMIN`).
- Real-time system monitoring (Active Sessions, Total Registered Users).
- Data grid management for user moderation and pruning.

---

## 🏗️ Comprehensive Architecture

The architecture of PrepNest is designed for horizontal scalability, fast iteration, and robust security.

### Full System View
This diagram illustrates how data flows from the user's browser all the way to the persistent storage layer.

```mermaid
graph TD
    subgraph Client Tier
        Browser[Client Web Browser / Mobile Web]
    end

    subgraph Edge Tier [Vercel Edge Network]
        ReactApp[React 18 + Vite SPA]
    end

    subgraph Application Tier [Render PaaS]
        LoadBalancer[Render Load Balancer]
        SpringBoot[Spring Boot 3.2 Backend]
        
        LoadBalancer --> SpringBoot
    end

    subgraph Data Tier [Cloud DBs]
        Mongo[(MongoDB Atlas Cluster)]
        Redis[(Upstash Redis Cloud)]
        Cloudinary[(Cloudinary CDN)]
    end

    subgraph External Integrations
        LeetCodeAPI[LeetCode GraphQL API]
        GitHubAPI[GitHub Events API]
    end

    Browser -- HTTPS (TLS 1.3) --> ReactApp
    Browser -- HTTPS API / JWT --> LoadBalancer
    
    SpringBoot -- Read/Write --> Mongo
    SpringBoot -- Session Cache --> Redis
    SpringBoot -- PDF Upload --> Cloudinary
    
    SpringBoot -- Sync Stats --> LeetCodeAPI
    SpringBoot -- Sync Events --> GitHubAPI
```

### Frontend Architecture
The frontend embraces modern React paradigms, utilizing Context for state, React Router for protection, and Recharts for data visualization.

```mermaid
graph TD
    App[App.tsx / Router] --> Protected[Protected Route Wrapper]
    Protected --> Layout[Layout Sidebar & Topbar]
    Layout --> Outlet[Page Views]
    
    Outlet --> Dashboard[DashboardPage]
    Outlet --> Progress[ProgressPage]
    Outlet --> Resume[ResumePage]
    Outlet --> Leaderboard[LeaderboardPage]
    
    Dashboard --> AuthContext[AuthContext - JWT State]
    Progress --> Recharts[Recharts SVG Engine]
    Resume --> ReactMarkdown[Markdown Renderer]
```

### Authentication Flow
Security is paramount. The system uses a stateless, short-lived JWT strategy backed by Redis for immediate token invalidation (preventing stale sessions).

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Filter as JWTAuthFilter
    participant AuthController
    participant Redis
    participant MongoDB

    User->>Frontend: Enters Email & Password
    Frontend->>AuthController: POST /api/auth/login
    AuthController->>MongoDB: Verify Credentials
    MongoDB-->>AuthController: Valid User
    AuthController->>Redis: Generate & Store SessionID
    AuthController-->>Frontend: Return JWT (Contains UserID & SessionID)
    
    Note over User,MongoDB: Subsequent Requests
    
    Frontend->>Filter: Request with Bearer JWT
    Filter->>Filter: Validate Signature & Expiry
    Filter->>Redis: Check SessionID against Active Session
    Redis-->>Filter: Session Valid
    Filter->>Controller: Forward Request
    Controller-->>Frontend: 200 OK Data
```

### AI Resume Parsing Flow
How the system processes PDFs into actionable advice without locking the main application thread.

```mermaid
sequenceDiagram
    participant Frontend
    participant ResumeController
    participant Cloudinary
    participant AsyncService as @Async ResumeService
    participant ApacheTika
    participant MongoDB

    Frontend->>ResumeController: POST /api/resumes (Form Data + PDF URL)
    ResumeController->>MongoDB: Create Pending Resume Document
    ResumeController-->>Frontend: 202 Accepted (Processing)
    
    Note over ResumeController,AsyncService: Spring @Async triggers background thread
    
    ResumeController-)AsyncService: analyzeAsync(resumeId, fileStream)
    AsyncService->>Cloudinary: Fetch File Stream
    AsyncService->>ApacheTika: parseToString(stream)
    ApacheTika-->>AsyncService: Raw Text Extracted
    AsyncService->>AsyncService: Execute Heuristics & Scoring Engine
    AsyncService->>AsyncService: Generate Markdown Feedback
    AsyncService->>MongoDB: Update Document with Score & Markdown
    
    Note over Frontend: User refreshes page or polls
    Frontend->>ResumeController: GET /api/resumes
    ResumeController->>MongoDB: Fetch Resumes
    MongoDB-->>Frontend: Complete Resume Data
```

---

## 🗄️ Database Schemas & Data Models

PrepNest relies on NoSQL (MongoDB) for flexible, document-based storage. Below are the core collections and their fields.

### `User` Collection
The central entity for authentication and tracking.
```json
{
  "_id": "ObjectId('...')",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2a$10$hashed_password...",
  "activeSessionId": "uuid-v4-string",
  "roles": ["ROLE_USER", "ROLE_ADMIN"],
  "xpPoints": 1450,
  "coins": 200,
  "dailyStreak": 14,
  "lastActiveDate": "ISODate('2026-05-27T00:00:00Z')",
  "dailyQuests": {
    "2026-05-27_SOLVE_POTD": true,
    "2026-05-27_TAKE_MOCK_TEST": false
  },
  "leetcodeUsername": "johndoe_lc",
  "leetcodeEasySolved": 50,
  "leetcodeMediumSolved": 20,
  "leetcodeHardSolved": 5,
  "activeDates": ["2026-05-26", "2026-05-27"]
}
```

### `Resume` Collection
Stores metadata and AI analysis of uploaded resumes.
```json
{
  "_id": "ObjectId('...')",
  "userId": "ObjectId('user_id')",
  "fileName": "JohnDoe_SWE_Resume.pdf",
  "fileUrl": "https://res.cloudinary.com/.../resume.pdf",
  "parsedText": "Raw extracted string...",
  "analysisScore": 85,
  "matchedKeywords": ["java", "spring boot", "react", "mongodb"],
  "aiFeedback": "### AI Resume Analysis\n\n🌟 **Excellent Profile!**...",
  "uploadedAt": "ISODate('2026-05-27T10:00:00Z')"
}
```

### `Progress` Collection
Time-series style data for historical charting (Recharts).
```json
{
  "_id": "ObjectId('...')",
  "userId": "ObjectId('user_id')",
  "date": "2026-05-27",
  "dsaSolved": 75,
  "mockScoreAvg": 82.5,
  "notesCount": 12,
  "resumeScore": 85
}
```

---

## 🌐 API Documentation

The backend exposes a RESTful API. All protected routes require an `Authorization: Bearer <token>` header.

### Authentication Endpoints
- `POST /api/auth/register` - Registers a new user. Expects `{ name, email, password }`.
- `POST /api/auth/login` - Authenticates user. Returns `{ token, user }`.
- `POST /api/auth/logout` - Invalidates the active session in Redis.

### User & Gamification Endpoints
- `GET /api/users/me` - Returns full profile, auto-initializes daily quests.
- `PATCH /api/users/me` - Updates basic info.
- `POST /api/users/leetcode/sync` - Re-fetches LeetCode GraphQL stats and awards XP.
- `GET /api/users/friends/compare` - Compares stats against LeetCode friends list.

### Resume Endpoints
- `POST /api/resumes` - Submits a new resume for async processing.
- `GET /api/resumes` - Retrieves user's history of uploaded resumes.
- `GET /api/resumes/{id}` - Retrieves a specific resume analysis.

### Analytics & Leaderboard
- `GET /api/analytics/history` - Returns deterministic 30-day XP curves and Radar data.
- `GET /api/leaderboard/global` - Paginated global ranking. Sorts by XP (Desc).

### Admin Endpoints (Requires `ROLE_ADMIN`)
- `GET /api/admin/stats` - System aggregates (Total users, active sessions).
- `GET /api/admin/users` - Paginated user management list.
- `DELETE /api/admin/users/{id}` - Moderation endpoint.

---

## 📂 Extensive Project Structure

Understanding the codebase is critical for contribution. Here is the deepest dive into the folder structure.

```text
SoftwareEngineering/
│
├── backend/                               # 🟢 SPRING BOOT BACKEND
│   ├── .env                               # Crucial environment variables
│   ├── pom.xml                            # Maven Dependencies (Spring, Mongo, JWT, Tika)
│   ├── .gitignore                         
│   └── src/
│       ├── main/
│       │   ├── java/com/dsatracker/
│       │   │   ├── DsaTrackerApplication.java  # Main Bootstrapper
│       │   │   │
│       │   │   ├── config/                     # Configuration Layer
│       │   │   │   ├── CloudinaryConfig.java   # CDN Setup
│       │   │   │   ├── CorsConfig.java         # Security CORS
│       │   │   │   └── RestTemplateConfig.java # HTTP Client for GitHub/LC
│       │   │   │
│       │   │   ├── controller/                 # API Layer
│       │   │   │   ├── AdminController.java    # Admin Panel APIs
│       │   │   │   ├── AuthController.java     # Login/Register
│       │   │   │   ├── ResumeController.java   # PDF Uploads
│       │   │   │   ├── AnalyticsController.java# Recharts Data provider
│       │   │   │   └── LeaderboardController.java
│       │   │   │
│       │   │   ├── model/                      # Entity Layer (MongoDB)
│       │   │   │   ├── User.java               # Has Gamification fields
│       │   │   │   ├── Resume.java             # Has AI Feedback fields
│       │   │   │   ├── Progress.java           # Time series model
│       │   │   │   └── MockResult.java         # Test scores
│       │   │   │
│       │   │   ├── repository/                 # Persistence Layer
│       │   │   │   ├── UserRepository.java     # Mongo/Redis queries
│       │   │   │   └── ResumeRepository.java
│       │   │   │
│       │   │   ├── security/                   # Protection Layer
│       │   │   │   ├── JwtAuthFilter.java      # Intercepts every request
│       │   │   │   ├── JwtUtil.java            # Generates/Validates HS256 JWTs
│       │   │   │   └── SecurityConfig.java     # URL Route Protections
│       │   │   │
│       │   │   └── service/                    # Business Logic Layer
│       │   │       ├── QuestService.java       # Handles Daily Objectives
│       │   │       ├── ResumeService.java      # Apache Tika & AI Heuristics
│       │   │       ├── DsaService.java         # LeetCode API Syncing
│       │   │       └── EmailService.java       # JavaMailSender integrations
│       │   │
│       │   └── resources/
│       │       └── application.properties      # Spring settings mapped to .env
│       │
│       └── test/                               # Unit/Integration Tests
│
└── frontend/                               # 🔵 REACT FRONTEND (Vite)
    ├── index.html                          # Includes the Global CSS Loader script
    ├── package.json                        # Scripts & Libs
    ├── tsconfig.json                       # Strict Typescript rules
    ├── vite.config.ts                      # Bundler config
    └── src/
        ├── main.tsx                        # React Root mounting
        ├── App.tsx                         # Client-side Routing (Protected/Public)
        ├── index.css                       # The Source of Truth for Glassmorphism & Animations
        │
        ├── components/                     # Shared UI
        │   ├── Layout.tsx                  # Sidebar Navigation
        │   ├── ErrorBoundary.tsx           # Catches React crashes
        │   └── StatCard.tsx                # Reusable KPI card
        │
        ├── context/                        
        │   └── AuthContext.tsx             # Global state + Axios API interceptors
        │
        └── pages/                          # Feature Pages
            ├── LoginPage.tsx               # Entry gate
            ├── DashboardPage.tsx           # Home base, Quests, Heatmaps
            ├── ProgressPage.tsx            # Recharts (Radar, Area)
            ├── ResumePage.tsx              # Markdown Renderer for AI
            ├── LeaderboardPage.tsx         # Podium component
            ├── MockTestsPage.tsx           # Testing platform
            ├── ContestsPage.tsx            # Scraping UI
            ├── RoadmapsPage.tsx            # Step-by-step guides
            ├── ProfilePage.tsx             # Settings & GitHub connect
            └── AdminPage.tsx               # Admin Table grid
```

---

## 🚀 Deployment Guides

Deploying PrepNest is highly automated. We recommend splitting the stack: **Vercel** for the React frontend (for edge caching) and **Render** for the Spring Boot backend.

### Backend Deployment - [Render](https://render.com)
Render provides free and paid tiers perfect for Spring Boot.

1. Create a free account on [Render](https://render.com).
2. Click **New > Web Service**.
3. Connect your GitHub repository and select the `backend` directory (if monorepo) or root.
4. **Build Settings**:
   - **Environment**: `Java`
   - **Build Command**: `./mvnw clean install -DskipTests` (Wait, if Maven wrapper is missing, use `mvn clean install -DskipTests`).
   - **Start Command**: `java -jar target/dsa-tracker-backend-0.0.1-SNAPSHOT.jar`
5. **Environment Variables** (Crucial Step):
   - Scroll down to Advanced and add your `.env` variables.
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `REDIS_URL`: Your Upstash Redis URL (e.g., `redis://default:password@xyz.upstash.io:19578`).
   - `JWT_SECRET`: A 32+ character random string.
   - `EMAIL_USERNAME` & `EMAIL_PASSWORD`: For OTP/Notifications.
   - `FRONTEND_URL`: Leave blank or set to `*` temporarily. You will update this after Vercel deployment!
   - `CORS_ALLOWED_ORIGINS`: Same as above.
6. Click **Deploy Web Service**.
7. Once deployed, copy the backend URL (e.g., `https://prepnest-backend.onrender.com`).

### Frontend Deployment - [Vercel](https://vercel.com)
Vercel is optimized for Vite + React.

1. Create a free account on [Vercel](https://vercel.com).
2. Click **Add New Project**.
3. Import your GitHub repository.
4. If using a monorepo, set the **Root Directory** to `frontend`.
5. Vercel will automatically detect `Vite` and configure build commands (`npm run build`).
6. **Environment Variables**:
   - Add `VITE_API_BASE_URL`
   - Set the value to the Render URL you copied earlier (e.g., `https://prepnest-backend.onrender.com`).
7. Click **Deploy**.
8. **Final Step**: Copy your new Vercel URL (e.g., `https://prepnest.vercel.app`), go back to your Render Dashboard, and update `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` to this exact URL. Restart the Render server to apply CORS rules.

### Docker Compose (Local/VPS)
For self-hosting on AWS EC2, DigitalOcean, or your local machine.

Create a `docker-compose.yml` in the root directory:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - MONGO_URI=mongodb://mongo:27017/dsatracker
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=super_secret_key_change_me_in_prod
    depends_on:
      - mongo
      - redis

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://localhost:8080

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```
Run `docker-compose up -d --build`.

---

## 💻 Local Development Guide

If you want to contribute or run the code on your local Windows/Mac/Linux machine:

### Prerequisites
- Node.js (v18+)
- Java JDK 21+
- Apache Maven (v3.9+)
- A MongoDB cluster (or local instance)
- A Redis database (or Docker for Redis)

### Running the Backend
1. Open a terminal and navigate to `/backend`.
2. Ensure your `.env` file is populated with valid URLs (See `application.properties` for required keys).
3. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```
4. The server will start on `http://localhost:8080`.

### Running the Frontend
1. Open a new terminal and navigate to `/frontend`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the app at `http://localhost:5173`.

---

## 🤝 Contribution Guidelines

We welcome community contributions to PrepNest! Whether it's adding new LeetCode heuristic parsers, fixing CSS glitches, or optimizing MongoDB queries.

1. **Fork the Repository** on GitHub.
2. **Clone** your fork locally.
3. **Create a Feature Branch**: `git checkout -b feature/amazing-new-chart`
4. **Commit your Changes**: `git commit -m 'feat: added a new pie chart to analytics'`
5. **Push to the Branch**: `git push origin feature/amazing-new-chart`
6. **Open a Pull Request** against the `main` branch.

### Code Style
- **Frontend**: We enforce strict TypeScript typing. Avoid `any` wherever possible. Use `index.css` for animations rather than inline styles to maintain the glassmorphic design system.
- **Backend**: Use `Lombok` for boilerplate reduction. Ensure all new endpoints are secured behind `JwtAuthFilter`.

---

## 🛡️ Security Posture

Security is built-in by design:
- **Stateless Authentication**: JWTs are utilized, mitigating CSRF attacks.
- **Active Session Invalidation**: Redis tracks the `activeSessionId`. If a user logs in from a new device, the old token is instantly rejected by the filter.
- **CORS Protection**: The backend explicitly blocks unknown origins based on `.env` configuration.
- **Password Hashing**: BCrypt handles all password encryption before it touches MongoDB.

---

## ❓ FAQ

**Q: Why does the Resume Analyzer take a few seconds?**  
A: The resume PDF is first uploaded to Cloudinary, then processed asynchronously in a background thread using Apache Tika to extract text, and finally passed through our AI heuristic engine. 

**Q: Can I use PrepNest without a LeetCode account?**  
A: Yes! While the LeetCode sync feature provides bonus XP and populated stats, you can manually log mock tests and upload notes to gain XP and climb the leaderboard.

**Q: Why does the frontend show a white flash before loading?**  
A: We implemented a native HTML/CSS preloader inside `index.html` that runs before the React DOM hydrates, completely eliminating this issue in the latest version!

**Q: How do I become an Admin?**  
A: Currently, you must manually update your user document in MongoDB to include `"ROLE_ADMIN"` inside the `roles` array.

---

<br/>
<div align="center">
  <h3>Ready to become a 10x Developer?</h3>
  <a href="#frontend-deployment---vercel">
    <img src="https://img.shields.io/badge/START%20YOUR%20JOURNEY-6366F1?style=for-the-badge&logo=rocket" alt="Get Started Button"/>
  </a>
  <p style="margin-top: 15px; color: #64748b; font-size: 14px;">
    <i>Built with ❤️ by passionate engineers.</i>
  </p>
</div>
