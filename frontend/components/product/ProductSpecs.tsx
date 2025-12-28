import React from 'react'

type Props = {
  specs: Record<string, string>
}

export default function ProductSpecs({ specs }: Props) {
  return (
    <div style={{ marginTop: 18 }}>
      <h3 style={{ margin: '0 0 8px 0' }}>Specifications</h3>
      <ul style={{ paddingLeft: 16 }}>
        {Object.entries(specs).map(([k, v]) => (
          <li key={k}><strong>{k}:</strong> {v}</li>
        ))}
      </ul>
    </div>
  )
}
