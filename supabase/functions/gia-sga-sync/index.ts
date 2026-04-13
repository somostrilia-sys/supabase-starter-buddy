import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { tipo } = await req.json().catch(() => ({ tipo: "associados" }));
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    // Auth SGA
    const SGA_URL = "https://api.hinova.com.br/api/sga/v2";
    const authRes = await fetch(`${SGA_URL}/usuario/autenticar`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: Deno.env.get("SGA_LOGIN")!,
        senha: Deno.env.get("SGA_SENHA")!,
        tipo_sistema: "A"
      })
    });
    const { token_usuario } = await authRes.json();
    
    let sincronizados = 0;
    
    if (tipo === "associados") {
      const res = await fetch(`${SGA_URL}/listar/associado`, {
        method: "POST", headers: { "Content-Type": "application/json", "token_usuario": token_usuario },
        body: JSON.stringify({ pagina: 1, quantidade: 100 })
      });
      const data = await res.json();
      const lista = data?.lista || [];
      for (const a of lista) {
        await supabase.from("associados").upsert({
          codigo_sga: a.codigo, nome: a.nome,
          cpf_cnpj: (a.cpf_cnpj || "").replace(/\D/g, ""),
          telefone: (a.telefone || "").replace(/\D/g, ""),
          email: a.email,
          situacao: a.situacao === "A" ? "ativo" : "inativo",
          dados_sga: a
        }, { onConflict: "codigo_sga" });
        sincronizados++;
      }
    }
    
    return new Response(JSON.stringify({ success: true, tipo, sincronizados }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch(e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
