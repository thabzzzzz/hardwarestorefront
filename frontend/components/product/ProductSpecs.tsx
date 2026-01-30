import React from 'react'
import styles from './ProductSpecs.module.css'

type Props = {
  specs?: Record<string, string> | null,
  specTables?: any | null,
  specFields?: Record<string, any> | null,
  boldCutoffTerms?: string[] | null,
  useHeuristics?: boolean | null,
}

function renderSpecTable(table: any, boldCutoffTerms?: string[] | null, useHeuristics: boolean = true) {
  // table is expected to be an array of rows (each row an array of cells)
  if (!Array.isArray(table) || table.length === 0) return null

  // If first element is itself an array of rows (multiple tables), render each
  if (Array.isArray(table[0]) && Array.isArray(table[0][0])) {
    return table.map((t: any, i: number) => (
      <div key={i} className={styles.tableWrapper}>
        {renderSpecTable(t)}
      </div>
    ))
  }

  const header = Array.isArray(table[0]) ? table[0] : null
  const rows = header ? table.slice(1) : table

  // make a working copy of rows and strip up to three leading bullet-like rows
  const processedRows = rows.slice()
  let removedBullets = 0
  const bulletRe = /^\s*([\u2022\-\*\u00B7])\s*/
  while (removedBullets < 3 && processedRows.length > 0) {
    const firstCell = Array.isArray(processedRows[0]) ? String(processedRows[0][0] ?? '') : String(processedRows[0] ?? '')
    if (firstCell && bulletRe.test(firstCell.trim())) {
      processedRows.shift()
      removedBullets += 1
      continue
    }
    break
  }

  // detect simple key/value rows (each row is array-like with 2 elements)
  const isKeyValue = processedRows.length > 0 && processedRows.every((r: any) => Array.isArray(r) && (r.length === 2 || r.length > 1))

  if (isKeyValue) {
    const terms = (boldCutoffTerms && boldCutoffTerms.length > 0)
      ? boldCutoffTerms.map((t: string) => String(t).trim().toLowerCase())
      : ['advanced technologies', 'package contents']

    // find cutoff index where first cell starts with any of the provided terms
    let cutoff = processedRows.findIndex((r: any) => {
      const first = String(r[0] ?? '').trim().toLowerCase()
      return terms.some((term: string) => first.startsWith(term))
    })

    // If no explicit term matched and heuristics are enabled, try heuristic rules
    if (cutoff === -1 && useHeuristics) {
      const heuristicTerms = ['products', 'price', 'rating', 'sold by', 'first listed', 'reviews', 'products', 'best seller', 'price']
      const isHeaderLike = (s: string) => {
        const low = String(s || '').toLowerCase()
        if (!low) return false
        if (low.length > 60) return true
        return heuristicTerms.some(ht => low.includes(ht))
      }

      cutoff = processedRows.findIndex((r: any, idx: number) => {
        const first = String(r[0] ?? '').trim()
        const second = String(r[1] ?? '').trim()
        // if second cell is empty or first cell looks header-like, treat as cutoff
        if (!second) return true
        if (isHeaderLike(first)) return true
        // if second cell contains 'Add to cart' or 'Currently viewing' it's a header area
        if (second.toLowerCase().includes('add to cart') || second.toLowerCase().includes('currently viewing')) return true
        return false
      })
    }

    if (cutoff === -1) cutoff = processedRows.length - 1

    return (
      <table className={styles.table}>
        <tbody>
          {processedRows.map((r: any, ri: number) => (
            <tr key={ri}>
              {ri <= cutoff ? (
                <>
                  <td className={styles.keyCell}>
                    <strong>{String(r[0]).trim()}:</strong>
                  </td>
                  <td className={styles.valueCell}>{r[1]}</td>
                </>
              ) : (
                <>
                  <td className={styles.keyCell}>{String(r[0]).trim()}</td>
                  <td className={styles.valueCell}>{r[1]}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <table className={styles.table}>
      {header && (
        <thead>
          <tr>
            {header.map((h: any, i: number) => <th key={i}>{h}</th>)}
          </tr>
        </thead>
      )}
      <tbody>
        {rows.map((r: any, ri: number) => (
          <tr key={ri}>
            {Array.isArray(r) ? r.map((c: any, ci: number) => <td key={ci}>{c}</td>) : <td>{r}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function ProductSpecs({ specs, specTables, specFields, boldCutoffTerms, useHeuristics }: Props) {
  const hasSpecs = !!specs && Object.keys(specs).length > 0
  const hasTables = !!specTables
  const hasFields = !!specFields && Object.keys(specFields).length > 0

  if (!hasSpecs && !hasTables && !hasFields) {
    return (
      <div className={styles.container}>
        <h3 className={styles.heading}>Specifications</h3>
        <div className={styles.empty}>Specs TBD</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Specifications</h3>

      {hasSpecs && (() => {
        const entries = Object.entries(specs!)
        const processed = entries.slice()
        const gpuKeys = ['memory', 'memory type', 'bus width', 'memory size', 'vram', 'vram gb']
        let removed = 0
        const bulletReLocal = /^\s*([\u2022\-\*\u00B7])\s*/
        while (removed < 3 && processed.length > 0) {
          const [k, v] = processed[0]
          const kLow = String(k ?? '').trim().toLowerCase()
          const vStr = String(v ?? '').trim()
          if (gpuKeys.includes(kLow) || bulletReLocal.test(kLow) || bulletReLocal.test(vStr)) {
            processed.shift()
            removed += 1
            continue
          }
          break
        }

        return (
          <ul className={styles.list}>
            {processed.map(([k, v]) => (
              <li key={k}><strong>{k}:</strong> {v}</li>
            ))}
          </ul>
        )
      })()}

      {hasTables && (
        <div className={styles.tables}>
          {Array.isArray(specTables) ? renderSpecTable(specTables, boldCutoffTerms, useHeuristics ?? true) : renderSpecTable([specTables], boldCutoffTerms, useHeuristics ?? true)}
        </div>
      )}

      {hasFields && (
        <div className={styles.rawFields}>
          <h4 className={styles.subHeading}>Raw fields</h4>
          <ul className={styles.list}>
            {Object.entries(specFields!).map(([k, v]) => (
              <li key={k}><strong>{k}:</strong> {typeof v === 'object' ? JSON.stringify(v) : String(v)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
