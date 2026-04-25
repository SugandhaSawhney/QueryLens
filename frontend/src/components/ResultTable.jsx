import React, { useState } from 'react'
import { ArrowUpDown, Download, ArrowUp, ArrowDown } from 'lucide-react'

export default function ResultTable({ result }) {
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  if (!result || !result.columns || result.columns.length === 0) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        color: 'var(--text3)',
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        fontSize: '0.85rem',
      }}>
        No results returned for this query.
      </div>
    )
  }

  const { columns, rows } = result

  const sortedRows = [...rows].sort((a, b) => {
    if (sortCol === null) return 0
    const i = columns.indexOf(sortCol)
    const av = a[i], bv = b[i]
    if (av == null) return 1
    if (bv == null) return -1
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const downloadCSV = () => {
    const lines = [columns.join(','), ...sortedRows.map(r => r.map(v => `"${v ?? ''}"`).join(','))]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'querylens_result.csv'
    a.click()
  }

  const isNum = (val) => val !== null && val !== '' && !isNaN(parseFloat(val))

  return (
    <div className="fade-up" style={{
      background: 'rgba(0,0,0,0.2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      backdropFilter: 'blur(10px)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '9px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Results
          </span>
          <span style={{
            background: 'rgba(0,212,255,0.1)',
            color: 'var(--accent)',
            padding: '1px 8px',
            borderRadius: 10,
            fontSize: '0.68rem',
            fontFamily: 'var(--mono)',
            border: '1px solid rgba(0,212,255,0.2)',
          }}>{result.count} rows</span>
        </div>
        <button
          onClick={downloadCSV}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', fontSize: '0.7rem',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            color: 'var(--text3)',
            fontFamily: 'var(--font)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)' }}
        >
          <Download size={11} /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', maxHeight: 380, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 5 }}>
              {columns.map(col => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  style={{
                    padding: '9px 14px',
                    textAlign: 'left',
                    fontSize: '0.68rem',
                    fontFamily: 'var(--mono)',
                    fontWeight: 500,
                    color: sortCol === col ? 'var(--accent)' : 'var(--text3)',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    transition: 'color 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {col}
                    {sortCol === col
                      ? sortDir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                      : <ArrowUpDown size={9} style={{ opacity: 0.25 }} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, ri) => (
              <tr
                key={ri}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.82rem',
                      color: cell == null ? 'var(--text3)' : isNum(cell) ? 'var(--accent)' : 'var(--text)',
                      fontFamily: isNum(cell) ? 'var(--mono)' : 'var(--font)',
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontStyle: cell == null ? 'italic' : 'normal',
                    }}
                    title={String(cell ?? '')}
                  >
                    {cell == null ? 'null' : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}