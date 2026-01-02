import React from 'react'

type Props = {
  specs?: Record<string, string> | null
}

export default function ProductSpecs({ specs }: Props) {
  const empty = !specs || Object.keys(specs).length === 0

  return (
    <div style={{ marginTop: 18 }}>
      <h3 style={{ margin: '0 0 8px 0' }}>Specifications</h3>
      {empty ? (
        <div style={{ fontStyle: 'italic', color: '#444' }}>Specs TBD</div>
      ) : (
        <ul style={{ paddingLeft: 16 }}>
          {Object.entries(specs!).map(([k, v]) => (
            <li key={k}><strong>{k}:</strong> {v}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
