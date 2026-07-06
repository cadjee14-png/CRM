'use client'

export default function ExportBtn({ href, label }: { href: string, label: string }) {
  return (
    <a
      href={href}
      download
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '9px 14px', background: '#ffffff',
        border: '1px solid #e8eef5', borderRadius: 9,
        fontSize: 13, fontWeight: 500, color: '#4a5568',
        textDecoration: 'none', cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        transition: 'background 0.12s',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {label}
    </a>
  )
}
