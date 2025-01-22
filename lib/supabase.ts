import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL")
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

// Create Supabase client with improved configuration
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "sb-auth-token",
      storage: {
        getItem: (key) => {
          if (typeof window === "undefined") {
            return null
          }
          return localStorage.getItem(key)
        },
        setItem: (key, value) => {
          if (typeof window === "undefined") {
            return
          }
          localStorage.setItem(key, value)
        },
        removeItem: (key) => {
          if (typeof window === "undefined") {
            return
          }
          localStorage.removeItem(key)
        },
      },
    },
    global: {
      headers: {
        "X-Client-Info": "ticket-management",
      },
    },
  },
)

// Test connection function with improved error handling
export async function testConnection() {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Supabase connection test failed:", {
        error,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "configured" : "missing",
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "configured" : "missing",
      })
      return {
        success: false,
        error: typeof error.message === "string" ? error.message : "Error de conexión con Supabase",
      }
    }

    return {
      success: true,
      hasSession: !!data.session,
    }
  } catch (error) {
    console.error("Failed to test Supabase connection:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error de conexión desconocido",
    }
  }
}

