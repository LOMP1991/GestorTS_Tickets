"use client"

import { createContext, useContext } from "react"
import { supabase } from "./supabase"
import { AuthError, AuthApiError, AuthRetryableFetchError } from "@supabase/supabase-js"

const REDIRECT_URL =
  typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

// Types
export type AuthUser = {
  id: string
  email?: string | null
}

export type AuthContextType = {
  user: AuthUser | null
  loading: boolean
}

// Create and export the context
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

// Export the hook
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Auth functions
export async function signIn(email: string, password: string) {
  try {
    console.log("Starting sign in process...")

    // Clear any existing session first
    await supabase.auth.signOut()

    // Attempt to sign in
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error("Sign in error:", signInError)

      switch (signInError.message) {
        case "Invalid login credentials":
          throw new Error("Email o contraseña incorrectos")
        case "Email not confirmed":
          throw new Error("Por favor confirme su email antes de iniciar sesión")
        default:
          throw new Error(signInError.message)
      }
    }

    if (!data?.user || !data?.session) {
      console.error("No user or session data after sign in")
      throw new Error("Error al crear la sesión")
    }

    console.log("Sign in successful")
    return { user: data.user, session: data.session }
  } catch (error) {
    console.error("Error in sign in process:", {
      error,
      message: error instanceof Error ? error.message : "Error desconocido",
      stack: error instanceof Error ? error.stack : undefined,
    })

    throw error
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error("Sign out error:", error)
    throw error
  }
}

export async function signUp(email: string, password: string, fullName: string) {
  try {
    // Clear any existing session first
    await supabase.auth.signOut()

    // Create the auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${REDIRECT_URL}/auth/callback`,
        data: {
          full_name: fullName,
        },
      },
    })

    if (signUpError) throw signUpError

    if (authData.user) {
      // Create the user profile
      const { error: profileError } = await supabase.from("user_profiles").insert([
        {
          id: authData.user.id,
          email: email,
          full_name: fullName,
          role: "user", // Default role
        },
      ])

      if (profileError) throw profileError
    }

    return { data: authData, error: null }
  } catch (error) {
    console.error("Error in signUp:", error)
    return { data: null, error }
  }
}

