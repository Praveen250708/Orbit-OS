from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from backend.app.models.entities import Task, UserGoal, LearningTopic

class PriorityEngine:
    """
    Transparent, deterministic task-priority scoring engine.
    Calculates score from 0.0 to 100.0 considering:
    - Goal importance (35%)
    - Deadline urgency (30%)
    - Dependencies / Prerequisites (15%)
    - Overdue status & history (10%)
    - Energy match (10%)
    """

    PRIORITY_WEIGHTS = {
        "must-do": 35.0,
        "important": 25.0,
        "flexible": 15.0,
        "optional": 5.0
    }

    @staticmethod
    def calculate_priority_score(
        task: Task,
        goal: Optional[UserGoal] = None,
        topic: Optional[LearningTopic] = None,
        current_energy: str = "medium",
        user_peak_energy: str = "morning",
        completed_task_ids: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        score = 0.0
        factors = []
        now = datetime.now(timezone.utc)
        completed_set = set(completed_task_ids or [])

        # 1. Base Priority Weight
        task_pri = (task.priority or "important").lower()
        base_pri_score = PriorityEngine.PRIORITY_WEIGHTS.get(task_pri, 20.0)
        score += base_pri_score
        factors.append(f"Base priority: {task_pri} (+{base_pri_score:.1f})")

        # 2. Goal Alignment
        if goal:
            goal_pri = (goal.priority or "important").lower()
            goal_boost = PriorityEngine.PRIORITY_WEIGHTS.get(goal_pri, 15.0) * 0.3
            score += goal_boost
            factors.append(f"Linked to goal '{goal.title[:20]}' (+{goal_boost:.1f})")

        # 3. Deadline Urgency
        if task.deadline:
            deadline = task.deadline
            if deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)
            
            hours_left = (deadline - now).total_seconds() / 3600.0
            
            if hours_left < 0:
                # Overdue: give significant urgency, but capped so it doesn't freeze everything
                urgency = 25.0
                factors.append("Overdue task (+25.0)")
            elif hours_left <= 12:
                urgency = 25.0
                factors.append("Due within 12 hours (+25.0)")
            elif hours_left <= 24:
                urgency = 20.0
                factors.append("Due within 24 hours (+20.0)")
            elif hours_left <= 48:
                urgency = 15.0
                factors.append("Due within 2 days (+15.0)")
            elif hours_left <= 120:
                urgency = 8.0
                factors.append("Due within 5 days (+8.0)")
            else:
                urgency = 3.0
                factors.append("Deadline distant (+3.0)")
            score += urgency
        else:
            score += 5.0

        # 4. Prerequisites & Learning Status
        prereqs = task.prerequisite_task_ids or []
        if prereqs:
            unmet = [pid for pid in prereqs if pid not in completed_set]
            if unmet:
                # Penalize blocked task so executable tasks are done first
                score = max(5.0, score - 30.0)
                factors.append(f"Blocked by {len(unmet)} incomplete prerequisite task(s) (-30.0)")
            else:
                score += 10.0
                factors.append("All prerequisites satisfied (+10.0)")

        if topic and topic.mastery_status in ["needs_revision", "in_progress"]:
            score += 8.0
            factors.append(f"Topic reinforcement ({topic.mastery_status}) (+8.0)")

        # 5. Energy matching
        task_energy = (task.energy_level or "medium").lower()
        if task_energy == current_energy.lower():
            score += 7.0
            factors.append(f"Matches current energy level ({current_energy}) (+7.0)")
        elif current_energy == "low" and task_energy == "high":
            score = max(5.0, score - 10.0)
            factors.append("Demanding task during low energy period (-10.0)")

        final_score = round(min(100.0, max(0.0, score)), 1)
        
        explanation = "; ".join(factors)
        return {
            "score": final_score,
            "explanation": explanation
        }

    @staticmethod
    def rank_tasks(
        tasks: List[Task],
        goals_map: Dict[int, UserGoal],
        topics_map: Dict[int, LearningTopic],
        current_energy: str = "medium",
        user_peak_energy: str = "morning",
        completed_task_ids: Optional[List[int]] = None
    ) -> List[tuple[Task, float, str]]:
        ranked = []
        for task in tasks:
            goal = goals_map.get(task.goal_id) if task.goal_id else None
            topic = topics_map.get(task.learning_topic_id) if task.learning_topic_id else None
            calc = PriorityEngine.calculate_priority_score(
                task=task,
                goal=goal,
                topic=topic,
                current_energy=current_energy,
                user_peak_energy=user_peak_energy,
                completed_task_ids=completed_task_ids
            )
            task.priority_score = calc["score"]
            ranked.append((task, calc["score"], calc["explanation"]))

        ranked.sort(key=lambda x: x[1], reverse=True)
        return ranked
