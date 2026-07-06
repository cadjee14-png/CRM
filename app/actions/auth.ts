'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string

  if (password.trim() !== (process.env.CRM_PASSWORD ?? '').trim()) {
    return { error: 'Mot de passe incorrect.' }
  }

  const cookieStore = await cookies()
  cookieStore.set('crm_auth', process.env.CRM_PASSWORD!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 jours
    path: '/',
  })

  redirect('/')
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('crm_auth')
  redirect('/login')
}
