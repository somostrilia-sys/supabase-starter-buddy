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
      associados: {
        Row: {
          cep: string | null
          cidade: string | null
          cpf: string
          created_at: string
          data_adesao: string
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          plano_id: string | null
          rg: string | null
          status: Database["public"]["Enums"]["associado_status"]
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cpf: string
          created_at?: string
          data_adesao?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          plano_id?: string | null
          rg?: string | null
          status?: Database["public"]["Enums"]["associado_status"]
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cpf?: string
          created_at?: string
          data_adesao?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          plano_id?: string | null
          rg?: string | null
          status?: Database["public"]["Enums"]["associado_status"]
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "associados_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      mensalidades: {
        Row: {
          associado_id: string
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          id: string
          observacoes: string | null
          referencia: string | null
          status: Database["public"]["Enums"]["mensalidade_status"]
          updated_at: string
          valor: number
        }
        Insert: {
          associado_id: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          id?: string
          observacoes?: string | null
          referencia?: string | null
          status?: Database["public"]["Enums"]["mensalidade_status"]
          updated_at?: string
          valor: number
        }
        Update: {
          associado_id?: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          id?: string
          observacoes?: string | null
          referencia?: string | null
          status?: Database["public"]["Enums"]["mensalidade_status"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "mensalidades_associado_id_fkey"
            columns: ["associado_id"]
            isOneToOne: false
            referencedRelation: "associados"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          ativo: boolean
          cobertura: Json | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
          valor_mensal: number
        }
        Insert: {
          ativo?: boolean
          cobertura?: Json | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
          valor_mensal?: number
        }
        Update: {
          ativo?: boolean
          cobertura?: Json | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
          valor_mensal?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sinistros: {
        Row: {
          associado_id: string
          boletim_ocorrencia: string | null
          created_at: string
          data_ocorrencia: string
          descricao: string
          id: string
          local_ocorrencia: string | null
          observacoes: string | null
          status: Database["public"]["Enums"]["sinistro_status"]
          tipo: Database["public"]["Enums"]["sinistro_tipo"]
          updated_at: string
          valor_aprovado: number | null
          valor_estimado: number | null
          veiculo_id: string | null
        }
        Insert: {
          associado_id: string
          boletim_ocorrencia?: string | null
          created_at?: string
          data_ocorrencia: string
          descricao: string
          id?: string
          local_ocorrencia?: string | null
          observacoes?: string | null
          status?: Database["public"]["Enums"]["sinistro_status"]
          tipo: Database["public"]["Enums"]["sinistro_tipo"]
          updated_at?: string
          valor_aprovado?: number | null
          valor_estimado?: number | null
          veiculo_id?: string | null
        }
        Update: {
          associado_id?: string
          boletim_ocorrencia?: string | null
          created_at?: string
          data_ocorrencia?: string
          descricao?: string
          id?: string
          local_ocorrencia?: string | null
          observacoes?: string | null
          status?: Database["public"]["Enums"]["sinistro_status"]
          tipo?: Database["public"]["Enums"]["sinistro_tipo"]
          updated_at?: string
          valor_aprovado?: number | null
          valor_estimado?: number | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sinistros_associado_id_fkey"
            columns: ["associado_id"]
            isOneToOne: false
            referencedRelation: "associados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sinistros_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculos: {
        Row: {
          ano: number | null
          associado_id: string
          chassi: string | null
          cor: string | null
          created_at: string
          id: string
          marca: string
          modelo: string
          placa: string
          renavam: string | null
          updated_at: string
          valor_fipe: number | null
        }
        Insert: {
          ano?: number | null
          associado_id: string
          chassi?: string | null
          cor?: string | null
          created_at?: string
          id?: string
          marca: string
          modelo: string
          placa: string
          renavam?: string | null
          updated_at?: string
          valor_fipe?: number | null
        }
        Update: {
          ano?: number | null
          associado_id?: string
          chassi?: string | null
          cor?: string | null
          created_at?: string
          id?: string
          marca?: string
          modelo?: string
          placa?: string
          renavam?: string | null
          updated_at?: string
          valor_fipe?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_associado_id_fkey"
            columns: ["associado_id"]
            isOneToOne: false
            referencedRelation: "associados"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      associado_status: "ativo" | "inativo" | "suspenso" | "cancelado"
      mensalidade_status: "pendente" | "pago" | "atrasado" | "cancelado"
      sinistro_status:
        | "aberto"
        | "em_analise"
        | "aprovado"
        | "negado"
        | "finalizado"
      sinistro_tipo:
        | "roubo"
        | "furto"
        | "colisao"
        | "incendio"
        | "alagamento"
        | "outros"
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
      associado_status: ["ativo", "inativo", "suspenso", "cancelado"],
      mensalidade_status: ["pendente", "pago", "atrasado", "cancelado"],
      sinistro_status: [
        "aberto",
        "em_analise",
        "aprovado",
        "negado",
        "finalizado",
      ],
      sinistro_tipo: [
        "roubo",
        "furto",
        "colisao",
        "incendio",
        "alagamento",
        "outros",
      ],
    },
  },
} as const
