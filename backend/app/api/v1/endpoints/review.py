from datetime import datetime, timezone, date
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.entities import User, DailyReview, Task, FocusSession, DistractionEvent
from backend.app.schemas.schemas import DailyReviewCreate, DailyReviewOut

router = APIRouter()

@router.get("/{local_date}", response_model=Optional[DailyReviewOut])
def get_daily_review(
    local_date: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    review = db.query(DailyReview).filter(
        DailyReview.user_id == current_user.id,
        DailyReview.local_date == local_date
    ).first()
    return review

@router.post("", response_model=DailyReviewOut)
def submit_daily_review(
    payload: DailyReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    local_date = payload.local_date
    target_date = datetime.strptime(local_date, "%Y-%m-%d").date()

    # Aggregate day metrics
    day_start = datetime.combine(target_date, datetime.min.time(), tzinfo=timezone.utc)
    day_end = datetime.combine(target_date, datetime.max.time(), tzinfo=timezone.utc)

    tasks_today = db.query(Task).filter(
        Task.user_id == current_user.id,
        (Task.scheduled_date == local_date) | (Task.updated_at >= day_start)
    ).all()

    completed_count = len([t for t in tasks_today if t.status == "completed"])
    postponed_count = len([t for t in tasks_today if t.status in ["postponed", "pending"]])

    sessions = db.query(FocusSession).filter(
        FocusSession.user_id == current_user.id,
        FocusSession.started_at >= day_start,
        FocusSession.started_at <= day_end
    ).all()
    focus_minutes_total = sum(s.actual_minutes or 0 for s in sessions)

    distractions = db.query(DistractionEvent).filter(
        DistractionEvent.user_id == current_user.id,
        DistractionEvent.occurred_at >= day_start,
        DistractionEvent.occurred_at <= day_end
    ).all()

    summary_text = (
        f"Completed {completed_count} tasks with {focus_minutes_total}m of deep focus. "
        f"{postponed_count} tasks deferred for tomorrow's optimal flow."
    )

    review = db.query(DailyReview).filter(
        DailyReview.user_id == current_user.id,
        DailyReview.local_date == local_date
    ).first()

    if not review:
        review = DailyReview(
            user_id=current_user.id,
            local_date=local_date
        )
        db.add(review)

    review.summary = summary_text
    review.completed_count = completed_count
    review.postponed_count = postponed_count
    review.focus_minutes_total = focus_minutes_total
    review.distraction_count = len(distractions)
    review.user_feedback = {
        "what_went_well": payload.what_went_well,
        "what_was_hard": payload.what_was_hard,
        "adjustments_for_tomorrow": payload.adjustments_for_tomorrow
    }

    db.commit()
    db.refresh(review)
    return review
