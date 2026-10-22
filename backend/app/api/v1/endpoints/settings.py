from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.entities import User, FixedEvent
from backend.app.schemas.schemas import UserOut, FixedEventCreate, FixedEventOut

router = APIRouter()

@router.get("", response_model=UserOut)
def get_user_settings(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("", response_model=UserOut)
def update_user_settings(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if "name" in payload:
        current_user.name = payload["name"]
    if "timezone" in payload:
        current_user.timezone = payload["timezone"]
    if "preferences" in payload:
        prefs = current_user.preferences or {}
        prefs.update(payload["preferences"])
        current_user.preferences = prefs

    db.commit()
    db.refresh(current_user)
    return current_user

# --- Fixed Events Management ---
@router.get("/fixed-events", response_model=List[FixedEventOut])
def get_fixed_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(FixedEvent).filter(FixedEvent.user_id == current_user.id).order_by(FixedEvent.start_at.asc()).all()

@router.post("/fixed-events", response_model=FixedEventOut)
def create_fixed_event(
    event_in: FixedEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fe = FixedEvent(
        user_id=current_user.id,
        title=event_in.title,
        start_at=event_in.start_at,
        end_at=event_in.end_at,
        recurrence_rule=event_in.recurrence_rule,
        color=event_in.color or "#64748b"
    )
    db.add(fe)
    db.commit()
    db.refresh(fe)
    return fe

@router.delete("/fixed-events/{event_id}")
def delete_fixed_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fe = db.query(FixedEvent).filter(
        FixedEvent.id == event_id,
        FixedEvent.user_id == current_user.id
    ).first()
    if not fe:
        raise HTTPException(status_code=404, detail="Fixed event not found")
    db.delete(fe)
    db.commit()
    return {"status": "deleted", "event_id": event_id}
