import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const { searchParams } = new URL(request.url)
  const setPassword = searchParams.get('setPassword')

  // If has session and setPassword=true, redirect to set-password
  if (session && setPassword === 'true') {
    const redirectUrl = new URL('/set-password', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If no session and trying to access protected route
  if (!session && !request.nextUrl.pathname.startsWith('/auth')) {
    const redirectUrl = new URL('/auth', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If has session and trying to access auth
  if (session && request.nextUrl.pathname.startsWith('/auth')) {
    const redirectUrl = new URL('/billback-upload', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}
