'use client'

import { useState, useTransition } from 'react'
import { updateStatutAlerte, updateRelanceStatut } from '@/app/actions/alertes'
import Link from 'next/link'

type Alerte = {
  id: string
  client_id: string
  date_echeance: string
  type: string
  relance_statut: string | null
  clients: { nom: string; prenom: string; telephone: string | null; email: string | null } | null
  vehicules: { marque: string; modele: string; immatriculation: string | null } | null
}

export default function RelanceMode({ alertes }: { alertes: Alerte[] }) {
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()

  const total = alertes.length
  const current = alertes[index]

  function next() {
    if (index + 1 >= total) setDone(true)
    else setIndex((i) => i + 1)
  }

  function handleRelance(val: string) {
    startTransition(async () => {
      await updateRelanceStatut(current.id, val)
      next()
    })
  }

  function handleFait() {
    startTransition(async () => {
      await updateStatutAlerte(current.id, 'fait')
      next()
    })
  }

  if (total === 0) {
    return (
      <div className="card" style={{ padding: 56, textAlign: 'center', maxWidth: 480, margin: '60px auto' }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#16a34a', marginBottom: 8 }}>Tout est traité</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>Aucune alerte en attente de relance.</div>
        <Link href="/alertes" className="btn-primary" style={{ fontSize: 13 }}>Voir les alertes</Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="card" style={{ padding: 56, textAlign: 'center', maxWidth: 480, margin: '60px auto' }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#1E466B', marginBottom: 8 }}>Session terminée</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>{total} client{total > 1 ? 's' : ''} traité{total > 1 ? 's' : ''}.</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Link href="/alertes" className="btn-primary" style={{ fontSize: 13 }}>Voir les alertes</Link>
          <button onClick={() => { setIndex(0); setDone(false) }} className="btn-ghost" style={{ fontSize: 13 }}>Recommencer</button>
        </div>
      </div>
    )
  }

  const jours = Math.ceil((new Date(current.date_echeance).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
  const retard = jours < 0

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#8a8a9a' }}>
          Client <strong style={{ color: '#0c0c14' }}>{index + 1}</strong> / {total}
        </div>
        <Link href="/alertes" style={{ fontSize: 12.5, color: '#8a8a9a', textDecoration: 'none' }}>
          Quitter
        </Link>
      </div>

      {/* Barre de progression */}
      <div style={{ height: 5, background: '#f0f4f9', borderRadius: 4, marginBottom: 28 }}>
        <div style={{
          height: 5, background: '#1E466B', borderRadius: 4,
          width: `${(index / total) * 100}%`,
          transition: 'width 0.25s ease',
        }} />
      </div>

      {/* Fiche client */}
      <div className="card" style={{ padding: '32px 36px', textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#0c0c14', marginBottom: 10 }}>
          {current.clients?.prenom} {current.clients?.nom}
        </div>

        {current.clients?.telephone ? (
          <a
            href={`tel:${current.clients.telephone}`}
            style={{ fontSize: 22, fontWeight: 700, color: '#1E466B', textDecoration: 'none', display: 'block', marginBottom: 6, letterSpacing: '0.02em' }}
          >
            {current.clients.telephone}
          </a>
        ) : (
          <div style={{ fontSize: 15, color: '#c8d4e0', marginBottom: 6 }}>Pas de téléphone</div>
        )}

        {current.clients?.email && (
          <div style={{ fontSize: 12.5, color: '#94a3b8', marginBottom: 4 }}>{current.clients.email}</div>
        )}

        <div style={{ height: 1, background: '#f0f4f9', margin: '16px 0' }} />

        <div style={{ fontSize: 13.5, color: '#4a5568', marginBottom: 8 }}>
          {current.vehicules
            ? `${current.vehicules.marque} ${current.vehicules.modele}${current.vehicules.immatriculation ? ` · ${current.vehicules.immatriculation}` : ''}`
            : 'Véhicule non renseigné'}
        </div>

        <div style={{ fontSize: 13 }}>
          <span style={{ color: '#94a3b8' }}>Échéance :</span>{' '}
          <span style={{ fontWeight: 600, color: retard ? '#dc2626' : '#0c0c14' }}>
            {new Date(current.date_echeance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>{' '}
          <span style={{ fontWeight: 500, color: retard ? '#dc2626' : '#d97706' }}>
            ({retard ? `${Math.abs(jours)}j de retard` : `dans ${jours}j`})
          </span>
        </div>

        {current.relance_statut && (
          <div style={{ marginTop: 12, fontSize: 11.5, padding: '4px 12px', borderRadius: 20, display: 'inline-block', background: '#f4f7fb', color: '#64748b' }}>
            Dernière relance : <strong>
              {current.relance_statut === 'appele_nr' ? 'Appelé — NR' : current.relance_statut === 'a_rappeler' ? 'À rappeler' : 'RDV pris'}
            </strong>
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <button
          onClick={() => handleRelance('appele_nr')}
          disabled={pending}
          style={{ padding: '14px 12px', background: '#f0f5fa', border: '1px solid #c8d9eb', borderRadius: 9, fontSize: 13.5, fontWeight: 600, color: '#1E466B', cursor: 'pointer', fontFamily: 'inherit', opacity: pending ? 0.6 : 1 }}
        >
          Appelé — NR
        </button>
        <button
          onClick={() => handleRelance('a_rappeler')}
          disabled={pending}
          style={{ padding: '14px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 9, fontSize: 13.5, fontWeight: 600, color: '#d97706', cursor: 'pointer', fontFamily: 'inherit', opacity: pending ? 0.6 : 1 }}
        >
          A rappeler
        </button>
        <button
          onClick={() => handleRelance('rdv_pris')}
          disabled={pending}
          style={{ padding: '14px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9, fontSize: 13.5, fontWeight: 600, color: '#16a34a', cursor: 'pointer', fontFamily: 'inherit', opacity: pending ? 0.6 : 1 }}
        >
          RDV pris
        </button>
        <button
          onClick={handleFait}
          disabled={pending}
          style={{ padding: '14px 12px', background: '#edf3f9', border: '1px solid #c8d9eb', borderRadius: 9, fontSize: 13.5, fontWeight: 600, color: '#1E466B', cursor: 'pointer', fontFamily: 'inherit', opacity: pending ? 0.6 : 1 }}
        >
          Revision faite
        </button>
      </div>

      <button
        onClick={next}
        disabled={pending}
        style={{ width: '100%', padding: '11px', background: 'none', border: '1px solid #e3eaf3', borderRadius: 8, fontSize: 13, color: '#94a3b8', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        Passer sans action →
      </button>

      {/* Navigation manuelle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0 || pending}
          style={{ padding: '7px 14px', background: 'none', border: '1px solid #e3eaf3', borderRadius: 7, fontSize: 12, color: '#94a3b8', cursor: 'pointer', fontFamily: 'inherit', opacity: index === 0 ? 0.4 : 1 }}
        >
          Precedent
        </button>
        <Link href={`/clients/${current.client_id}`} style={{ fontSize: 12.5, color: '#1E466B', textDecoration: 'none', fontWeight: 500 }}>
          Voir la fiche →
        </Link>
      </div>
    </div>
  )
}
