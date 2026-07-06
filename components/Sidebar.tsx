'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { logoutAction } from '@/app/actions/auth'
import GlobalSearch from './GlobalSearch'

const nav = [
  {
    href: '/',
    label: 'Tableau de bord',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/clients',
    label: 'Clients',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/alertes',
    label: 'Alertes',
    badge: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    href: '/relance',
    label: 'Mode relance',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6 19.79 19.79 0 0 1 1.61 5.05C1.61 3.96 2.5 3 3.57 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.5a16 16 0 0 0 6 6l.72-.72a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    href: '/stats',
    label: 'Statistiques',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    href: '/calendrier',
    label: 'Calendrier',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: '/import',
    label: 'Import CSV',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
]

export default function Sidebar({ alertesBadge = 0 }: { alertesBadge?: number }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* Hamburger (mobile only) */}
      <button className="sidebar-hamburger" onClick={() => setMobileOpen(true)} aria-label="Menu">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay (mobile) */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

    <aside className={`sidebar-desktop${mobileOpen ? ' is-open' : ''}`} style={{
      width: 248, minHeight: '100vh',
      background: '#ffffff', borderRight: '1px solid #e8eef5',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 18px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #1E466B 0%, #2a5f8f 100%)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(30,70,107,0.25)', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
              <rect x="9" y="11" width="14" height="10" rx="2" />
              <circle cx="12" cy="20" r="1" /><circle cx="20" cy="20" r="1" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0c0c14', letterSpacing: '-0.02em' }}>Nourian CRM</div>
            <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1 }}>Automobiles</div>
          </div>
        </div>
      </div>

      {/* Recherche globale */}
      <GlobalSearch />

      <div style={{ height: 1, background: '#f0f4f9', margin: '4px 16px 8px' }} />

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '4px 10px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#b0b8c4', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px 8px' }}>
          Menu
        </div>
        {nav.map((item) => {
          const active = isActive(item.href)
          const showBadge = item.badge && alertesBadge > 0
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 12px', borderRadius: 9,
              fontSize: 13.5, fontWeight: active ? 600 : 450,
              color: active ? '#1E466B' : '#4a5568',
              background: active ? 'linear-gradient(135deg, #edf3f9 0%, #e8f0f8 100%)' : 'transparent',
              textDecoration: 'none', marginBottom: 2,
              transition: 'all 0.12s', position: 'relative',
            }}>
              {active && (
                <span style={{ position: 'absolute', left: 0, top: '22%', bottom: '22%', width: 3, borderRadius: '0 3px 3px 0', background: '#1E466B' }} />
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: active ? '#1E466B' : '#94a3b8', transition: 'color 0.12s' }}>{item.icon}</span>
                {item.label}
              </div>
              {showBadge && (
                <span style={{
                  minWidth: 18, height: 18, background: '#dc2626', color: '#fff',
                  borderRadius: 20, fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 5px',
                }}>
                  {alertesBadge > 9 ? '9+' : alertesBadge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 14px 18px', borderTop: '1px solid #f0f4f9' }}>
        <div style={{
          background: '#f8fafd', borderRadius: 10, padding: '10px 12px', marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #1E466B, #67BAF4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>N</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0c0c14' }}>Nourian Auto</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Agent Peugeot · Citroën</div>
          </div>
        </div>
        <form action={logoutAction}>
          <button type="submit" style={{
            width: '100%', padding: '8px 12px',
            background: 'none', border: '1px solid #e8eef5', borderRadius: 8,
            fontSize: 12, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Se déconnecter
          </button>
        </form>
      </div>
    </aside>
    </>
  )
}
