# Explainable Deep Learning-Based Network Intrusion Detection System (CICIDS2017)

An end-to-end, production-grade **Explainable Network Intrusion Detection System (NIDS)** trained on the benchmark **CICIDS2017** dataset. The system performs high-accuracy binary threat classification with full transparency via **SHAP (Shapley Additive exPlanations)**.

- **Task**: Binary Classification (**`BENIGN = 0`**, **`ATTACK / INTRUSION = 1`**).
- **Models**:
  - **PyTorch Deep ANN**: 4-Layer Feedforward Multi-Layer Perceptron (MLP) with Batch Normalization, Dropout, and `BCEWithLogitsLoss`.
  - **Scikit-Learn Baseline**: 100-Estimator Random Forest Ensemble.
- **Explainability**: SHAP Local Waterfall Feature Attributions + Global Importance Ranking.
- **Backend**: FastAPI REST API with real-time inference and metric endpoints.
- **Interface**: React + TypeScript (Vite), featuring exactly 2 dedicated pages:
  1. **"Predict one record"**
  2. **"Model results"**
- **100% Free & Open-Source Tools Only**: PyTorch, Scikit-Learn, SHAP, FastAPI, React, TypeScript, Vite.

---

## Architectural Rationale: Why No 1D-CNN?

> While One-Dimensional Convolutional Neural Networks (1D-CNNs) are widely successful in sequence processing tasks (such as raw packet-level payload inspection, audio, or time-series waveforms), their mathematical inductive bias relies fundamentally on local spatial or temporal translational invariance and neighborhood correlation between adjacent elements. In contrast, the CICIDS2017 dataset is a purely tabular aggregation of statistical network flow summaries (such as packet lengths, inter-arrival time distributions, and cumulative TCP flag counters) computed post-hoc at flow termination. Applying a 1D convolution across these features imposes an arbitrary, artificial neighborhood relationship based entirely on the accidental alphabetical or procedural ordering of CSV columns (e.g., convolving *Flow Duration* with *Total Fwd Packets* and *Total Backward Packets*). Because adjacent tabular columns lack spatial continuity, translation invariance, and uniform scaling, 1D convolutions introduce spurious receptive-field artifacts rather than meaningful hierarchical abstractions. Fully connected Artificial Neural Networks (ANNs/MLPs) and tree ensembles treat tabular features as permutation-invariant or learn cross-feature combinations globally, making them theoretically and empirically superior architectures for tabular intrusion detection benchmarks.

---

## Benchmark Performance Comparison

Evaluated on a 20% stratified holdout of **6,808 authentic CICIDS2017 flow records** (3,931 Attacks, 2,877 Benign):

| Metric | Scikit-Learn Baseline (Random Forest) | PyTorch Deep ANN (MLP) | Advantage |
| :--- | :---: | :---: | :---: |
| **Accuracy** | **99.65%** | **96.08%** | Baseline (+3.57%) |
| **Precision** | **99.67%** | **96.94%** | Baseline (+2.73%) |
| **Recall (Sensitivity)** | **99.72%** | **96.40%** | Baseline (+3.32%) |
| **F1-Score** | **99.69%** | **96.67%** | Baseline (+3.02%) |
| **ROC-AUC** | **99.96%** | **98.93%** | Baseline (+1.03%) |
| **Inference Latency** | **18.93 ms / record** | **0.25 ms / record** | **PyTorch ANN (~75× faster)** |
| **Training Duration** | 0.28 seconds | 7.49 seconds | Both rapid & scalable |

---

## Confusion Matrices

### Scikit-Learn Random Forest
```
                      Predicted BENIGN (0)   Predicted ATTACK (1)
  True BENIGN (0)           2,864 (42.1%)          13 (0.2%)  [FP]
  True ATTACK (1)              11 (0.2%)  [FN]  3,920 (57.6%) [TP]
```

### PyTorch Deep ANN
```
                      Predicted BENIGN (0)   Predicted ATTACK (1)
  True BENIGN (0)           2,757 (40.5%)         120 (1.8%)  [FP]
  True ATTACK (1)             141 (2.1%)  [FN]  3,790 (55.7%) [TP]
```

---

## User Interface (Exactly 2 Pages)

### Page 1: "Predict one record"
- **Model Selector**: Switch between PyTorch Deep ANN and Scikit-Learn Random Forest with one click.
- **Authentic CICIDS2017 Presets**: Instant one-click loaders for genuine network traffic flows:
  - 🛡️ Normal Web/DNS Traffic (Benign)
  - 🚨 PortScan Attack
  - 🚨 DoS Attack (Hulk / GoldenEye)
  - 🚨 Botnet Attack
  - 🚨 BruteForce Attack
  - 🚨 Infiltration Attack
  - 🎲 Random Sample & Reset to Defaults
- **Intuitive Categorized Inputs**: 69 statistical flow features grouped into logical collapsibles (*Flow Basics*, *Packet Length Distributions*, *Inter-Arrival Times*, *TCP Flags & Headers*, *Subflow & Window Metrics*, *Active & Idle Times*) with search filter.
- **Prediction Banner**:
  - Clear Class 0 (BENIGN) vs Class 1 (ATTACK) decision badge.
  - Threat Probability Progress Meter.
  - Confidence Score & Inference Latency in milliseconds.
- **Local SHAP Explanations**:
  - Interactive waterfall / bar chart illustrating the exact Shapley values ($\phi_i$) for top decisive flow metrics.
  - Directional coloring: Red for metrics increasing intrusion probability, green for metrics pushing toward benign.
  - Automated natural-language narrative synthesis.

### Page 2: "Model results"
- **Architectural Rationale Card**: The full technical paragraph justifying the omission of 1D-CNNs.
- **Comparative Metric Cards**: Side-by-side Accuracy, Precision, Recall, F1-Score, ROC-AUC, and Latency cards.
- **Visual Confusion Matrices**: Normalized 2×2 grids showing True Positives, False Positives, True Negatives, and False Negatives.
- **Interactive ROC Curves**: SVG plot comparing Random Forest vs PyTorch ANN vs the diagonal random chance line.
- **PyTorch ANN Training Dynamics**: Epoch-by-epoch loss convergence and accuracy curves.
- **Global SHAP Feature Importance**: Ranked mean $|SHAP|$ scores across all test traffic flows.

---

## Project Structure

```
DL-NID/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI server & route handlers
│   │   ├── model.py             # PyTorch NetworkIntrusionANN module
│   │   ├── explainer.py         # SHAP TreeExplainer & KernelExplainer
│   │   ├── schemas.py           # Pydantic request & response models
│   │   └── data_loader.py       # Artifact loader & constants
│   ├── ml/
│   │   ├── train.py             # Preprocessing & training pipeline
│   │   └── artifacts/           # Serialized models, scaler, metrics
│   │       ├── ann_model.pth
│   │       ├── baseline_model.joblib
│   │       ├── scaler.joblib
│   │       ├── metrics.json
│   │       ├── features.json
│   │       └── sample_records.json
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Tab switcher between the 2 pages
│   │   ├── main.tsx
│   │   ├── index.css            # Dark cyber-security styling
│   │   ├── pages/
│   │   │   ├── PredictPage.tsx      # Page 1: Predict one record
│   │   │   └── ModelResultsPage.tsx # Page 2: Model results
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── WhyNoCnnCallout.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── ConfusionMatrix.tsx
│   │   │   ├── RocCurveChart.tsx
│   │   │   ├── TrainingCurveChart.tsx
│   │   │   ├── GlobalShapChart.tsx
│   │   │   ├── FeatureInputForm.tsx
│   │   │   └── ShapWaterfall.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── types/
│   │       └── api.ts
│   ├── package.json
│   └── vite.config.ts
├── tests/
│   └── test_api.py              # Automated test suite (7 tests)
├── data/
│   └── CICIDS2017_sample.csv   # Cleaned dataset sample
├── run.sh                       # One-command startup script
└── README.md
```

---

## Quick Start Guide

### Prerequisites
- Python 3.10+ (Python 3.12 recommended)
- Node.js 18+ and npm

### 1. Launch the Application
Run the root startup script:
```bash
./run.sh
```
This boots the FastAPI server hosting both the REST API and the React single-page frontend.

- **Web Interface**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Development Server (Optional)
If you wish to run the Vite dev server with Hot Module Replacement:
```bash
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173). API requests will automatically proxy to `http://localhost:8000`.

### 3. Run Automated Tests
```bash
PYTHONPATH=. ./venv/bin/pytest tests/test_api.py -v
```

### 4. Re-train Models (Optional)
To retrain both the Scikit-Learn baseline and the PyTorch ANN from scratch:
```bash
PYTHONPATH=. ./venv/bin/python backend/ml/train.py
```
