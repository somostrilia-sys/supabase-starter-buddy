import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { company_id, mes, tipo } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    const inicio = `${mes}-01`;
    const fim = `${mes}-31`;
    
    // Buscar fechamentos Trilia
    const { data: fechamentos } = await supabase.from("trilho_fechamentos")
      .select("*, trilho_fechamento_items(*)")
      .gte("created_at", inicio).lte("created_at", fim);
    
    // Buscar pedidos
    const { data: orders } = await supabase.from("orders")
      .select("total,status").gte("created_at", inicio).lte("created_at", fim);
    
    const receita = (orders || []).filter(o => o.status === "pago").reduce((s: number, o: any) => s + Number(o.total || 0), 0);
    const eventos = (fechamentos || []).length;
    
    return new Response(JSON.stringify({
      success: true,
      mes, tipo, company_id,
      receita, eventos,
      fechamentos: fechamentos || [],
      orders_total: orders?.length || 0
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch(e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
