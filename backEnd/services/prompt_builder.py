"""
Builds the AI recommendation prompt from prediction results and user profile.
Optionally enriches with RAG context from medical PDFs.
"""
from services.rag_service import retrieve_context

def build_recommendation_prompt(
    prediction_result: dict,
    user_profile: dict,
    recommendation_type: str = "exercise_plan",
    preferred_language: str = "English",
) -> str:
    """
    Build a comprehensive prompt for the AI model.
    If RAG is available, retrieves relevant medical literature and injects it.

    Args:
        prediction_result: X-ray model output (severity_grade, raw_score, etc.)
        user_profile: Patient onboarding data
        recommendation_type: Type of recommendation to generate
        preferred_language: Output language

    Returns:
        Complete prompt string ready for the LLM
    """
    # ─── Extract prediction info ──────────────────────────────────────────────
    severity_grade = prediction_result.get("severity_grade", "N/A")
    raw_score = prediction_result.get("raw_score", "N/A")
    top_confidence = prediction_result.get("top_confidence", "N/A")

    # ─── Extract user profile ─────────────────────────────────────────────────
    age = user_profile.get("age", "N/A")
    sex = user_profile.get("biological_sex", "N/A")
    height = user_profile.get("height_cm", "N/A")
    weight = user_profile.get("weight_kg", "N/A")
    previous_injury = user_profile.get("previous_knee_injury", False)

    pain_severity = user_profile.get("pain_severity", "N/A")
    morning_stiffness = user_profile.get("morning_stiffness", "N/A")
    knee_instability = user_profile.get("knee_instability", "N/A")

    daily_activity = user_profile.get("daily_activity_level", "N/A")
    exercise_freq = user_profile.get("exercise_frequency", "N/A")
    exercise_intensity = user_profile.get("exercise_intensity", "N/A")
    physio_adherence = user_profile.get("physiotherapy_adherence", "N/A")

    # ─── Calculate BMI if possible ────────────────────────────────────────────
    bmi_info = ""
    if isinstance(height, (int, float)) and isinstance(weight, (int, float)) and height > 0:
        bmi = weight / ((height / 100) ** 2)
        bmi_info = f"- BMI: {bmi:.1f}"

    # ─── Try to retrieve RAG context ─────────────────────────────────────────
    rag_query = (
        f"knee osteoarthritis {severity_grade} grade {recommendation_type} "
        f"physiotherapy exercises for {age} year old "
        f"pain level {pain_severity} morning stiffness {morning_stiffness}"
    )
    medical_context = retrieve_context(rag_query, k=5)

    rag_section = ""
    if medical_context:
        rag_section = f"""
**MEDICAL REFERENCE MATERIAL (from clinical guidelines):**
{medical_context}

Use the above evidence to ground your recommendations. Cite specific exercises or protocols
mentioned in the reference material where applicable.
"""

    # ─── Build the prompt ─────────────────────────────────────────────────────
    prompt = f"""You are a certified physiotherapist and sports rehabilitation specialist AI assistant,
specializing in knee osteoarthritis (OA) management and monitoring.

Based on the following X-ray prediction results and patient health profile collected during onboarding,
generate personalized physiotherapy recommendations.

IMPORTANT RULES:
- Always include a medical disclaimer that these are AI-generated suggestions
- Tailor exercises specifically to the patient's KL grade severity
- Consider their pain level, stiffness, and instability when recommending intensity
- Account for their current activity level and physiotherapy adherence
- If KL grade is Moderate or Severe, prioritize joint protection and pain management
- If KL grade is Healthy or Doubtful, focus on prevention and strengthening
{rag_section}
**X-RAY PREDICTION RESULTS (Kellgren-Lawrence Grading):**
- Severity Grade: {severity_grade}
- Raw Score: {raw_score}/4.0
- Confidence: {top_confidence}%

**PATIENT PROFILE — Biometrics & Demographics:**
- Age: {age}
- Biological Sex: {sex}
- Height: {height} cm
- Weight: {weight} kg
{bmi_info}
- Previous Major Knee Injury: {"Yes" if previous_injury else "No"}

**PATIENT PROFILE — Symptoms Analysis:**
- Knee Pain Severity (walking on flat surface): {pain_severity}/10
- Morning Stiffness Duration: {morning_stiffness.replace("_", " ")}
- Knee Instability (giving way/buckling): {knee_instability}

**PATIENT PROFILE — Behavioral & Lifestyle:**
- Daily Activity Level: {daily_activity.replace("_", " ")}
- Exercise Frequency: {exercise_freq.replace("_", " ")}
- Exercise Intensity: {exercise_intensity.replace("_", " ")}
- Physiotherapy Adherence: {physio_adherence.replace("_", " ")}

**Recommendation Type:** {recommendation_type.replace("_", " ").title()}
**Output Language:** {preferred_language}

Generate the following sections in markdown format:

### Knee Osteoarthritis Assessment Summary
Brief interpretation of the KL grade prediction in context of the patient's symptoms and lifestyle.
Explain what this grade means for them specifically.

### Recommended Physiotherapy Exercises
Numbered list of 6-8 exercises with:
- Exercise name
- Sets × Reps (or duration)
- Difficulty level (Beginner/Intermediate/Advanced)
- Target muscle group or joint function
- Why it's recommended for this patient's specific KL grade and symptoms

### Precautions & Modifications
Specific things to avoid or modify based on their KL grade, pain severity, instability, and injury history.
Include warning signs to stop exercising.

### Weekly Physiotherapy Schedule
A sample 7-day plan appropriate for their exercise frequency and current fitness level.
Format as a table with Day, Activity, Duration, and Intensity columns.

### Progressive Milestones
3-4 milestones to work toward over the next 4-8 weeks, considering their starting point.

### Lifestyle Recommendations
Weight management advice, activity modifications, joint protection strategies,
and tips specific to their daily activity level.

### ⚠️ Medical Disclaimer
Standard disclaimer about consulting healthcare providers and qualified physiotherapists
before starting any new exercise program.
"""
    return prompt
