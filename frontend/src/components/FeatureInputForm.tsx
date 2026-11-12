import React, { useState } from 'react'
import { Search, ChevronDown, ChevronRight, Sliders } from 'lucide-react'
import { FeatureStats } from '../types/api'

interface FeatureInputFormProps {
  features: Record<string, number>
  stats: Record<string, FeatureStats>
  onChange: (featureName: string, value: number) => void
}

interface FeatureGroup {
  id: string
  title: string
  icon: string
  pattern: RegExp
}

const GROUPS: FeatureGroup[] = [
  {
    id: 'flags',
    title: 'TCP Flags & Headers',
    icon: '🚩',
    pattern: /Flag|Header|Down\/Up/i
  },
  {
    id: 'iat',
    title: 'Inter-Arrival Times (IAT)',
    icon: '⏱️',
    pattern: /IAT/i
  },
  {
    id: 'packet_length',
    title: 'Packet Length Statistics',
    icon: '📊',
    pattern: /Packet Length|Segment Size|Average Packet/i
  },
  {
    id: 'subflows_windows',
    title: 'Subflows & Window Sizes',
    icon: '📦',
    pattern: /Subflow|Init_Win|act_data|min_seg/i
  },
  {
    id: 'active_idle',
    title: 'Active & Idle Statistics',
    icon: '💤',
    pattern: /Active|Idle/i
  },
  {
    id: 'flow_basics',
    title: 'Flow Basics & Packet Counts',
    icon: '🌐',
    pattern: /.*/ // Catch-all for remaining
  }
]

export const FeatureInputForm: React.FC<FeatureInputFormProps> = ({
  features,
  stats,
  onChange
}) => {
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    active_idle: true,
    subflows_windows: true
  })

  const toggleGroup = (id: string) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Categorize features
  const allFeatureKeys = Object.keys(features)
  const assigned = new Set<string>()
  const categorized: Record<string, string[]> = {}

  GROUPS.forEach(g => {
    categorized[g.id] = []
  })

  // First 5 specific groups
  for (let i = 0; i < GROUPS.length - 1; i++) {
    const g = GROUPS[i]
    allFeatureKeys.forEach(key => {
      if (!assigned.has(key) && g.pattern.test(key)) {
        categorized[g.id].push(key)
        assigned.add(key)
      }
    })
  }

  // Remaining into flow_basics
  allFeatureKeys.forEach(key => {
    if (!assigned.has(key)) {
      categorized['flow_basics'].push(key)
      assigned.add(key)
    }
  })

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="#2563eb" />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
            Flow Input Vector ({allFeatureKeys.length} CICIDS2017 Statistical Metrics)
          </h3>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', width: '220px' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search features..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 30px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#0f172a',
              outline: 'none'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {GROUPS.map((group) => {
          let groupKeys = categorized[group.id] || []
          if (search.trim()) {
            groupKeys = groupKeys.filter(k => k.toLowerCase().includes(search.toLowerCase()))
          }
          if (groupKeys.length === 0) return null

          const isCollapsed = collapsed[group.id] && !search.trim()

          return (
            <div
              key={group.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: '#ffffff',
                overflow: 'hidden'
              }}
            >
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#1e293b',
                  fontSize: '13px',
                  fontWeight: 600,
                  textAlign: 'left'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{group.icon}</span>
                  <span>{group.title}</span>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 400 }}>
                    ({groupKeys.length} metrics)
                  </span>
                </span>
                {isCollapsed ? <ChevronRight size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
              </button>

              {!isCollapsed && (
                <div style={{
                  padding: '14px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                  gap: '12px'
                }}>
                  {groupKeys.map((key) => {
                    const val = features[key] ?? 0
                    const stat = stats[key]

                    return (
                      <div
                        key={key}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          background: '#ffffff',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label
                            title={key}
                            style={{
                              fontSize: '11px',
                              color: '#475569',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '170px'
                            }}
                          >
                            {key}
                          </label>
                        </div>

                        <input
                          type="number"
                          step="any"
                          value={val}
                          onChange={(e) => {
                            const num = parseFloat(e.target.value)
                            onChange(key, isNaN(num) ? 0 : num)
                          }}
                          style={{
                            width: '100%',
                            padding: '4px 8px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            color: '#0f172a',
                            fontSize: '12px',
                            outline: 'none'
                          }}
                          className="mono"
                        />

                        {stat && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                            <span>min: {stat.min.toFixed(0)}</span>
                            <span>mean: {stat.mean.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
