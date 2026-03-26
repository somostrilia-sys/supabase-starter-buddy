import { SupabaseClient } from "@supabase/supabase-js";

export async function registrarAuditoria(
  supabase: SupabaseClient,
  params: {
    entidade: string;
    entidade_id: string;
    associado_id?: string;
    campo_alterado: string;
    valor_antigo: any;
    valor_novo: any;
    origem_modulo: string;
  }
) {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("audit_log").insert({
    ...params,
    usuario_id: user?.id,
    dados_anteriores: { valor: params.valor_antigo },
    dados_novos: { valor: params.valor_novo },
    acao: `UPDATE_${params.entidade.toUpperCase()}`,
    tabela: params.entidade,
    registro_id: params.entidade_id,
  } as any);
}
