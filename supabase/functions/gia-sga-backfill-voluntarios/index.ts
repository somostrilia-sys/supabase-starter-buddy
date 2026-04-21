// Backfill voluntario_id em veiculos onde está NULL, via SGA /veiculo/buscar/{placa}.
// Cada chamada processa até `limit` veículos; chamar em loop até remaining=0.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const SGA = "https://api.hinova.com.br/api/sga/v2";
const TOKEN = Deno.env.get("SGA_HINOVA_TOKEN")!;
const LOGIN = Deno.env.get("SGA_LOGIN")!;
const SENHA = Deno.env.get("SGA_SENHA")!;

async function auth() {
  const r = await fetch(`${SGA}/usuario/autenticar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${TOKEN}`, "api_token": TOKEN },
    body: JSON.stringify({ usuario: LOGIN, senha: SENHA }),
  });
  const d = await r.json();
  const tu = d.token_usuario || d.token;
  if (!tu) throw new Error(`Auth: ${JSON.stringify(d).slice(0, 150)}`);
  return { "Authorization": `Bearer ${tu}`, "api_token": TOKEN, "token_usuario": tu };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const t0 = Date.now();
  try {
    const { limit = 50, reauth_each = 10 } = await req.json().catch(() => ({}));
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Pega veículos sem voluntario_id, com placa preenchida
    const { data: veics } = await supabase
      .from("veiculos")
      .select("id, placa, codigo_sga")
      .is("voluntario_id", null)
      .not("placa", "is", null)
      .limit(limit);

    const lista = veics || [];
    if (!lista.length) {
      return new Response(JSON.stringify({ sucesso: true, processados: 0, remaining: 0, ms: Date.now() - t0 }),
        { headers: { ...CORS, "Content-Type": "application/json" } });
    }

    let headers = await auth();
    let ok = 0, sem_vol = 0, sem_dados_sga = 0, sem_match_vol = 0, erros = 0;
    const amostra: any[] = [];

    for (let i = 0; i < lista.length; i++) {
      const v = lista[i];
      if (i > 0 && i % reauth_each === 0) {
        try { headers = await auth(); } catch (_e) {}
      }
      try {
        let r = await fetch(`${SGA}/veiculo/buscar/${encodeURIComponent(v.placa)}`, { headers });
        if (r.status === 401) { headers = await auth(); r = await fetch(`${SGA}/veiculo/buscar/${encodeURIComponent(v.placa)}`, { headers }); }
        if (!r.ok) { sem_dados_sga++; continue; }
        const j = await r.json();
        const bo = Array.isArray(j) ? j[0] : j;
        const codVol = bo?.codigo_voluntario;
        const nomeVol = bo?.nome_voluntario;
        if (!codVol) { sem_vol++; continue; }

        // Busca voluntário por codigo_voluntario_sga; se não existir, cria
        let { data: vol } = await supabase
          .from("voluntarios")
          .select("id")
          .eq("codigo_voluntario_sga", String(codVol))
          .maybeSingle();

        if (!vol && nomeVol) {
          const { data: novo } = await supabase
            .from("voluntarios")
            .insert({
              codigo_voluntario_sga: String(codVol),
              nome: String(nomeVol),
              cpf: bo?.cpf_voluntario ? String(bo.cpf_voluntario).replace(/\D/g, "") : null,
              ativo: true,
            })
            .select("id")
            .single();
          vol = novo || null;
        }
        if (!vol) { sem_match_vol++; continue; }

        await supabase.from("veiculos").update({
          voluntario_id: vol.id,
          codigo_voluntario_sga: String(codVol),
        }).eq("id", v.id);
        ok++;
        if (amostra.length < 3) amostra.push({ placa: v.placa, vol: nomeVol });
      } catch (e: any) {
        erros++;
      }
    }

    const { count: remaining } = await supabase
      .from("veiculos")
      .select("id", { count: "exact", head: true })
      .is("voluntario_id", null)
      .not("placa", "is", null);

    return new Response(JSON.stringify({
      sucesso: true, processados: lista.length, ok, sem_vol, sem_dados_sga, sem_match_vol, erros,
      remaining, ms: Date.now() - t0, amostra,
    }), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ sucesso: false, erro: e.message, ms: Date.now() - t0 }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
