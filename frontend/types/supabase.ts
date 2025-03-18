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
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: number
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      permissions: {
        Row: {
          id: number
          name: string
          description: string | null
          resource: string
          action: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          resource: string
          action: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          resource?: string
          action?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: number
          user_id: string
          role_id: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          role_id: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          role_id?: number
          created_at?: string
          updated_at?: string
        }
      }
      role_permissions: {
        Row: {
          id: number
          role_id: number
          permission_id: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          role_id: number
          permission_id: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          role_id?: number
          permission_id?: number
          created_at?: string
          updated_at?: string
        }
      }
      // Add other tables as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_permission: {
        Args: {
          user_id: string
          permission_name: string
          resource: string
        }
        Returns: boolean
      }
      get_user_permissions: {
        Args: {
          user_id: string
        }
        Returns: {
          permission_name: string
          resource: string
          action: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 