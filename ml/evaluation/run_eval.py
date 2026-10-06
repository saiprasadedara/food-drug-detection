"""
Live model evaluation — accuracy, precision, recall, F1, ROC-AUC.
Uses the external test set: backend/03_external_test_set.csv
"""
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'
os.environ['NUMEXPR_NUM_THREADS'] = '1'

import json
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)

BASE_DIR = Path(__file__).resolve().parent.parent.parent

def run():
    print("=" * 55)
    print("  FOOD × DRUG ML MODEL — EMPIRICAL EVALUATION")
    print("=" * 55)

    test_path = BASE_DIR / "backend" / "03_external_test_set.csv"
    df = pd.read_csv(test_path)
    y = df["LABEL"].astype(int)
    X = df.drop(columns=["LABEL"]).select_dtypes(include=[np.number])

    model_path = BASE_DIR / "backend" / "xgb_pairwise.pkl"
    feat_path  = BASE_DIR / "backend" / "feature_names.pkl"

    print(f"Loading model from {model_path} ...")
    model = joblib.load(model_path)
    feature_names = joblib.load(feat_path)

    train_features = [f for f in feature_names if f in X.columns]
    X = X[train_features]
    print(f"Test samples: {len(X)}  |  Features used: {len(train_features)}")
    print(f"Label distribution: {dict(y.value_counts().sort_index())}\n")

    # Inference
    y_pred = model.predict(X)
    y_prob = model.predict_proba(X)

    # Metrics
    acc      = accuracy_score(y, y_pred)
    prec_mac = precision_score(y, y_pred, average="macro",    zero_division=0)
    rec_mac  = recall_score   (y, y_pred, average="macro",    zero_division=0)
    f1_mac   = f1_score       (y, y_pred, average="macro",    zero_division=0)
    f1_wgt   = f1_score       (y, y_pred, average="weighted", zero_division=0)

    try:
        roc = roc_auc_score(y, y_prob, multi_class="ovr", average="macro")
    except Exception:
        roc = 0.0

    cm = confusion_matrix(y, y_pred)

    # ── Print Results ──
    print("=" * 55)
    print("  METRIC                      SCORE")
    print("=" * 55)
    print(f"  Accuracy                  : {acc*100:>7.2f}%")
    print(f"  Precision (Macro-avg)     : {prec_mac*100:>7.2f}%")
    print(f"  Recall    (Macro-avg)     : {rec_mac*100:>7.2f}%")
    print(f"  F1-Score  (Macro-avg)     : {f1_mac*100:>7.2f}%")
    print(f"  F1-Score  (Weighted-avg)  : {f1_wgt*100:>7.2f}%")
    print(f"  ROC-AUC   (One-vs-Rest)   : {roc:>8.4f}")
    print("=" * 55)
    print("\n  Confusion Matrix:")
    labels = sorted(y.unique())
    header = "          " + "  ".join(f"Pred {l}" for l in labels)
    print(header)
    for i, row in enumerate(cm):
        print(f"  True {labels[i]}  " + "   ".join(f"{v:5d}" for v in row))
    print()
    print("  Per-Class Report:")
    print(classification_report(y, y_pred, zero_division=0, digits=4))

    # ── Save report ──
    report = {
        "accuracy":        round(acc,      4),
        "precision_macro": round(prec_mac, 4),
        "recall_macro":    round(rec_mac,  4),
        "f1_macro":        round(f1_mac,   4),
        "f1_weighted":     round(f1_wgt,   4),
        "roc_auc_ovr":     round(roc,      4),
        "confusion_matrix": cm.tolist(),
        "n_test_samples":  int(len(y)),
        "n_features":      int(len(train_features)),
    }
    out_path = BASE_DIR / "ml" / "evaluation_report.json"
    with open(out_path, "w") as fh:
        json.dump(report, fh, indent=2)
    print(f"  Saved report → {out_path}")
    return report

if __name__ == "__main__":
    run()
