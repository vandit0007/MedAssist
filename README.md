# 🏥 MedAssist – AI Medical Symptom Triage Assistant

MedAssist is an intelligent, dataset-driven medical symptom triage and specialist recommendation web application. Patients describe their symptoms in plain, natural language and receive instant clinical triage guidance, potential condition matches, recommended medical specialties, diagnostic follow-up questions, and self-care precautions.

---

## 🌟 Key Features

- **📊 Dataset-Driven Clinical Knowledge Base:** Powered by a structured clinical dataset with **33 medical conditions** across **10 clinical specialties** (`Cardiology`, `Neurology`, `Dermatology`, `Orthopedics`, `Gastroenterology`, `Pulmonology`, `ENT`, `Endocrinology`, `Ophthalmology`, `General Medicine`).
- **🚨 Emergency Red-Flag Detection:** Rule-based safety guardrails that detect life-threatening emergencies (e.g. crushing chest pain, slurred speech, facial drooping, acute breathlessness) and prompt immediate ER guidance.
- **🔍 TF-IDF & N-Gram Similarity Matching:** Matches multi-symptom descriptions against the indexed clinical database using cosine similarity.
- **💬 Interactive Follow-Up Chips:** Suggested follow-up triage questions can be clicked to automatically send answers into the chat.
- **📋 Actionable Precautions & Self-Care:** Structured home-care guidance and lifestyle precautions for each condition.
- **🎨 Modern Clinical UI:** Medical glassmorphism interface with priority badges (Emergency, Urgent, Moderate, Mild), confidence meters, and quick-test sample pills.

---

## 🏛️ Architecture & Project Structure

```text
MedAssist/
├── backend/
│   ├── app.py                             # Flask API & NLP Triage Engine
│   ├── data/
│   │   └── medical_triage_dataset.csv     # Structured Medical Knowledge Base
│   └── venv/                              # Python Virtual Environment
├── frontend/
│   ├── public/                            # Static assets & index.html
│   └── src/
│       ├── App.js                         # React UI & Chat Component
│       ├── App.css                        # Modern Clinical Theme & Styling
│       └── index.js                       # React entry point
├── requirements.txt                       # Python dependencies
└── .gitignore                             # Git ignore rules
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and **npm**

---

### 1. Backend Setup & Run

Open a terminal in the project directory:

```bash
cd backend
# If venv is not activated:
.\venv\Scripts\python.exe app.py
```

*The Flask API will run on `http://127.0.0.1:8000`.*

#### API Endpoints:
- `POST /api/chat` – Evaluates symptoms and returns triage metadata (`department`, `condition`, `confidence`, `follow_up`, `precautions`, `severity`).
- `GET /api/stats` – Returns live dataset metrics (total conditions, active specialties).
- `GET /api/departments` – Returns a list of all indexed medical departments.

---

### 2. Frontend Setup & Run

Open a second terminal window:

```bash
cd frontend
npm install
npm start
```

*The React app will open at `http://localhost:3000`.*

---

## 📊 Dataset Schema

The clinical database is located at `backend/data/medical_triage_dataset.csv`:

| Column | Description |
| :--- | :--- |
| `department` | Medical specialty to consult (e.g., *Cardiology*, *Neurology*) |
| `condition` | Potential condition match (e.g., *Migraine*, *GERD*, *Asthma*) |
| `symptoms` | Comma-separated list of recognized medical symptoms |
| `description` | Plain-English clinical overview of the condition |
| `follow_up_questions` | Semicolon-delimited clinical triage questions |
| `precautions` | Semicolon-delimited immediate self-care steps |
| `severity_level` | Priority classification (`Emergency`, `Urgent`, `Moderate`, `Mild`) |

---

## ⚠️ Medical Disclaimer

*MedAssist is designed solely for informational and educational triage support and is not a substitute for professional medical advice, diagnosis, or treatment. In case of life-threatening emergencies, contact emergency services (911/112) immediately.*
