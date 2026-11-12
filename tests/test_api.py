import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ann" in data["models_available"]
    assert "baseline" in data["models_available"]
    assert data["num_features"] > 0

def test_get_features(client):
    response = client.get("/api/features")
    assert response.status_code == 200
    data = response.json()
    assert len(data["feature_names"]) == data["total_features"]
    assert data["total_features"] == 69

def test_get_samples(client):
    response = client.get("/api/samples")
    assert response.status_code == 200
    samples = response.json()
    assert len(samples) > 0
    # Ensure binary labels are strictly 0 or 1
    for s in samples:
        assert s["binary_label"] in [0, 1]
        if s["original_label"].strip() == "BENIGN":
            assert s["binary_label"] == 0
        else:
            assert s["binary_label"] == 1

def test_get_metrics(client):
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "baseline" in data
    assert "ann" in data
    assert "no_cnn_justification" in data
    assert "1D-CNN" in data["no_cnn_justification"]
    assert data["baseline"]["accuracy"] > 0.90
    assert data["ann"]["accuracy"] > 0.90

def test_predict_ann(client):
    samples = client.get("/api/samples").json()
    sample = samples[0]
    
    response = client.post("/api/predict", json={
        "model_type": "ann",
        "features": sample["features"],
        "include_shap": False
    })
    assert response.status_code == 200
    data = response.json()
    assert data["model_type"] == "PyTorch Deep ANN"
    assert data["prediction"] in [0, 1]
    assert 0.0 <= data["probability"] <= 1.0
    assert data["latency_ms"] > 0

def test_predict_baseline(client):
    samples = client.get("/api/samples").json()
    sample = samples[0]
    
    response = client.post("/api/predict", json={
        "model_type": "baseline",
        "features": sample["features"],
        "include_shap": False
    })
    assert response.status_code == 200
    data = response.json()
    assert data["model_type"] == "Random Forest Baseline"
    assert data["prediction"] in [0, 1]
    assert 0.0 <= data["probability"] <= 1.0

def test_predict_with_shap(client):
    samples = client.get("/api/samples").json()
    sample = samples[0]
    
    # Test baseline SHAP
    response = client.post("/api/predict", json={
        "model_type": "baseline",
        "features": sample["features"],
        "include_shap": True
    })
    assert response.status_code == 200
    data = response.json()
    assert data["shap_explanation"] is not None
    assert len(data["shap_explanation"]["top_contributions"]) > 0
    assert "summary_text" in data["shap_explanation"]
