"""
AI Recommendations Router.
Generates personalized physiotherapy recommendations using Gemini + RAG.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from services.recommendation_generator import generate_recommendations
from config.settings import (
    SUPPORTED_RECOMMENDATION_TYPES,
    SUPPORTED_LANGUAGES,
)

router = APIRouter()


# ─── Request Models ───────────────────────────────────────────────────────────


class PredictionResult(BaseModel):
    """X-ray model output passed from the /predict endpoint."""
    severity_grade: str = Field(..., description="KL grade: Healthy, Doubtful, Minimal, Moderate, Severe")
    raw_score: float = Field(..., ge=0.0, le=4.0, description="Raw regression score 0-4")
    top_confidence: Optional[float] = Field(None, ge=0, le=100, description="Confidence percentage")
    confidence_distribution: Optional[list[dict]] = Field(None, description="Per-grade confidence scores")


class UserProfile(BaseModel):
    """Patient health profile collected during onboarding."""

    # Biometrics & Demographics
    age: int = Field(..., ge=10, le=120)
    biological_sex: str = Field(..., description="male, female, or prefer_not_to_say")
    height_cm: float = Field(..., gt=0)
    weight_kg: float = Field(..., gt=0)
    previous_knee_injury: bool = Field(..., description="Has had a previous major knee injury")

    # Symptoms Analysis
    pain_severity: int = Field(..., ge=0, le=10, description="Knee pain 0-10 scale")
    morning_stiffness: str = Field(..., description="none, less_than_30_min, more_than_30_min")
    knee_instability: str = Field(..., description="never, rarely, frequently")

    # Behavioral & Lifestyle Metrics
    daily_activity_level: str = Field(..., description="mostly_sitting, prolonged_standing, heavy_lifting")
    exercise_frequency: str = Field(..., description="sedentary, 1-2_times_per_week, 3+_times_per_week")
    exercise_intensity: str = Field(..., description="none, low_impact, high_impact")
    physiotherapy_adherence: str = Field(
        ..., description="yes_consistently, yes_inconsistently, no, previously_stopped"
    )


class RecommendationRequest(BaseModel):
    """Full request body for the recommendations endpoint."""
    prediction_result: PredictionResult
    user_profile: UserProfile
    recommendation_type: str = "exercise_plan"
    preferred_language: str = "English"
    max_tokens: Optional[int] = Field(None, ge=1, le=4096)
    temperature: Optional[float] = Field(None, ge=0.0, le=1.0)


# ─── Endpoint ─────────────────────────────────────────────────────────────────


@router.post("/api/recommendations")
async def get_recommendations(request: RecommendationRequest):
    """
    Generate personalized physiotherapy recommendations based on
    X-ray prediction results and patient onboarding profile.

    Uses Google Gemini AI with optional RAG from medical PDFs.
    Average response time: 3-8 seconds.
    """
    # Validate recommendation type
    if request.recommendation_type not in SUPPORTED_RECOMMENDATION_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported recommendation_type. Choose from: {SUPPORTED_RECOMMENDATION_TYPES}",
        )

    # Validate language
    if request.preferred_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language. Choose from: {SUPPORTED_LANGUAGES}",
        )

    # Build kwargs
    kwargs = {}
    if request.max_tokens is not None:
        kwargs["max_tokens"] = request.max_tokens
    if request.temperature is not None:
        kwargs["temperature"] = request.temperature

    try:
        result = generate_recommendations(
            prediction_result=request.prediction_result.model_dump(),
            user_profile=request.user_profile.model_dump(),
            recommendation_type=request.recommendation_type,
            preferred_language=request.preferred_language,
            **kwargs,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return {"result": result}
