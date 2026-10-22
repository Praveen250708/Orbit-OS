from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.app.models.entities import Notification, ScheduleItem, Task, User

class NotificationService:
    """
    Persistent notification dispatcher and reminder scheduler.
    Creates structured notifications for task transitions, breaks, check-in, and review.
    """

    @classmethod
    def create_schedule_reminders(cls, db: Session, user: User, schedule_items: List[ScheduleItem]):
        prefs = user.preferences or {}
        if not prefs.get("reminders_enabled", True):
            return

        for item in schedule_items:
            if item.item_type != "task":
                continue

            # 5-minute pre-task reminder
            pre_time = item.start_at - timedelta(minutes=5)
            existing_pre = db.query(Notification).filter(
                Notification.schedule_item_id == item.id,
                Notification.notification_type == "task_upcoming"
            ).first()

            if not existing_pre:
                db.add(Notification(
                    user_id=user.id,
                    schedule_item_id=item.id,
                    title=f"Upcoming: {item.title}",
                    message="Starting in 5 minutes. Put your phone in another room or turn on Focus Mode.",
                    notification_type="task_upcoming",
                    scheduled_at=pre_time,
                    status="pending"
                ))

            # Task start reminder
            existing_start = db.query(Notification).filter(
                Notification.schedule_item_id == item.id,
                Notification.notification_type == "task_start"
            ).first()

            if not existing_start:
                db.add(Notification(
                    user_id=user.id,
                    schedule_item_id=item.id,
                    title=f"Focus Time: {item.title}",
                    message="Session starting now. Click to open Focus Mode and launch timer.",
                    notification_type="task_start",
                    scheduled_at=item.start_at,
                    status="pending"
                ))

        db.commit()

    @classmethod
    def get_pending_notifications(cls, db: Session, user_id: int) -> List[Notification]:
        return db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.status.in_(["pending", "delivered"])
        ).order_by(Notification.scheduled_at.asc()).all()

    @classmethod
    def acknowledge_notification(cls, db: Session, notification_id: int, user_id: int) -> Optional[Notification]:
        notif = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        if notif:
            notif.status = "acknowledged"
            notif.acknowledged_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(notif)
        return notif
