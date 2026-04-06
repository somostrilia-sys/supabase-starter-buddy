import { supabase } from "@/integrations/supabase/client";

export async function logAudit(params: {
  acao: string;
  entidade: string;
  entidade_id?: string;
  dados_antes?: any;
  dados_depois?: any;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: usr } = user?.email
      ? await supabase.from("usuarios").select("id, nome").eq("email", user.email).limit(1).maybeSingle()
      : { data: null };

    await (supabase as any).from("audit_log").insert({
      usuario_id: (usr as any)?.id || null,
      usuario_nome: (usr as any)?.nome || user?.email || "Sistema",
      acao: params.acao,
      entidade: params.entidade,
      entidade_id: params.entidade_id,
      dados_antes: params.dados_antes || null,
      dados_depois: params.dados_depois || null,
    });
  } catch (e) {
    console.error("Audit log error:", e);
  }
}
