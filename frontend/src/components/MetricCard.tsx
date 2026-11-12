import React from 'react'

interface MetricCardProps {
  label: string
  baselineVal: string | number
  annVal: string | number
  higherIsBetter?: boolean
  unit?: string
  description?: string
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  baselineVal,
  annVal,
  higherIsBetter = true,
  unit = '',
  description
}) => {
  const bNum = typeof baselineVal === 'number' ? baselineVal : parseFloat(baselineVal)
  const aNum = typeof annVal === 'number' ? annVal : parseFloat(annVal)
  
  const annWins = higherIsBetter ? aNum > bNum : aNum < bNum
  const baselineWins = higherIsBetter ? bNum > aNum : bNum < aNum

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        {description && (
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{description}</span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Baseline Model */}
        <div style={{
          background: baselineWins ? '#f8fafc' : '#ffffff',
          padding: '12px',
          borderRadius: '8px',
          border: baselineWins ? '1.5px solid #3b82f6' : '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: 500 }}>Random Forest</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: baselineWins ? '#2563eb' : '#0f172a' }} className="mono">
            {typeof baselineVal === 'number' ? baselineVal.toFixed(4) : baselineVal}{unit}
          </div>
        </div>

        {/* PyTorch ANN */}
        <div style={{
          background: annWins ? '#f0fdf4' : '#ffffff',
          padding: '12px',
          borderRadius: '8px',
          border: annWins ? '1.5px solid #16a34a' : '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: 500 }}>PyTorch ANN</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: annWins ? '#16a34a' : '#0f172a' }} className="mono">
            {typeof annVal === 'number' ? annVal.toFixed(4) : annVal}{unit}
          </div>
        </div>
      </div>
    </div>
  )
}
