import joblib
import pandas as pd
import shap
from sklearn.model_selection import train_test_split
import xgboost as xgb

# 1. Load preprocessed data
df = pd.read_csv("food_compounds_cleaned.csv")

# 2. Set target column (continuous regression target)
target_col = "EstateVSA1*VSAEstate8"
print(f"Training Regressor on target column: '{target_col}'")

# 3. Separate features (X) and target (y)
drop_cols = [
    target_col,
    "drug_name",
    "food_name",
    "compound_id",
    "drug_id",
    "food_id",
]
X = df.drop(columns=[c for c in drop_cols if c in df.columns])
y = df[target_col]

# Drop non-numeric features if any remain
X = X.select_dtypes(include=["number"])

# 4. Train XGBRegressor
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = xgb.XGBRegressor(
    n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42
)
model.fit(X_train, y_train)

# 5. Build Explainer
explainer = shap.TreeExplainer(model)

# 6. Save Artifacts directly in backend/
joblib.dump(model, "xgb_pairwise.pkl")
joblib.dump(explainer, "shap_explainer.pkl")
joblib.dump(list(X.columns), "feature_names.pkl")

print(
    "Success! Saved 'xgb_pairwise.pkl', 'shap_explainer.pkl', and"
    " 'feature_names.pkl'."
)