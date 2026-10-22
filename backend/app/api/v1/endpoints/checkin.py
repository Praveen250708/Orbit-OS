from datetime import datetime, timezone, timedelta, date
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.entities import User, Task, FixedEvent, Schedule, UserGoal
from backend.app.schemas.schemas import DailyCheckinRequest, DailyCheckinStatus, TaskCreate
from backend.app.services.priority_engine import PriorityEngine
from backend.app.services.scheduler_engine import SchedulerEngine
from backend.app.services.notification_service import NotificationService

router = APIRouter()

@router.get("/{local_date}", response_model=DailyCheckinStatus)
def get_daily_checkin_status(
    local_date: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if user already completed check-in for this local date
    prefs = current_user.preferences or {}
    last_checkin_date = prefs.get("last_checkin_date")
    already_checked_in = (last_checkin_date == local_date)

    # 1. Unfinished tasks from previous days or pending today
    pending_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status.in_(["pending", "postponed"])
    ).all()

    # 2. Upcoming fixed events
    target_date = datetime.strptime(local_date, "%Y-%m-%d").date()
    day_start = datetime.combine(target_date, datetime.min.time(), tzinfo=timezone.utc)
    day_end = datetime.combine(target_date, datetime.max.time(), tzinfo=timezone.utc)

    fixed_events = db.query(FixedEvent).filter(
        FixedEvent.user_id == current_user.id,
        FixedEvent.start_at <= day_end,
        FixedEvent.end_at >= day_start
    ).all()

    # 3. Existing schedule if already generated
    schedule = db.query(Schedule).filter(
        Schedule.user_id == current_user.id,
        Schedule.local_date == local_date
    ).order_by(Schedule.version.desc()).first()

    return DailyCheckinStatus(
        already_checked_in=already_checked_in,
        last_checkin_date=last_checkin_date,
        pending_yesterday_tasks=pending_tasks[:10],
        upcoming_fixed_events=fixed_events,
        today_schedule=schedule
    )

@router.post("", response_model=Dict[str, Any])
def submit_daily_checkin(
    payload: DailyCheckinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    local_date = payload.local_date
    target_date = datetime.strptime(local_date, "%Y-%m-%d").date()

    # 1. Update user preferences with check-in metadata
    prefs = current_user.preferences or {}
    prefs["last_checkin_date"] = local_date
    prefs["last_energy_level"] = payload.energy_level
    if payload.available_hours is not None and payload.available_hours > 0:
        prefs["today_available_hours"] = payload.available_hours
    current_user.preferences = prefs
    db.commit()

    # 2. Add any new urgent tasks specified during check-in
    for title in payload.new_urgent_task_titles:
        clean_title = title.strip()
        if clean_title:
            new_task = Task(
                user_id=current_user.id,
                title=clean_title,
                description="Urgent task added during daily check-in",
                task_type="deep_work",
                priority="must-do",
                priority_score=90.0,
                estimated_minutes=45,
                scheduled_date=local_date,
                status="pending",
                source_type="daily_checkin",
                energy_level=payload.energy_level
            )
            db.add(new_task)
    db.commit()

    # 3. Retrieve all pending tasks for scheduling
    pending_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status.in_(["pending", "postponed"])
    ).all()

    # Score and prioritize tasks deterministically
    goals_map = {g.id: g for g in db.query(UserGoal).filter(UserGoal.user_id == current_user.id).all()}
    topics_map = {}
    PriorityEngine.rank_tasks(
        tasks=pending_tasks,
        goals_map=goals_map,
        topics_map=topics_map,
        current_energy=payload.energy_level,
        user_peak_energy=prefs.get("energy_peak", "morning")
    )
    db.commit()

    # 4. Retrieve fixed events
    day_start = datetime.combine(target_date, datetime.min.time(), tzinfo=timezone.utc)
    day_end = datetime.combine(target_date, datetime.max.time(), tzinfo=timezone.utc)
    fixed_events = db.query(FixedEvent).filter(
        FixedEvent.user_id == current_user.id,
        FixedEvent.start_at <= day_end,
        FixedEvent.end_at >= day_start
    ).all()

    # 5. Generate schedule
    sched_result = SchedulerEngine.schedule_day(
        target_date=target_date,
        tasks=pending_tasks,
        fixed_events=fixed_events,
        user_preferences=prefs,
        user_timezone_str=current_user.timezone or "UTC"
    )

    # 6. Save Schedule & ScheduleItems
    existing_schedule = db.query(Schedule).filter(
        Schedule.user_id == current_user.id,
        Schedule.local_date == local_date
    ).order_by(Schedule.version.desc()).first()

    version = (existing_schedule.version + 1) if existing_schedule else 1
    new_schedule = Schedule(
        user_id=current_user.id,
        local_date=local_date,
        version=version,
        status="active",
        conflict_summary="; ".join(sched_result["conflicts"]) if sched_result["conflicts"] else None
    )
    db.add(new_schedule)
    db.flush()

    from backend.app.models.entities import ScheduleItem
    saved_items = []
    for itm in sched_result["items"]:
        item_obj = ScheduleItem(
            schedule_id=new_schedule.id,
            task_id=itm["task_id"],
            fixed_event_id=itm["fixed_event_id"],
            title=itm["title"],
            start_at=itm["start_at"],
            end_at=itm["end_at"],
            item_type=itm["item_type"],
            status="scheduled"
        )
        db.add(item_obj)
        saved_items.append(item_obj)

    db.commit()

    # 7. Generate reminders
    NotificationService.create_schedule_reminders(db, current_user, saved_items)

    return {
        "status": "success",
        "message": f"Daily check-in completed. Schedule generated for {local_date}.",
        "schedule_id": new_schedule.id,
        "items_scheduled": sched_result["scheduled_tasks_count"],
        "conflicts": sched_result["conflicts"],
        "deferred_tasks": sched_result["deferred_tasks"]
    }
