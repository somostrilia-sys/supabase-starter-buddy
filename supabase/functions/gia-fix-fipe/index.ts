/**
 * gia-fix-fipe
 * Corrige tipo_veiculo e re-processa cache_fipe das negociações.
 *
 * Modos:
 *   { modo: "corrigir_tipo" }        — Atualiza tipo_veiculo das negociações classificadas errado
 *   { modo: "reprocessar_fipe", lote: N } — Re-busca FIPE em lotes de N (default 10)
 *   { modo: "reprocessar_placa", placa: "XXX" } — Re-busca FIPE de uma placa específica
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIPE_BASE = "https://parallelum.com.br/fipe/api/v1";

const PESADOS_KW = [
  "scania", "volvo fh", "volvo fm", "volvo vm", "volvo nh", "volvo nl",
  "iveco", "man ", "daf", "accelo", "cargo", "worker", "constellation",
  "tector", "atego", "axor", "actros", "arocs", "atron",
  "delivery", "meteor", "volksbus", "e-delivery",
  "ford f-4000", "ford f-350", "ônibus", "onibus", "micro-ônibus",
];
const PESADO_NUMERICO = /\b(\d{1,2}[.\-]\d{3})\b/;
const VANS_KW = ["sprinter", "daily", "ducato", "master", "boxer", "transit", "jumper", "hr ", "bongo", "topic", "kombi"];
const MOTOS_KW = [
  "cg ", "cb ", "xre", "pcx", "nmax", "fazer", "twister", "titan", "fan ", "biz",
  "bros", "lander", "mt-", "yzf", "ninja", "duke", "moto", "honda cg", "yamaha",
  "suzuki", "dafra", "shineray", "haojue", "kasinski", "kawasaki",
  "ducati", "vespa", "piaggio", "benelli", "aprilia", "husqvarna",
  "ktm", "harley", "triumph", "royal enfield", "bmw gs", "bmw r",
  "motocicleta", "ciclomotor", "scooter", "triciclo",
];
const UTILITARIOS_KW = ["fiorino", "kangoo", "doblo", "doblò", "partner", "berlingo", "saveiro", "strada", "montana", "toro"];

function detectarTipoCorreto(modelo: string): string {
  const m = (modelo || "").toLowerCase();
  if (MOTOS_KW.some(kw => m.includes(kw))) return "Motocicleta";
  if (["ônibus", "onibus", "micro-ônibus", "micro-onibus"].some(kw => m.includes(kw))) return "Pesados";
  if (PESADOS_KW.some(kw => m.includes(kw)) || PESADO_NUMERICO.test(m)) return "Pesados";
  if (VANS_KW.some(kw => m.includes(kw))) return "Vans e Pesados Pequenos";
  if (UTILITARIOS_KW.some(kw => m.includes(kw))) return "Utilitários";
  return "Automóvel";
}

function detectarTipoFipe(modelo: string): string {
  const m = (modelo || "").toLowerCase();
  if (MOTOS_KW.some(kw => m.includes(kw))) return "motos";
  if (PESADOS_KW.some(kw => m.includes(kw)) || PESADO_NUMERICO.test(m)) return "caminhoes";
  return "carros";
}

const MARCA_ALIASES: Record<string, string[]> = {
  "vw": ["volkswagen"], "mb": ["mercedes-benz", "mercedes"], "gm": ["chevrolet"],
  "volkswagen": ["vw"], "mercedes-benz": ["mb", "mercedes"], "chevrolet": ["gm"],
  "saab-scania": ["scania"], "mercedes": ["mercedes-benz"],
};

async function buscarFipePorModelo(marca: string, modelo: string, ano: string) {
  const tipoDetectado = detectarTipoFipe(modelo);
  const tipos = [tipoDetectado, ...["carros", "caminhoes", "motos"].filter(t => t !== tipoDetectado)];

  for (const tipo of tipos) {
    try {
      const marcaNorm = (marca || "").toLowerCase().trim();
      const aliases = MARCA_ALIASES[marcaNorm] || [];

      const marcasRes = await fetch(`${FIPE_BASE}/${tipo}/marcas`, { signal: AbortSignal.timeout(5000) });
      if (!marcasRes.ok) continue;
      const marcasList = await marcasRes.json();

      const marcaMatch = marcasList.find((m: any) => {
        const nome = (m.nome || "").toLowerCase();
        return nome.includes(marcaNorm) || marcaNorm.includes(nome) || aliases.some((a: string) => nome.includes(a));
      });
      if (!marcaMatch) continue;

      const modelosRes = await fetch(`${FIPE_BASE}/${tipo}/marcas/${marcaMatch.codigo}/modelos`, { signal: AbortSignal.timeout(5000) });
      if (!modelosRes.ok) continue;
      const modelosData = await modelosRes.json();
      const modelosList = modelosData.modelos || [];

      const modeloNorm = (modelo || "").toLowerCase().trim();
      let modeloMatch = modelosList.find((m: any) => (m.nome || "").toLowerCase().includes(modeloNorm));
      if (!modeloMatch) {
        modeloMatch = modelosList.find((m: any) => modeloNorm.includes((m.nome || "").toLowerCase().replace(/\s*\d+p\s*\(.*?\)/g, "").trim()));
      }
      if (!modeloMatch) {
        // Match por nome FIPE contido no modelo informado (ex: "Accelo 915C" encontra em "MERCEDES-BENZ Accelo 915C 2p (diesel)")
        modeloMatch = modelosList.find((m: any) => {
          const nomeFipe = (m.nome || "").toLowerCase().replace(/\s*\d+p\s*\(.*?\)/g, "").trim();
          return modeloNorm.includes(nomeFipe);
        });
      }
      if (!modeloMatch) {
        const tokens = modeloNorm.split(/[\s\-\/]+/).filter((p: string) => p.length >= 2);
        let bestScore = 0;
        for (const m of modelosList) {
          const nome = (m.nome || "").toLowerCase();
          const score = tokens.filter((t: string) => nome.includes(t)).length;
          if (score > bestScore && score >= Math.max(2, Math.ceil(tokens.length * 0.4))) {
            bestScore = score;
            modeloMatch = m;
          }
        }
      }
      if (!modeloMatch) continue;

      const anosRes = await fetch(`${FIPE_BASE}/${tipo}/marcas/${marcaMatch.codigo}/modelos/${modeloMatch.codigo}/anos`, { signal: AbortSignal.timeout(5000) });
      if (!anosRes.ok) continue;
      const anosList = await anosRes.json();

      // Filtrar "32000" (zero km) e preferir ano modelo
      const anosReais = anosList.filter((a: any) => !(a.codigo || "").startsWith("32000"));
      const anoStr = (ano || "").replace(/\D/g, " ").trim();
      const anoPartes = anoStr.split(/\s+/).filter((p: string) => p.length === 4);
      const anoModelo = anoPartes.length >= 2 ? anoPartes[1] : anoPartes[0] || "";
      const anoFab = anoPartes[0] || "";
      let anoMatch = anosReais.find((a: any) => (a.codigo || "").startsWith(anoModelo));
      if (!anoMatch && anoFab && anoFab !== anoModelo) {
        anoMatch = anosReais.find((a: any) => (a.codigo || "").startsWith(anoFab));
      }
      if (!anoMatch && anosReais.length > 0) {
        anoMatch = anosReais[anosReais.length - 1];
      }
      if (!anoMatch && anosList.length > 0) anoMatch = anosList[anosList.length - 1];
      if (!anoMatch) continue;

      const valorRes = await fetch(`${FIPE_BASE}/${tipo}/marcas/${marcaMatch.codigo}/modelos/${modeloMatch.codigo}/anos/${anoMatch.codigo}`, { signal: AbortSignal.timeout(5000) });
      if (!valorRes.ok) continue;
      const valorData = await valorRes.json();

      if (valorData.Valor) {
        const valorNum = parseFloat((valorData.Valor || "").replace(/[^\d,]/g, "").replace(",", ".")) || 0;
        return {
          valorFipe: valorNum,
          valorFormatado: valorData.Valor,
          codFipe: valorData.CodigoFipe || "",
          modelo: valorData.Modelo || modelo,
          marca: valorData.Marca || marca,
          anoModelo: valorData.AnoModelo || parseInt(anoNum) || 0,
          combustivel: valorData.Combustivel || "",
          tipo_veiculo_fipe: tipo,
          mesReferencia: valorData.MesReferencia || "",
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body = await req.json().catch(() => ({}));
    const modo = body.modo || "corrigir_tipo";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ─── MODO 1: Corrigir tipo_veiculo ───
    if (modo === "corrigir_tipo") {
      const { data: negs } = await supabase
        .from("negociacoes")
        .select("id, veiculo_modelo, tipo_veiculo")
        .not("veiculo_placa", "is", null)
        .neq("veiculo_placa", "");

      let corrigidos = 0;
      const detalhes: any[] = [];

      for (const neg of (negs || [])) {
        const tipoAtual = neg.tipo_veiculo || "Automóvel";
        const tipoCorreto = detectarTipoCorreto(neg.veiculo_modelo || "");

        if (tipoAtual !== tipoCorreto) {
          const { error } = await supabase
            .from("negociacoes")
            .update({ tipo_veiculo: tipoCorreto, cache_precos: null })
            .eq("id", neg.id);

          if (!error) {
            corrigidos++;
            detalhes.push({
              id: neg.id,
              modelo: neg.veiculo_modelo,
              de: tipoAtual,
              para: tipoCorreto,
            });
          }
        }
      }

      return jsonRes({
        sucesso: true,
        modo: "corrigir_tipo",
        total_analisadas: negs?.length || 0,
        corrigidas: corrigidos,
        detalhes,
      });
    }

    // ─── MODO 2: Reprocessar FIPE em lotes ───
    if (modo === "reprocessar_fipe") {
      const lote = body.lote || 10;
      const offset = body.offset || 0;

      // Buscar negociações sem valor FIPE
      const { data: negs } = await supabase
        .from("negociacoes")
        .select("id, veiculo_placa, veiculo_modelo, tipo_veiculo, cache_fipe, ano_fabricacao, ano_modelo")
        .not("veiculo_placa", "is", null)
        .neq("veiculo_placa", "")
        .order("created_at", { ascending: false })
        .range(offset, offset + lote - 1);

      let processados = 0;
      let atualizados = 0;
      let falhas = 0;
      const detalhes: any[] = [];

      for (const neg of (negs || [])) {
        const valorAtual = neg.cache_fipe?.valorFipe || 0;
        if (valorAtual > 0) {
          detalhes.push({ id: neg.id, placa: neg.veiculo_placa, status: "JA_TEM_FIPE", valor: valorAtual });
          continue;
        }

        processados++;
        const modelo = neg.veiculo_modelo || "";
        const marcaInferida = modelo.split(" ")[0] || "";
        const anoFab = String(neg.ano_fabricacao || "");
        const anoMod = String(neg.ano_modelo || "");
        const ano = anoFab && anoMod && anoFab !== anoMod ? `${anoFab}/${anoMod}` : anoMod || anoFab || "";

        const resultado = await buscarFipePorModelo(marcaInferida, modelo, ano);

        if (resultado) {
          const cacheFipe = {
            marca: resultado.marca,
            modelo: resultado.modelo,
            valorFipe: resultado.valorFipe,
            codFipe: resultado.codFipe,
            combustivel: resultado.combustivel,
            tipo_veiculo_fipe: resultado.tipo_veiculo_fipe,
            anoModelo: resultado.anoModelo,
            anoFabricacao: ano,
            mesReferencia: resultado.mesReferencia,
          };

          const { error } = await supabase
            .from("negociacoes")
            .update({ cache_fipe: cacheFipe, cache_precos: null })
            .eq("id", neg.id);

          if (!error) {
            atualizados++;
            detalhes.push({
              id: neg.id,
              placa: neg.veiculo_placa,
              modelo,
              status: "FIPE_ENCONTRADA",
              valor: resultado.valorFipe,
              valorFormatado: resultado.valorFormatado,
              codFipe: resultado.codFipe,
              modeloFipe: resultado.modelo,
              tipo: resultado.tipo_veiculo_fipe,
            });
          }
        } else {
          falhas++;
          detalhes.push({
            id: neg.id,
            placa: neg.veiculo_placa,
            modelo,
            status: "FIPE_NAO_ENCONTRADA",
          });
        }
      }

      return jsonRes({
        sucesso: true,
        modo: "reprocessar_fipe",
        lote,
        offset,
        proximo_offset: offset + lote,
        processados,
        atualizados,
        falhas,
        detalhes,
      });
    }

    // ─── MODO 3: Reprocessar uma placa específica ───
    if (modo === "reprocessar_placa") {
      const placa = (body.placa || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
      if (!placa) return jsonRes({ sucesso: false, error: "placa obrigatória" }, 400);
      const anoOverride = body.ano || null; // Override de ano (ex: "2021/2022")

      const { data: negs } = await supabase
        .from("negociacoes")
        .select("id, veiculo_placa, veiculo_modelo, tipo_veiculo, cache_fipe, ano_fabricacao, ano_modelo")
        .ilike("veiculo_placa", `%${placa}%`);

      if (!negs || negs.length === 0) {
        return jsonRes({ sucesso: false, error: "Negociação não encontrada para esta placa" }, 404);
      }

      const detalhes: any[] = [];
      for (const neg of negs) {
        const modelo = neg.veiculo_modelo || "";
        const marcaInferida = modelo.split(" ")[0] || "";
        // Usar override se fornecido, senão combinar fabricação/modelo
        const anoFab = String(neg.ano_fabricacao || "");
        const anoMod = String(neg.ano_modelo || "");
        const ano = anoOverride || (anoFab && anoMod && anoFab !== anoMod ? `${anoFab}/${anoMod}` : anoMod || anoFab || "");
        const tipoCorreto = detectarTipoCorreto(modelo);

        const resultado = await buscarFipePorModelo(marcaInferida, modelo, ano);

        if (resultado) {
          const cacheFipe = {
            marca: resultado.marca,
            modelo: resultado.modelo,
            valorFipe: resultado.valorFipe,
            codFipe: resultado.codFipe,
            combustivel: resultado.combustivel,
            tipo_veiculo_fipe: resultado.tipo_veiculo_fipe,
            anoModelo: resultado.anoModelo,
            anoFabricacao: ano,
            mesReferencia: resultado.mesReferencia,
          };

          await supabase
            .from("negociacoes")
            .update({ cache_fipe: cacheFipe, tipo_veiculo: tipoCorreto, cache_precos: null })
            .eq("id", neg.id);

          detalhes.push({
            id: neg.id,
            placa: neg.veiculo_placa,
            modelo,
            tipo_anterior: neg.tipo_veiculo,
            tipo_novo: tipoCorreto,
            status: "ATUALIZADO",
            valor: resultado.valorFipe,
            valorFormatado: resultado.valorFormatado,
            codFipe: resultado.codFipe,
            modeloFipe: resultado.modelo,
          });
        } else {
          // Ainda corrigir o tipo mesmo sem FIPE
          await supabase
            .from("negociacoes")
            .update({ tipo_veiculo: tipoCorreto, cache_precos: null })
            .eq("id", neg.id);

          detalhes.push({
            id: neg.id,
            placa: neg.veiculo_placa,
            modelo,
            tipo_anterior: neg.tipo_veiculo,
            tipo_novo: tipoCorreto,
            status: "FIPE_NAO_ENCONTRADA",
          });
        }
      }

      return jsonRes({ sucesso: true, modo: "reprocessar_placa", placa, detalhes });
    }

    return jsonRes({ sucesso: false, error: "Modo inválido. Use: corrigir_tipo, reprocessar_fipe, reprocessar_placa" }, 400);
  } catch (e: any) {
    console.error("[gia-fix-fipe] error:", e);
    return jsonRes({ sucesso: false, error: e.message }, 500);
  }
});

function jsonRes(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
