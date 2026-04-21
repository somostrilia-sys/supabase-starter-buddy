/**
 * gia-sync-fipe
 * Sincroniza marcas e modelos da FIPE (via BrasilAPI) para as tabelas
 * marcas_veiculo e modelos_veiculo, usadas pela Tabela Mestre (Errata 2).
 *
 * Modo de uso:
 *   - POST sem body → sincroniza todos os tipos (carros, motos, caminhoes)
 *   - POST { tipo: "carros" | "motos" | "caminhoes" } → só esse tipo
 *   - POST { marca: "Volkswagen" } → só essa marca (em todos tipos aplicáveis)
 *
 * Retorna contagem por tipo/marca.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

const FIPE_BASE = "https://brasilapi.com.br/api/fipe";
const TIPOS = ["carros", "motos", "caminhoes"] as const;
type Tipo = typeof TIPOS[number];

const TIPO_VEICULO_MAP: Record<Tipo, string> = {
  carros: "Carros e Utilitários Pequenos",
  motos: "Motos",
  caminhoes: "Pesados e Vans",
};

async function fetchJson(url: string, retries = 2): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }
}

async function syncTipo(supabase: any, tipo: Tipo, filtroMarca?: string): Promise<{ marcas: number; modelos: number }> {
  const brands: any[] = await fetchJson(`${FIPE_BASE}/marcas/v1/${tipo}`);
  let marcasCount = 0;
  let modelosCount = 0;
  const tipoLabel = TIPO_VEICULO_MAP[tipo];

  const marcasAlvo = filtroMarca
    ? brands.filter(b => (b.nome || "").toLowerCase().includes(filtroMarca.toLowerCase()))
    : brands;

  for (const b of marcasAlvo) {
    // Upsert marca
    const { data: marcaRow, error: mErr } = await supabase
      .from("marcas_veiculo")
      .upsert({
        nome: b.nome,
        codigo_fipe: String(b.valor || b.codigo || ""),
        tipo_veiculo: tipoLabel,
        ativa: true,
      }, { onConflict: "nome" })
      .select("id")
      .single();

    if (mErr || !marcaRow) {
      console.warn(`Falha ao upsert marca ${b.nome}:`, mErr?.message);
      continue;
    }
    marcasCount++;

    // Modelos desta marca (BrasilAPI: /fipe/veiculos/v1/{tipo}/{codigo_marca})
    try {
      const modelos: any[] = await fetchJson(`${FIPE_BASE}/veiculos/v1/${tipo}/${b.valor || b.codigo}`);
      if (!Array.isArray(modelos) || modelos.length === 0) continue;

      // Deduplicar por cod_fipe (algumas marcas retornam o mesmo modelo em anos diferentes)
      const seen = new Set<string>();
      const rowsToUpsert = modelos
        .filter(m => {
          const cf = m.codigo_fipe || m.codigoFipe || "";
          if (!cf || seen.has(cf)) return false;
          seen.add(cf);
          return true;
        })
        .map(m => ({
          marca_id: marcaRow.id,
          nome: m.modelo || m.nome || "",
          cod_fipe: m.codigo_fipe || m.codigoFipe || "",
          tipo_veiculo: tipoLabel,
          aceito: true,
        }))
        .filter(r => r.nome && r.cod_fipe);

      if (rowsToUpsert.length === 0) continue;

      // Upsert em lotes de 200 para não estourar o payload
      for (let i = 0; i < rowsToUpsert.length; i += 200) {
        const batch = rowsToUpsert.slice(i, i + 200);
        const { error: inErr } = await supabase
          .from("modelos_veiculo")
          .upsert(batch, { onConflict: "marca_id,cod_fipe" });
        if (inErr) {
          console.warn(`Falha ao upsert modelos ${b.nome} lote ${i}:`, inErr.message);
        } else {
          modelosCount += batch.length;
        }
      }
    } catch (err) {
      console.warn(`Falha ao buscar modelos de ${b.nome}:`, err instanceof Error ? err.message : err);
    }
  }

  return { marcas: marcasCount, modelos: modelosCount };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body = await req.json().catch(() => ({}));
    const { tipo, marca } = body || {};

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const tiposParaSync: Tipo[] = tipo && TIPOS.includes(tipo as Tipo) ? [tipo as Tipo] : [...TIPOS];

    const resultado: Record<string, { marcas: number; modelos: number }> = {};
    for (const t of tiposParaSync) {
      resultado[t] = await syncTipo(supabase, t, marca);
    }

    const totalMarcas = Object.values(resultado).reduce((s, r) => s + r.marcas, 0);
    const totalModelos = Object.values(resultado).reduce((s, r) => s + r.modelos, 0);

    return jsonRes({
      sucesso: true,
      total_marcas: totalMarcas,
      total_modelos: totalModelos,
      por_tipo: resultado,
      filtro: { tipo: tipo || "todos", marca: marca || "todas" },
    });
  } catch (err) {
    console.error("gia-sync-fipe error:", err);
    return jsonRes(
      { sucesso: false, error: err instanceof Error ? err.message : "Erro interno" },
      500,
    );
  }
});
