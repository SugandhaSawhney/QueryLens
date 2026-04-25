import React from 'react'

export default function Header() {
  return (
    <header style={{
      height: 58,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      borderBottom: '1px solid var(--border)',
      background: 'rgba(4,7,15,0.8)',
      backdropFilter: 'blur(20px)',
      position: 'relative',
      zIndex: 100,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30,
          background: 'linear-gradient(135deg, var(--accent), var(--green))',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14,
          boxShadow: '0 0 16px rgba(0,212,255,0.4)',
        }}>⬡</div>
        <div>
          <div style={{
            fontWeight: 800,
            fontSize: '1rem',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}>
            Query<span style={{ color: 'var(--accent)', textShadow: '0 0 12px rgba(0,212,255,0.5)' }}>Lens</span>
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 1 }}>
            Natural Language BI
          </div>
        </div>
      </div>

      {/* Center badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        background: 'rgba(0,212,255,0.05)',
        border: '1px solid rgba(0,212,255,0.15)',
        borderRadius: 20,
        fontSize: '0.72rem',
        color: 'var(--text2)',
        fontFamily: 'var(--mono)',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--green)',
          boxShadow: '0 0 8px var(--green)',
          display: 'inline-block',
          animation: 'pulse 2s infinite',
        }} />
        Groq · llama-3.1-8b · Live
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          padding: '4px 10px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          fontSize: '0.7rem',
          color: 'var(--text3)',
          fontFamily: 'var(--mono)',
        }}>
          NL → SQL
        </div>
      </div>
    </header>
  )
}