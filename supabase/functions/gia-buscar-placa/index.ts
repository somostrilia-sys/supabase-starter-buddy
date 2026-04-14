/**
 * gia-buscar-placa
 * Busca dados do veículo pela placa usando APIs externas (wdapi2 + FIPE).
 * Retorna: marca, modelo, ano, valor FIPE, código FIPE, tipo de veículo, chassi, etc.
 * Suporta carros, motos E caminhões/pesados.
 */

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIPE_BASE = "https://parallelum.com.br/fipe/api/v1";

// Palavras-chave para detectar pesados pelo modelo
const PESADOS_KW = [
  "scania", "volvo fh", "volvo fm", "volvo vm", "volvo nh", "volvo nl",
  "iveco", "man ", "daf", "accelo", "cargo", "worker", "constellation",
  "tector", "atego", "axor", "actros", "arocs", "atron",
  "delivery", "meteor", "volksbus", "e-delivery",
  "ford f-4000", "ford f-350",
  "ônibus", "onibus", "micro-ônibus", "micro-onibus",
];

// Padrão numérico de caminhões VW/MAN (ex: 28.460, 24.280, 17.230, 8-150, 9-170)
const PESADO_NUMERICO = /\b(\d{1,2}[.\-]\d{3})\b/;

const MOTOS_KW = [
  "cg ", "cb ", "xre", "pcx", "nmax", "fazer", "twister", "titan", "fan ", "biz",
  "bros", "lander", "mt-", "yzf", "ninja", "duke", "moto", "honda cg", "yamaha",
  "suzuki", "dafra", "shineray", "haojue", "kasinski", "kawasaki",
  "ducati", "vespa", "piaggio", "benelli", "aprilia", "husqvarna",
  "ktm", "harley", "triumph", "royal enfield", "bmw gs", "bmw r",
  "motocicleta", "ciclomotor", "scooter", "triciclo",
];

function detectarTipoVeiculo(modelo: string): string {
  const m = (modelo || "").toLowerCase();
  if (MOTOS_KW.some(kw => m.includes(kw))) return "motos";
  if (PESADOS_KW.some(kw => m.includes(kw)) || PESADO_NUMERICO.test(m)) return "caminhoes";
  return "carros";
}

// Busca valor FIPE tentando todas as categorias (carros, caminhoes, motos)
async function buscarFipePorModelo(marca: string, modelo: string, ano: string) {
  const tipoDetectado = detectarTipoVeiculo(modelo);
  // Tentar na ordem: tipo detectado primeiro, depois as outras categorias
  const tipos = [tipoDetectado, ...["carros", "caminhoes", "motos"].filter(t => t !== tipoDetectado)];

  for (const tipo of tipos) {
    try {
      // 1. Buscar marcas
      const marcasRes = await fetch(`${FIPE_BASE}/${tipo}/marcas`, { signal: AbortSignal.timeout(8000) });
      if (!marcasRes.ok) continue;
      const marcasList = await marcasRes.json();

      // Encontrar marca (com aliases comuns)
      const MARCA_ALIASES: Record<string, string[]> = {
        "vw": ["volkswagen"],
        "mb": ["mercedes-benz", "mercedes"],
        "gm": ["chevrolet"],
      };
      const marcaNorm = (marca || "").toLowerCase().trim();
      const aliases = MARCA_ALIASES[marcaNorm] || [];
      const marcaMatch = marcasList.find((m: any) => {
        const nome = (m.nome || "").toLowerCase();
        return nome.includes(marcaNorm) || marcaNorm.includes(nome) ||
          aliases.some(a => nome.includes(a));
      });
      if (!marcaMatch) continue;

      // 2. Buscar modelos
      const modelosRes = await fetch(`${FIPE_BASE}/${tipo}/marcas/${marcaMatch.codigo}/modelos`, { signal: AbortSignal.timeout(8000) });
      if (!modelosRes.ok) continue;
      const modelosData = await modelosRes.json();
      const modelosList = modelosData.modelos || [];

      // Encontrar modelo (match parcial com múltiplas estratégias)
      const modeloNorm = (modelo || "").toLowerCase().trim();
      let modeloMatch = modelosList.find((m: any) => (m.nome || "").toLowerCase().includes(modeloNorm));
      if (!modeloMatch) {
        // Inverso: verificar se o nome FIPE está contido no modelo informado
        modeloMatch = modelosList.find((m: any) => modeloNorm.includes((m.nome || "").toLowerCase().replace(/\s*\d+p\s*\(.*?\)/g, "").trim()));
      }
      if (!modeloMatch) {
        // Extrair tokens numéricos e alfanuméricos significativos para match
        const tokens = modeloNorm.split(/[\s\-\/]+/).filter((p: string) => p.length >= 2);
        // Score cada modelo FIPE pelo número de tokens encontrados
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

      // 3. Buscar anos
      const anosRes = await fetch(`${FIPE_BASE}/${tipo}/marcas/${marcaMatch.codigo}/modelos/${modeloMatch.codigo}/anos`, { signal: AbortSignal.timeout(8000) });
      if (!anosRes.ok) continue;
      const anosList = await anosRes.json();

      // Encontrar ano — filtrar "32000" (zero km) e preferir ano modelo
      const anosReais = anosList.filter((a: any) => !(a.codigo || "").startsWith("32000"));
      // Ano pode ser "2021" ou "2021/2022" — extrair ambos
      const anoStr = (ano || "").replace(/\D/g, " ").trim();
      const anoPartes = anoStr.split(/\s+/).filter((p: string) => p.length === 4);
      // Priorizar ano modelo (segundo valor em "2021/2022") sobre ano fabricação
      const anoModelo = anoPartes.length >= 2 ? anoPartes[1] : anoPartes[0] || "";
      const anoFab = anoPartes[0] || "";
      let anoMatch = anosReais.find((a: any) => (a.codigo || "").startsWith(anoModelo));
      if (!anoMatch && anoFab && anoFab !== anoModelo) {
        anoMatch = anosReais.find((a: any) => (a.codigo || "").startsWith(anoFab));
      }
      if (!anoMatch && anosReais.length > 0) {
        // Sem ano informado: pegar o mais antigo disponível (mais conservador)
        anoMatch = anosReais[anosReais.length - 1];
      }
      if (!anoMatch && anosList.length > 0) {
        anoMatch = anosList[anosList.length - 1];
      }
      if (!anoMatch) continue;

      // 4. Buscar valor
      const valorRes = await fetch(`${FIPE_BASE}/${tipo}/marcas/${marcaMatch.codigo}/modelos/${modeloMatch.codigo}/anos/${anoMatch.codigo}`, { signal: AbortSignal.timeout(8000) });
      if (!valorRes.ok) continue;
      const valorData = await valorRes.json();

      if (valorData.Valor) {
        const valorNum = parseFloat((valorData.Valor || "").replace(/[^\d,]/g, "").replace(",", ".")) || 0;
        return {
          valorFipe: valorNum,
          codFipe: valorData.CodigoFipe || "",
          modelo: valorData.Modelo || modelo,
          marca: valorData.Marca || marca,
          anoModelo: valorData.AnoModelo || parseInt(anoNum) || 0,
          combustivel: valorData.Combustivel || "",
          tipo_veiculo_fipe: tipo,
          mesReferencia: valorData.MesReferencia || "",
        };
      }
    } catch (e) {
      console.warn(`[gia-buscar-placa] Falha FIPE tipo=${tipo}:`, e);
      continue;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body = await req.json();
    const { acao, placa, marca: marcaParam, modelo: modeloParam, ano: anoParam } = body;

    if (acao !== "placa" || !placa) {
      return jsonRes({ sucesso: false, error: "acao=placa e placa são obrigatórios" }, 400);
    }

    const placaClean = (placa || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
    if (placaClean.length < 7) {
      return jsonRes({ sucesso: false, error: "Placa inválida" }, 400);
    }

    // 1. Tentar wdapi2 (API de placas brasileiras)
    let veiculoData: any = null;
    try {
      const wdRes = await fetch(`https://wdapi2.com.br/consulta/${placaClean}/f0e24fa1-dd55-4d27-9155-4bc55c5b8e0e`, {
        signal: AbortSignal.timeout(10000),
      });
      if (wdRes.ok) {
        const wd = await wdRes.json();
        if (wd && !wd.error && (wd.MARCA || wd.marca)) {
          veiculoData = {
            marca: wd.MARCA || wd.marca || "",
            modelo: wd.MODELO || wd.modelo || "",
            anoFabricacao: wd.ano || wd.ANO || "",
            anoModelo: wd.anoModelo || wd.ANO_MODELO || "",
            cor: wd.cor || wd.COR || "",
            combustivel: wd.combustivel || wd.COMBUSTIVEL || "",
            chassi: wd.chassi || wd.CHASSI || "",
            renavam: wd.renavam || "",
            municipio: wd.municipio || "",
            uf: wd.uf || wd.UF || "",
          };
        }
      }
    } catch (e) {
      console.warn("[gia-buscar-placa] wdapi2 falhou:", e);
    }

    // 2. Buscar valor FIPE
    let fipeResult: any = null;

    // 2a. Tentar BrasilAPI por código de placa
    try {
      const brasilRes = await fetch(`https://brasilapi.com.br/api/fipe/preco/v1/${placaClean}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (brasilRes.ok) {
        const brasilData = await brasilRes.json();
        if (Array.isArray(brasilData) && brasilData.length > 0) {
          // Retornar todos os candidatos para seleção no frontend
          const dados = brasilData.map((item: any, idx: number) => ({
            codigo_fipe: item.codigoFipe || "",
            texto_modelo: item.modelo || "",
            texto_valor: item.valor || "",
            ano_modelo: item.anoModelo || "",
            sigla_combustivel: item.combustivel || "",
            tipo_veiculo: (item.tipoVeiculo || "").toLowerCase(),
            score: brasilData.length === 1 ? 100 : Math.max(80 - idx * 10, 10),
          }));

          // Melhor match
          const best = brasilData[0];
          const valorStr = (best.valor || "").replace(/[^\d,]/g, "").replace(",", ".");
          const valorNum = parseFloat(valorStr) || 0;
          const tipoVeiculo = (best.tipoVeiculo || "").toLowerCase();

          fipeResult = {
            valorFipe: valorNum,
            codFipe: best.codigoFipe || "",
            modelo: best.modelo || veiculoData?.modelo || "",
            marca: best.marca || veiculoData?.marca || "",
            anoModelo: best.anoModelo || 0,
            combustivel: best.combustivel || veiculoData?.combustivel || "",
            tipo_veiculo_fipe: tipoVeiculo === "1" ? "carros" : tipoVeiculo === "2" ? "motos" : tipoVeiculo === "3" ? "caminhoes" : tipoVeiculo,
            raw: { fipe: { dados } },
          };
        }
      }
    } catch (e) {
      console.warn("[gia-buscar-placa] BrasilAPI falhou:", e);
    }

    // 2b. Fallback: buscar FIPE por modelo/marca via Parallelum
    // Usar dados do veiculoData ou parâmetros do frontend como fallback
    const marcaBusca = veiculoData?.marca || marcaParam || "";
    const modeloBusca = veiculoData?.modelo || modeloParam || "";
    // Priorizar anoModelo; combinar fab/modelo quando diferentes
    const anoFabV = veiculoData?.anoFabricacao || "";
    const anoModV = veiculoData?.anoModelo || "";
    const anoBusca = anoParam || (anoFabV && anoModV && anoFabV !== anoModV ? `${anoFabV}/${anoModV}` : anoModV || anoFabV || "");

    if (!fipeResult && marcaBusca && modeloBusca) {
      const fipePorModelo = await buscarFipePorModelo(marcaBusca, modeloBusca, anoBusca);
      if (fipePorModelo) {
        fipeResult = {
          ...fipePorModelo,
          raw: { fipe: { dados: [] } },
        };
      }
    }

    // 2c. Se temos dados do veículo mas sem FIPE, detectar tipo pelo modelo
    const tipoDetectado = modeloBusca ? detectarTipoVeiculo(modeloBusca) : null;

    // 3. Montar resultado
    if (!veiculoData && !fipeResult) {
      return jsonRes({ sucesso: false, error: "Veículo não encontrado" }, 404);
    }

    // Resolver anos: priorizar dados do veículo, senão derivar do anoParam ou FIPE
    const anoParamPartes = (anoParam || "").replace(/\D/g, " ").trim().split(/\s+/).filter((p: string) => p.length === 4);
    const anoFabFinal = veiculoData?.anoFabricacao || anoParamPartes[0] || String(fipeResult?.anoModelo || "");
    const anoModFinal = veiculoData?.anoModelo || (anoParamPartes.length >= 2 ? anoParamPartes[1] : "") || String(fipeResult?.anoModelo || "");

    const resultado = {
      marca: fipeResult?.marca || veiculoData?.marca || "",
      modelo: fipeResult?.modelo || veiculoData?.modelo || "",
      anoFabricacao: anoFabFinal,
      anoModelo: anoModFinal,
      cor: veiculoData?.cor || "",
      combustivel: fipeResult?.combustivel || veiculoData?.combustivel || "",
      chassi: veiculoData?.chassi || "",
      renavam: veiculoData?.renavam || "",
      valorFipe: fipeResult?.valorFipe || 0,
      codFipe: fipeResult?.codFipe || "",
      tipo_veiculo_fipe: fipeResult?.tipo_veiculo_fipe || tipoDetectado || "",
      tipoVeiculo: fipeResult?.tipo_veiculo_fipe || tipoDetectado || "",
      municipio: veiculoData?.municipio || "",
      uf: veiculoData?.uf || "",
      raw: fipeResult?.raw || { fipe: { dados: [] } },
    };

    return jsonRes({ sucesso: true, resultado });
  } catch (e: any) {
    console.error("[gia-buscar-placa] error:", e);
    return jsonRes({ sucesso: false, error: e.message }, 500);
  }
});

function jsonRes(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
