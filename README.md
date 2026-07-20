# SteadyGerak — AI-Powered Knee Osteoarthritis Severity Monitoring & Rehabilitation Platform

<p align="center">
  <img src="dashboard_screenshot/main_dashboard.png" alt="SteadyGerak Banner" width="100%" />
</p>

## System Overview

**SteadyGerak** is a full-stack web application that combines deep learning-based radiographic analysis with Self-Determination Theory (SDT) behavioural mechanisms to provide knee osteoarthritis patients with accessible severity classification, explainable AI insights, and longitudinal rehabilitation monitoring.

---

## Project Objectives

| #   | Objective                                                                                                                                                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | To conduct a detailed analysis of the Osteoarthritis Initiative (OAI) dataset to identify imbalances in KL grade distribution and apply appropriate balancing strategies to reduce predictive bias for underrepresented severity levels.            |
| 2   | To design and evaluate deep learning models based on optimised convolutional neural network architectures with the goal of capturing subtle radiographic patterns and accurately classifying Kellgren-Lawrence (KL) grades.                         |
| 3   | To incorporate Explainable Artificial Intelligence (XAI) using the Grad-CAM framework so that each AI-generated grade is supported by clear visual explanation, improving transparency and strengthening clinical trust.                            |
| 4   | To develop a behavioural monitoring ecosystem grounded in Self-Determination Theory (SDT) that enables longitudinal tracking of joint health and promotes a sense of competence with the intention of improving long-term rehabilitation adherence. |
| 5   | To optimise the selected models for cross-platform deployment and evaluate their inference efficiency to ensure real-time diagnostic performance, while minimising computational barriers for older and resource-constrained users.                 |

---

## Problem Statement

Knee osteoarthritis (OA) is a progressive degenerative joint disease affecting over 500 million people globally, with disproportionate prevalence among older adults. Current diagnostic workflows rely heavily on manual radiographic assessment by orthopaedic specialists, which is:

- **Subjective** — Inter-rater variability in KL grade assignment between clinicians can reach 30%.
- **Inaccessible** — Patients in underserved areas face long wait times for specialist consultation.
- **Opaque** — Patients receive a grade without understanding what radiographic features drove the classification.
- **Static** — A one-time diagnosis provides no mechanism for longitudinal monitoring or rehabilitation adherence support.

SteadyGerak addresses these gaps by providing automated, explainable KL grade classification paired with a behavioural ecosystem that motivates long-term self-management.

---

## Model Comparison Results

Three CNN architectures were evaluated across multiple training configurations (C1–C4), varying learning rates, regularisation, augmentation, and scheduling strategies.

### Architecture Comparison Summary

| Model                       | Config | Validation MAE | Validation Accuracy | Validation QWK | Parameters | Approach          |
| --------------------------- | ------ | -------------: | ------------------: | -------------: | ---------: | ----------------- |
| ResNet-50                   | C1     |         0.5412 |              0.5944 |         0.7239 |     ~25.6M | Manual tuning     |
| ResNet-50                   | C2     |         0.5746 |              0.5315 |         0.7496 |     ~25.6M | Manual tuning     |
| ResNet-50                   | C3     |         0.5629 |              0.5327 |         0.7450 |     ~25.6M | Manual tuning     |
| ResNet-50                   | C4     |         0.5650 |              0.5327 |         0.7562 |     ~25.6M | Manual tuning     |
| DenseNet-121                | C1     |         0.6017 |              0.5714 |         0.6670 |      ~8.0M | Manual tuning     |
| DenseNet-121                | C2     |         0.6661 |              0.4467 |         0.6843 |      ~8.0M | Manual tuning     |
| DenseNet-121                | C3     |         0.7066 |              0.4673 |         0.6763 |      ~8.0M | Manual tuning     |
| Custom CNN + VGG16 Ensemble | C1     |         0.5749 |              0.6223 |         0.7340 |   ~29.3M\* | Manual tuning     |
| Custom CNN + VGG16 Ensemble | C2     |         0.5000 |              0.6380 |         0.7415 |   ~29.3M\* | Manual tuning     |
| EfficientNet V2-B3          | C1     |         0.4649 |              0.6562 |         0.7660 |     ~14.0M | Manual tuning     |
| EfficientNet V2-B3          | C2     |         0.4613 |              0.6441 |         0.7660 |     ~14.0M | Manual tuning     |
| EfficientNet V2-B3          | C3     |         0.6199 |              0.5763 |         0.6420 |     ~14.0M | Manual tuning     |
| **EfficientNet V2-B3**      | **C4** |     **0.4431** |          **0.6489** |     **0.7841** | **~14.0M** | **Manual tuning** |

> **Best Model:** **EfficientNet V2-B3 Configuration 4 (C4)**

**Final Test Set Performance**

| Metric                         |               Value |
| ------------------------------ | ------------------: |
| Test Accuracy                  | **0.6576 (65.76%)** |
| Balanced Accuracy              | **0.5710 (57.10%)** |
| Mean Absolute Error (MAE)      |          **0.4130** |
| Quadratic Weighted Kappa (QWK) |          **0.8092** |
| Macro ROC AUC                  |          **0.8845** |

## Justification: Manual Hyperparameter Tuning over Automated Search

1. **Domain-informed decisions** — Medical imaging tasks benefit from practitioner intuition about augmentation intensity, dropout rates, and learning rate schedules that automated search spaces may not adequately capture. For example, aggressive augmentation that distorts joint geometry can harm OA classification but automated search treats it as just another parameter.

2. **Iterative learning from failure** — Each manual configuration (C1 → C2 → C3 → C4) was designed in response to specific failure modes observed in the previous iteration (e.g., overfitting on minority classes, unstable validation loss, poor generalisation). This diagnostic approach is difficult to encode in an automated search objective.

3. **Computational efficiency** — KerasTuner requires hundreds of trial runs, each training for multiple epochs. With a dataset of this size and model complexity, the search consumed significant GPU hours while the manual approach reached a superior result in 4 targeted iterations.

4. **Reproducibility and interpretability** — Each manual configuration has a clear, documented rationale. Automated search produces a result but offers limited insight into _why_ that combination works, making it harder to justify in an academic context.

---

## Interface Design

The SteadyGerak platform is divided into several key modules that guide the user from onboarding through to long-term rehabilitation tracking and follow-up diagnoses.

### 1. Onboarding & Authentication Flow

| Screenshot                                               | Description                                                                                                            |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| ![Landing Page](dashboard_screenshot/main_dashboard.png) | **Landing Page:** Introduces the platform's AI-powered KOA severity detection and personalized rehabilitation support. |
| ![Registration](dashboard_screenshot/registration.png)   | **Registration Page:** Account creation to access the system.                                                          |
| ![Onboarding](dashboard_screenshot/onboarding1.png)       | **Onboarding:** Multi-step health profile setup capturing biometrics, symptoms, and lifestyle data.                    |

### 2. User Dashboard & Rehabilitation

| Screenshot                                          | Description                                                                                                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| ![Dashboard](dashboard_screenshot/dashboard.png)        | **User Dashboard:** Daily action dashboard with SDT gamification elements (streak, XP) and daily pain check-in.          |
| ![Clinical Exercise](dashboard_screenshot/exercise.png) | **Clinical Exercise Dashboard:** Specialized video-guided physiotherapy exercises tailored to the user's KL grade.       |
| ![Recovery Analysis](dashboard_screenshot/recovery.png) | **Recovery & Mastery Analysis:** Longitudinal tracking of mobility and pain levels across 12-week rehabilitation cycles. |
| ![Check-in](dashboard_screenshot/checkin.png)           | **Weekly Check-In:** Two-step modal for self-reporting pain (0-10) and stiffness to update rehabilitation progress.      |

### 3. Diagnostics & AI Assistant

| Screenshot                                       | Description                                                                                                                         |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| ![Upload Guide](dashboard_screenshot/upload.png)     | **X-Ray Upload:** Upload interface with validation via the Gatekeeper model to ensure valid knee X-rays.                            |
| ![Diagnostics](dashboard_screenshot/diagnostics.png) | **Severity Diagnosis:** Diagnostic results featuring the predicted KL grade, confidence scores, and an adjustable Grad-CAM overlay. |
| ![Chat](dashboard_screenshot/chat.png)               | **Assistant Chatbot:** RAG-powered chatbot providing contextual, personalized guidance based on physiotherapy guidelines.           |

### 4. Model Evaluation (General View)

| Screenshot                                           | Description                                                                                                                |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| ![Probability](dashboard_screenshot/probability.png)     | **Probability Distribution:** Donut chart and progress bars showing the model's confidence across all five KL grades.      |
| ![Progression](dashboard_screenshot/progression.png)     | **Disease Progression:** Patient's position on the KOA progression spectrum (Healthy to Severe).                           |
| ![Joint Map](dashboard_screenshot/joint-map.png)         | **Interactive 3D Joint Map:** Visualizes affected anatomical structures based on individual severity.                      |
| ![Population](dashboard_screenshot/population.png)       | **Population Comparison:** Age-related prevalence data comparing the patient's severity with the OAI reference population. |
| ![Biomechanical](dashboard_screenshot/biomechanical.png) | **Biomechanical Breakdown:** Radar chart analyzing structural areas (Space, Osteophytes, Sclerosis, Alignment).            |

### 5. Model Evaluation (Data Analytics View)

| Screenshot                                                 | Description                                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| ![Model Overview](dashboard_screenshot/model-overview.png)     | **Model Overview:** Key performance metrics including Accuracy, Balanced Accuracy, and QWK. |
| ![Confusion Matrix](dashboard_screenshot/confusion-matrix.png) | **Confusion Matrix:** Breakdown of correct and incorrect severity grade predictions.        |
| ![ROC AUC](dashboard_screenshot/roc-auc.png)                   | **ROC AUC Curves:** Model's ability to distinguish between different severity grades.       |
| ![Per-Class](dashboard_screenshot/per-class.png)               | **Per-Class Metrics:** Detailed Precision, Recall, and F1-score for each KL grade.          |
| ![Error Analysis](dashboard_screenshot/error-analysis.png)     | **Prediction Error Analysis:** Insights into 1-grade and 2-grade misclassifications.        |

### 6. Follow-up Diagnosis

| Screenshot                                                | Description                                                                                                                                     |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| ![Follow-up Upload](dashboard_screenshot/followup-upload.png) | **Follow-up Upload:** Interface for returning users to upload new X-rays for continuous monitoring.                                             |
| ![Comparative Analysis](dashboard_screenshot/comparative.png) | **Comparative Analysis:** Side-by-side comparison of baseline and latest diagnostics, including Grad-CAM and KL grades.                         |
| ![Confirmation](dashboard_screenshot/confirmation.png)        | **Confirmation Workflow:** Verification step ("Discard", "Review Again", "Finalize & Save") ensuring data integrity before storing to Supabase. |

---

## Pre-trained Model Weights

The trained model weights are too large for Git. Download from Google Drive:

| Model                    | Purpose               | Link                                                                                                                   |
| ------------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| EfficientNet V2-B3 (C4)  | KL Grade Prediction   | [Download best_model_weights.h5](https://drive.google.com/drive/folders/1V0d-JLKEHcQrLp1ubGFooeTYIB68ugYX?usp=sharing) |
| MobileNetV2 (Gatekeeper) | Knee X-Ray Validation | [Download gatekeeper_weights.h5](https://drive.google.com/drive/folders/1V0d-JLKEHcQrLp1ubGFooeTYIB68ugYX?usp=sharing) |

After downloading, place both files in:

```
ml_workflow/best_model/
├── best_model_weights.h5
└── gatekeeper_weights.h5
```

---

## Model Training Environment

The model training process was accelerated using **NVIDIA CUDA** within a **Docker container** environment to ensure consistency and reproduce dependencies seamlessly.

If you wish to train the model from scratch again:
1. Ensure you have an NVIDIA GPU with the latest CUDA drivers installed.
2. Set up a Docker container with the TensorFlow GPU image (e.g., `tensorflow/tensorflow:latest-gpu`).
3. Run the training scripts provided in the `ml_workflow/training/` directory.

> **Note:** Training the ensemble and EfficientNet V2 models from scratch can be computationally intensive and may take several hours depending on your hardware specifications.

---

## Tech Stack

| Layer    | Technology                                                                   |
| -------- | ---------------------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, TailwindCSS 4, Framer Motion, Recharts, Three.js |
| Backend  | Python 3.10, FastAPI, Uvicorn, SQLAlchemy                                    |
| ML/AI    | TensorFlow 2.20+, EfficientNetV2B3, OpenCV, Grad-CAM                         |
| LLM      | Groq (Llama 3.3 70B) for recommendations & chat                              |
| RAG      | LangChain, ChromaDB, Sentence-Transformers (all-MiniLM-L6-v2)                |
| Database | PostgreSQL (Supabase)                                                        |
| Storage  | Supabase Storage (X-ray images, Grad-CAM overlays)                           |
| Auth     | Supabase Auth                                                                |

---

## How to Run

### Prerequisites

- Python 3.10
- Node.js 18+
- PostgreSQL database (or Supabase project)
- Groq API key ([get one here](https://console.groq.com/keys))

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/FinalYearProject.git
cd FinalYearProject
```

### 2. Backend Setup

```bash
cd backEnd

# Create virtual environment
python -m venv venv310
venv310\Scripts\activate        # Windows
# source venv310/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the `backEnd/` directory:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-service-role-key

# Groq LLM
GROQ_API_KEY=your_groq_api_key
LLM_MODEL=llama-3.3-70b-versatile
MAX_TOKENS=3072
TEMPERATURE=0.5

# Model paths (default paths work if weights are in ml_workflow/best_model/)
PREDICTION_MODEL_PATH=../ml_workflow/best_model/best_model_weights.h5
GATEKEEPER_MODEL_PATH=../ml_workflow/best_model/gatekeeper_weights.h5
GATEKEEPER_THRESHOLD=0.5
```

### 4. Download Model Weights

Download from the [Google Drive links above](#pre-trained-model-weights) and place in `ml_workflow/best_model/`.

### 5. Run the Backend

```bash
cd backEnd
python main.py
```

The API will be available at `http://localhost:8000`. Verify with:

```
GET http://localhost:8000/health
```

### 6. Frontend Setup

```bash
cd frontEnd

# Install dependencies
npm install
```

Create a `.env` file in the `frontEnd/` directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_YOUTUBE_API_KEY=your-youtube-api-key
```

### 7. Run the Frontend

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## Project Structure

```
FinalYearProject/
├── backEnd/
│   ├── main.py                    # FastAPI entry point
│   ├── database.py                # SQLAlchemy DB connection
│   ├── config/settings.py         # App configuration
│   ├── routers/
│   │   ├── prediction.py          # X-ray upload & KL grade prediction
│   │   ├── recommendations.py     # AI physiotherapy recommendations
│   │   ├── chat.py                # SteadyGerak Assistant chatbot
│   │   ├── insights.py            # Diagnostic insights generation
│   │   └── progress.py            # SDT monitoring (streaks, check-ins, XP)
│   ├── services/
│   │   ├── model_loader.py        # Model architecture & weight loading
│   │   ├── gradcam.py             # Grad-CAM heatmap generation
│   │   ├── gate_service.py        # SDT gamification logic
│   │   ├── gemini_client.py       # LLM API client
│   │   ├── rag_service.py         # RAG retrieval pipeline
│   │   ├── prompt_builder.py      # Recommendation prompt construction
│   │   └── recommendation_generator.py
│   ├── data/
│   │   ├── medical_pdfs/          # RAG source documents
│   │   └── chroma_db/             # Vector store persistence
│   └── requirements.txt
├── frontEnd/
│   └── src/
│       ├── pages/
│       │   ├── dashboard/         # Daily Action Dashboard
│       │   ├── diagnostics/       # Diagnostic Results & General View
│       │   └── treatment/         # Routine & Mastery pages
│       └── components/
│           └── WeeklyCheckInModal.tsx
└── ml_workflow/
    ├── eda/                       # Exploratory Data Analysis notebooks
    ├── training/
    │   └── knee_osteoarthritis/
    │       ├── ResNet_50/         # ResNet-50 configs (C1–C4)
    │       ├── DenseNet-121/      # DenseNet-121 configs (C1–C3)
    │       └── EfficientNet_V2B3/ # EfficientNet configs (C1-C4)
    |       └── Custom CNN + VGG16 Ensemble / # Custom CNN + VGG 16 Enesmble configs (C1-C2)
    └── best_model/                # Final deployed weights (.h5)
```

---

## Key Libraries

### Backend (Python)

| Library               | Version | Purpose                               |
| --------------------- | ------- | ------------------------------------- |
| ⚡ fastapi              | latest  | REST API framework                    |
| 🧠 tensorflow           | ≥2.20.0 | Deep learning inference               |
| 👁️ opencv-python        | latest  | Image preprocessing (CLAHE, resize)   |
| 🔢 numpy                | ≥1.26.0 | Array operations                      |
| 🦜 langchain            | latest  | RAG pipeline orchestration            |
| 🗄️ chromadb             | latest  | Vector database for RAG               |
| 📝 sentence-transformers| latest  | Document embedding (all-MiniLM-L6-v2) |
| 🗃️ sqlalchemy           | latest  | Database ORM                          |
| 🐘 psycopg2-binary      | latest  | PostgreSQL driver                     |
| 🚀 groq                 | latest  | LLM API client (Llama 3.3 70B)        |

### Frontend (TypeScript/React)

| Library                    | Version | Purpose                      |
| -------------------------- | ------- | ---------------------------- |
| ⚛️ react                    | 19.x    | UI framework                 |
| ⚡ vite                     | 8.x     | Build tool                   |
| 🎨 tailwindcss              | 4.x     | Utility-first CSS            |
| 🎬 framer-motion            | 12.x    | Animations & transitions     |
| 📊 recharts                 | 3.x     | Data visualisation (charts)  |
| 🧊 three / @react-three/fiber | latest  | 3D knee joint visualisation  |
| 🟢 @supabase/supabase-js    | 2.x     | Auth, DB, and storage client |

---

## License

This project was developed as a Final Year Project at Asia Pacific University of Technology & Innovation (APU).

---

## Author

**Owen Tsang** — TP071168  
BSc (Hons) in Computer Science with data analytics  
Asia Pacific University of Technology & Innovation
