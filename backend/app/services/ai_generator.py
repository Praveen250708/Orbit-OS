import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import httpx

from backend.app.core.config import settings
from backend.app.models.entities import UserGoal, LearningPath, LearningTopic, Task

class AITaskGenerator:
    """
    Autonomous goal & learning path decomposition engine.
    Uses LLM when configured, with robust deterministic rule-based knowledge trees
    when LLM is offline or unconfigured.
    """

    # Rich pre-built curricula templates for instant autonomous execution
    CURRICULA_TEMPLATES = {
        "machine learning": [
            {
                "title": "Mathematics Foundations for ML: Vectors & Matrix Ops",
                "description": "Dot products, matrix multiplication, rank, eigenvalues, and NumPy vectorization.",
                "subtasks": ["Review linear algebra basics", "Implement matrix multiplication in pure NumPy", "Solve 5 vector projection problems"],
                "criteria": ["Able to vectorize code without for-loops", "Pass 10 vector math sanity checks"],
                "minutes": 50,
                "type": "learning"
            },
            {
                "title": "Calculus & Gradient Descent from Scratch",
                "description": "Partial derivatives, chain rule, loss landscape, gradient descent update rule.",
                "subtasks": ["Derive MSE gradient by hand", "Code single-variable gradient descent", "Plot cost curve vs iterations in Python"],
                "criteria": ["Loss decreases monotonically to convergence", "No autograd library used for core math"],
                "minutes": 60,
                "type": "coding"
            },
            {
                "title": "Supervised Learning: Linear & Logistic Regression",
                "description": "Hypothesis function, binary cross-entropy, decision boundaries, ROC-AUC.",
                "subtasks": ["Implement Logistic Regression with sigmoid", "Train on Titanic / Breast Cancer dataset", "Evaluate precision, recall, and F1"],
                "criteria": ["Confusion matrix generated and interpreted", "F1 score above baseline (>0.78)"],
                "minutes": 60,
                "type": "coding"
            },
            {
                "title": "Decision Trees, Random Forests & Ensemble Learning",
                "description": "Entropy, Gini impurity, information gain, bagging vs boosting with XGBoost.",
                "subtasks": ["Calculate Gini impurity by hand on toy dataset", "Train XGBoost classifier with hyperparameter tuning", "Inspect feature importances"],
                "criteria": ["Hyperparameter search log recorded", "Overfitting mitigated with max_depth & regularization"],
                "minutes": 55,
                "type": "coding"
            },
            {
                "title": "Neural Networks Fundamentals & PyTorch Autograd",
                "description": "Tensors, forward pass, autograd, backpropagation, and cross-entropy loss in PyTorch.",
                "subtasks": ["Build 2-layer MLP in PyTorch nn.Module", "Write clean train/val training loop with Adam optimizer", "Plot loss and accuracy on MNIST/CIFAR"],
                "criteria": ["Model achieves >95% test accuracy", "Training and validation metrics plotted"],
                "minutes": 75,
                "type": "coding"
            },
            {
                "title": "Capstone ML Mini-Project: End-to-End Prediction API",
                "description": "Train, evaluate, serialize model, and expose via FastAPI inference endpoint.",
                "subtasks": ["Pick dataset and clean missing values", "Train best model and save weights via joblib/torch", "Build FastAPI endpoint POST /predict", "Write unit tests for latency and bounds"],
                "criteria": ["FastAPI endpoint returns predictions under 50ms", "Input validation schema rejects malformed payloads"],
                "minutes": 90,
                "type": "coding"
            }
        ],
        "full stack": [
            {
                "title": "Modern Frontend Architecture & Component State",
                "description": "Clean component boundaries, custom hooks, and predictable state transitions.",
                "subtasks": ["Define state machine for user interaction", "Create modular UI components", "Refactor prop drilling to context/store"],
                "criteria": ["Zero circular re-renders", "Clean TypeScript interfaces for all components"],
                "minutes": 45,
                "type": "coding"
            },
            {
                "title": "RESTful API Design & Relational Data Modeling",
                "description": "Normalized PostgreSQL schema design, indexes, and FastAPI router structure.",
                "subtasks": ["Design ER diagram and migrations", "Implement CRUD endpoints with Pydantic validation", "Write automated tests for happy & error paths"],
                "criteria": ["All endpoints return status codes adhering to RFC 7231", "Test coverage > 80% on core models"],
                "minutes": 60,
                "type": "coding"
            },
            {
                "title": "Authentication, Session Security & Role-Based Access",
                "description": "JWT tokens, password hashing with bcrypt, refresh token rotation, and CORS.",
                "subtasks": ["Implement secure auth middleware", "Add password reset flow", "Test CSRF and injection attack vectors"],
                "criteria": ["Tokens expire safely", "Passwords hashed with work factor >= 12"],
                "minutes": 60,
                "type": "coding"
            }
        ]
    }

    @classmethod
    async def call_llm(cls, system_prompt: str, user_prompt: str) -> Optional[str]:
        if not settings.OPENAI_API_KEY:
            return None
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": settings.OPENAI_MODEL,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.3,
                        "response_format": {"type": "json_object"}
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
        except Exception:
            return None
        return None

    @classmethod
    async def generate_learning_path_topics(cls, goal_title: str, goal_description: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Derives structured topics, order, and exercises for a given goal.
        """
        # 1. Attempt LLM generation
        if settings.OPENAI_API_KEY:
            sys_msg = (
                "You are an expert curriculum architect in Orbit OS. Break down the user's goal "
                "into a sequential, practical 5-8 topic learning roadmap. Return pure JSON: "
                "{\"topics\": [{\"title\": \"...\", \"description\": \"...\", \"order_index\": 1, \"estimated_minutes\": 45, \"subtasks\": [\"...\"], \"criteria\": [\"...\"]}]}"
            )
            user_msg = f"Goal: {goal_title}. Context: {goal_description or 'No extra context'}"
            llm_res = await cls.call_llm(sys_msg, user_msg)
            if llm_res:
                try:
                    parsed = json.loads(llm_res)
                    if "topics" in parsed and isinstance(parsed["topics"], list) and len(parsed["topics"]) > 0:
                        return parsed["topics"]
                except Exception:
                    pass

        # 2. Deterministic Knowledge Base Fallback
        lower_title = goal_title.lower()
        if "machine learning" in lower_title or "ml" in lower_title or "ai" in lower_title or "data science" in lower_title:
            return cls.CURRICULA_TEMPLATES["machine learning"]
        elif "web" in lower_title or "full stack" in lower_title or "frontend" in lower_title or "backend" in lower_title or "software" in lower_title:
            return cls.CURRICULA_TEMPLATES["full stack"]

        # Universal fallback for general goals
        return [
            {
                "title": f"Fundamentals & Core Principles of {goal_title}",
                "description": f"Master foundational vocabulary, mental models, and prerequisites for {goal_title}.",
                "subtasks": [f"Read chapter 1 on {goal_title}", "Summarize key ideas into 5 bullet points", "Identify 3 practical questions to explore"],
                "criteria": ["Explain the core concept in simple terms without jargon"],
                "minutes": 45,
                "type": "learning"
            },
            {
                "title": f"Hands-on Application & Practice: {goal_title}",
                "description": "Apply theory through active implementation or guided problem solving.",
                "subtasks": ["Complete exercise set 1", "Debug edge cases and errors", "Log insights in learning journal"],
                "criteria": ["Produce working artifact or verified solution"],
                "minutes": 60,
                "type": "coding"
            },
            {
                "title": f"Consolidation, Review & Project Milestones: {goal_title}",
                "description": "Synthesize learned material into a mini-project and self-assessment.",
                "subtasks": ["Build mini-project demonstrating mastery", "Run self-assessment checklist", "Plan next topic iteration"],
                "criteria": ["Self-assessment score > 80% on practice checklist"],
                "minutes": 60,
                "type": "revision"
            }
        ]

    @classmethod
    async def breakdown_difficult_task(cls, task_title: str, task_desc: Optional[str] = None, user_difficulty: str = "stuck") -> List[Dict[str, Any]]:
        """
        Decomposes a hard or intimidating task into 3-4 very small, frictionless micro-steps.
        """
        if settings.OPENAI_API_KEY:
            sys_msg = (
                "The user is stuck or overwhelmed on a task in Orbit OS. Break it into 3-4 gentle, "
                "frictionless, highly actionable micro-steps that take 5-15 minutes each. "
                "Return JSON: {\"micro_steps\": [{\"title\": \"...\", \"estimated_minutes\": 10, \"tip\": \"...\"}]}"
            )
            user_msg = f"Task: {task_title}. Context: {task_desc or ''}. User says: {user_difficulty}"
            llm_res = await cls.call_llm(sys_msg, user_msg)
            if llm_res:
                try:
                    parsed = json.loads(llm_res)
                    if "micro_steps" in parsed and len(parsed["micro_steps"]) > 0:
                        return parsed["micro_steps"]
                except Exception:
                    pass

        # Deterministic micro-step decomposition
        return [
            {
                "title": f"Clarify scope: write down the 1 exact sentence outcome for '{task_title}'",
                "estimated_minutes": 5,
                "tip": "Reduce cognitive load by writing down what 'done' looks like."
            },
            {
                "title": "Gather required files, notes, or browser tabs and close distractions",
                "estimated_minutes": 5,
                "tip": "Prepare the environment before attempting difficult problem solving."
            },
            {
                "title": f"Do the smallest 15-minute slice of work on '{task_title}'",
                "estimated_minutes": 15,
                "tip": "Commit to just 15 minutes. You can stop or take a break afterwards."
            },
            {
                "title": "Review the progress made and verify against acceptance criteria",
                "estimated_minutes": 10,
                "tip": "Celebrate finishing the first chunk to build momentum."
            }
        ]
