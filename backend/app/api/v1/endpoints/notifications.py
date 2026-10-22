from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.entities import User, Notification
from backend.app.schemas.schemas import NotificationOut
from backend.app.services.notification_service import NotificationService

router = APIRouter()

@router.get("", response_model=List[NotificationOut])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return NotificationService.get_pending_notifications(db, current_user.id)

@router.patch("/{notification_id}/acknowledge", response_model=NotificationOut)
def acknowledge_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = NotificationService.acknowledge_notification(db, notification_id, current_user.id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif
