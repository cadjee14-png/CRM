'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createClientAction(formData: FormData) {
  const supabase = await createClient()

  const data = {
    civilite: formData.get('civilite') as string || null,
    nom: formData.get('nom') as string,
    prenom: formData.get('prenom') as string,
    email: formData.get('email') as string || null,
    telephone: formData.get('telephone') as string || null,
  }

  const { data: client, error } = await supabase
    .from('clients')
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/clients')
  redirect(`/clients/${client.id}`)
}

export async function updateClientAction(id: string, formData: FormData) {
  const supabase = await createClient()

  const data = {
    civilite: formData.get('civilite') as string || null,
    nom: formData.get('nom') as string,
    prenom: formData.get('prenom') as string,
    email: formData.get('email') as string || null,
    telephone: formData.get('telephone') as string || null,
    note: formData.get('note') as string || null,
    tags: formData.get('tags') as string || null,
  }

  const { error } = await supabase.from('clients').update(data).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath(`/clients/${id}`)
  revalidatePath('/clients')
}

export async function deleteClientAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/clients')
  redirect('/clients')
}
