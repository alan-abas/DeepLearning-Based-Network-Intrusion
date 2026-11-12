import {
  PredictResponse,
  MetricsResponse,
  FeaturesResponse,
  SampleRecord
} from '../types/api'

const API_BASE = '/api'

export async function checkHealth(): Promise<{ status: string; num_features: number }> {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error('Backend health check failed')
  return res.json()
}

export async function getFeatures(): Promise<FeaturesResponse> {
  const res = await fetch(`${API_BASE}/features`)
  if (!res.ok) throw new Error('Failed to load features')
  return res.json()
}

export async function getSamples(): Promise<SampleRecord[]> {
  const res = await fetch(`${API_BASE}/samples`)
  if (!res.ok) throw new Error('Failed to load sample records')
  return res.json()
}

export async function getMetrics(): Promise<MetricsResponse> {
  const res = await fetch(`${API_BASE}/metrics`)
  if (!res.ok) throw new Error('Failed to load model metrics')
  return res.json()
}

export async function predictRecord(
  modelType: 'ann' | 'baseline',
  features: Record<string, number>,
  includeShap: boolean = false
): Promise<PredictResponse> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model_type: modelType,
      features,
      include_shap: includeShap
    })
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Prediction failed')
  }
  return res.json()
}
