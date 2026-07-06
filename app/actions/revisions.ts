'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createRevisionAction(clientId: string, formData: FormData) {
  const supabase = createAdminClient()

  const vehiculeId = formData.get('vehicule_id') as string || null

  const { error } = await supabase.from('revisions').insert({
    client_id: clientId,
    vehicule_id: vehiculeId || null,
    date_revision: formData.get('date_revision') as string,
    montant: formData.get('montant') ? parseFloat(formData.get('montant') as string) : null,
    note: formData.get('note') as string || null,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/clients/${clientId}`)
}

export async function deleteRevisionAction(revisionId: string, clientId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('revisions').delete().eq('id', revisionId)
  if (error) throw new Error(error.message)
  revalidatePath(`/clients/${clientId}`)
}
