import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { ids } = await request.json() as { ids: string[] }
  if (!ids || ids.length === 0) {
    return NextResponse.json({ error: 'Aucun client sélectionné' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const errors: string[] = []

  // Supprimer les dépendances en premier (si pas de CASCADE FK)
  for (const table of ['revisions', 'alertes', 'vehicules'] as const) {
    const { error } = await supabase.from(table).delete().in('client_id', ids)
    if (error) errors.push(`${table}: ${error.message}`)
  }

  const { error } = await supabase.from('clients').delete().in('id', ids)
  if (error) errors.push(`clients: ${error.message}`)

  return NextResponse.json({ ok: errors.length === 0, deleted: ids.length, errors })
}
