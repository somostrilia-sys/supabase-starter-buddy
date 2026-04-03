import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { PipelineDeal } from "./mockData";
import { supabase, callEdge } from "@/integrations/supabase/client";
import { gerarPdfCotacao } from "@/lib/gerarPdfCotacao";
import { MessageSquare, Mail, Link2, CreditCard, CheckCircle, Shield, ShieldCheck, ShieldPlus, Search, Loader2, Car, AlertTriangle, BrainCircuit } from "lucide-react";
import ExcecaoButton from "@/components/ExcecaoButton";
import PedirLiberacaoButton from "@/components/PedirLiberacaoButton";

/* ─── Marcas estáticas (fallback para select manual quando API não retorna) ─── */
const marcas = ["Chevrolet", "Hyundai", "Honda", "Toyota", "Volkswagen", "Fiat", "Jeep", "Nissan", "Renault", "Ford"];

/* ─── Lookup de placa na tabela veiculos do Supabase ─── */
const lookupPlaca = async (placa: string) => {
  const { data } = await supabase
    .from("veiculos")
    .select("*, associados:associado_id(nome, cpf)")
    .eq("placa", placa.toUpperCase())
    .maybeSingle();
  return data;
};

const cores = ["Branco", "Prata", "Preto", "Cinza", "Vermelho", "Azul", "Marrom"];
const cambios = ["Automático", "Manual", "CVT", "Automatizado"];
const combustiveis = ["Flex", "Gasolina", "Etanol", "Diesel", "Elétrico", "Híbrido"];
const tiposVeiculo = ["Automóvel", "Motocicleta", "Caminhão", "Van/Utilitário", "Ônibus"];

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];
// Cities loaded dynamically from municipios table

function maskPlaca(v: string) {
  return v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7)
    .replace(/^([A-Z]{3})(\d)/, "$1-$2");
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ─── Planos com cálculo baseado no valor FIPE ─── */
interface PlanoConfig {
  nome: string;
  icon: React.ElementType;
  cor: string;
  percentual: number; // % do valor FIPE como mensalidade
  coberturas: string[];
}

const planosConfigDefault: PlanoConfig[] = [
  {
    nome: "Básico", icon: Shield, cor: "border-blue-200 bg-primary/6",
    percentual: 0.028,
    coberturas: ["Roubo/Furto", "Perda Total", "Assistência 24h", "Carro Reserva 7 dias"],
  },
  {
    nome: "Completo", icon: ShieldCheck, cor: "border-success/20 bg-emerald-50",
    percentual: 0.038,
    coberturas: ["Roubo/Furto", "Perda Total", "Colisão", "Assistência 24h", "Carro Reserva 15 dias", "Vidros", "Terceiros R$50k"],
  },
  {
    nome: "Premium", icon: ShieldPlus, cor: "border-warning/25 bg-warning/8",
    percentual: 0.052,
    coberturas: ["Roubo/Furto", "Perda Total", "Colisão", "Assistência 24h", "Carro Reserva 30 dias", "Vidros", "Faróis", "Terceiros R$100k", "APP Passageiros", "Rastreador incluso"],
  },
];

// ─── FIPE API ───
const FIPE_BASE = "https://parallelum.com.br/fipe/api/v1";
const FIPE_TIPO_MAP: Record<string, string> = { "Automóvel": "carros", "Motocicleta": "motos", "Caminhão": "caminhoes" };

async function fipeMarcas(tipo: string) {
  const t = FIPE_TIPO_MAP[tipo] || "carros";
  const resp = await fetch(`${FIPE_BASE}/${t}/marcas`);
  return resp.json() as Promise<{ codigo: string; nome: string }[]>;
}
async function fipeModelos(tipo: string, marcaCod: string) {
  const t = FIPE_TIPO_MAP[tipo] || "carros";
  const resp = await fetch(`${FIPE_BASE}/${t}/marcas/${marcaCod}/modelos`);
  const data = await resp.json();
  return (data.modelos || []) as { codigo: number; nome: string }[];
}
async function fipeAnos(tipo: string, marcaCod: string, modeloCod: string) {
  const t = FIPE_TIPO_MAP[tipo] || "carros";
  const resp = await fetch(`${FIPE_BASE}/${t}/marcas/${marcaCod}/modelos/${modeloCod}/anos`);
  return resp.json() as Promise<{ codigo: string; nome: string }[]>;
}
async function fipeValor(tipo: string, marcaCod: string, modeloCod: string, anoCod: string) {
  const t = FIPE_TIPO_MAP[tipo] || "carros";
  const resp = await fetch(`${FIPE_BASE}/${t}/marcas/${marcaCod}/modelos/${modeloCod}/anos/${anoCod}`);
  return resp.json() as Promise<{ Valor: string; Marca: string; Modelo: string; AnoModelo: number; Combustivel: string; CodigoFipe: string }>;
}

// Lookup na tabela_precos real por valor FIPE
async function buscarPrecosReais(valorFipe: number): Promise<{ plano: string; cota: number; adesao: number; rastreador: string; instalacao: number; tipo_franquia: string; valor_franquia: number }[]> {
  const { data } = await supabase.from("tabela_precos" as any)
    .select("*")
    .lte("valor_menor", valorFipe)
    .gte("valor_maior", valorFipe)
    .order("plano");
  return (data || []) as any[];
}

interface Props { deal: PipelineDeal; }

export default function CotacaoTab({ deal }: Props) {
  // Inferir marca do modelo do deal
  const dealModelo = (deal.veiculo_modelo || "").toUpperCase();
  const inferredMarca = marcas.find(m => dealModelo.includes(m.toUpperCase())) || "";

  const [marca, setMarca] = useState(inferredMarca);
  const [marcaReal, setMarcaReal] = useState(inferredMarca);
  const [modeloReal, setModeloReal] = useState(deal.veiculo_modelo || "");
  const [valorFipeReal, setValorFipeReal] = useState(deal.valor_plano || 0);
  const [codFipeReal, setCodFipeReal] = useState("");
  const [modeloIdx, setModeloIdx] = useState(0);

  // FIPE cascata
  const [fipeMarcasList, setFipeMarcasList] = useState<{ codigo: string; nome: string }[]>([]);
  const [fipeModelosList, setFipeModelosList] = useState<{ codigo: number; nome: string }[]>([]);
  const [fipeAnosList, setFipeAnosList] = useState<{ codigo: string; nome: string }[]>([]);
  const [fipeMarcaCod, setFipeMarcaCod] = useState("");
  const [fipeModeloCod, setFipeModeloCod] = useState("");
  const [fipeAnoCod, setFipeAnoCod] = useState("");

  // Detectar tipo do veículo
  const detectTipo = () => {
    const m = dealModelo.toLowerCase();
    const p = ((deal as any).plano || "").toLowerCase();
    const motos = ["cg ", "cb ", "xre", "pcx", "nmax", "fazer", "twister", "titan", "fan ", "biz", "bros", "lander", "mt-", "yzf", "ninja", "duke", "moto"];
    const pesados = ["scania", "volvo fh", "iveco", "man ", "daf", "sprinter", "daily", "accelo", "cargo", "worker", "constellation", "pesado", "van"];
    if (motos.some(x => m.includes(x)) || p.includes("moto")) return "Motocicleta";
    if (pesados.some(x => m.includes(x)) || p.includes("pesado") || p.includes("van")) return "Caminhão";
    return "Automóvel";
  };

  const d = deal as any;
  const [form, setForm] = useState({
    tipoVeiculo: detectTipo(),
    placa: d.veiculo_placa || "",
    chassi: d.chassi || "",
    renavam: d.renavam || "",
    anoFab: d.ano_fabricacao || d.ano_modelo || "",
    cor: (d.cor && d.cor !== "Selecione a cor") ? d.cor : "",
    cambio: "",
    combustivel: d.combustivel || "",
    quilometragem: "",
    numMotor: "",
    estadoCirc: d.estado_circulacao || "",
    cidadeCirc: d.cidade_circulacao || "",
    diaVencimento: d.dia_vencimento ? String(d.dia_vencimento) : (() => { const dt = new Date().getDate(); if (dt >= 26 || dt <= 5) return "1"; if (dt >= 6 && dt <= 15) return "10"; return "20"; })(),
    veiculoTrabalho: false,
    taxi: false,
    chassiRemarcado: false,
    leilao: false,
    depreciacao: false,
    implemento: "",
    obsContrato: "",
    obsInterna: "",
  });
  const [planoSelecionado, setPlanoSelecionado] = useState("Completo");
  const [fipeLoading, setFipeLoading] = useState(false);
  const [fipeFetched, setFipeFetched] = useState(false);
  const [descontoMensal, setDescontoMensal] = useState("");
  const [descontoAdesao, setDescontoAdesao] = useState("");
  const [valorInstalacaoEdit, setValorInstalacaoEdit] = useState("");
  const [descontoIaLoading, setDescontoIaLoading] = useState(false);
  const [descontoIaResult, setDescontoIaResult] = useState<{
    aprovado: boolean;
    desconto_maximo: number;
    justificativa: string;
    necessita_diretor: boolean;
  } | null>(null);
  // 1.2 — Flag: cotação já enviada (bloqueia desconto sem IA)
  // Verifica por: 1) registro na tabela cotacoes, 2) stage além de em_negociacao, 3) cotacao_id preenchido
  const [cotacaoEnviada, setCotacaoEnviada] = useState(false);
  React.useEffect(() => {
    if (!deal.id || deal.id.startsWith("p")) return;
    // Check 1: stage avançado indica cotação já enviada
    const stagesPosCotacao = ["aguardando_vistoria", "vistoria_aprovada", "em_contratacao", "liberado_cadastro", "concluido"];
    if (stagesPosCotacao.includes(deal.stage)) {
      setCotacaoEnviada(true);
      return;
    }
    // Check 2: cotacao_id preenchido no deal
    if ((deal as any).cotacao_id) {
      setCotacaoEnviada(true);
      return;
    }
    // Check 3: registro na tabela cotacoes
    supabase.from("cotacoes" as any).select("id").eq("negociacao_id", deal.id).limit(1).maybeSingle()
      .then(({ data }: any) => { if (data) setCotacaoEnviada(true); });
  }, [deal.id, deal.stage]);

  // 1.1 — Upload de proposta concorrente (foto/PDF)
  const [concorrenteFile, setConcorrenteFile] = useState<File | null>(null);
  const [concorrenteUploading, setConcorrenteUploading] = useState(false);
  const concorrenteInputRef = React.useRef<HTMLInputElement>(null);

  const [propostaConcorrenteUrl, setPropostaConcorrenteUrl] = useState("");
  const [analiseConcorrenteLoading, setAnaliseConcorrenteLoading] = useState(false);
  const [analiseConcorrente, setAnaliseConcorrente] = useState<{
    analise: any;
    pontos_fracos_concorrente: string[];
    argumentos_venda: string[];
    nota_reclame_aqui: string | null;
  } | null>(null);

  // FIPE cascata effects (após form estar definido)
  useEffect(() => {
    fipeMarcas(form.tipoVeiculo).then(setFipeMarcasList).catch(() => {});
  }, [form.tipoVeiculo]);
  useEffect(() => {
    if (!fipeMarcaCod) { setFipeModelosList([]); return; }
    fipeModelos(form.tipoVeiculo, fipeMarcaCod).then(setFipeModelosList).catch(() => {});
  }, [fipeMarcaCod, form.tipoVeiculo]);
  useEffect(() => {
    if (!fipeMarcaCod || !fipeModeloCod) { setFipeAnosList([]); return; }
    fipeAnos(form.tipoVeiculo, fipeMarcaCod, String(fipeModeloCod)).then(setFipeAnosList).catch(() => {});
  }, [fipeModeloCod, fipeMarcaCod, form.tipoVeiculo]);
  useEffect(() => {
    if (!fipeMarcaCod || !fipeModeloCod || !fipeAnoCod) return;
    setFipeLoading(true);
    fipeValor(form.tipoVeiculo, fipeMarcaCod, String(fipeModeloCod), fipeAnoCod).then(data => {
      if (data?.Valor) {
        const val = parseFloat(data.Valor.replace("R$", "").replace(/\./g, "").replace(",", ".").trim());
        setValorFipeReal(val);
        setMarcaReal(data.Marca || "");
        setModeloReal(data.Modelo || "");
        setCodFipeReal(data.CodigoFipe || "");
        setForm(f => ({ ...f, anoFab: String(data.AnoModelo), combustivel: data.Combustivel || "" }));
        setFipeFetched(true);
      }
      setFipeLoading(false);
    }).catch(() => setFipeLoading(false));
  }, [fipeAnoCod]);

  // Cidades dinâmicas do banco
  const [cidades, setCidades] = useState<string[]>([]);
  useEffect(() => {
    if (!form.estadoCirc) { setCidades([]); return; }
    supabase.from("municipios" as any).select("nome").eq("uf", form.estadoCirc).order("nome")
      .then(({ data }) => setCidades((data || []).map((d: any) => d.nome)));
  }, [form.estadoCirc]);

  // Dados reais do banco
  const [precosReais, setPrecosReais] = useState<any[]>([]);
  const [veiculoAceito, setVeiculoAceito] = useState<boolean | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [coberturasPlano, setCoberturasPlano] = useState<any[]>([]);

  // Buscar coberturas ao selecionar plano
  const carregarCoberturas = async (plano: string) => {
    const { data } = await supabase.from("coberturas_plano" as any).select("*").eq("plano", plano).order("ordem");
    setCoberturasPlano(data || []);
  };

  // Verificar se veículo é aceito
  const verificarAceitacao = async (marcaNome: string, modeloNome: string) => {
    const { data } = await supabase.from("modelos_veiculo" as any)
      .select("aceito, motivo_rejeicao, marcas_veiculo(nome)")
      .ilike("nome", `%${modeloNome.split(" ")[0]}%`)
      .limit(1)
      .maybeSingle();
    if (data) {
      setVeiculoAceito((data as any).aceito);
      if (!(data as any).aceito) setMotivoRejeicao((data as any).motivo_rejeicao || "Veículo sem aceitação pela associação");
    } else {
      setVeiculoAceito(null);
    }
  };

  // Buscar regional de preços pela cidade/UF de circulação
  const buscarRegionalPrecos = async (uf: string, cidade: string): Promise<string> => {
    // Primeiro tenta match por cidade específica (ex: São Paulo → SP Capital)
    if (cidade) {
      const { data: cidadeMatch } = await supabase.from("uf_regional_precos" as any)
        .select("regional_precos")
        .eq("uf", uf)
        .ilike("cidade", cidade)
        .limit(1)
        .maybeSingle();
      if (cidadeMatch) return (cidadeMatch as any).regional_precos;
    }
    // Fallback: match por UF (cidade IS NULL = default do estado)
    const { data: ufMatch } = await supabase.from("uf_regional_precos" as any)
      .select("regional_precos")
      .eq("uf", uf)
      .is("cidade", null)
      .limit(1)
      .maybeSingle();
    return ufMatch ? (ufMatch as any).regional_precos : "";
  };

  // Buscar preços reais por valor FIPE + tipo veículo + cidade/UF circulação
  const carregarPrecos = async (vFipe: number, tipoVeiculo?: string) => {
    const tipoMap: Record<string, string> = {
      "Automóvel": "Carros e Utilitários Pequenos",
      "Motocicleta": "Motos",
      "Caminhão": "Caminhões e Micro-Ônibus",
      "Van/Utilitário": "Carros e Utilitários Pequenos",
      "Ônibus": "Caminhões e Micro-Ônibus",
    };
    const tipoDb = tipoMap[tipoVeiculo || form.tipoVeiculo] || "Carros e Utilitários Pequenos";

    // Buscar faixas que cobrem este valor FIPE + tipo veículo
    const { data: todos } = await supabase.from("tabela_precos" as any)
      .select("*")
      .lte("valor_menor", vFipe)
      .gte("valor_maior", vFipe)
      .eq("tipo_veiculo", tipoDb)
      .order("plano_normalizado");

    if (todos && todos.length > 0) {
      // Buscar regional pela cidade/UF de circulação do veículo
      const regionalPrecos = await buscarRegionalPrecos(form.estadoCirc || "", form.cidadeCirc || "");
      let resultado = todos;
      if (regionalPrecos) {
        const filtered = todos.filter((t: any) =>
          (t.regional_normalizado || "").toUpperCase() === regionalPrecos.toUpperCase()
        );
        resultado = filtered.length > 0 ? filtered : todos;
      }
      setPrecosReais(resultado);
      // Salvar cache de preços na negociação
      if (deal.id && !deal.id.startsWith("p")) {
        supabase.from("negociacoes").update({ cache_precos: resultado } as any).eq("id", deal.id).then(() => {});
      }
    } else {
      setPrecosReais([]);
    }
  };

  // Carregar preços — prioridade: 1) cache_precos do deal, 2) cotação salva, 3) API placa
  const [precosCarregadosDaCotacao, setPrecosCarregadosDaCotacao] = React.useState(false);
  React.useEffect(() => {
    if (precosCarregadosDaCotacao) return;

    // 1. Cache de preços direto no deal (instantâneo, sem query)
    const cachePrecos = (deal as any).cache_precos;
    if (cachePrecos && Array.isArray(cachePrecos) && cachePrecos.length > 0) {
      setPrecosReais(cachePrecos);
      setFipeFetched(true);
      setPrecosCarregadosDaCotacao(true);
      return;
    }

    const processarPlanos = (data: any) => {
      if (data?.todos_planos && Array.isArray(data.todos_planos) && data.todos_planos.length > 0) {
        const planosCotacao = data.todos_planos.map((p: any) => ({
          plano: p.nome, plano_normalizado: p.nome,
          cota: p.valor_mensal || 0, adesao: p.adesao || 0,
          rastreador: p.rastreador || "Não", instalacao: p.instalacao || 0,
          tipo_franquia: p.tipo_franquia || "", valor_franquia: p.franquia || 0,
        }));
        setPrecosReais(planosCotacao);
        if (data.plano_selecionado) setPlanoSelecionado(data.plano_selecionado);
        if (data.todos_planos[0]?.valor_fipe) setValorFipeReal(data.todos_planos[0].valor_fipe);
        setFipeFetched(true);
      }
      setPrecosCarregadosDaCotacao(true);
    };

    // 2. Tentar cache_precos do banco (query rápida)
    if (deal.id && !deal.id.startsWith("p")) {
      supabase.from("negociacoes" as any).select("cache_precos, cache_fipe, cotacao_id").eq("id", deal.id).maybeSingle()
        .then(({ data: negData }: any) => {
          if (negData?.cache_precos && Array.isArray(negData.cache_precos) && negData.cache_precos.length > 0) {
            setPrecosReais(negData.cache_precos);
            if (negData.cache_fipe?.valorFipe) setValorFipeReal(negData.cache_fipe.valorFipe);
            setFipeFetched(true);
            setPrecosCarregadosDaCotacao(true);
            return;
          }
          // 3. Tentar cotação salva
          const cotId = negData?.cotacao_id || (deal as any).cotacao_id;
          if (cotId) {
            supabase.from("cotacoes" as any).select("todos_planos, plano_selecionado").eq("id", cotId).maybeSingle()
              .then(({ data }: any) => processarPlanos(data));
          } else {
            supabase.from("cotacoes" as any).select("todos_planos, plano_selecionado").eq("negociacao_id", deal.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
              .then(({ data }: any) => processarPlanos(data));
          }
        });
    } else {
      setPrecosCarregadosDaCotacao(true);
    }
  }, [deal.id]);

  // Auto-carregar dados reais do veículo — primeiro do cache, depois da API
  const [dadosReaisCarregados, setDadosReaisCarregados] = React.useState(false);

  // Função que aplica dados FIPE no state (reutilizada pelo cache e API)
  const aplicarDadosFipe = React.useCallback(async (r: any, salvarCache: boolean) => {
    setMarcaReal(r.marca || "");
    setModeloReal(r.modelo || "");
    setValorFipeReal(r.valorFipe || 0);
    setCodFipeReal(r.codFipe || "");
    setForm(prev => ({
      ...prev,
      placa: deal.veiculo_placa || prev.placa,
      chassi: r.chassi || prev.chassi || "",
      renavam: r.renavam || prev.renavam || "",
      anoFab: r.anoFabricacao || prev.anoFab || "",
      cor: r.cor || prev.cor || "",
      combustivel: r.combustivel || prev.combustivel || "",
    }));
    const matchMarca = marcas.find(m => (r.marca || "").toUpperCase().includes(m.toUpperCase()));
    if (matchMarca) setMarca(matchMarca);
    const vFipe = r.valorFipe || 0;
    if (vFipe > 0) {
      await carregarPrecos(vFipe);
      carregarCoberturas(planoSelecionado);
    }
    verificarAceitacao(r.marca || "", r.modelo || "");
    setFipeLoading(false);
    setFipeFetched(true);
    setDadosReaisCarregados(true);

    // Salvar cache no banco pra próxima vez carregar instantâneo
    if (salvarCache && deal.id && !deal.id.startsWith("p")) {
      supabase.from("negociacoes").update({ cache_fipe: r } as any).eq("id", deal.id).then(() => {});
    }
  }, [deal.id, deal.veiculo_placa, planoSelecionado]);

  React.useEffect(() => {
    if (dadosReaisCarregados) return;
    if (!precosCarregadosDaCotacao) return;
    if (precosReais.length > 0 && fipeFetched) { setDadosReaisCarregados(true); return; }

    // 1. Tentar cache salvo na negociação (instantâneo)
    const cacheFipe = (deal as any).cache_fipe;
    if (cacheFipe && cacheFipe.valorFipe > 0) {
      aplicarDadosFipe(cacheFipe, false);
      return;
    }

    // 2. Buscar do banco (pode ter sido salvo em sessão anterior)
    if (deal.id && !deal.id.startsWith("p")) {
      supabase.from("negociacoes" as any).select("cache_fipe").eq("id", deal.id).maybeSingle()
        .then(({ data }: any) => {
          if (data?.cache_fipe && data.cache_fipe.valorFipe > 0) {
            aplicarDadosFipe(data.cache_fipe, false);
            return;
          }
          // 3. Sem cache — buscar da API
          buscarDaApi();
        });
      return;
    }

    buscarDaApi();

    function buscarDaApi() {
      const placa = (deal.veiculo_placa || "").replace(/[^A-Z0-9]/gi, "");
      if (placa.length < 7) return;
      setFipeLoading(true);
      callEdge("gia-buscar-placa", { acao: "placa", placa }).then(res => {
        if (res.sucesso && res.resultado) {
          aplicarDadosFipe(res.resultado, true); // salvar cache
        } else {
          setFipeLoading(false);
        }
      }).catch((e) => { console.error("Erro ao buscar placa:", e); setFipeLoading(false); });
    }
  }, [deal.veiculo_placa, dadosReaisCarregados, precosCarregadosDaCotacao]);

  // planosConfig: usa preços reais se tiver, senão fallback default
  // Agrupa por plano_normalizado para evitar duplicatas
  const planosConfig = precosReais.length > 0
    ? [...new Set(precosReais.map((p: any) => p.plano_normalizado || p.plano))].map(planoNorm => {
        const p = precosReais.find((pr: any) => (pr.plano_normalizado || pr.plano) === planoNorm);
        return {
          nome: planoNorm,
          icon: planoNorm.includes("Premium") ? ShieldPlus : planoNorm.includes("Completo") ? ShieldCheck : planoNorm.includes("Objetivo") ? ShieldCheck : Shield,
          cor: planoNorm.includes("Premium") ? "border-warning/25 bg-warning/8" : planoNorm.includes("Completo") ? "border-success/20 bg-emerald-50" : planoNorm.includes("Objetivo") ? "border-blue-300 bg-blue-50" : "border-blue-200 bg-primary/6",
          percentual: 0,
          coberturas: [] as string[],
          valorReal: Number(p?.cota || 0),
          adesao: Number(p?.adesao || 0) || 400,
          rastreador: p?.rastreador || "Não",
          instalacao: Number(p?.instalacao || 0) || 100,
        };
      })
    : planosConfigDefault.map(p => ({ ...p, valorReal: 0, adesao: 400, rastreador: "Não", instalacao: 100 }));
  // Usar valor FIPE real da API
  const valorFipe = valorFipeReal;
  const codFipe = codFipeReal;

  // Desconto é livre para consultor/gestor. Análise IA obrigatória apenas >5%.

  const set = (field: string, value: string | boolean) => setForm(prev => ({ ...prev, [field]: value }));

  const handleBaixarPdf = async () => {
    if (!planoSelecionado) { toast.error("Selecione um plano para baixar o PDF"); return; }
    const precoPlano = precosReais.find((p: any) => (p.plano_normalizado || p.plano) === planoSelecionado);
    const mensal = precoPlano ? Number(precoPlano.cota) : Math.round(valorFipe * (planosConfig.find(p => p.nome === planoSelecionado)?.percentual || 0));
    await gerarPdfCotacao({
      numeroCotacao: `${Date.now().toString().slice(-8)}`,
      data: new Date().toLocaleDateString("pt-BR"),
      validade: 7,
      cliente: {
        nome: deal.lead_nome,
        veiculo: `${marca} ${modeloReal || deal.veiculo_modelo}`,
        placa: form.placa,
        codFipe: codFipe,
        valorFipe,
        cidade: form.cidadeCirc,
        estado: form.estadoCirc,
      },
      plano: {
        nome: planoSelecionado,
        mensal: descontoMensal ? Number(descontoMensal) : mensal,
        mensalOriginal: descontoMensal ? mensal : undefined,
        adesao: descontoAdesao ? Number(descontoAdesao) : (precoPlano ? Number(precoPlano.adesao) : 400),
        adesaoOriginal: descontoAdesao ? (precoPlano ? Number(precoPlano.adesao) : 400) : undefined,
        participacao: precoPlano ? `${precoPlano.tipo_franquia} ${precoPlano.valor_franquia}` : "5% FIPE",
        rastreador: precoPlano?.rastreador || "Não",
        instalacao: precoPlano ? Number(precoPlano.instalacao || 0) : 0,
      },
      coberturas: coberturasPlano.map((c: any) => ({ nome: c.cobertura, inclusa: c.inclusa, tipo: c.tipo, detalhe: c.detalhe })),
      consultor: { nome: deal.consultor || "Consultor", telefone: "", email: "" },
    });
    toast.success("PDF da cotação baixado!");
  };

  const handleEnviar = async (tipo: string) => {
    if (tipo === "PDF") {
      handleBaixarPdf();
      // Auto-transição mesmo ao baixar PDF
      const { data: negPdf } = await (supabase as any).from("negociacoes").select("stage").eq("id", deal.id).maybeSingle();
      const stagePdf = negPdf?.stage || deal.stage;
      if (stagePdf === "novo_lead" || stagePdf === "em_contato") {
        await (supabase as any).from("negociacoes").update({ stage: "em_negociacao", updated_at: new Date().toISOString() }).eq("id", deal.id);
        await (supabase as any).from("pipeline_transicoes").insert({
          negociacao_id: deal.id, stage_anterior: stagePdf, stage_novo: "em_negociacao",
          motivo: "Cotação PDF baixada", automatica: true,
        });
        toast.info("Card movido para Em Negociação");
      }
      return;
    }
    if (!form.estadoCirc || !form.cidadeCirc.trim()) {
      toast.error("Preencha Estado e Cidade de Circulação antes de enviar a cotação.");
      return;
    }
    // Buscar regional pela cidade/estado de circulação
    const regionalCot = await buscarRegionalPrecos(form.estadoCirc || "", form.cidadeCirc || "");

    // Criar cotação com planos filtrados pela regional
    const planosFiltrados = precosReais.length > 0
      ? precosReais.filter((p: any) => !regionalCot || (p.regional_normalizado || "").toUpperCase() === regionalCot.toUpperCase())
      : precosReais;

    const { data: cotacao } = await supabase
      .from("cotacoes")
      .insert({
        negociacao_id: deal.id,
        cidade_circulacao: form.cidadeCirc,
        estado_circulacao: form.estadoCirc,
        regional_precos: regionalCot,
        todos_planos: planosFiltrados.length > 0
          ? planosFiltrados.map((p: any) => ({ nome: p.plano_normalizado || p.plano, valor_mensal: p.cota, adesao: p.adesao, rastreador: p.rastreador, franquia: p.valor_franquia, valor_fipe: valorFipe }))
          : [{ nome: planoSelecionado, valor_mensal: valorFipe * 0.015 }],
        desconto_aplicado: 0,
      } as any)
      .select()
      .single();

    if (cotacao) {
      const cotId = (cotacao as any).id;
      await supabase.from("negociacoes").update({
        cotacao_id: cotId,
        updated_at: new Date().toISOString(),
      } as any).eq("id", deal.id);

      // Auto-transição: buscar stage ATUAL do banco e mover se necessário
      const { data: negAtual } = await (supabase as any).from("negociacoes").select("stage").eq("id", deal.id).maybeSingle();
      const stageAtual = negAtual?.stage || deal.stage;
      if (stageAtual === "novo_lead" || stageAtual === "em_contato") {
        await (supabase as any).from("negociacoes").update({ stage: "em_negociacao", updated_at: new Date().toISOString() }).eq("id", deal.id);
        await (supabase as any).from("pipeline_transicoes").insert({
          negociacao_id: deal.id,
          stage_anterior: stageAtual,
          stage_novo: "em_negociacao",
          motivo: `Cotação enviada via ${tipo}`,
          automatica: true,
        });
        toast.info("Card movido para Em Negociação");
      }

      const linkPlanos = `${window.location.origin}/planos/${cotId}`;
      const msgCotacao = `Olá ${deal.lead_nome}! Segue sua cotação de proteção veicular para o veículo ${deal.veiculo_placa}:\n\n${linkPlanos}\n\nCompare os planos e escolha o melhor para você!\n\nObjetivo Auto Benefícios`;

      // Buscar dados FRESCOS do banco (telefone/email podem ter sido atualizados após cadastro inicial)
      const { data: negFresh } = await (supabase as any).from("negociacoes").select("telefone,email,lead_nome,veiculo_placa").eq("id", deal.id).maybeSingle();
      const df = negFresh || deal;

      // Enviar Email via Mailjet
      if (df.email) {
        callEdge("gia-enviar-notificacao", {
          tipo: "email",
          email: df.email,
          nome: df.lead_nome,
          assunto: `Sua Cotação de Proteção Veicular - ${df.veiculo_placa || deal.veiculo_placa}`,
          mensagem: msgCotacao,
        }).then(res => {
          if (res.email?.sucesso) toast.success("E-mail enviado ao associado!");
        }).catch((e) => { console.error("Erro ao enviar notificação:", e); });
      }

      if (tipo === "Link") {
        navigator.clipboard.writeText(linkPlanos);
        toast.success("Link copiado! E-mail enviado ao cliente.", { duration: 5000 });
        return;
      }

      if (tipo === "WhatsApp") {
        const tel = (df.telefone || "").replace(/\D/g, "");
        const msg = encodeURIComponent(msgCotacao);
        window.open(`https://wa.me/55${tel}?text=${msg}`, "_blank");
        toast.success("WhatsApp aberto + e-mail enviado!");
        return;
      }
    } else {
      // Cotação não criou mas ainda assim mover o card
      const { data: negFallback } = await (supabase as any).from("negociacoes").select("stage").eq("id", deal.id).maybeSingle();
      const stageFb = negFallback?.stage || deal.stage;
      if (stageFb === "novo_lead" || stageFb === "em_contato") {
        await (supabase as any).from("negociacoes").update({ stage: "em_negociacao", updated_at: new Date().toISOString() }).eq("id", deal.id);
        await (supabase as any).from("pipeline_transicoes").insert({
          negociacao_id: deal.id, stage_anterior: stageFb, stage_novo: "em_negociacao",
          motivo: `Cotação enviada via ${tipo}`, automatica: true,
        });
        toast.info("Card movido para Em Negociação");
      }
      toast.error("Erro ao criar cotação, mas card foi movido");
      return;
    }
    toast.success(`Cotação enviada via ${tipo}!`);
  };

  const lbl = "text-sm font-semibold";

  const anosDisp = useMemo(() => {
    const cur = new Date().getFullYear();
    return Array.from({ length: 15 }, (_, i) => String(cur - i));
  }, []);

  // FIPE auto-lookup via wdapi2.com.br (real) ou mock fallback
  const consultarFipe = useCallback(async (placa: string) => {
    const cleanPlaca = placa.replace(/[^a-zA-Z0-9]/g, "");
    if (cleanPlaca.length < 7) return;

    setFipeLoading(true);
    setFipeFetched(false);

    try {
      // Buscar via API real (wdapi2)
      const result = await callEdge("gia-buscar-placa", { acao: "placa", placa: cleanPlaca });

      if (result.sucesso && result.resultado) {
        const r = result.resultado;
        const marcaNome = r.marca || "";
        const matchMarca = marcas.find(m => marcaNome.toUpperCase().includes(m.toUpperCase()));
        if (matchMarca) setMarca(matchMarca);

        setForm(prev => ({
          ...prev,
          anoFab: r.anoFabricacao || prev.anoFab,
          cor: r.cor || prev.cor,
          combustivel: r.combustivel || prev.combustivel,
          chassi: r.chassi || prev.chassi,
          renavam: r.renavam || prev.renavam || "",
        }));

        const vFipe = r.valorFipe || 0;

        if (vFipe > 0) {
          await carregarPrecos(vFipe);
          await carregarCoberturas(planoSelecionado);
        }
        await verificarAceitacao(marcaNome, r.modelo || "");

        setFipeLoading(false);
        setFipeFetched(true);
        toast.success(`${marcaNome} ${r.modelo} ${r.anoFabricacao}/${r.anoModelo} — ${formatCurrency(vFipe)}`);
        return;
      }
    } catch { /* API error */ }

    // Fallback: buscar na tabela veiculos do Supabase
    const veiculoDb = await lookupPlaca(placa);
    if (veiculoDb) {
      setMarcaReal(veiculoDb.marca || "");
      setModeloReal(veiculoDb.modelo || "");
      const matchMarca = marcas.find(m => (veiculoDb.marca || "").toUpperCase().includes(m.toUpperCase()));
      if (matchMarca) setMarca(matchMarca);
      setForm(prev => ({
        ...prev,
        anoFab: veiculoDb.ano ? String(veiculoDb.ano) : prev.anoFab,
        cor: veiculoDb.cor || prev.cor,
        combustivel: veiculoDb.combustivel || prev.combustivel,
        chassi: veiculoDb.chassi || prev.chassi,
        renavam: veiculoDb.renavam || prev.renavam,
      }));
      const vFipe = veiculoDb.valor_fipe || 0;
      if (vFipe > 0) {
        setValorFipeReal(vFipe);
        setCodFipeReal(veiculoDb.cod_fipe || "");
        await carregarPrecos(vFipe);
        await carregarCoberturas(planoSelecionado);
      }
      setFipeLoading(false);
      setFipeFetched(true);
      toast.success(`${veiculoDb.marca || ""} ${veiculoDb.modelo || ""} — ${formatCurrency(vFipe)}`);
      return;
    }

    setFipeLoading(false);
    toast.error("Placa não encontrada. Selecione marca/modelo manualmente.");
  }, [planoSelecionado, deal.regional]);

  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPlaca(e.target.value);
    set("placa", masked);
    setFipeFetched(false);
    // Auto-trigger when plate is complete
    if (masked.replace("-", "").length === 7) {
      consultarFipe(masked);
    }
  };

  return (
    <div className="space-y-6">
      {/* FIPE result banner */}
      {fipeFetched && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-success/8">
          <CheckCircle className="h-5 w-5 text-success shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-success">Dados FIPE preenchidos automaticamente</p>
            <p className="text-xs text-success">{marca} {modeloReal || deal.veiculo_modelo} — {formatCurrency(valorFipe)} — Ref. Março/2026</p>
          </div>
          <Badge className="bg-success text-white text-[10px]">Tabela FIPE</Badge>
        </div>
      )}

      {/* SEÇÃO 1 - DADOS DO VEÍCULO */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-[#1A3A5C] border-b-2 border-[#747474] pb-1 w-full">DADOS DO VEÍCULO</legend>
        <div className="grid grid-cols-3 gap-x-4 gap-y-3">
          <div className="space-y-1">
            <Label className={lbl}>Tipo do Veículo</Label>
            <Select value={form.tipoVeiculo} onValueChange={v => set("tipoVeiculo", v)}>
              <SelectTrigger className="rounded-none border border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>{tiposVeiculo.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Placa</Label>
            <div className="relative">
              <Input className="rounded-none font-mono pr-8" value={form.placa} onChange={handlePlacaChange} />
              {fipeLoading ? (
                <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-primary" />
              ) : (
                <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">Ao digitar a placa, a consulta FIPE é automática</p>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Chassi</Label>
            <Input className="rounded-none font-mono text-xs" value={form.chassi} onChange={e => set("chassi", e.target.value.toUpperCase())} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Renavam</Label>
            <Input className="rounded-none border border-gray-300" value={form.renavam} onChange={e => set("renavam", e.target.value.replace(/\D/g, "").slice(0, 11))} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Marca (FIPE)</Label>
            <Select value={fipeMarcaCod} onValueChange={v => { setFipeMarcaCod(v); setFipeModeloCod(""); setFipeAnoCod(""); const m = fipeMarcasList.find(x => x.codigo === v); if (m) { setMarca(m.nome); setMarcaReal(m.nome); } }}>
              <SelectTrigger className="rounded-none border border-gray-300"><SelectValue placeholder={marcaReal || "Selecione"} /></SelectTrigger>
              <SelectContent className="max-h-60">{fipeMarcasList.map(m => <SelectItem key={m.codigo} value={m.codigo}>{m.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Modelo (FIPE)</Label>
            <Select value={fipeModeloCod} onValueChange={v => { setFipeModeloCod(v); setFipeAnoCod(""); const m = fipeModelosList.find(x => String(x.codigo) === v); if (m) setModeloReal(m.nome); }}>
              <SelectTrigger className="rounded-none border border-gray-300"><SelectValue placeholder={modeloReal || "Selecione"} /></SelectTrigger>
              <SelectContent className="max-h-60">{fipeModelosList.map(m => <SelectItem key={m.codigo} value={String(m.codigo)}>{m.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Ano {fipeLoading && <Loader2 className="h-3 w-3 animate-spin inline ml-1" />}</Label>
            <Select value={fipeAnoCod} onValueChange={setFipeAnoCod}>
              <SelectTrigger className="rounded-none border border-gray-300"><SelectValue placeholder={form.anoFab || "Selecione"} /></SelectTrigger>
              <SelectContent>{fipeAnosList.map(a => <SelectItem key={a.codigo} value={a.codigo}>{a.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Código FIPE</Label>
            <Input className="rounded-none font-mono bg-muted" value={codFipe} readOnly />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Valor FIPE</Label>
            <Input className="rounded-none font-mono bg-muted" value={formatCurrency(valorFipe)} readOnly />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Cor</Label>
            <Select value={form.cor} onValueChange={v => set("cor", v)}>
              <SelectTrigger className="rounded-none border border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>{cores.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Câmbio</Label>
            <Select value={form.cambio} onValueChange={v => set("cambio", v)}>
              <SelectTrigger className="rounded-none border border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>{cambios.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Combustível</Label>
            <Select value={form.combustivel} onValueChange={v => set("combustivel", v)}>
              <SelectTrigger className="rounded-none border border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>{combustiveis.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Quilometragem</Label>
            <Input className="rounded-none border border-gray-300" type="number" value={form.quilometragem} onChange={e => set("quilometragem", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Nº do Motor</Label>
            <Input className="rounded-none font-mono text-xs" value={form.numMotor} onChange={e => set("numMotor", e.target.value.toUpperCase())} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Estado Circulação</Label>
            <Select value={form.estadoCirc} onValueChange={v => { set("estadoCirc", v); set("cidadeCirc", ""); if (valorFipe > 0) setTimeout(() => carregarPrecos(valorFipe), 100); }}>
              <SelectTrigger className="rounded-none border border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>{UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Cidade Circulação</Label>
            <Select value={form.cidadeCirc} onValueChange={v => { set("cidadeCirc", v); if (valorFipe > 0) setTimeout(() => carregarPrecos(valorFipe), 100); }}>
              <SelectTrigger className="rounded-none border border-gray-300"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{cidades.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Dia Vencimento</Label>
            <Select value={form.diaVencimento} onValueChange={v => set("diaVencimento", v)}>
              <SelectTrigger className="rounded-none border border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Dia 1</SelectItem>
                <SelectItem value="10">Dia 10</SelectItem>
                <SelectItem value="20">Dia 20</SelectItem>
              </SelectContent>
            </Select>
            {(() => {
              const dt = new Date().getDate();
              // Dia padrão pela data de contratação: 26-5→dia1, 6-15→dia10, 16-25→dia20
              const diaPadrao = (dt >= 26 || dt <= 5) ? 1 : (dt >= 6 && dt <= 15) ? 10 : 20;
              const diaVenc = parseInt(form.diaVencimento) || diaPadrao;
              const foraFaixa = diaVenc !== diaPadrao;

              if (!foraFaixa) return <p className="text-[10px] text-muted-foreground">Dia {diaPadrao} — padrão para contratação no dia {dt}</p>;

              // Calcular proporcional: dias entre o dia padrão e o dia escolhido
              const hoje = new Date();
              const mesAtual = hoje.getMonth();
              const anoAtual = hoje.getFullYear();
              // Próximo vencimento no dia escolhido
              const proxVenc = new Date(anoAtual, diaVenc > dt ? mesAtual : mesAtual + 1, diaVenc);
              const diasAteVenc = Math.max(1, Math.round((proxVenc.getTime() - hoje.getTime()) / 86400000));
              const precoPlano = precosReais.find((p: any) => (p.plano_normalizado || p.plano) === planoSelecionado);
              const mensalidade = precoPlano ? Number(precoPlano.cota) : Math.round(valorFipe * (planosConfig.find(p => p.nome === planoSelecionado)?.percentual || 0));
              const proporcional = Math.round((mensalidade / 30) * diasAteVenc * 100) / 100;

              return (
                <div className="p-2 rounded border border-amber-200 bg-amber-50 space-y-0.5">
                  <p className="text-[10px] font-semibold text-amber-800">Vencimento fora da faixa padrão (dia {diaPadrao})</p>
                  <p className="text-[10px] text-blue-800">1ª mensalidade proporcional: {formatCurrency(proporcional)} ({diasAteVenc} dias) — venc. {proxVenc.toLocaleDateString("pt-BR")}</p>
                  <p className="text-[10px] text-blue-700">Meses seguintes: {formatCurrency(mensalidade)}</p>
                  <p className="text-[10px] text-amber-600">Requer exceção — análise IA ou diretor</p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Toggles e Checkboxes */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Switch checked={form.veiculoTrabalho} onCheckedChange={v => set("veiculoTrabalho", v)} />
            <span className="text-sm">Veículo de trabalho / Táxi / Uber</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.depreciacao} onCheckedChange={v => set("depreciacao", v)} />
            <span className="text-sm">Depreciação</span>
          </div>
        </div>
        <div className="flex gap-6 pt-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={form.taxi} onCheckedChange={v => set("taxi", !!v)} />Táxi
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={form.chassiRemarcado} onCheckedChange={v => set("chassiRemarcado", !!v)} />Chassi remarcado
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={form.leilao} onCheckedChange={v => set("leilao", !!v)} />Leilão
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <Label className={lbl}>Implemento / Agregado (opcional)</Label>
            <Input className="rounded-none border border-gray-300" value={form.implemento} onChange={e => set("implemento", e.target.value)} placeholder="Ex: Baú, Guincho..." />
          </div>
        </div>
        <div className="space-y-1 pt-1">
          <Label className={lbl}>Observações no Termo (cliente vê)</Label>
          <Textarea className="rounded-none border border-gray-300" rows={2} value={form.obsContrato} onChange={e => set("obsContrato", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className={lbl}>Observações Internas (somente equipe)</Label>
          <Textarea className="rounded-none border border-gray-300" rows={2} value={form.obsInterna} onChange={e => set("obsInterna", e.target.value)} />
        </div>
      </fieldset>

      {/* FROTA - Adicionar veículo */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-bold text-[#1A3A5C] border-b-2 border-[#747474] pb-1 w-full">FROTA</legend>
        <p className="text-xs text-muted-foreground">Adicione mais veículos para cotação em frota.</p>
        <Button size="sm" variant="outline" className="rounded-none border border-gray-300" onClick={async () => {
          await supabase.from("negociacao_veiculos" as any).insert({
            negociacao_id: deal.id,
            placa: form.placa,
            marca: marca,
            modelo: modeloReal || deal.veiculo_modelo,
            ano: parseInt(form.anoFab) || null,
            valor_fipe: valorFipe,
            cor: form.cor,
            combustivel: form.combustivel,
            chassi: form.chassi,
          } as any);
          toast.success("Veículo adicionado à frota!");
        }}>
          <Car className="h-3.5 w-3.5 mr-1" />Adicionar Veículo à Frota
        </Button>
      </fieldset>

      {/* SEÇÃO 2 - PLANOS E ENVIO */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-bold text-[#1A3A5C] border-b-2 border-[#747474] pb-1 w-full">PLANOS E ENVIO</legend>

        {/* Loading skeleton enquanto planos carregam */}
        {!fipeFetched && fipeLoading && (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="rounded-none border-2 border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                  <div className="space-y-1">
                    {[1, 2, 3].map(j => <div key={j} className="h-3 w-full bg-muted animate-pulse rounded" />)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {veiculoAceito === false && (
          <Card className="rounded-none border-2 border-destructive bg-destructive/5 mb-3">
            <CardContent className="p-4 flex items-center gap-3">
              <Search className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-bold text-destructive">Veículo sem aceitação</p>
                <p className="text-xs text-muted-foreground">{motivoRejeicao}</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-none ml-auto text-xs border-destructive text-destructive" onClick={() => toast.info("Solicitação de liberação enviada ao diretor")}>
                Solicitar Liberação
              </Button>
            </CardContent>
          </Card>
        )}

        {precosReais.length === 0 && fipeFetched && valorFipe > 0 && (
          <Card className="rounded-none border-2 border-warning bg-warning/5 mb-3">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-warning">Sem precificação definida para este veículo nesta regional</p>
              <p className="text-xs text-muted-foreground">Regional: {deal.regional || "não definida"} | FIPE: {formatCurrency(valorFipe)}</p>
            </CardContent>
          </Card>
        )}

        {fipeFetched && precosReais.length === 0 && (
          <Card className="rounded-none border-2 border-destructive/30 bg-destructive/5">
            <CardContent className="p-6 text-center space-y-2">
              <Search className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-sm font-semibold text-destructive">Nenhum plano encontrado para este veículo</p>
              <p className="text-xs text-muted-foreground">Não há precificação cadastrada na tabela de preços para a faixa FIPE deste veículo na regional selecionada.</p>
              <p className="text-xs text-muted-foreground">Verifique a tabela de preços em <strong>Minha Empresa → Tabelas de Preços</strong> ou consulte o gestor.</p>
            </CardContent>
          </Card>
        )}

        {/* Skeleton enquanto preços carregam */}
        {precosReais.length === 0 && !fipeFetched && (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="rounded-none border-2">
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                  <div className="space-y-1">{[1,2,3].map(j => <div key={j} className="h-3 w-full bg-muted animate-pulse rounded" />)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3" style={{ display: precosReais.length === 0 && !fipeFetched ? "none" : undefined }}>
          {planosConfig.map(p => {
            const mensal = (p as any).valorReal > 0 ? (p as any).valorReal : (fipeFetched && precosReais.length === 0 ? 0 : Math.round(valorFipe * p.percentual));
            if (fipeFetched && precosReais.length === 0) return null;
            const selected = planoSelecionado === p.nome;
            return (
              <Card
                key={p.nome}
                onClick={() => setPlanoSelecionado(p.nome)}
                className={`rounded-none cursor-pointer transition-all border-2 ${selected ? "border-[#1A3A5C] ring-2 ring-[#1A3A5C]/20" : p.cor} hover:shadow-md`}
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center gap-2">
                    <p.icon className={`h-5 w-5 ${selected ? "text-[#1A3A5C]" : "text-muted-foreground"}`} />
                    <CardTitle className="text-sm">{p.nome}</CardTitle>
                    {selected && <CheckCircle className="h-4 w-4 text-[#1A3A5C] ml-auto" />}
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  <div className="text-2xl font-bold text-[#1A3A5C]">{formatCurrency(mensal)}<span className="text-xs font-normal text-muted-foreground">/mês</span></div>
                  {/* Adesão + Instalação rastreador */}
                  <div className="text-xs text-muted-foreground">Adesão: <span className="font-semibold text-[#1A3A5C]">{formatCurrency((p as any).adesao || 400)}</span></div>
                  <div className="flex items-center gap-1 p-1.5 rounded border border-amber-300 bg-amber-50">
                    <span className="text-[10px] text-amber-800 font-medium">Instalação Rastreador: R$</span>
                    <input type="number" className="w-16 text-[10px] border border-amber-300 rounded px-1 py-0.5 bg-white font-semibold" value={valorInstalacaoEdit || String((p as any).instalacao || 100)} onChange={e => setValorInstalacaoEdit(e.target.value)} onClick={e => e.stopPropagation()} />
                  </div>
                  <ul className="space-y-1">
                    {p.coberturas.map(c => (
                      <li key={c} className="text-[11px] text-muted-foreground flex items-start gap-1">
                        <CheckCircle className="h-3 w-3 text-success mt-0.5 shrink-0" />{c}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex items-center gap-3 pt-1 flex-wrap">
          <span className="text-sm text-muted-foreground">Plano selecionado:</span>
          <Badge className="rounded-none bg-[#1A3A5C] text-white">{planoSelecionado}</Badge>
          {(() => {
            const pl = planosConfig.find(p => p.nome === planoSelecionado);
            const mensalVal = (pl as any)?.valorReal > 0 ? (pl as any).valorReal : Math.round(valorFipe * (pl?.percentual || 0));
            const adesaoVal = (pl as any)?.adesao || 400;
            const instVal = valorInstalacaoEdit ? Number(valorInstalacaoEdit) : ((pl as any)?.instalacao || 100);
            return (
              <>
                <span className="text-sm font-semibold">{formatCurrency(mensalVal)}/mês</span>
                <span className="text-xs text-muted-foreground">|</span>
                <span className="text-sm text-muted-foreground">Adesão: <strong>{formatCurrency(adesaoVal)}</strong></span>
                <span className="text-xs text-muted-foreground">|</span>
                <span className="text-sm text-muted-foreground">Instalação: <strong>{formatCurrency(instVal)}</strong></span>
              </>
            );
          })()}
        </div>

        {/* Campos de desconto para a cotação */}
        <div className="space-y-3 pt-2 p-3 border rounded bg-muted/20">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Desconto Mensalidade (valor final)</Label>
              <Input className="rounded-none border border-gray-300" type="number" placeholder="Deixe vazio = sem desconto" value={descontoMensal} onChange={e => { setDescontoMensal(e.target.value); setDescontoIaResult(null); }} />
              <p className="text-[10px] text-muted-foreground">Se preenchido, o PDF mostrará o valor original riscado + este valor</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Desconto Adesão (valor final)</Label>
              <Input className="rounded-none border border-gray-300" type="number" placeholder="Deixe vazio = sem desconto" value={descontoAdesao} onChange={e => { setDescontoAdesao(e.target.value); setDescontoIaResult(null); }} />
              <p className="text-[10px] text-muted-foreground">Se preenchido, o PDF mostrará o valor original riscado + este valor</p>
            </div>
          </div>

          {/* IA Desconto — análise automática para descontos > 5% */}
          {(() => {
            const precoPlano = precosReais.find((p: any) => (p.plano_normalizado || p.plano) === planoSelecionado);
            const mensalOriginal = precoPlano ? Number(precoPlano.cota) : Math.round(valorFipe * (planosConfig.find(p => p.nome === planoSelecionado)?.percentual || 0));
            const adesaoOriginal = precoPlano ? Number(precoPlano.adesao) : 400;
            const descMensalPct = descontoMensal && mensalOriginal > 0 ? ((mensalOriginal - Number(descontoMensal)) / mensalOriginal) * 100 : 0;
            const descAdesaoPct = descontoAdesao && adesaoOriginal > 0 ? ((adesaoOriginal - Number(descontoAdesao)) / adesaoOriginal) * 100 : 0;
            const maiorDesconto = Math.max(descMensalPct, descAdesaoPct);
            const precisaIA = maiorDesconto > 5;

            if (!precisaIA) return null;

            return (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded border border-warning/40 bg-warning/8">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                  <p className="text-xs text-warning font-medium">
                    Desconto de {maiorDesconto.toFixed(1)}% detectado (acima de 5%). Análise da IA obrigatória.
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Proposta concorrente (URL, foto ou PDF)</Label>
                  <div className="flex gap-2">
                    <Input className="rounded-none border border-gray-300 flex-1" type="url" placeholder="https://..." value={propostaConcorrenteUrl} onChange={e => { setPropostaConcorrenteUrl(e.target.value); setAnaliseConcorrente(null); }} />
                    <Button size="sm" variant="outline" className="rounded-none border-gray-300 shrink-0" onClick={() => concorrenteInputRef.current?.click()} disabled={concorrenteUploading}>
                      {concorrenteUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                      {concorrenteUploading ? "Enviando..." : "Upload"}
                    </Button>
                    <input
                      ref={concorrenteInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 10 * 1024 * 1024) { toast.error("Arquivo máximo 10MB"); return; }
                        setConcorrenteUploading(true);
                        const ext = file.name.split(".").pop() || "jpg";
                        const path = `propostas-concorrente/${deal.id}/${Date.now()}.${ext}`;
                        const { error } = await supabase.storage.from("propostas-concorrente").upload(path, file, { contentType: file.type, upsert: true });
                        if (error) {
                          // Tentar no bucket geral se não existir
                          const { error: err2 } = await supabase.storage.from("vistoria-fotos").upload(path, file, { contentType: file.type, upsert: true });
                          if (err2) { toast.error("Erro no upload: " + err2.message); setConcorrenteUploading(false); return; }
                          const { data: pubUrl } = supabase.storage.from("vistoria-fotos").getPublicUrl(path);
                          setPropostaConcorrenteUrl(pubUrl.publicUrl);
                        } else {
                          const { data: pubUrl } = supabase.storage.from("propostas-concorrente").getPublicUrl(path);
                          setPropostaConcorrenteUrl(pubUrl.publicUrl);
                        }
                        setConcorrenteFile(file);
                        setConcorrenteUploading(false);
                        setAnaliseConcorrente(null);
                        toast.success("Proposta concorrente enviada!");
                        e.target.value = "";
                      }}
                    />
                  </div>
                  {concorrenteFile && <p className="text-[10px] text-success">Arquivo: {concorrenteFile.name}</p>}
                  {propostaConcorrenteUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-none mt-1 border-[#1A3A5C] text-[#1A3A5C]"
                      disabled={analiseConcorrenteLoading}
                      onClick={async () => {
                        setAnaliseConcorrenteLoading(true);
                        setAnaliseConcorrente(null);
                        try {
                          const res = await callEdge("gia-analisar-concorrente", {
                            negociacao_id: deal.id,
                            image_url: propostaConcorrenteUrl,
                          });
                          if (res.sucesso) {
                            setAnaliseConcorrente({
                              analise: res.analise,
                              pontos_fracos_concorrente: res.pontos_fracos_concorrente || [],
                              argumentos_venda: res.argumentos_venda || [],
                              nota_reclame_aqui: res.nota_reclame_aqui,
                            });
                            toast.success("Análise do concorrente concluída!");
                          } else {
                            toast.error(res.error || "Erro na análise");
                          }
                        } catch (err: any) {
                          toast.error("Erro: " + (err?.message || ""));
                        } finally {
                          setAnaliseConcorrenteLoading(false);
                        }
                      }}
                    >
                      {analiseConcorrenteLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <BrainCircuit className="h-3.5 w-3.5 mr-1" />}
                      {analiseConcorrenteLoading ? "Analisando concorrente..." : "Analisar Concorrente com IA"}
                    </Button>
                  )}

                  {/* Card argumentos do concorrente */}
                  {analiseConcorrente && (
                    <Card className="rounded-none border-2 border-blue-300 bg-blue-50 mt-2">
                      <CardContent className="p-3 space-y-3">
                        <div className="flex items-center gap-2">
                          <BrainCircuit className="h-5 w-5 text-blue-700" />
                          <span className="text-sm font-bold text-blue-800">
                            {analiseConcorrente.analise?.concorrente_nome || "Concorrente"}
                          </span>
                          {analiseConcorrente.nota_reclame_aqui && (
                            <Badge className="rounded-none bg-amber-100 text-amber-700 text-xs">
                              Reclame Aqui: {analiseConcorrente.nota_reclame_aqui}
                            </Badge>
                          )}
                        </div>

                        {analiseConcorrente.analise?.comparacao && (
                          <p className="text-xs text-gray-700">{analiseConcorrente.analise.comparacao}</p>
                        )}

                        {analiseConcorrente.analise?.desconto_recomendado > 0 && (
                          <div className="flex items-center gap-2">
                            <Badge className="rounded-none bg-green-100 text-green-700 text-xs">
                              Desconto recomendado: {analiseConcorrente.analise.desconto_recomendado}%
                            </Badge>
                          </div>
                        )}

                        {analiseConcorrente.pontos_fracos_concorrente.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-red-700 mb-1">Pontos fracos do concorrente:</p>
                            <ul className="space-y-0.5">
                              {analiseConcorrente.pontos_fracos_concorrente.map((p, i) => (
                                <li key={i} className="text-xs text-red-600 flex items-start gap-1">
                                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />{p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analiseConcorrente.argumentos_venda.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-green-700 mb-1">Argumentos de venda:</p>
                            <ul className="space-y-0.5">
                              {analiseConcorrente.argumentos_venda.map((a, i) => (
                                <li key={i} className="text-xs text-green-700 flex items-start gap-1">
                                  <CheckCircle className="h-3 w-3 mt-0.5 shrink-0" />{a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analiseConcorrente.analise?.frase_impacto && (
                          <div className="p-2 bg-[#1A3A5C] text-white rounded-none">
                            <p className="text-xs font-semibold">Use esta frase:</p>
                            <p className="text-sm italic">"{analiseConcorrente.analise.frase_impacto}"</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none border-[#1A3A5C] text-[#1A3A5C]"
                  disabled={descontoIaLoading}
                  onClick={async () => {
                    setDescontoIaLoading(true);
                    setDescontoIaResult(null);
                    try {
                      const res = await callEdge("gia-desconto-ia", {
                        negociacao_id: deal.id,
                        desconto_solicitado: maiorDesconto,
                        proposta_concorrente_url: propostaConcorrenteUrl || undefined,
                      });
                      if (res && typeof res.aprovado !== "undefined") {
                        setDescontoIaResult({
                          aprovado: res.aprovado,
                          desconto_maximo: res.desconto_maximo || 0,
                          justificativa: res.justificativa || "",
                          necessita_diretor: res.necessita_diretor || false,
                        });
                      } else {
                        toast.error("Resposta inesperada da IA de desconto");
                      }
                    } catch (err: any) {
                      toast.error("Erro ao consultar IA de desconto: " + (err?.message || ""));
                    } finally {
                      setDescontoIaLoading(false);
                    }
                  }}
                >
                  {descontoIaLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <BrainCircuit className="h-3.5 w-3.5 mr-1" />}
                  {descontoIaLoading ? "Analisando..." : "Analisar Desconto com IA"}
                </Button>

                {descontoIaResult && (
                  <Card className={`rounded-none border-2 ${descontoIaResult.aprovado ? "border-success bg-success/5" : "border-destructive bg-destructive/5"}`}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        {descontoIaResult.aprovado ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        )}
                        <span className={`text-sm font-bold ${descontoIaResult.aprovado ? "text-success" : "text-destructive"}`}>
                          {descontoIaResult.aprovado ? "Desconto Aprovado pela IA" : "Desconto Rejeitado pela IA"}
                        </span>
                      </div>
                      {descontoIaResult.desconto_maximo > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Desconto máximo permitido: <strong>{descontoIaResult.desconto_maximo.toFixed(1)}%</strong>
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">{descontoIaResult.justificativa}</p>
                      {descontoIaResult.necessita_diretor && !descontoIaResult.aprovado && (
                        <div className="pt-1">
                          <ExcecaoButton
                            negociacaoId={deal.id}
                            tipoDefault="desconto_extra"
                            descontoSolicitado={maiorDesconto}
                            label={`Solicitar Exceção ao Diretor (${maiorDesconto.toFixed(1)}%)`}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })()}
        </div>

        {/* 1.3 + 1.6 — Análise IA unificada + Pedir Liberação na cotação */}
        {(() => {
          const precoPlano = precosReais.find((p: any) => (p.plano_normalizado || p.plano) === planoSelecionado);
          const mensalOriginal = precoPlano ? Number(precoPlano.cota) : Math.round(valorFipe * (planosConfig.find(p => p.nome === planoSelecionado)?.percentual || 0));
          const adesaoOriginal = precoPlano ? Number(precoPlano.adesao) : 400;
          const descMensalPct = descontoMensal && mensalOriginal > 0 ? ((mensalOriginal - Number(descontoMensal)) / mensalOriginal) * 100 : 0;
          const descAdesaoPct = descontoAdesao && adesaoOriginal > 0 ? ((adesaoOriginal - Number(descontoAdesao)) / adesaoOriginal) * 100 : 0;
          const maiorDesconto = Math.max(descMensalPct, descAdesaoPct);
          const dt = new Date().getDate();
          const diaPadrao = (dt >= 26 || dt <= 5) ? 1 : (dt >= 6 && dt <= 15) ? 10 : 20;
          const diaVenc = parseInt(form.diaVencimento) || diaPadrao;
          const vencimentoForaFaixa = diaVenc !== diaPadrao;
          const precisaAnalise = maiorDesconto > 5 || vencimentoForaFaixa;

          if (!precisaAnalise) return null;

          return (
            <div className="p-3 border-2 border-[#1A3A5C]/30 rounded bg-[#1A3A5C]/3 space-y-2">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-[#1A3A5C]" />
                <span className="text-sm font-bold text-[#1A3A5C]">Análise IA Necessária</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {maiorDesconto > 5 && <Badge className="rounded-none bg-amber-100 text-amber-700 text-[10px]">Desconto {maiorDesconto.toFixed(1)}%</Badge>}
                {vencimentoForaFaixa && <Badge className="rounded-none bg-blue-100 text-blue-700 text-[10px]">Vencimento dia {diaVenc} (padrão: {diaPadrao})</Badge>}
              </div>
              <PedirLiberacaoButton
                negociacaoId={deal.id}
                onSuccess={(res) => {
                  if (res?.aprovado) {
                    toast.success("Liberação aprovada! Desconto/vencimento liberados.");
                    if (maiorDesconto > 5) setDescontoIaResult({ aprovado: true, desconto_maximo: maiorDesconto, justificativa: res.justificativa || "Aprovado pela IA", necessita_diretor: false });
                  }
                }}
              />
            </div>
          );
        })()}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="sm" variant="outline" className="rounded-none border border-gray-300" onClick={() => handleEnviar("PDF")}>
            <Mail className="h-3.5 w-3.5 mr-1" />Enviar PDF
          </Button>
          <Button size="sm" variant="outline" className="rounded-none border border-gray-300" onClick={() => handleEnviar("Link")}>
            <Link2 className="h-3.5 w-3.5 mr-1" />Enviar Link
          </Button>
          <Button size="sm" className="rounded-none bg-success hover:bg-success/90 text-white" onClick={() => handleEnviar("WhatsApp")}>
            <MessageSquare className="h-3.5 w-3.5 mr-1" />Enviar WhatsApp
          </Button>
          <Button size="sm" className="rounded-none bg-[#1A3A5C] hover:bg-[#15304D] text-white" onClick={() => toast.success("Link de pagamento gerado!")}>
            <CreditCard className="h-3.5 w-3.5 mr-1" />Enviar Link de Pagamento
          </Button>
        </div>
      </fieldset>
    </div>
  );
}
