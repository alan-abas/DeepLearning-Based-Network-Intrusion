import React from 'react'
import { Sparkles } from 'lucide-react'

interface GlobalShapItem {
  feature: string
  importance: number
}

interface GlobalShapChartProps {
  importanceList?: GlobalShapItem[]
}

export const GlobalShapChart: React.FC<GlobalShapChartProps> = ({ importanceList = [] }) => {
  if (!importanceList || importanceList.length === 0) return null

  const maxVal = Math.max(...importanceList.map(item => item.importance), 0.001)

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#0284c7" />
            Global Feature Importance (Mean |SHAP Value| Across Test Traffic)
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            Top network statistical features with the highest decisive influence on intrusion vs benign detection.
          </p>
        </div>
        <span style={{ fontSize: '11px', background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
          SHAP Model-Agnostic Ranking
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 90px', fontSize: '11px', color: '#64748b', fontWeight: 600, paddingBottom: '4px' }}>
          <div>FLOW FEATURE</div>
          <div style={{ paddingLeft: '16px' }}>MEAN |SHAP| ATTRIBUTION DENSITY</div>
          <div style={{ textAlign: 'right' }}>SCORE</div>
        </div>

        {importanceList.slice(0, 10).map((item, idx) => {
          const barWidth = Math.max(5, (item.importance / maxVal) * 100)
          return (
            <div
              key={item.feature}
              style={{
                display: 'grid',
                gridTemplateColumns: '240px 1fr 90px',
                alignItems: 'center',
                background: '#f8fafc',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', width: '18px' }}>#{idx + 1}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.feature}
                </span>
              </div>

              <div style={{ padding: '0 16px' }}>
                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${barWidth}%`,
                      background: 'linear-gradient(90deg, #2563eb, #0284c7)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
              </div>

              <div style={{ textAlign: 'right', fontSize: '11.5px', fontWeight: 700, color: '#0284c7' }} className="mono">
                {item.importance.toFixed(4)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
