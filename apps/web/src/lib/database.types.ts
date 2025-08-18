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
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          owner_id: string
          title: string
          start_date: string | null
          end_date: string | null
          is_public: boolean
          currency: string
          created_at: string
          updated_at: string
          share_id: string | null
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          start_date?: string | null
          end_date?: string | null
          is_public?: boolean
          currency?: string
          created_at?: string
          updated_at?: string
          share_id?: string | null
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          start_date?: string | null
          end_date?: string | null
          is_public?: boolean
          currency?: string
          created_at?: string
          updated_at?: string
          share_id?: string | null
        }
      }
      trip_members: {
        Row: {
          id: string
          trip_id: string
          user_id: string | null
          role: "owner" | "editor" | "viewer"
          invited_email: string | null
          invite_token: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id?: string | null
          role?: "owner" | "editor" | "viewer"
          invited_email?: string | null
          invite_token?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string | null
          role?: "owner" | "editor" | "viewer"
          invited_email?: string | null
          invite_token?: string | null
          created_at?: string
        }
      }
      days: {
        Row: {
          id: string
          trip_id: string
          date: string
          index: number
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          date: string
          index: number
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          date?: string
          index?: number
          created_at?: string
        }
      }
      places: {
        Row: {
          id: string
          google_place_id: string | null
          name: string
          lat: number
          lng: number
          address: string | null
          types: Json | null
          photo_ref: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          google_place_id?: string | null
          name: string
          lat: number
          lng: number
          address?: string | null
          types?: Json | null
          photo_ref?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          google_place_id?: string | null
          name?: string
          lat?: number
          lng?: number
          address?: string | null
          types?: Json | null
          photo_ref?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      day_places: {
        Row: {
          id: string
          day_id: string
          place_id: string
          sort_order: number
          start_time: string | null
          end_time: string | null
          notes: string | null
          cost_cents: number | null
          tags: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          day_id: string
          place_id: string
          sort_order: number
          start_time?: string | null
          end_time?: string | null
          notes?: string | null
          cost_cents?: number | null
          tags?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          day_id?: string
          place_id?: string
          sort_order?: number
          start_time?: string | null
          end_time?: string | null
          notes?: string | null
          cost_cents?: number | null
          tags?: string[] | null
          created_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          trip_id: string
          body: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          body: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          body?: string
          created_by?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          trip_id: string
          day_place_id: string | null
          body: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          day_place_id?: string | null
          body: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          day_place_id?: string | null
          body?: string
          user_id?: string
          created_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          trip_id: string
          daily_budget_cents: number | null
          total_budget_cents: number | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          daily_budget_cents?: number | null
          total_budget_cents?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          daily_budget_cents?: number | null
          total_budget_cents?: number | null
          created_at?: string
        }
      }
      attachments: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          file_path: string
          caption: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          file_path: string
          caption?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string
          file_path?: string
          caption?: string | null
          created_at?: string
        }
      }
      ai_suggestions: {
        Row: {
          id: string
          trip_id: string
          day_id: string | null
          prompt: string
          result: Json
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          day_id?: string | null
          prompt: string
          result: Json
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          day_id?: string | null
          prompt?: string
          result?: Json
          created_by?: string
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
      trip_member_role: "owner" | "editor" | "viewer"
    }
  }
}