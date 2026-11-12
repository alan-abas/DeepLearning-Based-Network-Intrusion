import os
import time
import numpy as np
import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.schemas import (
    PredictRequest, PredictResponse, MetricsResponse,
    FeaturesResponse, SampleRecord
)
from backend.app.data_loader import state, NO_1D_CNN_JUSTIFICATION

app = FastAPI(
    title="Explainable Deep Learning Network Intrusion Detection System (CICIDS2017)",
    description="FastAPI Backend providing inference, performance metrics, and SHAP explainability for PyTorch ANN and Scikit-Learn baseline.",
    version="1.0.0"
)

# Enable CORS for frontend Vite client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    state.load_all()

@app.get("/api/health")
def health_check():
    if not state.is_loaded:
        state.load_all()
    return {
        "status": "healthy",
        "artifacts_loaded": state.is_loaded,
        "models_available": ["ann", "baseline"],
        "num_features": len(state.feature_names)
    }

@app.get("/api/features", response_model=FeaturesResponse)
def get_features():
    if not state.is_loaded:
        state.load_all()
    return FeaturesResponse(
        feature_names=state.feature_names,
        stats=state.feature_stats,
        total_features=len(state.feature_names)
    )

@app.get("/api/samples", response_model=list[SampleRecord])
def get_samples():
    if not state.is_loaded:
        state.load_all()
    return [
        SampleRecord(
            original_label=s["original_label"],
            binary_label=s["binary_label"],
            features=s["features"]
        )
        for s in state.sample_records
    ]

@app.get("/api/metrics", response_model=MetricsResponse)
def get_metrics():
    if not state.is_loaded:
        state.load_all()
    if not state.metrics:
        raise HTTPException(status_code=500, detail="Metrics not available")
    
    data = dict(state.metrics)
    data["no_cnn_justification"] = NO_1D_CNN_JUSTIFICATION
    return MetricsResponse(**data)

@app.get("/api/justification")
def get_justification():
    return {
        "title": "Why No 1D-CNN? Architectural Omission Justification",
        "paragraph": NO_1D_CNN_JUSTIFICATION
    }

@app.post("/api/predict", response_model=PredictResponse)
def predict_record(req: PredictRequest):
    if not state.is_loaded:
        state.load_all()
        
    feature_names = state.feature_names
    if not feature_names:
        raise HTTPException(status_code=500, detail="Feature metadata missing")
        
    # Build vector in canonical feature order
    raw_vector = []
    for name in feature_names:
        val = req.features.get(name)
        if val is None:
            # Fallback to mean if missing
            val = state.feature_stats.get(name, {}).get("mean", 0.0)
        raw_vector.append(float(val))
        
    raw_np = np.array([raw_vector], dtype=np.float32)
    scaled_vector = state.scaler.transform(raw_np)
    
    start_time = time.perf_counter()
    shap_explanation = None
    
    if req.model_type.lower() == "baseline":
        if state.baseline_model is None:
            raise HTTPException(status_code=500, detail="Baseline model not loaded")
        probs = state.baseline_model.predict_proba(scaled_vector)[0]
        attack_prob = float(probs[1])
        prediction = 1 if attack_prob >= 0.5 else 0
        latency_ms = (time.perf_counter() - start_time) * 1000
        
    elif req.model_type.lower() == "ann":
        if state.ann_model is None:
            raise HTTPException(status_code=500, detail="PyTorch ANN model not loaded")
        tensor_x = torch.from_numpy(scaled_vector).float()
        with torch.no_grad():
            prob_tensor = state.ann_model.predict_proba(tensor_x)
            attack_prob = float(prob_tensor.item())
        prediction = 1 if attack_prob >= 0.5 else 0
        latency_ms = (time.perf_counter() - start_time) * 1000
    else:
        raise HTTPException(status_code=400, detail=f"Unknown model_type '{req.model_type}'. Choose 'ann' or 'baseline'.")

    confidence = attack_prob if prediction == 1 else (1.0 - attack_prob)
    label_str = "ATTACK / INTRUSION" if prediction == 1 else "BENIGN"
    
    # SHAP explainer hook (only if requested and available)
    if req.include_shap:
        try:
            from backend.app.explainer import explain_instance
            shap_explanation = explain_instance(
                model_type=req.model_type.lower(),
                raw_features=req.features,
                scaled_vector=scaled_vector,
                feature_names=feature_names,
                prediction=prediction,
                attack_prob=attack_prob
            )
        except Exception as e:
            print(f"SHAP explanation failed or skipped: {e}")
            shap_explanation = None

    return PredictResponse(
        model_type="PyTorch Deep ANN" if req.model_type.lower() == "ann" else "Random Forest Baseline",
        prediction=prediction,
        label=label_str,
        probability=attack_prob,
        confidence_pct=round(confidence * 100, 2),
        latency_ms=round(latency_ms, 3),
        shap_explanation=shap_explanation
    )

# Mount frontend production build if available
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")

