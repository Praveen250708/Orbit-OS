from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Float, Index, Enum
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=False)
    timezone = Column(String(100), default="UTC", nullable=False)
    preferences = Column(JSON, default=dict)  # waking_time, sleeping_time, focus_duration, break_duration, habits, etc.
    onboarding_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    goals = relationship("UserGoal", back_populates="user", cascade="all, delete-orphan")
    learning_paths = relationship("LearningPath", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    schedules = relationship("Schedule", back_populates="user", cascade="all, delete-orphan")
    fixed_events = relationship("FixedEvent", back_populates="user", cascade="all, delete-orphan")
    focus_sessions = relationship("FocusSession", back_populates="user", cascade="all, delete-orphan")
    distraction_events = relationship("DistractionEvent", back_populates="user", cascade="all, delete-orphan")
    daily_reviews = relationship("DailyReview", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class UserGoal(Base):
    __tablename__ = "user_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="career")  # career, study, health, project
    target_date = Column(DateTime(timezone=True), nullable=True)
    priority = Column(String(50), default="high")  # must-do, important, flexible, optional
    status = Column(String(50), default="in_progress")  # in_progress, achieved, paused, archived
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="goals")
    learning_paths = relationship("LearningPath", back_populates="goal", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="goal")


class LearningPath(Base):
    __tablename__ = "learning_paths"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    goal_id = Column(Integer, ForeignKey("user_goals.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="active")  # active, completed, paused
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="learning_paths")
    goal = relationship("UserGoal", back_populates="learning_paths")
    topics = relationship("LearningTopic", back_populates="learning_path", cascade="all, delete-orphan")


class LearningTopic(Base):
    __tablename__ = "learning_topics"

    id = Column(Integer, primary_key=True, index=True)
    learning_path_id = Column(Integer, ForeignKey("learning_paths.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    prerequisite_topic_ids = Column(JSON, default=list)  # list of topic ids
    mastery_status = Column(String(50), default="not_started")  # not_started, in_progress, practiced, mastered, needs_revision
    assessment_results = Column(JSON, default=dict)  # scores, quiz attempts, struggles, feedback
    created_at = Column(DateTime(timezone=True), default=utc_now)

    learning_path = relationship("LearningPath", back_populates="topics")
    tasks = relationship("Task", back_populates="learning_topic")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    goal_id = Column(Integer, ForeignKey("user_goals.id", ondelete="SET NULL"), nullable=True, index=True)
    learning_topic_id = Column(Integer, ForeignKey("learning_topics.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    task_type = Column(String(50), default="deep_work")  # deep_work, learning, coding, revision, habit, admin
    priority = Column(String(50), default="important")  # must-do, important, flexible, optional
    priority_score = Column(Float, default=50.0)  # calculated deterministic priority score
    estimated_minutes = Column(Integer, default=45, nullable=False)
    actual_minutes = Column(Integer, default=0)
    deadline = Column(DateTime(timezone=True), nullable=True)
    scheduled_date = Column(String(20), nullable=True, index=True)  # YYYY-MM-DD
    status = Column(String(50), default="pending", index=True)  # pending, in_progress, completed, skipped, postponed
    source_type = Column(String(50), default="user")  # goal, learning_path, routine, ai_generated, user
    source_id = Column(String(100), nullable=True)
    prerequisite_task_ids = Column(JSON, default=list)
    completion_criteria = Column(JSON, default=list)  # bullet points of acceptance
    suggested_subtasks = Column(JSON, default=list)  # list of {title, done: bool}
    energy_level = Column(String(20), default="medium")  # high, medium, low
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="tasks")
    goal = relationship("UserGoal", back_populates="tasks")
    learning_topic = relationship("LearningTopic", back_populates="tasks")
    schedule_items = relationship("ScheduleItem", back_populates="task")
    focus_sessions = relationship("FocusSession", back_populates="task")


class FixedEvent(Base):
    __tablename__ = "fixed_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    start_at = Column(DateTime(timezone=True), nullable=False)
    end_at = Column(DateTime(timezone=True), nullable=False)
    recurrence_rule = Column(String(100), nullable=True)  # e.g., "DAILY", "WEEKDAYS"
    color = Column(String(50), default="#64748b")
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="fixed_events")


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    local_date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    version = Column(Integer, default=1)
    status = Column(String(50), default="active")  # active, archived, replanned
    conflict_summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="schedules")
    items = relationship("ScheduleItem", back_populates="schedule", cascade="all, delete-orphan")


class ScheduleItem(Base):
    __tablename__ = "schedule_items"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True, index=True)
    fixed_event_id = Column(Integer, ForeignKey("fixed_events.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    start_at = Column(DateTime(timezone=True), nullable=False)
    end_at = Column(DateTime(timezone=True), nullable=False)
    item_type = Column(String(50), default="task")  # task, break, buffer, fixed_event
    status = Column(String(50), default="scheduled")  # scheduled, in_progress, completed, skipped, rescheduled
    created_at = Column(DateTime(timezone=True), default=utc_now)

    schedule = relationship("Schedule", back_populates="items")
    task = relationship("Task", back_populates="schedule_items")
    notifications = relationship("Notification", back_populates="schedule_item", cascade="all, delete-orphan")


class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True, index=True)
    started_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    planned_minutes = Column(Integer, default=25)
    actual_minutes = Column(Integer, default=0)
    completion_status = Column(String(50), default="in_progress")  # completed, partial, interrupted, extended
    notes = Column(Text, nullable=True)
    difficulty_feedback = Column(String(100), nullable=True)  # easy, normal, hard, stuck

    user = relationship("User", back_populates="focus_sessions")
    task = relationship("Task", back_populates="focus_sessions")
    distraction_events = relationship("DistractionEvent", back_populates="focus_session", cascade="all, delete-orphan")


class DistractionEvent(Base):
    __tablename__ = "distraction_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    focus_session_id = Column(Integer, ForeignKey("focus_sessions.id", ondelete="SET NULL"), nullable=True, index=True)
    trigger_type = Column(String(100), nullable=False)  # instagram_reels, phone_notification, daydreaming, urge_to_browse, hunger, other
    occurred_at = Column(DateTime(timezone=True), default=utc_now)
    duration_minutes = Column(Float, default=2.0)
    source = Column(String(50), default="self_reported")  # self_reported, detected, browser_nudge
    intervention_used = Column(String(100), nullable=True)  # breathing, 2_min_delay, phone_in_another_room, breakdown_task
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="distraction_events")
    focus_session = relationship("FocusSession", back_populates="distraction_events")


class DailyReview(Base):
    __tablename__ = "daily_reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    local_date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    summary = Column(Text, nullable=True)
    completed_count = Column(Integer, default=0)
    postponed_count = Column(Integer, default=0)
    focus_minutes_total = Column(Integer, default=0)
    distraction_count = Column(Integer, default=0)
    user_feedback = Column(JSON, default=dict)  # what went well, what was hard, adjustments
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="daily_reviews")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    schedule_item_id = Column(Integer, ForeignKey("schedule_items.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="task_start")  # task_start, break_over, deadline, checkin, review
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="pending")  # pending, delivered, acknowledged, dismissed

    user = relationship("User", back_populates="notifications")
    schedule_item = relationship("ScheduleItem", back_populates="notifications")
