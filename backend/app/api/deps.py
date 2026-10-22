from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import decode_access_token
from backend.app.models.entities import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # If no token is provided, check if a demo user exists in DB or create one for easy friction-free first run
    if not token:
        demo_user = db.query(User).filter(User.email == "demo@orbitos.ai").first()
        if demo_user:
            return demo_user
        # Auto-create demo user
        from backend.app.core.security import get_password_hash
        demo_user = User(
            email="demo@orbitos.ai",
            name="Alex Mercer",
            password_hash=get_password_hash("orbitdemo123"),
            timezone="UTC",
            preferences={
                "waking_time": "07:00",
                "sleeping_time": "23:00",
                "daily_available_hours": 6.5,
                "focus_duration": 45,
                "break_duration": 10,
                "long_break_duration": 25,
                "phone_distraction_guard": True,
                "energy_peak": "morning",
                "distraction_apps": ["Instagram Reels", "YouTube Shorts", "TikTok"]
            },
            onboarding_completed=True
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        return demo_user

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user
