import unittest
from datetime import datetime, date, time, timedelta, timezone
from backend.app.models.entities import Task, FixedEvent
from backend.app.services.scheduler_engine import SchedulerEngine

class TestSchedulerEngine(unittest.TestCase):
    def test_fixed_event_zero_overlap(self):
        target_d = date(2026, 10, 23)
        
        # Fixed lecture from 14:00 to 15:30
        lecture = FixedEvent(
            id=1,
            title="University Lecture",
            start_at=datetime(2026, 10, 23, 14, 0, tzinfo=timezone.utc),
            end_at=datetime(2026, 10, 23, 15, 30, tzinfo=timezone.utc)
        )
        
        task1 = Task(id=1, title="Deep Work Coding", estimated_minutes=60, priority_score=90.0, status="pending")
        task2 = Task(id=2, title="Algorithm Problem", estimated_minutes=45, priority_score=80.0, status="pending")
        task3 = Task(id=3, title="Review Notes", estimated_minutes=30, priority_score=70.0, status="pending")

        prefs = {
            "waking_time": "08:00",
            "sleeping_time": "22:00",
            "focus_duration": 45,
            "break_duration": 10,
            "long_break_duration": 25
        }

        res = SchedulerEngine.schedule_day(
            target_date=target_d,
            tasks=[task1, task2, task3],
            fixed_events=[lecture],
            user_preferences=prefs
        )

        items = res["items"]
        self.assertGreater(len(items), 0)

        # Verify no task overlaps with the fixed event
        lec_start = lecture.start_at
        lec_end = lecture.end_at

        for item in items:
            if item["item_type"] == "task":
                i_start = item["start_at"]
                i_end = item["end_at"]
                # Overlap check
                has_overlap = max(i_start, lec_start) < min(i_end, lec_end)
                self.assertFalse(has_overlap, f"Task '{item['title']}' ({i_start} - {i_end}) overlaps with lecture ({lec_start} - {lec_end})")

    def test_sleep_boundary_protection_and_conflict_detection(self):
        target_d = date(2026, 10, 23)
        # 10 massive 90-minute tasks (900 minutes = 15 hours), while waking window is only 6 hours
        heavy_tasks = [
            Task(id=i, title=f"Giant Task {i}", estimated_minutes=90, priority="must-do", priority_score=80.0, status="pending")
            for i in range(1, 11)
        ]

        prefs = {
            "waking_time": "12:00",
            "sleeping_time": "18:00",  # Only 6 hours available
            "focus_duration": 45,
            "break_duration": 10
        }

        res = SchedulerEngine.schedule_day(
            target_date=target_d,
            tasks=heavy_tasks,
            fixed_events=[],
            user_preferences=prefs
        )

        # Scheduler must defer overflow tasks and register conflict
        self.assertGreater(len(res["deferred_tasks"]), 0)
        self.assertGreater(len(res["conflicts"]), 0)
        
        # Verified that all scheduled items end before or at 18:00 UTC
        day_end = datetime(2026, 10, 23, 18, 0, tzinfo=timezone.utc)
        for item in res["items"]:
            self.assertLessEqual(item["end_at"], day_end)

if __name__ == "__main__":
    unittest.main()
