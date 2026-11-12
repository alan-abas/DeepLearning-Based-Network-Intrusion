import React from 'react'
import { ConfusionMatrixData } from '../types/api'

interface ConfusionMatrixProps {
  title: string
  subtitle: string
  matrix: ConfusionMatrixData
  accentColor?: string
}

export const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({
  title,
  subtitle,
  matrix
}) => {
  const total = matrix.tn + matrix.fp + matrix.fn + matrix.tp
  const tnPct = ((matrix.tn / total) * 100).toFixed(1)
  const fpPct = ((matrix.fp / total) * 100).toFixed(1)
  const fnPct = ((matrix.fn / total) * 100).toFixed(1)
  const tpPct = ((matrix.tp / total) * 100).toFixed(1)

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{title}</h4>
        <p style={{ fontSize: '12px', color: '#64748b' }}>{subtitle}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Header Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', textAlign: 'center', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
          <div></div>
          <div>PRED BENIGN (0)</div>
          <div>PRED ATTACK (1)</div>
        </div>

        {/* Row 1: True Benign */}
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '8px', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textAlign: 'right', paddingRight: '8px' }}>
            TRUE BENIGN (0)
          </div>
          {/* TN */}
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>True Negative (TN)</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }} className="mono">
              {matrix.tn.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#166534', fontWeight: 500 }}>{tnPct}%</div>
          </div>
          {/* FP */}
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 600 }}>False Positive (FP)</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }} className="mono">
              {matrix.fp.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: 500 }}>{fpPct}%</div>
          </div>
        </div>

        {/* Row 2: True Attack */}
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '8px', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textAlign: 'right', paddingRight: '8px' }}>
            TRUE ATTACK (1)
          </div>
          {/* FN */}
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>False Negative (FN)</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }} className="mono">
              {matrix.fn.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#92400e', fontWeight: 500 }}>{fnPct}%</div>
          </div>
          {/* TP */}
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: 600 }}>True Positive (TP)</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }} className="mono">
              {matrix.tp.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 500 }}>{tpPct}%</div>
          </div>
        </div>

      </div>
    </div>
  )
}
