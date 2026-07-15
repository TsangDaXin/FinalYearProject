# /backend/routers/progress.py

import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from datetime import datetime, timezone, date
from pydantic import BaseModel
from typing import Optional

from services.gate_service import (
    update_streak,
    is_chart_unlocked,
    is_xray_eligible,
    weeks_since_onboarding,
    calculate_week_number,
    calculate_mobility_score,
)

from database import get_db


router = APIRouter()


# ── Schemas ─────────────────────────────────────────────────────────────────

class LogSessionRequest(BaseModel):
    user_id: str
    video_title: str
    xp_earned: int

class LogPainRequest(BaseModel):
    user_id: str
    pain_level: int   # 0-10

class WeeklyCheckInRequest(BaseModel):
    user_id: str
    week_number: int
    week_start_date: date
    pain_level: int        # 0-10
    stiffness_level: int   # 1-3
    notes: Optional[str] = None


# ── Log session ──────────────────────────────────────────────────────────────

@router.post("/log-session")
def log_session(data: LogSessionRequest, db: Session = Depends(get_db)):
    # 1. Insert exercise session
    db.execute(
        text("""
            INSERT INTO exercise_sessions (user_id, video_title, xp_earned)
            VALUES (:uid, :title, :xp)
        """),
        {"uid": data.user_id, "title": data.video_title, "xp": data.xp_earned}
    )

    # 2. Update streak
    new_streak = update_streak(data.user_id, db)

    db.commit()
    return {
        "status": "ok",
        "streak_current": new_streak,
        "chart_unlocked": is_chart_unlocked(new_streak)
    }


# ── Log pain (DEPRECATED — pain is now captured via weekly check-in) ──────────
# Kept as a no-op for backward compatibility; will be removed in future cleanup.

# @router.post("/log-pain")
# def log_pain(data: LogPainRequest, db: Session = Depends(get_db)):
#     if not 0 <= data.pain_level <= 10:
#         raise HTTPException(status_code=422, detail="pain_level must be 0-10")
#     db.execute(
#         text("INSERT INTO pain_logs (user_id, pain_level) VALUES (:uid, :pl)"),
#         {"uid": data.user_id, "pl": data.pain_level}
#     )
#     db.commit()
#     return {"status": "ok"}


# ── Weekly check-in ───────────────────────────────────────────────────────────

@router.post("/checkin/weekly")
def weekly_checkin(data: WeeklyCheckInRequest, db: Session = Depends(get_db)):
    mobility = calculate_mobility_score(data.pain_level, data.stiffness_level)
    db.execute(
        text("""
            INSERT INTO weekly_checkins
                (user_id, check_in_week_number, week_start_date,
                 current_pain_level, current_stiffness_level,
                 composite_mobility_score, notes)
            VALUES (:uid, :wk, :ws, :pl, :sl, :ms, :notes)
            ON CONFLICT (user_id, check_in_week_number)
            DO UPDATE SET
                current_pain_level       = :pl,
                current_stiffness_level  = :sl,
                composite_mobility_score = :ms,
                notes                    = :notes
        """),
        {
            "uid": data.user_id, "wk": data.week_number,
            "ws": data.week_start_date, "pl": data.pain_level,
            "sl": data.stiffness_level, "ms": mobility,
            "notes": data.notes
        }
    )
    db.commit()

    return {"status": "ok", "mobility_score": mobility}


# ── Dashboard summary ─────────────────────────────────────────────────────────

@router.get("/summary/{user_id}")
def get_summary(user_id: str, db: Session = Depends(get_db)):
    profile = db.execute(
        text("""
            SELECT streak_current, streak_last_date, onboarding_date
            FROM profiles WHERE id = :uid
        """),
        {"uid": user_id}
    ).fetchone()

    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    streak = profile.streak_current or 0
    weeks_in = weeks_since_onboarding(profile.onboarding_date)
    chart_ok = is_chart_unlocked(streak)
    xray_ok = is_xray_eligible(profile.onboarding_date)

    # XP total
    xp_row = db.execute(
        text("SELECT COALESCE(SUM(xp_earned), 0) AS total FROM exercise_sessions WHERE user_id = :uid"),
        {"uid": user_id}
    ).fetchone()

    # Recent pain from weekly check-ins
    pain_rows = db.execute(
        text("""
            SELECT current_pain_level AS pain_level, check_in_week_number FROM weekly_checkins
            WHERE user_id = :uid
            ORDER BY check_in_week_number DESC LIMIT 12
        """),
        {"uid": user_id}
    ).fetchall()

    return {
        "xp": xp_row.total,
        "streak_current": streak,
        "chart_unlocked": chart_ok,
        "chart_days_remaining": max(0, 7 - streak),
        "xray_unlocked": xray_ok,
        "xray_weeks_elapsed": round(weeks_in, 1),
        "xray_weeks_remaining": max(0.0, round(12 - weeks_in, 1)),
        "pain_chart": [
            {"pain_level": r.pain_level, "week": r.check_in_week_number}
            for r in pain_rows
        ]
    }


# ── Combined chart data ───────────────────────────────────────────────────────

@router.get("/chart/combined/{user_id}")
def get_chart_data(user_id: str, db: Session = Depends(get_db)):
    checkin_rows = db.execute(
        text("""
            SELECT check_in_week_number, composite_mobility_score, current_pain_level,
                   current_stiffness_level, notes
            FROM weekly_checkins
            WHERE user_id = :uid
            ORDER BY check_in_week_number ASC
        """),
        {"uid": user_id}
    ).fetchall()

    mob_map = {r.check_in_week_number: r.composite_mobility_score for r in checkin_rows}
    pain_map = {r.check_in_week_number: r.current_pain_level for r in checkin_rows}
    stiffness_map = {r.check_in_week_number: r.current_stiffness_level for r in checkin_rows}
    notes_map = {r.check_in_week_number: r.notes for r in checkin_rows}
    all_weeks = sorted(mob_map.keys())

    return {
        "weeks": all_weeks,
        "mobility": [mob_map.get(w) for w in all_weeks],
        "pain": [pain_map.get(w) for w in all_weeks],
        "stiffness": [stiffness_map.get(w) for w in all_weeks],
        "notes": [notes_map.get(w) for w in all_weeks],
    }
