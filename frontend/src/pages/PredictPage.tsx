import React, { useState, useEffect } from 'react'
import {
  ShieldAlert, ShieldCheck, Cpu, Database, Play,
  RotateCcw, Sparkles, Clock
} from 'lucide-react'
import { FeatureInputForm } from '../components/FeatureInputForm'
import { ShapWaterfall } from '../components/ShapWaterfall'
import {
  getFeatures, getSamples, predictRecord
} from '../services/api'
import {
  FeatureStats, SampleRecord, PredictResponse
} from '../types/api'

export const PredictPage: React.FC = () => {
  const [modelType, setModelType] = useState<'ann' | 'baseline'>('ann')
  const [featureNames, setFeatureNames] = useState<string[]>([])
  const [stats, setStats] = useState<Record<string, FeatureStats>>({})
  const [features, setFeatures] = useState<Record<string, number>>({})
  const [samples, setSamples] = useState<SampleRecord[]>([])
  const [selectedSample, setSelectedSample] = useState<SampleRecord | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [shapLoading, setShapLoading] = useState(false)
  const [predictionResult, setPredictionResult] = useState<PredictResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load features and samples on mount
  useEffect(() => {
    async function loadData() {
      try {
        const featRes = await getFeatures()
        setFeatureNames(featRes.feature_names)
        setStats(featRes.stats)

        // Initialize features with mean values
        const initialFeats: Record<string, number> = {}
        featRes.feature_names.forEach(name => {
          initialFeats[name] = featRes.stats[name]?.mean ?? 0.0
        })
        setFeatures(initialFeats)

        const sampleRes = await getSamples()
        setSamples(sampleRes)
        if (sampleRes.length > 0) {
          // Pre-load first benign sample
          loadSample(sampleRes[0])
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load initial data from backend')
      }
    }
    loadData()
  }, [])

  const loadSample = (sample: SampleRecord) => {
    setSelectedSample(sample)
    setFeatures({ ...sample.features })
    setPredictionResult(null)
  }

  const handleFeatureChange = (name: string, val: number) => {
    setFeatures(prev => ({ ...prev, [name]: val }))
    setSelectedSample(null) // Custom edited
  }

  const resetToDefaults = () => {
    const defaultFeats: Record<string, number> = {}
    featureNames.forEach(name => {
      defaultFeats[name] = stats[name]?.mean ?? 0.0
    })
    setFeatures(defaultFeats)
    setSelectedSample(null)
    setPredictionResult(null)
  }

  const handlePredict = async (withShap: boolean) => {
    setLoading(true)
    if (withShap) setShapLoading(true)
    setError(null)
    try {
      const res = await predictRecord(modelType, features, withShap)
      setPredictionResult(res)
    } catch (err: any) {
      setError(err.message || 'Prediction failed')
    } finally {
      setLoading(false)
      setShapLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 60px' }}>
      
      {/* Top Configuration Bar: Model Selection & Quick Samples */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Model Toggle */}
          <div>
            <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
              Target Inference Model
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setModelType('ann')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: modelType === 'ann' ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                  background: modelType === 'ann' ? '#f0fdf4' : '#ffffff',
                  color: modelType === 'ann' ? '#166534' : '#64748b',
                  boxShadow: modelType === 'ann' ? '0 1px 3px rgba(22, 163, 74, 0.15)' : 'none'
                }}
              >
                <Cpu size={16} />
                PyTorch Deep ANN (MLP)
              </button>

              <button
                type="button"
                onClick={() => setModelType('baseline')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: modelType === 'baseline' ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                  background: modelType === 'baseline' ? '#eff6ff' : '#ffffff',
                  color: modelType === 'baseline' ? '#1d4ed8' : '#64748b',
                  boxShadow: modelType === 'baseline' ? '0 1px 3px rgba(37, 99, 235, 0.15)' : 'none'
                }}
              >
                <Database size={16} />
                Random Forest Baseline (Scikit-Learn)
              </button>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div style={{ flex: 1, minWidth: '320px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Authentic CICIDS2017 Flow Presets
              </label>
              {selectedSample && (
                <span style={{ fontSize: '11px', color: selectedSample.binary_label === 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                  Ground Truth: {selectedSample.original_label} ({selectedSample.binary_label === 0 ? 'BENIGN = 0' : 'ATTACK = 1'})
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {samples.slice(0, 6).map((s, idx) => {
                const isBenign = s.binary_label === 0
                const isCurrent = selectedSample === s
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => loadSample(s)}
                    style={{
                      padding: '5px 11px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      border: isCurrent
                        ? (isBenign ? '1.5px solid #16a34a' : '1.5px solid #dc2626')
                        : '1px solid #e2e8f0',
                      background: isCurrent
                        ? (isBenign ? '#dcfce7' : '#fee2e2')
                        : (isBenign ? '#f0fdf4' : '#fef2f2'),
                      color: isBenign ? '#166534' : '#991b1b',
                      fontWeight: isCurrent ? 700 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{isBenign ? '🛡️' : '🚨'}</span>
                    <span>{s.original_label}</span>
                  </button>
                )
              })}

              <button
                type="button"
                onClick={resetToDefaults}
                style={{
                  padding: '5px 11px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 500
                }}
              >
                <RotateCcw size={12} />
                Defaults
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Action Prediction Control Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={loading}
          onClick={() => handlePredict(false)}
          style={{
            flex: 1,
            minWidth: '220px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            border: 'none',
            background: '#2563eb',
            color: '#ffffff',
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.15s ease'
          }}
        >
          <Play size={16} fill="#ffffff" />
          {loading && !shapLoading ? 'Running Inference...' : 'Analyze & Predict Record'}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handlePredict(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            border: '1.5px solid #0284c7',
            background: '#ffffff',
            color: '#0284c7',
            boxShadow: '0 1px 3px rgba(2, 132, 199, 0.1)',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.15s ease'
          }}
        >
          <Sparkles size={16} />
          {shapLoading ? 'Computing SHAP...' : 'Predict + Explain with SHAP'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '8px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          marginBottom: '24px',
          fontSize: '13px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Prediction Result Display */}
      {predictionResult && (
        <div
          className={`glass-panel ${predictionResult.prediction === 1 ? 'card-attack' : 'card-benign'}`}
          style={{
            padding: '24px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            
            {/* Status & Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                background: predictionResult.prediction === 1 ? '#fee2e2' : '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: predictionResult.prediction === 1 ? '#dc2626' : '#16a34a'
              }}>
                {predictionResult.prediction === 1 ? <ShieldAlert size={32} /> : <ShieldCheck size={32} />}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: predictionResult.prediction === 1 ? '#dc2626' : '#16a34a',
                    color: '#ffffff'
                  }}>
                    CLASS {predictionResult.prediction}
                  </span>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: predictionResult.prediction === 1 ? '#991b1b' : '#166534' }}>
                    {predictionResult.label}
                  </h2>
                </div>
                <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                  {predictionResult.prediction === 1
                    ? 'Flow exhibits malicious signatures matching known network attack behaviors.'
                    : 'Flow conforms to expected benign network protocol and traffic patterns.'}
                </p>
              </div>
            </div>

            {/* Metrics: Probability, Confidence, Latency */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Attack Probability</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }} className="mono">
                  {(predictionResult.probability * 100).toFixed(2)}%
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Confidence</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#2563eb' }} className="mono">
                  {predictionResult.confidence_pct.toFixed(1)}%
                </div>
              </div>

              <div style={{ textAlign: 'right', borderLeft: '1px solid #cbd5e1', paddingLeft: '16px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                  <Clock size={11} /> Latency
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }} className="mono">
                  {predictionResult.latency_ms.toFixed(2)} ms
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>{predictionResult.model_type}</div>
              </div>
            </div>

          </div>

          {/* Probability Progress Bar */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '6px', fontWeight: 500 }}>
              <span>0% (BENIGN)</span>
              <span>Decision Threshold (50%)</span>
              <span>100% (ATTACK)</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  background: '#94a3b8',
                  zIndex: 2
                }}
              />
              <div
                style={{
                  height: '100%',
                  width: `${(predictionResult.probability * 100).toFixed(1)}%`,
                  background: predictionResult.prediction === 1
                    ? '#ef4444'
                    : '#16a34a',
                  borderRadius: '6px',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* SHAP Explanation Section */}
      <div style={{ marginBottom: '24px' }}>
        <ShapWaterfall
          explanation={predictionResult?.shap_explanation || null}
          loading={shapLoading}
        />
      </div>

      {/* Feature Inputs */}
      <FeatureInputForm
        features={features}
        stats={stats}
        onChange={handleFeatureChange}
      />

    </div>
  )
}
