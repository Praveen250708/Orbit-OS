from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.entities import User, DistractionEvent
from backend.app.schemas.schemas import DistractionEventCreate, DistractionEventOut

router = APIRouter()

INTERVENTION_GUIDES = {
    "instagram_reels": {
        "title": "2-Minute Pause & Environmental Shift",
        "action": "Place your phone face down in another room or across the desk.",
        "micro_technique": "Take 3 deep physiological sighs (double inhale through nose, long exhale through mouth). Notice that the urge to scroll peaks in 90 seconds and dissolves.",
        "mindset": "Scrolling gives cheap dopamine spikes that drain deep work energy. Protect your mental clarity."
    },
    "phone_notification": {
        "title": "Notification Batching Protocol",
        "action": "Silence notifications and enable Do Not Disturb for 30 minutes.",
        "micro_technique": "Write down who you want to message on a piece of paper, and promise yourself you will check it during the scheduled break.",
        "mindset": "All urgent messages can wait 25 minutes."
    },
    "urge_to_browse": {
        "title": "Friction Wall Intervention",
        "action": "Close non-essential browser tabs.",
        "micro_technique": "Write the search term on a physical sticky note. Tell yourself: 'I will explore this during my 10-minute break.'",
        "mindset": "Context switching costs up to 20 minutes of cognitive recovery time."
    },
    "daydreaming": {
        "title": "Gentle Focus Re-Anchor",
        "action": "Stand up, stretch for 30 seconds, drink a glass of water.",
        "micro_technique": "Look at the current subtask title and say out loud what you need to type or write next.",
        "mindset": "Wandering attention is completely natural. Simply guide your attention back without frustration."
    }
}

@router.get("", response_model=List[DistractionEventOut])
def get_distraction_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(DistractionEvent).filter(
        DistractionEvent.user_id == current_user.id
    ).order_by(DistractionEvent.occurred_at.desc()).limit(50).all()

@router.post("", response_model=Dict[str, Any])
def record_distraction(
    payload: DistractionEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Lookup intervention guide
    guide = INTERVENTION_GUIDES.get(payload.trigger_type, {
        "title": "Mindful Re-centering",
        "action": "Take a 60-second breath break and re-read the current subtask.",
        "micro_technique": "Acknowledge the distraction calmly and refocus.",
        "mindset": "Progress is built on gentle course corrections."
    })

    event = DistractionEvent(
        user_id=current_user.id,
        focus_session_id=payload.focus_session_id,
        trigger_type=payload.trigger_type,
        occurred_at=datetime.now(timezone.utc),
        duration_minutes=payload.duration_minutes,
        source=payload.source,
        intervention_used=payload.intervention_used or guide["title"],
        notes=payload.notes
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return {
        "status": "recorded",
        "event_id": event.id,
        "intervention": guide
    }
