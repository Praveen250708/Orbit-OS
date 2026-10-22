from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.entities import User, LearningPath, LearningTopic, Task
from backend.app.schemas.schemas import LearningPathCreate, LearningPathOut, TopicOut
from backend.app.services.ai_generator import AITaskGenerator

router = APIRouter()

@router.get("", response_model=List[LearningPathOut])
def get_learning_paths(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    paths = db.query(LearningPath).filter(LearningPath.user_id == current_user.id).all()
    return paths

@router.get("/{path_id}", response_model=LearningPathOut)
def get_learning_path_detail(
    path_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    path = db.query(LearningPath).filter(
        LearningPath.id == path_id,
        LearningPath.user_id == current_user.id
    ).first()
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    return path

@router.post("", response_model=LearningPathOut)
def create_learning_path(
    path_in: LearningPathCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    path = LearningPath(
        user_id=current_user.id,
        goal_id=path_in.goal_id,
        title=path_in.title,
        description=path_in.description,
        status="active"
    )
    db.add(path)
    db.commit()
    db.refresh(path)
    return path

@router.post("/{path_id}/generate-topics")
async def generate_topics_for_path(
    path_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    path = db.query(LearningPath).filter(
        LearningPath.id == path_id,
        LearningPath.user_id == current_user.id
    ).first()
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")

    topics_data = await AITaskGenerator.generate_learning_path_topics(
        goal_title=path.title,
        goal_description=path.description
    )

    created_topics = []
    prev_topic_id = None
    for idx, t_data in enumerate(topics_data):
        topic = LearningTopic(
            learning_path_id=path.id,
            title=t_data["title"],
            description=t_data.get("description", ""),
            order_index=idx + 1,
            prerequisite_topic_ids=[prev_topic_id] if prev_topic_id else [],
            mastery_status="not_started",
            assessment_results={"criteria": t_data.get("criteria", [])}
        )
        db.add(topic)
        db.flush()

        # Generate associated task
        task = Task(
            user_id=current_user.id,
            goal_id=path.goal_id,
            learning_topic_id=topic.id,
            title=t_data["title"],
            description=t_data.get("description", ""),
            task_type=t_data.get("type", "learning"),
            priority="important",
            priority_score=60.0 - (idx * 5.0),
            estimated_minutes=t_data.get("minutes", 45),
            status="pending",
            source_type="learning_path",
            source_id=str(path.id),
            completion_criteria=t_data.get("criteria", []),
            suggested_subtasks=[{"title": s, "done": False} for s in t_data.get("subtasks", [])],
            energy_level="high" if t_data.get("type") == "coding" else "medium"
        )
        db.add(task)
        prev_topic_id = topic.id
        created_topics.append(topic)

    db.commit()
    db.refresh(path)
    return {"status": "success", "topics_generated": len(created_topics), "learning_path": path}

@router.patch("/topics/{topic_id}/mastery")
def update_topic_mastery(
    topic_id: int,
    mastery_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    topic = db.query(LearningTopic).join(LearningPath).filter(
        LearningTopic.id == topic_id,
        LearningPath.user_id == current_user.id
    ).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    topic.mastery_status = mastery_status
    db.commit()
    db.refresh(topic)
    return topic
