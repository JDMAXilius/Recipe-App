// GENERATED — do not edit by hand.
// Source of truth: the Supabase schema (docs/contracts/database.md).
// Regenerate after any migration via the Supabase MCP
// `generate_typescript_types` (or `supabase gen types typescript`).
// Regenerated 2026-07-23 after the SECURITY DEFINER hardening migration:
// dropped the dead v1 collab_lists/collab_items tables + their 4 RPCs, and
// moved is_household_member/shares_household to the private schema (no longer
// in the public API surface).
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
      households: {
        Row: { created_at: string; created_by: string; id: string; invite_code: string; name: string }
        Insert: { created_at?: string; created_by: string; id?: string; invite_code: string; name?: string }
        Update: { created_at?: string; created_by?: string; id?: string; invite_code?: string; name?: string }
        Relationships: []
      }
      household_members: {
        Row: { display_name: string | null; household_id: string; joined_at: string; user_id: string }
        Insert: { display_name?: string | null; household_id: string; joined_at?: string; user_id: string }
        Update: { display_name?: string | null; household_id?: string; joined_at?: string; user_id?: string }
        Relationships: []
      }
      household_list_state: {
        Row: { checked: boolean; custom_name: string | null; household_id: string; item_key: string; updated_at: string; updated_by: string | null }
        Insert: { checked?: boolean; custom_name?: string | null; household_id: string; item_key: string; updated_at?: string; updated_by?: string | null }
        Update: { checked?: boolean; custom_name?: string | null; household_id?: string; item_key?: string; updated_at?: string; updated_by?: string | null }
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
      admin_delete_user_data: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      get_list_share: {
        Args: { p_token: string }
        Returns: {
          payload: Json
          status: string
        }[]
      }
      get_recipe_share: {
        Args: { p_slug: string }
        Returns: {
          recipe: Json
          status: string
        }[]
      }
      join_household: { Args: { code: string }; Returns: string }
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
