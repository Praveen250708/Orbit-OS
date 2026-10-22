# Orbit OS AI — Autonomous Personal Productivity & Execution System

**Orbit OS** is an AI-powered personal execution system designed for engineering students and high-output professionals. Unlike static to-do lists, ordinary calendars, or chatbot interfaces, Orbit OS **automatically decides what tasks should be done, derives sequential learning roadmaps from syllabi and goals, builds a realistic constraint-based daily schedule, protects sleep boundaries, and shields you from digital distractions (especially Instagram Reels and phone scrolling)**.

---

## 🚀 Key Features Implemented

1. **Autonomous Goal & Syllabus Decomposition**:
   - Decomposes high-level goals into prerequisite-aware learning paths.
   - Includes **built-in university course syllabus models** (AI & Expert Systems, Design & Analysis of Algorithms, Probability & Statistics, Software Engineering & Agile).
   - Generates complete, high-scoring university examination answers with definitions, formulas, ASCII architecture diagrams, and algorithm implementations.
2. **Deterministic Task Priority Engine**:
   - Transparent scoring (0–100) combining deadline urgency, goal alignment, prerequisite satisfaction, and energy matching.
3. **Constraint-Based Daily Scheduling Engine (Google OR-Tools CP-SAT)**:
   - Reserves fixed commitments (lectures, work standups) first with zero overlaps allowed.
   - Enforces sleep and waking boundaries (never schedules into protected sleep).
   - Automatically inserts short (10m) and long (25m) break buffers.
   - Detects overloads and transparently explains what was deferred.
4. **Daily Check-in Workflow**:
   - Concise morning calibration: unfinished tasks carried forward, readiness energy level, available hours, and one-click auto-planning.
5. **Today Dashboard**:
   - Prominently answers the 3 core daily execution questions:
     - *What should I do now?*
     - *What comes next?*
     - *Am I on track today?*
6. **Task Execution & Focus Mode**:
   - Clean, minimalist countdown timer with pause/resume controls.
   - Actionable subtasks checklist and acceptance criteria.
   - *"I'm Stuck — Break Into Micro-Steps"* button that decomposes hard tasks into 5–15 min friction-free actions.
7. **Distraction Prevention System**:
   - One-tap logging for Instagram Reels, Shorts, phone notifications, and aimless browsing.
   - Immediate 90-second breathing and environmental shift interventions to short-circuit cheap dopamine loops.
8. **Automatic Rescheduling ("Replan My Day")**:
   - When a session runs over or is skipped, preserves completed items, protects fixed commitments, recalculates available daylight, and moves flexible tasks.
9. **Nightly Reflection & Weekly Analytics**:
   - Interactive Recharts visualizations for 7-day focus minutes, task completion rates, and distraction distributions.

---

## 🛠 Tech Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy ORM, Pydantic v2, Google OR-Tools CP-SAT, SQLite / PostgreSQL.
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, Framer Motion, Canvas Confetti.

---

## 📦 Setup and Local Development

### 1. Backend Setup
```bash
# Clone or navigate to the project directory
cd "c:\Users\PRAVEEN\Desktop\Orbit OS"

# Install backend dependencies
pip install fastapi uvicorn sqlalchemy alembic bcrypt pyjwt pydantic-settings ortools email-validator requests httpx

# Start the FastAPI server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*The backend API documentation is interactively accessible at `http://127.0.0.1:8000/docs`.*

### 2. Frontend Setup
```bash
cd "c:\Users\PRAVEEN\Desktop\Orbit OS\frontend"

# Install dependencies
npm install

# Start development server
npm run dev
```
*Frontend runs at `http://127.0.0.1:5173/`.*

---

## 🧪 Automated Test Suite

Run the full suite of unit and integration tests:
```bash
python -m unittest discover backend/tests
```
**Results: 11 tests passed in 0.242s (100% OK)**
- `test_priority.py`: Deadline urgency, prerequisite penalty, and energy matching.
- `test_scheduler.py`: Zero overlap with fixed events, sleep boundary protection, and overload conflict detection.
- `test_api.py`: FastAPI endpoints integration for today dashboard, goals, and analytics.
- `test_syllabus.py`: Course unit retrieval, subtopics breakdown, and academic question answering.

---

## 🚢 Production Deployment

1. **Backend**: Deploy on Render, Railway, or AWS Elastic Beanstalk with PostgreSQL (`DATABASE_URL=postgresql://user:pass@host:5432/db`).
2. **Frontend**: Build production bundle via `npm run build` and deploy static assets to Vercel, Netlify, or AWS CloudFront.
