import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard', '/workflows']
const PUBLIC_AUTH_PREFIXES = ['/login', '/signup']
const AUTH_COOKIE = 'wf_auth'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasAuth = request.cookies.get(AUTH_COOKIE)?.value === '1'

  const onProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const onAuthPage = PUBLIC_AUTH_PREFIXES.some((p) => pathname.startsWith(p))

  if (onProtected && !hasAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (onAuthPage && hasAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/workflows/:path*', '/login', '/signup'],
}
