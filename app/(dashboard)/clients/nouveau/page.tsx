'use client'

import { useState, useTransition } from 'react'
import { createVehiculeAction } from '@/app/actions/vehicules'
import Link from 'next/link'

export default function NouveauClientPage() {
  const [step, setStep] = useState<'client' | 'vehicule'>('client')
  const [clientId, setClientId] = useState<string | null>(null)
  const [typeRelation, setTypeRelation] = useState<'achat' | 'revision'>('achat')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  async function handleCreateClient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        const res = await fetch('/api/clients', {
          method: 'POST',
          body: formData,
        })
        const json = await res.json()
        if (!res.ok) { setError(json.error || 'Erreur'); return }
        setClientId(json.id)
        setStep('vehicule')
      } catch {
        setError('Erreur lors de la création du client.')
      }
    })
  }

  async function handleAddVehicule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        await createVehiculeAction(clientId!, formData)
        window.location.href = `/clients/${clientId}`
      } catch {
        setError('Erreur lors de l\'ajout du véhicule.')
      }
    })
  }

  function skipVehicule() {
    window.location.href = `/clients/${clientId}`
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 28 }}>
        <Link href="/clients" style={{ fontSize: 13, color: '#4a4a58', textDecoration: 'none', marginBottom: 12, display: 'inline-block' }}>← Retour</Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0c0c14', marginBottom: 4 }}>Nouveau client</h1>
      </div>

      {/* Steps indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {[{ label: '1. Infos client', key: 'client' }, { label: '2. Véhicule', key: 'vehicule' }].map((s) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
              background: step === s.key ? '#1E466B' : (s.key === 'vehicule' && step === 'vehicule') ? '#1E466B' : '#e3eaf3',
              color: step === s.key ? '#fff' : '#8a8a9a',
            }}>
              {s.key === 'vehicule' && step === 'vehicule' ? '2' : s.key === 'client' ? '1' : '2'}
            </div>
            <span style={{ fontSize: 13, color: step === s.key ? '#1E466B' : '#8a8a9a', fontWeight: step === s.key ? 600 : 400 }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div style={{ background: '#ffffff', border: '1px solid #e3eaf3', borderRadius: 12, padding: '28px 32px' }}>
        {error && (
          <div style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px', marginBottom: 20 }}>
            {error}
          </div>
        )}

        {step === 'client' && (
          <form onSubmit={handleCreateClient} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0c0c14', marginBottom: 4 }}>Informations client</h2>

            <div>
              <label style={labelStyle}>Civilité</label>
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                {[{ v: '', l: '—' }, { v: 'M.', l: 'M.' }, { v: 'Mme', l: 'Mme' }].map(({ v, l }) => (
                  <label key={v} style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 14px', border: '1px solid #e3eaf3', borderRadius: 7,
                    cursor: 'pointer', fontSize: 14,
                  }}>
                    <input type="radio" name="civilite" value={v} defaultChecked={v === ''} style={{ accentColor: '#1E466B' }} />
                    {l}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Prénom *" name="prenom" required />
              <Field label="Nom *" name="nom" required />
            </div>
            <Field label="Téléphone" name="telephone" type="tel" placeholder="06 00 00 00 00" />
            <Field label="Email" name="email" type="email" placeholder="client@exemple.com" />

            <button
              type="submit"
              disabled={pending}
              style={btnPrimary(pending)}
            >
              {pending ? 'Création...' : 'Créer le client →'}
            </button>
          </form>
        )}

        {step === 'vehicule' && (
          <form onSubmit={handleAddVehicule} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0c0c14', marginBottom: 4 }}>Ajouter un véhicule</h2>
            <p style={{ fontSize: 13, color: '#4a4a58', marginTop: -12 }}>Client créé. Ajoutez un véhicule pour générer les alertes automatiques.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Marque *" name="marque" required placeholder="Peugeot, Citroën..." />
              <Field label="Modèle *" name="modele" required placeholder="208, C3..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Immatriculation" name="immatriculation" placeholder="AB-123-CD" />
              <Field label="Date MEC" name="date_mec" type="date" />
            </div>

            <div>
              <label style={labelStyle}>Type de relation *</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                {(['achat', 'revision'] as const).map((t) => (
                  <label key={t} style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 14px', border: `1px solid ${typeRelation === t ? '#1E466B' : '#e3eaf3'}`,
                    borderRadius: 8, cursor: 'pointer',
                    background: typeRelation === t ? '#f0f5fa' : '#fff',
                  }}>
                    <input
                      type="radio"
                      name="type_relation"
                      value={t}
                      checked={typeRelation === t}
                      onChange={() => setTypeRelation(t)}
                      style={{ accentColor: '#1E466B' }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#0c0c14', textTransform: 'capitalize' }}>
                      {t === 'achat' ? 'Achat véhicule' : 'Révision / entretien'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {typeRelation === 'achat' && (
              <Field label="Date d'achat *" name="date_achat" type="date" required />
            )}
            {typeRelation === 'revision' && (
              <Field label="Date de dernière révision *" name="date_derniere_revision" type="date" required />
            )}

            <div style={{ fontSize: 12, color: '#4a4a58', background: '#f0f5fa', border: '1px solid #e3eaf3', borderRadius: 6, padding: '8px 12px' }}>
              {typeRelation === 'achat'
                ? 'Une alerte "Renouvellement" sera créée automatiquement pour dans 4 ans.'
                : 'Une alerte "Révision" sera créée automatiquement pour dans 1 an.'}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={pending} style={btnPrimary(pending)}>
                {pending ? 'Ajout...' : 'Ajouter le véhicule'}
              </button>
              <button type="button" onClick={skipVehicule} style={btnSecondary}>
                Passer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function Field({ label, name, type = 'text', required = false, placeholder = '' }: {
  label: string, name: string, type?: string, required?: boolean, placeholder?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#0c0c14', marginBottom: 6 }
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1px solid #e3eaf3', borderRadius: 8,
  fontSize: 14, color: '#0c0c14',
  background: '#ffffff', fontFamily: 'inherit',
}
const btnPrimary = (disabled: boolean): React.CSSProperties => ({
  padding: '11px 20px', background: disabled ? '#8a8a9a' : '#1E466B',
  color: '#ffffff', border: 'none', borderRadius: 8,
  fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'inherit',
})
const btnSecondary: React.CSSProperties = {
  padding: '11px 20px', background: '#ffffff',
  color: '#4a4a58', border: '1px solid #e3eaf3', borderRadius: 8,
  fontSize: 14, fontWeight: 500, cursor: 'pointer',
  fontFamily: 'inherit',
}
