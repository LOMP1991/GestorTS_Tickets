export type UserRole = 'admin' | 'user' | 'agent'

export type TicketStatus = 'assigned' | 'in-progress' | 'transferred' | 'solved'

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  assigned_user_id: string | null
  created_by_id: string
  policy_number?: string
  createdAt: string
}

export interface User {
  id: string
  email?: string | null
  full_name?: string
  role: UserRole
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

