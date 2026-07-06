'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(timer.current)
    if (val.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`)
      const data = await res.json()
      setResults(data)
      setOpen(true)
      setLoading(false)
    }, 250)
  }

  function go(id: string) {
    setQuery('')
    setOpen(false)
    setResults([])
    router.push(`/clients/${id}`)
  }

  return (
    <div ref={ref} style={{ position: 'relative', margin: '8px 10px' }}>
      <div style={{ position: 'relative' }}>
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Rechercher un client..."
          style={{
            width: '100%', padding: '8px 10px 8px 30px',
            border: '1px solid #e8eef5', borderRadius: 8,
            fontSize: 12.5, background: '#f8fafd', color: '#0c0c14',
            fontFamily: 'inherit',
          }}
        />
        {loading && (
          <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, border: '2px solid #e8eef5', borderTopColor: '#1E466B', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#ffffff', border: '1px solid #e8eef5',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          zIndex: 100, overflow: 'hidden',
        }}>
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => go(r.id)}
              style={{
                width: '100%', padding: '10px 14px',
                background: 'none', border: 'none',
                borderBottom: '1px solid #f0f4f9',
                textAlign: 'left', cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 2,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0c0c14' }}>{r.label}</span>
              {r.sub && <span style={{ fontSize: 11.5, color: '#94a3b8' }}>{r.sub}</span>}
            </button>
          ))}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && !loading && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#ffffff', border: '1px solid #e8eef5',
          borderRadius: 10, padding: '12px 14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 100,
        }}>
          <span style={{ fontSize: 12.5, color: '#94a3b8' }}>Aucun résultat pour « {query} »</span>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  )
}
