'use client'

import { useState, useTransition } from 'react'
import { createVehiculeAction } from '@/app/actions/vehicules'

export default function VehiculeForm({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false)
  const [typeRelation, setTypeRelation] = useState<'achat' | 'revision'>('achat')
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await createVehiculeAction(clientId, formData)
      setOpen(false)
      setTypeRelation('achat')
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ padding: '8px 14px', background: '#f0f5fa', border: '1px solid #e3eaf3', borderRadius: 6, fontSize: 13, color: '#1E466B', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        + Ajouter un véhicule
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: '#f4f7fb', border: '1px solid #e3eaf3', borderRadius: 10, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0c0c14' }}>Nouveau véhicule</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={lbl}>Marque *</label>
          <input name="marque" required placeholder="Peugeot..." style={inp} />
        </div>
        <div>
          <label style={lbl}>Modèle *</label>
          <input name="modele" required placeholder="208..." style={inp} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={lbl}>Immatriculation</label>
          <input name="immatriculation" placeholder="AB-123-CD" style={inp} />
        </div>
        <div>
          <label style={lbl}>Date MEC</label>
          <input name="date_mec" type="date" style={inp} />
        </div>
      </div>

      <div>
        <label style={lbl}>Type de relation *</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {(['achat', 'revision'] as const).map((t) => (
            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
              <input
                type="radio"
                name="type_relation"
                value={t}
                checked={typeRelation === t}
                onChange={() => setTypeRelation(t)}
                style={{ accentColor: '#1E466B' }}
              />
              {t === 'achat' ? 'Achat' : 'Révision'}
            </label>
          ))}
        </div>
      </div>

      {typeRelation === 'achat' && (
        <div>
          <label style={lbl}>Date d'achat *</label>
          <input name="date_achat" type="date" required style={inp} />
        </div>
      )}
      {typeRelation === 'revision' && (
        <div>
          <label style={lbl}>Date de dernière révision *</label>
          <input name="date_derniere_revision" type="date" required style={inp} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={pending} style={{ padding: '8px 14px', background: '#1E466B', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          {pending ? 'Ajout...' : 'Ajouter'}
        </button>
        <button type="button" onClick={() => setOpen(false)} style={{ padding: '8px 14px', background: 'none', border: '1px solid #e3eaf3', borderRadius: 6, fontSize: 13, color: '#4a4a58', cursor: 'pointer', fontFamily: 'inherit' }}>
          Annuler
        </button>
      </div>
    </form>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: '#4a4a58', marginBottom: 4 }
const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid #e3eaf3', borderRadius: 6, fontSize: 13, color: '#0c0c14', background: '#fff', fontFamily: 'inherit' }
