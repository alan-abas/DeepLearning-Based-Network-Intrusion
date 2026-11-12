import { useState, useEffect } from 'react'
import { Navbar } from './components/Navbar'
import { PredictPage } from './pages/PredictPage'
import { ModelResultsPage } from './pages/ModelResultsPage'
import { checkHealth } from './services/api'

export function App() {
  const [activeTab, setActiveTab] = useState<'predict' | 'results'>('predict')
  const [backendHealthy, setBackendHealthy] = useState(false)

  useEffect(() => {
    async function ping() {
      try {
        const res = await checkHealth()
        if (res.status === 'healthy') {
          setBackendHealthy(true)
        }
      } catch (err) {
        console.warn('Backend not responding yet:', err)
        setBackendHealthy(false)
      }
    }
    ping()
    const timer = setInterval(ping, 8000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendHealthy={backendHealthy}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'predict' && <PredictPage />}
        {activeTab === 'results' && <ModelResultsPage />}
      </main>

      <footer style={{
        borderTop: '1px solid #e2e8f0',
        padding: '20px 24px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#64748b',
        background: '#ffffff'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>Explainable Deep Learning NIDS • CICIDS2017 Benchmark • Binary Classification (0=BENIGN, 1=ATTACK)</span>
          <span>Powered by PyTorch, Scikit-Learn, FastAPI, React & SHAP</span>
        </div>
      </footer>
    </div>
  )
}

export default App
