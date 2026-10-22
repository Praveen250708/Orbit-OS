from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.entities import User, FocusSession, Task, ScheduleItem
from backend.app.schemas.schemas import FocusSessionStart, FocusSessionUpdate, FocusSessionOut

router = APIRouter()

@router.post("", response_model=FocusSessionOut)
def start_focus_session(
    payload: FocusSessionStart,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = FocusSession(
        user_id=current_user.id,
        task_id=payload.task_id,
        started_at=datetime.now(timezone.utc),
        planned_minutes=payload.planned_minutes,
        completion_status="in_progress"
    )
    db.add(session)

    # Mark task as in_progress if attached
    if payload.task_id:
        task = db.query(Task).filter(Task.id == payload.task_id, Task.user_id == current_user.id).first()
        if task and task.status == "pending":
            task.status = "in_progress"

    db.commit()
    db.refresh(session)
    return session

@router.patch("/{session_id}", response_model=FocusSessionOut)
def update_focus_session(
    session_id: int,
    payload: FocusSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(FocusSession).filter(
        FocusSession.id == session_id,
        FocusSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Focus session not found")

    session.ended_at = payload.ended_at or datetime.now(timezone.utc)
    if payload.actual_minutes is not None:
        session.actual_minutes = payload.actual_minutes
    else:
        # Calculate from start to end
        delta_mins = int((session.ended_at - session.started_at).total_seconds() / 60)
        session.actual_minutes = max(1, delta_mins)

    if payload.completion_status:
        session.completion_status = payload.completion_status
    if payload.notes:
        session.notes = payload.notes
    if payload.difficulty_feedback:
        session.difficulty_feedback = payload.difficulty_feedback

    # Update associated task actual_minutes
    if session.task_id and session.actual_minutes > 0:
        task = db.query(Task).filter(Task.id == session.task_id, Task.user_id == current_user.id).first()
        if task:
            task.actual_minutes = (task.actual_minutes or 0) + session.actual_minutes
            if session.completion_status == "completed":
                task.status = "completed"

    db.commit()
    db.refresh(session)
    return session
