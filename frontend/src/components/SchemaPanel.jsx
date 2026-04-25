import React, { useState } from 'react'
import { Database, ChevronDown, ChevronRight, Trash2, Upload, Table } from 'lucide-react'

export default function SchemaPanel({ schema, onUpload, uploading, onDelete }) {
  const [expanded, setExpanded] = useState({})
  const [dragging, setDragging] = useState(false)
  const tables = Object.keys(schema)

  const toggle = (t) => setExpanded(p => ({ ...p, [t]: !p[t] }))

  const handleFile = (file) => {
    if (file && file.name.endsWith('.csv')) onUpload(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const typeColor = (type) => {
    const t = (type || '').toUpperCase()
    if (t.includes('INT') || t.includes('REAL') || t.includes('FLOAT') || t.includes('NUM'))
      return 'var(--accent)'
    if (t.includes('TEXT') || t.includes('CHAR') || t.includes('VAR'))
      return 'var(--green)'
    return 'var(--amber)'
  }

  return (
    <aside style={{
      width: 255,
      minWidth: 255,
      background: 'rgba(7,13,26,0.6)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 1,
    }}>
      {/* Upload Zone */}
      <div style={{ padding: '0.9rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          fontSize: '0.62rem',
          fontFamily: 'var(--mono)',
          color: 'var(--text3)',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>Data Source</div>

        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: '16px 12px',
            border: `1px dashed ${dragging ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: dragging ? 'rgba(0,212,255,0.05)' : 'var(--surface)',
            boxShadow: dragging ? 'var(--shadow-accent)' : 'none',
          }}
        >
          <div style={{
            width: 36, height: 36,
            background: dragging ? 'rgba(0,212,255,0.15)' : 'var(--surface2)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${dragging ? 'var(--accent)' : 'var(--border)'}`,
            transition: 'all 0.2s',
          }}>
            <Upload size={15} color={dragging ? 'var(--accent)' : 'var(--text3)'} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.78rem', color: uploading ? 'var(--accent)' : 'var(--text2)', fontWeight: 500 }}>
              {uploading ? 'Importing...' : 'Upload CSV'}
            </div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text3)', marginTop: 2 }}>
              drag & drop or click
            </div>
          </div>
          <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </label>
      </div>

      {/* Tables */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.7rem' }}>
        {tables.length === 0 ? (
          <div style={{
            padding: '2.5rem 1rem',
            textAlign: 'center',
            color: 'var(--text3)',
            fontSize: '0.78rem',
            lineHeight: 1.8,
          }}>
            <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.3 }}>🗄️</div>
            No tables yet.<br />Upload a CSV to begin.
          </div>
        ) : (
          <>
            <div style={{
              fontSize: '0.62rem',
              fontFamily: 'var(--mono)',
              color: 'var(--text3)',
              marginBottom: 8,
              padding: '0 4px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>Tables</span>
              <span style={{
                background: 'rgba(0,212,255,0.1)',
                color: 'var(--accent)',
                padding: '1px 6px',
                borderRadius: 10,
                fontSize: '0.6rem',
              }}>{tables.length}</span>
            </div>

            {tables.map(table => (
              <div key={table} style={{ marginBottom: 3 }}>
                <div
                  onClick={() => toggle(table)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 8px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: expanded[table] ? 'rgba(0,212,255,0.06)' : 'transparent',
                    border: `1px solid ${expanded[table] ? 'rgba(0,212,255,0.15)' : 'transparent'}`,
                    transition: 'all 0.15s',
                    userSelect: 'none',
                  }}
                  onMouseEnter={e => { if (!expanded[table]) e.currentTarget.style.background = 'var(--surface2)' }}
                  onMouseLeave={e => { if (!expanded[table]) e.currentTarget.style.background = 'transparent' }}
                >
                  {expanded[table]
                    ? <ChevronDown size={12} color="var(--accent)" />
                    : <ChevronRight size={12} color="var(--text3)" />}
                  <Table size={12} color={expanded[table] ? 'var(--accent)' : 'var(--text3)'} />
                  <span style={{
                    flex: 1,
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: expanded[table] ? 'var(--text)' : 'var(--text2)',
                  }}>{table}</span>
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(table) }}
                    style={{
                      background: 'none', border: 'none', padding: 3,
                      color: 'var(--red)', borderRadius: 4,
                      display: 'flex', opacity: 0,
                      transition: 'opacity 0.15s',
                    }}
                    className="delete-btn"
                    title="Delete table"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>

                {expanded[table] && (
                  <div style={{
                    margin: '2px 0 4px 12px',
                    borderLeft: '1px solid rgba(0,212,255,0.15)',
                    paddingLeft: 10,
                  }}>
                    {schema[table].map(col => (
                      <div key={col.name} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '3px 4px',
                        fontSize: '0.72rem',
                        borderRadius: 4,
                      }}>
                        <span style={{ color: 'var(--text2)', fontFamily: 'var(--mono)', fontSize: '0.7rem' }}>
                          {col.name}
                        </span>
                        <span style={{
                          color: typeColor(col.type),
                          fontFamily: 'var(--mono)',
                          fontSize: '0.62rem',
                          background: 'var(--surface2)',
                          padding: '1px 5px',
                          borderRadius: 4,
                        }}>
                          {(col.type || 'TEXT').toLowerCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      <style>{`
        div:hover .delete-btn { opacity: 0.5 !important; }
        .delete-btn:hover { opacity: 1 !important; color: var(--red); }
      `}</style>
    </aside>
  )
}