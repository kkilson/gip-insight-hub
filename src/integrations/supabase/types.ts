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
      attachments: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          updated_at?: string
          uploaded_by?: string | null
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
      banks: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
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
      birthday_sends: {
        Row: {
          card_path: string | null
          channels: Json
          client_id: string
          created_at: string
          error_email: string | null
          error_whatsapp: string | null
          id: string
          notes: string | null
          send_year: number
          sent_at: string
          sent_by: string | null
          status_email: string | null
          status_whatsapp: string | null
          updated_at: string
        }
        Insert: {
          card_path?: string | null
          channels?: Json
          client_id: string
          created_at?: string
          error_email?: string | null
          error_whatsapp?: string | null
          id?: string
          notes?: string | null
          send_year: number
          sent_at?: string
          sent_by?: string | null
          status_email?: string | null
          status_whatsapp?: string | null
          updated_at?: string
        }
        Update: {
          card_path?: string | null
          channels?: Json
          client_id?: string
          created_at?: string
          error_email?: string | null
          error_whatsapp?: string | null
          id?: string
          notes?: string | null
          send_year?: number
          sent_at?: string
          sent_by?: string | null
          status_email?: string | null
          status_whatsapp?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "birthday_sends_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_settings: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          identification: string | null
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          identification?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          identification?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      budget_lines: {
        Row: {
          actual_amount_usd: number | null
          actual_payment_date: string | null
          amount_usd: number
          amount_ves: number
          budget_id: string
          can_pay_in_ves: boolean
          category: string | null
          created_at: string
          day_of_month: number | null
          description: string
          id: string
          planned_date: string
          postpone_reason: string | null
          postponed_date: string | null
          reference_rate: number | null
          reminder_date: string | null
          status: Database["public"]["Enums"]["budget_status"]
          updated_at: string
        }
        Insert: {
          actual_amount_usd?: number | null
          actual_payment_date?: string | null
          amount_usd: number
          amount_ves?: number
          budget_id: string
          can_pay_in_ves?: boolean
          category?: string | null
          created_at?: string
          day_of_month?: number | null
          description: string
          id?: string
          planned_date: string
          postpone_reason?: string | null
          postponed_date?: string | null
          reference_rate?: number | null
          reminder_date?: string | null
          status?: Database["public"]["Enums"]["budget_status"]
          updated_at?: string
        }
        Update: {
          actual_amount_usd?: number | null
          actual_payment_date?: string | null
          amount_usd?: number
          amount_ves?: number
          budget_id?: string
          can_pay_in_ves?: boolean
          category?: string | null
          created_at?: string
          day_of_month?: number | null
          description?: string
          id?: string
          planned_date?: string
          postpone_reason?: string | null
          postponed_date?: string | null
          reference_rate?: number | null
          reminder_date?: string | null
          status?: Database["public"]["Enums"]["budget_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          created_at: string
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          end_date: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          period: Database["public"]["Enums"]["budget_period"]
          start_date: string
          total_budgeted_usd: number
          total_spent_usd: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          period: Database["public"]["Enums"]["budget_period"]
          start_date: string
          total_budgeted_usd?: number
          total_spent_usd?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          period?: Database["public"]["Enums"]["budget_period"]
          start_date?: string
          total_budgeted_usd?: number
          total_spent_usd?: number
          updated_at?: string
        }
        Relationships: []
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
      collection_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          collection_id: string
          id: string
          new_status: Database["public"]["Enums"]["collection_status"]
          notes: string | null
          previous_status:
            | Database["public"]["Enums"]["collection_status"]
            | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          collection_id: string
          id?: string
          new_status: Database["public"]["Enums"]["collection_status"]
          notes?: string | null
          previous_status?:
            | Database["public"]["Enums"]["collection_status"]
            | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          collection_id?: string
          id?: string
          new_status?: Database["public"]["Enums"]["collection_status"]
          notes?: string | null
          previous_status?:
            | Database["public"]["Enums"]["collection_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_history_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          advisor_contacted_at: string | null
          advisor_notes: string | null
          amount: number
          client_id: string
          created_at: string | null
          due_date: string
          id: string
          paid_at: string | null
          paid_by: string | null
          payment_frequency: Database["public"]["Enums"]["payment_frequency"]
          policy_id: string
          promised_date: string | null
          status: Database["public"]["Enums"]["collection_status"]
          updated_at: string | null
        }
        Insert: {
          advisor_contacted_at?: string | null
          advisor_notes?: string | null
          amount: number
          client_id: string
          created_at?: string | null
          due_date: string
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          payment_frequency: Database["public"]["Enums"]["payment_frequency"]
          policy_id: string
          promised_date?: string | null
          status?: Database["public"]["Enums"]["collection_status"]
          updated_at?: string | null
        }
        Update: {
          advisor_contacted_at?: string | null
          advisor_notes?: string | null
          amount?: number
          client_id?: string
          created_at?: string | null
          due_date?: string
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          payment_frequency?: Database["public"]["Enums"]["payment_frequency"]
          policy_id?: string
          promised_date?: string | null
          status?: Database["public"]["Enums"]["collection_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"]
          id: string
          is_manual: boolean
          manual_reason: string | null
          rate: number
          recorded_at: string
          recorded_by: string | null
          source: Database["public"]["Enums"]["exchange_rate_source"]
        }
        Insert: {
          created_at?: string
          currency: Database["public"]["Enums"]["currency_type"]
          id?: string
          is_manual?: boolean
          manual_reason?: string | null
          rate: number
          recorded_at?: string
          recorded_by?: string | null
          source: Database["public"]["Enums"]["exchange_rate_source"]
        }
        Update: {
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          id?: string
          is_manual?: boolean
          manual_reason?: string | null
          rate?: number
          recorded_at?: string
          recorded_by?: string | null
          source?: Database["public"]["Enums"]["exchange_rate_source"]
        }
        Relationships: []
      }
      finance_expenses: {
        Row: {
          amount_usd: number
          amount_ves: number
          beneficiary: string | null
          created_at: string
          created_by: string | null
          description: string
          exchange_rate: number | null
          expense_date: string
          id: string
          is_paid: boolean
          month: string
          notes: string | null
          paid_at: string | null
          updated_at: string
        }
        Insert: {
          amount_usd?: number
          amount_ves?: number
          beneficiary?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          exchange_rate?: number | null
          expense_date: string
          id?: string
          is_paid?: boolean
          month: string
          notes?: string | null
          paid_at?: string | null
          updated_at?: string
        }
        Update: {
          amount_usd?: number
          amount_ves?: number
          beneficiary?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          exchange_rate?: number | null
          expense_date?: string
          id?: string
          is_paid?: boolean
          month?: string
          notes?: string | null
          paid_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      finance_income: {
        Row: {
          amount_usd: number
          amount_ves: number
          bank_id: string | null
          created_at: string
          created_by: string | null
          description: string
          exchange_rate: number | null
          id: string
          income_date: string
          month: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          amount_usd?: number
          amount_ves?: number
          bank_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          exchange_rate?: number | null
          id?: string
          income_date: string
          month: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          amount_usd?: number
          amount_ves?: number
          bank_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          exchange_rate?: number | null
          id?: string
          income_date?: string
          month?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_income_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_invoices: {
        Row: {
          collected_at: string | null
          control_number: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          invoice_date: string
          invoice_number: string
          is_collected: boolean
          month: string
          notes: string | null
          total_usd: number
          total_ves: number
          updated_at: string
        }
        Insert: {
          collected_at?: string | null
          control_number?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          invoice_date?: string
          invoice_number: string
          is_collected?: boolean
          month: string
          notes?: string | null
          total_usd?: number
          total_ves?: number
          updated_at?: string
        }
        Update: {
          collected_at?: string | null
          control_number?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          is_collected?: boolean
          month?: string
          notes?: string | null
          total_usd?: number
          total_ves?: number
          updated_at?: string
        }
        Relationships: []
      }
      finance_receivables: {
        Row: {
          amount_usd: number
          amount_ves: number
          collected_at: string | null
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          id: string
          invoice_id: string | null
          is_collected: boolean
          notes: string | null
          source: string
          updated_at: string
        }
        Insert: {
          amount_usd?: number
          amount_ves?: number
          collected_at?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          due_date?: string | null
          id?: string
          invoice_id?: string | null
          is_collected?: boolean
          notes?: string | null
          source?: string
          updated_at?: string
        }
        Update: {
          amount_usd?: number
          amount_ves?: number
          collected_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          invoice_id?: string | null
          is_collected?: boolean
          notes?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_receivables_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "finance_invoices"
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
          premium_payment_date: string | null
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
          premium_payment_date?: string | null
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
          premium_payment_date?: string | null
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
      policy_advisors: {
        Row: {
          advisor_id: string
          advisor_role: string
          created_at: string
          id: string
          policy_id: string
        }
        Insert: {
          advisor_id: string
          advisor_role?: string
          created_at?: string
          id?: string
          policy_id: string
        }
        Update: {
          advisor_id?: string
          advisor_role?: string
          created_at?: string
          id?: string
          policy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_advisors_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_advisors_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_consumptions: {
        Row: {
          amount_bs: number | null
          amount_usd: number | null
          beneficiary_id: string | null
          beneficiary_name: string | null
          created_at: string
          created_by: string | null
          deleted: boolean
          deleted_at: string | null
          deleted_by: string | null
          description: string
          id: string
          policy_id: string
          updated_at: string
          usage_date: string
          usage_type_id: string
        }
        Insert: {
          amount_bs?: number | null
          amount_usd?: number | null
          beneficiary_id?: string | null
          beneficiary_name?: string | null
          created_at?: string
          created_by?: string | null
          deleted?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
          description: string
          id?: string
          policy_id: string
          updated_at?: string
          usage_date: string
          usage_type_id: string
        }
        Update: {
          amount_bs?: number | null
          amount_usd?: number | null
          beneficiary_id?: string | null
          beneficiary_name?: string | null
          created_at?: string
          created_by?: string | null
          deleted?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string
          id?: string
          policy_id?: string
          updated_at?: string
          usage_date?: string
          usage_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_consumptions_beneficiary_id_fkey"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "beneficiaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_consumptions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_consumptions_usage_type_id_fkey"
            columns: ["usage_type_id"]
            isOneToOne: false
            referencedRelation: "usage_types"
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
      renewal_configs: {
        Row: {
          created_at: string
          created_by: string | null
          current_amount: number
          difference: number | null
          email_sent: boolean
          email_sent_at: string | null
          id: string
          new_amount: number | null
          notes: string | null
          pdf_generated: boolean
          pdf_path: string | null
          percentage: number | null
          policy_id: string
          renewal_date: string
          scheduled_send_date: string | null
          status: Database["public"]["Enums"]["renewal_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_amount: number
          difference?: number | null
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          new_amount?: number | null
          notes?: string | null
          pdf_generated?: boolean
          pdf_path?: string | null
          percentage?: number | null
          policy_id: string
          renewal_date: string
          scheduled_send_date?: string | null
          status?: Database["public"]["Enums"]["renewal_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_amount?: number
          difference?: number | null
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          new_amount?: number | null
          notes?: string | null
          pdf_generated?: boolean
          pdf_path?: string | null
          percentage?: number | null
          policy_id?: string
          renewal_date?: string
          scheduled_send_date?: string | null
          status?: Database["public"]["Enums"]["renewal_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "renewal_configs_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_types: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
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
      account_class:
        | "activos"
        | "pasivos"
        | "patrimonio"
        | "ingresos"
        | "costos"
        | "gastos"
        | "ajustes"
      account_nature: "deudora" | "acreedora" | "variable"
      app_role:
        | "acceso_total"
        | "revision_edicion_1"
        | "revision_edicion_2"
        | "revision"
      budget_period:
        | "mensual"
        | "bimestral"
        | "trimestral"
        | "cuatrimestral"
        | "semestral"
        | "anual"
        | "bienal"
        | "trienal"
        | "cuatrienal"
        | "quinquenal"
        | "decenal"
      budget_status: "pendiente" | "pagado" | "vencido" | "pospuesto"
      collection_status: "pendiente" | "contacto_asesor" | "cobrada"
      cost_center_type: "operativo" | "comercial" | "administrativo" | "soporte"
      currency_type: "USD" | "VES" | "EUR" | "USDT"
      entry_status: "borrador" | "publicado" | "cerrado"
      exchange_rate_source: "BCV" | "Binance" | "Kontigo" | "Manual"
      identification_type: "cedula" | "pasaporte" | "ruc" | "otro" | "rif"
      payment_frequency:
        | "mensual"
        | "trimestral"
        | "semestral"
        | "anual"
        | "unico"
        | "mensual_10_cuotas"
        | "mensual_12_cuotas"
        | "bimensual"
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
        | "tomador_titular"
      renewal_status:
        | "pendiente"
        | "programada"
        | "enviada"
        | "error"
        | "completada"
      transaction_type:
        | "deposito"
        | "retiro"
        | "transferencia"
        | "pago"
        | "cobro"
        | "ajuste"
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
      account_class: [
        "activos",
        "pasivos",
        "patrimonio",
        "ingresos",
        "costos",
        "gastos",
        "ajustes",
      ],
      account_nature: ["deudora", "acreedora", "variable"],
      app_role: [
        "acceso_total",
        "revision_edicion_1",
        "revision_edicion_2",
        "revision",
      ],
      budget_period: [
        "mensual",
        "bimestral",
        "trimestral",
        "cuatrimestral",
        "semestral",
        "anual",
        "bienal",
        "trienal",
        "cuatrienal",
        "quinquenal",
        "decenal",
      ],
      budget_status: ["pendiente", "pagado", "vencido", "pospuesto"],
      collection_status: ["pendiente", "contacto_asesor", "cobrada"],
      cost_center_type: ["operativo", "comercial", "administrativo", "soporte"],
      currency_type: ["USD", "VES", "EUR", "USDT"],
      entry_status: ["borrador", "publicado", "cerrado"],
      exchange_rate_source: ["BCV", "Binance", "Kontigo", "Manual"],
      identification_type: ["cedula", "pasaporte", "ruc", "otro", "rif"],
      payment_frequency: [
        "mensual",
        "trimestral",
        "semestral",
        "anual",
        "unico",
        "mensual_10_cuotas",
        "mensual_12_cuotas",
        "bimensual",
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
        "tomador_titular",
      ],
      renewal_status: [
        "pendiente",
        "programada",
        "enviada",
        "error",
        "completada",
      ],
      transaction_type: [
        "deposito",
        "retiro",
        "transferencia",
        "pago",
        "cobro",
        "ajuste",
      ],
    },
  },
} as const
