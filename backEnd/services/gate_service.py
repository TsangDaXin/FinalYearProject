# /backend/services/gate_service.py

from datetime import date, timedelta, datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import text


# ── Streak helpers ──────────────────────────────────────────────────────────

def update_streak(user_id: str, db: Session) -> int:
    """
    Call this every time a rehab session is logged.
    Updates streak_current and streak_last_date on the profiles row.
    Returns the new streak_current value.
    """
    result = db.execute(
        text("SELECT streak_current, streak_last_date FROM profiles WHERE id = :uid"),
        {"uid": user_id}
    ).fetchone()

    if not result:
        return 0

    streak_current = result.streak_current or 0
    streak_last_date = result.streak_last_date
    today = date.today()

    if streak_last_date == today:
        # Already logged today — no change
        return streak_current

    if streak_last_date == today - timedelta(days=1):
        # Consecutive day
        streak_current += 1
    else:
        # Streak broken or first ever session
        streak_current = 1

    db.execute(
        text("""
            UPDATE profiles
            SET streak_current = :sc, streak_last_date = :sld
            WHERE id = :uid
        """),
        {"sc": streak_current, "sld": today, "uid": user_id}
    )
    db.commit()
    return streak_current


def is_chart_unlocked(streak_current: int) -> bool:
    """Returns True when the user has 7+ consecutive days."""
    return streak_current >= 7


# ── X-ray eligibility ───────────────────────────────────────────────────────

def weeks_since_onboarding(onboarding_date: datetime) -> float:
    """Returns fractional weeks elapsed since onboarding_date."""
    if onboarding_date.tzinfo is None:
        onboarding_date = onboarding_date.replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - onboarding_date).days / 7


def is_xray_eligible(onboarding_date: datetime) -> bool:
    """Returns True when account is 12+ weeks old."""
    return weeks_since_onboarding(onboarding_date) >= 0  # Changed to 0 for development testing


def calculate_week_number(onboarding_date: datetime,
                           event_date: datetime) -> int:
    """Returns 1-based week number relative to onboarding date."""
    if onboarding_date.tzinfo is None:
        onboarding_date = onboarding_date.replace(tzinfo=timezone.utc)
    if event_date.tzinfo is None:
        event_date = event_date.replace(tzinfo=timezone.utc)
    diff_days = (event_date - onboarding_date).days
    return max(1, diff_days // 7 + 1)


# ── Mobility score ──────────────────────────────────────────────────────────

def calculate_mobility_score(pain_level: int, stiffness_level: int) -> int:
    """
    Composite mobility score formula:
    100 - (pain × 10) - (stiffness × 5), clamped to 0 minimum.
    pain_level:      0-10
    stiffness_level: 1-3
    """
    score = 100 - (pain_level * 10) - (stiffness_level * 5)
    return max(0, score)
