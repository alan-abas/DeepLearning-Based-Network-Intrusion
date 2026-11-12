import os
import json
import joblib
import numpy as np
import torch
from backend.app.model import NetworkIntrusionANN

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "ml", "artifacts")

NO_1D_CNN_JUSTIFICATION = (
    "While One-Dimensional Convolutional Neural Networks (1D-CNNs) are widely successful in sequence processing "
    "tasks (such as raw packet-level payload inspection, audio, or time-series waveforms), their mathematical inductive "
    "bias relies fundamentally on local spatial or temporal translational invariance and neighborhood correlation between adjacent elements. "
    "In contrast, the CICIDS2017 dataset is a purely tabular aggregation of statistical network flow summaries (such as packet lengths, "
    "inter-arrival time distributions, and cumulative TCP flag counters) computed post-hoc at flow termination. "
    "Applying a 1D convolution across these features imposes an arbitrary, artificial neighborhood relationship based entirely on "
    "the accidental alphabetical or procedural ordering of CSV columns (e.g., convolving 'Flow Duration' with 'Total Fwd Packets' and 'Total Backward Packets'). "
    "Because adjacent tabular columns lack spatial continuity, translation invariance, and uniform scaling, 1D convolutions introduce spurious receptive-field "
    "artifacts rather than meaningful hierarchical abstractions. Fully connected Artificial Neural Networks (ANNs/MLPs) and tree ensembles treat tabular features "
    "as permutation-invariant or learn cross-feature combinations globally, making them theoretically and empirically superior architectures for tabular intrusion detection."
)

class AppState:
    def __init__(self):
        self.scaler = None
        self.baseline_model = None
        self.ann_model = None
        self.feature_names = []
        self.feature_stats = {}
        self.metrics = {}
        self.sample_records = []
        self.background_data = None
        self.is_loaded = False

    def load_all(self):
        if self.is_loaded:
            return

        print("Loading ML artifacts...")
        # 1. Scaler
        scaler_path = os.path.join(ARTIFACTS_DIR, "scaler.joblib")
        if os.path.exists(scaler_path):
            self.scaler = joblib.load(scaler_path)

        # 2. Features
        feat_path = os.path.join(ARTIFACTS_DIR, "features.json")
        if os.path.exists(feat_path):
            with open(feat_path, "r") as f:
                feat_data = json.load(f)
                self.feature_names = feat_data.get("feature_names", [])
                self.feature_stats = feat_data.get("stats", {})

        # 3. Baseline Model
        base_path = os.path.join(ARTIFACTS_DIR, "baseline_model.joblib")
        if os.path.exists(base_path):
            self.baseline_model = joblib.load(base_path)

        # 4. PyTorch ANN Model
        ann_path = os.path.join(ARTIFACTS_DIR, "ann_model.pth")
        if os.path.exists(ann_path) and self.feature_names:
            ann = NetworkIntrusionANN(input_dim=len(self.feature_names))
            ann.load_state_dict(torch.load(ann_path, map_location=torch.device("cpu")))
            ann.eval()
            self.ann_model = ann

        # 5. Metrics
        metrics_path = os.path.join(ARTIFACTS_DIR, "metrics.json")
        if os.path.exists(metrics_path):
            with open(metrics_path, "r") as f:
                self.metrics = json.load(f)

        # 6. Sample Records
        samples_path = os.path.join(ARTIFACTS_DIR, "sample_records.json")
        if os.path.exists(samples_path):
            with open(samples_path, "r") as f:
                self.sample_records = json.load(f)

        # 7. Background Data for SHAP
        bg_path = os.path.join(ARTIFACTS_DIR, "background_data.npy")
        if os.path.exists(bg_path):
            self.background_data = np.load(bg_path)

        self.is_loaded = True
        print("ML artifacts successfully loaded into memory.")

state = AppState()
