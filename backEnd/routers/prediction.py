r"""
X-Ray Prediction Router.
Handles image upload, preprocessing, model inference, and Grad-CAM generation.
All images are stored directly in Supabase Storage (no local disk).
"""

import os
import cv2
import numpy as np
import base64
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
import json
import httpx

from services.gradcam import make_gradcam_heatmap, generate_gradcam_overlay
from services.model_loader import get_last_conv_layer_name
from services.gate_service import is_xray_eligible, weeks_since_onboarding
from database import get_db
from config.settings import KL_GRADES, GATEKEEPER_THRESHOLD

router = APIRouter()

# Model reference — set by main.py after loading
model = None

# Gatekeeper model reference — set by main.py after loading
gatekeeper_model = None


def set_model(loaded_model):
    """Called by main.py to inject the loaded model."""
    global model
    model = loaded_model


def set_gatekeeper_model(loaded_model):
    """Called by main.py to inject the loaded gatekeeper model."""
    global gatekeeper_model
    gatekeeper_model = loaded_model


def apply_clahe(img_bgr: np.ndarray) -> np.ndarray:
    """Apply CLAHE to the L channel in LAB color space for contrast enhancement."""
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    limg = cv2.merge((cl, a, b))
    return cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)


def _upload_to_supabase(data: bytes, bucket: str, path: str) -> str | None:
    """
    Upload bytes to Supabase Storage and return the public URL.
    Returns None if upload fails or env vars are missing.
    """
    supabase_base_url = os.getenv("SUPABASE_URL", "").replace("/rest/v1/", "")
    supabase_key = os.getenv("SUPABASE_KEY", "")

    if not supabase_base_url or not supabase_key:
        return None

    headers = {
        "Authorization": f"Bearer {supabase_key}",
        "apikey": supabase_key,
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
    }

    upload_url = f"{supabase_base_url}/storage/v1/object/{bucket}/{path}"

    try:
        resp = httpx.post(upload_url, headers=headers, content=data)
        print(f"Supabase Upload [{path}]: {resp.status_code}")
        if resp.status_code in (200, 201):
            return f"{supabase_base_url}/storage/v1/object/public/{bucket}/{path}"
    except Exception as e:
        print(f"Error uploading to Supabase [{path}]: {e}")

    return None


@router.post("/predict")
async def predict(
    file: UploadFile = File(...),
    user_id: str = Form(None),
    db: Session = Depends(get_db)
):
    """
    Upload a knee X-ray image and get KL grade prediction with Grad-CAM overlay.

    Returns:
        JSON with severity grade, confidence, distribution, and image URLs.
    """
    if user_id:
        profile = db.execute(
            text("SELECT onboarding_date FROM profiles WHERE id = :uid"),
            {"uid": user_id}
        ).fetchone()

        if profile and profile.onboarding_date:
            if not is_xray_eligible(profile.onboarding_date):
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": "xray_locked",
                        "message": "X-ray diagnosis requires 12 weeks of active rehabilitation.",
                        "weeks_remaining": round(12 - weeks_since_onboarding(profile.onboarding_date), 1)
                    }
                )

    if model is None:
        return JSONResponse(
            status_code=500,
            content={"error": "Model not loaded on server."},
        )

    # 1. Read uploaded file into memory
    file_bytes = await file.read()
    nparr = np.frombuffer(file_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid image file."},
        )

    # 2. Preprocess (CLAHE -> Resize -> RGB -> float32)
    img_clahe = apply_clahe(img_bgr)
    img_resized = cv2.resize(img_clahe, (224, 224))
    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)

    # Keras input tensor
    input_tensor = np.expand_dims(img_rgb, axis=0).astype(np.float32)

    # ── Gatekeeper check: verify image is a knee X-ray ──
    if gatekeeper_model is not None:
        gatekeeper_input = input_tensor / 255.0
        gatekeeper_score = float(gatekeeper_model.predict(gatekeeper_input)[0][0])
        if gatekeeper_score >= GATEKEEPER_THRESHOLD:
            return JSONResponse(
                status_code=400,
                content={
                    "error": "not_knee_xray",
                    "message": "Only knee X-ray images can be analyzed. Please upload a valid knee X-ray.",
                    "confidence": round(gatekeeper_score, 4),
                },
            )

    # 3. Predict — model outputs a single regression value (continuous KL grade 0-4)
    raw_prediction = model.predict(input_tensor)[0][0]  # scalar value

    # Clip to valid range and determine the KL grade
    raw_prediction = float(np.clip(raw_prediction, 0, 4))
    top_index = int(np.round(raw_prediction))
    top_index = max(0, min(4, top_index))  # safety clamp
    severity_grade = KL_GRADES[top_index]

    # Confidence based on proximity to nearest integer grade
    distance = abs(raw_prediction - top_index)
    top_confidence = float(max(0, (1.0 - distance * 2)) * 100)

    # Pseudo-distribution showing proximity to each grade
    confidence_distribution = []
    for i in range(len(KL_GRADES)):
        dist = abs(raw_prediction - i)
        score = max(0, (1.0 - dist) * 100)
        confidence_distribution.append({"grade": KL_GRADES[i], "score": score})

    # Normalize to sum to 100%
    total = sum(item["score"] for item in confidence_distribution)
    if total > 0:
        for item in confidence_distribution:
            item["score"] = item["score"] / total * 100

    # 4. Encode original image to JPEG bytes in memory
    _, orig_buffer = cv2.imencode('.jpg', img_bgr)
    orig_data = orig_buffer.tobytes()

    # 5. Generate Grad-CAM overlay bytes in memory
    last_conv_layer_name = get_last_conv_layer_name(model)
    if last_conv_layer_name:
        heatmap = make_gradcam_heatmap(input_tensor, model, last_conv_layer_name)
        orig_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        cam_data = generate_gradcam_overlay(orig_rgb, heatmap, alpha=0.4)
    else:
        # Fallback: just encode original as the "gradcam"
        cam_data = orig_data

    # 6. Upload to Supabase Storage and get public URLs
    supabase_orig_url = ""
    supabase_cam_url = ""

    if user_id:
        bucket = "X-rays"
        folder = f"{user_id}/baseline"

        url = _upload_to_supabase(orig_data, bucket, f"{folder}/xray.jpg")
        if url:
            supabase_orig_url = url

        url = _upload_to_supabase(cam_data, bucket, f"{folder}/gradcam.jpg")
        if url:
            supabase_cam_url = url

        # Update profiles table
        try:
            db.execute(
                text("""
                    UPDATE profiles 
                    SET confidence_score = :score, 
                        probability_distribution = :dist,
                        xray_image_url = :xray_url,
                        gradcam_image_url = :cam_url,
                        kl_grade = :kl_grade
                    WHERE id = :uid
                """),
                {
                    "score": round(top_confidence, 1),
                    "dist": json.dumps(confidence_distribution),
                    "xray_url": supabase_orig_url,
                    "cam_url": supabase_cam_url,
                    "kl_grade": top_index,
                    "uid": user_id
                }
            )
            db.commit()
        except Exception as e:
            print(f"Error saving prediction to database: {e}")
            db.rollback()

        # Also insert/update baseline row in scan_history for comparative analysis
        try:
            db.execute(
                text("""
                    INSERT INTO scan_history 
                        (user_id, scan_type, xray_image_url, gradcam_image_url, kl_grade, confidence_score, probability_distribution)
                    VALUES 
                        (:uid, 'baseline', :xray_url, :cam_url, :kl_grade, :score, :dist)
                    ON CONFLICT (user_id, scan_type) WHERE scan_type = 'baseline'
                    DO UPDATE SET
                        xray_image_url = :xray_url,
                        gradcam_image_url = :cam_url,
                        kl_grade = :kl_grade,
                        confidence_score = :score,
                        probability_distribution = :dist,
                        scan_date = NOW()
                """),
                {
                    "uid": user_id,
                    "xray_url": supabase_orig_url,
                    "cam_url": supabase_cam_url,
                    "kl_grade": top_index,
                    "score": round(top_confidence, 1),
                    "dist": json.dumps(confidence_distribution),
                }
            )
            db.commit()
        except Exception as e:
            print(f"Error inserting baseline into scan_history: {e}")
            db.rollback()

    # 7. Return JSON
    return {
        "originalImageUrl": supabase_orig_url,
        "gradCamUrl": supabase_cam_url,
        "severityGrade": severity_grade,
        "rawScore": round(raw_prediction, 2),
        "topConfidence": round(top_confidence, 1),
        "confidenceDistribution": confidence_distribution,
    }


@router.post("/predict/followup")
async def predict_followup(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Follow-up prediction endpoint (Phase 1 — prediction only).
    Runs the model and returns results as base64 images.
    Does NOT save to Supabase Storage or scan_history.
    User must confirm via /predict/followup/confirm to persist.
    """
    if model is None:
        return JSONResponse(status_code=500, content={"error": "Model not loaded on server."})

    # 1. Read uploaded file into memory
    file_bytes = await file.read()
    nparr = np.frombuffer(file_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        return JSONResponse(status_code=400, content={"error": "Invalid image file."})

    # 2. Preprocess
    img_clahe = apply_clahe(img_bgr)
    img_resized = cv2.resize(img_clahe, (224, 224))
    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
    input_tensor = np.expand_dims(img_rgb, axis=0).astype(np.float32)

    # 3. Gatekeeper check
    if gatekeeper_model is not None:
        gatekeeper_input = input_tensor / 255.0
        gatekeeper_score = float(gatekeeper_model.predict(gatekeeper_input)[0][0])
        if gatekeeper_score >= GATEKEEPER_THRESHOLD:
            return JSONResponse(
                status_code=400,
                content={
                    "error": "not_knee_xray",
                    "message": "Only knee X-ray images can be analyzed. Please upload a valid knee X-ray.",
                    "confidence": round(gatekeeper_score, 4),
                },
            )

    # 4. Predict
    raw_prediction = model.predict(input_tensor)[0][0]
    raw_prediction = float(np.clip(raw_prediction, 0, 4))
    top_index = int(np.round(raw_prediction))
    top_index = max(0, min(4, top_index))
    severity_grade = KL_GRADES[top_index]

    distance = abs(raw_prediction - top_index)
    top_confidence = float(max(0, (1.0 - distance * 2)) * 100)

    confidence_distribution = []
    for i in range(len(KL_GRADES)):
        dist = abs(raw_prediction - i)
        score = max(0, (1.0 - dist) * 100)
        confidence_distribution.append({"grade": KL_GRADES[i], "score": score})

    total = sum(item["score"] for item in confidence_distribution)
    if total > 0:
        for item in confidence_distribution:
            item["score"] = item["score"] / total * 100

    # 5. Encode original image to base64
    _, orig_buffer = cv2.imencode('.jpg', img_bgr)
    orig_b64 = f"data:image/jpeg;base64,{base64.b64encode(orig_buffer.tobytes()).decode()}"

    # 6. Generate Grad-CAM overlay as base64
    last_conv_layer_name = get_last_conv_layer_name(model)
    if last_conv_layer_name:
        heatmap = make_gradcam_heatmap(input_tensor, model, last_conv_layer_name)
        orig_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        cam_data = generate_gradcam_overlay(orig_rgb, heatmap, alpha=0.4)
    else:
        cam_data = orig_buffer.tobytes()

    cam_b64 = f"data:image/jpeg;base64,{base64.b64encode(cam_data).decode()}"

    # 7. Return prediction results (no persistence)
    return {
        "originalImageUrl": orig_b64,
        "gradCamUrl": cam_b64,
        "severityGrade": severity_grade,
        "rawScore": round(raw_prediction, 2),
        "topConfidence": round(top_confidence, 1),
        "confidenceDistribution": confidence_distribution,
    }


@router.post("/predict/followup/confirm")
async def confirm_followup(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    kl_grade: int = Form(...),
    confidence_score: float = Form(...),
    probability_distribution: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Follow-up confirm endpoint (Phase 2 — persist to storage + database).
    Called only after user reviews results and clicks 'Confirm'.
    """
    # 1. Read file
    file_bytes = await file.read()
    nparr = np.frombuffer(file_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        return JSONResponse(status_code=400, content={"error": "Invalid image file."})

    # 2. Encode original
    _, orig_buffer = cv2.imencode('.jpg', img_bgr)
    orig_data = orig_buffer.tobytes()

    # 3. Generate Grad-CAM again for storage
    img_clahe = apply_clahe(img_bgr)
    img_resized = cv2.resize(img_clahe, (224, 224))
    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
    input_tensor = np.expand_dims(img_rgb, axis=0).astype(np.float32)

    last_conv_layer_name = get_last_conv_layer_name(model)
    if last_conv_layer_name:
        heatmap = make_gradcam_heatmap(input_tensor, model, last_conv_layer_name)
        orig_rgb_full = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        cam_data = generate_gradcam_overlay(orig_rgb_full, heatmap, alpha=0.4)
    else:
        cam_data = orig_data

    # 4. Upload to Supabase Storage
    count_result = db.execute(
        text("SELECT COUNT(*) FROM scan_history WHERE user_id = :uid AND scan_type = 'followup'"),
        {"uid": user_id}
    ).scalar()
    followup_num = (count_result or 0) + 1

    bucket = "X-rays"
    folder = f"{user_id}/followup_{followup_num}"

    followup_orig_url = _upload_to_supabase(orig_data, bucket, f"{folder}/xray.jpg") or ""
    followup_cam_url = _upload_to_supabase(cam_data, bucket, f"{folder}/gradcam.jpg") or ""

    # 5. Insert into scan_history
    try:
        db.execute(
            text("""
                INSERT INTO scan_history 
                    (user_id, scan_type, xray_image_url, gradcam_image_url, kl_grade, confidence_score, probability_distribution)
                VALUES 
                    (:uid, 'followup', :xray_url, :cam_url, :kl_grade, :score, :dist)
            """),
            {
                "uid": user_id,
                "xray_url": followup_orig_url,
                "cam_url": followup_cam_url,
                "kl_grade": kl_grade,
                "score": round(confidence_score, 1),
                "dist": probability_distribution,
            }
        )
        db.commit()
    except Exception as e:
        print(f"Error saving follow-up data: {e}")
        db.rollback()
        return JSONResponse(status_code=500, content={"error": "Failed to save follow-up scan."})

    return {
        "status": "confirmed",
        "originalImageUrl": followup_orig_url,
        "gradCamUrl": followup_cam_url,
    }


@router.get("/scan-history/{user_id}")
async def get_scan_history(user_id: str, db: Session = Depends(get_db)):
    """Get all scans for a user, ordered by date (most recent first)."""
    result = db.execute(
        text("""
            SELECT id, scan_type, scan_date, xray_image_url, gradcam_image_url, 
                   kl_grade, confidence_score, probability_distribution
            FROM scan_history
            WHERE user_id = :uid
            ORDER BY scan_date DESC
        """),
        {"uid": user_id}
    ).fetchall()

    scans = []
    for row in result:
        scans.append({
            "id": str(row.id),
            "scanType": row.scan_type,
            "scanDate": str(row.scan_date),
            "xrayImageUrl": row.xray_image_url,
            "gradcamImageUrl": row.gradcam_image_url,
            "klGrade": row.kl_grade,
            "confidenceScore": row.confidence_score,
            "probabilityDistribution": row.probability_distribution,
        })

    return {"scans": scans}
