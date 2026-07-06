import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) return NextResponse.json([])

  const supabase = await createClient()

  const [{ data: byClient }, { data: byVehicule }] = await Promise.all([
    supabase
      .from('clients')
      .select('id, nom, prenom, telephone')
      .or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,telephone.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(6),
    supabase
      .from('vehicules')
      .select('client_id, marque, modele, immatriculation, clients(id, nom, prenom, telephone)')
      .ilike('immatriculation', `%${q}%`)
      .limit(4),
  ])

  const results: { id: string; label: string; sub: string }[] = []
  const seen = new Set<string>()

  for (const c of byClient ?? []) {
    if (!seen.has(c.id)) {
      seen.add(c.id)
      results.push({ id: c.id, label: `${c.prenom} ${c.nom}`, sub: c.telephone ?? '' })
    }
  }

  for (const v of byVehicule ?? []) {
    const c = (v as any).clients
    if (c && !seen.has(c.id)) {
      seen.add(c.id)
      results.push({
        id: c.id,
        label: `${c.prenom} ${c.nom}`,
        sub: `${v.immatriculation} — ${v.marque} ${v.modele}`,
      })
    }
  }

  return NextResponse.json(results.slice(0, 8))
}
