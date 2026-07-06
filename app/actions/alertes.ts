'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/alertes')
  revalidatePath('/relance')
  revalidatePath('/stats')
}

export async function updateStatutAlerte(
  id: string,
  statut: 'pending' | 'fait',
  montant?: number,
  clientId?: string,
  vehiculeId?: string,
  dateEcheance?: string,
) {
  const supabase = createAdminClient()

  if (statut === 'fait') {
    const { data: alerte } = await supabase
      .from('alertes')
      .select('client_id, vehicule_id, type, date_echeance')
      .eq('id', id)
      .single()

    const a = alerte ?? { client_id: clientId, vehicule_id: vehiculeId, type: 'revision', date_echeance: dateEcheance }

    if (a.date_echeance) {
      const next = new Date(a.date_echeance)
      next.setFullYear(next.getFullYear() + 1)
      await supabase.from('alertes').insert({
        client_id: a.client_id,
        vehicule_id: a.vehicule_id,
        type: a.type,
        date_echeance: next.toISOString().split('T')[0],
        statut: 'pending',
      })
    }

    if (a.client_id) {
      await supabase.from('revisions').insert({
        client_id: a.client_id,
        vehicule_id: a.vehicule_id ?? null,
        alerte_id: id,
        montant: montant ?? null,
        date_revision: a.date_echeance ?? new Date().toISOString().split('T')[0],
      })
    }
  }

  const { error } = await supabase.from('alertes').update({ statut }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidateAll()
}

export async function snoozeAlerte(id: string, days: number) {
  const supabase = createAdminClient()
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
  const supabase = createAdminClient()
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
  const supabase = createAdminClient()
  const { error } = await supabase.from('alertes').update({ note }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/alertes')
}

export async function updateRelanceStatut(id: string, relance_statut: string | null) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('alertes').update({ relance_statut }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidateAll()
}

export async function updateEcheanceAlerte(id: string, date_echeance: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('alertes').update({ date_echeance }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidateAll()
}

export async function createAlerteManuelle(clientId: string, formData: FormData) {
  const supabase = createAdminClient()
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
