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
      custodial_balances: {
        Row: {
          created_at: string
          id: string
          sbc_balance: number
          updated_at: string
          usd_balance: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sbc_balance?: number
          updated_at?: string
          usd_balance?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sbc_balance?: number
          updated_at?: string
          usd_balance?: number | null
          user_id?: string
        }
        Relationships: []
      }
      custodial_transactions: {
        Row: {
          amount: number
          blockchain_hash: string | null
          created_at: string
          currency: string | null
          description: string | null
          id: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          blockchain_hash?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          blockchain_hash?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_rewards: {
        Row: {
          created_at: string | null
          daily_yield_percentage: number
          error_message: string | null
          id: string
          investment_id: string
          investment_usd: number
          processed_at: string | null
          reward_date: string
          sbc_amount: number
          sbc_price_usd: number
          status: string | null
          usd_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          daily_yield_percentage: number
          error_message?: string | null
          id?: string
          investment_id: string
          investment_usd: number
          processed_at?: string | null
          reward_date: string
          sbc_amount: number
          sbc_price_usd: number
          status?: string | null
          usd_amount: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          daily_yield_percentage?: number
          error_message?: string | null
          id?: string
          investment_id?: string
          investment_usd?: number
          processed_at?: string | null
          reward_date?: string
          sbc_amount?: number
          sbc_price_usd?: number
          status?: string | null
          usd_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_rewards_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "user_investments"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_tiers: {
        Row: {
          created_at: string | null
          daily_yield_percentage: number | null
          hashpower: string
          id: number
          name: string
          price_usd: number
          seats: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          daily_yield_percentage?: number | null
          hashpower: string
          id: number
          name: string
          price_usd: number
          seats: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          daily_yield_percentage?: number | null
          hashpower?: string
          id?: number
          name?: string
          price_usd?: number
          seats?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      sbc_price_history: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          price_usd: number
          source: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          price_usd: number
          source?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          price_usd?: number
          source?: string | null
        }
        Relationships: []
      }
      user_investments: {
        Row: {
          created_at: string | null
          daily_yield_percentage: number
          id: string
          investment_amount_usd: number
          next_reward_date: string
          payment_transaction_id: string | null
          purchase_date: string
          seats: number
          status: string | null
          tier_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          daily_yield_percentage?: number
          id?: string
          investment_amount_usd: number
          next_reward_date: string
          payment_transaction_id?: string | null
          purchase_date?: string
          seats: number
          status?: string | null
          tier_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          daily_yield_percentage?: number
          id?: string
          investment_amount_usd?: number
          next_reward_date?: string
          payment_transaction_id?: string | null
          purchase_date?: string
          seats?: number
          status?: string | null
          tier_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_investments_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "investment_tiers"
            referencedColumns: ["id"]
          },
        ]
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
      get_current_sbc_price: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
