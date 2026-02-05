import React from 'react'
import styles from './ProductSpecs.module.css'
import Paper from '@mui/material/node/Paper/index.js'
import Typography from '@mui/material/node/Typography/index.js'
import Table from '@mui/material/node/Table/index.js'
import TableBody from '@mui/material/node/TableBody/index.js'
import TableCell from '@mui/material/node/TableCell/index.js'
import TableContainer from '@mui/material/node/TableContainer/index.js'
import TableHead from '@mui/material/node/TableHead/index.js'
import TableRow from '@mui/material/node/TableRow/index.js'

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
        {renderSpecTable(t, boldCutoffTerms, useHeuristics)}
      </div>
    ))
  }

  // In product specs context, we generally treat all rows as body rows to avoid 
  // misinterpreting the first key-value pair as a table header.
  const header = null; // Forces all content to be rendered in TableBody
  const rows = table;

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

  let finalRows = processedRows
  let isKeyValLayout = isKeyValue

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

    // In the old code, cutoff was used to change styling.
    // Here we can use it to maybe add a section header or just style accordingly.
    // For simplicity in MUI, let's treat them all as key-value rows, effectively ignoring complex cutoff for visual split unless necessary.
    // If cutoff is -1, it means all rows are key-value "safe".
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
      <Table size="small" aria-label="product specifications">
        {header && header.length > 0 && (
          <TableHead>
            <TableRow>
              {header.map((h: any, i: number) => (
                <TableCell key={i} sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {finalRows.map((row: any, rowIndex: number) => {
             // Handle array rows (standard) or simple value rows
             const cells = Array.isArray(row) ? row : [row]
             // Identify if it's strictly key-value for styling first column bold
             const isKV = isKeyValLayout && cells.length === 2

             return (
              <TableRow key={rowIndex} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                {cells.map((cell: any, cellIndex: number) => {
                  const isLabel = isKV && cellIndex === 0
                  return (
                    <TableCell
                      key={cellIndex}
                      component={isLabel ? "th" : "td"}
                      scope={isLabel ? "row" : undefined}
                      sx={isLabel ? { fontWeight: 'bold', width: '30%', backgroundColor: '#fafafa' } : {}}
                    >
                      {cell}
                    </TableCell>
                  )
                })}
              </TableRow>
             )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default function ProductSpecs({ specs, specTables, specFields, boldCutoffTerms, useHeuristics }: Props) {
  const hasSpecs = !!specs && Object.keys(specs).length > 0
  const hasTables = !!specTables
  
  if (!hasSpecs && !hasTables) {
    return (
      <div className={styles.container}>
        <h3 className={styles.heading}>Specifications</h3>
        <div className={styles.empty}>Specs TBD</div>
      </div>
    )
  }

  return (
    <Paper className={styles.container} elevation={0}>
      <Typography variant="h5" className={styles.heading} sx={{ mb: 2 }}>Specifications</Typography>

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
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableBody>
                {processed.map(([k, v]) => (
                  <TableRow key={k} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', width: '30%', backgroundColor: '#fafafa' }}>
                      {k}
                    </TableCell>
                    <TableCell>{v}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      })()}

      {hasTables && (
        <div className={styles.tables}>
          {Array.isArray(specTables) ? renderSpecTable(specTables, boldCutoffTerms, useHeuristics ?? true) : renderSpecTable([specTables], boldCutoffTerms, useHeuristics ?? true)}
        </div>
      )}
    </Paper>
  )
}
