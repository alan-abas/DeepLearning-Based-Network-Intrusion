import React from 'react'

interface HistoryEpoch {
  epoch: number
  train_loss: number
  train_acc: number
  val_loss: number
  val_acc: number
}

interface TrainingCurveChartProps {
  history?: HistoryEpoch[]
}

export const TrainingCurveChart: React.FC<TrainingCurveChartProps> = ({ history = [] }) => {
  if (!history || history.length === 0) return null

  const width = 360
  const height = 180
  const pad = 35
  const graphW = width - pad * 2
  const graphH = height - pad * 2

  const maxEpoch = Math.max(...history.map(h => h.epoch), 1)
  const maxLoss = Math.max(...history.map(h => Math.max(h.train_loss, h.val_loss)), 0.3)

  const toLossCoords = (epoch: number, loss: number) => {
    const x = pad + ((epoch - 1) / (maxEpoch - 1)) * graphW
    const y = pad + (1 - loss / maxLoss) * graphH
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }

  const trainLossPath = history.map(h => toLossCoords(h.epoch, h.train_loss)).join(' L ')
  const valLossPath = history.map(h => toLossCoords(h.epoch, h.val_loss)).join(' L ')

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>PyTorch ANN Training Dynamics</h4>
          <p style={{ fontSize: '12px', color: '#64748b' }}>BCE Loss convergence across {maxEpoch} epochs</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '3px', background: '#2563eb', borderRadius: '2px' }}></span>
            <span style={{ color: '#334155', fontWeight: 500 }}>Train Loss</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '3px', background: '#d97706', borderRadius: '2px' }}></span>
            <span style={{ color: '#334155', fontWeight: 500 }}>Val Loss</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <rect x={pad} y={pad} width={graphW} height={graphH} fill="#f8fafc" stroke="#e2e8f0" />
          
          {/* Curves */}
          <path d={`M ${trainLossPath}`} fill="none" stroke="#2563eb" strokeWidth="2.5" />
          <path d={`M ${valLossPath}`} fill="none" stroke="#d97706" strokeWidth="2.5" />

          {/* Dots on last epoch */}
          {history.length > 0 && (
            <>
              <circle
                cx={toLossCoords(history[history.length - 1].epoch, history[history.length - 1].train_loss).split(',')[0]}
                cy={toLossCoords(history[history.length - 1].epoch, history[history.length - 1].train_loss).split(',')[1]}
                r="4"
                fill="#2563eb"
              />
              <circle
                cx={toLossCoords(history[history.length - 1].epoch, history[history.length - 1].val_loss).split(',')[0]}
                cy={toLossCoords(history[history.length - 1].epoch, history[history.length - 1].val_loss).split(',')[1]}
                r="4"
                fill="#d97706"
              />
            </>
          )}

          <text x={pad + graphW / 2} y={height - 6} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="500">Epoch</text>
          <text x={pad} y={height - pad + 14} textAnchor="middle" fill="#64748b" fontSize="9">1</text>
          <text x={pad + graphW} y={height - pad + 14} textAnchor="middle" fill="#64748b" fontSize="9">{maxEpoch}</text>
          <text x={pad - 6} y={pad + 4} textAnchor="end" fill="#64748b" fontSize="9">{maxLoss.toFixed(2)}</text>
          <text x={pad - 6} y={pad + graphH} textAnchor="end" fill="#64748b" fontSize="9">0.0</text>
        </svg>
      </div>
    </div>
  )
}
