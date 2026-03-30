import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { lead_nome, cpf_cnpj, placa, modelo, plano, company_id, consultor_id } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    // Buscar tabela de cotas
    const { data: cota } = await supabase.from("tabela_cotas")
      .select("*").eq("company_id", company_id).maybeSingle();
    
    // Calcular valores
    const planos: Record<string, number> = { basico: 149.90, intermediario: 199.90, premium: 289.90, frota: 349.90 };
    const valor_plano = cota?.valor_plano || planos[plano] || 199.90;
    const valor_adesao = cota?.valor_adesao || 0;
    const taxa_percentual = Number(cota?.taxa_admin || 0.15);
    const taxa_admin = valor_plano * taxa_percentual;
    
    const cobertura = {
      colisao: plano !== "basico",
      furto_roubo: true,
      incendio: true,
      assistencia_24h: true,
      carro_reserva: plano === "premium" || plano === "frota",
      vidros: plano !== "basico"
    };
    
    // Salvar cotação
    const { data: cotacao } = await supabase.from("cotacoes").insert([{
      lead_nome, cpf_cnpj, placa, modelo, plano,
      valor_plano, valor_adesao, taxa_admin, cobertura,
      company_id, consultor_id, status: "pendente"
    }]).select().single();
    
    return new Response(JSON.stringify({
      success: true,
      cotacao_id: cotacao?.id,
      valor_plano, valor_adesao, taxa_admin, cobertura,
      validade_horas: 48
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch(e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
