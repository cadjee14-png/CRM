import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { count: alertesUrgentes } = await supabase
    .from('alertes')
    .select('*', { count: 'exact', head: true })
    .eq('statut', 'pending')
    .lte('date_echeance', today)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar alertesBadge={alertesUrgentes ?? 0} />
      <main className="dashboard-main" style={{ flex: 1, padding: 'clamp(24px, 3vw, 40px)', background: '#f0f4f9', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
