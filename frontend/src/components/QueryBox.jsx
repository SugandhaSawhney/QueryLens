import React, { useState, useRef } from 'react'
import { Send, Sparkles, Clock, X } from 'lucide-react'

const SUGGESTIONS = [
  'Show top 10 rows',
  'Count total records',
  'Show unique values in first column',
  'What is the average of numeric columns?',
]

export default function QueryBox({ onQuery, loading, disabled, history }) {
  const [question, setQuestion] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const textRef = useRef()

  const submit = () => {
    if (!question.trim() || loading || disabled) return
    onQuery(question.trim())
    setShowHistory(false)
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
    if (e.key === 'Escape') setShowHistory(false)
  }

  const pick = (q) => {
    setQuestion(q)
    setShowHistory(false)
    textRef.current?.focus()
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${!disabled && question ? 'rgba(0,212,255,0.3)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: !disabled && question ? '0 0 0 1px rgba(0,212,255,0.1), 0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(10px)',
      }}>
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '1rem 1rem 0' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 2,
            background: disabled ? 'var(--surface2)' : 'rgba(0,212,255,0.1)',
            border: `1px solid ${disabled ? 'var(--border)' : 'rgba(0,212,255,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={13} color={disabled ? 'var(--text3)' : 'var(--accent)'} />
          </div>

          <textarea
            ref={textRef}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={onKey}
            onFocus={() => setShowHistory(true)}
            placeholder={disabled
              ? '← Upload a CSV first to start querying...'
              : 'Ask anything about your data in plain English...'}
            disabled={disabled || loading}
            rows={2}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: disabled ? 'var(--text3)' : 'var(--text)',
              fontSize: '0.92rem',
              resize: 'none',
              lineHeight: 1.6,
              paddingBottom: '0.75rem',
            }}
          />
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 1rem',
          borderTop: '1px solid var(--border)',
          background: 'rgba(0,0,0,0.2)',
        }}>
          {/* Suggestions */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => pick(s)}
                disabled={disabled}
                style={{
                  padding: '3px 9px',
                  fontSize: '0.68rem',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  color: 'var(--text3)',
                  transition: 'all 0.15s',
                  fontFamily: 'var(--font)',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  if (!disabled) {
                    e.target.style.borderColor = 'rgba(0,212,255,0.3)'
                    e.target.style.color = 'var(--accent)'
                    e.target.style.background = 'rgba(0,212,255,0.05)'
                  }
                }}
                onMouseLeave={e => {
                  e.target.style.borderColor = 'var(--border)'
                  e.target.style.color = 'var(--text3)'
                  e.target.style.background = 'var(--surface2)'
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Run button */}
          <button
            onClick={submit}
            disabled={disabled || loading || !question.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 18px',
              background: disabled || !question.trim()
                ? 'var(--surface2)'
                : 'linear-gradient(135deg, var(--accent), #0077aa)',
              border: `1px solid ${disabled || !question.trim() ? 'var(--border)' : 'transparent'}`,
              borderRadius: 8,
              color: disabled || !question.trim() ? 'var(--text3)' : '#000',
              fontSize: '0.82rem',
              fontWeight: 700,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              letterSpacing: '0.01em',
              boxShadow: disabled || !question.trim() ? 'none' : '0 0 20px rgba(0,212,255,0.3)',
            }}
          >
            {loading
              ? <><span style={{ animation: 'pulse 1s infinite' }}>⬡</span> Running...</>
              : <><Send size={13} /> Run Query</>}
          </button>
        </div>
      </div>

      {/* History dropdown */}
      {showHistory && history.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0, right: 0,
          background: 'rgba(7,13,26,0.97)',
          border: '1px solid var(--border2)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          zIndex: 50,
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.68rem', color: 'var(--text3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <Clock size={10} /> Recent
            </div>
            <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', display: 'flex', padding: 2 }}>
              <X size={13} />
            </button>
          </div>
          {history.slice(0, 6).map(h => (
            <div
              key={h.id}
              onClick={() => pick(h.question)}
              style={{
                padding: '9px 14px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                color: 'var(--text2)',
                borderBottom: '1px solid var(--border)',
                transition: 'all 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.05)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)' }}
            >
              <div style={{ marginBottom: 2 }}>{h.question}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{h.ts}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}