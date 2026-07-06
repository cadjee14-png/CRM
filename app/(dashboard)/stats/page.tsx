import { createClient } from '@/lib/supabase/server'

export default async function StatsPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalClients },
    { count: alertesPending },
    { count: alertesFaites },
    { data: alertesParMois },
    { data: relanceStats },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('alertes').select('*', { count: 'exact', head: true }).eq('statut', 'pending'),
    supabase.from('alertes').select('*', { count: 'exact', head: true }).eq('statut', 'fait'),
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
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Vue d'ensemble des alertes et de l'activité</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <KPI label="Clients" value={String(totalClients ?? 0)} color="#1E466B" bg="#edf3f9" />
        <KPI label="Alertes en cours" value={String(alertesPending ?? 0)} color="#d97706" bg="#fef9ec" />
        <KPI label="Révisions traitées" value={String(alertesFaites ?? 0)} color="#16a34a" bg="#f0fdf4" />
        <KPI label="Taux de relance" value={`${tauxRelance}%`} color="#0284c7" bg="#eff8ff" />
      </div>

      {/* Alertes à venir par mois */}
      <div className="card" style={{ padding: '24px 28px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0c0c14', marginBottom: 20 }}>
          Alertes à venir <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>(6 prochains mois)</span>
        </h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
          {moisList.map(([key, count]) => (
            <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 11, color: '#4a5568', fontWeight: 600 }}>{count || ''}</div>
              <div style={{
                width: '100%', background: '#1E466B', borderRadius: '4px 4px 0 0',
                height: `${Math.max((count / maxMois) * 120, count > 0 ? 4 : 0)}px`,
                opacity: 0.85, transition: 'height 0.3s ease',
              }} />
              <div style={{ fontSize: 10, color: '#8a8a9a', textAlign: 'center', lineHeight: 1.3 }}>
                {new Date(key + '-01').toLocaleDateString('fr-FR', { month: 'short' })}
                <br />
                <span style={{ color: '#b0b8c4' }}>{key.slice(0, 4)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suivi des relances en retard */}
      {retardAlertes.length > 0 && (
        <div className="card" style={{ padding: '24px 28px' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0c0c14', marginBottom: 20 }}>
            Suivi relances <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({retardAlertes.length} alertes en retard)</span>
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
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.3s ease' }} />
      </div>
      <div style={{ width: 60, fontSize: 12, color: '#64748b', textAlign: 'right' }}>
        {count} <span style={{ color: '#94a3b8' }}>({pct}%)</span>
      </div>
    </div>
  )
}
