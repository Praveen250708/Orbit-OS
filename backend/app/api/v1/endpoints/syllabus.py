from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.entities import User, UserGoal, LearningPath, LearningTopic, Task
from backend.app.services.syllabus_service import SyllabusService, COURSES_SYLLABUS_DB

router = APIRouter()

class QuestionRequest(BaseModel):
    course_title: str
    unit_title: str
    topic_name: str
    question: str

class CustomSyllabusParseRequest(BaseModel):
    subject_title: str
    raw_syllabus_text: str

@router.get("/courses")
def get_courses():
    return SyllabusService.get_all_courses()

@router.get("/courses/{course_id}")
def get_course_syllabus(course_id: str):
    course = SyllabusService.get_course_detail(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course syllabus not found")
    return course

@router.post("/answer")
async def generate_answer(req: QuestionRequest):
    return await SyllabusService.answer_syllabus_question(
        course_title=req.course_title,
        unit_title=req.unit_title,
        topic_name=req.topic_name,
        question=req.question
    )

@router.post("/courses/{course_id}/enroll")
def enroll_course_as_goal(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    course = SyllabusService.get_course_detail(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # 1. Create UserGoal
    goal = UserGoal(
        user_id=current_user.id,
        title=f"Course: {course['title']}",
        description=f"Complete all 5 units for {course['code']} based on official syllabus.",
        category="study",
        priority="must-do",
        status="in_progress"
    )
    db.add(goal)
    db.flush()

    # 2. Create LearningPath
    lp = LearningPath(
        user_id=current_user.id,
        goal_id=goal.id,
        title=f"{course['title']} Syllabus Roadmap",
        description=course['description'],
        status="active"
    )
    db.add(lp)
    db.flush()

    # 3. Create Topics & Tasks for each Unit
    prev_topic_id = None
    created_tasks = []
    order = 1
    for unit in course["units"]:
        for t in unit["topics"]:
            topic = LearningTopic(
                learning_path_id=lp.id,
                title=f"{unit['unit_number']}: {t['name']}",
                description=f"Subtopics: {', '.join(t['subtopics'][:3])}",
                order_index=order,
                prerequisite_topic_ids=[prev_topic_id] if prev_topic_id else [],
                mastery_status="not_started",
                assessment_results={"sample_questions": t.get("sample_questions", [])}
            )
            db.add(topic)
            db.flush()

            task = Task(
                user_id=current_user.id,
                goal_id=goal.id,
                learning_topic_id=topic.id,
                title=f"Study {unit['unit_number']}: {t['name']}",
                description=f"Covers: {'; '.join(t['subtopics'])}",
                task_type="learning",
                priority="must-do",
                priority_score=75.0 - (order * 2.0),
                estimated_minutes=45,
                status="pending",
                source_type="learning_path",
                source_id=str(lp.id),
                completion_criteria=[
                    f"Explain core principles of {t['name']}",
                    "Answer key sample questions from this unit"
                ],
                suggested_subtasks=[{"title": sub, "done": False} for sub in t["subtopics"]],
                energy_level="high"
            )
            db.add(task)
            prev_topic_id = topic.id
            created_tasks.append(task)
            order += 1

    db.commit()
    db.refresh(goal)
    return {
        "status": "success",
        "message": f"Enrolled in {course['title']}! Created {len(created_tasks)} study tasks.",
        "goal_id": goal.id,
        "learning_path_id": lp.id
    }
