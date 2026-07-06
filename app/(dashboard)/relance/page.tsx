import { createClient } from '@/lib/supabase/server'
import RelanceMode from '@/components/RelanceMode'

export default async function RelancePage() {
  const supabase = await createClient()

  const { data: alertes } = await supabase
    .from('alertes')
    .select('id, client_id, date_echeance, type, relance_statut, clients(nom, prenom, telephone, email), vehicules(marque, modele, immatriculation)')
    .eq('statut', 'pending')
    .order('date_echeance', { ascending: true })

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0c0c14', marginBottom: 4 }}>Mode relance</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>
          {alertes?.length ?? 0} client{(alertes?.length ?? 0) > 1 ? 's' : ''} à contacter — traite-les un par un.
        </p>
      </div>
      <RelanceMode alertes={(alertes ?? []) as any} />
    </div>
  )
}
