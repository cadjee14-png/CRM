'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function calcEcheance(typeRelation: string, dateAchat?: string, dateRevision?: string): string {
  if (typeRelation === 'achat' && dateAchat) {
    const d = new Date(dateAchat)
    d.setFullYear(d.getFullYear() + 4)
    return d.toISOString().split('T')[0]
  }
  if (typeRelation === 'revision' && dateRevision) {
    const d = new Date(dateRevision)
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().split('T')[0]
  }
  return ''
}

export async function createVehiculeAction(clientId: string, formData: FormData) {
  const supabase = await createClient()

  const typeRelation = formData.get('type_relation') as string
  const dateAchat = formData.get('date_achat') as string || null
  const dateRevision = formData.get('date_derniere_revision') as string || null

  const { data: vehicule, error } = await supabase
    .from('vehicules')
    .insert({
      client_id: clientId,
      marque: formData.get('marque') as string,
      modele: formData.get('modele') as string,
      immatriculation: formData.get('immatriculation') as string || null,
      date_mec: formData.get('date_mec') as string || null,
      type_relation: typeRelation,
      date_achat: dateAchat,
      date_derniere_revision: dateRevision,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Créer l'alerte automatiquement
  const echeance = calcEcheance(typeRelation, dateAchat ?? undefined, dateRevision ?? undefined)
  if (echeance) {
    const typeAlerte = typeRelation === 'achat' ? 'renouvellement' : 'revision'
    await supabase.from('alertes').insert({
      client_id: clientId,
      vehicule_id: vehicule.id,
      type: typeAlerte,
      date_echeance: echeance,
      statut: 'pending',
    })
  }

  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/alertes')
  revalidatePath('/')
}

export async function deleteVehiculeAction(vehiculeId: string, clientId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('vehicules').delete().eq('id', vehiculeId)
  if (error) throw new Error(error.message)

  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/alertes')
  revalidatePath('/')
}
