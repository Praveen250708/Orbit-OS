import unittest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import Base, engine

class TestAPIEndpoints(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(bind=engine)
        self.client_ctx = TestClient(app)
        self.client = self.client_ctx.__enter__()

    def tearDown(self):
        self.client_ctx.__exit__(None, None, None)

    def test_health_check(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["service"], "Orbit OS AI")

    def test_dashboard_today(self):
        res = self.client.get("/api/v1/dashboard/today")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("greeting", data)
        self.assertIn("on_track", data)
        self.assertIn("current_date", data)

    def test_create_and_fetch_goals(self):
        # Create goal
        res = self.client.post("/api/v1/goals", json={
            "title": "Machine Learning Specialization",
            "description": "Deep learning and statistical optimization",
            "category": "career",
            "priority": "must-do"
        })
        self.assertEqual(res.status_code, 200)
        goal_data = res.json()
        self.assertEqual(goal_data["title"], "Machine Learning Specialization")

        # Fetch goals
        res_list = self.client.get("/api/v1/goals")
        self.assertEqual(res_list.status_code, 200)
        goals = res_list.json()
        self.assertGreater(len(goals), 0)

    def test_analytics_weekly(self):
        res = self.client.get("/api/v1/analytics/weekly")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("completion_rate", data)
        self.assertIn("daily_completion_trend", data)
        self.assertIn("personalized_suggestions", data)

if __name__ == "__main__":
    unittest.main()
