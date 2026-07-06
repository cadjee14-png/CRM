'use client'

import { useState } from 'react'
import { loginAction } from '@/app/actions/auth'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    const result = await loginAction(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f4f7fb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: '#ffffff',
        border: '1px solid #e3eaf3',
        borderRadius: 16,
        padding: '40px 36px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40,
            background: '#1E466B',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
              <rect x="9" y="11" width="14" height="10" rx="2" />
              <circle cx="12" cy="20" r="1" />
              <circle cx="20" cy="20" r="1" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0c0c14' }}>Nourian CRM</div>
            <div style={{ fontSize: 11, color: '#8a8a9a' }}>Accès réservé au personnel</div>
          </div>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0c0c14', marginBottom: 6 }}>Accès CRM</h1>
        <p style={{ fontSize: 14, color: '#4a4a58', marginBottom: 28 }}>Entrez le mot de passe pour accéder au CRM.</p>

        <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#0c0c14', marginBottom: 6 }}>
              Mot de passe
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              autoFocus
              style={{
                width: '100%', padding: '10px 14px',
                border: '1px solid #e3eaf3', borderRadius: 8,
                fontSize: 14, color: '#0c0c14',
                background: '#ffffff', fontFamily: 'inherit',
              }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '11px',
              background: loading ? '#8a8a9a' : '#1E466B',
              color: '#ffffff', border: 'none', borderRadius: 8,
              fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', marginTop: 4,
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
