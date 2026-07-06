import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClientEditForm from './ClientEditForm'
import VehiculeForm from './VehiculeForm'
import AlerteActions from '@/components/AlerteActions'
import AddAlerteForm from '@/components/AddAlerteForm'
import DeleteClientBtn from './DeleteClientBtn'
import RevisionHistory from './RevisionHistory'

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateShort(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function joursRestants(echeance: string) {
  const diff = new Date(echeance).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: client }, { data: vehicules }, { data: alertes }, { data: revisions }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('vehicules').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    supabase
      .from('alertes')
      .select('*, vehicules(marque, modele)')
      .eq('client_id', id)
      .order('date_echeance', { ascending: true }),
    supabase
      .from('revisions')
      .select('*, vehicules(marque, modele)')
      .eq('client_id', id)
      .order('date_revision', { ascending: false }),
  ])

  if (!client) notFound()

  const alertesPending = alertes?.filter((a) => a.statut === 'pending') ?? []
  const derniereRevision = revisions?.[0] ?? null
  const prochaineAlerte = alertesPending[0] ?? null

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Breadcrumb */}
      <Link href="/clients" style={{ fontSize: 13, color: '#4a4a58', textDecoration: 'none', marginBottom: 16, display: 'inline-block' }}>
        ← Clients
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0c0c14', marginBottom: 4 }}>
            {client.civilite ? `${client.civilite} ` : ''}{client.prenom} {client.nom}
          </h1>
          <p style={{ fontSize: 13, color: '#8a8a9a' }}>
            Client enregistré le {formatDate(client.created_at)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {client.telephone && (
            <a
              href={`tel:${client.telephone}`}
              style={{ padding: '8px 16px', background: '#f0f5fa', border: '1px solid #e3eaf3', borderRadius: 8, fontSize: 13, color: '#1E466B', textDecoration: 'none', fontWeight: 500 }}
            >
              Appeler
            </a>
          )}
          <DeleteClientBtn id={id} />
        </div>
      </div>

      {/* Carte synthèse */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <SynthCard
          label="Dernière visite"
          value={derniereRevision ? formatDateShort(derniereRevision.date_revision) : '—'}
          sub={derniereRevision?.montant != null ? `${Number(derniereRevision.montant).toFixed(0)} €` : derniereRevision ? 'Montant non renseigné' : 'Aucune visite enregistrée'}
          color={derniereRevision ? '#1E466B' : '#c8d4e0'}
        />
        <SynthCard
          label="Prochain entretien"
          value={prochaineAlerte ? formatDateShort(prochaineAlerte.date_echeance) : '—'}
          sub={prochaineAlerte ? (() => {
            const j = joursRestants(prochaineAlerte.date_echeance)
            return j < 0 ? `${Math.abs(j)} jours de retard` : j === 0 ? "Aujourd'hui" : `Dans ${j} jours`
          })() : 'Aucune échéance'}
          color={prochaineAlerte ? (joursRestants(prochaineAlerte.date_echeance) < 0 ? '#dc2626' : '#d97706') : '#c8d4e0'}
        />
        <SynthCard
          label="Passages au garage"
          value={revisions?.length ? String(revisions.length) : '0'}
          sub={revisions?.length ? `depuis ${formatDateShort(revisions[revisions.length - 1].date_revision)}` : 'Aucun historique'}
          color={revisions?.length ? '#16a34a' : '#c8d4e0'}
        />
        <SynthCard
          label="Véhicules"
          value={String(vehicules?.length ?? 0)}
          sub={vehicules?.length === 1 ? vehicules[0].marque + ' ' + vehicules[0].modele : vehicules?.length ? `${vehicules.length} véhicules` : 'Aucun véhicule'}
          color={vehicules?.length ? '#1E466B' : '#c8d4e0'}
        />
      </div>

      {/* Alertes actives */}
      {alertesPending.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#d97706', marginBottom: 10 }}>
            {alertesPending.length} entretien{alertesPending.length > 1 ? 's' : ''} à planifier
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alertesPending.map((a: any) => {
              const jours = joursRestants(a.date_echeance)
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ fontSize: 13, color: '#0c0c14' }}>
                    <span style={{ fontWeight: 500 }}>
                      {a.type === 'revision' ? 'Révision annuelle' : 'Renouvellement véhicule'}
                    </span>
                    {a.vehicules && <span style={{ color: '#6b7280' }}> — {a.vehicules.marque} {a.vehicules.modele}</span>}
                    <span style={{ color: '#6b7280' }}> — prévu le {formatDate(a.date_echeance)}</span>
                    {' '}
                    <span style={{ color: jours < 0 ? '#dc2626' : '#d97706', fontWeight: 500 }}>
                      ({jours < 0 ? `${Math.abs(jours)} jours de retard` : jours === 0 ? "aujourd'hui" : `dans ${jours} jours`})
                    </span>
                  </div>
                  <AlerteActions id={a.id} statut={a.statut} relance_statut={a.relance_statut} date_echeance={a.date_echeance} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Infos client */}
        <div style={{ background: '#ffffff', border: '1px solid #e3eaf3', borderRadius: 12, padding: '20px 24px' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0c0c14', marginBottom: 16 }}>Informations</h2>
          <ClientEditForm client={client} />
        </div>

        {/* Contact rapide */}
        <div style={{ background: '#ffffff', border: '1px solid #e3eaf3', borderRadius: 12, padding: '20px 24px' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0c0c14', marginBottom: 16 }}>Contact rapide</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {client.telephone ? (
              <>
                <a
                  href={`tel:${client.telephone}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f0f5fa', borderRadius: 8, textDecoration: 'none', color: '#1E466B', fontSize: 14, fontWeight: 500 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6 19.79 19.79 0 0 1 1.61 5.05C1.61 3.96 2.5 3 3.57 3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 10.5a16 16 0 0 0 6 6l.72-.72a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  {client.telephone}
                </a>
                <a
                  href={`https://wa.me/${client.telephone.replace(/\s/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, textDecoration: 'none', color: '#16a34a', fontSize: 14, fontWeight: 500 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" /></svg>
                  WhatsApp
                </a>
              </>
            ) : (
              <div style={{ fontSize: 13, color: '#8a8a9a' }}>Aucun numéro renseigné</div>
            )}
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f4f7fb', borderRadius: 8, textDecoration: 'none', color: '#4a4a58', fontSize: 14, fontWeight: 500 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                {client.email}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Véhicules */}
      <div style={{ background: '#ffffff', border: '1px solid #e3eaf3', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0c0c14', marginBottom: 16 }}>Véhicules</h2>

        {vehicules?.length === 0 ? (
          <div style={{ fontSize: 13, color: '#8a8a9a', marginBottom: 16 }}>Aucun véhicule enregistré.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {vehicules!.map((v: any) => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#f4f7fb', borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0c0c14', marginBottom: 4 }}>
                    {v.marque} {v.modele}
                    {v.immatriculation && (
                      <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, color: '#1E466B', background: '#edf3f9', padding: '2px 7px', borderRadius: 5 }}>
                        {v.immatriculation}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {v.date_mec && (
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        <span style={{ color: '#94a3b8' }}>Mise en circulation :</span> {formatDate(v.date_mec)}
                      </span>
                    )}
                    {v.type_relation === 'achat' && v.date_achat && (
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        <span style={{ color: '#94a3b8' }}>Acheté chez nous le :</span> {formatDate(v.date_achat)}
                      </span>
                    )}
                    {v.type_relation === 'revision' && v.date_derniere_revision && (
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        <span style={{ color: '#94a3b8' }}>Dernière visite au garage :</span> {formatDate(v.date_derniere_revision)}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                  background: v.type_relation === 'achat' ? '#f0f5fa' : '#eff8ff',
                  color: v.type_relation === 'achat' ? '#1E466B' : '#67BAF4',
                  textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
                }}>
                  {v.type_relation === 'achat' ? 'Achat' : 'Entretien'}
                </span>
              </div>
            ))}
          </div>
        )}

        <VehiculeForm clientId={id} />
      </div>

      {/* Historique révisions */}
      <RevisionHistory
        clientId={id}
        vehicules={(vehicules ?? []).map((v: any) => ({ id: v.id, marque: v.marque, modele: v.modele, immatriculation: v.immatriculation }))}
        revisions={revisions ?? []}
      />

      {/* Échéances */}
      <div style={{ background: '#ffffff', border: '1px solid #e3eaf3', borderRadius: 12, padding: '20px 24px' }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0c0c14', marginBottom: 4 }}>Échéances</h2>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Dates de révision et renouvellement.</p>
        {alertes?.length === 0 ? (
          <div style={{ fontSize: 13, color: '#8a8a9a', marginBottom: 12 }}>Aucune échéance pour ce client.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
            {alertes!.map((a: any) => {
              const jours = joursRestants(a.date_echeance)
              const retard = jours < 0
              return (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', background: '#f4f7fb', borderRadius: 8, gap: 12,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0c0c14' }}>
                      {a.type === 'revision' ? 'Révision annuelle' : 'Renouvellement véhicule'}
                      {a.vehicules && <span style={{ fontWeight: 400, color: '#6b7280' }}> — {a.vehicules.marque} {a.vehicules.modele}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                      Prévu le {formatDate(a.date_echeance)}
                      {a.statut === 'pending' && (
                        <span style={{ marginLeft: 6, color: retard ? '#dc2626' : jours <= 30 ? '#d97706' : '#94a3b8', fontWeight: 500 }}>
                          · {retard ? `${Math.abs(jours)} jours de retard` : jours === 0 ? "aujourd'hui" : `dans ${jours} jours`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em',
                      background: a.statut === 'fait' ? '#f0fdf4' : a.statut === 'snooze' ? '#f9fafb' : retard ? '#fef2f2' : '#fffbeb',
                      color: a.statut === 'fait' ? '#16a34a' : a.statut === 'snooze' ? '#8a8a9a' : retard ? '#dc2626' : '#d97706',
                    }}>
                      {a.statut === 'fait' ? 'Effectué' : a.statut === 'snooze' ? 'Reporté' : retard ? 'En retard' : 'À venir'}
                    </span>
                    <AlerteActions id={a.id} statut={a.statut} relance_statut={a.relance_statut} date_echeance={a.date_echeance} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <AddAlerteForm
          clientId={id}
          vehicules={(vehicules ?? []).map((v: any) => ({ id: v.id, marque: v.marque, modele: v.modele, immatriculation: v.immatriculation }))}
        />
      </div>
    </div>
  )
}

function SynthCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e3eaf3', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color, marginBottom: 4, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.4 }}>{sub}</div>
    </div>
  )
}
