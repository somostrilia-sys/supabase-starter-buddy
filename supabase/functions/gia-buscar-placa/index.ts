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
  // Modelos standalone (sem prefixo da marca)
  "fh ", "fm ", "vm ", "nh ", "nl ",
  "p 310", "p 340", "p 360", "p 410", "p 450",
  "r 410", "r 450", "r 500", "r 540",
  "g 410", "g 450", "g 500",
  "s 450", "s 500", "s 540",
  "tgx", "tgs",
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

      // Encontrar modelo(s) candidatos (match parcial com múltiplas estratégias)
      const modeloNorm = (modelo || "").toLowerCase().trim();
      const tokens = modeloNorm.split(/[\s\-\/]+/).filter((p: string) => p.length >= 2);

      // Coletar TODOS os modelos que fazem match (não só o primeiro)
      const modeloCandidatos: any[] = [];
      for (const m of modelosList) {
        const nome = (m.nome || "").toLowerCase();
        if (nome.includes(modeloNorm) || modeloNorm.includes(nome.replace(/\s*\d+p\s*\(.*?\)/g, "").trim())) {
          modeloCandidatos.push(m);
        } else {
          const score = tokens.filter((t: string) => nome.includes(t)).length;
          if (score >= Math.max(2, Math.ceil(tokens.length * 0.4))) {
            modeloCandidatos.push({ ...m, _score: score });
          }
        }
      }
      // Ordenar por score (melhor match primeiro)
      modeloCandidatos.sort((a: any, b: any) => (b._score || 100) - (a._score || 100));
      if (modeloCandidatos.length === 0) continue;

      // Ano pode ser "2021" ou "2021/2022" — extrair ambos
      const anoStr = (ano || "").replace(/\D/g, " ").trim();
      const anoPartes = anoStr.split(/\s+/).filter((p: string) => p.length === 4);
      const anoModelo = anoPartes.length >= 2 ? anoPartes[1] : anoPartes[0] || "";
      const anoFab = anoPartes[0] || "";

      // 3. Tentar cada modelo candidato até encontrar um com o ano correto
      let modeloMatch: any = null;
      let anoMatch: any = null;
      let anosList: any[] = [];

      for (const candidato of modeloCandidatos) {
        const anosRes = await fetch(`${FIPE_BASE}/${tipo}/marcas/${marcaMatch.codigo}/modelos/${candidato.codigo}/anos`, { signal: AbortSignal.timeout(8000) });
        if (!anosRes.ok) continue;
        const anos = await anosRes.json();
        const anosReais = anos.filter((a: any) => !(a.codigo || "").startsWith("32000"));

        // Procurar ano modelo
        let found = anosReais.find((a: any) => (a.codigo || "").startsWith(anoModelo));
        if (!found && anoFab && anoFab !== anoModelo) {
          found = anosReais.find((a: any) => (a.codigo || "").startsWith(anoFab));
        }
        if (found) {
          modeloMatch = candidato;
          anoMatch = found;
          anosList = anos;
          break; // Encontrou modelo com o ano correto
        }
        // Guardar o primeiro candidato como fallback
        if (!modeloMatch) {
          modeloMatch = candidato;
          anosList = anos;
          // Fallback: pegar o mais recente disponível
          if (anosReais.length > 0) anoMatch = anosReais[0];
          else if (anos.length > 0) anoMatch = anos[0];
        }
      }

      if (!modeloMatch || !anoMatch) continue;

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
          anoModelo: valorData.AnoModelo || 0,
          combustivel: valorData.Combustivel || "",
          tipo_veiculo_fipe: tipo,
          mesReferencia: valorData.MesReferencia || "",
          // Códigos FIPE para auto-match direto nos dropdowns
          fipeMarcaCodigo: String(marcaMatch.codigo),
          fipeModeloCodigo: String(modeloMatch.codigo),
          fipeAnoCodigo: String(anoMatch.codigo),
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
      const wdRes = await fetch(`https://wdapi2.com.br/consulta/${placaClean}/133571d9a66829e28f3139adc9d04891`, {
        signal: AbortSignal.timeout(10000),
      });
      if (wdRes.ok) {
        const wd = await wdRes.json();
        if (wd && !wd.error && (wd.MARCA || wd.marca)) {
          const ex = wd.extra || {};
          veiculoData = {
            marca: wd.MARCA || wd.marca || "",
            modelo: wd.MODELO || wd.modelo || "",
            anoFabricacao: wd.ano || wd.ANO || ex.ano_fabricacao || "",
            anoModelo: wd.anoModelo || wd.ANO_MODELO || ex.ano_modelo || "",
            cor: wd.cor || wd.COR || "",
            combustivel: ex.combustivel || wd.combustivel || wd.COMBUSTIVEL || "",
            chassi: ex.chassi || wd.chassi || wd.CHASSI || "",
            renavam: ex.renavam || wd.renavam || "",
            municipio: wd.municipio || ex.municipio || "",
            uf: wd.uf || wd.UF || ex.uf || "",
            tipoVeiculo: ex.tipo_veiculo || "",
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
    let marcaBusca = veiculoData?.marca || marcaParam || "";
    const modeloBusca = veiculoData?.modelo || modeloParam || "";
    // Priorizar anoModelo; combinar fab/modelo quando diferentes
    const anoFabV = veiculoData?.anoFabricacao || "";
    const anoModV = veiculoData?.anoModelo || "";
    const anoBusca = anoParam || (anoFabV && anoModV && anoFabV !== anoModV ? `${anoFabV}/${anoModV}` : anoModV || anoFabV || "");

    // Tentar extrair marca do modelo quando não informada
    if (!marcaBusca && modeloBusca) {
      const mLow = modeloBusca.toLowerCase();
      const MARCA_FROM_MODEL: [string, string][] = [
        ["vw ", "volkswagen"], ["volkswagen", "volkswagen"],
        ["volvo", "volvo"], ["scania", "scania"], ["mercedes", "mercedes-benz"],
        ["mb ", "mercedes-benz"], ["iveco", "iveco"], ["man ", "man"],
        ["daf", "daf"], ["ford", "ford"], ["chevrolet", "chevrolet"],
        ["gm ", "chevrolet"], ["fiat", "fiat"], ["honda", "honda"],
        ["toyota", "toyota"], ["hyundai", "hyundai"], ["renault", "renault"],
        ["nissan", "nissan"], ["jeep", "jeep"], ["peugeot", "peugeot"],
        ["citroën", "citroën"], ["citroen", "citroën"], ["bmw", "bmw"],
        ["audi", "audi"], ["kia", "kia"], ["mitsubishi", "mitsubishi"],
        ["yamaha", "yamaha"], ["kawasaki", "kawasaki"], ["suzuki", "suzuki"],
        ["agrale", "agrale"], ["foton", "foton"],
        // Modelos standalone de pesados → marca
        ["meteor", "volkswagen"], ["constellation", "volkswagen"], ["delivery", "volkswagen"],
        ["volksbus", "volkswagen"], ["worker", "volkswagen"],
        ["fh ", "volvo"], ["fm ", "volvo"], ["vm ", "volvo"],
        ["atego", "mercedes-benz"], ["axor", "mercedes-benz"], ["actros", "mercedes-benz"],
        ["accelo", "mercedes-benz"], ["arocs", "mercedes-benz"],
        ["tector", "iveco"], ["cargo", "ford"],
        ["tgx", "man"], ["tgs", "man"],
      ];
      for (const [kw, mk] of MARCA_FROM_MODEL) {
        if (mLow.includes(kw)) { marcaBusca = mk; break; }
      }
    }

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
      // Códigos FIPE para auto-match direto nos dropdowns do frontend
      fipeMarcaCodigo: fipeResult?.fipeMarcaCodigo || "",
      fipeModeloCodigo: fipeResult?.fipeModeloCodigo || "",
      fipeAnoCodigo: fipeResult?.fipeAnoCodigo || "",
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
