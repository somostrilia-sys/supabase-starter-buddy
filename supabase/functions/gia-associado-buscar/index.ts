import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { cpf_cnpj, telefone, placa, codigo_sga } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    // Buscar no banco local primeiro
    let query = supabase.from("associados").select("*, veiculos:vehicle_documents(placa,modelo,ano)");
    if (cpf_cnpj) query = query.eq("cpf_cnpj", cpf_cnpj.replace(/\D/g, ""));
    else if (telefone) query = query.eq("telefone", telefone.replace(/\D/g, ""));
    else if (codigo_sga) query = query.eq("codigo_sga", codigo_sga);
    
    const { data: local } = await query.maybeSingle();
    if (local) return new Response(JSON.stringify({ success: true, source: "local", data: local }), { headers: { ...cors, "Content-Type": "application/json" } });
    
    // Fallback: buscar no SGA
    const SGA_URL = "https://api.hinova.com.br/api/sga/v2";
    const authRes = await fetch(`${SGA_URL}/usuario/autenticar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: "WALK BOT #203", senha: "253425Mk", tipo_sistema: "A" })
    });
    const { token_usuario } = await authRes.json();
    
    const sgaRes = await fetch(`${SGA_URL}/listar/associado`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "token_usuario": token_usuario },
      body: JSON.stringify({ cpf_cnpj: cpf_cnpj || "", pagina: 1, quantidade: 1 })
    });
    const sgaData = await sgaRes.json();
    const assoc = sgaData?.lista?.[0];
    
    if (assoc) {
      // Cachear localmente
      await supabase.from("associados").upsert({
        codigo_sga: assoc.codigo,
        nome: assoc.nome,
        cpf_cnpj: (cpf_cnpj || "").replace(/\D/g, ""),
        telefone: (assoc.telefone || "").replace(/\D/g, ""),
        email: assoc.email,
        situacao: assoc.situacao === "A" ? "ativo" : "inativo",
        dados_sga: assoc
      }, { onConflict: "codigo_sga" });
    }
    
    return new Response(JSON.stringify({ success: !!assoc, source: "sga", data: assoc || null }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch(e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
