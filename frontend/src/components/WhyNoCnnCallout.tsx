import React from 'react'
import { AlertCircle } from 'lucide-react'

interface WhyNoCnnCalloutProps {
  justificationText?: string
}

export const WhyNoCnnCallout: React.FC<WhyNoCnnCalloutProps> = ({ justificationText }) => {
  const defaultParagraph = 
    "While One-Dimensional Convolutional Neural Networks (1D-CNNs) are widely successful in sequence processing " +
    "tasks (such as raw packet-level payload inspection, audio, or time-series waveforms), their mathematical inductive " +
    "bias relies fundamentally on local spatial or temporal translational invariance and neighborhood correlation between adjacent elements. " +
    "In contrast, the CICIDS2017 dataset is a purely tabular aggregation of statistical network flow summaries (such as packet lengths, " +
    "inter-arrival time distributions, and cumulative TCP flag counters) computed post-hoc at flow termination. " +
    "Applying a 1D convolution across these features imposes an arbitrary, artificial neighborhood relationship based entirely on " +
    "the accidental alphabetical or procedural ordering of CSV columns (e.g., convolving 'Flow Duration' with 'Total Fwd Packets' and 'Total Backward Packets'). " +
    "Because adjacent tabular columns lack spatial continuity, translation invariance, and uniform scaling, 1D convolutions introduce spurious receptive-field " +
    "artifacts rather than meaningful hierarchical abstractions. Fully connected Artificial Neural Networks (ANNs/MLPs) and tree ensembles treat tabular features " +
    "as permutation-invariant or learn cross-feature combinations globally, making them theoretically and empirically superior architectures for tabular intrusion detection."

  const paragraph = justificationText || defaultParagraph

  return (
    <div className="glass-panel" style={{
      padding: '24px',
      marginBottom: '28px',
      borderLeft: '4px solid #f59e0b',
      background: '#ffffff'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{
          padding: '10px',
          borderRadius: '10px',
          background: '#fef3c7',
          color: '#d97706',
          flexShrink: 0
        }}>
          <AlertCircle size={22} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Architectural Rationale: Why No 1D-CNN?
            </h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ fontSize: '11px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                1D-CNN Omitted
              </span>
              <span style={{ fontSize: '11px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                ANN (MLP) Adopted
              </span>
            </div>
          </div>

          <p style={{
            fontSize: '13.5px',
            lineHeight: '1.7',
            color: '#334155',
            textAlign: 'justify'
          }}>
            {paragraph}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '12px',
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid #f1f5f9',
            fontSize: '12px'
          }}>
            <div style={{ background: '#fef2f2', padding: '10px 12px', borderRadius: '6px', border: '1px solid #fee2e2', color: '#991b1b' }}>
              <strong>✕ 1D-CNN Flaw on Tabular Flows:</strong> Sliding a kernel across column indices assumes adjacent values share a continuous physical topology, which is invalid for tabular records.
            </div>
            <div style={{ background: '#f0fdf4', padding: '10px 12px', borderRadius: '6px', border: '1px solid #dcfce7', color: '#166534' }}>
              <strong>✓ PyTorch ANN Advantage:</strong> Dense linear transformations with batch normalization project the entire 69-dimensional feature space simultaneously into global interaction embeddings.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
