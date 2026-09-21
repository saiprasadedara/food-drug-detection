# 🥗💊 Food-Drug Interaction Detection AI

An end-to-end Machine Learning web application designed to predict and analyze adverse food-drug interactions. By combining pairwise Machine Learning models (XGBoost), molecular cheminformatics properties, and clinical safety heuristics, the platform alerts users to potential contraindications before adverse events occur.

---

## 🌟 Key Features

- **⚡ Real-Time Interaction Prediction**: Predicts interaction risk (`SAFE / LOW RISK` vs `HIGH INTERACTION RISK`) with confidence scores and probability metrics.
- **🧬 Molecular Property Analysis**: Compares physicochemical properties between food compounds and drugs:
  - **Molecular Weight (MW)**
  - **Hydrophobicity (LogP)**
  - **Polar Surface Area (PSA)**
- **🧠 Explainable AI (SHAP)**: Uses SHAP explainability metrics to show the biochemical drivers behind interaction predictions.
- **🛡️ Evidence-Based Clinical Rules Engine**: Integrated clinical rules for well-documented medical pairs (e.g., *Tetracycline + Calcium/Milk*, *Warfarin + Vitamin K*, *Atorvastatin + Grapefruit*).
- **🔍 Smart Autocomplete**: Fast compound suggestions as you type drugs and dietary items.
- **💻 Modern React Dashboard**: Intuitive, responsive dashboard built with React and interactive charts.

---

## 🛠️ Tech Stack

### **Machine Learning & Backend**
- **Language**: Python 3.10+
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (RESTful API & Swagger Docs)
- **ML Models**: [XGBoost](https://xgboost.readthedocs.io/), [Scikit-learn](https://scikit-learn.org/)
- **Model Explainability**: [SHAP](https://shap.readthedocs.io/)
- **Cheminformatics & Data**: RDKit, Pandas, NumPy, Joblib
- **Server**: Uvicorn

### **Frontend**
- **Library**: React 18 / 19
- **Icons & Visualization**: Lucide React, Chart.js, Recharts
- **HTTP Client**: Axios
- **Styling**: Modern CSS3 (Glassmorphic Dark Mode UI)

---

## 📁 Repository Structure

```plaintext
food-drug-detection/
├── backend/
│   ├── main.py                     # FastAPI server and inference pipeline
│   ├── train_pairwise.py           # Model training script
│   ├── clean_foodb.py              # Data preprocessing routines
│   ├── live_evaluate.py            # Live evaluation & validation tests
│   ├── requirements.txt            # Python dependencies
│   ├── xgb_pairwise.pkl            # Trained XGBoost pairwise model
│   ├── shap_explainer.pkl          # SHAP explainability artifact
│   ├── feature_names.pkl           # Feature vector mappings
│   ├── 03_external_test_set.csv    # Benchmark evaluation dataset
│   └── Dockerfile                  # Containerization setup
├── frontend/
│   ├── public/                     # Static web assets
│   ├── src/
│   │   ├── App.jsx                 # Main application dashboard
│   │   ├── App.css                 # Application styling & animations
│   │   └── index.js                # React root mount
│   └── package.json                # Node dependencies & scripts
├── data/
│   └── train_and_external.zip      # Compressed training & evaluation data
└── .gitignore                      # Git exclusion rules
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: v18 or higher (with npm)
- **Git**

---

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. (Optional) Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```
   > 📍 API will be running at: `http://127.0.0.1:8000`  
   > 📖 Interactive Swagger docs: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm start
   ```
   > 🌐 Web UI will open at: `http://localhost:3000`

---

## 🧪 Example Test Scenarios

| Drug | Food Item | Expected Result | Reason |
| :--- | :--- | :--- | :--- |
| **Tetracycline** | **Milk / Calcium** | 🔴 **High Interaction Risk** | Chelation inhibits antibiotic absorption |
| **Warfarin** | **Spinach / Kale** | 🔴 **High Interaction Risk** | High Vitamin K counteracts anticoagulation |
| **Atorvastatin** | **Grapefruit** | 🔴 **High Interaction Risk** | CYP3A4 inhibition increases drug toxicity |
| **Aspirin** | **Milk / Calcium** | 🟢 **Safe / Low Risk** | Safe to consume; milk can reduce stomach irritation |
| **Paracetamol** | **Milk** | 🟢 **Safe / Low Risk** | No significant pharmacokinetic interaction |

---

## 📊 API Endpoints

- **`POST /predict`**: Evaluates interaction between a drug and food input.
  ```json
  {
    "drug_name": "tetracycline",
    "food_name": "calcium"
  }
  ```
- **`GET /suggestions?query={name}`**: Autocomplete endpoint for drug/food names.
- **`GET /test/known-danger`**: Quick verification test endpoint for high-risk pair.
- **`GET /test/known-safe`**: Quick verification test endpoint for safe pair.

---

## ⚠️ Medical Disclaimer

This application is built for **educational, demonstration, and research purposes only**. It should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult with a licensed physician or pharmacist regarding medication safety and dietary guidelines.

---

## 📄 License

Distributed under the [MIT License](LICENSE).
