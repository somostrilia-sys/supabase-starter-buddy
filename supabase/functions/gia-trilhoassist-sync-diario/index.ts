// GIA: sync diário de atendimentos do Trilho Assist.
// Cron 09:00 UTC (06:00 BRT).
//
// GET Trilho Assist /atendimentos do dia anterior →
//   POST finance-receber-atendimento (WF) DIRETO + log local em atendimento_sync_log
//   (removi o proxy gia-ingest-atendimento pra evitar rate limit inter-edges)
//
// Secrets: TRILHO_ASSIST_API_URL, TRILHO_ASSIST_TOKEN, GIA_INGEST_API_KEY, OBJETIVO_COMPANY_ID, WF_URL

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-api-key",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function yesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const TRILHO_URL = Deno.env.get("TRILHO_ASSIST_API_URL")!;
  const TRILHO_TOKEN = Deno.env.get("TRILHO_ASSIST_TOKEN")!;
  const INGEST_KEY = Deno.env.get("GIA_INGEST_API_KEY")!;
  const COMPANY_ID = Deno.env.get("OBJETIVO_COMPANY_ID")!;

  if (!TRILHO_URL || !TRILHO_TOKEN || !INGEST_KEY || !COMPANY_ID) {
    return json({ error: "secrets ausentes" }, 500);
  }

  const body = await req.json().catch(() => ({}));
  const dataInicio = body?.data_inicio || yesterday();
  const dataFim = body?.data_fim || dataInicio;

  // 1. GET /atendimentos Trilho Assist (endpoint real: date_from/date_to)
  const url = `${TRILHO_URL}/atendimentos?date_from=${dataInicio}&date_to=${dataFim}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TRILHO_TOKEN}` },
  });
  if (!res.ok) {
    const txt = await res.text();
    return json({ error: "Trilho Assist retornou erro", status: res.status, body: txt }, 502);
  }
  const trilhoData = await res.json();
  const atendimentos: any[] = trilhoData.atendimentos || [];

  const wfUrl = Deno.env.get("WF_URL") || "https://xytnibnqztjaixemlepb.supabase.co";
  const wfServiceKey = Deno.env.get("WF_SERVICE_ROLE_KEY") || Deno.env.get("WALK_FINANCE_SERVICE_KEY");
  if (!wfServiceKey) {
    return json({ error: "WF_SERVICE_ROLE_KEY ausente" }, 500);
  }

  const supaWF = createClient(wfUrl, wfServiceKey);

  // Resolver cooperativa_id por nome em batch
  const coopNames = [...new Set(atendimentos.map((a) => a.cooperativa).filter(Boolean))];
  const coopMap = new Map<string, string>();
  if (coopNames.length > 0) {
    const { data: coops } = await supaWF
      .from("cooperativas")
      .select("id, nome")
      .eq("company_id", COMPANY_ID)
      .in("nome", coopNames as string[]);
    for (const c of (coops || []) as any[]) coopMap.set(c.nome, c.id);
  }

  const rows = atendimentos.map((a) => ({
    company_id: COMPANY_ID,
    gia_id: a.protocolo,
    placa: a.veiculo?.placa || null,
    beneficiario: a.beneficiario?.nome || null,
    tipo: a.servico?.tipo || "guincho",
    descricao: a.servico?.evento || null,
    data_atendimento: a.data_conclusao || null,
    km_percorrido: Number(a.km || 0),
    prestador: a.prestador?.nome || null,
    custo: Number(a.valor_cobrado || 0),
    origem_cidade: a.origem || null,
    destino_cidade: a.destino || null,
    cooperativa_nome: a.cooperativa || null,
    cooperativa_id: a.cooperativa ? coopMap.get(a.cooperativa) || null : null,
    status: "completed",
  }));

  let okCount = 0;
  let errCount = 0;
  const errSamples: { status: number; msg: string }[] = [];

  // Upsert batch (100 em 100) por (company_id, gia_id)
  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supaWF
      .from("atendimentos_assistencia")
      .upsert(chunk, { onConflict: "gia_id" });
    if (error) {
      errCount += chunk.length;
      if (errSamples.length < 3) {
        errSamples.push({ status: 500, msg: error.message.slice(0, 300) });
      }
    } else {
      okCount += chunk.length;
    }
  }

  // Log local no GIA (1 linha por execução)
  try {
    const supaLocal = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await supaLocal.from("atendimento_sync_log").insert({
      gia_id: `sync-${dataInicio}_${dataFim}`,
      destino: "walk_finance",
      status: errCount === 0 ? "ok" : "parcial",
      payload: { data_inicio: dataInicio, data_fim: dataFim, total: atendimentos.length },
      response: { ok: okCount, err: errCount, samples: errSamples },
    });
  } catch { /* opcional */ }

  return json({
    success: errCount === 0,
    data_inicio: dataInicio,
    data_fim: dataFim,
    total_trilho: atendimentos.length,
    ingest_ok: okCount,
    ingest_erros: errCount,
    cooperativas_matched: coopMap.size,
    amostra_erros: errSamples,
  });
});
