import React, { useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const COLORS = ['#00d4ff', '#00ffaa', '#ffb444', '#ff5577', '#a78bfa', '#38bdf8', '#fb923c']

function inferChartType(columns, rows) {
  if (!columns || columns.length < 2 || !rows || rows.length === 0) return 'none'
  const isNum = (col) => {
    const idx = columns.indexOf(col)
    return rows.slice(0, 5).every(r => !isNaN(parseFloat(r[idx])) && r[idx] !== '')
  }
  const hasTime = columns.some(c => /date|time|year|month|day|week/i.test(c))
  if (hasTime) return 'line'
  const numCols = columns.filter(isNum)
  const catCols = columns.filter(c => !isNum(c))
  if (catCols.length >= 1 && numCols.length >= 1) {
    return rows.length <= 7 ? 'pie' : 'bar'
  }
  if (numCols.length >= 2) return 'line'
  return 'bar'
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{
      background: 'rgba(4,7,15,0.95)',
      border: '1px solid rgba(0,212,255,0.25)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: '0.78rem',
      fontFamily: 'var(--mono)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(20px)',
    }}>
      {label && <div style={{ color: 'var(--text3)', marginBottom: 6, fontSize: '0.72rem' }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: 'var(--text2)' }}>{p.name}:</span>
          <span style={{ fontWeight: 500 }}>
            {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function ChartView({ result }) {
  const { columns, rows } = result || {}
  const chartType = useMemo(() => inferChartType(columns, rows), [columns, rows])

  const data = useMemo(() => {
    if (!columns || !rows) return []
    return rows.map(row => {
      const obj = {}
      columns.forEach((col, i) => {
        const val = row[i]
        obj[col] = isNaN(parseFloat(val)) ? val : parseFloat(val)
      })
      return obj
    })
  }, [columns, rows])

  if (chartType === 'none' || data.length === 0) return null

  const numCols = columns.filter(c => data.slice(0, 5).every(d => typeof d[c] === 'number'))
  const catCols = columns.filter(c => !numCols.includes(c))
  const xKey = catCols[0] || columns[0]
  const yKeys = numCols.length ? numCols : columns.slice(1)

  const wrap = (label, children) => (
    <div className="fade-up" style={{
      background: 'rgba(0,0,0,0.25)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '1rem 1rem 0.5rem',
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{
        fontSize: '0.62rem',
        fontFamily: 'var(--mono)',
        color: 'var(--text3)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: 14,
      }}>{label}</div>
      {children}
    </div>
  )

  const axisStyle = { fontSize: 10, fill: 'rgba(255,255,255,0.25)', fontFamily: 'Fira Code, monospace' }

  if (chartType === 'bar') return wrap('Bar Chart', (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,212,255,0.05)' }} />
        {yKeys.map((k, i) => (
          <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]}
            radius={[4, 4, 0, 0]}
            style={{ filter: `drop-shadow(0 0 6px ${COLORS[i % COLORS.length]}40)` }}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  ))

  if (chartType === 'line') return wrap('Line Chart', (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        {yKeys.map((k, i) => (
          <Line key={k} type="monotone" dataKey={k}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3, fill: COLORS[i % COLORS.length], strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  ))

  if (chartType === 'pie') {
    const pieKey = yKeys[0]
    return wrap('Pie Chart', (
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey={pieKey} nameKey={xKey}
            cx="50%" cy="50%" outerRadius={90} innerRadius={40}
            paddingAngle={3}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]}
                style={{ filter: `drop-shadow(0 0 8px ${COLORS[i % COLORS.length]}60)` }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    ))
  }

  return null
}