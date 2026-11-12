import React from 'react'

interface RocPoint {
  fpr: number
  tpr: number
}

interface RocCurveChartProps {
  baselineRoc: RocPoint[]
  annRoc: RocPoint[]
  baselineAuc: number
  annAuc: number
}

export const RocCurveChart: React.FC<RocCurveChartProps> = ({
  baselineRoc,
  annRoc,
  baselineAuc,
  annAuc
}) => {
  const size = 320
  const pad = 40
  const graphSize = size - pad * 2

  const toCoords = (fpr: number, tpr: number) => {
    const x = pad + fpr * graphSize
    const y = pad + (1 - tpr) * graphSize
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }

  const baselinePath = baselineRoc.map((p) => toCoords(p.fpr, p.tpr)).join(' L ')
  const annPath = annRoc.map((p) => toCoords(p.fpr, p.tpr)).join(' L ')

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>ROC Curves Comparison</h4>
          <p style={{ fontSize: '12px', color: '#64748b' }}>True Positive Rate vs False Positive Rate</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '3px', background: '#2563eb', borderRadius: '2px' }}></span>
            <span style={{ color: '#334155', fontWeight: 500 }}>Random Forest (AUC = {baselineAuc.toFixed(4)})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '3px', background: '#16a34a', borderRadius: '2px' }}></span>
            <span style={{ color: '#334155', fontWeight: 500 }}>PyTorch ANN (AUC = {annAuc.toFixed(4)})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '1px', borderTop: '1px dashed #94a3b8' }}></span>
            <span style={{ color: '#64748b' }}>Random Classifier (0.500)</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
          {/* Background grid */}
          <rect x={pad} y={pad} width={graphSize} height={graphSize} fill="#f8fafc" stroke="#e2e8f0" />
          
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((val) => {
            const p = pad + val * graphSize
            return (
              <g key={val}>
                <line x1={pad} y1={p} x2={pad + graphSize} y2={p} stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1={p} y1={pad} x2={p} y2={pad + graphSize} stroke="#e2e8f0" strokeDasharray="3 3" />
              </g>
            )
          })}

          {/* Diagonal Chance Line */}
          <line
            x1={pad}
            y1={pad + graphSize}
            x2={pad + graphSize}
            y2={pad}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />

          {/* Baseline Curve */}
          {baselinePath && (
            <path
              d={`M ${pad},${pad + graphSize} L ${baselinePath} L ${pad + graphSize},${pad}`}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
            />
          )}

          {/* ANN Curve */}
          {annPath && (
            <path
              d={`M ${pad},${pad + graphSize} L ${annPath} L ${pad + graphSize},${pad}`}
              fill="none"
              stroke="#16a34a"
              strokeWidth="2.5"
            />
          )}

          {/* Axis Labels */}
          <text x={pad + graphSize / 2} y={size - 8} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="500">
            False Positive Rate (FPR)
          </text>
          <text
            x={-pad - graphSize / 2}
            y={14}
            textAnchor="middle"
            fill="#64748b"
            fontSize="11"
            fontWeight="500"
            transform="rotate(-90)"
          >
            True Positive Rate (TPR)
          </text>

          {/* Ticks */}
          <text x={pad} y={pad + graphSize + 15} textAnchor="middle" fill="#64748b" fontSize="10">0.0</text>
          <text x={pad + graphSize} y={pad + graphSize + 15} textAnchor="middle" fill="#64748b" fontSize="10">1.0</text>
          <text x={pad - 8} y={pad + graphSize + 4} textAnchor="end" fill="#64748b" fontSize="10">0.0</text>
          <text x={pad - 8} y={pad + 4} textAnchor="end" fill="#64748b" fontSize="10">1.0</text>
        </svg>
      </div>
    </div>
  )
}
