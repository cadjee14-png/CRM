'use client'

import { useState, useTransition } from 'react'
import { createRevisionAction, deleteRevisionAction } from '@/app/actions/revisions'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function RevisionHistory({
  clientId,
  vehicules,
  revisions,
}: {
  clientId: string
  vehicules: { id: string; marque: string; modele: string; immatriculation?: string }[]
  revisions: any[]
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await createRevisionAction(clientId, formData)
      setOpen(false)
      ;(e.target as HTMLFormElement).reset()
    })
  }

  function handleDelete(revisionId: string) {
    startTransition(async () => {
      await deleteRevisionAction(revisionId, clientId)
    })
  }

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e3eaf3', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0c0c14' }}>Historique révisions</h2>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            style={{ padding: '6px 12px', background: '#f0f5fa', border: '1px solid #e3eaf3', borderRadius: 6, fontSize: 12, color: '#1E466B', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            + Ajouter
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={handleSubmit} style={{ background: '#f4f7fb', border: '1px solid #e3eaf3', borderRadius: 10, padding: '14px 16px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Date révision *</label>
              <input name="date_revision" type="date" required style={inp} defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label style={lbl}>Montant TTC (€)</label>
              <input name="montant" type="number" step="0.01" min="0" placeholder="0.00" style={inp} />
            </div>
          </div>
          {vehicules.length > 0 && (
            <div>
              <label style={lbl}>Véhicule</label>
              <select name="vehicule_id" style={{ ...inp, appearance: 'auto' }}>
                <option value="">Général</option>
                {vehicules.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.marque} {v.modele}{v.immatriculation ? ` — ${v.immatriculation}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label style={lbl}>Note</label>
            <input name="note" placeholder="Ex : vidange + filtres air..." style={inp} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={pending} style={{ padding: '7px 14px', background: '#1E466B', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {pending ? 'Ajout...' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => setOpen(false)} style={{ padding: '7px 14px', background: 'none', border: '1px solid #e3eaf3', borderRadius: 6, fontSize: 13, color: '#4a4a58', cursor: 'pointer', fontFamily: 'inherit' }}>
              Annuler
            </button>
          </div>
        </form>
      )}

      {revisions.length === 0 ? (
        <div style={{ fontSize: 13, color: '#8a8a9a' }}>Aucune révision enregistrée.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {revisions.map((r: any) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f4f7fb', borderRadius: 8, gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0c0c14' }}>
                  {formatDate(r.date_revision)}
                  {r.vehicules && (
                    <span style={{ fontWeight: 400, color: '#4a5568' }}> — {r.vehicules.marque} {r.vehicules.modele}</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#8a8a9a', marginTop: 2, display: 'flex', gap: 10 }}>
                  {r.montant != null && (
                    <span style={{ color: '#1E466B', fontWeight: 500 }}>{Number(r.montant).toFixed(2)} €</span>
                  )}
                  {r.note && <span>{r.note}</span>}
                </div>
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                disabled={pending}
                style={{ background: 'none', border: 'none', color: '#c8d4e0', cursor: 'pointer', padding: 4, lineHeight: 1, fontSize: 16 }}
                title="Supprimer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: '#4a4a58', marginBottom: 4 }
const inp: React.CSSProperties = { width: '100%', padding: '7px 11px', border: '1px solid #e3eaf3', borderRadius: 6, fontSize: 13, color: '#0c0c14', background: '#fff', fontFamily: 'inherit' }
