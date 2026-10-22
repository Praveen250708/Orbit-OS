from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.entities import User, Task, ScheduleItem, LearningTopic, UserGoal
from backend.app.schemas.schemas import TaskCreate, TaskUpdate, TaskOut, TaskCompleteRequest, TaskRescheduleRequest
from backend.app.services.priority_engine import PriorityEngine
from backend.app.services.ai_generator import AITaskGenerator

router = APIRouter()

@router.get("", response_model=List[TaskOut])
def get_tasks(
    status: Optional[str] = None,
    goal_id: Optional[int] = None,
    scheduled_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Task).filter(Task.user_id == current_user.id)
    if status:
        query = query.filter(Task.status == status)
    if goal_id:
        query = query.filter(Task.goal_id == goal_id)
    if scheduled_date:
        query = query.filter(Task.scheduled_date == scheduled_date)
    return query.order_by(Task.priority_score.desc(), Task.created_at.desc()).all()

@router.post("", response_model=TaskOut)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Deduplication check: avoid exact duplicate pending tasks
    existing = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.title == task_in.title,
        Task.status == "pending"
    ).first()
    if existing:
        return existing

    goal = db.query(UserGoal).filter(UserGoal.id == task_in.goal_id).first() if task_in.goal_id else None
    
    task = Task(
        user_id=current_user.id,
        goal_id=task_in.goal_id,
        learning_topic_id=task_in.learning_topic_id,
        title=task_in.title,
        description=task_in.description,
        task_type=task_in.task_type,
        priority=task_in.priority,
        estimated_minutes=task_in.estimated_minutes,
        deadline=task_in.deadline,
        scheduled_date=task_in.scheduled_date,
        status="pending",
        source_type=task_in.source_type,
        source_id=task_in.source_id,
        completion_criteria=task_in.completion_criteria,
        suggested_subtasks=task_in.suggested_subtasks,
        energy_level=task_in.energy_level
    )
    
    # Calculate initial priority score
    calc = PriorityEngine.calculate_priority_score(task=task, goal=goal)
    task.priority_score = calc["score"]

    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_dict = task_update.dict(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(task, field, val)

    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return task

@router.post("/{task_id}/complete", response_model=TaskOut)
def complete_task(
    task_id: int,
    req: TaskCompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if req.actual_minutes is not None:
        task.actual_minutes += req.actual_minutes
    elif task.actual_minutes == 0:
        task.actual_minutes = task.estimated_minutes

    if req.completion_status == "completed":
        task.status = "completed"
        # If attached to a learning topic, advance mastery status
        if task.learning_topic_id:
            topic = db.query(LearningTopic).filter(LearningTopic.id == task.learning_topic_id).first()
            if topic:
                topic.mastery_status = "practiced"
    elif req.completion_status == "partial":
        task.status = "in_progress"
        if req.remaining_minutes_needed and req.remaining_minutes_needed > 0:
            task.estimated_minutes = req.remaining_minutes_needed
    elif req.completion_status == "needs_more_time":
        task.status = "pending"
        if req.remaining_minutes_needed and req.remaining_minutes_needed > 0:
            task.estimated_minutes = req.remaining_minutes_needed

    # Update any active schedule item for this task
    sched_item = db.query(ScheduleItem).filter(
        ScheduleItem.task_id == task.id,
        ScheduleItem.status == "scheduled"
    ).first()
    if sched_item:
        sched_item.status = "completed" if task.status == "completed" else "in_progress"

    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return task

@router.post("/{task_id}/reschedule", response_model=TaskOut)
def reschedule_task(
    task_id: int,
    req: TaskRescheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.scheduled_date = req.new_date
    task.status = "postponed"
    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return task

@router.post("/{task_id}/breakdown")
async def breakdown_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    micro_steps = await AITaskGenerator.breakdown_difficult_task(
        task_title=task.title,
        task_desc=task.description,
        user_difficulty="stuck"
    )

    # Attach micro-steps to task's suggested subtasks
    existing_subtasks = list(task.suggested_subtasks or [])
    for step in micro_steps:
        existing_subtasks.append({"title": step["title"], "done": False, "tip": step.get("tip", "")})
    
    task.suggested_subtasks = existing_subtasks
    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return {"status": "success", "task": task, "micro_steps": micro_steps}
