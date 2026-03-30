import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

const SGA_URL = "https://api.hinova.com.br/api/sga/v2";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { cod_associado, valor, vencimento, company_id, descricao } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (!cod_associado || !valor || !vencimento) {
      return new Response(JSON.stringify({ success: false, error: "Campos obrigatórios: cod_associado, valor, vencimento" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    let sga_response: any = null;
    let status = "pendente";
    let motivo: string | null = null;

    try {
      // Auth SGA
      const authRes = await fetch(`${SGA_URL}/usuario/autenticar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: "WALK BOT #203", senha: "253425Mk", tipo_sistema: "A" })
      });
      const authData = await authRes.json();
      const token_usuario = authData?.token_usuario;

      if (!token_usuario) {
        motivo = "Falha na autenticação SGA";
        status = "erro";
        sga_response = authData;
      } else {
        // Tentar emitir boleto
        const boletoRes = await fetch(`${SGA_URL}/financeiro/boleto/emitir`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "token_usuario": token_usuario },
          body: JSON.stringify({
            codigo_associado: cod_associado,
            valor: Number(valor),
            data_vencimento: vencimento,
            descricao: descricao || "Mensalidade GIA"
          })
        });

        if (boletoRes.status === 404) {
          motivo = "SGA não suporta emissão direta de boleto — use o painel SGA";
          status = "nao_suportado";
          sga_response = { status: 404, message: "Endpoint não encontrado" };
        } else {
          sga_response = await boletoRes.json();
          if (sga_response?.sucesso || sga_response?.success || sga_response?.boleto) {
            status = "emitido";
          } else {
            status = "erro";
            motivo = sga_response?.mensagem || sga_response?.message || "Erro desconhecido no SGA";
          }
        }
      }
    } catch (sga_err: any) {
      motivo = `Erro ao conectar ao SGA: ${sga_err.message}`;
      status = "erro";
      sga_response = { error: sga_err.message };
    }

    // Logar tentativa
    const { data: log } = await supabase.from("boletos_log").insert([{
      company_id: company_id || null,
      cod_associado: String(cod_associado),
      valor: Number(valor),
      vencimento,
      status,
      sga_response
    }]).select().single();

    const result: any = { success: status === "emitido", status, log_id: log?.id, sga_response };
    if (motivo) result.motivo = motivo;

    return new Response(JSON.stringify(result), {
      headers: { ...cors, "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" }
    });
  }
});
