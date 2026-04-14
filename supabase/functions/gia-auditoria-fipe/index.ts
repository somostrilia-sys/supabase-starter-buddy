/**
 * gia-auditoria-fipe
 * Edge function temporária para auditoria da integração FIPE.
 * Lista todas as negociações e identifica inconsistências.
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
};

async function testarFipe(marca: string, modelo: string, ano: string) {
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

      const anoNum = (ano || "").replace(/\D/g, "").slice(0, 4);
      let anoMatch = anosList.find((a: any) => (a.codigo || "").includes(anoNum));
      if (!anoMatch && anosList.length > 0) anoMatch = anosList[0];
      if (!anoMatch) continue;

      const valorRes = await fetch(`${FIPE_BASE}/${tipo}/marcas/${marcaMatch.codigo}/modelos/${modeloMatch.codigo}/anos/${anoMatch.codigo}`, { signal: AbortSignal.timeout(5000) });
      if (!valorRes.ok) continue;
      const valorData = await valorRes.json();

      if (valorData.Valor) {
        const valorNum = parseFloat((valorData.Valor || "").replace(/[^\d,]/g, "").replace(",", ".")) || 0;
        return {
          encontrado: true,
          valorFipe: valorNum,
          valorFormatado: valorData.Valor,
          codFipe: valorData.CodigoFipe || "",
          modeloFipe: valorData.Modelo || "",
          marcaFipe: valorData.Marca || "",
          anoModelo: valorData.AnoModelo || 0,
          combustivel: valorData.Combustivel || "",
          tipoFipe: tipo,
          mesReferencia: valorData.MesReferencia || "",
        };
      }
    } catch {
      continue;
    }
  }
  return { encontrado: false };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Buscar todas as negociações com placa
    const { data: negs, error } = await supabase
      .from("negociacoes")
      .select("id, lead_nome, veiculo_placa, veiculo_modelo, tipo_veiculo, plano, stage, cache_fipe, ano_fabricacao, ano_modelo, created_at")
      .not("veiculo_placa", "is", null)
      .neq("veiculo_placa", "")
      .order("created_at", { ascending: false });

    if (error) {
      return jsonRes({ sucesso: false, error: error.message }, 500);
    }

    // Verificar se deve buscar FIPE (modo=completo) ou apenas listar (modo=rapido)
    const body = await req.json().catch(() => ({}));
    const modo = body.modo || "rapido";
    const testarPlaca = body.placa || null; // testar uma placa específica

    const resultados: any[] = [];
    const resumo = {
      total: negs?.length || 0,
      sem_valor_fipe: 0,
      tipo_incorreto: 0,
      fipe_encontrada_mas_nao_puxada: 0,
      fipe_nao_existe: 0,
      fipe_ok: 0,
      categorias_atuais: {} as Record<string, number>,
      categorias_corretas: {} as Record<string, number>,
    };

    for (const neg of (negs || [])) {
      const modelo = neg.veiculo_modelo || "";
      const placa = neg.veiculo_placa || "";
      const tipoAtual = neg.tipo_veiculo || "Automóvel";
      const tipoCorreto = detectarTipoCorreto(modelo);
      const valorFipeCache = neg.cache_fipe?.valorFipe || 0;
      const codFipeCache = neg.cache_fipe?.codFipe || "";

      // Contar categorias
      resumo.categorias_atuais[tipoAtual] = (resumo.categorias_atuais[tipoAtual] || 0) + 1;
      resumo.categorias_corretas[tipoCorreto] = (resumo.categorias_corretas[tipoCorreto] || 0) + 1;

      const erros: string[] = [];

      // Verificar tipo incorreto
      const tipoIncorreto = tipoAtual !== tipoCorreto;
      if (tipoIncorreto) {
        erros.push(`Tipo atual "${tipoAtual}" deveria ser "${tipoCorreto}"`);
        resumo.tipo_incorreto++;
      }

      // Verificar valor FIPE
      const semValorFipe = !valorFipeCache || valorFipeCache <= 0;
      if (semValorFipe) {
        resumo.sem_valor_fipe++;
      } else {
        resumo.fipe_ok++;
      }

      // Teste FIPE real — apenas no modo completo ou para placa específica
      let testeFipe: any = null;
      if ((modo === "completo" || (testarPlaca && placa.replace(/[^A-Z0-9]/gi, "").toUpperCase() === testarPlaca.replace(/[^A-Z0-9]/gi, "").toUpperCase())) && (semValorFipe || tipoIncorreto)) {
        const marcaInferida = modelo.split(" ")[0] || "";
        const anoInferido = neg.ano_fabricacao || neg.ano_modelo || "";
        testeFipe = await testarFipe(marcaInferida, modelo, String(anoInferido));

        if (testeFipe.encontrado) {
          if (semValorFipe) {
            erros.push(`FIPE existe (${testeFipe.valorFormatado}) mas NÃO foi puxada no sistema`);
            resumo.fipe_encontrada_mas_nao_puxada++;
          }
        } else {
          if (semValorFipe) {
            erros.push("Veículo NÃO encontrado na base FIPE");
            resumo.fipe_nao_existe++;
          }
        }
      }

      resultados.push({
        id: neg.id,
        lead: neg.lead_nome || "—",
        placa,
        modelo,
        ano: neg.ano_fabricacao || neg.ano_modelo || "—",
        stage: neg.stage || "—",
        tipo_atual: tipoAtual,
        tipo_correto: tipoCorreto,
        tipo_incorreto: tipoIncorreto,
        valor_fipe_sistema: valorFipeCache,
        cod_fipe_sistema: codFipeCache,
        fipe_api: testeFipe?.encontrado ? {
          valor: testeFipe.valorFipe,
          valorFormatado: testeFipe.valorFormatado,
          codFipe: testeFipe.codFipe,
          modeloFipe: testeFipe.modeloFipe,
          tipo: testeFipe.tipoFipe,
          mesRef: testeFipe.mesReferencia,
        } : testeFipe ? { encontrado: false } : null,
        erros,
        status: erros.length === 0 ? "OK" : "ERRO",
      });
    }

    return jsonRes({
      sucesso: true,
      modo,
      resumo,
      negociacoes_com_erro: resultados.filter(r => r.status === "ERRO"),
      negociacoes_ok: resultados.filter(r => r.status === "OK"),
    });
  } catch (e: any) {
    console.error("[auditoria-fipe] error:", e);
    return jsonRes({ sucesso: false, error: e.message }, 500);
  }
});

function jsonRes(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
