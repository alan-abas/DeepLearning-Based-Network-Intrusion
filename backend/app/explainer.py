import os
import numpy as np
import shap
import torch
from typing import Dict, List, Any
from backend.app.schemas import ShapExplanation, ShapFeatureContribution
from backend.app.data_loader import state

# Set matplotlib cache directory to writable location
os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib"

class ExplainerManager:
    def __init__(self):
        self.tree_explainer = None
        self.ann_explainer = None
        self.background = None

    def initialize(self):
        if not state.is_loaded:
            state.load_all()

        if self.background is None and state.background_data is not None:
            # Use small representative background for fast KernelExplainer
            self.background = state.background_data[:15]

        # 1. TreeExplainer for Scikit-Learn Random Forest
        if self.tree_explainer is None and state.baseline_model is not None:
            print("Initializing SHAP TreeExplainer for Random Forest...")
            self.tree_explainer = shap.TreeExplainer(state.baseline_model)

        # 2. KernelExplainer for PyTorch ANN
        if self.ann_explainer is None and state.ann_model is not None and self.background is not None:
            print("Initializing SHAP KernelExplainer for PyTorch ANN...")
            def predict_fn(x: np.ndarray) -> np.ndarray:
                with torch.no_grad():
                    tensor_x = torch.from_numpy(x).float()
                    probs = state.ann_model.predict_proba(tensor_x)
                    return probs.numpy().reshape(-1)
            self.ann_explainer = shap.KernelExplainer(predict_fn, self.background)

manager = ExplainerManager()

def explain_instance(
    model_type: str,
    raw_features: Dict[str, float],
    scaled_vector: np.ndarray,
    feature_names: List[str],
    prediction: int,
    attack_prob: float
) -> ShapExplanation:
    if manager.tree_explainer is None or manager.ann_explainer is None:
        manager.initialize()

    shap_values_1d = None
    base_val = 0.5

    if model_type == "baseline":
        explainer = manager.tree_explainer
        if explainer is None:
            raise RuntimeError("SHAP TreeExplainer not available")
        
        raw_shap = explainer.shap_values(scaled_vector)
        # Check output structure: (1, 69, 2) or list of [class0, class1]
        if isinstance(raw_shap, list):
            shap_values_1d = np.array(raw_shap[1][0], dtype=float)
        elif isinstance(raw_shap, np.ndarray) and raw_shap.ndim == 3:
            shap_values_1d = np.array(raw_shap[0, :, 1], dtype=float)
        else:
            shap_values_1d = np.array(raw_shap[0], dtype=float)

        expected_val = explainer.expected_value
        if isinstance(expected_val, (list, np.ndarray)):
            base_val = float(expected_val[1])
        else:
            base_val = float(expected_val)

    elif model_type == "ann":
        explainer = manager.ann_explainer
        if explainer is None:
            raise RuntimeError("SHAP KernelExplainer not available")
            
        raw_shap = explainer.shap_values(scaled_vector, nsamples=80)
        shap_values_1d = np.array(raw_shap[0], dtype=float)
        base_val = float(explainer.expected_value)

    else:
        raise ValueError(f"Unknown model_type '{model_type}' for SHAP")

    # Pair each feature with its SHAP value and raw value
    items = []
    for i, name in enumerate(feature_names):
        raw_val = float(raw_features.get(name, state.feature_stats.get(name, {}).get("mean", 0.0)))
        s_val = float(shap_values_1d[i])
        items.append({
            "feature": name,
            "value": raw_val,
            "shap_value": s_val,
            "abs_shap": abs(s_val),
            "effect": "increases_risk" if s_val > 0 else "decreases_risk"
        })

    # Sort descending by absolute SHAP impact
    items.sort(key=lambda x: x["abs_shap"], reverse=True)
    top_items = items[:10]

    contributions = [
        ShapFeatureContribution(
            feature=it["feature"],
            value=it["value"],
            shap_value=round(it["shap_value"], 5),
            effect=it["effect"]
        )
        for it in top_items
    ]

    # Generate human-readable narrative summary
    top_attack_drivers = [it["feature"] for it in top_items if it["shap_value"] > 0][:3]
    top_benign_drivers = [it["feature"] for it in top_items if it["shap_value"] < 0][:3]

    pred_label = "ATTACK / INTRUSION (Class 1)" if prediction == 1 else "BENIGN (Class 0)"
    prob_pct = round(attack_prob * 100, 1)

    narrative_parts = [
        f"The model predicted {pred_label} with an estimated threat probability of {prob_pct}% (base prior: {round(base_val * 100, 1)}%)."
    ]

    if top_attack_drivers:
        narrative_parts.append(
            f"Key metrics driving an increase in attack probability were: {', '.join(top_attack_drivers)}."
        )
    if top_benign_drivers:
        narrative_parts.append(
            f"Conversely, normal ranges in {', '.join(top_benign_drivers)} pulled the prediction toward Benign."
        )

    summary_text = " ".join(narrative_parts)

    return ShapExplanation(
        base_value=round(base_val, 4),
        prediction_value=round(attack_prob, 4),
        top_contributions=contributions,
        summary_text=summary_text
    )
