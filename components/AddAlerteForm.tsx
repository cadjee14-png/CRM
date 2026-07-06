'use client'

import { useState, useTransition } from 'react'
import { createAlerteManuelle } from '@/app/actions/alertes'

export default function AddAlerteForm({
  clientId,
  vehicules,
}: {
  clientId: string
  vehicules: { id: string; marque: string; modele: string; immatriculation?: string | null }[]
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await createAlerteManuelle(clientId, formData)
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-ghost" style={{ fontSize: 12, marginTop: 12 }}>
        + Ajouter une alerte
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 12, padding: '14px 16px', background: '#f8fafd', borderRadius: 10, border: '1px solid #e3eaf3' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#0c0c14', marginBottom: 12 }}>Nouvelle alerte</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={lbl}>Type</label>
          <select name="type" required style={inputStyle}>
            <option value="revision">Révision</option>
            <option value="renouvellement">Renouvellement</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Véhicule (optionnel)</label>
          <select name="vehicule_id" style={inputStyle}>
            <option value="">Aucun</option>
            {vehicules.map((v) => (
              <option key={v.id} value={v.id}>
                {v.marque} {v.modele}{v.immatriculation ? ` (${v.immatriculation})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={lbl}>Date d'échéance</label>
        <input type="date" name="date_echeance" required style={inputStyle} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={pending} style={{
          padding: '7px 16px', background: '#1E466B', color: '#fff', border: 'none',
          borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {pending ? 'Création...' : 'Créer'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost" style={{ fontSize: 12 }}>
          Annuler
        </button>
      </div>
    </form>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 11.5, fontWeight: 500, color: '#64748b', marginBottom: 4 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #e8eef5', borderRadius: 7, fontSize: 13, color: '#0c0c14', background: '#fff', fontFamily: 'inherit' }
