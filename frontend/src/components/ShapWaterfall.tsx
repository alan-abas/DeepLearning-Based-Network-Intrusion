import React from 'react'
import { Sparkles, TrendingUp, TrendingDown, Info } from 'lucide-react'
import { ShapExplanation } from '../types/api'

interface ShapWaterfallProps {
  explanation: ShapExplanation | null
  loading?: boolean
}

export const ShapWaterfall: React.FC<ShapWaterfallProps> = ({ explanation, loading }) => {
  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '12px', fontSize: '13px', color: '#64748b' }}>
          Computing SHAP (Shapley Additive exPlanations) attributions...
        </p>
      </div>
    )
  }

  if (!explanation) {
    return (
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Info size={18} color="#64748b" />
        <span style={{ fontSize: '13px', color: '#64748b' }}>
          Click "Predict + Explain with SHAP" to generate local feature importance attributions for this flow.
        </span>
      </div>
    )
  }

  const { base_value, prediction_value, top_contributions, summary_text } = explanation

  // Find max absolute shap value for bar percentage scaling
  const maxAbsShap = Math.max(...top_contributions.map(c => Math.abs(c.shap_value)), 0.001)

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#0284c7" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Explainable AI: Local SHAP Feature Attributions
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            Additive feature contributions explaining how individual flow metrics pushed prediction from base value to final probability.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
          <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <span style={{ color: '#64748b' }}>Base Value (E[f(x)]): </span>
            <span style={{ color: '#0f172a', fontWeight: 700 }} className="mono">{base_value.toFixed(4)}</span>
          </div>
          <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <span style={{ color: '#64748b' }}>Model Output: </span>
            <span style={{ color: '#0f172a', fontWeight: 700 }} className="mono">{prediction_value.toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* Summary Narrative */}
      {summary_text && (
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          padding: '12px 14px',
          fontSize: '13px',
          color: '#0369a1',
          marginBottom: '20px',
          lineHeight: '1.6'
        }}>
          {summary_text}
        </div>
      )}

      {/* Horizontal Waterfall / Bar List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 80px 1fr 90px', fontSize: '11px', color: '#64748b', fontWeight: 600, paddingBottom: '4px' }}>
          <div>FEATURE NAME</div>
          <div style={{ textAlign: 'right' }}>ACTUAL VAL</div>
          <div style={{ paddingLeft: '16px' }}>SHAP ATTRIBUTION (DIRECTION & WEIGHT)</div>
          <div style={{ textAlign: 'right' }}>SHAP VALUE (φ)</div>
        </div>

        {top_contributions.map((c, i) => {
          const isAttack = c.shap_value > 0
          const barWidth = Math.min(100, Math.max(6, (Math.abs(c.shap_value) / maxAbsShap) * 100))

          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '220px 80px 1fr 90px',
                alignItems: 'center',
                background: '#f8fafc',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}
            >
              {/* Feature Name */}
              <div
                title={c.feature}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {c.feature}
              </div>

              {/* Actual Value */}
              <div
                style={{
                  fontSize: '11px',
                  color: '#475569',
                  textAlign: 'right',
                  fontFamily: 'monospace'
                }}
              >
                {Number.isInteger(c.value) ? c.value : c.value.toFixed(2)}
              </div>

              {/* Attribution Bar */}
              <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${barWidth}%`,
                      background: isAttack
                        ? '#ef4444'
                        : '#16a34a',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>

              {/* SHAP Score */}
              <div
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  textAlign: 'right',
                  color: isAttack ? '#dc2626' : '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '4px'
                }}
                className="mono"
              >
                {isAttack ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isAttack ? `+${c.shap_value.toFixed(4)}` : c.shap_value.toFixed(4)}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '14px', fontSize: '11px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '2px' }}></span>
          <span style={{ color: '#64748b' }}>Pushes toward ATTACK / INTRUSION (Class 1)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', background: '#16a34a', borderRadius: '2px' }}></span>
          <span style={{ color: '#64748b' }}>Pushes toward BENIGN (Class 0)</span>
        </div>
      </div>
    </div>
  )
}
