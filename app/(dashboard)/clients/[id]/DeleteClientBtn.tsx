'use client'

import { useTransition } from 'react'
import { deleteClientAction } from '@/app/actions/clients'

export default function DeleteClientBtn({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Supprimer ce client et tout son historique ? Cette action est irréversible.')) return
    startTransition(() => deleteClientAction(id))
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      style={{
        padding: '8px 16px',
        background: 'none',
        border: '1px solid #fecaca',
        borderRadius: 8,
        fontSize: 13,
        color: '#dc2626',
        cursor: pending ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {pending ? 'Suppression...' : 'Supprimer'}
    </button>
  )
}
