'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

type Result = {
  total: number
  created: number
  vehicules: number
  alertes: number
  revisions: number
  errors: string[]
  debug?: { colonnes: string[]; exemple_montant: string | null; revisions_avec_montant: number }
}

const TABLES = [
  { key: 'clients', label: 'Clients (+ tout le reste en cascade)' },
  { key: 'vehicules', label: 'Véhicules' },
  { key: 'alertes', label: 'Alertes' },
  { key: 'revisions', label: 'Révisions' },
]

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [resetting, setResetting] = useState(false)
  const [resetMsg, setResetMsg] = useState('')
  const allSelected = selectedTables.length === TABLES.length

  function toggleTable(key: string) {
    setSelectedTables((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  async function handleReset() {
    if (selectedTables.length === 0) return
    const labels = selectedTables.map((k) => TABLES.find((t) => t.key === k)?.label ?? k).join(', ')
    if (!confirm(`Supprimer définitivement : ${labels} ?\n\nCette action est irréversible.`)) return

    setResetting(true)
    setResetMsg('')
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables: selectedTables }),
      })
      const data = await res.json()
      if (data.errors?.length > 0) {
        setResetMsg('Erreurs : ' + data.errors.join(', '))
      } else {
        setResetMsg('Données supprimées avec succès.')
        setSelectedTables([])
      }
    } catch {
      setResetMsg('Erreur lors de la réinitialisation.')
    } finally {
      setResetting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur'); return }
      setResult(data)
    } catch {
      setError('Erreur lors de l\'import.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 28 }}>
        <Link href="/clients" style={{ fontSize: 13, color: '#4a4a58', textDecoration: 'none', marginBottom: 12, display: 'inline-block' }}>← Clients</Link>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0c0c14', marginBottom: 4 }}>Import CSV</h1>
        <p style={{ fontSize: 13, color: '#8a8a9a' }}>Importez votre fichier clients-nourian-clean.csv pour peupler le CRM en un clic.</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e3eaf3', borderRadius: 12, padding: '28px 32px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#4a5568', background: '#f4f7fb', border: '1px solid #e3eaf3', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Format attendu (séparateur : point-virgule)</div>
          <div>Colonnes : Civilité, Nom, Prénom, Tél. Portable, Email, Immatriculation, Marque, Modèle, Date MEC, Date prochaine révision, Date du document, Montant TTC</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#0c0c14', marginBottom: 8 }}>
              Fichier CSV *
            </label>
            <div
              onClick={() => inputRef.current?.click()}
              style={{
                border: '2px dashed #e3eaf3', borderRadius: 10, padding: '28px 20px',
                textAlign: 'center', cursor: 'pointer',
                background: file ? '#f0f5fa' : '#fafbfc',
                transition: 'border-color 0.15s',
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null)
                  setResult(null)
                  setError('')
                }}
              />
              {file ? (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1E466B', marginBottom: 4 }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: '#8a8a9a' }}>{(file.size / 1024).toFixed(1)} Ko</div>
                </div>
              ) : (
                <div>
                  <svg style={{ margin: '0 auto 10px', display: 'block', color: '#94a3b8' }} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <div style={{ fontSize: 14, color: '#4a5568', fontWeight: 500 }}>Cliquez pour choisir un fichier CSV</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Encodage UTF-8, séparateur ;</div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            style={{
              padding: '11px 20px', background: !file || loading ? '#8a8a9a' : '#1E466B',
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: !file || loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {loading ? 'Import en cours...' : 'Lancer l\'import'}
          </button>
        </form>
      </div>

      {result && (
        <div style={{ background: '#fff', border: '1px solid #e3eaf3', borderRadius: 12, padding: '24px 28px', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0c0c14', marginBottom: 16 }}>Résultats de l'import</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
            <Stat label="Lignes CSV" value={result.total} color="#0c0c14" />
            <Stat label="Clients créés" value={result.created} color="#16a34a" />
            <Stat label="Véhicules" value={result.vehicules} color="#1E466B" />
            <Stat label="Alertes" value={result.alertes} color="#d97706" />
            <Stat label="Révisions" value={result.revisions ?? 0} color="#7c3aed" />
          </div>

          {result.debug && (
            <details style={{ marginBottom: 16 }}>
              <summary style={{ fontSize: 12, color: '#8a8a9a', cursor: 'pointer', userSelect: 'none' }}>Infos diagnostic</summary>
              <div style={{ marginTop: 8, background: '#f4f7fb', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#4a5568' }}>
                <div><strong>Colonnes CSV :</strong> {result.debug.colonnes.join(' | ')}</div>
                <div><strong>Montant TTC (1ère ligne) :</strong> {result.debug.exemple_montant ?? '—'}</div>
                <div><strong>Révisions avec montant :</strong> {result.debug.revisions_avec_montant}</div>
              </div>
            </details>
          )}

          {result.errors.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>
                {result.errors.length} erreur{result.errors.length > 1 ? 's' : ''}
              </div>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {result.errors.map((err, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#dc2626' }}>{err}</div>
                ))}
              </div>
            </div>
          )}

          {result.created > 0 && (
            <div style={{ marginTop: 16 }}>
              <Link href="/clients" style={{ display: 'inline-block', padding: '9px 18px', background: '#1E466B', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                Voir les clients →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Zone de réinitialisation */}
      <div style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: 12, padding: '24px 28px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Réinitialisation des données</div>
        <div style={{ fontSize: 13, color: '#8a8a9a', marginBottom: 20 }}>Sélectionnez les tables à vider. Action irréversible.</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {/* Tout sélectionner */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#0c0c14', paddingBottom: 10, borderBottom: '1px solid #f0f4f9' }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => setSelectedTables(allSelected ? [] : TABLES.map((t) => t.key))}
              style={{ width: 16, height: 16, accentColor: '#dc2626', cursor: 'pointer' }}
            />
            Tout sélectionner
          </label>

          {TABLES.map((t) => (
            <label key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#4a5568' }}>
              <input
                type="checkbox"
                checked={selectedTables.includes(t.key)}
                onChange={() => toggleTable(t.key)}
                style={{ width: 15, height: 15, accentColor: '#dc2626', cursor: 'pointer' }}
              />
              {t.label}
            </label>
          ))}
        </div>

        <button
          onClick={handleReset}
          disabled={selectedTables.length === 0 || resetting}
          style={{
            padding: '10px 20px',
            background: selectedTables.length === 0 || resetting ? '#fecaca' : '#dc2626',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: selectedTables.length === 0 || resetting ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {resetting ? 'Suppression...' : `Supprimer${selectedTables.length > 0 ? ` (${selectedTables.length} table${selectedTables.length > 1 ? 's' : ''})` : ''}`}
        </button>

        {resetMsg && (
          <div style={{
            marginTop: 12, fontSize: 13, padding: '8px 12px', borderRadius: 6,
            background: resetMsg.startsWith('Err') ? '#fef2f2' : '#f0fdf4',
            color: resetMsg.startsWith('Err') ? '#dc2626' : '#16a34a',
            border: `1px solid ${resetMsg.startsWith('Err') ? '#fecaca' : '#bbf7d0'}`,
          }}>
            {resetMsg}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: '#f4f7fb', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#8a8a9a', marginTop: 4 }}>{label}</div>
    </div>
  )
}
