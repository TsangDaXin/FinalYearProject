import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure data directory exists for medical PDFs (RAG service)
os.makedirs("data/medical_pdfs", exist_ok=True)

# ─── Create FastAPI App ───────────────────────────────────────────────────────

app = FastAPI(
    title="SteadyGerak APP",
    description="AI-powered Knee Osteoarthritis Monitoring & Physiotherapy System",
    version="1.0.0",
)

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Load ML Model ────────────────────────────────────────────────────────────

from services.model_loader import load_model, load_gatekeeper_model
from routers.prediction import set_model, set_gatekeeper_model

gatekeeper_model = load_gatekeeper_model()
set_gatekeeper_model(gatekeeper_model)

model = load_model()
set_model(model)

# ─── Register Routers ─────────────────────────────────────────────────────────

from routers.prediction import router as prediction_router
from routers.recommendations import router as recommendations_router
from routers.chat import router as chat_router
from routers.insights import router as insights_router
from routers.progress import router as progress_router

app.include_router(prediction_router, tags=["X-Ray Prediction"])
app.include_router(recommendations_router, tags=["AI Recommendations"])
app.include_router(chat_router, tags=["Orionix Assistant Chat"])
app.include_router(insights_router, tags=["Diagnostic Insights"])
app.include_router(progress_router, prefix="/api/progress", tags=["progress"])


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "gatekeeper_loaded": gatekeeper_model is not None,
    }


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
