from datetime import datetime, timezone, date
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.entities import User, Schedule, ScheduleItem, Task, FixedEvent, UserGoal
from backend.app.schemas.schemas import ScheduleOut, ScheduleGenerateRequest, ScheduleReplanRequest
from backend.app.services.priority_engine import PriorityEngine
from backend.app.services.scheduler_engine import SchedulerEngine
from backend.app.services.rescheduler_service import ReschedulerService
from backend.app.services.notification_service import NotificationService

router = APIRouter()

@router.get("/{local_date}", response_model=Optional[ScheduleOut])
def get_schedule_by_date(
    local_date: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    schedule = db.query(Schedule).filter(
        Schedule.user_id == current_user.id,
        Schedule.local_date == local_date,
        Schedule.status == "active"
    ).order_by(Schedule.version.desc()).first()
    return schedule

@router.post("/generate", response_model=ScheduleOut)
def generate_schedule(
    req: ScheduleGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_date = datetime.strptime(req.local_date, "%Y-%m-%d").date()
    prefs = current_user.preferences or {}

    # Pending tasks
    pending_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status.in_(["pending", "postponed"])
    ).all()

    # Score priorities
    goals_map = {g.id: g for g in db.query(UserGoal).filter(UserGoal.user_id == current_user.id).all()}
    PriorityEngine.rank_tasks(
        tasks=pending_tasks,
        goals_map=goals_map,
        topics_map={},
        current_energy=req.readiness_energy or "medium",
        user_peak_energy=prefs.get("energy_peak", "morning")
    )
    db.commit()

    # Fixed events
    day_start = datetime.combine(target_date, datetime.min.time(), tzinfo=timezone.utc)
    day_end = datetime.combine(target_date, datetime.max.time(), tzinfo=timezone.utc)
    fixed_events = db.query(FixedEvent).filter(
        FixedEvent.user_id == current_user.id,
        FixedEvent.start_at <= day_end,
        FixedEvent.end_at >= day_start
    ).all()

    # Constraint scheduler run
    sched_result = SchedulerEngine.schedule_day(
        target_date=target_date,
        tasks=pending_tasks,
        fixed_events=fixed_events,
        user_preferences=prefs,
        user_timezone_str=current_user.timezone or "UTC"
    )

    # Versioning
    existing = db.query(Schedule).filter(
        Schedule.user_id == current_user.id,
        Schedule.local_date == req.local_date
    ).order_by(Schedule.version.desc()).first()
    version = (existing.version + 1) if existing else 1

    new_schedule = Schedule(
        user_id=current_user.id,
        local_date=req.local_date,
        version=version,
        status="active",
        conflict_summary="; ".join(sched_result["conflicts"]) if sched_result["conflicts"] else None
    )
    db.add(new_schedule)
    db.flush()

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
    db.refresh(new_schedule)

    # Reminders
    NotificationService.create_schedule_reminders(db, current_user, saved_items)

    return new_schedule

@router.post("/replan", response_model=Dict[str, Any])
def replan_day(
    req: ScheduleReplanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = ReschedulerService.replan_day(
        db=db,
        user_id=current_user.id,
        target_date_str=req.local_date,
        reason=req.reason or "user_replan"
    )
    return result
