import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone, timedelta, date

from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.models.entities import (
    User, UserGoal, LearningPath, LearningTopic, Task, FixedEvent, Schedule, ScheduleItem
)
from backend.app.core.security import get_password_hash
from backend.app.api.v1.api import api_router
from backend.app.services.priority_engine import PriorityEngine
from backend.app.services.scheduler_engine import SchedulerEngine

# Ensure tables exist
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    # 2. Seed initial demo dataset if table is empty
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "demo@orbitos.ai").first()
        if not user:
            user = User(
                email="demo@orbitos.ai",
                name="Alex Mercer",
                password_hash=get_password_hash("orbitdemo123"),
                timezone="UTC",
                preferences={
                    "waking_time": "07:30",
                    "sleeping_time": "23:30",
                    "daily_available_hours": 6.5,
                    "focus_duration": 45,
                    "break_duration": 10,
                    "long_break_duration": 25,
                    "phone_distraction_guard": True,
                    "distraction_apps": ["Instagram Reels", "YouTube Shorts", "TikTok"],
                    "energy_peak": "morning",
                    "preferred_language": "en",
                    "reminders_enabled": True
                },
                onboarding_completed=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            # Seed Goal 1: Machine Learning Mastery
            goal_ml = UserGoal(
                user_id=user.id,
                title="Master Applied Machine Learning",
                description="Understand core mathematical models and deploy production deep learning models.",
                category="career",
                target_date=datetime.now(timezone.utc) + timedelta(days=60),
                priority="must-do",
                status="in_progress"
            )
            # Seed Goal 2: Build Orbit OS
            goal_os = UserGoal(
                user_id=user.id,
                title="Ship Orbit OS Core Engine",
                description="Finish autonomous scheduling and distraction reduction features.",
                category="project",
                target_date=datetime.now(timezone.utc) + timedelta(days=14),
                priority="must-do",
                status="in_progress"
            )
            db.add_all([goal_ml, goal_os])
            db.commit()
            db.refresh(goal_ml)
            db.refresh(goal_os)

            # Learning Path for ML
            lp = LearningPath(
                user_id=user.id,
                goal_id=goal_ml.id,
                title="Applied ML & PyTorch Roadmap",
                description="Curated curriculum from calculus foundations to transformer architecture.",
                status="active"
            )
            db.add(lp)
            db.commit()
            db.refresh(lp)

            # Topics
            t1 = LearningTopic(
                learning_path_id=lp.id,
                title="Gradient Descent & Convex Optimization",
                description="Derive loss functions and optimize learning rates.",
                order_index=1,
                mastery_status="mastered",
                assessment_results={"score": 95}
            )
            t2 = LearningTopic(
                learning_path_id=lp.id,
                title="Neural Networks & Backpropagation in PyTorch",
                description="Implement computational graphs and reverse-mode automatic differentiation.",
                order_index=2,
                mastery_status="in_progress",
                assessment_results={"score": 80}
            )
            t3 = LearningTopic(
                learning_path_id=lp.id,
                title="Convolutional Neural Networks & Feature Extraction",
                description="Kernels, pooling, receptive fields, and residual connections.",
                order_index=3,
                prerequisite_topic_ids=[2],
                mastery_status="not_started"
            )
            db.add_all([t1, t2, t3])
            db.commit()
            db.refresh(t2)

            today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

            # Seed active tasks
            task1 = Task(
                user_id=user.id,
                goal_id=goal_ml.id,
                learning_topic_id=t2.id,
                title="Implement PyTorch Multi-layer Perceptron on MNIST",
                description="Code modular forward pass, cross-entropy loss, and track training loss curves.",
                task_type="coding",
                priority="must-do",
                priority_score=92.0,
                estimated_minutes=45,
                scheduled_date=today_str,
                status="pending",
                source_type="learning_path",
                source_id=str(lp.id),
                completion_criteria=[
                    "Accuracy on validation set exceeds 94%",
                    "Confusion matrix generated without errors"
                ],
                suggested_subtasks=[
                    {"title": "Load torchvision dataset and setup DataLoader with batch_size=64", "done": True},
                    {"title": "Define nn.Module architecture with 2 hidden layers (ReLU)", "done": False},
                    {"title": "Write 5-epoch training loop with Adam optimizer", "done": False},
                    {"title": "Plot validation accuracy vs epochs", "done": False}
                ],
                energy_level="high"
            )

            task2 = Task(
                user_id=user.id,
                goal_id=goal_os.id,
                title="Refactor Constraint Scheduler Interval Packing",
                description="Verify zero overlaps with fixed lectures and ensure break buffers.",
                task_type="coding",
                priority="must-do",
                priority_score=88.0,
                estimated_minutes=50,
                scheduled_date=today_str,
                status="pending",
                source_type="goal",
                completion_criteria=["Unit tests pass with 100% boundary check"],
                suggested_subtasks=[
                    {"title": "Write test case for overlapping fixed commitments", "done": False},
                    {"title": "Test sleep boundary protection", "done": False}
                ],
                energy_level="high"
            )

            task3 = Task(
                user_id=user.id,
                title="Review Flashcards on Vector Spaces & Linear Independence",
                description="Spaced repetition session to solidify linear algebra foundations.",
                task_type="revision",
                priority="flexible",
                priority_score=65.0,
                estimated_minutes=25,
                scheduled_date=today_str,
                status="pending",
                source_type="routine",
                completion_criteria=["Answer 20 flashcards with >80% recall"],
                suggested_subtasks=[
                    {"title": "Review 20 active recall cards", "done": False}
                ],
                energy_level="medium"
            )

            db.add_all([task1, task2, task3])
            db.commit()

            # Fixed commitment: University Lecture / Work Standup
            now_base = datetime.now(timezone.utc)
            fixed1 = FixedEvent(
                user_id=user.id,
                title="Distributed Systems Lecture",
                start_at=datetime.combine(date.today(), datetime.min.time(), tzinfo=timezone.utc) + timedelta(hours=14),
                end_at=datetime.combine(date.today(), datetime.min.time(), tzinfo=timezone.utc) + timedelta(hours=15, minutes=30),
                recurrence_rule="WEEKDAYS",
                color="#6366f1"
            )
            db.add(fixed1)
            db.commit()

            # Generate initial valid schedule for today
            sched_result = SchedulerEngine.schedule_day(
                target_date=date.today(),
                tasks=[task1, task2, task3],
                fixed_events=[fixed1],
                user_preferences=user.preferences,
                user_timezone_str="UTC"
            )
            schedule = Schedule(
                user_id=user.id,
                local_date=today_str,
                version=1,
                status="active"
            )
            db.add(schedule)
            db.flush()

            for item_data in sched_result["items"]:
                db.add(ScheduleItem(
                    schedule_id=schedule.id,
                    task_id=item_data["task_id"],
                    fixed_event_id=item_data["fixed_event_id"],
                    title=item_data["title"],
                    start_at=item_data["start_at"],
                    end_at=item_data["end_at"],
                    item_type=item_data["item_type"],
                    status="scheduled"
                ))
            db.commit()
    finally:
        db.close()

    yield

app = FastAPI(
    title="Orbit OS AI — Autonomous Personal Productivity & Execution System",
    description="Intelligent personal execution system with autonomous goal breakdown, deterministic priority scoring, constraint-based scheduling, and distraction guard.",
    version="1.0.0",
    lifespan=lifespan
)

# Safe CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect master router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Orbit OS AI",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
