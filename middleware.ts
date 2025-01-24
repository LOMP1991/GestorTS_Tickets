import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  try {
    // Don't run middleware on static files and api routes
    if (
      req.nextUrl.pathname.startsWith("/_next") ||
      req.nextUrl.pathname.startsWith("/api") ||
      req.nextUrl.pathname.startsWith("/static") ||
      req.nextUrl.pathname.includes("favicon.ico") ||
      req.nextUrl.pathname.includes(".png")
    ) {
      return NextResponse.next()
    }

    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    // Refresh session if possible
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Middleware - Auth Error:", error)
      // Clear any invalid session data
      if (error.message.includes("Invalid Refresh Token")) {
        const response = NextResponse.redirect(new URL("/login", req.url))
        response.cookies.delete("sb-refresh-token")
        response.cookies.delete("sb-access-token")
        return response
      }
    }

    // Add debug logging in production
    console.log("Middleware - Auth Status:", {
      hasSession: !!session,
      path: req.nextUrl.pathname,
      timestamp: new Date().toISOString(),
    })

    // If there's no session and trying to access protected routes
    if (!session && !req.nextUrl.pathname.startsWith("/login") && !req.nextUrl.pathname.startsWith("/signup")) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/login"
      redirectUrl.searchParams.set("from", req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error("Middleware - Auth Error:", error)
    // On error, redirect to login
    return NextResponse.redirect(new URL("/login", req.url))
  }
}

// Update matcher to exclude static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
}

