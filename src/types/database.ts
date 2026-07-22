// GENERATED — do not edit by hand.
// Source of truth: the Supabase schema (docs/contracts/database.md).
// Regenerate after any migration via the Supabase MCP
// `generate_typescript_types` (or `supabase gen types typescript`).
// Generated 2026-07-21 from project mepzfdefanfpnrvydyty.
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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      collab_items: {
        Row: {
          added_by_name: string
          amount: string | null
          checked: boolean
          checked_by_name: string | null
          created_at: string | null
          id: number
          name: string
          token: string
        }
        Insert: {
          added_by_name: string
          amount?: string | null
          checked?: boolean
          checked_by_name?: string | null
          created_at?: string | null
          id?: number
          name: string
          token: string
        }
        Update: {
          added_by_name?: string
          amount?: string | null
          checked?: boolean
          checked_by_name?: string | null
          created_at?: string | null
          id?: number
          name?: string
          token?: string
        }
        Relationships: []
      }
      collab_lists: {
        Row: {
          created_at: string | null
          owner_user_id: string
          revoked_at: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          owner_user_id: string
          revoked_at?: string | null
          token: string
        }
        Update: {
          created_at?: string | null
          owner_user_id?: string
          revoked_at?: string | null
          token?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          category: string | null
          cook_time: string | null
          created_at: string | null
          id: number
          image: string | null
          recipe_id: number
          servings: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          cook_time?: string | null
          created_at?: string | null
          id?: number
          image?: string | null
          recipe_id: number
          servings?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          cook_time?: string | null
          created_at?: string | null
          id?: number
          image?: string | null
          recipe_id?: number
          servings?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      list_shares: {
        Row: {
          created_at: string | null
          payload: Json
          revoked_at: string | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          payload: Json
          revoked_at?: string | null
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          payload?: Json
          revoked_at?: string | null
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_entries: {
        Row: {
          category: string | null
          cooked: boolean
          created_at: string | null
          day: string
          id: number
          image: string | null
          note: string | null
          recipe_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          cooked?: boolean
          created_at?: string | null
          day: string
          id?: number
          image?: string | null
          note?: string | null
          recipe_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          cooked?: boolean
          created_at?: string | null
          day?: string
          id?: number
          image?: string | null
          note?: string | null
          recipe_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      recipe_shares: {
        Row: {
          created_at: string | null
          recipe_id: number
          revoked_at: string | null
          slug: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          recipe_id: number
          revoked_at?: string | null
          slug: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          recipe_id?: number
          revoked_at?: string | null
          slug?: string
          user_id?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          area: string | null
          category: string | null
          created_at: string | null
          id: number
          image: string | null
          ingredients: Json
          nutrition: Json | null
          servings: number | null
          source: string
          source_name: string | null
          source_url: string | null
          steps: Json
          title: string
          updated_at: string | null
          user_id: string
          visibility: string
          youtube_url: string | null
        }
        Insert: {
          area?: string | null
          category?: string | null
          created_at?: string | null
          id?: number
          image?: string | null
          ingredients?: Json
          nutrition?: Json | null
          servings?: number | null
          source: string
          source_name?: string | null
          source_url?: string | null
          steps?: Json
          title: string
          updated_at?: string | null
          user_id: string
          visibility?: string
          youtube_url?: string | null
        }
        Update: {
          area?: string | null
          category?: string | null
          created_at?: string | null
          id?: number
          image?: string | null
          ingredients?: Json
          nutrition?: Json | null
          servings?: number | null
          source?: string
          source_name?: string | null
          source_url?: string | null
          steps?: Json
          title?: string
          updated_at?: string | null
          user_id?: string
          visibility?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      resolved_ingredients: {
        Row: {
          food: Json | null
          id: number
          name: string
          resolved_at: string | null
          tier: string
        }
        Insert: {
          food?: Json | null
          id?: number
          name: string
          resolved_at?: string | null
          tier: string
        }
        Update: {
          food?: Json | null
          id?: number
          name?: string
          resolved_at?: string | null
          tier?: string
        }
        Relationships: []
      }
      seed_nutrition: {
        Row: {
          computed_at: string
          nutrition: Json
          recipe_id: string
        }
        Insert: {
          computed_at?: string
          nutrition: Json
          recipe_id: string
        }
        Update: {
          computed_at?: string
          nutrition?: Json
          recipe_id?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
