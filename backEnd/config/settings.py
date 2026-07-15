"""
Application configuration.
Loads environment variables and defines constants.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ─── LLM Configuration (Groq) ────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "3072"))
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.5"))

# ─── Model Configuration ─────────────────────────────────────────────────────
GATEKEEPER_MODEL_PATH = os.getenv("GATEKEEPER_MODEL_PATH", "../ml_workflow/best_model/gatekeeper_weights.h5")
PREDICTION_MODEL_PATH = os.getenv("PREDICTION_MODEL_PATH", "../ml_workflow/best_model/best_model_weights.h5")
GATEKEEPER_THRESHOLD = float(os.getenv("GATEKEEPER_THRESHOLD", "0.5"))

# ─── RAG Configuration ────────────────────────────────────────────────────────
PDF_DIRECTORY = os.path.join(os.path.dirname(__file__), "..", "data", "medical_pdfs")
CHROMA_PERSIST_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "chroma_db")
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# ─── Supported Values ─────────────────────────────────────────────────────────
KL_GRADES = ["Healthy", "Doubtful", "Minimal", "Moderate", "Severe"]

SUPPORTED_BIOLOGICAL_SEX = ["male", "female", "prefer_not_to_say"]

SUPPORTED_MORNING_STIFFNESS = ["none", "less_than_30_min", "more_than_30_min"]

SUPPORTED_KNEE_INSTABILITY = ["never", "rarely", "frequently"]

SUPPORTED_DAILY_ACTIVITY = ["mostly_sitting", "prolonged_standing", "heavy_lifting"]

SUPPORTED_EXERCISE_FREQUENCY = ["sedentary", "1-2_times_per_week", "3+_times_per_week"]

SUPPORTED_EXERCISE_INTENSITY = ["none", "low_impact", "high_impact"]

SUPPORTED_PHYSIO_ADHERENCE = [
    "yes_consistently",
    "yes_inconsistently",
    "no",
    "previously_stopped",
]

SUPPORTED_RECOMMENDATION_TYPES = [
    "exercise_plan",
    "injury_prevention",
    "rehabilitation",
    "general_wellness",
]

SUPPORTED_LANGUAGES = ["English", "Chinese", "Malay"]
