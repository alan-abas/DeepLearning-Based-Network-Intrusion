import React, { useEffect, useState } from 'react'
import { Layers, Award } from 'lucide-react'
import { WhyNoCnnCallout } from '../components/WhyNoCnnCallout'
import { MetricCard } from '../components/MetricCard'
import { ConfusionMatrix } from '../components/ConfusionMatrix'
import { RocCurveChart } from '../components/RocCurveChart'
import { TrainingCurveChart } from '../components/TrainingCurveChart'
import { GlobalShapChart } from '../components/GlobalShapChart'
import { getMetrics } from '../services/api'
import { MetricsResponse } from '../types/api'

export const ModelResultsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const data = await getMetrics()
        setMetrics(data)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch model metrics')
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [])

  if (loading) {
    return (
      <div style={{ maxWidth: '1280px', margin: '60px auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px', color: '#64748b', fontSize: '14px' }}>Loading evaluation benchmarks...</p>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div style={{ maxWidth: '1280px', margin: '40px auto', padding: '0 24px' }}>
        <div style={{ padding: '20px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
          <strong>Error loading results:</strong> {error || 'No metrics returned'}
        </div>
      </div>
    )
  }

  const { baseline, ann, test_set_size, test_distribution, no_cnn_justification } = metrics

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 60px' }}>
      
      {/* 1. ARCHITECTURAL OMISSION PARAGRAPH: Why No 1D-CNN? */}
      <WhyNoCnnCallout justificationText={no_cnn_justification} />

      {/* 2. Overview Banner */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} color="#2563eb" />
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Model Performance & Benchmark Evaluation
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Stratified holdout evaluation on {test_set_size.toLocaleString()} CICIDS2017 test records ({test_distribution.benign_count.toLocaleString()} Benign, {test_distribution.attack_count.toLocaleString()} Attacks).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ background: '#eff6ff', padding: '8px 14px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '10.5px', color: '#1d4ed8', fontWeight: 700 }}>BASELINE MODEL</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Random Forest (100 Trees)</div>
            </div>

            <div style={{ background: '#f0fdf4', padding: '8px 14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '10.5px', color: '#15803d', fontWeight: 700 }}>DEEP LEARNING MODEL</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>PyTorch 4-Layer ANN (MLP)</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Comparative Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <MetricCard
          label="Accuracy"
          baselineVal={baseline.accuracy}
          annVal={ann.accuracy}
          description="Total correct / total"
        />
        <MetricCard
          label="F1-Score"
          baselineVal={baseline.f1_score}
          annVal={ann.f1_score}
          description="Harmonic mean of P & R"
        />
        <MetricCard
          label="ROC-AUC"
          baselineVal={baseline.roc_auc}
          annVal={ann.roc_auc}
          description="Area under ROC curve"
        />
        <MetricCard
          label="Precision"
          baselineVal={baseline.precision}
          annVal={ann.precision}
          description="True attacks / predicted attacks"
        />
        <MetricCard
          label="Recall (Sensitivity)"
          baselineVal={baseline.recall}
          annVal={ann.recall}
          description="Detected attacks / true attacks"
        />
        <MetricCard
          label="Inference Latency"
          baselineVal={baseline.latency_ms_per_record}
          annVal={ann.latency_ms_per_record}
          unit=" ms"
          higherIsBetter={false}
          description="Avg time per flow"
        />
      </div>

      {/* 4. Confusion Matrices Side-by-Side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        <ConfusionMatrix
          title="Scikit-Learn Random Forest Confusion Matrix"
          subtitle="Evaluation on 6,808 Holdout Flow Records"
          matrix={baseline.confusion_matrix}
        />
        <ConfusionMatrix
          title="PyTorch Deep ANN Confusion Matrix"
          subtitle="Evaluation on 6,808 Holdout Flow Records"
          matrix={ann.confusion_matrix}
        />
      </div>

      {/* 5. ROC Curves and ANN Training Dynamics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        <RocCurveChart
          baselineRoc={baseline.roc_curve}
          annRoc={ann.roc_curve}
          baselineAuc={baseline.roc_auc}
          annAuc={ann.roc_auc}
        />
        <TrainingCurveChart
          history={ann.history}
        />
      </div>

      {/* 5b. Global Feature Importance via SHAP */}
      <GlobalShapChart importanceList={metrics.global_shap_importance} />

      {/* 6. Technical Architecture Comparison Note */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="#0284c7" />
          Model Architecture & Training Details
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          fontSize: '13px',
          color: '#334155',
          lineHeight: '1.6'
        }}>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ color: '#1d4ed8', fontWeight: 700, marginBottom: '6px' }}>Scikit-Learn Random Forest</h4>
            <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li><strong>Estimators:</strong> 100 decision trees</li>
              <li><strong>Max Depth:</strong> 16 levels</li>
              <li><strong>Features:</strong> 69 non-zero-variance CICIDS2017 flow metrics</li>
              <li><strong>Training Duration:</strong> {baseline.train_time_sec.toFixed(2)} seconds</li>
              <li><strong>Interpretability:</strong> Tree-based ensemble with exact SHAP TreeExplainer</li>
            </ul>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ color: '#15803d', fontWeight: 700, marginBottom: '6px' }}>PyTorch Deep ANN (MLP)</h4>
            <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li><strong>Layers:</strong> Input(69) → Linear(128)+BN+ReLU+Dropout(0.2) → Linear(64)+BN+ReLU+Dropout(0.2) → Linear(32)+BN+ReLU+Dropout(0.1) → Linear(1)</li>
              <li><strong>Loss Function:</strong> Binary Cross Entropy with Logits (BCEWithLogitsLoss)</li>
              <li><strong>Optimizer:</strong> Adam (lr=1e-3, weight_decay=1e-4) with ReduceLROnPlateau</li>
              <li><strong>Epochs:</strong> 12 epochs ({ann.train_time_sec.toFixed(2)}s on Apple MPS)</li>
              <li><strong>Interpretability:</strong> Model-agnostic KernelExplainer / gradient attributions</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  )
}
