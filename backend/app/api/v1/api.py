from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    auth,
    dashboard,
    checkin,
    goals,
    learning,
    tasks,
    schedule,
    focus,
    distractions,
    review,
    analytics,
    notifications,
    settings,
    syllabus
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Onboarding"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(checkin.router, prefix="/daily-checkin", tags=["Daily Check-in"])
api_router.include_router(goals.router, prefix="/goals", tags=["Goals"])
api_router.include_router(learning.router, prefix="/learning-paths", tags=["Learning Roadmaps"])
api_router.include_router(syllabus.router, prefix="/syllabus", tags=["Course Syllabus & Q&A"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks & Execution"])
api_router.include_router(schedule.router, prefix="/schedule", tags=["Autonomous Scheduling"])
api_router.include_router(focus.router, prefix="/focus-sessions", tags=["Focus Engine"])
api_router.include_router(distractions.router, prefix="/distractions", tags=["Distraction Guard"])
api_router.include_router(review.router, prefix="/daily-review", tags=["Daily Review"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & Insights"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings & Routine Boundaries"])
