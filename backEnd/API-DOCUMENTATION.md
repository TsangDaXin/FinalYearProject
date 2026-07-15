# Orionix AI Physiotherapy Recommendations API

Generates personalized physiotherapy exercise plans and wellness recommendations based on the knee osteoarthritis X-ray prediction results and the user's onboarding health profile, powered by Groq (Llama 3.3 70B) with RAG support.

## ✅ System Status (Verified: June 2, 2026)

- **Groq API**: ✅ Connected (gsk_dPnnniRP...XfvqseqCnHmNX)
- **LLM Model**: Llama 3.3 70B Versatile
- **RAG Vector Store**: ✅ Initialized with 2 medical PDFs (ChromaDB)
- **Embedding Model**: sentence-transformers/all-MiniLM-L6-v2
- **All Endpoints**: ✅ Operational
  - `/predict` - X-ray prediction + Grad-CAM
  - `/api/recommendations` - Physiotherapy plans (Groq + RAG)
  - `/api/chat` - Orionix Assistant (Groq + RAG)
  - `/api/insights` - Diagnostic insights (Groq + RAG)

**Test Results:**
- Groq API Client: Working ✓
- RAG Context Retrieval: Working (1687 chars retrieved for test query) ✓
- End-to-end API Call: Working ✓

## Endpoint

```
POST https://<YOUR_API_ID>.execute-api.us-east-1.amazonaws.com/default/medical_recommendations
Content-Type: application/json
```

---

## Request Body

| Field                  | Type   | Required | Default            | Description |
|------------------------|--------|----------|--------------------|-------------|
| `prediction_result`    | object | **Yes**  | —                  | X-ray ML model output (KL grade, severity, confidence) |
| `user_profile`         | object | **Yes**  | —                  | Patient health profile collected during onboarding |
| `recommendation_type`  | string | No       | `"exercise_plan"`  | Type of recommendation to generate |
| `preferred_language`   | string | No       | `"English"`        | Output language |
| `max_tokens`           | int    | No       | `3072`             | Max response length (1–4096) |
| `temperature`          | float  | No       | `0.5`              | AI creativity (0.0–1.0) |

---

### `prediction_result` object

Output from the knee X-ray classification model (EfficientNetV2-B3 regression).

| Field             | Type   | Required | Description |
|-------------------|--------|----------|-------------|
| `severity_grade`  | string | **Yes**  | KL grade label: `"Healthy"`, `"Doubtful"`, `"Minimal"`, `"Moderate"`, or `"Severe"` |
| `raw_score`       | float  | **Yes**  | Raw regression output from the model (continuous value 0.0–4.0) |
| `top_confidence`  | float  | No       | Confidence percentage for the predicted grade (0–100) |
| `confidence_distribution` | array | No | Array of `{ grade, score }` objects showing probability for each KL grade |

---

### `user_profile` object

Collected during the three-section onboarding flow.

#### Biometrics & Demographics

| Field              | Type    | Required | Description |
|--------------------|---------|----------|-------------|
| `age`              | int     | **Yes**  | Patient age (10–120) |
| `biological_sex`   | string  | **Yes**  | `"male"`, `"female"`, or `"prefer_not_to_say"` |
| `height_cm`        | float   | **Yes**  | Height in centimeters |
| `weight_kg`        | float   | **Yes**  | Weight in kilograms |
| `previous_knee_injury` | boolean | **Yes** | Whether the patient has had a previous major knee injury |

#### Symptoms Analysis

| Field                  | Type   | Required | Description |
|------------------------|--------|----------|-------------|
| `pain_severity`        | int    | **Yes**  | Knee pain when walking on flat surface (scale 0–10) |
| `morning_stiffness`    | string | **Yes**  | `"none"`, `"less_than_30_min"`, or `"more_than_30_min"` |
| `knee_instability`     | string | **Yes**  | Feeling of knee giving way/buckling/locking: `"never"`, `"rarely"`, or `"frequently"` |

#### Behavioral & Lifestyle Metrics

| Field                    | Type   | Required | Description |
|--------------------------|--------|----------|-------------|
| `daily_activity_level`   | string | **Yes**  | `"mostly_sitting"`, `"prolonged_standing"`, or `"heavy_lifting"` |
| `exercise_frequency`     | string | **Yes**  | `"sedentary"`, `"1-2_times_per_week"`, or `"3+_times_per_week"` |
| `exercise_intensity`     | string | **Yes**  | `"none"`, `"low_impact"`, or `"high_impact"` |
| `physiotherapy_adherence`| string | **Yes**  | `"yes_consistently"`, `"yes_inconsistently"`, `"no"`, or `"previously_stopped"` |

---

### `recommendation_type` values

| Value                | Description |
|----------------------|-------------|
| `exercise_plan`      | Full weekly physiotherapy exercise plan with sets/reps tailored to KL grade |
| `injury_prevention`  | Preventive exercises to slow OA progression based on risk factors |
| `rehabilitation`     | Post-injury or post-flare recovery program |
| `general_wellness`   | Holistic wellness tips (joint care, nutrition, weight management, sleep) |

---

## Example Requests

### Minimal request

```json
{
  "prediction_result": {
    "severity_grade": "Doubtful",
    "raw_score": 1.2,
    "top_confidence": 78.5
  },
  "user_profile": {
    "age": 42,
    "biological_sex": "female",
    "height_cm": 162,
    "weight_kg": 68,
    "previous_knee_injury": false,
    "pain_severity": 3,
    "morning_stiffness": "less_than_30_min",
    "knee_instability": "rarely",
    "daily_activity_level": "mostly_sitting",
    "exercise_frequency": "1-2_times_per_week",
    "exercise_intensity": "low_impact",
    "physiotherapy_adherence": "no"
  }
}
```

### Full request

```json
{
  "prediction_result": {
    "severity_grade": "Moderate",
    "raw_score": 2.8,
    "top_confidence": 85.2,
    "confidence_distribution": [
      { "grade": "Healthy", "score": 2.1 },
      { "grade": "Doubtful", "score": 5.4 },
      { "grade": "Minimal", "score": 18.3 },
      { "grade": "Moderate", "score": 62.8 },
      { "grade": "Severe", "score": 11.4 }
    ]
  },
  "user_profile": {
    "age": 58,
    "biological_sex": "male",
    "height_cm": 175,
    "weight_kg": 92,
    "previous_knee_injury": true,
    "pain_severity": 7,
    "morning_stiffness": "more_than_30_min",
    "knee_instability": "frequently",
    "daily_activity_level": "prolonged_standing",
    "exercise_frequency": "sedentary",
    "exercise_intensity": "none",
    "physiotherapy_adherence": "previously_stopped"
  },
  "recommendation_type": "rehabilitation",
  "preferred_language": "English"
}
```

---

## Response

### Success — `200 OK`

```json
{
  "result": "### Knee Osteoarthritis Assessment Summary\n\nBased on the X-ray analysis..."
}
```

The `result` value is a **markdown-formatted string** with these sections:

```
### Knee Osteoarthritis Assessment Summary
<interpretation of KL grade prediction in context of patient symptoms and lifestyle>

### Recommended Physiotherapy Exercises
1. **Exercise Name** — Sets × Reps / Duration
   - Difficulty: Beginner/Intermediate/Advanced
   - Target: Muscle group or joint function
   - Why: Explanation of benefit for this patient's KL grade and symptoms
2. ...

### Precautions & Modifications
<specific warnings based on KL grade, pain severity, instability, and injury history>

### Weekly Physiotherapy Schedule
| Day | Activity | Duration | Intensity |
|-----|----------|----------|-----------|
| Mon | ...      | ...      | ...       |

### Progressive Milestones
1. Week 1-2: ...
2. Week 3-4: ...
3. Week 5-8: ...

### Lifestyle Recommendations
<weight management, activity modifications, joint protection strategies>

### ⚠️ Medical Disclaimer
<standard disclaimer about consulting healthcare providers and physiotherapists>
```

### Error — `400 Bad Request`

```json
{
  "error": "prediction_result is required"
}
```

```json
{
  "error": "user_profile must include: age, biological_sex, pain_severity"
}
```

```json
{
  "error": "Unsupported recommendation_type. Choose from: ['exercise_plan', 'injury_prevention', 'rehabilitation', 'general_wellness']"
}
```

### Error — `502 Bad Gateway`

```json
{
  "error": "Model invocation failed: ..."
}
```

---

## Frontend Integration

### fetch (vanilla JS / TypeScript)

```ts
const API_URL = "https://<YOUR_API_ID>.execute-api.us-east-1.amazonaws.com/default/medical_recommendations";

const response = await fetch(API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prediction_result: {
      severity_grade: "Moderate",
      raw_score: 2.8,
      top_confidence: 85.2,
    },
    user_profile: {
      age: 58,
      biological_sex: "male",
      height_cm: 175,
      weight_kg: 92,
      previous_knee_injury: true,
      pain_severity: 7,
      morning_stiffness: "more_than_30_min",
      knee_instability: "frequently",
      daily_activity_level: "prolonged_standing",
      exercise_frequency: "sedentary",
      exercise_intensity: "none",
      physiotherapy_adherence: "previously_stopped",
    },
    recommendation_type: "rehabilitation",
  }),
});

const data = await response.json();
// data.result is markdown — render it
console.log(data.result);
```

### Rendering the result (React)

```tsx
import ReactMarkdown from "react-markdown";

function RecommendationDisplay({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
```

---

## Mapping Onboarding Data to API Fields

| Onboarding Section | Question | API Field | Values |
|--------------------|----------|-----------|--------|
| Biometrics | Current age | `age` | Integer |
| Biometrics | Biological sex | `biological_sex` | `male` / `female` / `prefer_not_to_say` |
| Biometrics | Height | `height_cm` | Float |
| Biometrics | Weight | `weight_kg` | Float |
| Biometrics | Previous major knee injury | `previous_knee_injury` | `true` / `false` |
| Symptoms | Pain severity (0-10 scale) | `pain_severity` | 0–10 |
| Symptoms | Morning stiffness duration | `morning_stiffness` | `none` / `less_than_30_min` / `more_than_30_min` |
| Symptoms | Knee giving way/buckling | `knee_instability` | `never` / `rarely` / `frequently` |
| Lifestyle | Daily physical activity | `daily_activity_level` | `mostly_sitting` / `prolonged_standing` / `heavy_lifting` |
| Lifestyle | Exercise frequency | `exercise_frequency` | `sedentary` / `1-2_times_per_week` / `3+_times_per_week` |
| Lifestyle | Workout intensity | `exercise_intensity` | `none` / `low_impact` / `high_impact` |
| Lifestyle | Physiotherapy adherence | `physiotherapy_adherence` | `yes_consistently` / `yes_inconsistently` / `no` / `previously_stopped` |

---

## Notes

- **No authentication** — keep the URL internal. Add API keys or Cognito for production.
- Average response time: **15–25 seconds**. Show a loading state in the frontend.
- CORS enabled for all origins (`*`).
- The X-ray prediction must be obtained first from the `/predict` endpoint and passed into this API.
- Temperature is set to `0.5` by default for conservative, evidence-based recommendations.
- Always includes a medical disclaimer in the generated output.
- Recommendations are tailored based on the combination of KL grade severity AND the patient's reported symptoms/lifestyle — not just the X-ray alone.


---

## Chat Endpoint (Orionix Assistant)

Interactive conversational AI for patients to ask questions about their knee OA condition, diagnosis, and recovery roadmap. Uses RAG (Retrieval-Augmented Generation) grounded in medical PDFs.

### Endpoint

```
POST http://localhost:8000/api/chat
Content-Type: application/json
```

### Request Body

| Field            | Type   | Required | Description |
|------------------|--------|----------|-------------|
| `message`        | string | **Yes**  | User's question (1–2000 chars) |
| `severity_grade` | string | No       | Patient's KL grade for context |
| `top_confidence` | float  | No       | Prediction confidence % |
| `history`        | array  | No       | Previous messages `[{ role, content }]` (max 6 for context) |

### Example Request

```json
{
  "message": "What does my Month 3 recovery phase involve?",
  "severity_grade": "Severe",
  "top_confidence": 92.0,
  "history": [
    { "role": "assistant", "content": "Hi! I can answer questions about your recovery roadmap." },
    { "role": "user", "content": "What exercises should I do in Month 1?" }
  ]
}
```

### Response — `200 OK`

```json
{
  "reply": "In Month 3, your recovery focuses on targeted muscle hypertrophy..."
}
```

### Roadmap Chat Context

When used from the Roadmap page, the frontend prepends roadmap context to the message:
```
[Roadmap Context: Patient Mr. Owen, KL Grade 4 (Severe). Recovery phases: Month 1 - Baseline Unloading, Month 3 - Muscle Hypertrophy, Month 6 - Grad-CAM Follow-up, Month 9 - Load Reintroduction, Month 12 - Annual Review] Question: {user_message}
```

This allows the AI to provide roadmap-specific answers grounded in the patient's personalized timeline.

---

## Diagnostic Insights Endpoint

Generates AI-powered diagnostic reasons and recommended interventions based on the patient's KL grade.

### Endpoint

```
POST http://localhost:8000/api/insights
Content-Type: application/json
```

### Request Body

| Field            | Type   | Required | Description |
|------------------|--------|----------|-------------|
| `severity_grade` | string | **Yes**  | KL grade: Healthy, Doubtful, Minimal, Moderate, Severe |
| `top_confidence` | float  | **Yes**  | Prediction confidence (0–100) |

### Response — `200 OK`

```json
{
  "reasons": [
    "Large osteophytes detected on medial and lateral margins.",
    "Marked joint space narrowing indicating significant cartilage loss.",
    "Severe subchondral sclerosis with possible bone deformity."
  ],
  "interventions": [
    "Begin zero-impact aquatic therapy to maintain mobility without joint loading.",
    "Implement daily seated isometric quad contractions for muscle preservation.",
    "Schedule orthopaedic consultation for surgical triage assessment."
  ]
}
```

---

## Local Development

### Backend

```bash
cd backEnd
venv310\Scripts\activate
python main.py
```

Server runs at `http://localhost:8000`. Available routes:
- `POST /predict` — X-ray KL grade prediction + Grad-CAM
- `POST /api/recommendations` — Full physiotherapy recommendations (Groq + RAG)
- `POST /api/chat` — Conversational AI assistant (Groq + RAG)
- `POST /api/insights` — Diagnostic insights generation (Groq + RAG)
- `GET /health` — Health check

### Frontend

```bash
cd frontEnd
npm run dev
```

Runs at `http://localhost:5173`.

### Environment Variables

```env
# Backend (.env)
GROQ_API_KEY=your_groq_api_key
LLM_MODEL=llama-3.3-70b-versatile
MAX_TOKENS=3072
TEMPERATURE=0.5

# Frontend (.env)
VITE_YOUTUBE_API_KEY=your_youtube_api_key
```
