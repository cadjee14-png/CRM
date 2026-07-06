import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const montant_min = searchParams.get('montant_min')
  const montant_max = searchParams.get('montant_max')
  const sans_montant = searchParams.get('sans_montant')
  const inclureSansMontant = sans_montant === '1'
  const hasMontantFilter = !!(montant_min || montant_max)

  const supabase = createAdminClient()

  let query = supabase
    .from('clients')
    .select('*, vehicules(id), alertes(id, statut)')
    .order('nom', { ascending: true })

  if (q) query = query.or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,telephone.ilike.%${q}%,email.ilike.%${q}%`)

  const { data: allClients } = await query

  const montantMap = new Map<string, number | null>()
  if (allClients && allClients.length > 0) {
    const clientIds = allClients.map((c: any) => c.id)
    const { data: revisions } = await supabase
      .from('revisions')
      .select('client_id, montant, date_revision')
      .in('client_id', clientIds)
      .order('date_revision', { ascending: false })

    for (const id of clientIds) montantMap.set(id, null)
    if (revisions) {
      for (const r of revisions) {
        if (montantMap.get(r.client_id) === null && r.montant != null) {
          montantMap.set(r.client_id, Number(r.montant))
        }
      }
    }
  }

  let clients = allClients ?? []
  if (hasMontantFilter) {
    const min = montant_min ? parseFloat(montant_min) : null
    const max = montant_max ? parseFloat(montant_max) : null
    clients = clients.filter((c: any) => {
      const m = montantMap.get(c.id)
      if (m === null || m === undefined) return inclureSansMontant
      if (min !== null && m < min) return false
      if (max !== null && m > max) return false
      return true
    })
  }

  const headers = ['Prénom', 'Nom', 'Téléphone', 'Email', 'Tags', 'Note', 'Nb véhicules', 'Nb alertes actives', 'Dernier montant', 'Inscrit le']
  const rows = clients.map((c: any) => {
    const alertesPending = c.alertes?.filter((a: any) => a.statut === 'pending').length ?? 0
    const montant = montantMap.get(c.id)
    return [
      c.prenom ?? '',
      c.nom ?? '',
      c.telephone ?? '',
      c.email ?? '',
      c.tags ?? '',
      c.note ?? '',
      c.vehicules?.length ?? 0,
      alertesPending,
      montant != null ? montant.toFixed(2) : '',
      new Date(c.created_at).toLocaleDateString('fr-FR'),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')
  })

  const csv = [headers.join(';'), ...rows].join('\n')
  const bom = '\uFEFF'

  return new NextResponse(bom + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="clients-nourian-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
