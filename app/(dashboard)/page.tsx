import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AlerteActions from '@/components/AlerteActions'
import ArchiveOldBtn from '@/components/ArchiveOldBtn'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function joursRestants(echeance: string) {
  const diff = new Date(echeance).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const stats = [
  {
    key: 'clients',
    label: 'Clients',
    color: '#1E466B',
    bg: '#edf3f9',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: 'alertes',
    label: 'Alertes en attente',
    color: '#d97706',
    bg: '#fef9ec',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    key: 'retard',
    label: 'En retard',
    color: '#dc2626',
    bg: '#fef2f2',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  {
    key: 'bientot',
    label: 'Dans 30 jours',
    color: '#0284c7',
    bg: '#eff8ff',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const in30 = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0]
  const currentYear = new Date().getFullYear()
  const yearStart = `${currentYear - 1}-01-01`

  const [
    { count: totalClients },
    { data: alertesUrgentes },
    { data: alertes30j },
    { count: totalAlertes },
    { count: oldAlertes },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase
      .from('alertes')
      .select('*, clients(nom, prenom, telephone), vehicules(marque, modele)')
      .eq('statut', 'pending')
      .lte('date_echeance', today)
      .gte('date_echeance', yearStart)
      .order('date_echeance', { ascending: false }),
    supabase
      .from('alertes')
      .select('*, clients(nom, prenom, telephone), vehicules(marque, modele)')
      .eq('statut', 'pending')
      .gt('date_echeance', today)
      .lte('date_echeance', in30)
      .order('date_echeance', { ascending: true }),
    supabase.from('alertes').select('*', { count: 'exact', head: true }).eq('statut', 'pending'),
    supabase
      .from('alertes')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'pending')
      .lt('date_echeance', yearStart),
  ])

  const values: Record<string, number> = {
    clients: totalClients ?? 0,
    alertes: totalAlertes ?? 0,
    retard: alertesUrgentes?.length ?? 0,
    bientot: alertes30j?.length ?? 0,
  }

  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const hasOldAlertes = (oldAlertes ?? 0) > 0

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0c0c14', marginBottom: 3, letterSpacing: '-0.02em' }}>Tableau de bord</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', textTransform: 'capitalize' }}>{dateStr}</p>
        </div>
        <Link href="/clients/nouveau" className="btn-primary" style={{ fontSize: 13 }}>
          + Nouveau client
        </Link>
      </div>

      {/* Bannière alertes anciennes */}
      {hasOldAlertes && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10,
          padding: '12px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ fontSize: 13, color: '#92400e' }}>
            <strong>{oldAlertes} alertes</strong> datent d'avant {currentYear - 1} et encombrent la vue.
          </div>
          <ArchiveOldBtn beforeYear={currentYear - 1} />
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
        {stats.map((s) => (
          <div key={s.key} className="card" style={{ padding: '18px 20px', borderTop: `3px solid ${s.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, background: s.bg, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                {s.icon}
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: '#0c0c14', letterSpacing: '-0.02em', lineHeight: 1 }}>{values[s.key]}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alertes en retard */}
      {(alertesUrgentes?.length ?? 0) > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#dc2626', display: 'inline-block', boxShadow: '0 0 0 3px rgba(220,38,38,0.15)' }} />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#dc2626', margin: 0 }}>
              En retard — {alertesUrgentes!.length} alerte{alertesUrgentes!.length > 1 ? 's' : ''}
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alertesUrgentes!.map((a: any) => <AlerteCard key={a.id} alerte={a} retard />)}
          </div>
        </div>
      )}

      {/* Alertes dans 30 jours */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#67BAF4', display: 'inline-block' }} />
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0c0c14', margin: 0 }}>
            À venir — 30 prochains jours
          </h2>
          {(alertes30j?.length ?? 0) === 0 && (
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>aucune alerte</span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alertes30j?.map((a: any) => <AlerteCard key={a.id} alerte={a} retard={false} />)}
        </div>
      </div>

      {alertesUrgentes?.length === 0 && alertes30j?.length === 0 && (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#16a34a' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0c0c14', marginBottom: 6 }}>Tout est à jour</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Aucune alerte dans les 30 prochains jours.</div>
        </div>
      )}
    </div>
  )
}

function AlerteCard({ alerte, retard }: { alerte: any, retard: boolean }) {
  const jours = joursRestants(alerte.date_echeance)
  const client = alerte.clients
  const vehicule = alerte.vehicules
  const isRevision = alerte.type === 'revision'

  return (
    <div className="card" style={{
      padding: '14px 18px',
      borderLeft: `3px solid ${retard ? '#dc2626' : isRevision ? '#67BAF4' : '#1E466B'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Link href={`/clients/${alerte.client_id}`} style={{ fontSize: 14, fontWeight: 600, color: '#0c0c14', textDecoration: 'none' }}>
            {client?.prenom} {client?.nom}
          </Link>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
            background: isRevision ? '#eff8ff' : '#edf3f9',
            color: isRevision ? '#0284c7' : '#1E466B',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {isRevision ? 'Révision' : 'Renouvellement'}
          </span>
        </div>
        <div style={{ fontSize: 12.5, color: '#64748b' }}>
          {vehicule?.marque} {vehicule?.modele} · {formatDate(alerte.date_echeance)}
          {' '}
          <span style={{ fontWeight: 600, color: retard ? '#dc2626' : jours <= 7 ? '#d97706' : '#64748b' }}>
            ({retard ? `${Math.abs(jours)}j de retard` : `dans ${jours}j`})
          </span>
        </div>
        {client?.telephone && (
          <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 3 }}>{client.telephone}</div>
        )}
      </div>
      <AlerteActions id={alerte.id} statut={alerte.statut} relance_statut={alerte.relance_statut} date_echeance={alerte.date_echeance} />
    </div>
  )
}
