import { useState, useCallback } from 'react'

const API = '/api'

export function useQuery() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [sql, setSql] = useState('')
  const [schema, setSchema] = useState({})
  const [uploading, setUploading] = useState(false)
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ql_history') || '[]')
    } catch { return [] }
  })

  const saveToHistory = useCallback((question, sqlQuery) => {
    const entry = {
      id: Date.now(),
      question,
      sql: sqlQuery,
      ts: new Date().toLocaleTimeString(),
    }
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, 10)
      localStorage.setItem('ql_history', JSON.stringify(next))
      return next
    })
  }, [])

  const fetchSchema = useCallback(async () => {
    try {
      const res = await fetch(`${API}/schema`)
      const data = await res.json()
      setSchema(data.schema || {})
    } catch {}
  }, [])

  const uploadCSV = useCallback(async (file) => {
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API}/upload`, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Upload failed')
      setSchema(data.schema || {})
      return data
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  const runQuery = useCallback(async (question) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setSql('')
    try {
      const res = await fetch(`${API}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Query failed')
      setSql(data.sql)
      setResult(data.result)
      saveToHistory(question, data.sql)
      return data
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [saveToHistory])

  const runRawSQL = useCallback(async (rawSql) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`${API}/query/raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: rawSql }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Query failed')
      setSql(data.sql)
      setResult(data.result)
      return data
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteTable = useCallback(async (tableName) => {
    try {
      await fetch(`${API}/table/${tableName}`, { method: 'DELETE' })
      await fetchSchema()
    } catch {}
  }, [fetchSchema])

  return {
    loading, error, result, sql, schema,
    uploading, history,
    uploadCSV, runQuery, runRawSQL, fetchSchema, deleteTable,
  }
}