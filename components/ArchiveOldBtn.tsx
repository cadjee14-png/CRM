'use client'

import { useTransition } from 'react'
import { archiveOldAlertes } from '@/app/actions/alertes'

export default function ArchiveOldBtn({ beforeYear }: { beforeYear: number }) {
  const [pending, startTransition] = useTransition()

  function handle() {
    if (!confirm(`Archiver toutes les alertes antérieures à ${beforeYear} ?\n\nElles ne seront plus visibles dans le dashboard.`)) return
    startTransition(() => archiveOldAlertes(beforeYear))
  }

  return (
    <button
      onClick={handle}
      disabled={pending}
      style={{
        padding: '7px 14px', fontSize: 12.5, fontWeight: 600,
        background: '#d97706', color: '#fff', border: 'none',
        borderRadius: 7, cursor: pending ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', whiteSpace: 'nowrap', opacity: pending ? 0.7 : 1,
      }}
    >
      {pending ? 'Archivage...' : `Archiver les anciens`}
    </button>
  )
}
