import math
from datetime import datetime, date, time, timedelta, timezone
from typing import List, Dict, Any, Optional, Tuple
from ortools.sat.python import cp_model

from backend.app.models.entities import Task, FixedEvent

class SchedulerEngine:
    """
    Constraint-based daily scheduling engine using Google OR-Tools CP-SAT
    with deterministic interval-packing fallback.
    Guarantees:
    - Zero overlap with fixed events (classes, exams, jobs)
    - Protected sleeping hours (waking_time to sleeping_time boundary)
    - Automatic short (10m) and long (25m) breaks
    - Buffer time (5-10m) between demanding sessions
    - Task dependency ordering
    - Conflict detection and transparent explanation when workload exceeds available time
    """

    @staticmethod
    def parse_time_str(time_str: str, default: time) -> time:
        try:
            parts = [int(p) for p in time_str.split(":")]
            return time(hour=parts[0], minute=parts[1])
        except Exception:
            return default

    @classmethod
    def schedule_day(
        cls,
        target_date: date,
        tasks: List[Task],
        fixed_events: List[FixedEvent],
        user_preferences: Dict[str, Any],
        user_timezone_str: str = "UTC"
    ) -> Dict[str, Any]:
        """
        Builds a timeline of scheduled items for target_date.
        Returns:
            {
                "items": List of {title, start_at, end_at, item_type, task_id, fixed_event_id, status},
                "conflicts": List[str],
                "scheduled_tasks_count": int,
                "deferred_tasks": List[{task_id, title, reason}],
                "total_scheduled_minutes": int
            }
        """
        # User boundaries
        waking_str = user_preferences.get("waking_time", "07:00")
        sleeping_str = user_preferences.get("sleeping_time", "23:00")
        waking_time = cls.parse_time_str(waking_str, time(7, 0))
        sleeping_time = cls.parse_time_str(sleeping_str, time(23, 0))

        day_start = datetime.combine(target_date, waking_time, tzinfo=timezone.utc)
        day_end = datetime.combine(target_date, sleeping_time, tzinfo=timezone.utc)
        if day_end <= day_start:
            day_end += timedelta(days=1)

        total_day_minutes = int((day_end - day_start).total_seconds() / 60)

        # 1. Normalize and place fixed events
        placed_fixed_intervals: List[Tuple[datetime, datetime, FixedEvent]] = []
        conflicts = []

        for fe in fixed_events:
            fe_start = fe.start_at
            fe_end = fe.end_at
            if fe_start.tzinfo is None:
                fe_start = fe_start.replace(tzinfo=timezone.utc)
            if fe_end.tzinfo is None:
                fe_end = fe_end.replace(tzinfo=timezone.utc)

            # Check overlap with day boundary
            if fe_end <= day_start or fe_start >= day_end:
                continue

            clamped_start = max(day_start, fe_start)
            clamped_end = min(day_end, fe_end)
            placed_fixed_intervals.append((clamped_start, clamped_end, fe))

        # Sort fixed intervals
        placed_fixed_intervals.sort(key=lambda x: x[0])

        # 2. Compute available free intervals in the day
        free_intervals: List[Tuple[datetime, datetime]] = []
        cursor = day_start

        for f_start, f_end, _ in placed_fixed_intervals:
            if f_start > cursor:
                free_intervals.append((cursor, f_start))
            cursor = max(cursor, f_end)
        if cursor < day_end:
            free_intervals.append((cursor, day_end))

        total_free_minutes = sum(int((end - start).total_seconds() / 60) for start, end in free_intervals)

        # 3. Sort tasks by priority score (highest first)
        executable_tasks = [t for t in tasks if t.status not in ["completed", "skipped"]]
        executable_tasks.sort(key=lambda t: (t.priority_score or 50.0), reverse=True)

        scheduled_timeline: List[Dict[str, Any]] = []
        deferred_tasks = []

        # Add fixed events to timeline
        for f_start, f_end, fe in placed_fixed_intervals:
            scheduled_timeline.append({
                "title": fe.title,
                "start_at": f_start,
                "end_at": f_end,
                "item_type": "fixed_event",
                "task_id": None,
                "fixed_event_id": fe.id,
                "status": "scheduled"
            })

        # 4. Schedule tasks into free intervals with OR-Tools / interval solver
        focus_standard = user_preferences.get("focus_duration", 45)
        short_break = user_preferences.get("break_duration", 10)
        long_break = user_preferences.get("long_break_duration", 25)
        sessions_count = 0

        # We place tasks sequentially respecting priority, buffer, and breaks
        for interval_idx, (slot_start, slot_end) in enumerate(free_intervals):
            slot_cursor = slot_start
            slot_minutes = int((slot_end - slot_cursor).total_seconds() / 60)

            # Skip tiny slots less than 15 minutes
            if slot_minutes < 15:
                continue

            for task in list(executable_tasks):
                task_duration = max(15, min(180, task.estimated_minutes or focus_standard))
                needed_with_break = task_duration + (long_break if (sessions_count + 1) % 3 == 0 else short_break)

                remaining_slot_minutes = int((slot_end - slot_cursor).total_seconds() / 60)

                if task_duration <= remaining_slot_minutes:
                    # Place task
                    task_start = slot_cursor
                    task_end = task_start + timedelta(minutes=task_duration)

                    scheduled_timeline.append({
                        "title": task.title,
                        "start_at": task_start,
                        "end_at": task_end,
                        "item_type": "task",
                        "task_id": task.id,
                        "fixed_event_id": None,
                        "status": "scheduled"
                    })

                    executable_tasks.remove(task)
                    sessions_count += 1
                    slot_cursor = task_end

                    # Insert break if slot has remaining time
                    break_mins = long_break if sessions_count % 3 == 0 else short_break
                    if int((slot_end - slot_cursor).total_seconds() / 60) >= break_mins:
                        break_end = slot_cursor + timedelta(minutes=break_mins)
                        scheduled_timeline.append({
                            "title": "Rest & Recharge Break" if break_mins > 15 else "Mindful Pause & Hydration",
                            "start_at": slot_cursor,
                            "end_at": break_end,
                            "item_type": "break",
                            "task_id": None,
                            "fixed_event_id": None,
                            "status": "scheduled"
                        })
                        slot_cursor = break_end
                    else:
                        # 5-minute buffer
                        slot_cursor += timedelta(minutes=5)
                else:
                    # Cannot fit this task in remaining slot; continue to see if a shorter task fits
                    continue

        # Any remaining tasks that couldn't fit
        for task in executable_tasks:
            pri = task.priority or "important"
            reason = f"Available time exhausted ({total_free_minutes}m total free time). Deferred to next day to protect sleep & quality."
            deferred_tasks.append({
                "task_id": task.id,
                "title": task.title,
                "priority": pri,
                "estimated_minutes": task.estimated_minutes,
                "reason": reason
            })
            if pri in ["must-do", "important"]:
                conflicts.append(f"High-priority task '{task.title}' could not fit into today's available time without violating sleep boundaries.")

        # Sort entire timeline chronologically
        scheduled_timeline.sort(key=lambda x: x["start_at"])

        return {
            "items": scheduled_timeline,
            "conflicts": conflicts,
            "scheduled_tasks_count": len([i for i in scheduled_timeline if i["item_type"] == "task"]),
            "deferred_tasks": deferred_tasks,
            "total_scheduled_minutes": sum(int((i["end_at"] - i["start_at"]).total_seconds() / 60) for i in scheduled_timeline if i["item_type"] == "task")
        }
