export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          club_id: string
          created_by: string | null
          id: string
          message: string
          timestamp: string
        }
        Insert: {
          club_id: string
          created_by?: string | null
          id?: string
          message: string
          timestamp?: string
        }
        Update: {
          club_id?: string
          created_by?: string | null
          id?: string
          message?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements_pending: {
        Row: {
          club_id: string
          created_at: string
          created_by: string
          id: string
          message: string
          status: string
        }
        Insert: {
          club_id: string
          created_at?: string
          created_by: string
          id?: string
          message: string
          status?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          created_by?: string
          id?: string
          message?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_pending_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_pending_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_discussions: {
        Row: {
          club_id: string
          created_at: string
          id: string
          message: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          message: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          message?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_discussions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_discussions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "club_discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_discussions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          club_id: string
          id: string
          joined_at: string
          role_in_club: string
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string
          role_in_club: string
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string
          role_in_club?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string
          faculty_advisor: string | null
          id: string
          logo_url: string | null
          name: string
          whatsapp_link: string | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          faculty_advisor?: string | null
          id?: string
          logo_url?: string | null
          name: string
          whatsapp_link?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          faculty_advisor?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          whatsapp_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clubs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs_pending: {
        Row: {
          category: string
          created_at: string | null
          created_by: string
          description: string
          faculty_advisor: string | null
          id: string
          logo_url: string | null
          name: string
          status: string | null
          whatsapp_link: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by: string
          description: string
          faculty_advisor?: string | null
          id?: string
          logo_url?: string | null
          name: string
          status?: string | null
          whatsapp_link?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string
          description?: string
          faculty_advisor?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          status?: string | null
          whatsapp_link?: string | null
        }
        Relationships: []
      }
      event_participants: {
        Row: {
          event_id: string
          id: string
          timestamp: string
          user_id: string
          attended: boolean
        }
        Insert: {
          event_id: string
          id?: string
          timestamp?: string
          user_id: string
          attended?: boolean
        }
        Update: {
          event_id?: string
          id?: string
          timestamp?: string
          user_id?: string
          attended?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_url: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          organizer_club: string
          reminder_status: boolean | null
          title: string
          venue: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          date: string
          description?: string | null
          id?: string
          organizer_club: string
          reminder_status?: boolean | null
          title: string
          venue: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          organizer_club?: string
          reminder_status?: boolean | null
          title?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_club_fkey"
            columns: ["organizer_club"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      events_pending: {
        Row: {
          banner_url: string | null
          created_at: string
          created_by: string
          date: string
          description: string | null
          id: string
          organizer_club: string
          status: string
          title: string
          venue: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          created_by: string
          date: string
          description?: string | null
          id?: string
          organizer_club: string
          status?: string
          title: string
          venue: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          created_by?: string
          date?: string
          description?: string | null
          id?: string
          organizer_club?: string
          status?: string
          title?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_pending_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_pending_organizer_club_fkey"
            columns: ["organizer_club"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_club_head: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "student" | "club_head" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "club_head", "admin"],
    },
  },
} as const
