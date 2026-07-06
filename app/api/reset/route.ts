import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { tables } = await request.json() as { tables: string[] }
  if (!tables || tables.length === 0) {
    return NextResponse.json({ error: 'Aucune table sélectionnée' }, { status: 400 })
  }

  const supabase = await createClient()
  const errors: string[] = []

  // Ordre FK-safe : d'abord les tables dépendantes
  const order = ['revisions', 'alertes', 'vehicules', 'clients']
  // Si clients est sélectionné, on force aussi les dépendantes
  const toDelete = tables.includes('clients')
    ? order
    : order.filter((t) => tables.includes(t))

  for (const table of toDelete) {
    const { error } = await supabase.from(table).delete().not('id', 'is', null)
    if (error) errors.push(`${table}: ${error.message}`)
  }

  return NextResponse.json({ ok: errors.length === 0, errors })
}
