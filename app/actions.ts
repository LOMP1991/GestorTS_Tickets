"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import type { Ticket, UserProfile, UserRole } from "@/types"

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    console.log("Getting user profile for:", userId)

    // First try to get existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (fetchError) {
      console.log("Fetch error:", fetchError)
      // Only proceed if the error is "no rows", otherwise return null
      if (fetchError.code !== "PGRST116") {
        return null
      }
    }

    // If profile exists, return it
    if (existingProfile) {
      console.log("Existing profile found:", existingProfile)
      return existingProfile
    }

    console.log("No existing profile, creating new one")

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError)
      return null
    }

    // Prepare the new profile data
    const newProfileData = {
      id: userId,
      email: session.user.email || "",
      full_name: session.user.email?.split("@")[0] || "New User",
      role: "user" as UserRole,
    }

    console.log("Attempting to create profile:", newProfileData)

    // Create new profile
    const { data: newProfile, error: createError } = await supabase
      .from("user_profiles")
      .insert([newProfileData])
      .select()
      .single()

    if (createError) {
      console.error("Create profile error:", createError)
      return null
    }

    console.log("Successfully created profile:", newProfile)
    return newProfile
  } catch (error) {
    console.error("Unexpected error in getUserProfile:", error)
    return null
  }
}

export async function getTickets() {
  try {
    const { data: session } = await supabase.auth.getSession()
    if (!session.session?.user.id) {
      return []
    }

    // Get user profile to check role
    const userProfile = await getUserProfile(session.session.user.id)

    let query = supabase
      .from("tickets")
      .select(`
        *,
        assigned_user:user_profiles!tickets_assigned_user_id_fkey(id, email, full_name, role),
        created_by:user_profiles!tickets_created_by_id_fkey(id, email, full_name, role)
      `)
      .order("created_at", { ascending: false })

    // If not admin, only show assigned or created tickets
    if (userProfile?.role !== "admin") {
      query = query.or(`assigned_user_id.eq.${session.session.user.id},created_by_id.eq.${session.session.user.id}`)
    }

    const { data: tickets, error } = await query

    if (error) {
      console.error("Supabase error:", error)
      return []
    }

    return tickets.map((ticket) => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      assigned_user_id: ticket.assigned_user_id,
      created_by_id: ticket.created_by_id,
      policy_number: ticket.policy_number,
      createdAt: ticket.created_at,
      assigned_user: ticket.assigned_user,
      created_by: ticket.created_by,
    }))
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return []
  }
}

export async function createTicket(data: Omit<Ticket, "id">) {
  try {
    const { data: session } = await supabase.auth.getSession()
    if (!session.session?.user.id) {
      return {
        success: false,
        error: "Usuario no autenticado. Por favor, inicie sesión.",
      }
    }

    // Get user profile to check role
    const userProfile = await getUserProfile(session.session.user.id)

    if (!userProfile) {
      return {
        success: false,
        error: "No se pudo obtener el perfil del usuario",
      }
    }

    // If not admin, can only assign to self
    if (userProfile.role !== "admin" && data.assigned_user_id !== session.session.user.id) {
      return {
        success: false,
        error: "Solo puede asignar tickets a sí mismo",
      }
    }

    // Validate required fields
    if (!data.title?.trim()) {
      return { success: false, error: "El título es requerido" }
    }
    if (!data.description?.trim()) {
      return { success: false, error: "La descripción es requerida" }
    }
    if (!data.policy_number?.trim()) {
      return { success: false, error: "El número de póliza es requerido" }
    }

    const { data: newTicket, error: supabaseError } = await supabase
      .from("tickets")
      .insert([
        {
          title: data.title,
          description: data.description,
          status: data.status,
          assigned_user_id: userProfile.role === "admin" ? data.assigned_user_id : session.session.user.id,
          created_by_id: session.session.user.id,
          policy_number: data.policy_number,
          created_at: new Date(data.createdAt).toISOString(),
        },
      ])
      .select()
      .single()

    if (supabaseError) {
      console.error("Supabase error:", supabaseError)
      return {
        success: false,
        error: supabaseError.message,
      }
    }

    revalidatePath("/")
    return { success: true, data: newTicket }
  } catch (error) {
    console.error("Server error creating ticket:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error inesperado al crear el ticket",
    }
  }
}

export async function updateTicket(ticketId: string, data: Partial<Ticket>) {
  try {
    const { data: session } = await supabase.auth.getSession()
    if (!session.session?.user.id) {
      return {
        success: false,
        error: "Usuario no autenticado. Por favor, inicie sesión.",
      }
    }

    // Get user profile to check role
    const userProfile = await getUserProfile(session.session.user.id)

    if (!userProfile) {
      return {
        success: false,
        error: "No se pudo obtener el perfil del usuario",
      }
    }

    // Check if user has permission to update
    if (userProfile.role !== "admin" && data.assigned_user_id !== session.session.user.id) {
      return {
        success: false,
        error: "No tiene permisos para actualizar este ticket",
      }
    }

    const { error } = await supabase
      .from("tickets")
      .update({
        title: data.title,
        description: data.description,
        status: data.status,
        assigned_user_id: data.assigned_user_id,
        policy_number: data.policy_number,
        created_at: data.createdAt ? new Date(data.createdAt).toISOString() : undefined,
      })
      .eq("id", ticketId)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error inesperado al actualizar el ticket",
    }
  }
}

export async function getAvailableUsers() {
  try {
    console.log("Getting available users")
    const { data: session } = await supabase.auth.getSession()

    if (!session?.session?.user?.id) {
      console.log("No active session found")
      return []
    }

    console.log("Session found, getting user profile")

    // First, ensure the user has a profile
    const userProfile = await getUserProfile(session.session.user.id)

    if (!userProfile) {
      console.error("Could not get or create user profile")
      // Instead of returning empty array, return a basic profile based on session
      return [
        {
          id: session.session.user.id,
          email: session.session.user.email || "",
          full_name: session.session.user.email?.split("@")[0] || "New User",
          role: "user" as UserRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]
    }

    // If admin, return all users
    if (userProfile.role === "admin") {
      console.log("User is admin, fetching all users")
      const { data: users, error } = await supabase
        .from("user_profiles")
        .select("id, email, full_name, role")
        .order("full_name", { ascending: true })

      if (error) {
        console.error("Error fetching users:", error)
        return [userProfile]
      }

      return users || [userProfile]
    } else {
      // If not admin, only return the current user
      console.log("User is not admin, returning only their profile")
      return [userProfile]
    }
  } catch (error) {
    console.error("Error in getAvailableUsers:", error)
    // Return a basic profile based on session as fallback
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.user) {
      return [
        {
          id: session.user.id,
          email: session.user.email || "",
          full_name: session.user.email?.split("@")[0] || "New User",
          role: "user" as UserRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]
    }
    return []
  }
}

