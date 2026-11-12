export interface ShapFeatureContribution {
  feature: string;
  value: number;
  shap_value: number;
  effect: 'increases_risk' | 'decreases_risk';
}

export interface ShapExplanation {
  base_value: number;
  prediction_value: number;
  top_contributions: ShapFeatureContribution[];
  summary_text: string;
}

export interface PredictResponse {
  model_type: string;
  prediction: number;
  label: string;
  probability: number;
  confidence_pct: number;
  latency_ms: number;
  shap_explanation: ShapExplanation | null;
}

export interface ConfusionMatrixData {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
}

export interface ModelMetric {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  confusion_matrix: ConfusionMatrixData;
  roc_curve: { fpr: number; tpr: number }[];
  latency_ms_per_record: number;
  train_time_sec: number;
  history?: {
    epoch: number;
    train_loss: number;
    train_acc: number;
    val_loss: number;
    val_acc: number;
  }[];
}

export interface MetricsResponse {
  baseline: ModelMetric;
  ann: ModelMetric;
  comparison: {
    accuracy_diff: number;
    f1_diff: number;
    auc_diff: number;
    latency_ratio: number;
  };
  test_set_size: number;
  test_distribution: {
    benign_count: number;
    attack_count: number;
  };
  no_cnn_justification: string;
  global_shap_importance?: {
    feature: string;
    importance: number;
  }[];
}

export interface SampleRecord {
  original_label: string;
  binary_label: number;
  features: Record<string, number>;
}

export interface FeatureStats {
  name: string;
  min: number;
  max: number;
  mean: number;
  std: number;
  median: number;
}

export interface FeaturesResponse {
  feature_names: string[];
  stats: Record<string, FeatureStats>;
  total_features: number;
}
