import joblib
import json
from pathlib import Path
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
import shap

BASE_DIR = Path(__file__).resolve().parent.parent.parent

def train_interaction_classifier(data_path: str = "backend/03_external_test_set.csv", output_dir: str = "backend"):
    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    
    if "LABEL" not in df.columns:
        raise ValueError("Target column 'LABEL' not found in dataset.")

    y = df["LABEL"].astype(int)
    X = df.drop(columns=["LABEL"])
    
    # Ensure numeric
    X = X.select_dtypes(include=[np.number])
    feature_names = list(X.columns)
    print(f"Features count: {len(feature_names)}, Total rows: {len(df)}")
    print("Class distribution:\n", y.value_counts())

    # Stratified 80/20 train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print("Training XGBoost Multi-Class Classifier...")
    model = xgb.XGBClassifier(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.08,
        objective="multi:softprob",
        num_class=len(np.unique(y)),
        random_state=42,
        eval_metric="mlogloss"
    )
    
    # 5-fold cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="accuracy")
    print(f"5-Fold CV Mean Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

    # Fit final model
    model.fit(X_train, y_train)

    # Train SHAP Explainer
    print("Computing TreeExplainer for SHAP...")
    explainer = shap.TreeExplainer(model)

    # Save artifacts to both ml/models and backend/
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    
    joblib.dump(model, out_path / "xgb_pairwise.pkl")
    joblib.dump(explainer, out_path / "shap_explainer.pkl")
    joblib.dump(feature_names, out_path / "feature_names.pkl")

    ml_models = BASE_DIR / "ml" / "models"
    ml_models.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, ml_models / "xgb_pairwise.pkl")
    joblib.dump(explainer, ml_models / "shap_explainer.pkl")
    joblib.dump(feature_names, ml_models / "feature_names.pkl")

    print("Model artifacts successfully saved!")
    return model, explainer, X_test, y_test

if __name__ == "__main__":
    train_interaction_classifier()
