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
      advisors: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          module: string
          record_id: string | null
          record_type: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          module: string
          record_id?: string | null
          record_type?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          module?: string
          record_id?: string | null
          record_type?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      beneficiaries: {
        Row: {
          birth_date: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          identification_number: string | null
          identification_type:
            | Database["public"]["Enums"]["identification_type"]
            | null
          last_name: string
          percentage: number
          phone: string | null
          policy_id: string
          relationship: Database["public"]["Enums"]["relationship_type"]
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          identification_number?: string | null
          identification_type?:
            | Database["public"]["Enums"]["identification_type"]
            | null
          last_name: string
          percentage?: number
          phone?: string | null
          policy_id: string
          relationship: Database["public"]["Enums"]["relationship_type"]
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          identification_number?: string | null
          identification_type?:
            | Database["public"]["Enums"]["identification_type"]
            | null
          last_name?: string
          percentage?: number
          phone?: string | null
          policy_id?: string
          relationship?: Database["public"]["Enums"]["relationship_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beneficiaries_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          advisor_id: string | null
          birth_date: string | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          first_name: string
          id: string
          identification_number: string
          identification_type: Database["public"]["Enums"]["identification_type"]
          last_name: string
          mobile: string | null
          notes: string | null
          occupation: string | null
          phone: string | null
          province: string | null
          updated_at: string | null
          workplace: string | null
        }
        Insert: {
          address?: string | null
          advisor_id?: string | null
          birth_date?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          first_name: string
          id?: string
          identification_number: string
          identification_type?: Database["public"]["Enums"]["identification_type"]
          last_name: string
          mobile?: string | null
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          province?: string | null
          updated_at?: string | null
          workplace?: string | null
        }
        Update: {
          address?: string | null
          advisor_id?: string | null
          birth_date?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          first_name?: string
          id?: string
          identification_number?: string
          identification_type?: Database["public"]["Enums"]["identification_type"]
          last_name?: string
          mobile?: string | null
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          province?: string | null
          updated_at?: string | null
          workplace?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisors"
            referencedColumns: ["id"]
          },
        ]
      }
      insurers: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          ruc: string | null
          short_name: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          ruc?: string | null
          short_name?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          ruc?: string | null
          short_name?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      policies: {
        Row: {
          client_id: string
          coverage_amount: number | null
          created_at: string | null
          created_by: string | null
          deductible: number | null
          end_date: string
          id: string
          insurer_id: string | null
          notes: string | null
          payment_frequency:
            | Database["public"]["Enums"]["payment_frequency"]
            | null
          policy_number: string | null
          premium: number | null
          product_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["policy_status"] | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          coverage_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          deductible?: number | null
          end_date: string
          id?: string
          insurer_id?: string | null
          notes?: string | null
          payment_frequency?:
            | Database["public"]["Enums"]["payment_frequency"]
            | null
          policy_number?: string | null
          premium?: number | null
          product_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["policy_status"] | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          coverage_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          deductible?: number | null
          end_date?: string
          id?: string
          insurer_id?: string | null
          notes?: string | null
          payment_frequency?:
            | Database["public"]["Enums"]["payment_frequency"]
            | null
          policy_number?: string | null
          premium?: number | null
          product_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["policy_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_insurer_id_fkey"
            columns: ["insurer_id"]
            isOneToOne: false
            referencedRelation: "insurers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          insurer_id: string | null
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          insurer_id?: string | null
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          insurer_id?: string | null
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_insurer_id_fkey"
            columns: ["insurer_id"]
            isOneToOne: false
            referencedRelation: "insurers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      no_admin_exists: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role:
        | "acceso_total"
        | "revision_edicion_1"
        | "revision_edicion_2"
        | "revision"
      identification_type: "cedula" | "pasaporte" | "ruc" | "otro"
      payment_frequency:
        | "mensual"
        | "trimestral"
        | "semestral"
        | "anual"
        | "unico"
      policy_status:
        | "vigente"
        | "pendiente"
        | "cancelada"
        | "vencida"
        | "en_tramite"
      relationship_type:
        | "conyuge"
        | "hijo"
        | "padre"
        | "madre"
        | "hermano"
        | "otro"
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
      app_role: [
        "acceso_total",
        "revision_edicion_1",
        "revision_edicion_2",
        "revision",
      ],
      identification_type: ["cedula", "pasaporte", "ruc", "otro"],
      payment_frequency: [
        "mensual",
        "trimestral",
        "semestral",
        "anual",
        "unico",
      ],
      policy_status: [
        "vigente",
        "pendiente",
        "cancelada",
        "vencida",
        "en_tramite",
      ],
      relationship_type: [
        "conyuge",
        "hijo",
        "padre",
        "madre",
        "hermano",
        "otro",
      ],
    },
  },
} as const
