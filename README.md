# 🧬 FOOD × DRUG MOLECULAR INTELLIGENCE
### Precision Intelligence for Food and Drug Interactions

> Predicting clinically relevant interactions between pharmaceuticals, dietary compounds, metabolic enzymes, and molecular pathways using computational biology, RDKit 3D force-fields, XGBoost classification, and SHAP explainability.

---

## 🌟 Platform Highlights

- **⚡ Precision Pairwise Inference**: Evaluates interactions between prescription pharmaceuticals (e.g. *Simvastatin*, *Warfarin*, *Metformin*, *Atorvastatin*, *Amlodipine*) and whole foods or dietary bioactives (e.g. *Grapefruit / Naringin*, *Curcumin*, *Quercetin*, *Vitamin K*, *St. John's Wort*).
- **🔬 Real 3D Molecular Conformations**: Interactive dual **3Dmol.js** viewers rendering 3D Cartesian coordinates generated via **RDKit MMFF94** force-field optimization with zoom, rotate, pan, surface toggling, and style customization (stick, sphere, line).
- **🧬 Comprehensive CYP450 Isoenzyme Profiling**: Analyzes metabolic clearance bottlenecks across **CYP1A2**, **CYP2C9**, **CYP2C19**, **CYP2D6**, and **CYP3A4** (Drug substrate, Food inhibitor, Food inducer, Metabolic clash detection).
- **📊 SHAP (Shapley Additive Explanations)**: Local feature attribution bar chart demonstrating positive and negative contributions from molecular weight, lipophilicity (LogP), topological polar surface area (TPSA), hydrogen bond donors/acceptors, and Morgan circular fingerprints.
- **📈 Empirical ML Evaluation**: Real empirical performance metrics from the pairwise interaction model:
  - **Accuracy**: 98.65%
  - **F1-Score (Macro)**: 98.61%
  - **ROC-AUC (One-vs-Rest)**: 0.9984
  - **5-Fold Cross-Validation**: 95.53% (± 1.16%)
- **🗄️ Full-Stack Modular Architecture**:
  - **Backend**: FastAPI with modular structure (`app/core`, `app/database`, `app/models`, `app/schemas`, `app/services`, `app/api`).
  - **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons, and 3Dmol.js.
  - **Database**: 12 relational models supporting both SQLite (zero-config local) and PostgreSQL.
  - **ML Ingestion Pipeline**: Scalable 1,000,000-record stream processing pipeline with dataset versioning in `ml/preprocessing/pipeline_1m.py`.
- **🔐 Researcher Authentication & History**:
  - JWT authentication with secure password hashing.
  - History drawer logging previous analyses with View, Delete, and JSON export.
- **📄 Instant Reports**: Structured JSON export, printable report view, and clipboard formatting.

---

## 🏗️ Architecture

```text
food-drug-intelligence/
├── backend/
│   ├── app/
│   │   ├── api/             # API routes: interactions, drugs, foods, auth, history
│   │   ├── core/            # Configuration and security (JWT, hashing)
│   │   ├── database/        # SQLAlchemy engine and session
│   │   ├── models/          # 12 SQLAlchemy ORM tables
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── services/        # RDKit molecular service, CYP service, ML service
│   │   └── main.py          # FastAPI application factory & database seeds
│   ├── main.py              # Entry point runner
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile           # Backend container definition
│   └── 03_external_test_set.csv
├── frontend/
│   ├── src/
│   │   ├── components/      # MoleculeViewer (3Dmol.js), AuthModal, HistoryDrawer, JsonViewerModal
│   │   ├── pages/           # HomePage, AnalyzePage
│   │   ├── services/        # API and authentication services
│   │   ├── types/           # TypeScript interfaces
│   │   └── utils/           # Scientific constants and color palettes
│   ├── Dockerfile           # Multi-stage production Nginx container
│   └── package.json
├── ml/
│   ├── preprocessing/       # Scalable 1,000,000-record dataset ingestion pipeline
│   ├── features/            # RDKit descriptor & Morgan fingerprint extractor
│   ├── training/            # XGBoost multi-class training script
│   ├── evaluation/          # Empirical metrics (accuracy, F1, ROC-AUC, confusion matrix)
│   └── explainability/      # SHAP TreeExplainer module
├── database/
│   └── init.sql             # PostgreSQL schema DDL
├── docker-compose.yml       # Multi-service container orchestration
└── .env.example             # Documented environment variables
```

---

## 🚀 Quick Start (Local Development)

### 1. Backend

```bash
cd backend
# Run server using Python
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation available at: `http://127.0.0.1:8000/docs`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```
Web application available at: `http://localhost:3000/`

---

## 🐳 Docker Deployment

To launch Frontend, Backend, and PostgreSQL database simultaneously:

```bash
docker compose up --build
```

- **Web Frontend**: `http://localhost:3000`
- **FastAPI Backend**: `http://localhost:8000`
- **PostgreSQL Database**: `localhost:5432`

---

## 📊 Model Training & Evaluation

To re-train the pairwise model and output empirical evaluation metrics:

```bash
# Train XGBoost Classifier
python ml/training/train_model.py

# Run Complete Empirical Evaluation
python ml/evaluation/evaluate_model.py
```

---

## ⚖️ Scientific & Medical Disclaimer

> **This platform is intended for research and educational purposes only and is not a substitute for professional medical advice. Interaction results should be verified using authoritative clinical sources and a qualified healthcare professional. Do not start, stop, or modify prescription drug regimens based solely on computational predictions.**
