import joblib
from pathlib import Path
import numpy as np
import shap

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class MolecularShapExplainer:
    def __init__(self, model_path: str = "backend/xgb_pairwise.pkl", explainer_path: str = "backend/shap_explainer.pkl"):
        self.model = joblib.load(model_path)
        self.explainer = joblib.load(explainer_path)
        self.feature_names = joblib.load("backend/feature_names.pkl")

    def explain_instance(self, feature_vector: np.ndarray) -> list:
        """Computes local SHAP attributions for a single pair feature vector."""
        if feature_vector.ndim == 1:
            feature_vector = feature_vector.reshape(1, -1)
        
        shap_vals = self.explainer.shap_values(feature_vector)
        shap_arr = np.array(shap_vals)
        
        # Determine average impact across classes or for predicted class
        preds = self.model.predict(feature_vector)[0]
        if shap_arr.ndim == 3 and shap_arr.shape[0] > preds:
            class_shap = shap_arr[preds][0]
        elif shap_arr.ndim == 2:
            class_shap = shap_arr[0]
        else:
            class_shap = shap_arr.reshape(-1)

        attributions = []
        for i, name in enumerate(self.feature_names):
            if i < len(class_shap):
                imp = float(class_shap[i])
                attributions.append({
                    "feature": name,
                    "impact": round(imp, 4),
                    "positive": imp > 0
                })
        
        attributions.sort(key=lambda x: abs(x["impact"]), reverse=True)
        return attributions

if __name__ == "__main__":
    expl = MolecularShapExplainer()
    print("SHAP explainer loaded successfully with", len(expl.feature_names), "features.")
