'use client'

import { updateStatutAlerte, updateRelanceStatut, updateEcheanceAlerte, snoozeAlerte } from '@/app/actions/alertes'
import { useState, useTransition } from 'react'

const RELANCE_OPTIONS = [
  { value: '', label: 'Relance…' },
  { value: 'appele_nr', label: 'Appelé — NR' },
  { value: 'a_rappeler', label: 'À rappeler' },
  { value: 'rdv_pris', label: 'RDV pris ✓' },
]

const SNOOZE_OPTIONS = [
  { days: 7, label: '7j' },
  { days: 30, label: '30j' },
  { days: 90, label: '90j' },
]

export default function AlerteActions({
  id, statut, relance_statut, date_echeance, clientId, vehiculeId,
}: {
  id: string
  statut: string
  relance_statut?: string | null
  date_echeance?: string
  clientId?: string
  vehiculeId?: string | null
}) {
  const [pending, startTransition] = useTransition()
  const [editingDate, setEditingDate] = useState(false)
  const [showSnooze, setShowSnooze] = useState(false)
  const [showFaitForm, setShowFaitForm] = useState(false)
  const [montant, setMontant] = useState('')
  const [dateValue, setDateValue] = useState(date_echeance ?? '')

  function handleRelance(value: string) {
    startTransition(() => updateRelanceStatut(id, value || null))
  }

  function handleSnooze(days: number) {
    setShowSnooze(false)
    startTransition(() => snoozeAlerte(id, days))
  }

  function handleFaitConfirm() {
    const m = montant ? parseFloat(montant) : null
    setShowFaitForm(false)
    setMontant('')
    startTransition(() => updateStatutAlerte(id, 'fait', m ?? undefined, clientId, vehiculeId ?? undefined, date_echeance))
  }

  function handleDateSave() {
    if (!dateValue) return
    startTransition(async () => {
      await updateEcheanceAlerte(id, dateValue)
      setEditingDate(false)
    })
  }

  if (showFaitForm) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 12, color: '#4a5568', whiteSpace: 'nowrap' }}>Montant TTC :</span>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0 €"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            autoFocus
            style={{
              width: 80, padding: '5px 8px', border: '1px solid #e3eaf3',
              borderRadius: 6, fontSize: 13, fontFamily: 'inherit', color: '#0c0c14',
            }}
          />
        </div>
        <button onClick={handleFaitConfirm} disabled={pending} style={{
          padding: '6px 12px', fontSize: 12, fontWeight: 600,
          background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a',
          borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Confirmer
        </button>
        <button onClick={() => { setShowFaitForm(false); setMontant('') }} style={{
          padding: '6px 8px', fontSize: 12,
          background: 'none', border: '1px solid #e3eaf3', color: '#8a8a9a',
          borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          ✕
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {/* Relance */}
        <select
          value={relance_statut ?? ''}
          onChange={(e) => handleRelance(e.target.value)}
          disabled={pending}
          style={{
            padding: '5px 7px', fontSize: 11.5, fontFamily: 'inherit',
            border: `1px solid ${relance_statut === 'rdv_pris' ? '#bbf7d0' : '#e3eaf3'}`,
            borderRadius: 6,
            background: relance_statut === 'rdv_pris' ? '#f0fdf4' : relance_statut ? '#eff8ff' : '#fff',
            color: relance_statut === 'rdv_pris' ? '#16a34a' : relance_statut ? '#1E466B' : '#8a8a9a',
            cursor: 'pointer',
          }}
        >
          {RELANCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Modifier date */}
        {!editingDate && (
          <button
            onClick={() => setEditingDate(true)}
            disabled={pending}
            title="Modifier la date d'échéance"
            style={{
              padding: '5px 8px', fontSize: 11,
              background: '#f4f7fb', border: '1px solid #e3eaf3', color: '#64748b',
              borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            📅
          </button>
        )}

        {/* Fait */}
        {statut !== 'fait' && (
          <button onClick={() => setShowFaitForm(true)} disabled={pending} style={{
            padding: '6px 12px', fontSize: 12, fontWeight: 600,
            background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a',
            borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Fait
          </button>
        )}

        {/* Snooze */}
        {statut === 'pending' && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSnooze((v) => !v)}
              disabled={pending}
              style={{
                padding: '6px 12px', fontSize: 12, fontWeight: 600,
                background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706',
                borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Snooze ▾
            </button>
            {showSnooze && (
              <div style={{
                position: 'absolute', right: 0, top: '110%', zIndex: 20,
                background: '#fff', border: '1px solid #e3eaf3', borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                display: 'flex', flexDirection: 'column', minWidth: 100,
              }}>
                {SNOOZE_OPTIONS.map((o) => (
                  <button
                    key={o.days}
                    onClick={() => handleSnooze(o.days)}
                    style={{
                      padding: '9px 16px', fontSize: 13, textAlign: 'left',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit', color: '#4a5568',
                    }}
                  >
                    Dans {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {statut !== 'pending' && (
          <button onClick={() => startTransition(() => updateStatutAlerte(id, 'pending'))} disabled={pending} style={{
            padding: '6px 12px', fontSize: 12, fontWeight: 500,
            background: '#f9fafb', border: '1px solid #e3eaf3', color: '#4a4a58',
            borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Réouvrir
          </button>
        )}
      </div>

      {editingDate && (
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <input
            type="date"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #e3eaf3', borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }}
          />
          <button onClick={handleDateSave} disabled={pending} style={{
            padding: '4px 10px', fontSize: 12, fontWeight: 600,
            background: '#1E466B', color: '#fff', border: 'none',
            borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            OK
          </button>
          <button onClick={() => setEditingDate(false)} style={{
            padding: '4px 8px', fontSize: 12,
            background: 'none', border: '1px solid #e3eaf3',
            borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', color: '#8a8a9a',
          }}>
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
