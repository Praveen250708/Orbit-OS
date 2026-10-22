import unittest
from fastapi.testclient import TestClient
from backend.app.main import app

class TestSyllabusModule(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_list_syllabus_courses(self):
        res = self.client.get("/api/v1/syllabus/courses")
        self.assertEqual(res.status_code, 200)
        courses = res.json()
        self.assertEqual(len(courses), 4)
        course_codes = [c["code"] for c in courses]
        self.assertIn("CS-AI", course_codes)
        self.assertIn("CS-DAA", course_codes)
        self.assertIn("MA-PSRP", course_codes)
        self.assertIn("CS-SE", course_codes)

    def test_get_ai_syllabus_units(self):
        res = self.client.get("/api/v1/syllabus/courses/artificial-intelligence")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data["units"]), 5)
        unit1 = data["units"][0]
        self.assertEqual(unit1["unit_number"], "UNIT-I")
        self.assertIn("Turing Test", str(unit1["topics"]))

    def test_answer_generation(self):
        res = self.client.post("/api/v1/syllabus/answer", json={
            "course_title": "Artificial Intelligence",
            "unit_title": "UNIT-I",
            "topic_name": "Turing Test",
            "question": "What is the Turing Test?"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("Turing Test", data["answer"])
        self.assertIn("Alan Turing", data["answer"])

if __name__ == "__main__":
    unittest.main()
