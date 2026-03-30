import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { associado_id, tipo, descricao, placa, arquivos, origem, company_id } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    const codigo = `EVT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    
    const { data: evento, error } = await supabase.from("eventos_gia").insert([{
      associado_id, tipo, descricao, placa,
      arquivos: arquivos || [],
      origem: origem || "manual",
      status: "aberto",
      company_id,
      codigo
    }]).select().single();
    
    if (error) throw error;
    
    return new Response(JSON.stringify({
      success: true,
      evento_id: evento.id,
      codigo: evento.codigo,
      status: "aberto",
      created_at: evento.created_at
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch(e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
