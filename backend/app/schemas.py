from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class PredictRequest(BaseModel):
    model_type: str = Field(default="ann", description="'ann' for PyTorch ANN or 'baseline' for Scikit-Learn Random Forest")
    features: Dict[str, float] = Field(description="Dictionary of feature name to numeric value")
    include_shap: bool = Field(default=False, description="Whether to compute SHAP feature attributions")

class ShapFeatureContribution(BaseModel):
    feature: str
    value: float
    shap_value: float
    effect: str # 'increases_risk' or 'decreases_risk'

class ShapExplanation(BaseModel):
    base_value: float
    prediction_value: float
    top_contributions: List[ShapFeatureContribution]
    summary_text: str

class PredictResponse(BaseModel):
    model_type: str
    prediction: int  # 0: BENIGN, 1: ATTACK
    label: str       # 'BENIGN' or 'ATTACK / INTRUSION'
    probability: float
    confidence_pct: float
    latency_ms: float
    shap_explanation: Optional[ShapExplanation] = None

class ConfusionMatrixData(BaseModel):
    tn: int
    fp: int
    fn: int
    tp: int

class ModelMetric(BaseModel):
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    confusion_matrix: ConfusionMatrixData
    roc_curve: List[Dict[str, float]]
    latency_ms_per_record: float
    train_time_sec: float
    history: Optional[List[Dict[str, Any]]] = None

class MetricsResponse(BaseModel):
    baseline: ModelMetric
    ann: ModelMetric
    comparison: Dict[str, float]
    test_set_size: int
    test_distribution: Dict[str, int]
    no_cnn_justification: str

class SampleRecord(BaseModel):
    original_label: str
    binary_label: int
    features: Dict[str, float]

class FeatureStat(BaseModel):
    name: str
    min: float
    max: float
    mean: float
    std: float
    median: float

class FeaturesResponse(BaseModel):
    feature_names: List[str]
    stats: Dict[str, FeatureStat]
    total_features: int
