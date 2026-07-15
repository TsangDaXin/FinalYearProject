"""
SteadyGerak Assistant Chat Router.
Provides conversational AI about knee osteoarthritis conditions,
grounded with RAG context from medical PDFs.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from services.gemini_client import invoke_gemini
from services.rag_service import retrieve_context

router = APIRouter()


# ─── Request/Response Models ──────────────────────────────────────────────────


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User's question")
    severity_grade: Optional[str] = Field(None, description="Patient's KL grade")
    top_confidence: Optional[float] = Field(None, description="Prediction confidence %")
    history: list[ChatMessage] = Field(default_factory=list, description="Previous messages for context")


class ChatResponse(BaseModel):
    reply: str


# ─── System Prompt ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are SteadyGerak Assistant, a knowledgeable and empathetic AI clinical assistant 
specializing in knee osteoarthritis (OA). You are embedded in the "Severity Analysis of Knee Osteoarthritis" 
diagnostic page of the SteadyGerak platform.

Your role:
- Help patients understand their knee OA diagnosis and KL (Kellgren-Lawrence) grade
- Explain what their severity grade means in plain, reassuring language
- Answer questions about symptoms, progression, treatment options, and lifestyle modifications
- Provide evidence-based information grounded in medical literature when available
- Suggest when to seek professional medical attention

Rules:
- Be warm, professional, and concise (keep responses under 200 words unless detail is requested)
- Always remind users that you provide informational guidance, not medical diagnoses
- If the patient's KL grade is provided, tailor your answers to their specific severity
- Use the medical reference material (if provided) to ground your answers
- Never recommend specific medications or dosages
- Format responses in plain text (no markdown headers), use bullet points sparingly
"""


# ─── Endpoint ─────────────────────────────────────────────────────────────────


@router.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with SteadyGerak Assistant about knee osteoarthritis conditions.
    Uses RAG to ground responses in medical literature.
    """
    # Build RAG query from user message + context
    rag_query = request.message
    if request.severity_grade:
        rag_query = f"knee osteoarthritis {request.severity_grade} grade: {request.message}"

    # Retrieve relevant medical context
    medical_context = retrieve_context(rag_query, k=3)

    # Build the full prompt
    context_section = ""
    if medical_context:
        context_section = f"\n\nRELEVANT MEDICAL REFERENCE:\n{medical_context}\n\nUse this to inform your answer where applicable."

    patient_context = ""
    if request.severity_grade:
        patient_context = f"\n\nPATIENT CONTEXT:\n- KL Grade: {request.severity_grade}"
        if request.top_confidence:
            patient_context += f"\n- Prediction Confidence: {request.top_confidence}%"

    # Include conversation history (last 6 messages max)
    history_section = ""
    if request.history:
        recent_history = request.history[-6:]
        history_lines = []
        for msg in recent_history:
            role_label = "Patient" if msg.role == "user" else "SteadyGerak Assistant"
            history_lines.append(f"{role_label}: {msg.content}")
        history_section = f"\n\nCONVERSATION HISTORY:\n" + "\n".join(history_lines)

    prompt = f"""{SYSTEM_PROMPT}{patient_context}{context_section}{history_section}

Patient's question: {request.message}

SteadyGerak Assistant:"""

    try:
        reply = invoke_gemini(prompt, max_tokens=512, temperature=0.4)
        return ChatResponse(reply=reply)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
