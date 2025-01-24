import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Create the Supabase client
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
            request.cookies.delete({
              name,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.delete({
              name,
              ...options,
            })
          },
        },
      },
    )

    // Get the current pathname
    const path = request.nextUrl.pathname

    // Define public routes that don't require authentication
    const isPublicRoute =
      path === "/login" ||
      path === "/signup" ||
      path === "/auth/callback" ||
      path.startsWith("/_next") ||
      path.startsWith("/api") ||
      path.includes("favicon.ico")

    // Refresh session if possible
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Add debug logging
    console.log("Auth Middleware:", {
      path,
      hasSession: !!session,
      isPublicRoute,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    })

    // Handle authentication logic
    if (!session && !isPublicRoute) {
      // Redirect to login if accessing protected route without session
      const redirectUrl = new URL("/login", request.url)
      redirectUrl.searchParams.set("from", path)
      return NextResponse.redirect(redirectUrl)
    }

    if (session && (path === "/login" || path === "/signup")) {
      // Redirect to home if accessing auth pages with active session
      return NextResponse.redirect(new URL("/", request.url))
    }

    return response
  } catch (error) {
    console.error("Middleware Error:", {
      error,
      path: request.nextUrl.pathname,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    })

    // On error in production, redirect to login
    if (process.env.NODE_ENV === "production") {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // In development, allow the error to be handled by error boundary
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

