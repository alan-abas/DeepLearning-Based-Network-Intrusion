import React from 'react'
import { ShieldCheck, Activity, Cpu, BarChart3 } from 'lucide-react'

interface NavbarProps {
  activeTab: 'predict' | 'results'
  setActiveTab: (tab: 'predict' | 'results') => void
  backendHealthy: boolean
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, backendHealthy }) => {
  return (
    <header className="glass-panel" style={{ margin: '16px 24px', padding: '14px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Logo and Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
          }}>
            <ShieldCheck size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
                DL-NIDS
              </h1>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '9999px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1d4ed8',
                fontWeight: 600
              }}>
                CICIDS2017
              </span>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '9999px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                fontWeight: 600
              }}>
                Binary: 0=BENIGN, 1=ATTACK
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Explainable Deep Learning Network Intrusion Detection System
            </p>
          </div>
        </div>

        {/* 2 Pages Navigation Tabs */}
        <nav style={{
          display: 'flex',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0'
        }}>
          <button
            onClick={() => setActiveTab('predict')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.15s ease',
              background: activeTab === 'predict' ? '#ffffff' : 'transparent',
              color: activeTab === 'predict' ? '#2563eb' : '#64748b',
              boxShadow: activeTab === 'predict' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none'
            }}
          >
            <Cpu size={16} />
            Predict one record
          </button>

          <button
            onClick={() => setActiveTab('results')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.15s ease',
              background: activeTab === 'results' ? '#ffffff' : 'transparent',
              color: activeTab === 'results' ? '#2563eb' : '#64748b',
              boxShadow: activeTab === 'results' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none'
            }}
          >
            <BarChart3 size={16} />
            Model results
          </button>
        </nav>

        {/* Backend Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
          <Activity size={14} color={backendHealthy ? '#16a34a' : '#dc2626'} />
          <span>API: {backendHealthy ? 'Connected (PyTorch + Scikit-Learn)' : 'Connecting...'}</span>
        </div>

      </div>
    </header>
  )
}
