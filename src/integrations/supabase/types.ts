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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_version: {
        Row: {
          created_at: string
          download_url: string | null
          id: string
          is_force_update: boolean | null
          release_notes: string | null
          updated_at: string
          version_code: number
          version_name: string
        }
        Insert: {
          created_at?: string
          download_url?: string | null
          id?: string
          is_force_update?: boolean | null
          release_notes?: string | null
          updated_at?: string
          version_code?: number
          version_name?: string
        }
        Update: {
          created_at?: string
          download_url?: string | null
          id?: string
          is_force_update?: boolean | null
          release_notes?: string | null
          updated_at?: string
          version_code?: number
          version_name?: string
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          id?: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          coupon_type: Database["public"]["Enums"]["coupon_type"]
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          used_count: number
          value: number
        }
        Insert: {
          code: string
          coupon_type: Database["public"]["Enums"]["coupon_type"]
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          used_count?: number
          value?: number
        }
        Update: {
          code?: string
          coupon_type?: Database["public"]["Enums"]["coupon_type"]
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      domains: {
        Row: {
          created_at: string
          domain_name: string
          forward_to_email: string | null
          id: string
          is_verified: boolean
          updated_at: string
          verification_code: string
        }
        Insert: {
          created_at?: string
          domain_name: string
          forward_to_email?: string | null
          id?: string
          is_verified?: boolean
          updated_at?: string
          verification_code?: string
        }
        Update: {
          created_at?: string
          domain_name?: string
          forward_to_email?: string | null
          id?: string
          is_verified?: boolean
          updated_at?: string
          verification_code?: string
        }
        Relationships: []
      }
      email_aliases: {
        Row: {
          created_at: string
          domain_id: string | null
          email_count: number
          forward_to_email: string | null
          id: string
          is_active: boolean
          is_password_protected: boolean
          password_hash: string | null
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          created_at?: string
          domain_id?: string | null
          email_count?: number
          forward_to_email?: string | null
          id?: string
          is_active?: boolean
          is_password_protected?: boolean
          password_hash?: string | null
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          created_at?: string
          domain_id?: string | null
          email_count?: number
          forward_to_email?: string | null
          id?: string
          is_active?: boolean
          is_password_protected?: boolean
          password_hash?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_aliases_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      email_attachments: {
        Row: {
          content_id: string
          content_type: string | null
          created_at: string
          email_id: string
          filename: string | null
          id: string
          storage_path: string
          storage_url: string
        }
        Insert: {
          content_id: string
          content_type?: string | null
          created_at?: string
          email_id: string
          filename?: string | null
          id?: string
          storage_path: string
          storage_url: string
        }
        Update: {
          content_id?: string
          content_type?: string | null
          created_at?: string
          email_id?: string
          filename?: string | null
          id?: string
          storage_path?: string
          storage_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_attachments_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "received_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          plan: Database["public"]["Enums"]["app_plan"]
          plan_expires_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          plan?: Database["public"]["Enums"]["app_plan"]
          plan_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["app_plan"]
          plan_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          alias_id: string | null
          created_at: string
          device_info: string | null
          fcm_token: string
          id: string
          updated_at: string
        }
        Insert: {
          alias_id?: string | null
          created_at?: string
          device_info?: string | null
          fcm_token: string
          id?: string
          updated_at?: string
        }
        Update: {
          alias_id?: string | null
          created_at?: string
          device_info?: string | null
          fcm_token?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_alias_id_fkey"
            columns: ["alias_id"]
            isOneToOne: false
            referencedRelation: "email_aliases"
            referencedColumns: ["id"]
          },
        ]
      }
      received_emails: {
        Row: {
          alias_id: string | null
          body_html: string | null
          body_text: string | null
          from_email: string
          id: string
          is_forwarded: boolean
          is_read: boolean
          received_at: string
          subject: string | null
        }
        Insert: {
          alias_id?: string | null
          body_html?: string | null
          body_text?: string | null
          from_email: string
          id?: string
          is_forwarded?: boolean
          is_read?: boolean
          received_at?: string
          subject?: string | null
        }
        Update: {
          alias_id?: string | null
          body_html?: string | null
          body_text?: string | null
          from_email?: string
          id?: string
          is_forwarded?: boolean
          is_read?: boolean
          received_at?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "received_emails_alias_id_fkey"
            columns: ["alias_id"]
            isOneToOne: false
            referencedRelation: "email_aliases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_plan: "guest" | "free" | "paid"
      app_role: "admin" | "user"
      coupon_type: "trial_days" | "lifetime" | "discount_percent"
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
      app_plan: ["guest", "free", "paid"],
      app_role: ["admin", "user"],
      coupon_type: ["trial_days", "lifetime", "discount_percent"],
    },
  },
} as const
