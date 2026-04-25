import React, { useState } from 'react'
import { Copy, Check, Terminal, Play } from 'lucide-react'

export default function SQLPreview({ sql, onRunRaw }) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editedSql, setEditedSql] = useState(sql)

  const copy = () => {
    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!sql) return null

  const highlighted = sql
    .replace(/\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|JOIN|LEFT|RIGHT|INNER|ON|AS|LIMIT|DISTINCT|COUNT|SUM|AVG|MAX|MIN|AND|OR|NOT|IN|LIKE|IS|NULL|BY)\b/g,
      '<span style="color:var(--accent);font-weight:500">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:var(--amber)">$1</span>')
    .replace(/'([^']*)'/g, '<span style="color:var(--green)">\'$1\'</span>')

  return (
    <div className="fade-up" style={{
      background: 'rgba(0,0,0,0.3)',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Terminal size={13} color="var(--accent)" />
          <span style={{
            fontSize: '0.68rem',
            fontFamily: 'var(--mono)',
            color: 'var(--text3)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>Generated SQL</span>
        </div>

        <div style={{ display: 'flex', gap: 5 }}>
          <button
            onClick={() => { setEditing(!editing); setEditedSql(sql) }}
            style={{
              padding: '3px 10px', fontSize: '0.7rem',
              background: editing ? 'rgba(0,212,255,0.1)' : 'var(--surface2)',
              border: `1px solid ${editing ? 'rgba(0,212,255,0.3)' : 'var(--border)'}`,
              borderRadius: 6,
              color: editing ? 'var(--accent)' : 'var(--text3)',
              fontFamily: 'var(--font)',
            }}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
          {editing && (
            <button
              onClick={() => { onRunRaw(editedSql); setEditing(false) }}
              style={{
                padding: '3px 10px', fontSize: '0.7rem',
                background: 'linear-gradient(135deg, var(--accent), #0077aa)',
                border: 'none', borderRadius: 6,
                color: '#000', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4,
                fontFamily: 'var(--font)',
              }}>
              <Play size={10} /> Run
            </button>
          )}
          <button
            onClick={copy}
            style={{
              padding: '3px 10px', fontSize: '0.7rem',
              background: copied ? 'rgba(0,255,170,0.1)' : 'var(--surface2)',
              border: `1px solid ${copied ? 'rgba(0,255,170,0.3)' : 'var(--border)'}`,
              borderRadius: 6,
              color: copied ? 'var(--green)' : 'var(--text3)',
              display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: 'var(--font)',
            }}>
            {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
          </button>
        </div>
      </div>

      {editing ? (
        <textarea
          value={editedSql}
          onChange={e => setEditedSql(e.target.value)}
          style={{
            width: '100%', padding: '1rem',
            background: 'rgba(0,0,0,0.3)',
            border: 'none', outline: 'none',
            fontFamily: 'var(--mono)',
            fontSize: '0.82rem',
            color: 'var(--text)',
            resize: 'vertical',
            minHeight: 80,
            lineHeight: 1.7,
          }}
        />
      ) : (
        <pre
          style={{
            padding: '1rem',
            fontFamily: 'var(--mono)',
            fontSize: '0.8rem',
            overflowX: 'auto',
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: 'var(--text2)',
          }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      )}
    </div>
  )
}