"""
Orchestrates recommendation generation.
Builds the prompt and invokes the AI provider.
"""

from services.gemini_client import invoke_gemini
from services.prompt_builder import build_recommendation_prompt
from config.settings import MAX_TOKENS, TEMPERATURE


def generate_recommendations(
    prediction_result: dict,
    user_profile: dict,
    recommendation_type: str = "exercise_plan",
    preferred_language: str = "English",
    max_tokens: int = MAX_TOKENS,
    temperature: float = TEMPERATURE,
) -> str:
    """
    Generate personalized physiotherapy recommendations.

    Args:
        prediction_result: X-ray model output
        user_profile: Patient onboarding data
        recommendation_type: Type of recommendation
        preferred_language: Output language
        max_tokens: Max response length
        temperature: AI creativity level

    Returns:
        Markdown-formatted recommendation string

    Raises:
        RuntimeError: If AI generation fails
    """
    prompt = build_recommendation_prompt(
        prediction_result=prediction_result,
        user_profile=user_profile,
        recommendation_type=recommendation_type,
        preferred_language=preferred_language,
    )
    return invoke_gemini(prompt, max_tokens=max_tokens, temperature=temperature)
