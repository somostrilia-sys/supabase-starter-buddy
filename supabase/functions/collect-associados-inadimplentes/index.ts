import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SGA_BASE = "https://api.hinova.com.br/api/sga/v2";
const SGA_TOKEN = "cTnhRGJlN2NjOWQ4M2YyYzRlNjE5YjQ4NzZjNmNhMDY=";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body = await req.json();
    const { company_id, dias_atraso_min = 5 } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Tentar buscar localmente
    let localData: any[] = [];
    let useLocal = false;

    try {
      let q = supabase
        .from("associados")
        .select("id, nome, telefone, email, cpf_cnpj, situacao, valor_devido, dias_atraso, company_id")
        .in("situacao", ["inadimplente", "suspenso"]);

      if (company_id) q = q.eq("company_id", company_id);
      if (dias_atraso_min > 0) q = q.gte("dias_atraso", dias_atraso_min);

      const { data, error } = await q;
      if (!error && data && data.length >= 0) {
        localData = data || [];
        useLocal = true;
      }
    } catch {
      useLocal = false;
    }

    if (useLocal) {
      const associados = localData.map((a: any) => ({
        id: a.id,
        nome: a.nome,
        telefone: a.telefone,
        email: a.email,
        cpf_cnpj: a.cpf_cnpj,
        situacao: a.situacao,
        valor_devido: Number(a.valor_devido || 0),
        dias_atraso: Number(a.dias_atraso || 0),
        company_id: a.company_id,
      }));

      return new Response(
        JSON.stringify({
          success: true,
          source: "local",
          total: associados.length,
          associados,
        }),
        { headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    // 2. Fallback SGA API — buscar inadimplentes
    const sgaRes = await fetch(`${SGA_BASE}/listar/associado`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "token": SGA_TOKEN,
      },
      body: JSON.stringify({ situacao: "I", pagina: 1, quantidade: 200 }),
    });

    const sgaData = await sgaRes.json().catch(() => ({}));
    const lista: any[] = sgaData?.lista || sgaData?.data || [];

    const associados = lista
      .filter((a: any) => {
        const dias = Number(a.dias_atraso || a.dias_inadimplente || 0);
        return dias >= dias_atraso_min;
      })
      .map((a: any) => ({
        id: a.codigo || a.id || null,
        nome: a.nome,
        telefone: (a.telefone || a.celular || "").replace(/\D/g, ""),
        email: a.email || null,
        cpf_cnpj: (a.cpf_cnpj || a.cpf || "").replace(/\D/g, ""),
        situacao: "inadimplente",
        valor_devido: Number(a.valor_devido || a.saldo_devedor || 0),
        dias_atraso: Number(a.dias_atraso || a.dias_inadimplente || 0),
        company_id: company_id || null,
      }));

    return new Response(
      JSON.stringify({
        success: true,
        source: "sga",
        total: associados.length,
        associados,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
