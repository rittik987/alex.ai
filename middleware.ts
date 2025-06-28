import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('🛡️ Middleware: Processing request for:', request.nextUrl.pathname)
  
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
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  console.log('🛡️ Middleware: User:', user?.email || 'Not authenticated')
  console.log('🛡️ Middleware: Path:', pathname)

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/interview', '/onboarding']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Auth callback routes
  const authRoutes = ['/auth/callback', '/auth/confirm']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Public routes
  const publicRoutes = ['/']
  const isPublicRoute = publicRoutes.includes(pathname)

  console.log('🛡️ Middleware: Route type:', { isProtectedRoute, isAuthRoute, isPublicRoute })

  // Allow auth routes to proceed
  if (isAuthRoute) {
    console.log('🛡️ Middleware: Auth route, allowing through')
    return response
  }

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    console.log('🛡️ Middleware: Unauthenticated user on protected route, redirecting to home')
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Handle authenticated users
  if (user) {
    console.log('🛡️ Middleware: Authenticated user, checking profile...')
    
    // Check if user has completed profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .limit(1)

    const profile = profileData && profileData.length > 0 ? profileData[0] : null
    const hasCompletedProfile = profile && profile.full_name && profile.field
    
    console.log('🛡️ Middleware: Profile status:', { 
      hasProfile: !!profile, 
      hasCompletedProfile,
      fullName: profile?.full_name,
      field: profile?.field
    })

    // If on public route and authenticated
    if (isPublicRoute) {
      if (!hasCompletedProfile) {
        console.log('🛡️ Middleware: Authenticated user on public route with incomplete profile, redirecting to onboarding')
        return NextResponse.redirect(new URL('/onboarding', request.url))
      } else {
        console.log('🛡️ Middleware: Authenticated user on public route with complete profile, redirecting to dashboard')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // If on onboarding but already completed profile
    if (pathname === '/onboarding' && hasCompletedProfile) {
      console.log('🛡️ Middleware: User on onboarding with complete profile, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // If trying to access dashboard without completed profile
    if (pathname.startsWith('/dashboard') && !hasCompletedProfile) {
      console.log('🛡️ Middleware: User trying to access dashboard without complete profile, redirecting to onboarding')
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  console.log('🛡️ Middleware: Allowing request to proceed')
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}