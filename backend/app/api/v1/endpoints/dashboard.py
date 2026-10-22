from datetime import datetime, timezone, date
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.entities import User, Task, Schedule, ScheduleItem, FocusSession, DistractionEvent
from backend.app.schemas.schemas import TodayDashboardOut, TaskOut, ScheduleOut

router = APIRouter()

@router.get("/today", response_model=TodayDashboardOut)
def get_today_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    hour = datetime.now(timezone.utc).hour

    # 1. Warm greeting based on time of day
    if 5 <= hour < 12:
        greeting = f"Good morning, {current_user.name or 'Focus Leader'}"
    elif 12 <= hour < 17:
        greeting = f"Good afternoon, {current_user.name or 'Focus Leader'}"
    else:
        greeting = f"Good evening, {current_user.name or 'Focus Leader'}"

    # 2. Get today's schedule
    schedule = db.query(Schedule).filter(
        Schedule.user_id == current_user.id,
        Schedule.local_date == today_str,
        Schedule.status == "active"
    ).order_by(Schedule.version.desc()).first()

    # 3. Tasks for today
    today_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        (Task.scheduled_date == today_str) | (Task.scheduled_date == None)
    ).all()

    completed_tasks = [t for t in today_tasks if t.status == "completed"]
    unfinished_tasks = [t for t in today_tasks if t.status in ["pending", "in_progress", "postponed"]]

    # 4. Determine Current and Next Tasks
    current_task: Optional[Task] = None
    next_task: Optional[Task] = None

    if schedule and schedule.items:
        now_utc = datetime.now(timezone.utc)
        # Find active or next upcoming item
        for item in schedule.items:
            if item.item_type == "task" and item.task:
                s_at = item.start_at
                e_at = item.end_at
                if s_at and s_at.tzinfo is None:
                    s_at = s_at.replace(tzinfo=timezone.utc)
                if e_at and e_at.tzinfo is None:
                    e_at = e_at.replace(tzinfo=timezone.utc)
                if s_at and e_at and s_at <= now_utc <= e_at and item.status != "completed":
                    current_task = item.task
                    break
        
        # If no task strictly matches current timestamp, pick the first unfinished scheduled task
        if not current_task:
            for item in schedule.items:
                if item.item_type == "task" and item.task and item.task.status != "completed":
                    current_task = item.task
                    break
        
        # Find next task
        if current_task:
            found_curr = False
            for item in schedule.items:
                if item.item_type == "task" and item.task:
                    if item.task.id == current_task.id:
                        found_curr = True
                        continue
                    if found_curr and item.task.status != "completed":
                        next_task = item.task
                        break

    if not current_task and unfinished_tasks:
        current_task = unfinished_tasks[0]
        if len(unfinished_tasks) > 1:
            next_task = unfinished_tasks[1]

    # 5. Focus minutes today
    sessions_today = db.query(FocusSession).filter(
        FocusSession.user_id == current_user.id,
        FocusSession.started_at >= datetime.combine(date.today(), datetime.min.time(), tzinfo=timezone.utc)
    ).all()
    focus_minutes_today = sum(s.actual_minutes or 0 for s in sessions_today)

    # Target
    prefs = current_user.preferences or {}
    daily_target_hours = prefs.get("daily_available_hours", 6.0)
    target_minutes = int(daily_target_hours * 60 * 0.7)  # 70% deep focus ratio

    # Distractions count today
    distractions_today = db.query(DistractionEvent).filter(
        DistractionEvent.user_id == current_user.id,
        DistractionEvent.occurred_at >= datetime.combine(date.today(), datetime.min.time(), tzinfo=timezone.utc)
    ).all()

    # On track calculation
    is_on_track = True
    status_msg = "You are on track with today's flow."
    if schedule and schedule.conflict_summary:
        is_on_track = False
        status_msg = "Schedule adjusted: some tasks deferred to protect sleep."
    elif len(unfinished_tasks) > 6:
        is_on_track = False
        status_msg = "High task backlog detected. Replan suggested."

    return TodayDashboardOut(
        greeting=greeting,
        current_date=today_str,
        on_track=is_on_track,
        status_message=status_msg,
        completed_tasks_count=len(completed_tasks),
        total_tasks_count=len(today_tasks),
        focus_minutes_today=focus_minutes_today,
        daily_focus_target_minutes=target_minutes,
        current_task=current_task,
        next_task=next_task,
        schedule=schedule,
        upcoming_tasks=unfinished_tasks[:5],
        unfinished_tasks=unfinished_tasks,
        distraction_summary={
            "count": len(distractions_today),
            "guard_active": prefs.get("phone_distraction_guard", True),
            "monitored_apps": prefs.get("distraction_apps", ["Instagram Reels"])
        }
    )
