"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AuthContext, type AuthUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          setUser(null)
          setLoading(false)
          return
        }

        if (session?.user) {
          setUser(session.user)
        } else {
          setUser(null)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error initializing auth:", error)
        setUser(null)
        setLoading(false)
      }
    }

    initializeAuth()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", {
        event,
        hasSession: !!session,
        timestamp: new Date().toISOString(),
      })

      if (session?.access_token) {
        // Ensure the token is stored
        if (typeof window !== "undefined") {
          localStorage.setItem("sb-access-token", session.access_token)
          if (session.refresh_token) {
            localStorage.setItem("sb-refresh-token", session.refresh_token)
          }
        }
      }

      if (event === "SIGNED_IN" && session) {
        setUser(session.user)
        // After sign in, redirect to home if on login/signup page
        if (pathname === "/login" || pathname === "/signup") {
          router.push("/")
          router.refresh()
        }
      } else if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        setUser(null)
        // Clear all auth tokens
        if (typeof window !== "undefined") {
          localStorage.removeItem("sb-access-token")
          localStorage.removeItem("sb-refresh-token")
          localStorage.removeItem("supabase.auth.token")
        }
        // After sign out, redirect to login
        router.push("/login")
        router.refresh()
      } else if (event === "TOKEN_REFRESHED" && session) {
        setUser(session.user)
        // Update stored tokens
        if (typeof window !== "undefined" && session.access_token) {
          localStorage.setItem("sb-access-token", session.access_token)
          if (session.refresh_token) {
            localStorage.setItem("sb-refresh-token", session.refresh_token)
          }
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, pathname])

  // Handle navigation based on auth state
  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname === "/login" || pathname === "/signup"

      if (!user && !isAuthPage) {
        console.log("No user found, redirecting to login", {
          currentPath: pathname,
          timestamp: new Date().toISOString(),
        })
        router.push(`/login?from=${encodeURIComponent(pathname)}`)
      } else if (user && isAuthPage) {
        console.log("User is authenticated, redirecting to home", {
          currentPath: pathname,
          timestamp: new Date().toISOString(),
        })
        router.push("/")
      }
    }
  }, [user, loading, router, pathname])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

