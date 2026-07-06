import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AlerteActions from '@/components/AlerteActions'
import ExportBtn from '@/components/ExportBtn'

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function joursRestants(echeance: string) {
  const diff = new Date(echeance).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default async function AlertesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; statut?: string; montant_min?: string; montant_max?: string; sans_montant?: string }>
}) {
  const { type, statut, montant_min, montant_max, sans_montant } = await searchParams
  const inclureSansMontant = sans_montant === '1'
  const hasMontantFilter = !!(montant_min || montant_max)

  const supabase = await createClient()

  let query = supabase
    .from('alertes')
    .select('*, clients(id, nom, prenom, telephone), vehicules(marque, modele, immatriculation)')
    .order('date_echeance', { ascending: true })

  if (type) query = query.eq('type', type)
  if (statut) query = query.eq('statut', statut)
  else query = query.eq('statut', 'pending')

  const { data: rawAlertes } = await query

  // Récupérer le dernier montant de révision par client
  const montantMap = new Map<string, number | null>()
  if (rawAlertes && rawAlertes.length > 0) {
    const clientIds = [...new Set(rawAlertes.map((a: any) => a.client_id))]
    const { data: revisions } = await supabase
      .from('revisions')
      .select('client_id, montant, date_revision')
      .in('client_id', clientIds)
      .order('date_revision', { ascending: false })

    // Initialiser tous les clients à null (pas de montant)
    for (const id of clientIds) montantMap.set(id, null)

    if (revisions) {
      for (const r of revisions) {
        if (montantMap.get(r.client_id) === null && r.montant != null) {
          montantMap.set(r.client_id, Number(r.montant))
        }
      }
    }
  }

  // Appliquer le filtre montant côté JS
  let alertes = rawAlertes ?? []
  if (hasMontantFilter) {
    const min = montant_min ? parseFloat(montant_min) : null
    const max = montant_max ? parseFloat(montant_max) : null

    alertes = alertes.filter((a: any) => {
      const m = montantMap.get(a.client_id)
      if (m === null || m === undefined) return inclureSansMontant
      if (min !== null && m < min) return false
      if (max !== null && m > max) return false
      return true
    })
  }

  const activeStatut = statut || 'pending'
  const activeType = type || ''

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0c0c14', marginBottom: 4 }}>Alertes</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>{alertes.length} alerte{alertes.length > 1 ? 's' : ''}</p>
        </div>
        <ExportBtn
          href={`/api/export/alertes?${new URLSearchParams({ type: activeType, ...(activeStatut !== 'pending' ? { statut: activeStatut } : {}), ...(montant_min ? { montant_min } : {}), ...(montant_max ? { montant_max } : {}), ...(sans_montant ? { sans_montant } : {}) }).toString()}`}
          label="Export relance CSV"
        />
      </div>

      {/* Filtres statut + type */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <FilterGroup label="Statut :">
          {[
            { label: 'En attente', value: 'pending' },
            { label: 'Snoozées', value: 'snooze' },
            { label: 'Faites', value: 'fait' },
          ].map((f) => (
            <Link
              key={f.value}
              href={buildHref({ type: activeType, statut: f.value, montant_min, montant_max, sans_montant })}
              style={filterStyle(activeStatut === f.value || (f.value === 'pending' && !statut))}
            >
              {f.label}
            </Link>
          ))}
        </FilterGroup>

        <FilterGroup label="Type :">
          {[
            { label: 'Tous', value: '' },
            { label: 'Révision', value: 'revision' },
            { label: 'Renouvellement', value: 'renouvellement' },
          ].map((f) => (
            <Link
              key={f.value}
              href={buildHref({ type: f.value, statut: activeStatut, montant_min, montant_max, sans_montant })}
              style={filterStyle(activeType === f.value)}
            >
              {f.label}
            </Link>
          ))}
        </FilterGroup>
      </div>

      {/* Filtre montant */}
      <form method="GET" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, background: '#f4f7fb', border: '1px solid #e3eaf3', borderRadius: 10, padding: '12px 16px', flexWrap: 'wrap' }}>
        <input type="hidden" name="type" value={activeType} />
        <input type="hidden" name="statut" value={activeStatut !== 'pending' ? activeStatut : ''} />
        <span style={{ fontSize: 13, fontWeight: 500, color: '#4a5568' }}>Dernier montant :</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            name="montant_min"
            type="number"
            min="0"
            placeholder="Min €"
            defaultValue={montant_min ?? ''}
            style={{ width: 80, padding: '6px 10px', border: '1px solid #e3eaf3', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', color: '#0c0c14' }}
          />
          <span style={{ fontSize: 13, color: '#8a8a9a' }}>—</span>
          <input
            name="montant_max"
            type="number"
            min="0"
            placeholder="Max €"
            defaultValue={montant_max ?? ''}
            style={{ width: 80, padding: '6px 10px', border: '1px solid #e3eaf3', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', color: '#0c0c14' }}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4a5568', cursor: 'pointer' }}>
          <input
            type="checkbox"
            name="sans_montant"
            value="1"
            defaultChecked={inclureSansMontant}
            style={{ accentColor: '#1E466B', width: 14, height: 14 }}
          />
          Inclure sans montant
        </label>
        <button type="submit" style={{ padding: '6px 14px', background: '#1E466B', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Filtrer
        </button>
        {hasMontantFilter && (
          <Link
            href={buildHref({ type: activeType, statut: activeStatut !== 'pending' ? activeStatut : '' })}
            style={{ fontSize: 12, color: '#8a8a9a', textDecoration: 'underline' }}
          >
            Effacer
          </Link>
        )}
      </form>

      {/* Tableau */}
      {alertes.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1px solid #e3eaf3', borderRadius: 12, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#4a4a58' }}>Aucune alerte pour ces filtres.</div>
        </div>
      ) : (
        <div style={{ background: '#ffffff', border: '1px solid #e3eaf3', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e3eaf3', background: '#f8fafd' }}>
                {['Client', 'Véhicule', 'Type', 'Échéance', 'Délai', 'Dernier montant', 'Statut', ''].map((h) => (
                  <th key={h} style={{ padding: '11px 14px', fontSize: 11, fontWeight: 600, color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alertes.map((a: any) => {
                const jours = joursRestants(a.date_echeance)
                const retard = jours < 0
                const montant = montantMap.get(a.client_id)
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f4f7fb' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <Link href={`/clients/${a.client_id}`} style={{ fontSize: 13.5, fontWeight: 600, color: '#1E466B', textDecoration: 'none' }}>
                        {a.clients?.prenom} {a.clients?.nom}
                      </Link>
                      {a.clients?.telephone && (
                        <div style={{ fontSize: 12, color: '#8a8a9a' }}>{a.clients.telephone}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#4a4a58' }}>
                      {a.vehicules?.marque} {a.vehicules?.modele}
                      {a.vehicules?.immatriculation && (
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{a.vehicules.immatriculation}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                        background: a.type === 'revision' ? '#eff8ff' : '#f0f5fa',
                        color: a.type === 'revision' ? '#67BAF4' : '#1E466B',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        {a.type === 'revision' ? 'Révision' : 'Renouvellement'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#4a4a58' }}>
                      {formatDate(a.date_echeance)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: retard ? '#dc2626' : jours <= 7 ? '#d97706' : '#4a5568' }}>
                        {retard ? `${Math.abs(jours)}j retard` : `dans ${jours}j`}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {montant != null ? (
                        <span style={{ fontSize: 13, fontWeight: 600, color: montant >= 200 && montant <= 700 ? '#16a34a' : '#d97706' }}>
                          {montant.toFixed(2)} €
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: '#c8d4e0' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em',
                        background: a.statut === 'fait' ? '#f0fdf4' : a.statut === 'snooze' ? '#f9fafb' : retard ? '#fef2f2' : '#fffbeb',
                        color: a.statut === 'fait' ? '#16a34a' : a.statut === 'snooze' ? '#8a8a9a' : retard ? '#dc2626' : '#d97706',
                      }}>
                        {a.statut === 'fait' ? 'Fait' : a.statut === 'snooze' ? 'Snoozé' : retard ? 'En retard' : 'En attente'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <AlerteActions id={a.id} statut={a.statut} relance_statut={a.relance_statut} date_echeance={a.date_echeance} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function buildHref({ type, statut, montant_min, montant_max, sans_montant }: {
  type?: string; statut?: string; montant_min?: string; montant_max?: string; sans_montant?: string
}) {
  const params = new URLSearchParams()
  if (type) params.set('type', type)
  if (statut && statut !== 'pending') params.set('statut', statut)
  if (montant_min) params.set('montant_min', montant_min)
  if (montant_max) params.set('montant_max', montant_max)
  if (sans_montant) params.set('sans_montant', sans_montant)
  const str = params.toString()
  return `/alertes${str ? `?${str}` : ''}`
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 12, color: '#8a8a9a', fontWeight: 500 }}>{label}</span>
      {children}
    </div>
  )
}

function filterStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 12px', fontSize: 13, fontWeight: active ? 600 : 400,
    background: active ? '#1E466B' : '#ffffff',
    color: active ? '#ffffff' : '#4a4a58',
    border: `1px solid ${active ? '#1E466B' : '#e3eaf3'}`,
    borderRadius: 6, textDecoration: 'none', cursor: 'pointer',
  }
}
