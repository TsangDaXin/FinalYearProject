"""
Diagnostic Insights Router.
Generates personalized diagnostic reasons and interventions
based on the patient's KL grade prediction.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from services.gemini_client import invoke_gemini
from services.rag_service import retrieve_context

router = APIRouter()


# ─── Request/Response Models ──────────────────────────────────────────────────


class InsightsRequest(BaseModel):
    severity_grade: str = Field(..., description="KL grade: Healthy, Doubtful, Minimal, Moderate, Severe")
    top_confidence: float = Field(..., ge=0, le=100, description="Prediction confidence %")


class InsightsResponse(BaseModel):
    reasons: list[str] = Field(..., description="Possible reasons for the diagnostic")
    interventions: list[str] = Field(..., description="Recommended interventions")


# ─── Endpoint ─────────────────────────────────────────────────────────────────


@router.post("/api/insights", response_model=InsightsResponse)
async def get_insights(request: InsightsRequest):
    """
    Generate personalized diagnostic insights based on KL grade.
    Returns possible reasons for the diagnosis and recommended interventions.
    """
    # Retrieve relevant medical context via RAG
    rag_query = (
        f"knee osteoarthritis {request.severity_grade} grade "
        f"clinical findings radiographic features treatment interventions physiotherapy"
    )
    medical_context = retrieve_context(rag_query, k=4)

    rag_section = ""
    if medical_context:
        rag_section = f"""
MEDICAL REFERENCE MATERIAL:
{medical_context}

Use the above evidence to ground your response where applicable.
"""

    prompt = f"""You are a radiologist and knee osteoarthritis specialist AI.

Based on the following X-ray prediction, generate diagnostic insights.

PREDICTION:
- KL Grade: {request.severity_grade}
- Confidence: {request.top_confidence}%
{rag_section}
Generate exactly TWO sections. Each section must have exactly 3 bullet points.
Keep each bullet point to 1-2 sentences max. Be specific to the KL grade.

SECTION 1 - POSSIBLE REASONS FOR THE DIAGNOSTIC:
Explain what radiographic/clinical features likely led to this KL grade classification.
Consider: osteophytes, joint space narrowing, subchondral sclerosis, bone deformity, cartilage loss.
Tailor to the specific grade:
- Healthy (KL 0): No visible OA features
- Doubtful (KL 1): Possible minor osteophytes
- Minimal (KL 2): Definite osteophytes, possible joint space narrowing
- Moderate (KL 3): Multiple osteophytes, definite narrowing, some sclerosis
- Severe (KL 4): Large osteophytes, marked narrowing, severe sclerosis, bone deformity

SECTION 2 - RECOMMENDED INTERVENTIONS:
Provide 3 actionable clinical/physiotherapy interventions appropriate for this grade.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS (no numbering, no dashes, just the text):
REASONS:
first reason here
second reason here
third reason here
INTERVENTIONS:
first intervention here
second intervention here
third intervention here"""

    try:
        result = invoke_gemini(prompt, max_tokens=512, temperature=0.3)
        reasons, interventions = _parse_insights(result)
        return InsightsResponse(reasons=reasons, interventions=interventions)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))


def _parse_insights(text: str) -> tuple[list[str], list[str]]:
    """Parse the LLM response into reasons and interventions lists."""
    reasons: list[str] = []
    interventions: list[str] = []

    lines = [line.strip() for line in text.strip().split('\n') if line.strip()]

    current_section = None
    for line in lines:
        upper = line.upper().replace(':', '')
        if 'REASON' in upper:
            current_section = 'reasons'
            continue
        elif 'INTERVENTION' in upper:
            current_section = 'interventions'
            continue

        # Skip numbering or bullet markers
        cleaned = line.lstrip('0123456789.-•*) ').strip()
        if not cleaned:
            continue

        if current_section == 'reasons' and len(reasons) < 3:
            reasons.append(cleaned)
        elif current_section == 'interventions' and len(interventions) < 3:
            interventions.append(cleaned)

    # Fallbacks if parsing fails
    if len(reasons) < 3:
        defaults = [
            "Radiographic features consistent with the predicted KL grade were detected.",
            "Joint space characteristics align with the severity classification.",
            "Bone and cartilage markers support the diagnostic assessment.",
        ]
        reasons = (reasons + defaults)[:3]

    if len(interventions) < 3:
        defaults = [
            "Consult with a physiotherapist for a tailored exercise program.",
            "Maintain a healthy weight to reduce joint stress.",
            "Consider low-impact activities to preserve joint mobility.",
        ]
        interventions = (interventions + defaults)[:3]

    return reasons[:3], interventions[:3]
