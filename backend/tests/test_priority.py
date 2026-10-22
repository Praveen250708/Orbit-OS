import unittest
from datetime import datetime, timezone, timedelta
from backend.app.models.entities import Task, UserGoal, LearningTopic
from backend.app.services.priority_engine import PriorityEngine

class TestPriorityEngine(unittest.TestCase):
    def test_deadline_urgency_scoring(self):
        now = datetime.now(timezone.utc)
        
        # Urgent task due in 6 hours
        urgent_task = Task(
            title="Submit Report",
            priority="must-do",
            deadline=now + timedelta(hours=6),
            energy_level="medium"
        )
        urgent_calc = PriorityEngine.calculate_priority_score(urgent_task)
        
        # Distant task due in 2 weeks
        distant_task = Task(
            title="Read Optional Paper",
            priority="optional",
            deadline=now + timedelta(days=14),
            energy_level="medium"
        )
        distant_calc = PriorityEngine.calculate_priority_score(distant_task)

        self.assertGreater(urgent_calc["score"], distant_calc["score"])
        self.assertIn("Due within 12 hours", urgent_calc["explanation"])

    def test_prerequisite_penalty(self):
        blocked_task = Task(
            title="Advanced Transformers",
            priority="important",
            prerequisite_task_ids=[101, 102],
            energy_level="medium"
        )
        
        # With prerequisites incomplete
        blocked_calc = PriorityEngine.calculate_priority_score(blocked_task, completed_task_ids=[])
        
        # With prerequisites satisfied
        satisfied_calc = PriorityEngine.calculate_priority_score(blocked_task, completed_task_ids=[101, 102])

        self.assertLess(blocked_calc["score"], satisfied_calc["score"])
        self.assertIn("incomplete prerequisite", blocked_calc["explanation"])
        self.assertIn("satisfied", satisfied_calc["explanation"])

if __name__ == "__main__":
    unittest.main()
