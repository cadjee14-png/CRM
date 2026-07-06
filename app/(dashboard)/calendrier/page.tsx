import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CalendrierPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>
}) {
  const { mois } = await searchParams
  const today = new Date()

  let year: number, month: number
  if (mois && /^\d{4}-\d{2}$/.test(mois)) {
    ;[year, month] = mois.split('-').map(Number)
  } else {
    year = today.getFullYear()
    month = today.getMonth() + 1
  }

  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  const firstDayStr = `${year}-${pad(month)}-01`
  const lastDayStr = `${year}-${pad(month)}-${pad(lastDay.getDate())}`

  const supabase = await createClient()
  const { data: alertes } = await supabase
    .from('alertes')
    .select('id, client_id, date_echeance, type, statut, clients(nom, prenom)')
    .gte('date_echeance', firstDayStr)
    .lte('date_echeance', lastDayStr)
    .eq('statut', 'pending')
    .order('date_echeance', { ascending: true })

  const byDay = new Map<number, any[]>()
  for (const a of alertes ?? []) {
    const day = parseInt(a.date_echeance.split('-')[2])
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(a)
  }

  // Grille calendrier (semaine commence lundi)
  const startWeekday = (firstDay.getDay() + 6) % 7
  const daysInMonth = lastDay.getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)
  while (cells.length % 7 !== 0) cells.push(null)

  const prevM = month === 1 ? `${year - 1}-12` : `${year}-${pad(month - 1)}`
  const nextM = month === 12 ? `${year + 1}-01` : `${year}-${pad(month + 1)}`

  const monthLabel = new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0c0c14', marginBottom: 4, textTransform: 'capitalize' }}>
            {monthLabel}
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>
            {alertes?.length ?? 0} alerte{(alertes?.length ?? 0) !== 1 ? 's' : ''} ce mois
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href={`/calendrier?mois=${prevM}`} className="btn-ghost" style={{ fontSize: 13 }}>← Préc.</Link>
          {!isCurrentMonth && (
            <Link href="/calendrier" className="btn-ghost" style={{ fontSize: 13 }}>Aujourd'hui</Link>
          )}
          <Link href={`/calendrier?mois=${nextM}`} className="btn-ghost" style={{ fontSize: 13 }}>Suiv. →</Link>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {/* En-têtes jours */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e8eef5' }}>
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
            <div key={d} style={{
              padding: '10px 0', textAlign: 'center',
              fontSize: 11, fontWeight: 600, color: '#94a3b8',
              textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grille */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((day, i) => {
            const isToday = day !== null && day === today.getDate() && isCurrentMonth
            const dayAlertes = day ? (byDay.get(day) ?? []) : []
            const hasRetard = dayAlertes.some((a: any) => {
              const diff = new Date(a.date_echeance).getTime() - new Date().setHours(0, 0, 0, 0)
              return diff < 0
            })

            return (
              <div key={i} style={{
                minHeight: 96, padding: '8px 8px 6px',
                borderRight: (i + 1) % 7 !== 0 ? '1px solid #f0f4f9' : 'none',
                borderBottom: i < cells.length - 7 ? '1px solid #f0f4f9' : 'none',
                background: !day ? '#fafbfc' : 'transparent',
              }}>
                {day !== null && (
                  <>
                    <div style={{
                      fontSize: 12.5, fontWeight: isToday ? 700 : 400,
                      color: isToday ? '#fff' : '#0c0c14',
                      background: isToday ? '#1E466B' : 'transparent',
                      width: 26, height: 26, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 4,
                    }}>
                      {day}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {dayAlertes.slice(0, 3).map((a: any) => (
                        <Link
                          key={a.id}
                          href={`/clients/${a.client_id}`}
                          style={{
                            fontSize: 10.5, lineHeight: 1.3,
                            background: a.type === 'revision' ? '#eff8ff' : '#edf3f9',
                            color: a.type === 'revision' ? '#0284c7' : '#1E466B',
                            padding: '2px 5px', borderRadius: 4,
                            textDecoration: 'none', display: 'block',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}
                        >
                          {(a as any).clients?.prenom} {(a as any).clients?.nom}
                        </Link>
                      ))}
                      {dayAlertes.length > 3 && (
                        <div style={{ fontSize: 10, color: '#94a3b8', paddingLeft: 2 }}>
                          +{dayAlertes.length - 3} autre{dayAlertes.length - 3 > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: '#eff8ff', border: '1px solid #bfdbfe', display: 'inline-block' }} />
          <span style={{ fontSize: 12, color: '#64748b' }}>Révision</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: '#edf3f9', border: '1px solid #c8d9eb', display: 'inline-block' }} />
          <span style={{ fontSize: 12, color: '#64748b' }}>Renouvellement</span>
        </div>
      </div>
    </div>
  )
}
