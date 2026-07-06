'use client'

import { useState, useTransition } from 'react'
import { updateClientAction } from '@/app/actions/clients'

export default function ClientEditForm({ client }: { client: any }) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateClientAction(client.id, formData)
      setEditing(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    })
  }

  if (!editing) {
    return (
      <div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {client.civilite && <Info label="Civilité" value={client.civilite} />}
          <Info label="Prénom" value={client.prenom} />
          <Info label="Nom" value={client.nom} />
          <Info label="Téléphone" value={client.telephone} />
          <Info label="Email" value={client.email} />
          {client.tags && (
            <div>
              <div style={{ fontSize: 11, color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {client.tags.split(',').map((t: string) => t.trim()).filter(Boolean).map((tag: string) => (
                  <span key={tag} style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: '#edf3f9', color: '#1E466B', border: '1px solid #c8d9eb' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          {client.note && (
            <div>
              <div style={{ fontSize: 11, color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Note interne</div>
              <div style={{ fontSize: 13, color: '#4a5568', background: '#fef9ec', border: '1px solid #fde68a', borderRadius: 7, padding: '8px 12px', lineHeight: 1.5 }}>
                {client.note}
              </div>
            </div>
          )}
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setEditing(true)} className="btn-ghost" style={{ fontSize: 12 }}>
            Modifier
          </button>
          {success && <span style={{ fontSize: 12, color: '#16a34a' }}>✓ Sauvegardé</span>}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={lbl}>Civilité</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {[{ v: '', l: '—' }, { v: 'M.', l: 'M.' }, { v: 'Mme', l: 'Mme' }].map(({ v, l }) => (
            <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 13 }}>
              <input type="radio" name="civilite" value={v} defaultChecked={client.civilite === v || (!client.civilite && v === '')} style={{ accentColor: '#1E466B' }} />
              {l}
            </label>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Prénom" name="prenom" defaultValue={client.prenom} required />
        <Field label="Nom" name="nom" defaultValue={client.nom} required />
      </div>
      <Field label="Téléphone" name="telephone" defaultValue={client.telephone} type="tel" />
      <Field label="Email" name="email" defaultValue={client.email} type="email" />
      <div>
        <label style={lbl}>Tags <span style={{ color: '#b0b8c4', fontWeight: 400 }}>(séparés par des virgules)</span></label>
        <input
          name="tags"
          type="text"
          defaultValue={client.tags ?? ''}
          placeholder="Ex : VIP, fidèle, rappel matin"
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #e8eef5', borderRadius: 7, fontSize: 13, color: '#0c0c14', background: '#fff', fontFamily: 'inherit' }}
        />
      </div>
      <div>
        <label style={lbl}>Note interne</label>
        <textarea
          name="note"
          defaultValue={client.note ?? ''}
          placeholder="Ex : client fidèle, préfère être rappelé le matin..."
          rows={3}
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #e8eef5', borderRadius: 7, fontSize: 13, color: '#0c0c14', background: '#fff', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5 }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={pending} style={{ padding: '7px 16px', background: '#1E466B', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          {pending ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="btn-ghost" style={{ fontSize: 12 }}>
          Annuler
        </button>
      </div>
    </form>
  )
}

function Info({ label, value }: { label: string, value: string | null }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13.5, color: value ? '#0c0c14' : '#c8d4e0' }}>{value || '—'}</div>
    </div>
  )
}

function Field({ label, name, defaultValue, type = 'text', required = false }: {
  label: string, name: string, defaultValue?: string, type?: string, required?: boolean
}) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input name={name} type={type} defaultValue={defaultValue ?? ''} required={required}
        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e8eef5', borderRadius: 7, fontSize: 13, color: '#0c0c14', background: '#fff', fontFamily: 'inherit' }}
      />
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 11.5, fontWeight: 500, color: '#64748b', marginBottom: 4 }
