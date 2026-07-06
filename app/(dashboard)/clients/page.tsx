import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ExportBtn from '@/components/ExportBtn'
import ClientsTable from '@/components/ClientsTable'

const PER_PAGE = 50

function buildHref(params: { q?: string; sort?: string; order?: string; page?: number }) {
  const p = new URLSearchParams()
  if (params.q) p.set('q', params.q)
  if (params.sort) p.set('sort', params.sort)
  if (params.order) p.set('order', params.order)
  if (params.page && params.page > 1) p.set('page', String(params.page))
  const str = p.toString()
  return `/clients${str ? `?${str}` : ''}`
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; order?: string; page?: string }>
}) {
  const { q, sort, order, page } = await searchParams
  const activeSort = sort || 'nom'
  const activeOrder = order || 'asc'
  const currentPage = parseInt(page ?? '1') || 1

  const supabase = await createClient()

  let query = supabase
    .from('clients')
    .select('*, vehicules(id), alertes(id, statut)')

  if (q) query = query.or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,telephone.ilike.%${q}%,email.ilike.%${q}%`)

  const { data: allClients } = await query

  let clients = allClients ?? []

  clients = [...clients].sort((a: any, b: any) => {
    let va: any, vb: any
    if (activeSort === 'alertes') {
      va = a.alertes?.filter((x: any) => x.statut === 'pending').length ?? 0
      vb = b.alertes?.filter((x: any) => x.statut === 'pending').length ?? 0
    } else if (activeSort === 'vehicules') {
      va = a.vehicules?.length ?? 0
      vb = b.vehicules?.length ?? 0
    } else {
      va = `${a.nom ?? ''} ${a.prenom ?? ''}`.toLowerCase()
      vb = `${b.nom ?? ''} ${b.prenom ?? ''}`.toLowerCase()
    }
    if (va < vb) return activeOrder === 'asc' ? -1 : 1
    if (va > vb) return activeOrder === 'asc' ? 1 : -1
    return 0
  })

  const totalCount = clients.length
  const totalPages = Math.ceil(totalCount / PER_PAGE)
  const pagedClients = clients.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  const exportHref = `/api/export/clients${q ? `?q=${encodeURIComponent(q)}` : ''}`

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0c0c14', marginBottom: 3, letterSpacing: '-0.02em' }}>Clients</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>
            {totalCount} client{totalCount > 1 ? 's' : ''}
            {totalPages > 1 && ` — page ${currentPage}/${totalPages}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ExportBtn href={exportHref} label="Export CSV" />
          <Link href="/clients/nouveau" className="btn-primary" style={{ fontSize: 13 }}>
            + Nouveau client
          </Link>
        </div>
      </div>

      {/* Recherche */}
      <form method="GET" style={{ marginBottom: 20 }}>
        {sort && <input type="hidden" name="sort" value={sort} />}
        {order && <input type="hidden" name="order" value={order} />}
        <div style={{ position: 'relative', maxWidth: 440 }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            name="q"
            defaultValue={q}
            placeholder="Rechercher par nom, téléphone, email..."
            style={{
              width: '100%', padding: '10px 14px 10px 36px',
              border: '1px solid #e8eef5', borderRadius: 9,
              fontSize: 13.5, background: '#ffffff', color: '#0c0c14',
              fontFamily: 'inherit', boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          />
        </div>
      </form>

      {clients.length === 0 ? (
        <div className="card" style={{ padding: 56, textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, background: '#edf3f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#1E466B' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0c0c14', marginBottom: 6 }}>
            {q ? 'Aucun résultat' : 'Aucun client pour l\'instant'}
          </div>
          {!q && (
            <Link href="/clients/nouveau" className="btn-primary" style={{ fontSize: 13 }}>
              Ajouter un client
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="card" style={{ overflow: 'hidden' }}>
            <ClientsTable
              clients={pagedClients as any}
              allClientIds={clients.map((c: any) => c.id)}
              activeSort={activeSort}
              activeOrder={activeOrder}
              urlParams={{ ...(q ? { q } : {}) }}
            />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 }}>
              {currentPage > 1 && (
                <Link href={buildHref({ q, sort, order, page: currentPage - 1 })} className="btn-ghost" style={{ fontSize: 13, padding: '7px 14px' }}>
                  ← Préc.
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} style={{ fontSize: 13, color: '#94a3b8', padding: '0 4px' }}>…</span>
                  ) : (
                    <Link
                      key={p}
                      href={buildHref({ q, sort, order, page: p as number })}
                      style={{
                        padding: '7px 12px', fontSize: 13, borderRadius: 7, textDecoration: 'none',
                        background: p === currentPage ? '#1E466B' : '#fff',
                        color: p === currentPage ? '#fff' : '#4a5568',
                        border: `1px solid ${p === currentPage ? '#1E466B' : '#e8eef5'}`,
                        fontWeight: p === currentPage ? 600 : 400,
                      }}
                    >
                      {p}
                    </Link>
                  )
                )}
              {currentPage < totalPages && (
                <Link href={buildHref({ q, sort, order, page: currentPage + 1 })} className="btn-ghost" style={{ fontSize: 13, padding: '7px 14px' }}>
                  Suiv. →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
