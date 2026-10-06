"""
Real Model Evaluation Script
Computes true empirical performance metrics:
- Accuracy, Precision (Macro/Weighted), Recall (Macro/Weighted), F1 (Macro/Weighted)
- Multi-class ROC-AUC (One-vs-Rest)
- PR-AUC (Precision-Recall Area Under Curve)
- Confusion Matrix
- 5-Fold Cross-Validation Scores
- XGBoost Native Feature Importance (Gain & Weight)
- SHAP Mean Absolute Summary Values
"""

import json
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix, classification_report
)
from sklearn.model_selection import StratifiedKFold, cross_val_score
import shap

BASE_DIR = Path(__file__).resolve().parent.parent.parent

def run_evaluation(data_path: str = "backend/03_external_test_set.csv", model_path: str = "backend/xgb_pairwise.pkl"):
    print("=" * 65)
    print("      FOOD x DRUG MOLECULAR AI — MODEL EVALUATION PIPELINE")
    print("=" * 65)

    df = pd.read_csv(data_path)
    y = df["LABEL"].astype(int)
    X = df.drop(columns=["LABEL"]).select_dtypes(include=[np.number])

    # Load model
    print(f"Loading trained model from {model_path}...")
    model = joblib.load(model_path)
    explainer = joblib.load("backend/shap_explainer.pkl")
    feature_names = joblib.load("backend/feature_names.pkl")

    # Filter features to match trained columns
    train_features = [f for f in feature_names if f in X.columns]
    X = X[train_features]

    # Predictions
    y_pred = model.predict(X)
    y_prob = model.predict_proba(X)

    # 1. Classification Metrics
    acc = float(accuracy_score(y, y_pred))
    prec_macro = float(precision_score(y, y_pred, average="macro", zero_division=0))
    rec_macro = float(recall_score(y, y_pred, average="macro", zero_division=0))
    f1_macro = float(f1_score(y, y_pred, average="macro", zero_division=0))
    f1_weighted = float(f1_score(y, y_pred, average="weighted", zero_division=0))

    # 2. ROC-AUC & PR-AUC (One-vs-Rest)
    try:
        roc_auc = float(roc_auc_score(y, y_prob, multi_class="ovr", average="macro"))
    except Exception:
        roc_auc = 0.0

    # PR-AUC via One-hot Binarization
    n_classes = len(np.unique(y))
    y_one_hot = np.eye(n_classes)[y]
    try:
        pr_auc = float(average_precision_score(y_one_hot, y_prob, average="macro"))
    except Exception:
        pr_auc = 0.0

    # 3. Confusion Matrix
    cm = confusion_matrix(y, y_pred).tolist()

    # 4. Cross-Validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X, y, cv=cv, scoring="accuracy")
    cv_mean = float(cv_scores.mean())
    cv_std = float(cv_scores.std())

    # 5. Feature Importance (XGBoost Gain)
    booster = model.get_booster()
    score_gain = booster.get_score(importance_type="gain")
    # Map f0, f1... to names if needed
    feat_importance = []
    for i, col in enumerate(train_features):
        key = f"f{i}"
        val = score_gain.get(col, score_gain.get(key, 0.0))
        feat_importance.append({"feature": col, "importance_gain": float(val)})
    feat_importance.sort(key=lambda x: x["importance_gain"], reverse=True)

    # 6. SHAP Mean Absolute Values
    print("Generating real SHAP summary values...")
    sample_X = X.iloc[:200]
    shap_vals = explainer.shap_values(sample_X)
    shap_arr = np.array(shap_vals)
    # Average absolute shap across samples and classes to get 1D feature values
    if shap_arr.ndim == 3:
        # shape could be (classes, samples, features) or (samples, features, classes)
        if shap_arr.shape[0] == len(np.unique(y)):
            mean_abs_shap = np.mean(np.abs(shap_arr), axis=(0, 1))
        else:
            mean_abs_shap = np.mean(np.abs(shap_arr), axis=(0, 2))
    else:
        mean_abs_shap = np.mean(np.abs(shap_arr), axis=0)
    
    shap_summary = []
    for i, col in enumerate(train_features):
        if i < len(mean_abs_shap):
            shap_summary.append({"feature": col, "mean_abs_shap": round(float(mean_abs_shap[i]), 4)})
    shap_summary.sort(key=lambda x: x["mean_abs_shap"], reverse=True)

    metrics = {
        "accuracy": round(acc, 4),
        "precision_macro": round(prec_macro, 4),
        "recall_macro": round(rec_macro, 4),
        "f1_macro": round(f1_macro, 4),
        "f1_weighted": round(f1_weighted, 4),
        "roc_auc_ovr": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "confusion_matrix": cm,
        "cross_validation_5fold": {
            "folds": [round(float(s), 4) for s in cv_scores],
            "mean": round(cv_mean, 4),
            "std": round(cv_std, 4)
        },
        "top_features_by_gain": feat_importance[:8],
        "top_features_by_shap": shap_summary[:8]
    }

    # Print clean report to console
    print("\n" + "=" * 45)
    print("      REAL EMPIRICAL EVALUATION METRICS")
    print("=" * 45)
    print(f"Accuracy:         {acc * 100:.2f}%")
    print(f"Precision (Macro):{prec_macro * 100:.2f}%")
    print(f"Recall (Macro):   {rec_macro * 100:.2f}%")
    print(f"F1-Score (Macro): {f1_macro * 100:.2f}%")
    print(f"F1-Score (Weight):{f1_weighted * 100:.2f}%")
    print(f"ROC-AUC (OvR):    {roc_auc:.4f}")
    print(f"PR-AUC:           {pr_auc:.4f}")
    print(f"5-Fold CV Mean:   {cv_mean * 100:.2f}% (+/- {cv_std * 100:.2f}%)")
    print("\nConfusion Matrix:")
    for row in cm:
        print(" ", row)
    print("\nTop 5 Features by Information Gain:")
    for item in feat_importance[:5]:
        print(f"  • {item['feature']}: {item['importance_gain']:.4f}")
    print("=" * 45)

    # Save to JSON
    report_file = BASE_DIR / "ml" / "evaluation_report.json"
    report_file.parent.mkdir(parents=True, exist_ok=True)
    with open(report_file, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"\nSaved empirical report to {report_file}")
    return metrics

if __name__ == "__main__":
    run_evaluation()
