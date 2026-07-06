'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Client = {
  id: string
  nom: string
  prenom: string
  telephone: string | null
  email: string | null
  tags: string | null
  vehicules: { id: string }[]
  alertes: { id: string; statut: string }[]
}

function SortTh({ label, col, activeSort, activeOrder, buildHref }: {
  label: string; col: string; activeSort: string; activeOrder: string
  buildHref: (sort: string, order: string) => string
}) {
  const isActive = activeSort === col
  const nextOrder = isActive && activeOrder === 'asc' ? 'desc' : 'asc'
  return (
    <th style={{ padding: '11px 16px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', whiteSpace: 'nowrap' }}>
      <Link href={buildHref(col, nextOrder)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: isActive ? '#1E466B' : '#94a3b8', textDecoration: 'none' }}>
        {label}{isActive ? (activeOrder === 'asc' ? ' ↑' : ' ↓') : ''}
      </Link>
    </th>
  )
}

export default function ClientsTable({
  clients,
  allClientIds = [],
  montantMap = {},
  activeSort = 'nom',
  activeOrder = 'asc',
  urlParams = {},
}: {
  clients: Client[]
  allClientIds?: string[]
  montantMap?: Record<string, number | null>
  activeSort?: string
  activeOrder?: string
  urlParams?: Record<string, string>
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, startDelete] = useTransition()
  const [deleteMsg, setDeleteMsg] = useState('')
  const [selectAllPages, setSelectAllPages] = useState(false)

  const allChecked = clients.length > 0 && selected.size === clients.length
  const hasMultiplePages = allClientIds.length > clients.length

  function sortHref(col: string, ord: string) {
    const p = new URLSearchParams({ ...urlParams, sort: col, order: ord })
    return `/clients?${p.toString()}`
  }

  function toggleAll() {
    if (allChecked) {
      setSelected(new Set())
      setSelectAllPages(false)
    } else {
      setSelected(new Set(clients.map((c) => c.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleDelete() {
    const ids = selectAllPages ? allClientIds : Array.from(selected)
    const count = ids.length
    if (count === 0) return
    if (!confirm(`Supprimer ${count} client${count > 1 ? 's' : ''} et toutes leurs données ?\n\nCette action est irréversible.`)) return

    startDelete(async () => {
      setDeleteMsg('')
      const res = await fetch('/api/clients/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const data = await res.json()
      if (data.errors?.length > 0) {
        setDeleteMsg('Erreur : ' + data.errors.join(', '))
      } else {
        setSelected(new Set())
        setSelectAllPages(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      {selected.size > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {allChecked && hasMultiplePages && !selectAllPages && (
            <div style={{ background: '#eff8ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '9px 16px', fontSize: 13, color: '#1E466B', display: 'flex', alignItems: 'center', gap: 10 }}>
              Les {clients.length} clients de cette page sont sélectionnés.
              <button onClick={() => setSelectAllPages(true)} style={{ fontWeight: 600, color: '#1E466B', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 13 }}>
                Sélectionner les {allClientIds.length} clients de toutes les pages
              </button>
            </div>
          )}
          {selectAllPages && (
            <div style={{ background: '#eff8ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '9px 16px', fontSize: 13, color: '#1E466B', display: 'flex', alignItems: 'center', gap: 10 }}>
              Les {allClientIds.length} clients de toutes les pages sont sélectionnés.
              <button onClick={() => setSelectAllPages(false)} style={{ fontWeight: 500, color: '#1E466B', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 13 }}>
                Annuler
              </button>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '10px 16px' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>
              {selectAllPages ? allClientIds.length : selected.size} client{(selectAllPages ? allClientIds.length : selected.size) > 1 ? 's' : ''} sélectionné{(selectAllPages ? allClientIds.length : selected.size) > 1 ? 's' : ''}
            </span>
            <button onClick={handleDelete} disabled={deleting} style={{ padding: '7px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: deleting ? 0.7 : 1 }}>
              {deleting ? 'Suppression...' : 'Supprimer la sélection'}
            </button>
            <button onClick={() => { setSelected(new Set()); setSelectAllPages(false) }} style={{ padding: '7px 12px', background: 'none', border: '1px solid #fecaca', borderRadius: 7, fontSize: 13, color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit' }}>
              Annuler
            </button>
            {deleteMsg && <span style={{ fontSize: 12, color: '#dc2626' }}>{deleteMsg}</span>}
          </div>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8fafd', borderBottom: '1px solid #e8eef5' }}>
            <th style={{ padding: '11px 14px', width: 36 }}>
              <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ width: 15, height: 15, accentColor: '#1E466B', cursor: 'pointer' }} />
            </th>
            <SortTh label="Client" col="nom" activeSort={activeSort} activeOrder={activeOrder} buildHref={sortHref} />
            <th style={{ padding: '11px 16px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left' }}>Téléphone</th>
            <th style={{ padding: '11px 16px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left' }}>Email</th>
            <SortTh label="Dernier montant" col="montant" activeSort={activeSort} activeOrder={activeOrder} buildHref={sortHref} />
            <SortTh label="Alertes" col="alertes" activeSort={activeSort} activeOrder={activeOrder} buildHref={sortHref} />
            <th style={{ padding: '11px 16px' }} />
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => {
            const alertesPending = c.alertes?.filter((a) => a.statut === 'pending').length ?? 0
            const montant = montantMap[c.id] ?? null
            const tags = c.tags ? c.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
            const isSelected = selected.has(c.id)
            return (
              <tr key={c.id} className="hoverable" style={{ borderBottom: '1px solid #f0f4f9', background: isSelected ? '#fef9f9' : undefined }}>
                <td style={{ padding: '13px 14px' }}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleOne(c.id)} style={{ width: 15, height: 15, accentColor: '#dc2626', cursor: 'pointer' }} />
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <Link href={`/clients/${c.id}`} style={{ fontSize: 13.5, fontWeight: 600, color: '#1E466B', textDecoration: 'none' }}>
                    {c.prenom} {c.nom}
                  </Link>
                  {tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                      {tags.map((tag) => (
                        <span key={tag} style={{ fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 20, background: '#edf3f9', color: '#1E466B', border: '1px solid #c8d9eb' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ padding: '13px 16px', fontSize: 13, color: '#4a5568' }}>
                  {c.telephone
                    ? <a href={`tel:${c.telephone}`} style={{ color: '#4a5568', textDecoration: 'none' }}>{c.telephone}</a>
                    : <span style={{ color: '#c8d4e0' }}>—</span>}
                </td>
                <td style={{ padding: '13px 16px', fontSize: 13, color: '#4a5568' }}>
                  {c.email || <span style={{ color: '#c8d4e0' }}>—</span>}
                </td>
                <td style={{ padding: '13px 16px' }}>
                  {montant != null ? (
                    <span style={{
                      fontSize: 13, fontWeight: 600,
                      color: montant >= 200 && montant <= 700 ? '#0284c7' : montant > 700 ? '#d97706' : '#4a5568',
                    }}>
                      {montant.toFixed(0)} €
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#c8d4e0' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '13px 16px' }}>
                  {alertesPending > 0 ? (
                    <span className="badge" style={{ background: '#fef9ec', color: '#d97706', border: '1px solid #fde68a' }}>
                      {alertesPending} alerte{alertesPending > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#c8d4e0' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                  <Link href={`/clients/${c.id}`} style={{ fontSize: 12.5, color: '#1E466B', textDecoration: 'none', fontWeight: 500 }}>
                    Voir →
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
