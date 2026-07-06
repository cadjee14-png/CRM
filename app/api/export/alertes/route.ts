import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const statut = searchParams.get('statut')
  const montant_min = searchParams.get('montant_min')
  const montant_max = searchParams.get('montant_max')
  const sans_montant = searchParams.get('sans_montant')
  const inclureSansMontant = sans_montant === '1'
  const hasMontantFilter = !!(montant_min || montant_max)

  const supabase = await createClient()

  let query = supabase
    .from('alertes')
    .select('*, clients(nom, prenom, telephone, email), vehicules(marque, modele, immatriculation)')
    .order('date_echeance', { ascending: true })

  if (type) query = query.eq('type', type)
  if (statut) query = query.eq('statut', statut)
  else query = query.eq('statut', 'pending')

  const { data: rawAlertes } = await query

  const montantMap = new Map<string, number | null>()
  if (rawAlertes && rawAlertes.length > 0) {
    const clientIds = [...new Set(rawAlertes.map((a: any) => a.client_id))]
    const { data: revisions } = await supabase
      .from('revisions')
      .select('client_id, montant, date_revision')
      .in('client_id', clientIds as string[])
      .order('date_revision', { ascending: false })

    for (const id of clientIds) montantMap.set(id as string, null)
    if (revisions) {
      for (const r of revisions) {
        if (montantMap.get(r.client_id) === null && r.montant != null) {
          montantMap.set(r.client_id, Number(r.montant))
        }
      }
    }
  }

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

  const today = new Date().setHours(0, 0, 0, 0)

  const relanceLabel: Record<string, string> = {
    appele_nr: 'Appelé — NR',
    a_rappeler: 'À rappeler',
    rdv_pris: 'RDV pris',
  }

  const headers = ['Prénom', 'Nom', 'Téléphone', 'Email', 'Type', 'Échéance', 'Jours restants', 'Véhicule', 'Immatriculation', 'Dernier montant', 'Statut relance']
  const rows = alertes.map((a: any) => {
    const diff = new Date(a.date_echeance).getTime() - today
    const jours = Math.ceil(diff / (1000 * 60 * 60 * 24))
    const montant = montantMap.get(a.client_id)
    return [
      a.clients?.prenom ?? '',
      a.clients?.nom ?? '',
      a.clients?.telephone ?? '',
      a.clients?.email ?? '',
      a.type === 'revision' ? 'Révision' : 'Renouvellement',
      a.date_echeance,
      jours,
      a.vehicules ? `${a.vehicules.marque} ${a.vehicules.modele}` : '',
      a.vehicules?.immatriculation ?? '',
      montant != null ? montant.toFixed(2) : '',
      a.relance_statut ? (relanceLabel[a.relance_statut] ?? a.relance_statut) : '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')
  })

  const csv = [headers.join(';'), ...rows].join('\n')
  const bom = '\uFEFF'

  return new NextResponse(bom + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="relance-alertes-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
