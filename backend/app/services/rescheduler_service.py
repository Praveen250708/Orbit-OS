from datetime import datetime, timezone, timedelta, date
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.app.models.entities import Schedule, ScheduleItem, Task, FixedEvent, User
from backend.app.services.priority_engine import PriorityEngine
from backend.app.services.scheduler_engine import SchedulerEngine

class ReschedulerService:
    """
    Intelligent day replanning engine.
    Recalculates schedule when sessions run over, get skipped, or user clicks 'Replan My Day'.
    """

    @classmethod
    def replan_day(
        cls,
        db: Session,
        user_id: int,
        target_date_str: str,
        reason: str = "schedule_drift"
    ) -> Dict[str, Any]:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}

        target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
        now_utc = datetime.now(timezone.utc)

        # 1. Fetch existing schedule
        current_schedule = db.query(Schedule).filter(
            Schedule.user_id == user_id,
            Schedule.local_date == target_date_str
        ).order_by(Schedule.version.desc()).first()

        # 2. Fetch completed or already in-progress items that must be frozen
        frozen_task_ids = set()
        completed_items = []
        if current_schedule:
            for item in current_schedule.items:
                if item.status in ["completed", "in_progress"]:
                    frozen_task_ids.add(item.task_id)
                    completed_items.append(item)

        # 3. Fetch active tasks for this user & date
        all_tasks = db.query(Task).filter(
            Task.user_id == user_id,
            Task.status.in_(["pending", "postponed"])
        ).all()

        # Filter out already frozen tasks
        pending_tasks = [t for t in all_tasks if t.id not in frozen_task_ids]

        # 4. Fetch fixed events
        fixed_events = db.query(FixedEvent).filter(
            FixedEvent.user_id == user_id
        ).all()

        # 5. Fetch user preferences
        prefs = user.preferences or {}

        # 6. Run Scheduler Engine
        schedule_result = SchedulerEngine.schedule_day(
            target_date=target_date,
            tasks=pending_tasks,
            fixed_events=fixed_events,
            user_preferences=prefs,
            user_timezone_str=user.timezone or "UTC"
        )

        # 7. Create or update Schedule version
        version = (current_schedule.version + 1) if current_schedule else 1
        new_schedule = Schedule(
            user_id=user_id,
            local_date=target_date_str,
            version=version,
            status="active",
            conflict_summary="; ".join(schedule_result["conflicts"]) if schedule_result["conflicts"] else None
        )
        db.add(new_schedule)
        db.flush()

        # Re-attach completed items as historical items in new version
        for c_item in completed_items:
            preserved_item = ScheduleItem(
                schedule_id=new_schedule.id,
                task_id=c_item.task_id,
                fixed_event_id=c_item.fixed_event_id,
                title=c_item.title,
                start_at=c_item.start_at,
                end_at=c_item.end_at,
                item_type=c_item.item_type,
                status=c_item.status
            )
            db.add(preserved_item)

        # Add newly scheduled items
        for itm in schedule_result["items"]:
            # If item is a task that was already completed/frozen, skip
            if itm["task_id"] and itm["task_id"] in frozen_task_ids:
                continue

            new_item = ScheduleItem(
                schedule_id=new_schedule.id,
                task_id=itm["task_id"],
                fixed_event_id=itm["fixed_event_id"],
                title=itm["title"],
                start_at=itm["start_at"],
                end_at=itm["end_at"],
                item_type=itm["item_type"],
                status=itm["status"]
            )
            db.add(new_item)

        db.commit()
        db.refresh(new_schedule)

        explanation = f"Schedule version {version} generated. Preserved {len(completed_items)} completed items. "
        if schedule_result["deferred_tasks"]:
            deferred_titles = ", ".join([d["title"] for d in schedule_result["deferred_tasks"][:3]])
            explanation += f"Carried forward {len(schedule_result['deferred_tasks'])} task(s) ({deferred_titles}) to prevent burnout and respect your sleep."
        else:
            explanation += "All pending tasks successfully placed with appropriate break buffers."

        return {
            "schedule_id": new_schedule.id,
            "version": version,
            "explanation": explanation,
            "conflicts": schedule_result["conflicts"],
            "deferred_count": len(schedule_result["deferred_tasks"])
        }
