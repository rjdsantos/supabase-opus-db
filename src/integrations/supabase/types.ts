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
      admin_status: {
        Row: {
          admin_id: string | null
          data_alteracao: string
          id: string
          id_orcamento: string
          status: Database["public"]["Enums"]["status_orcamento"]
        }
        Insert: {
          admin_id?: string | null
          data_alteracao?: string
          id?: string
          id_orcamento: string
          status: Database["public"]["Enums"]["status_orcamento"]
        }
        Update: {
          admin_id?: string | null
          data_alteracao?: string
          id?: string
          id_orcamento?: string
          status?: Database["public"]["Enums"]["status_orcamento"]
        }
        Relationships: [
          {
            foreignKeyName: "admin_status_id_orcamento_fkey"
            columns: ["id_orcamento"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id_orcamento"]
          },
        ]
      }
      ia_interacoes: {
        Row: {
          acao: string
          created_at: string
          data_interacao: string
          id_cliente: string
          id_interacao: string
          id_sugestao: string
        }
        Insert: {
          acao: string
          created_at?: string
          data_interacao?: string
          id_cliente: string
          id_interacao?: string
          id_sugestao: string
        }
        Update: {
          acao?: string
          created_at?: string
          data_interacao?: string
          id_cliente?: string
          id_interacao?: string
          id_sugestao?: string
        }
        Relationships: []
      }
      ia_sugestoes: {
        Row: {
          campo: string
          created_at: string
          data_geracao: string
          id_orcamento: string
          id_sugestao: string
          status: string
          texto_sugerido: string
        }
        Insert: {
          campo: string
          created_at?: string
          data_geracao?: string
          id_orcamento: string
          id_sugestao?: string
          status?: string
          texto_sugerido: string
        }
        Update: {
          campo?: string
          created_at?: string
          data_geracao?: string
          id_orcamento?: string
          id_sugestao?: string
          status?: string
          texto_sugerido?: string
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          created_at: string
          data_envio: string
          data_tentativa: string | null
          erro_mensagem: string | null
          id_notificacao: string
          id_orcamento: string
          status_envio: string
          tipo: string
        }
        Insert: {
          created_at?: string
          data_envio?: string
          data_tentativa?: string | null
          erro_mensagem?: string | null
          id_notificacao?: string
          id_orcamento: string
          status_envio?: string
          tipo: string
        }
        Update: {
          created_at?: string
          data_envio?: string
          data_tentativa?: string | null
          erro_mensagem?: string | null
          id_notificacao?: string
          id_orcamento?: string
          status_envio?: string
          tipo?: string
        }
        Relationships: []
      }
      orcamento_detalhes: {
        Row: {
          chave: string
          created_at: string
          id_detalhe: string
          id_orcamento: string
          updated_at: string
          valor: string | null
        }
        Insert: {
          chave: string
          created_at?: string
          id_detalhe?: string
          id_orcamento: string
          updated_at?: string
          valor?: string | null
        }
        Update: {
          chave?: string
          created_at?: string
          id_detalhe?: string
          id_orcamento?: string
          updated_at?: string
          valor?: string | null
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_orcamento"]
          created_at: string
          data_envio: string
          id_cliente: string
          id_orcamento: string
          id_orcamento_vinculado: string | null
          is_draft: boolean | null
          status: Database["public"]["Enums"]["status_orcamento"]
          updated_at: string
        }
        Insert: {
          categoria: Database["public"]["Enums"]["categoria_orcamento"]
          created_at?: string
          data_envio?: string
          id_cliente: string
          id_orcamento?: string
          id_orcamento_vinculado?: string | null
          is_draft?: boolean | null
          status?: Database["public"]["Enums"]["status_orcamento"]
          updated_at?: string
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_orcamento"]
          created_at?: string
          data_envio?: string
          id_cliente?: string
          id_orcamento?: string
          id_orcamento_vinculado?: string | null
          is_draft?: boolean | null
          status?: Database["public"]["Enums"]["status_orcamento"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_orcamentos_cliente"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orcamentos_id_orcamento_vinculado_fkey"
            columns: ["id_orcamento_vinculado"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id_orcamento"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
          whatsapp_opt_in: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
          whatsapp_opt_in?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
          whatsapp_opt_in?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_orcamento: {
        Args: { _orcamento_id: string }
        Returns: boolean
      }
    }
    Enums: {
      arvore_tamanho: "ate_1m" | "ate_1_5m" | "ate_2m" | "acima_2m"
      categoria_orcamento: "decoracao" | "lembrancinhas" | "presentes"
      evento_tipo:
        | "aniversario"
        | "cha_de_bebe"
        | "mini_wedding"
        | "batizado"
        | "festa_tematica"
        | "evento_corporativo"
        | "arvore_de_natal"
      status_orcamento: "novo" | "respondido" | "concluido"
      user_role: "client" | "admin"
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
      arvore_tamanho: ["ate_1m", "ate_1_5m", "ate_2m", "acima_2m"],
      categoria_orcamento: ["decoracao", "lembrancinhas", "presentes"],
      evento_tipo: [
        "aniversario",
        "cha_de_bebe",
        "mini_wedding",
        "batizado",
        "festa_tematica",
        "evento_corporativo",
        "arvore_de_natal",
      ],
      status_orcamento: ["novo", "respondido", "concluido"],
      user_role: ["client", "admin"],
    },
  },
} as const
