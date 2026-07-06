import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === '/login'
  const auth = request.cookies.get('crm_auth')?.value
  const isAuthenticated = auth?.trim() === (process.env.CRM_PASSWORD ?? '').trim()

  if (!isAuthenticated && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
