from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- User & Auth ---
class UserBase(BaseModel):
    email: str
    name: Optional[str] = None
    timezone: str = "UTC"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserPreferences(BaseModel):
    waking_time: str = "07:00"
    sleeping_time: str = "23:00"
    daily_available_hours: float = 6.0
    focus_duration: int = 45  # minutes
    break_duration: int = 10  # minutes
    long_break_duration: int = 25  # minutes
    sessions_before_long_break: int = 3
    phone_distraction_guard: bool = True
    distraction_apps: List[str] = ["Instagram Reels", "YouTube Shorts", "TikTok", "X / Twitter"]
    energy_peak: str = "morning"  # morning, afternoon, evening
    preferred_language: str = "en"
    reminders_enabled: bool = True
    quiet_hours_start: str = "23:00"
    quiet_hours_end: str = "07:00"

class UserOut(UserBase):
    id: int
    onboarding_completed: bool
    preferences: Dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True

# --- Goals ---
class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "career"
    target_date: Optional[datetime] = None
    priority: str = "important"  # must-do, important, flexible, optional

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    target_date: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class GoalOut(GoalBase):
    id: int
    user_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Learning Path & Topics ---
class TopicBase(BaseModel):
    title: str
    description: Optional[str] = None
    order_index: int = 0
    prerequisite_topic_ids: List[int] = []
    mastery_status: str = "not_started"

class TopicOut(TopicBase):
    id: int
    learning_path_id: int
    assessment_results: Dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True

class LearningPathCreate(BaseModel):
    goal_id: Optional[int] = None
    title: str
    description: Optional[str] = None

class LearningPathOut(BaseModel):
    id: int
    user_id: int
    goal_id: Optional[int]
    title: str
    description: Optional[str]
    status: str
    created_at: datetime
    topics: List[TopicOut] = []

    class Config:
        from_attributes = True

# --- Tasks ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    goal_id: Optional[int] = None
    learning_topic_id: Optional[int] = None
    task_type: str = "deep_work"  # deep_work, learning, coding, revision, habit, admin
    priority: str = "important"  # must-do, important, flexible, optional
    estimated_minutes: int = 45
    deadline: Optional[datetime] = None
    scheduled_date: Optional[str] = None
    completion_criteria: List[str] = []
    suggested_subtasks: List[Dict[str, Any]] = []
    energy_level: str = "medium"

class TaskCreate(TaskBase):
    source_type: str = "user"
    source_id: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    goal_id: Optional[int] = None
    task_type: Optional[str] = None
    priority: Optional[str] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    deadline: Optional[datetime] = None
    scheduled_date: Optional[str] = None
    status: Optional[str] = None
    completion_criteria: Optional[List[str]] = None
    suggested_subtasks: Optional[List[Dict[str, Any]]] = None
    energy_level: Optional[str] = None

class TaskCompleteRequest(BaseModel):
    actual_minutes: Optional[int] = None
    notes: Optional[str] = None
    completion_status: str = "completed"  # completed, partial, needs_more_time
    remaining_minutes_needed: Optional[int] = 0

class TaskRescheduleRequest(BaseModel):
    new_date: Optional[str] = None
    reason: Optional[str] = "user_requested"

class TaskOut(TaskBase):
    id: int
    user_id: int
    priority_score: float
    actual_minutes: int
    status: str
    source_type: str
    source_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Fixed Events ---
class FixedEventBase(BaseModel):
    title: str
    start_at: datetime
    end_at: datetime
    recurrence_rule: Optional[str] = None
    color: Optional[str] = "#64748b"

class FixedEventCreate(FixedEventBase):
    pass

class FixedEventOut(FixedEventBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Schedule & Timeline ---
class ScheduleItemOut(BaseModel):
    id: int
    schedule_id: int
    task_id: Optional[int]
    fixed_event_id: Optional[int]
    title: str
    start_at: datetime
    end_at: datetime
    item_type: str
    status: str
    task: Optional[TaskOut] = None

    class Config:
        from_attributes = True

class ScheduleOut(BaseModel):
    id: int
    user_id: int
    local_date: str
    version: int
    status: str
    conflict_summary: Optional[str] = None
    items: List[ScheduleItemOut] = []
    created_at: datetime

    class Config:
        from_attributes = True

class ScheduleGenerateRequest(BaseModel):
    local_date: str  # YYYY-MM-DD
    available_hours: Optional[float] = None
    readiness_energy: Optional[str] = "medium"  # high, medium, low
    new_urgent_tasks: Optional[List[str]] = []

class ScheduleReplanRequest(BaseModel):
    local_date: str
    reason: Optional[str] = "schedule_drift"

# --- Daily Check-in ---
class DailyCheckinRequest(BaseModel):
    local_date: str
    energy_level: str = "medium"  # high, medium, low
    available_hours: Optional[float] = None
    changes_today: Optional[str] = None
    new_urgent_task_titles: List[str] = []
    confirm_priorities: bool = True

class DailyCheckinStatus(BaseModel):
    already_checked_in: bool
    last_checkin_date: Optional[str] = None
    pending_yesterday_tasks: List[TaskOut] = []
    upcoming_fixed_events: List[FixedEventOut] = []
    today_schedule: Optional[ScheduleOut] = None

# --- Focus Session ---
class FocusSessionStart(BaseModel):
    task_id: Optional[int] = None
    planned_minutes: int = 25

class FocusSessionUpdate(BaseModel):
    ended_at: Optional[datetime] = None
    actual_minutes: Optional[int] = None
    completion_status: Optional[str] = None
    notes: Optional[str] = None
    difficulty_feedback: Optional[str] = None

class FocusSessionOut(BaseModel):
    id: int
    user_id: int
    task_id: Optional[int]
    started_at: datetime
    ended_at: Optional[datetime]
    planned_minutes: int
    actual_minutes: int
    completion_status: str
    notes: Optional[str]
    difficulty_feedback: Optional[str]

    class Config:
        from_attributes = True

# --- Distractions ---
class DistractionEventCreate(BaseModel):
    focus_session_id: Optional[int] = None
    trigger_type: str  # instagram_reels, phone_notification, daydreaming, urge_to_browse, hunger, other
    duration_minutes: float = 2.0
    source: str = "self_reported"
    intervention_used: Optional[str] = None
    notes: Optional[str] = None

class DistractionEventOut(BaseModel):
    id: int
    user_id: int
    focus_session_id: Optional[int]
    trigger_type: str
    occurred_at: datetime
    duration_minutes: float
    source: str
    intervention_used: Optional[str]
    notes: Optional[str]

    class Config:
        from_attributes = True

# --- Daily Review ---
class DailyReviewCreate(BaseModel):
    local_date: str
    what_went_well: Optional[str] = None
    what_was_hard: Optional[str] = None
    adjustments_for_tomorrow: Optional[str] = None

class DailyReviewOut(BaseModel):
    id: int
    user_id: int
    local_date: str
    summary: Optional[str]
    completed_count: int
    postponed_count: int
    focus_minutes_total: int
    distraction_count: int
    user_feedback: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Analytics ---
class WeeklyAnalytics(BaseModel):
    completion_rate: float
    total_focus_minutes: int
    planned_vs_actual_ratio: float
    total_distractions: int
    daily_completion_trend: List[Dict[str, Any]]
    distraction_triggers_distribution: List[Dict[str, Any]]
    top_habit_consistency: float
    personalized_suggestions: List[str]

# --- Notifications ---
class NotificationOut(BaseModel):
    id: int
    user_id: int
    schedule_item_id: Optional[int]
    title: str
    message: str
    notification_type: str
    scheduled_at: datetime
    delivered_at: Optional[datetime]
    acknowledged_at: Optional[datetime]
    status: str

    class Config:
        from_attributes = True

class TodayDashboardOut(BaseModel):
    greeting: str
    current_date: str
    on_track: bool
    status_message: str
    completed_tasks_count: int
    total_tasks_count: int
    focus_minutes_today: int
    daily_focus_target_minutes: int
    current_task: Optional[TaskOut] = None
    next_task: Optional[TaskOut] = None
    schedule: Optional[ScheduleOut] = None
    upcoming_tasks: List[TaskOut] = []
    unfinished_tasks: List[TaskOut] = []
    distraction_summary: Dict[str, Any] = {}
