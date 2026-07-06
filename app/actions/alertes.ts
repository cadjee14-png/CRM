'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/alertes')
  revalidatePath('/relance')
  revalidatePath('/stats')
}

export async function updateStatutAlerte(id: string, statut: 'pending' | 'fait') {
  const supabase = await createClient()

  if (statut === 'fait') {
    const { data: alerte } = await supabase
      .from('alertes')
      .select('client_id, vehicule_id, type, date_echeance')
      .eq('id', id)
      .single()

    if (alerte?.date_echeance) {
      const next = new Date(alerte.date_echeance)
      next.setFullYear(next.getFullYear() + 1)
      await supabase.from('alertes').insert({
        client_id: alerte.client_id,
        vehicule_id: alerte.vehicule_id,
        type: alerte.type,
        date_echeance: next.toISOString().split('T')[0],
        statut: 'pending',
      })
    }
  }

  const { error } = await supabase.from('alertes').update({ statut }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidateAll()
}

export async function snoozeAlerte(id: string, days: number) {
  const supabase = await createClient()
  const newDate = new Date()
  newDate.setDate(newDate.getDate() + days)
  const { error } = await supabase
    .from('alertes')
    .update({ date_echeance: newDate.toISOString().split('T')[0], statut: 'pending' })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidateAll()
}

export async function archiveOldAlertes(beforeYear: number) {
  const supabase = await createClient()
  const cutoff = `${beforeYear}-01-01`
  const { error } = await supabase
    .from('alertes')
    .update({ statut: 'archive' })
    .eq('statut', 'pending')
    .lt('date_echeance', cutoff)
  if (error) throw new Error(error.message)
  revalidateAll()
}

export async function updateNoteAlerte(id: string, note: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('alertes').update({ note }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/alertes')
}

export async function updateRelanceStatut(id: string, relance_statut: string | null) {
  const supabase = await createClient()
  const { error } = await supabase.from('alertes').update({ relance_statut }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidateAll()
}

export async function updateEcheanceAlerte(id: string, date_echeance: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('alertes').update({ date_echeance }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidateAll()
}

export async function createAlerteManuelle(clientId: string, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('alertes').insert({
    client_id: clientId,
    vehicule_id: (formData.get('vehicule_id') as string) || null,
    type: formData.get('type') as string,
    date_echeance: formData.get('date_echeance') as string,
    statut: 'pending',
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/clients/${clientId}`)
  revalidateAll()
}
