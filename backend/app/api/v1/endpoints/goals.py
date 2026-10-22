from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.entities import User, UserGoal, LearningPath, LearningTopic, Task
from backend.app.schemas.schemas import GoalCreate, GoalUpdate, GoalOut
from backend.app.services.ai_generator import AITaskGenerator

router = APIRouter()

@router.get("", response_model=List[GoalOut])
def get_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(UserGoal).filter(UserGoal.user_id == current_user.id).order_by(UserGoal.created_at.desc()).all()

@router.post("", response_model=GoalOut)
async def create_goal(
    goal_in: GoalCreate,
    auto_generate_path: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = UserGoal(
        user_id=current_user.id,
        title=goal_in.title,
        description=goal_in.description,
        category=goal_in.category,
        target_date=goal_in.target_date,
        priority=goal_in.priority,
        status="in_progress"
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)

    # Automatically derive learning roadmap / project tasks for this goal
    if auto_generate_path:
        topics_data = await AITaskGenerator.generate_learning_path_topics(
            goal_title=goal.title,
            goal_description=goal.description
        )

        lp = LearningPath(
            user_id=current_user.id,
            goal_id=goal.id,
            title=f"Roadmap: {goal.title}",
            description=f"Automated path decomposed from goal '{goal.title}'",
            status="active"
        )
        db.add(lp)
        db.flush()

        prev_topic_id = None
        for idx, t_data in enumerate(topics_data):
            topic = LearningTopic(
                learning_path_id=lp.id,
                title=t_data["title"],
                description=t_data.get("description", ""),
                order_index=idx + 1,
                prerequisite_topic_ids=[prev_topic_id] if prev_topic_id else [],
                mastery_status="not_started",
                assessment_results={"criteria": t_data.get("criteria", [])}
            )
            db.add(topic)
            db.flush()

            # Create the initial task for this topic
            task = Task(
                user_id=current_user.id,
                goal_id=goal.id,
                learning_topic_id=topic.id,
                title=t_data["title"],
                description=t_data.get("description", ""),
                task_type=t_data.get("type", "learning"),
                priority=goal.priority,
                priority_score=60.0 - (idx * 5.0), # earlier topics prioritized
                estimated_minutes=t_data.get("minutes", 45),
                status="pending",
                source_type="learning_path",
                source_id=str(lp.id),
                completion_criteria=t_data.get("criteria", []),
                suggested_subtasks=[{"title": s, "done": False} for s in t_data.get("subtasks", [])],
                energy_level="high" if t_data.get("type") == "coding" else "medium"
            )
            db.add(task)
            prev_topic_id = topic.id

        db.commit()

    return goal

@router.patch("/{goal_id}", response_model=GoalOut)
def update_goal(
    goal_id: int,
    goal_update: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(UserGoal).filter(
        UserGoal.id == goal_id,
        UserGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    update_data = goal_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)

    db.commit()
    db.refresh(goal)
    return goal
