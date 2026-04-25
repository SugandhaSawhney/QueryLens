import React, { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import SchemaPanel from './components/SchemaPanel.jsx'
import QueryBox from './components/QueryBox.jsx'
import SQLPreview from './components/SQLPreview.jsx'
import ResultTable from './components/ResultTable.jsx'
import ChartView from './components/ChartView.jsx'
import { useQuery } from './hooks/useQuery.js'
import { AlertCircle, BarChart2, Table2, Layers, Database } from 'lucide-react'

export default function App() {
  const {
    loading, error, result, sql, schema, uploading, history,
    uploadCSV, runQuery, runRawSQL, fetchSchema, deleteTable,
  } = useQuery()

  const [activeTab, setActiveTab] = useState('table')
  const hasData = Object.keys(schema).length > 0

  useEffect(() => { fetchSchema() }, [fetchSchema])
  useEffect(() => { if (result) setActiveTab('table') }, [result])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
      <Header />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <SchemaPanel
          schema={schema}
          onUpload={uploadCSV}
          uploading={uploading}
          onDelete={deleteTable}
        />

        {/* Main */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          position: 'relative',
        }}>

          {/* Empty state */}
          {!hasData && !result && !loading && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2rem',
              padding: '4rem 2rem',
              textAlign: 'center',
              animation: 'fadeUp 0.6s ease forwards',
            }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 80, height: 80,
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,255,170,0.1))',
                  border: '1px solid rgba(0,212,255,0.2)',
                  borderRadius: 24,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36,
                  boxShadow: '0 0 40px rgba(0,212,255,0.15)',
                }}>⬡</div>
                <div style={{
                  position: 'absolute', inset: -1,
                  borderRadius: 25,
                  border: '1px solid rgba(0,212,255,0.15)',
                  animation: 'borderGlow 3s infinite',
                }} />
              </div>

              <div>
                <h1 style={{
                  fontWeight: 800,
                  fontSize: '2.2rem',
                  letterSpacing: '-0.04em',
                  marginBottom: 10,
                  lineHeight: 1.1,
                }}>
                  Ask your data<br />
                  <span style={{ color: 'var(--accent)', textShadow: '0 0 30px rgba(0,212,255,0.4)' }}>
                    anything
                  </span>
                </h1>
                <p style={{ color: 'var(--text3)', fontSize: '0.9rem', maxWidth: 380, margin: '0 auto', lineHeight: 1.7 }}>
                  Upload a CSV, type a plain English question, and QueryLens converts it to SQL instantly.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {[
                  { icon: '📁', label: 'Upload CSV', desc: 'Any CSV file' },
                  { icon: '💬', label: 'Ask naturally', desc: 'Plain English' },
                  { icon: '⚡', label: 'Instant results', desc: 'Charts + table' },
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: '1rem 1.25rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    minWidth: 130,
                    animation: `fadeUp 0.5s ${i * 0.1 + 0.2}s ease both`,
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Query box */}
          <div>
            <QueryBox
              onQuery={runQuery}
              loading={loading}
              disabled={!hasData}
              history={history}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="fade-up" style={{
              display: 'flex', gap: 10,
              padding: '12px 16px',
              background: 'rgba(255,85,119,0.07)',
              border: '1px solid rgba(255,85,119,0.2)',
              borderRadius: 'var(--radius)',
              color: 'var(--red)',
              fontSize: '0.83rem',
              lineHeight: 1.6,
            }}>
              <AlertCircle size={15} style={{ marginTop: 2, flexShrink: 0 }} />
              <div><strong>Error: </strong>{error}</div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>Generating SQL...</span>
              </div>
              {[70, 50, 85].map((w, i) => (
                <div key={i} className="shimmer" style={{
                  height: i === 0 ? 52 : 36,
                  borderRadius: 8,
                  width: `${w}%`,
                }} />
              ))}
            </div>
          )}

          {/* Results */}
          {sql && !loading && (
            <SQLPreview sql={sql} onRunRaw={runRawSQL} />
          )}

          {result && !loading && (
            <div className="fade-up">
              {/* Tab bar */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {[
                  { id: 'table', icon: <Table2 size={12} />, label: 'Table' },
                  { id: 'chart', icon: <BarChart2 size={12} />, label: 'Chart' },
                  { id: 'both', icon: <Layers size={12} />, label: 'Both' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 12px',
                      fontSize: '0.72rem',
                      background: activeTab === tab.id ? 'rgba(0,212,255,0.08)' : 'transparent',
                      border: `1px solid ${activeTab === tab.id ? 'rgba(0,212,255,0.25)' : 'var(--border)'}`,
                      borderRadius: 6,
                      color: activeTab === tab.id ? 'var(--accent)' : 'var(--text3)',
                      fontFamily: 'var(--font)',
                      transition: 'all 0.15s',
                      fontWeight: activeTab === tab.id ? 600 : 400,
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {(activeTab === 'chart' || activeTab === 'both') && <ChartView result={result} />}
                {(activeTab === 'table' || activeTab === 'both') && <ResultTable result={result} />}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}