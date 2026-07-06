import { createClient } from '@/lib/supabase/server'

function montantLabel(montant: number) {
  if (montant >= 200 && montant <= 700) return { label: 'Révision', color: '#0284c7', bg: '#eff8ff' }
  if (montant > 700) return { label: 'Réparation', color: '#d97706', bg: '#fef9ec' }
  return { label: 'Petite intervention', color: '#94a3b8', bg: '#f4f7fb' }
}

export default async function StatsPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalClients },
    { count: alertesPending },
    { count: alertesFaites },
    { data: revisions },
    { data: alertesParMois },
    { data: relanceStats },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('alertes').select('*', { count: 'exact', head: true }).eq('statut', 'pending'),
    supabase.from('alertes').select('*', { count: 'exact', head: true }).eq('statut', 'fait'),
    supabase
      .from('revisions')
      .select('*, clients(nom, prenom), vehicules(marque, modele)')
      .order('date_revision', { ascending: false }),
    supabase
      .from('alertes')
      .select('date_echeance')
      .eq('statut', 'pending')
      .gte('date_echeance', today)
      .order('date_echeance', { ascending: true }),
    supabase
      .from('alertes')
      .select('relance_statut')
      .eq('statut', 'pending')
      .lte('date_echeance', today),
  ])

  const rev = revisions ?? []
  const revAvecMontant = rev.filter((r) => r.montant != null)
  const totalCA = revAvecMontant.reduce((s, r) => s + Number(r.montant), 0)
  const avgCA = revAvecMontant.length ? totalCA / revAvecMontant.length : 0

  // CA par mois (12 derniers mois)
  const parMois = new Map<string, number>()
  for (const r of rev) {
    if (r.montant == null) continue
    const key = r.date_revision.slice(0, 7)
    parMois.set(key, (parMois.get(key) ?? 0) + Number(r.montant))
  }
  const moisCA = Array.from(parMois.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
  const maxCA = Math.max(...moisCA.map(([, v]) => v), 1)

  // Top clients par CA
  const clientCA = new Map<string, { nom: string; total: number; visites: number }>()
  for (const r of rev) {
    const c = (r as any).clients
    const nom = c ? `${c.prenom ?? ''} ${c.nom}`.trim() : 'Inconnu'
    const existing = clientCA.get(r.client_id)
    if (!existing) {
      clientCA.set(r.client_id, { nom, total: r.montant ? Number(r.montant) : 0, visites: 1 })
    } else {
      existing.total += r.montant ? Number(r.montant) : 0
      existing.visites++
    }
  }
  const topClients = Array.from(clientCA.values()).sort((a, b) => b.total - a.total).slice(0, 8)

  // Alertes à venir par mois (6 prochains mois)
  const moisMap = new Map<string, number>()
  for (let i = 0; i < 6; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() + i)
    moisMap.set(d.toISOString().slice(0, 7), 0)
  }
  for (const a of alertesParMois ?? []) {
    const key = a.date_echeance.slice(0, 7)
    if (moisMap.has(key)) moisMap.set(key, (moisMap.get(key) ?? 0) + 1)
  }
  const moisList = Array.from(moisMap.entries())
  const maxMois = Math.max(...moisList.map(([, v]) => v), 1)

  // Taux de relance
  const retardAlertes = relanceStats ?? []
  const avecRelance = retardAlertes.filter((a) => a.relance_statut).length
  const rdvPris = retardAlertes.filter((a) => a.relance_statut === 'rdv_pris').length
  const appelNR = retardAlertes.filter((a) => a.relance_statut === 'appele_nr').length
  const aRappeler = retardAlertes.filter((a) => a.relance_statut === 'a_rappeler').length
  const sansRelance = retardAlertes.length - avecRelance
  const tauxRelance = retardAlertes.length ? Math.round((avecRelance / retardAlertes.length) * 100) : 0

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0c0c14', marginBottom: 4 }}>Statistiques</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>{rev.length} révision{rev.length !== 1 ? 's' : ''} enregistrée{rev.length !== 1 ? 's' : ''}</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <KPI label="CA total" value={rev.length ? `${totalCA.toFixed(0)} €` : '—'} color="#16a34a" bg="#f0fdf4" />
        <KPI label="Panier moyen" value={revAvecMontant.length ? `${avgCA.toFixed(0)} €` : '—'} color="#0284c7" bg="#eff8ff" />
        <KPI label="Clients" value={String(totalClients ?? 0)} color="#1E466B" bg="#edf3f9" />
        <KPI label="Taux de relance" value={`${tauxRelance}%`} color="#d97706" bg="#fef9ec" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* CA par mois */}
        <div className="card" style={{ padding: '24px 28px' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0c0c14', marginBottom: 20 }}>
            CA par mois <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>(12 derniers)</span>
          </h2>
          {moisCA.length === 0 ? (
            <div style={{ fontSize: 13, color: '#94a3b8', padding: '24px 0', textAlign: 'center' }}>Aucune donnée</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160 }}>
              {moisCA.map(([key, montant]) => (
                <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 9.5, color: '#8a8a9a', fontWeight: 500, textAlign: 'center' }}>
                    {montant >= 1000 ? `${(montant / 1000).toFixed(1)}k` : montant.toFixed(0)}€
                  </div>
                  <div style={{ width: '100%', background: '#1E466B', borderRadius: '4px 4px 0 0', height: `${Math.max((montant / maxCA) * 120, 4)}px`, opacity: 0.85 }} />
                  <div style={{ fontSize: 9, color: '#8a8a9a', textAlign: 'center', lineHeight: 1.3 }}>
                    {new Date(key + '-01').toLocaleDateString('fr-FR', { month: 'short' })}
                    <br /><span style={{ color: '#b0b8c4' }}>{key.slice(0, 4)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertes à venir */}
        <div className="card" style={{ padding: '24px 28px' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0c0c14', marginBottom: 20 }}>
            Alertes à venir <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>(6 prochains mois)</span>
          </h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
            {moisList.map(([key, count]) => (
              <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 11, color: '#4a5568', fontWeight: 600 }}>{count || ''}</div>
                <div style={{ width: '100%', background: '#67BAF4', borderRadius: '4px 4px 0 0', height: `${Math.max((count / maxMois) * 120, count > 0 ? 4 : 0)}px`, opacity: 0.8 }} />
                <div style={{ fontSize: 10, color: '#8a8a9a', textAlign: 'center', lineHeight: 1.3 }}>
                  {new Date(key + '-01').toLocaleDateString('fr-FR', { month: 'short' })}
                  <br /><span style={{ color: '#b0b8c4' }}>{key.slice(0, 4)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dernières révisions */}
      {rev.length > 0 && (
        <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '18px 24px 12px', borderBottom: '1px solid #f0f4f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0c0c14' }}>Dernières révisions</h2>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{rev.length} au total</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafd', borderBottom: '1px solid #e8eef5' }}>
                {['Date', 'Client', 'Véhicule', 'Montant', 'Type'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rev.slice(0, 15).map((r: any) => {
                const m = r.montant != null ? Number(r.montant) : null
                const tag = m != null ? montantLabel(m) : null
                return (
                  <tr key={r.id} className="hoverable" style={{ borderBottom: '1px solid #f0f4f9' }}>
                    <td style={{ padding: '11px 16px', fontSize: 13, color: '#4a5568' }}>
                      {new Date(r.date_revision).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: '#0c0c14' }}>
                      {r.clients ? `${r.clients.prenom ?? ''} ${r.clients.nom}`.trim() : '—'}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 13, color: '#4a5568' }}>
                      {r.vehicules ? `${r.vehicules.marque} ${r.vehicules.modele}` : '—'}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: m != null ? '#0c0c14' : '#c8d4e0' }}>
                      {m != null ? `${m.toFixed(0)} €` : '—'}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      {tag ? (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: tag.bg, color: tag.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {tag.label}
                        </span>
                      ) : <span style={{ color: '#c8d4e0', fontSize: 12 }}>—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Top clients */}
      {topClients.length > 0 && (
        <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '18px 24px 12px', borderBottom: '1px solid #f0f4f9' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0c0c14' }}>Top clients — CA</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafd', borderBottom: '1px solid #e8eef5' }}>
                {['#', 'Client', 'Passages', 'CA total'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topClients.map((c, i) => (
                <tr key={i} className="hoverable" style={{ borderBottom: '1px solid #f0f4f9' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>#{i + 1}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: '#0c0c14' }}>{c.nom}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#4a5568' }}>{c.visites}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: c.total >= 500 ? '#16a34a' : '#4a5568' }}>
                    {c.total > 0 ? `${c.total.toFixed(0)} €` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Suivi relances */}
      {retardAlertes.length > 0 && (
        <div className="card" style={{ padding: '24px 28px' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0c0c14', marginBottom: 20 }}>
            Relances en retard <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({retardAlertes.length} alertes)</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <RelanceLine label="Sans relance" count={sansRelance} total={retardAlertes.length} color="#e5e7eb" />
            <RelanceLine label="Appelé — NR" count={appelNR} total={retardAlertes.length} color="#67BAF4" />
            <RelanceLine label="À rappeler" count={aRappeler} total={retardAlertes.length} color="#fde68a" />
            <RelanceLine label="RDV pris" count={rdvPris} total={retardAlertes.length} color="#86efac" />
          </div>
        </div>
      )}
    </div>
  )
}

function KPI({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <div className="card" style={{ padding: '20px 22px', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  )
}

function RelanceLine({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 120, fontSize: 13, color: '#4a5568', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 8, background: '#f0f4f9', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
      </div>
      <div style={{ width: 60, fontSize: 12, color: '#64748b', textAlign: 'right' }}>
        {count} <span style={{ color: '#94a3b8' }}>({pct}%)</span>
      </div>
    </div>
  )
}
