import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const formData = await request.formData()

  const { data, error } = await supabase
    .from('clients')
    .insert({
      civilite: (formData.get('civilite') as string) || null,
      nom: formData.get('nom') as string,
      prenom: formData.get('prenom') as string,
      email: (formData.get('email') as string) || null,
      telephone: (formData.get('telephone') as string) || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ id: data.id })
}
