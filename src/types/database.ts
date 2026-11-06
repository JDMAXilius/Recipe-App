// GENERATED — do not edit by hand.
// Source of truth: the Supabase schema (supabase/migrations).
// Regenerate after a migration: start a local stack from the migrations
// (npx supabase start), then `npx supabase gen types typescript --local --schema public`.
// Regenerated 2026-11-06 (B1): recipe size, plan list, app_events, join attempts, memberships.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      app_events: {
        Row: {
          app_version: string | null;
          created_at: string;
          device_id: string;
          id: number;
          name: string;
          occurred_at: string;
          props: NonNullable<Json>;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          app_version?: string | null;
          created_at?: string;
          device_id: string;
          id?: never;
          name: string;
          occurred_at: string;
          props?: NonNullable<Json>;
          user_id: string;
        };
        Update: {
          app_version?: string | null;
          created_at?: string;
          device_id?: string;
          id?: never;
          name?: string;
          occurred_at?: string;
          props?: NonNullable<Json>;
          user_id?: string;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          category: string | null;
          cook_time: string | null;
          created_at: string | null;
          id: number;
          image: string | null;
          recipe_id: number;
          servings: string | null;
          title: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          category?: string | null;
          cook_time?: string | null;
          created_at?: string | null;
          id?: number;
          image?: string | null;
          recipe_id: number;
          servings?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          category?: string | null;
          cook_time?: string | null;
          created_at?: string | null;
          id?: number;
          image?: string | null;
          recipe_id?: number;
          servings?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      household_join_attempts: {
        Row: {
          at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          at?: string;
          user_id: string;
        };
        Update: {
          at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      household_list_state: {
        Row: {
          checked: boolean;
          custom_name: string | null;
          household_id: string;
          item_key: string;
          removed: boolean;
          removed_at: string | null;
          removed_sources: string[] | null;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          checked?: boolean;
          custom_name?: string | null;
          household_id: string;
          item_key: string;
          removed?: boolean;
          removed_at?: string | null;
          removed_sources?: string[] | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          checked?: boolean;
          custom_name?: string | null;
          household_id?: string;
          item_key?: string;
          removed?: boolean;
          removed_at?: string | null;
          removed_sources?: string[] | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "household_list_state_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
        ];
      };
      household_members: {
        Row: {
          display_name: string | null;
          household_id: string;
          joined_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          display_name?: string | null;
          household_id: string;
          joined_at?: string;
          user_id: string;
        };
        Update: {
          display_name?: string | null;
          household_id?: string;
          joined_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
        ];
      };
      households: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          invite_code: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          invite_code: string;
          name?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          invite_code?: string;
          name?: string;
        };
        Relationships: [];
      };
      list_shares: {
        Row: {
          created_at: string | null;
          payload: NonNullable<Json>;
          revoked_at: string | null;
          token: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string | null;
          payload: NonNullable<Json>;
          revoked_at?: string | null;
          token: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          payload?: NonNullable<Json>;
          revoked_at?: string | null;
          token?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          environment: string | null;
          expires_at: string;
          product_id: string | null;
          store: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          environment?: string | null;
          expires_at: string;
          product_id?: string | null;
          store?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          environment?: string | null;
          expires_at?: string;
          product_id?: string | null;
          store?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      otto_recipes: {
        Row: {
          canonical: NonNullable<Json>;
          created_at: string;
          id: string;
          provenance: NonNullable<Json>;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          canonical: NonNullable<Json>;
          created_at?: string;
          id: string;
          provenance: NonNullable<Json>;
          updated_at?: string;
        };
        Update: {
          canonical?: NonNullable<Json>;
          created_at?: string;
          id?: string;
          provenance?: NonNullable<Json>;
          updated_at?: string;
        };
        Relationships: [];
      };
      plan_entries: {
        Row: {
          category: string | null;
          cooked: boolean;
          created_at: string | null;
          day: string;
          id: number;
          image: string | null;
          kind: string;
          label: string | null;
          note: string | null;
          position: number | null;
          recipe_id: string | null;
          title: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          category?: string | null;
          cooked?: boolean;
          created_at?: string | null;
          day: string;
          id?: number;
          image?: string | null;
          kind?: string;
          label?: string | null;
          note?: string | null;
          position?: number | null;
          recipe_id?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          category?: string | null;
          cooked?: boolean;
          created_at?: string | null;
          day?: string;
          id?: number;
          image?: string | null;
          kind?: string;
          label?: string | null;
          note?: string | null;
          position?: number | null;
          recipe_id?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      recipe_shares: {
        Row: {
          created_at: string | null;
          recipe_id: number;
          revoked_at: string | null;
          slug: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string | null;
          recipe_id: number;
          revoked_at?: string | null;
          slug: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          recipe_id?: number;
          revoked_at?: string | null;
          slug?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      recipes: {
        Row: {
          area: string | null;
          category: string | null;
          created_at: string | null;
          id: number;
          image: string | null;
          ingredients: NonNullable<Json>;
          nutrition: Json | null;
          serving_unit: string | null;
          servings: number | null;
          source: string;
          source_name: string | null;
          source_url: string | null;
          steps: NonNullable<Json>;
          title: string;
          updated_at: string | null;
          user_id: string;
          visibility: string;
          yield_qty: number | null;
          yield_unit: string | null;
          youtube_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          area?: string | null;
          category?: string | null;
          created_at?: string | null;
          id?: number;
          image?: string | null;
          ingredients?: NonNullable<Json>;
          nutrition?: Json | null;
          serving_unit?: string | null;
          servings?: number | null;
          source: string;
          source_name?: string | null;
          source_url?: string | null;
          steps?: NonNullable<Json>;
          title: string;
          updated_at?: string | null;
          user_id: string;
          visibility?: string;
          yield_qty?: number | null;
          yield_unit?: string | null;
          youtube_url?: string | null;
        };
        Update: {
          area?: string | null;
          category?: string | null;
          created_at?: string | null;
          id?: number;
          image?: string | null;
          ingredients?: NonNullable<Json>;
          nutrition?: Json | null;
          serving_unit?: string | null;
          servings?: number | null;
          source?: string;
          source_name?: string | null;
          source_url?: string | null;
          steps?: NonNullable<Json>;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
          visibility?: string;
          yield_qty?: number | null;
          yield_unit?: string | null;
          youtube_url?: string | null;
        };
        Relationships: [];
      };
      resolved_ingredients: {
        Row: {
          food: Json | null;
          id: number;
          name: string;
          resolved_at: string | null;
          tier: string;
        };
        ComputedFields: never;
        Insert: {
          food?: Json | null;
          id?: number;
          name: string;
          resolved_at?: string | null;
          tier: string;
        };
        Update: {
          food?: Json | null;
          id?: number;
          name?: string;
          resolved_at?: string | null;
          tier?: string;
        };
        Relationships: [];
      };
      seed_nutrition: {
        Row: {
          computed_at: string;
          nutrition: NonNullable<Json>;
          recipe_id: string;
        };
        ComputedFields: never;
        Insert: {
          computed_at?: string;
          nutrition: NonNullable<Json>;
          recipe_id: string;
        };
        Update: {
          computed_at?: string;
          nutrition?: NonNullable<Json>;
          recipe_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_delete_user_data: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      get_list_share: {
        Args: { p_token: string };
        Returns: {
          payload: Json;
          status: string;
        }[];
      };
      get_recipe_share: {
        Args: { p_slug: string };
        Returns: {
          recipe: Json;
          status: string;
        }[];
      };
      join_household: { Args: { code: string }; Returns: string };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
