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
      agency_config: {
        Row: {
          contact_address: string | null
          contact_city: string | null
          contact_cpf: string | null
          contact_marital_status: string | null
          contact_nationality: string | null
          contact_neighborhood: string | null
          contact_postal_code: string | null
          contact_profession: string | null
          contact_rg: string | null
          contact_rg_issuer: string | null
          contact_state: string | null
          created_at: string | null
          id: number
          location_id: string
          opportunity_building: string | null
          opportunity_floor: string | null
          opportunity_name: string
          opportunity_observations: string | null
          opportunity_parking_spots: string | null
          opportunity_reserve_until: string | null
          opportunity_responsible: string | null
          opportunity_tower: string | null
          opportunity_unit: string | null
          table_url: string | null
          updated_at: string | null
        }
        Insert: {
          contact_address?: string | null
          contact_city?: string | null
          contact_cpf?: string | null
          contact_marital_status?: string | null
          contact_nationality?: string | null
          contact_neighborhood?: string | null
          contact_postal_code?: string | null
          contact_profession?: string | null
          contact_rg?: string | null
          contact_rg_issuer?: string | null
          contact_state?: string | null
          created_at?: string | null
          id?: number
          location_id: string
          opportunity_building?: string | null
          opportunity_floor?: string | null
          opportunity_name: string
          opportunity_observations?: string | null
          opportunity_parking_spots?: string | null
          opportunity_reserve_until?: string | null
          opportunity_responsible?: string | null
          opportunity_tower?: string | null
          opportunity_unit?: string | null
          table_url?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_address?: string | null
          contact_city?: string | null
          contact_cpf?: string | null
          contact_marital_status?: string | null
          contact_nationality?: string | null
          contact_neighborhood?: string | null
          contact_postal_code?: string | null
          contact_profession?: string | null
          contact_rg?: string | null
          contact_rg_issuer?: string | null
          contact_state?: string | null
          created_at?: string | null
          id?: number
          location_id?: string
          opportunity_building?: string | null
          opportunity_floor?: string | null
          opportunity_name?: string
          opportunity_observations?: string | null
          opportunity_parking_spots?: string | null
          opportunity_reserve_until?: string | null
          opportunity_responsible?: string | null
          opportunity_tower?: string | null
          opportunity_unit?: string | null
          table_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      buildings: {
        Row: {
          address: string
          agency_id: string
          city: string
          created_at: string | null
          gid: number | null
          id: string
          name: string
          state: string
          updated_at: string | null
        }
        Insert: {
          address: string
          agency_id?: string
          city: string
          created_at?: string | null
          gid?: number | null
          id?: string
          name: string
          state: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          agency_id?: string
          city?: string
          created_at?: string | null
          gid?: number | null
          id?: string
          name?: string
          state?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string | null
          homio_id: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          homio_id: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          homio_id?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      installments: {
        Row: {
          amount_per_installment: number
          created_at: string | null
          id: string
          installments_count: number
          proposal_id: string | null
          total_amount: number
          type: Database["public"]["Enums"]["installment_type"]
          updated_at: string | null
        }
        Insert: {
          amount_per_installment: number
          created_at?: string | null
          id?: string
          installments_count: number
          proposal_id?: string | null
          total_amount: number
          type: Database["public"]["Enums"]["installment_type"]
          updated_at?: string | null
        }
        Update: {
          amount_per_installment?: number
          created_at?: string | null
          id?: string
          installments_count?: number
          proposal_id?: string | null
          total_amount?: number
          type?: Database["public"]["Enums"]["installment_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals_match"
            referencedColumns: ["id"]
          },
        ]
      }
      installments_dates: {
        Row: {
          created_at: string | null
          date: string
          id: string
          installment_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          installment_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          installment_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installments_dates_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "installments"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_adjustment_rates: {
        Row: {
          april_rate: number
          august_rate: number
          created_at: string
          december_rate: number
          february_rate: number
          id: string
          january_rate: number
          july_rate: number
          june_rate: number
          march_rate: number
          may_rate: number
          november_rate: number
          october_rate: number
          september_rate: number
          unit_id: string
          updated_at: string
          year: number
        }
        Insert: {
          april_rate?: number
          august_rate?: number
          created_at?: string
          december_rate?: number
          february_rate?: number
          id?: string
          january_rate?: number
          july_rate?: number
          june_rate?: number
          march_rate?: number
          may_rate?: number
          november_rate?: number
          october_rate?: number
          september_rate?: number
          unit_id: string
          updated_at?: string
          year: number
        }
        Update: {
          april_rate?: number
          august_rate?: number
          created_at?: string
          december_rate?: number
          february_rate?: number
          id?: string
          january_rate?: number
          july_rate?: number
          june_rate?: number
          march_rate?: number
          may_rate?: number
          november_rate?: number
          october_rate?: number
          september_rate?: number
          unit_id?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_adjustment_rates_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      preferences: {
        Row: {
          agency: number
          canManageBuildings: Database["public"]["Enums"]["permission_type"]
          canManageOnlyAssinedProposals: boolean
          canManageProposals: Database["public"]["Enums"]["permission_type"]
          canViewBuildings: Database["public"]["Enums"]["permission_type"]
          canViewProposals: Database["public"]["Enums"]["permission_type"]
          created_at: string
          id: number
        }
        Insert: {
          agency: number
          canManageBuildings?: Database["public"]["Enums"]["permission_type"]
          canManageOnlyAssinedProposals?: boolean
          canManageProposals?: Database["public"]["Enums"]["permission_type"]
          canViewBuildings?: Database["public"]["Enums"]["permission_type"]
          canViewProposals?: Database["public"]["Enums"]["permission_type"]
          created_at?: string
          id?: number
        }
        Update: {
          agency?: number
          canManageBuildings?: Database["public"]["Enums"]["permission_type"]
          canManageOnlyAssinedProposals?: boolean
          canManageProposals?: Database["public"]["Enums"]["permission_type"]
          canViewBuildings?: Database["public"]["Enums"]["permission_type"]
          canViewProposals?: Database["public"]["Enums"]["permission_type"]
          created_at?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "preferences_agency_fkey"
            columns: ["agency"]
            isOneToOne: false
            referencedRelation: "agency_config"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agency_id: string
          created_at: string | null
          email: string | null
          homio_user_id: string | null
          id: string
          name: string | null
          role: Database["public"]["Enums"]["profile_roles"] | null
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          email?: string | null
          homio_user_id?: string | null
          id: string
          name?: string | null
          role?: Database["public"]["Enums"]["profile_roles"] | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          email?: string | null
          homio_user_id?: string | null
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["profile_roles"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      proposals: {
        Row: {
          agency_id: string
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          notes: string | null
          opportunity_id: string
          primary_contact_id: string
          proposal_date: string
          reserved_until: string | null
          responsible: string
          secondary_contact_id: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          agency_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          opportunity_id: string
          primary_contact_id: string
          proposal_date: string
          reserved_until?: string | null
          responsible: string
          secondary_contact_id?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          opportunity_id?: string
          primary_contact_id?: string
          proposal_date?: string
          reserved_until?: string | null
          responsible?: string
          secondary_contact_id?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_proposals_match"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_secondary_contact_id_fkey"
            columns: ["secondary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          agency_id: string
          bedroom_count: number
          building_id: string
          created_at: string | null
          floor: string | null
          garden_area: number
          gross_price_amount: number
          id: string
          name: string
          number: string
          parking_space_count: number
          price_correction_rate: number
          private_area: number
          status: Database["public"]["Enums"]["unit_status"]
          total_area: number
          tower: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id?: string
          bedroom_count?: number
          building_id: string
          created_at?: string | null
          floor?: string | null
          garden_area?: number
          gross_price_amount?: number
          id?: string
          name: string
          number: string
          parking_space_count?: number
          price_correction_rate?: number
          private_area?: number
          status?: Database["public"]["Enums"]["unit_status"]
          total_area?: number
          tower?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          bedroom_count?: number
          building_id?: string
          created_at?: string | null
          floor?: string | null
          garden_area?: number
          gross_price_amount?: number
          id?: string
          name?: string
          number?: string
          parking_space_count?: number
          price_correction_rate?: number
          private_area?: number
          status?: Database["public"]["Enums"]["unit_status"]
          total_area?: number
          tower?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      buildings_units_view: {
        Row: {
          agency_id: string | null
          building_name: string | null
          floor: string | null
          number: string | null
          status: Database["public"]["Enums"]["unit_status"] | null
          tower: string | null
          unit_name: string | null
        }
        Relationships: []
      }
      profiles_proposals_match: {
        Row: {
          agency_id: string | null
          id: string | null
          name: string | null
          role: Database["public"]["Enums"]["profile_roles"] | null
        }
        Relationships: []
      }
      proposals_match: {
        Row: {
          agency_id: string | null
          building_name: string | null
          created_by: string | null
          id: string | null
          name: string | null
          opportunity_id: string | null
          primary_contact_name: string | null
          proposal_date: string | null
          status: Database["public"]["Enums"]["proposal_status"] | null
          total_installments_amount: number | null
          unit_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_proposals_match"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_my_agency_id: { Args: never; Returns: string }
    }
    Enums: {
      installment_type:
        | "sinal"
        | "mensal"
        | "anual"
        | "parcela_unica"
        | "financiamento"
        | "mensais"
        | "intermediarias"
        | "anuais"
        | "semestrais"
        | "bimestrais"
        | "trimestrais"
      permission_type: "admin" | "adminAndUser"
      profile_roles: "admin" | "user"
      proposal_status: "denied" | "under_review" | "approved"
      unit_status: "sold" | "reserved" | "available"
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
      installment_type: [
        "sinal",
        "mensal",
        "anual",
        "parcela_unica",
        "financiamento",
        "mensais",
        "intermediarias",
        "anuais",
        "semestrais",
        "bimestrais",
        "trimestrais",
      ],
      permission_type: ["admin", "adminAndUser"],
      profile_roles: ["admin", "user"],
      proposal_status: ["denied", "under_review", "approved"],
      unit_status: ["sold", "reserved", "available"],
    },
  },
} as const
