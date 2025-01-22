export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tickets: {
        Row: {
          id: string
          title: string
          description: string
          status: 'assigned' | 'in-progress' | 'transferred' | 'solved'
          assigned_to: string
          policy_number: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          status: 'assigned' | 'in-progress' | 'transferred' | 'solved'
          assigned_to: string
          policy_number?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: 'assigned' | 'in-progress' | 'transferred' | 'solved'
          assigned_to?: string
          policy_number?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

