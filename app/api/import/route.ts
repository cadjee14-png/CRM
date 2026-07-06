import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const maxDuration = 60

function parseDate(str: string): string | null {
  if (!str || str.trim() === '') return null
  const m = str.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) {
    let day = parseInt(m[1])
    let month = parseInt(m[2])
    const year = m[3]
    // Si le "mois" > 12, le format est MM/DD/YYYY → on inverse
    if (month > 12) { [day, month] = [month, day] }
    if (month < 1 || month > 12 || day < 1 || day > 31) return null
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str.trim())) return str.trim()
  return null
}

function parseCSV(text: string): Record<string, string>[] {
  const clean = text.replace(/^\uFEFF/, '')
  const lines = clean.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(';').map((h) => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map((line) => {
    const values = line.split(';').map((v) => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })

  const text = await file.text()
  const rows = parseCSV(text)
  if (rows.length === 0) return NextResponse.json({ error: 'Fichier vide ou format incorrect' }, { status: 400 })

  // 1. Construire les clients uniques (par nom+prenom)
  const clientMap = new Map<string, { civilite: string | null; nom: string; prenom: string; telephone: string | null; email: string | null }>()
  for (const row of rows) {
    const nom = (row['Nom'] || '').trim()
    const prenom = (row['Prénom'] || row['Prenom'] || '').trim()
    if (!nom && !prenom) continue
    const key = `${nom}|${prenom}`
    if (!clientMap.has(key)) {
      const telPort = (row['Tél. Portable'] || row['Tel. Portable'] || '').trim()
      const telPerso = (row['Tél. Personnel'] || row['Tel. Personnel'] || '').trim()
      clientMap.set(key, {
        civilite: (row['Civilité'] || row['Civilite'] || '').trim() || null,
        nom,
        prenom,
        telephone: telPort || telPerso || null,
        email: (row['Email'] || '').trim() || null,
      })
    }
  }

  if (clientMap.size === 0) return NextResponse.json({ error: 'Aucun client valide trouvé' }, { status: 400 })

  // 2. Bulk insert clients
  const clientsToInsert = Array.from(clientMap.values())
  const { data: insertedClients, error: clientsErr } = await supabase
    .from('clients')
    .insert(clientsToInsert)
    .select('id, nom, prenom')

  if (clientsErr) return NextResponse.json({ error: `Erreur clients: ${clientsErr.message}` }, { status: 500 })

  // 3. Map nom+prenom → id
  const idMap = new Map<string, string>()
  for (const c of insertedClients!) {
    idMap.set(`${c.nom}|${c.prenom}`, c.id)
  }

  // 4. Construire véhicules, alertes, révisions
  const vehiculesToInsert: any[] = []
  const alertesToInsert: any[] = []
  const revisionsToInsert: any[] = []
  const vehiculeKeySet = new Set<string>()

  for (const row of rows) {
    const nom = (row['Nom'] || '').trim()
    const prenom = (row['Prénom'] || row['Prenom'] || '').trim()
    if (!nom && !prenom) continue

    const clientId = idMap.get(`${nom}|${prenom}`)
    if (!clientId) continue

    const immatriculation = (row['Immatriculation'] || '').trim() || null
    const marque = (row['Marque'] || '').trim()
    const modele = (row['Modèle'] || row['Modele'] || '').trim()
    const dateMec = parseDate(row['Date MEC'] || '')
    const dateDoc = parseDate(row['Date du Document'] || row['Date du document'] || '')
    const dateProchRevision = parseDate(row['Date prochaine révision'] || row['Date prochaine revision'] || '')
    const montantRaw = (row['Montant TTC'] || '').replace(',', '.').trim()
    const montant = montantRaw ? parseFloat(montantRaw) : null

    // Si pas de date de dernière visite mais on a la prochaine révision,
    // on estime la dernière visite = prochaine révision - 1 an
    const dateVisite = dateDoc || (dateProchRevision ? (() => {
      const d = new Date(dateProchRevision)
      d.setFullYear(d.getFullYear() - 1)
      return d.toISOString().split('T')[0]
    })() : null)

    // Éviter les doublons de véhicule pour le même client
    const vehiculeKey = `${clientId}|${immatriculation || marque + modele}`
    if (vehiculeKeySet.has(vehiculeKey)) continue
    vehiculeKeySet.add(vehiculeKey)

    if (marque || modele || immatriculation) {
      vehiculesToInsert.push({
        client_id: clientId,
        marque: marque || 'Inconnu',
        modele: modele || '',
        immatriculation,
        date_mec: dateMec,
        type_relation: 'revision',
        date_derniere_revision: dateVisite,
        _clientId: clientId,
        _dateProch: dateProchRevision,
        _montant: montant,
        _dateDoc: dateVisite,
      })
    }
  }

  // 5. Bulk insert véhicules
  const vehiculesClean = vehiculesToInsert.map(({ _clientId, _dateProch, _montant, _dateDoc, ...v }) => v)
  const { data: insertedVehicules, error: vehicErr } = await supabase
    .from('vehicules')
    .insert(vehiculesClean)
    .select('id, client_id')

  if (vehicErr) return NextResponse.json({ error: `Erreur véhicules: ${vehicErr.message}` }, { status: 500 })

  // 6. Construire alertes et révisions en utilisant les IDs retournés
  for (let i = 0; i < insertedVehicules!.length; i++) {
    const v = insertedVehicules![i]
    const meta = vehiculesToInsert[i]

    if (meta._dateProch) {
      alertesToInsert.push({
        client_id: v.client_id,
        vehicule_id: v.id,
        type: 'revision',
        date_echeance: meta._dateProch,
        statut: 'pending',
      })
    }

    if (meta._dateDoc || meta._montant) {
      revisionsToInsert.push({
        client_id: v.client_id,
        vehicule_id: v.id,
        date_revision: meta._dateDoc || new Date().toISOString().split('T')[0],
        montant: meta._montant || null,
      })
    }
  }

  // 7. Bulk insert alertes + révisions
  const errors: string[] = []

  if (alertesToInsert.length > 0) {
    const { error: alertErr } = await supabase.from('alertes').insert(alertesToInsert)
    if (alertErr) errors.push(`Alertes: ${alertErr.message}`)
  }

  if (revisionsToInsert.length > 0) {
    const { error: revErr } = await supabase.from('revisions').insert(revisionsToInsert)
    if (revErr) errors.push(`Révisions: ${revErr.message}`)
  }

  return NextResponse.json({
    total: rows.length,
    created: insertedClients!.length,
    vehicules: insertedVehicules!.length,
    alertes: alertesToInsert.length,
    revisions: revisionsToInsert.length,
    errors,
    debug: {
      colonnes: rows.length > 0 ? Object.keys(rows[0]) : [],
      exemple_montant: rows.length > 0 ? rows[0]['Montant TTC'] : null,
      revisions_avec_montant: revisionsToInsert.filter(r => r.montant != null).length,
    },
  })
}
