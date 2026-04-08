import React, { useState, useMemo, useCallback, useEffect } from "react";
import { PUBLIC_DOMAIN } from "@/lib/constants";
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
import OpcionaisSection, { OpcionalItem } from "@/components/OpcionaisSection";

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

// Mapa de tipo de veículo para filtro na tabela_precos
const TIPO_VEICULO_MAP: Record<string, string[]> = {
  "Automóvel": ["Carros e Utilitários Pequenos"],
  "Motocicleta": ["Motos"],
  "Caminhão": ["Pesados e Vans"],
  "Van/Utilitário": ["Pesados e Vans"],
};

interface Props { deal: PipelineDeal; onUpdate?: () => void; }

export default function CotacaoTab({ deal, onUpdate }: Props) {
  // Inferir marca do modelo do deal
  const dealModelo = (deal.veiculo_modelo || "").toUpperCase();
  const inferredMarca = marcas.find(m => dealModelo.includes(m.toUpperCase())) || "";

  const [marca, setMarca] = useState(inferredMarca);
  const [marcaReal, setMarcaReal] = useState(inferredMarca);
  const [modeloReal, setModeloReal] = useState(deal.veiculo_modelo || "");
  const [valorFipeReal, setValorFipeReal] = useState((deal as any).cache_fipe?.valorFipe || 0);
  const [codFipeReal, setCodFipeReal] = useState("");
  const [modeloIdx, setModeloIdx] = useState(0);

  // FIPE cascata
  const [fipeMarcasList, setFipeMarcasList] = useState<{ codigo: string; nome: string }[]>([]);
  const [fipeModelosList, setFipeModelosList] = useState<{ codigo: number; nome: string }[]>([]);
  const [fipeAnosList, setFipeAnosList] = useState<{ codigo: string; nome: string }[]>([]);
  const [fipeMarcaCod, setFipeMarcaCod] = useState("");
  const [fipeModeloCod, setFipeModeloCod] = useState("");
  const [fipeAnoCod, setFipeAnoCod] = useState("");

  // Detectar tipo do veículo (sugestão inicial, usuário deve confirmar)
  const detectTipo = () => {
    const m = dealModelo.toLowerCase();
    const p = ((deal as any).plano || "").toLowerCase();
    const motos = ["cg ", "cb ", "xre", "pcx", "nmax", "fazer", "twister", "titan", "fan ", "biz", "bros", "lander", "mt-", "yzf", "ninja", "duke", "moto", "honda cg", "yamaha", "suzuki", "dafra", "shineray", "haojue", "kasinski", "traxx", "kawasaki", "bmw gs", "bmw r", "harley", "triumph", "royal enfield", "pop ", "sahara", "crosser", "tenere", "burgman", "neo ", "fluo", "factor", "ybr"];
    const pesados = ["scania", "volvo fh", "iveco", "man ", "daf", "sprinter", "daily", "accelo", "cargo", "worker", "constellation", "pesado", "van", "vuc", "caminhão", "caminhao", "ônibus", "onibus", "micro-ônibus", "tector", "atego", "axor", "actros", "delivery", "volkswagen 24", "volkswagen 17", "volkswagen 13", "volkswagen 11", "volkswagen 8", "ford f-4000", "ford f-350"];
    if (motos.some(x => m.includes(x)) || p.includes("moto")) return "Motocicleta";
    if (pesados.some(x => m.includes(x)) || p.includes("pesado") || p.includes("van")) return "Caminhão";
    return "Automóvel";
  };

  const d = deal as any;
  const [tipoConfirmado, setTipoConfirmado] = useState(true);
  const [form, setForm] = useState({
    tipoVeiculo: d.tipo_veiculo || detectTipo(),
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
  const descontoAplicadoRef = React.useRef(false);
  const [valorInstalacaoEdit, setValorInstalacaoEdit] = useState("");
  const [opcionaisSelecionados, setOpcionaisSelecionados] = useState<OpcionalItem[]>([]);
  const [fipeCandidatos, setFipeCandidatos] = useState<any[]>([]);

  // Implementos / Agregados
  const [implementosCatalogo, setImplementosCatalogo] = useState<{ id: string; nome: string }[]>([]);
  const [implementoSelecionado, setImplementoSelecionado] = useState("");
  const [implementoValorDeclarado, setImplementoValorDeclarado] = useState("");
  const [implementoCotaAdicional, setImplementoCotaAdicional] = useState(0);

  React.useEffect(() => {
    supabase.from("implementos_catalogo" as any).select("id, nome").eq("ativo", true).order("ordem")
      .then(({ data }: any) => setImplementosCatalogo(data || []));
  }, []);

  // Buscar cota do agregado quando valor declarado muda
  const calcularCotaAgregado = async (valorDeclarado: number) => {
    if (valorDeclarado <= 0) { setImplementoCotaAdicional(0); return; }
    const regionalPrecos = await buscarRegionalPrecos(form.estadoCirc || "", form.cidadeCirc || "");
    const { data } = await supabase.from("tabela_precos" as any)
      .select("cota, regional_normalizado")
      .ilike("plano_normalizado", "%agregado%")
      .lte("valor_menor", valorDeclarado)
      .gte("valor_maior", valorDeclarado);
    if (data && data.length > 0) {
      // Prioridade: regional específica, senão qualquer
      const match = regionalPrecos
        ? (data as any[]).find((d: any) => (d.regional_normalizado || "").toUpperCase() === regionalPrecos.toUpperCase())
        : null;
      setImplementoCotaAdicional(Number((match || data[0] as any).cota) || 0);
    } else {
      setImplementoCotaAdicional(0);
    }
  };

  // Carregar opcionais salvos
  React.useEffect(() => {
    if (!deal.id || deal.id.startsWith("p")) return;
    (supabase as any).from("negociacao_opcionais").select("*, opcionais_catalogo(nome, categoria)")
      .eq("negociacao_id", deal.id)
      .then(({ data }: any) => {
        if (data && data.length > 0) {
          setOpcionaisSelecionados(data.map((d: any) => ({
            opcional_id: d.opcional_id, nome: d.opcionais_catalogo?.nome || "", categoria: d.opcionais_catalogo?.categoria || "", valor_mensal: Number(d.valor_mensal),
          })));
        }
      });
  }, [deal.id]);

  const handleOpcionaisChange = async (selected: OpcionalItem[]) => {
    setOpcionaisSelecionados(selected);
    if (!deal.id || deal.id.startsWith("p")) return;
    await (supabase as any).from("negociacao_opcionais").delete().eq("negociacao_id", deal.id);
    if (selected.length > 0) {
      await (supabase as any).from("negociacao_opcionais").insert(
        selected.map(s => ({ negociacao_id: deal.id, opcional_id: s.opcional_id, valor_mensal: s.valor_mensal }))
      );
    }
  };

  const totalOpcionais = opcionaisSelecionados.reduce((s, o) => s + o.valor_mensal, 0) + implementoCotaAdicional;
  const [linkCotacao, setLinkCotacao] = useState("");
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
    // Check 1: stage avançado indica cotação já enviada (em_negociacao = cotação já foi feita)
    const stagesPosCotacao = ["em_negociacao", "aguardando_vistoria", "vistoria_aprovada", "em_contratacao", "liberado_cadastro", "concluido"];
    if (stagesPosCotacao.includes(deal.stage)) {
      setCotacaoEnviada(true);
      return;
    }
    // Check 2: cotacao_id ou cache_precos = cotação já existe
    if ((deal as any).cotacao_id || (deal as any).cache_precos) {
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

  // Ordem de relevância para coberturas
  const ORDEM_COBERTURAS: Record<string, number> = {
    "colisão": 1, "colisao": 1, "incêndio": 2, "incendio": 2, "roubo": 3, "furto": 4,
    "perda total": 5, "assistência 24h": 6, "assistencia 24h": 6, "carro reserva": 7,
    "vidros": 8, "faróis": 9, "farois": 9, "terceiros": 10, "reboque": 11,
    "chaveiro": 12, "hospedagem": 13, "app": 14, "rastreador": 15,
  };
  const ordemCobertura = (nome: string) => {
    const n = nome.toLowerCase();
    for (const [key, val] of Object.entries(ORDEM_COBERTURAS)) {
      if (n.includes(key)) return val;
    }
    return 50;
  };

  // Buscar coberturas ao selecionar plano (match exato → normalizado → ILIKE) + deduplicar + ordenar
  const carregarCoberturas = async (plano: string) => {
    let result: any[] = [];
    // 1. Match exato
    const { data } = await supabase.from("coberturas_plano" as any).select("*").eq("plano", plano).order("ordem");
    if (data && data.length > 0) { result = data; }
    else {
      // 2. Normalizado: remover "(Leves)", "(Pesados)", etc.
      const planoNorm = plano.replace(/\s*\(.*?\)\s*/g, "").trim();
      if (planoNorm !== plano) {
        const r2 = await supabase.from("coberturas_plano" as any).select("*").eq("plano", planoNorm).order("ordem");
        if (r2.data && r2.data.length > 0) { result = r2.data; }
      }
      if (result.length === 0) {
        const planoNorm = plano.replace(/\s*\(.*?\)\s*/g, "").trim();
        // 3. ILIKE — pegar só do primeiro plano que casa (evitar misturar planos)
        const r3 = await supabase.from("coberturas_plano" as any).select("*").ilike("plano", `%${planoNorm}%`).order("ordem");
        if (r3.data && r3.data.length > 0) {
          // Pegar só coberturas do PRIMEIRO plano encontrado
          const primeiroPlano = r3.data[0].plano;
          result = r3.data.filter((c: any) => c.plano === primeiroPlano);
        }
      }
    }
    // Deduplicar por nome de cobertura
    const seen = new Set<string>();
    const deduplicado = result.filter((c: any) => {
      const key = (c.cobertura || "").toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    // Ordenar por relevância
    deduplicado.sort((a: any, b: any) => ordemCobertura(a.cobertura) - ordemCobertura(b.cobertura));
    setCoberturasPlano(deduplicado);
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

  // Buscar regional de preços pela cidade/UF de circulação (via regional_cidades)
  const buscarRegionalPrecos = async (uf: string, cidade: string): Promise<string> => {
    // Buscar o municipio_id pela cidade + UF
    if (cidade) {
      const { data: mun } = await (supabase as any).from("municipios")
        .select("id")
        .eq("uf", uf)
        .ilike("nome", cidade)
        .limit(1)
        .maybeSingle();
      if (mun) {
        // Buscar a regional vinculada a essa cidade
        const { data: rc } = await (supabase as any).from("regional_cidades")
          .select("regional_id")
          .eq("municipio_id", mun.id)
          .limit(1)
          .maybeSingle();
        if (rc) return rc.regional_id;
      }
    }
    // Fallback: buscar qualquer cidade da UF para pegar a regional padrão do estado
    const { data: fallback } = await (supabase as any).from("regional_cidades")
      .select("regional_id, municipios!inner(uf)")
      .eq("municipios.uf", uf)
      .limit(1)
      .maybeSingle();
    return fallback ? fallback.regional_id : "";
  };

  // Buscar preços reais por valor FIPE + cod_fipe + cidade/UF circulação
  const carregarPrecos = async (vFipe: number, tipoVeiculo?: string, ufOverride?: string, cidadeOverride?: string) => {
    // Buscar regional pela cidade/UF de circulação
    const regionalId = await buscarRegionalPrecos(ufOverride || form.estadoCirc || "", cidadeOverride || form.cidadeCirc || "");

    // Se temos cod_fipe, consultar modelos_veiculo pra saber quais planos esse veículo aceita
    let planosPermitidos: string[] | null = null;
    if (codFipe) {
      const { data: modelo } = await supabase.from("modelos_veiculo" as any)
        .select("planos, tabela_precos, aceito")
        .eq("cod_fipe", codFipe)
        .eq("aceito", true)
        .maybeSingle();
      if (modelo) {
        planosPermitidos = (modelo.planos || "").split(",").map((p: string) => p.trim()).filter(Boolean);
      }
    }

    // Buscar faixas que cobrem este valor FIPE
    let query = supabase.from("tabela_precos" as any)
      .select("*")
      .lte("valor_menor", vFipe)
      .gte("valor_maior", vFipe);
    // Filtrar por tipo_veiculo mapeado
    const tipoReal = tipoVeiculo || form.tipoVeiculo;
    if (tipoReal && TIPO_VEICULO_MAP[tipoReal]) {
      query = query.in("tipo_veiculo", TIPO_VEICULO_MAP[tipoReal]);
    }
    if (regionalId) {
      query = query.eq("regional_id", regionalId);
    }
    const { data: todos } = await query.order("plano_normalizado");

    if (todos && todos.length > 0) {
      let resultado = todos;
      // Filtrar por planos que o veículo aceita (se temos cod_fipe)
      if (planosPermitidos && planosPermitidos.length > 0) {
        const filtered = resultado.filter((t: any) => {
          const plano = (t.plano_normalizado || t.plano || "").toLowerCase();
          return planosPermitidos!.some(pp => plano.includes(pp.toLowerCase()) || pp.toLowerCase().includes(plano));
        });
        if (filtered.length > 0) resultado = filtered;
      }
      // Deduplicar: 1 faixa por plano (menor range FIPE; se range igual, maior cota)
      const planoMap = new Map<string, any>();
      for (const r of resultado) {
        const nome = r.plano_normalizado || r.plano;
        const existing = planoMap.get(nome);
        const range = Number(r.valor_maior) - Number(r.valor_menor);
        const existingRange = existing ? Number(existing.valor_maior) - Number(existing.valor_menor) : Infinity;
        if (!existing || range < existingRange || (range === existingRange && Number(r.cota) > Number(existing.cota))) {
          planoMap.set(nome, r);
        }
      }
      const resultadoDedup = Array.from(planoMap.values());
      setPrecosReais(resultadoDedup);
      // Auto-selecionar plano se nome atual não bate exatamente com os planos reais
      const nomesReais = [...new Set(resultadoDedup.map((p: any) => p.plano_normalizado || p.plano))];
      if (nomesReais.length > 0 && !nomesReais.includes(planoSelecionado)) {
        const match = nomesReais.find(n => n.startsWith(planoSelecionado) || planoSelecionado.startsWith(n));
        const novoPlano = match || nomesReais[0];
        setPlanoSelecionado(novoPlano);
        carregarCoberturas(novoPlano);
      }
      // Aplicar desconto aprovado pelo diretor (só uma vez)
      if (!descontoAplicadoRef.current) {
        const pct = Number((deal as any).desconto_percentual || 0);
        if (pct > 0 && (deal as any).desconto_aprovado_por) {
          const precoPlano = resultado.find((p: any) => (p.plano_normalizado || p.plano) === planoSelecionado);
          const mensalOriginal = precoPlano ? Number(precoPlano.cota) : 0;
          if (mensalOriginal > 0) {
            setDescontoMensal(String(Math.round(mensalOriginal * (1 - pct / 100))));
            descontoAplicadoRef.current = true;
          }
        }
      }
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

    // Função para aplicar desconto aprovado pelo diretor
    const aplicarDescontoDiretor = (precos: any[]) => {
      if (descontoAplicadoRef.current) return;
      const pct = Number((deal as any).desconto_percentual || 0);
      if (pct > 0 && (deal as any).desconto_aprovado_por) {
        const precoPlano = precos.find((p: any) => (p.plano_normalizado || p.plano) === planoSelecionado);
        const mensalOriginal = precoPlano ? Number(precoPlano.cota) : 0;
        if (mensalOriginal > 0) {
          setDescontoMensal(String(Math.round(mensalOriginal * (1 - pct / 100))));
          descontoAplicadoRef.current = true;
        }
      }
    };

    // Validar planos aceitos via modelos_veiculo (usado pelo cache)
    const validarPlanosCache = async (precos: any[]) => {
      const cf = (deal as any).cod_fipe || (deal as any).cache_fipe?.codFipe;
      if (!cf) return precos;
      const { data: modelo } = await supabase.from("modelos_veiculo" as any)
        .select("planos, aceito")
        .eq("cod_fipe", cf)
        .eq("aceito", true)
        .maybeSingle();
      if (!modelo) return precos;
      const permitidos = (modelo.planos || "").split(",").map((p: string) => p.trim()).filter(Boolean);
      if (permitidos.length === 0) return precos;
      const filtered = precos.filter((t: any) => {
        const plano = (t.plano_normalizado || t.plano || "").toLowerCase();
        return permitidos.some((pp: string) => plano.includes(pp.toLowerCase()) || pp.toLowerCase().includes(plano));
      });
      return filtered.length > 0 ? filtered : precos;
    };

    // 1. Cache de preços direto no deal (instantâneo, sem query)
    const cachePrecos = (deal as any).cache_precos;
    if (cachePrecos && Array.isArray(cachePrecos) && cachePrecos.length > 0) {
      validarPlanosCache(cachePrecos).then(validados => {
        setPrecosReais(validados);
        aplicarDescontoDiretor(validados);
        setFipeFetched(true);
        setPrecosCarregadosDaCotacao(true);
      });
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
            validarPlanosCache(negData.cache_precos).then(validados => {
              setPrecosReais(validados);
              if (negData.cache_fipe?.valorFipe) setValorFipeReal(negData.cache_fipe.valorFipe);
              setFipeFetched(true);
              setPrecosCarregadosDaCotacao(true);
            });
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
    // Se valorFipe é 0 mas existem candidatos FIPE, selecionar o melhor match e mostrar seletor
    if (!r.valorFipe && r.raw?.fipe?.dados?.length > 0) {
      setFipeCandidatos(r.raw.fipe.dados);
      const bestMatch = [...r.raw.fipe.dados].sort((a: any, b: any) => (b.score || 0) - (a.score || 0))[0];
      const valorStr = (bestMatch.texto_valor || "").replace(/[^\d,]/g, "").replace(",", ".");
      r.valorFipe = parseFloat(valorStr) || 0;
      r.codFipe = bestMatch.codigo_fipe || "";
    } else {
      setFipeCandidatos([]);
    }
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
      // Passar UF/cidade do deal para evitar stale closure
      const uf = (deal as any).estado_circulacao || d.estadoCirc || "";
      const cidade = (deal as any).cidade_circulacao || d.cidadeCirc || "";
      await carregarPrecos(vFipe, undefined, uf, cidade);
      carregarCoberturas(planoSelecionado);
    }
    verificarAceitacao(r.marca || "", r.modelo || "");
    setFipeLoading(false);
    setFipeFetched(true);
    setDadosReaisCarregados(true);

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
          setFipeFetched(true);
        }
      }).catch((e) => { console.error("Erro ao buscar placa:", e); setFipeLoading(false); setFipeFetched(true); });
    }
  }, [deal.veiculo_placa, dadosReaisCarregados, precosCarregadosDaCotacao, aplicarDadosFipe]);

  // planosConfig: usa preços reais se tiver, senão fallback default
  // Normaliza nomes de planos (remove espaços extras, parênteses duplos)
  const normPlanoNome = (n: string) => n.replace(/\s+/g, " ").replace(/\)\)/g, ")").replace(/\(\(/g, "(").trim();
  // Agrupa por plano normalizado para evitar duplicatas
  const planosConfig = precosReais.length > 0
    ? (() => {
        const seen = new Map<string, any>();
        for (const pr of precosReais) {
          const nome = normPlanoNome(pr.plano_normalizado || pr.plano);
          if (!seen.has(nome)) seen.set(nome, pr);
        }
        return [...seen.entries()].map(([planoNorm, p]) => ({
          nome: planoNorm,
          icon: planoNorm.includes("Premium") ? ShieldPlus : planoNorm.includes("Completo") ? ShieldCheck : planoNorm.includes("Objetivo") ? ShieldCheck : Shield,
          cor: planoNorm.includes("Premium") ? "border-warning/25 bg-warning/8" : planoNorm.includes("Completo") ? "border-success/20 bg-emerald-50" : planoNorm.includes("Objetivo") ? "border-blue-300 bg-blue-50" : "border-blue-200 bg-primary/6",
          percentual: 0,
          coberturas: [] as string[],
          valorReal: Number(p?.cota || 0),
          adesao: Number(p?.adesao || 0) || 400,
          rastreador: p?.rastreador || "Não",
          instalacao: Number(p?.instalacao || 0) || 100,
        }));
      })()
    : planosConfigDefault.map(p => ({ ...p, valorReal: 0, adesao: 400, rastreador: "Não", instalacao: 100 }));
  // Usar valor FIPE real da API
  const valorFipe = valorFipeReal;
  const codFipe = codFipeReal;

  // Desconto: livre em cards novos, bloqueado após cotação enviada (precisa IA >5% ou diretor)
  const descontoAprovadoPorDiretor = !!(deal as any).desconto_aprovado_por || !!(deal as any).desconto_ia_aprovado;
  const descontoBloqueado = cotacaoEnviada && !descontoIaResult?.aprovado && !descontoAprovadoPorDiretor;

  const set = (field: string, value: string | boolean) => setForm(prev => ({ ...prev, [field]: value }));

  const handleBaixarPdf = async () => {
    if (!planoSelecionado) { toast.error("Selecione um plano para baixar o PDF"); return; }
    // Garantir coberturas carregadas antes do PDF
    await carregarCoberturas(planoSelecionado);
    const precoPlano = precosReais.find((p: any) => (p.plano_normalizado || p.plano) === planoSelecionado);
    if (!precoPlano) {
      console.warn("[PDF] precoPlano não encontrado para:", planoSelecionado, "precosReais:", precosReais.map((p: any) => p.plano_normalizado || p.plano));
    }
    const mensalPlano = precoPlano ? Number(precoPlano.cota) : 0;
    const mensal = mensalPlano + totalOpcionais;
    const adesaoReal = precoPlano ? Number(precoPlano.adesao) : 400;
    if (coberturasPlano.length === 0) {
      toast.warning("Coberturas não encontradas para este plano. PDF será gerado sem detalhes de coberturas.");
    }
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
        adesao: descontoAdesao ? Number(descontoAdesao) : adesaoReal,
        adesaoOriginal: descontoAdesao ? adesaoReal : undefined,
        participacao: precoPlano ? (precoPlano.tipo_franquia === '%' ? `${precoPlano.valor_franquia}% FIPE` : `R$ ${Number(precoPlano.valor_franquia).toLocaleString("pt-BR", {minimumFractionDigits:2})}`) : "5% FIPE",
        rastreador: precoPlano?.rastreador || "Não",
        instalacao: precoPlano ? Number(precoPlano.instalacao || 0) : 0,
      },
      coberturas: coberturasPlano.length > 0
        ? coberturasPlano.map((c: any) => {
          const raw = c.valor ?? c.detalhe;
          const detalhe = (raw && raw !== "0" && raw !== "0,00" && raw !== "R$ 0,00" && Number(raw) !== 0) ? String(raw) : "";
          return { nome: c.cobertura, inclusa: c.inclusa, tipo: c.tipo, detalhe };
        })
        : (planosConfigDefault.find(p => planoSelecionado.includes(p.nome) || p.nome.includes(planoSelecionado))?.coberturas || ["Colisão", "Incêndio", "Roubo", "Furto", "Perda Total", "Assistência 24H"]).map(c => ({ nome: c, inclusa: true, tipo: "cobertura", detalhe: "" })),
      consultor: { nome: deal.consultor || "Consultor", telefone: "", email: "" },
      opcionais: [
        ...opcionaisSelecionados.map(o => ({ nome: o.nome, categoria: o.categoria, valor_mensal: o.valor_mensal })),
        ...(implementoCotaAdicional > 0 ? [{ nome: `${implementoSelecionado} (${formatCurrency(Number(implementoValorDeclarado))})`, categoria: "Implemento", valor_mensal: implementoCotaAdicional }] : []),
      ],
    });
    toast.success("PDF da cotação baixado!");
  };

  const handleEnviar = async (tipo: string) => {
    if (tipo === "PDF") {
      await handleBaixarPdf();
      // Auto-transição mesmo ao baixar PDF
      if (!deal.id || deal.id.startsWith("p")) return;
      try {
        const { data: negPdf } = await (supabase as any).from("negociacoes").select("stage").eq("id", deal.id).maybeSingle();
        const stagePdf = negPdf?.stage || deal.stage;
        if (stagePdf === "novo_lead" || stagePdf === "em_contato") {
          const { error: errUpd } = await (supabase as any).from("negociacoes").update({ stage: "em_negociacao", updated_at: new Date().toISOString() }).eq("id", deal.id);
          if (errUpd) { console.error("Erro ao mover stage:", errUpd); return; }
          await (supabase as any).from("pipeline_transicoes").insert({
            negociacao_id: deal.id, stage_anterior: stagePdf, stage_novo: "em_negociacao",
            motivo: "Cotação PDF baixada", automatica: true,
          }).then(({ error: e }: any) => e && console.error("Erro transição:", e));
          toast.info("Card movido para Em Negociação");
          onUpdate?.();
        }
      } catch (e) { console.error("Erro ao mover card:", e); }
      return;
    }
    if (!valorFipeReal || valorFipeReal <= 0) {
      toast.error("Valor FIPE não identificado. Selecione um modelo FIPE antes de enviar a cotação.");
      return;
    }
    if (precosReais.length === 0) {
      toast.error("Nenhum plano encontrado para este veículo. Verifique a tabela de preços.");
      return;
    }
    if (!form.tipoVeiculo) {
      toast.error("Selecione o Tipo do Veículo antes de enviar a cotação.");
      return;
    }
    if (!form.anoFab) {
      toast.error("Selecione o Ano do Veículo antes de enviar a cotação.");
      return;
    }
    if (!form.estadoCirc || !form.cidadeCirc.trim()) {
      toast.error("Preencha Estado e Cidade de Circulação antes de enviar a cotação.");
      return;
    }
    // Buscar regional pela cidade/estado de circulação (retorna regional_id)
    const regionalCot = await buscarRegionalPrecos(form.estadoCirc || "", form.cidadeCirc || "");

    // Criar cotação com planos filtrados pela regional
    const planosFiltrados = precosReais.length > 0
      ? precosReais.filter((p: any) => !regionalCot || p.regional_id === regionalCot)
      : precosReais;

    const { data: cotacao, error: errCot } = await supabase
      .from("cotacoes")
      .insert({
        negociacao_id: deal.id,
        cidade_circulacao: form.cidadeCirc,
        estado_circulacao: form.estadoCirc,
        regional_precos: regionalCot,
        todos_planos: await (async () => {
          if (planosFiltrados.length === 0) return [{ nome: planoSelecionado, valor_mensal: 0 }];
          // Buscar coberturas + produtos reais para snapshot
          const nomesPlanos = [...new Set(planosFiltrados.map((p: any) => p.plano_normalizado || p.plano))];
          const { data: cobSnap } = await supabase.from("coberturas_plano" as any).select("*").in("plano", nomesPlanos);
          const cobMap: Record<string, any[]> = {};
          if (cobSnap) (cobSnap as any[]).forEach((c: any) => {
            if (!cobMap[c.plano]) cobMap[c.plano] = [];
            const rawDet = c.valor ?? c.detalhe;
            const detFilt = (rawDet && rawDet !== "0" && rawDet !== "0,00" && rawDet !== "R$ 0,00" && Number(rawDet) !== 0) ? String(rawDet) : "";
            cobMap[c.plano].push({ cobertura: c.cobertura, tipo: c.tipo, inclusa: c.inclusa, detalhe: detFilt, ordem: c.ordem });
          });
          // Buscar nomes reais de produtos (grupo_produto_itens → produtos_gia)
          const { data: grupoItens } = await supabase.from("grupo_produto_itens" as any).select("grupo_produto, produto_id, produtos_gia(nome)").in("grupo_produto", nomesPlanos);
          const prodMap: Record<string, string[]> = {};
          if (grupoItens) (grupoItens as any[]).forEach((gi: any) => {
            if (!prodMap[gi.grupo_produto]) prodMap[gi.grupo_produto] = [];
            if (gi.produtos_gia?.nome) prodMap[gi.grupo_produto].push(gi.produtos_gia.nome);
          });
          // Deduplicar por nome do plano — cada plano aparece 1 vez no comparativo
          const seen = new Set<string>();
          const dedupPlanos: any[] = [];
          for (const p of planosFiltrados) {
            const nome = p.plano_normalizado || p.plano;
            if (seen.has(nome)) continue;
            seen.add(nome);
            dedupPlanos.push({ nome, valor_mensal: p.cota, adesao: p.adesao, rastreador: p.rastreador, franquia: p.valor_franquia, tipo_franquia: p.tipo_franquia, valor_fipe: valorFipe, implemento_valor: implementoCotaAdicional, coberturas: cobMap[nome] || [], produtos: prodMap[nome] || [] });
          }
          return dedupPlanos;
        })(),
        desconto_aplicado: 0,
      } as any)
      .select()
      .single();

    if (errCot) {
      toast.error("Erro ao salvar cotação: " + errCot.message);
      return;
    }
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
        onUpdate?.();
      }

      const linkPlanos = `${PUBLIC_DOMAIN}/cotacao/${cotId}`;
      setLinkCotacao(linkPlanos);
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
        onUpdate?.();
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
  }, [planoSelecionado, deal.regional, form.estadoCirc, form.cidadeCirc]);

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
            <p className="text-xs text-success">{marca} {modeloReal || deal.veiculo_modelo} — {formatCurrency(valorFipe)} — Ref. {new Date().toLocaleString("pt-BR", { month: "long", year: "numeric" })}</p>
          </div>
          <Badge className="bg-success text-white text-[10px]">Tabela FIPE</Badge>
        </div>
      )}

      {/* SEÇÃO 1 - DADOS DO VEÍCULO */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-[#1A3A5C] border-b-2 border-[#747474] pb-1 w-full">DADOS DO VEÍCULO</legend>
        <div className="grid grid-cols-3 gap-x-4 gap-y-3">
          <div className="space-y-1">
            <Label className={lbl}>Tipo do Veículo <span className="text-destructive">*</span></Label>
            <Select value={form.tipoVeiculo} onValueChange={v => { set("tipoVeiculo", v); setTipoConfirmado(true); if (valorFipe > 0) setTimeout(() => carregarPrecos(valorFipe, v), 100); }}>
              <SelectTrigger className={`rounded-none border ${!form.tipoVeiculo ? "border-destructive bg-destructive/5" : "border-gray-300"}`}>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>{tiposVeiculo.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            {!form.tipoVeiculo && <p className="text-[10px] text-destructive font-medium">Selecione o tipo antes de prosseguir</p>}
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
            <Select value={form.estadoCirc} onValueChange={v => { set("estadoCirc", v); set("cidadeCirc", ""); if (valorFipe > 0) setTimeout(() => carregarPrecos(valorFipe, undefined, v, ""), 100); }}>
              <SelectTrigger className="rounded-none border border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>{UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Cidade Circulação</Label>
            <Select value={form.cidadeCirc} onValueChange={v => { set("cidadeCirc", v); if (valorFipe > 0) setTimeout(() => carregarPrecos(valorFipe, undefined, form.estadoCirc, v), 100); }}>
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

              // Calcular proporcional: dias até o PRÓXIMO dia de vencimento a partir de hoje
              const hoje = new Date();
              const mesAtual = hoje.getMonth();
              const anoAtual = hoje.getFullYear();
              // Próximo vencimento: se dia ainda não passou este mês, é neste mês; senão, próximo mês
              let proxVenc = new Date(anoAtual, mesAtual, diaVenc);
              if (proxVenc.getTime() <= hoje.getTime()) {
                proxVenc = new Date(anoAtual, mesAtual + 1, diaVenc);
              }
              const diasAteVenc = Math.max(1, Math.round((proxVenc.getTime() - hoje.getTime()) / 86400000));
              const precoPlano = precosReais.find((p: any) => (p.plano_normalizado || p.plano) === planoSelecionado);
              if (!precoPlano) return null;
              const mensalidadePlano = Number(precoPlano.cota);
              const mensalidade = mensalidadePlano + totalOpcionais;
              const proporcional = Math.round((mensalidade / 30) * diasAteVenc * 100) / 100;

              const automatico = diasAteVenc > 40;
              return (
                <div className={`p-2 rounded border space-y-0.5 ${automatico ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50"}`}>
                  <p className={`text-[10px] font-semibold ${automatico ? "text-blue-800" : "text-amber-800"}`}>
                    {automatico ? `Proporcional obrigatório (${diasAteVenc} dias > 40)` : `Vencimento fora da faixa padrão (dia ${diaPadrao})`}
                  </p>
                  <p className="text-[10px] text-blue-800">1ª mensalidade proporcional: {formatCurrency(proporcional)} ({diasAteVenc} dias) — venc. {proxVenc.toLocaleDateString("pt-BR")}</p>
                  <p className="text-[10px] text-blue-700">Meses seguintes: {formatCurrency(mensalidade)}</p>
                  {!automatico && <p className="text-[10px] text-amber-600">Requer análise IA ou diretor</p>}
                  {automatico && <p className="text-[10px] text-green-700 font-medium">Aprovado automaticamente — sem necessidade de liberação</p>}
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

        {/* Implemento / Agregado — selecionável com valor declarado e cota automática */}
        {(form.tipoVeiculo === "Caminhão" || form.tipoVeiculo === "Van/Utilitário") && (
          <div className="p-3 border-2 border-blue-200 rounded bg-blue-50/50 space-y-3">
            <Label className="text-sm font-bold text-[#1A3A5C]">Implemento / Agregado</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Select value={implementoSelecionado} onValueChange={v => { setImplementoSelecionado(v === "__none__" ? "" : v); if (v === "__none__") { setImplementoValorDeclarado(""); setImplementoCotaAdicional(0); } set("implemento", v === "__none__" ? "" : v); }}>
                  <SelectTrigger className="rounded-none border border-gray-300"><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {implementosCatalogo.map(imp => <SelectItem key={imp.id} value={imp.nome}>{imp.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {implementoSelecionado && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Valor Declarado (R$)</Label>
                    <Input className="rounded-none border border-gray-300" type="number" placeholder="Ex: 35000" value={implementoValorDeclarado} onChange={e => { setImplementoValorDeclarado(e.target.value); const v = Number(e.target.value); if (v > 0) calcularCotaAgregado(v); else setImplementoCotaAdicional(0); }} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cota Adicional</Label>
                    <div className="h-9 flex items-center px-3 bg-white border border-gray-300 rounded-none">
                      {implementoCotaAdicional > 0 ? (
                        <span className="text-sm font-bold text-[#1A3A5C]">+ {formatCurrency(implementoCotaAdicional)}/mês</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">{implementoValorDeclarado ? "Sem tabela" : "Informe valor"}</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            {implementoCotaAdicional > 0 && (
              <p className="text-[10px] text-blue-700">
                {implementoSelecionado} — Valor declarado {formatCurrency(Number(implementoValorDeclarado))} → cota adicional {formatCurrency(implementoCotaAdicional)}/mês somada à mensalidade
              </p>
            )}
          </div>
        )}
        {(form.tipoVeiculo !== "Caminhão" && form.tipoVeiculo !== "Van/Utilitário") && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <Label className={lbl}>Implemento / Agregado (opcional)</Label>
              <Input className="rounded-none border border-gray-300" value={form.implemento} onChange={e => set("implemento", e.target.value)} placeholder="Ex: Baú, Guincho..." />
            </div>
          </div>
        )}
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
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-destructive">Veículo sem aceitação</p>
                <p className="text-xs text-muted-foreground">{motivoRejeicao}</p>
              </div>
              <ExcecaoButton
                negociacaoId={deal.id}
                tipoDefault="veiculo_bloqueado"
                label="Solicitar Liberação"
                onSuccess={() => { setVeiculoAceito(true); toast.success("Veículo liberado!"); }}
              />
            </CardContent>
          </Card>
        )}

        {fipeCandidatos.length > 0 && (
          <Card className="rounded-none border-2 border-warning/30 bg-warning/5">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-semibold text-warning">Modelo FIPE não identificado automaticamente</p>
              <p className="text-xs text-muted-foreground">Selecione o modelo mais próximo para usar o valor FIPE:</p>
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                {[...fipeCandidatos].sort((a: any, b: any) => (b.score || 0) - (a.score || 0)).map((c: any, i: number) => {
                  const valorStr = (c.texto_valor || "").replace(/[^\d,]/g, "").replace(",", ".");
                  const valor = parseFloat(valorStr) || 0;
                  const isSelected = codFipeReal === c.codigo_fipe;
                  return (
                    <button key={i} onClick={async () => {
                      setCodFipeReal(c.codigo_fipe || "");
                      setValorFipeReal(valor);
                      setFipeCandidatos([]);
                      const uf = (deal as any).estado_circulacao || form.estadoCirc || "";
                      const cidade = (deal as any).cidade_circulacao || form.cidadeCirc || "";
                      await carregarPrecos(valor, undefined, uf, cidade);
                      if (deal.id && !deal.id.startsWith("p")) {
                        supabase.from("negociacoes").update({ cache_fipe: { ...(deal as any).cache_fipe, valorFipe: valor, codFipe: c.codigo_fipe } } as any).eq("id", deal.id);
                      }
                    }} className={`w-full text-left p-2 rounded text-xs border transition-colors ${isSelected ? "border-primary bg-primary/10 font-semibold" : "border-border hover:bg-muted/50"}`}>
                      <span className="font-medium">{c.texto_modelo}</span>
                      <span className="ml-2 text-muted-foreground">({c.ano_modelo} · {c.sigla_combustivel})</span>
                      <span className="float-right font-semibold">{c.texto_valor}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {fipeFetched && valorFipeReal <= 0 && fipeCandidatos.length === 0 && (
          <Card className="rounded-none border-2 border-destructive/30 bg-destructive/5">
            <CardContent className="p-6 text-center space-y-2">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-sm font-semibold text-destructive">Veículo não identificado na tabela FIPE</p>
              <p className="text-xs text-muted-foreground">Não foi possível encontrar este veículo na tabela FIPE. A cotação está bloqueada até que o valor FIPE seja identificado.</p>
              <p className="text-xs text-muted-foreground">Verifique a placa ou consulte o gestor para liberação manual.</p>
            </CardContent>
          </Card>
        )}

        {fipeFetched && valorFipeReal > 0 && precosReais.length === 0 && fipeCandidatos.length === 0 && (
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

        <div className="space-y-3" style={{ display: precosReais.length === 0 && !fipeFetched ? "none" : undefined }}>
          {/* Select dropdown de planos */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-semibold">Selecione o Plano</Label>
              <Select value={planoSelecionado} onValueChange={v => { setPlanoSelecionado(v); carregarCoberturas(v); }}>
                <SelectTrigger className="rounded-none border-2 border-[#1A3A5C]/40 font-semibold">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {planosConfig.map(p => {
                    const mensal = (p as any).valorReal > 0 ? (p as any).valorReal : 0;
                    const totalComOpc = mensal + totalOpcionais;
                    const precoReal = precosReais.find((pr: any) => (pr.plano_normalizado || pr.plano) === p.nome);
                    return (
                      <SelectItem key={p.nome} value={p.nome}>
                        <span>{p.nome} — {formatCurrency(totalComOpc)}/mês</span>
                        {precoReal?.tipo_franquia && (
                          <span className="text-[10px] text-muted-foreground ml-2">
                            (Participação: {precoReal.tipo_franquia === '%'
                              ? `${precoReal.valor_franquia}% FIPE (${formatCurrency(valorFipe * Number(precoReal.valor_franquia) / 100)})`
                              : `R$ ${Number(precoReal.valor_franquia).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`})
                          </span>
                        )}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Card expandido do plano selecionado */}
            {(() => {
              const p = planosConfig.find(pl => pl.nome === planoSelecionado || planoSelecionado.startsWith(pl.nome) || pl.nome.startsWith(planoSelecionado));
              if (!p) return null;
              const mensal = (p as any).valorReal > 0 ? (p as any).valorReal : 0;
              if (fipeFetched && precosReais.length === 0) return null;
              const pctDesc = Number((deal as any).desconto_percentual || 0);
              const temDesconto = pctDesc > 0 && descontoAprovadoPorDiretor && mensal > 0;
              const mensalComDesconto = temDesconto ? Math.round(mensal * (1 - pctDesc / 100)) : mensal;
              const mensalBase = temDesconto ? mensalComDesconto : mensal;
              const totalComOpc = mensalBase + totalOpcionais;
              const pontualidade15 = Math.round(totalComOpc * 0.85);

              return (
                <Card className="rounded-none border-2 border-[#1A3A5C] ring-2 ring-[#1A3A5C]/20">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center gap-2">
                      <p.icon className="h-5 w-5 text-[#1A3A5C]" />
                      <CardTitle className="text-sm">{p.nome}</CardTitle>
                      <CheckCircle className="h-4 w-4 text-[#1A3A5C] ml-auto" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    <div>
                      {temDesconto && <div className="text-sm line-through text-muted-foreground">{formatCurrency(mensal + totalOpcionais)}</div>}
                      <div className={`text-2xl font-bold ${temDesconto ? "text-green-600" : "text-[#1A3A5C]"}`}>
                        {formatCurrency(totalComOpc)}<span className="text-xs font-normal text-muted-foreground">/mês</span>
                        {temDesconto && <span className="text-xs text-green-600 ml-1">-{pctDesc}%</span>}
                      </div>
                      {totalOpcionais > 0 && (
                        <div className="text-xs text-muted-foreground mt-1 p-2 rounded bg-emerald-50 border border-emerald-200">
                          Plano <strong>{formatCurrency(mensalBase)}</strong> + Serviços <strong>{formatCurrency(totalOpcionais)}</strong> = <strong className="text-[#1A3A5C]">{formatCurrency(totalComOpc)}/mês</strong>
                        </div>
                      )}
                      {totalComOpc > 0 && <div className="text-[10px] text-emerald-600 font-medium mt-1">15% pontualidade: {formatCurrency(pontualidade15)}/mês se pagar em dia</div>}
                    </div>
                    <div className="text-xs text-muted-foreground">Adesão: <span className="font-semibold text-[#1A3A5C]">{formatCurrency((p as any).adesao || 400)}</span></div>
                    {(() => {
                      const precoPlano = precosReais.find((pr: any) => (pr.plano_normalizado || pr.plano) === planoSelecionado);
                      if (!precoPlano?.tipo_franquia) return null;
                      return (
                        <div className="text-xs text-muted-foreground">
                          Participação: <span className="font-semibold text-[#1A3A5C]">
                            {precoPlano.tipo_franquia === '%'
                              ? `${precoPlano.valor_franquia}% FIPE (${formatCurrency(valorFipe * Number(precoPlano.valor_franquia) / 100)})`
                              : formatCurrency(Number(precoPlano.valor_franquia))}
                          </span>
                        </div>
                      );
                    })()}
                    <div className="flex items-center gap-1 p-1.5 rounded border border-amber-300 bg-amber-50">
                      <span className="text-[10px] text-amber-800 font-medium">Instalação Rastreador: R$</span>
                      <input type="number" className="w-16 text-[10px] border border-amber-300 rounded px-1 py-0.5 bg-white font-semibold" value={valorInstalacaoEdit || String((p as any).instalacao || 100)} onChange={e => setValorInstalacaoEdit(e.target.value)} onClick={e => e.stopPropagation()} />
                    </div>
                    {coberturasPlano.length > 0 && (
                      <ul className="space-y-1">
                        {coberturasPlano.filter((c: any) => c.inclusa).map((c: any) => (
                          <li key={c.cobertura} className="text-[11px] text-muted-foreground flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-success mt-0.5 shrink-0" />{c.cobertura}{(() => { const v = c.valor ?? c.detalhe; return (v && v !== "0" && v !== "R$ 0,00" && v !== "0,00" && Number(v) !== 0) ? ` — ${v}` : ""; })()}
                          </li>
                        ))}
                      </ul>
                    )}
                    {coberturasPlano.length === 0 && p.coberturas.length > 0 && (
                      <ul className="space-y-1">
                        {p.coberturas.map(c => (
                          <li key={c} className="text-[11px] text-muted-foreground flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-success mt-0.5 shrink-0" />{c}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1 flex-wrap">
          <span className="text-sm text-muted-foreground">Plano selecionado:</span>
          <Badge className="rounded-none bg-[#1A3A5C] text-white">{planoSelecionado}</Badge>
          {(() => {
            const pl = planosConfig.find(p => p.nome === planoSelecionado || planoSelecionado.startsWith(p.nome) || p.nome.startsWith(planoSelecionado));
            const mensalVal = (pl as any)?.valorReal > 0 ? (pl as any).valorReal : 0;
            const instVal = valorInstalacaoEdit ? Number(valorInstalacaoEdit) : ((pl as any)?.instalacao || 100);
            const mensalidadeTotal = mensalVal + totalOpcionais;
            const adesaoVal = (pl as any)?.adesao || 400;
            return (
              <>
                <span className="text-sm font-semibold">{formatCurrency(mensalidadeTotal)}/mês</span>
                {totalOpcionais > 0 && <span className="text-[10px] text-muted-foreground">(plano {formatCurrency(mensalVal)} + serviços {formatCurrency(totalOpcionais)})</span>}
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
          {descontoBloqueado && (
            <div className="flex items-center gap-2 p-2 rounded border border-amber-300 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700 font-medium">Cotação já enviada. Use "Pedir Liberação" abaixo para alterar desconto.</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Desconto Mensalidade (valor final c/ serviços)</Label>
              <Input className={`rounded-none border border-gray-300 ${descontoBloqueado ? "bg-muted opacity-60" : ""}`} type="number" placeholder={totalOpcionais > 0 ? `Sem desconto = ${(() => { const pl = planosConfig.find(p => p.nome === planoSelecionado); const mv = (pl as any)?.valorReal > 0 ? (pl as any).valorReal : 0; return formatCurrency(mv + totalOpcionais); })()}` : "Deixe vazio = sem desconto"} value={descontoMensal} disabled={descontoBloqueado} onChange={e => { setDescontoMensal(e.target.value); setDescontoIaResult(null); }} />
              <p className="text-[10px] text-muted-foreground">Valor final já inclui plano + serviços. Se preencher, o PDF mostrará desconto.</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Valor Adesão (editável)</Label>
              <Input className="rounded-none border border-gray-300" type="number" placeholder="Deixe vazio = valor padrão da tabela" value={descontoAdesao} onChange={e => { setDescontoAdesao(e.target.value); setDescontoIaResult(null); }} />
              <p className="text-[10px] text-muted-foreground">Se preenchido, o PDF usará este valor. Vazio = valor da tabela de preços</p>
            </div>
          </div>

          {/* IA Desconto — análise automática para descontos > 5% */}
          {(() => {
            const precoPlano = precosReais.find((p: any) => (p.plano_normalizado || p.plano) === planoSelecionado);
            const mensalPlanoOnly = precoPlano ? Number(precoPlano.cota) : 0;
            const mensalOriginal = mensalPlanoOnly + totalOpcionais;
            const descMensalPct = descontoMensal && mensalOriginal > 0 ? ((mensalOriginal - Number(descontoMensal)) / mensalOriginal) * 100 : 0;
            const maiorDesconto = descMensalPct;
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
          const mensalPlanoOnly2 = precoPlano ? Number(precoPlano.cota) : 0;
          const mensalOriginal = mensalPlanoOnly2 + totalOpcionais;
          const descMensalPct = descontoMensal && mensalOriginal > 0 ? ((mensalOriginal - Number(descontoMensal)) / mensalOriginal) * 100 : 0;
          const maiorDesconto = descMensalPct;
          const dt = new Date().getDate();
          const diaPadrao = (dt >= 26 || dt <= 5) ? 1 : (dt >= 6 && dt <= 15) ? 10 : 20;
          const diaVenc = parseInt(form.diaVencimento) || diaPadrao;
          const hoje2 = new Date();
          const mesAt2 = hoje2.getMonth();
          const anoAt2 = hoje2.getFullYear();
          // Primeiro vencimento = dia escolhido no MÊS SEGUINTE
          let proxVenc2 = new Date(anoAt2, mesAt2, diaVenc);
          if (proxVenc2.getTime() <= hoje2.getTime()) proxVenc2 = new Date(anoAt2, mesAt2 + 1, diaVenc);
          const diasAteVenc2 = Math.max(1, Math.round((proxVenc2.getTime() - hoje2.getTime()) / 86400000));
          const vencimentoForaFaixa = diaVenc !== diaPadrao;
          const vencimentoPrecisaIA = vencimentoForaFaixa && diasAteVenc2 <= 40;
          const precisaAnalise = maiorDesconto > 5 || vencimentoPrecisaIA;
          const mostrarLiberacao = precisaAnalise || cotacaoEnviada;

          if (!mostrarLiberacao) return null;

          return (
            <div className="p-3 border-2 border-[#1A3A5C]/30 rounded bg-[#1A3A5C]/3 space-y-2">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-[#1A3A5C]" />
                <span className="text-sm font-bold text-[#1A3A5C]">{precisaAnalise ? "Análise IA Necessária" : "Pedir Liberação"}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {maiorDesconto > 5 && <Badge className="rounded-none bg-amber-100 text-amber-700 text-[10px]">Desconto {maiorDesconto.toFixed(1)}%</Badge>}
                {vencimentoPrecisaIA && <Badge className="rounded-none bg-blue-100 text-blue-700 text-[10px]">Vencimento dia {diaVenc} (padrão: {diaPadrao})</Badge>}
                {cotacaoEnviada && !precisaAnalise && <Badge className="rounded-none bg-gray-100 text-gray-700 text-[10px]">Cotação já enviada — alterar desconto</Badge>}
              </div>
              <PedirLiberacaoButton
                negociacaoId={deal.id}
                onSuccess={(res) => {
                  if (res?.aprovado) {
                    setCotacaoEnviada(false); // Desbloquear desconto após aprovação
                    toast.success("Liberação aprovada! Desconto liberado.");
                    if (maiorDesconto > 5) setDescontoIaResult({ aprovado: true, desconto_maximo: maiorDesconto, justificativa: res.justificativa || "Aprovado pela IA", necessita_diretor: false });
                  }
                }}
              />
            </div>
          );
        })()}

        {/* COBERTURAS OPCIONAIS */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-[#1A3A5C] border-b-2 border-[#747474] pb-1 w-full">COBERTURAS OPCIONAIS</legend>
          <OpcionaisSection
            negociacaoId={deal.id}
            tipoVeiculo={form.tipoVeiculo}
            plano={planoSelecionado}
            selected={opcionaisSelecionados}
            onChange={handleOpcionaisChange}
          />
          {totalOpcionais > 0 && (
            <div className="flex items-center gap-2 p-2 rounded border border-emerald-300 bg-emerald-50">
              <span className="text-sm font-semibold text-emerald-800">Total serviços: {formatCurrency(totalOpcionais)}/mês</span>
              <span className="text-xs text-emerald-600">({opcionaisSelecionados.length} item{opcionaisSelecionados.length > 1 ? "s" : ""})</span>
            </div>
          )}
        </fieldset>

        {!(deal as any).email && (
          <div className="flex items-center gap-2 p-2 rounded border border-amber-300 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700 font-medium">Sem email — cotação será enviada apenas por link/WhatsApp. Preencha na aba Associado para enviar por e-mail também.</p>
          </div>
        )}
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

        {/* Card com link visível após envio */}
        {linkCotacao && (
          <Card className="rounded-none border-2 border-emerald-300 bg-emerald-50">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-emerald-700" />
                <span className="text-sm font-bold text-emerald-800">Link da Cotação</span>
              </div>
              <a href={linkCotacao} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline break-all">{linkCotacao}</a>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="rounded-none border-emerald-300 text-emerald-700 text-xs h-7" onClick={() => { navigator.clipboard.writeText(linkCotacao); toast.success("Link copiado!"); }}>
                  Copiar Link
                </Button>
                <Button size="sm" variant="outline" className="rounded-none border-emerald-300 text-emerald-700 text-xs h-7" onClick={() => window.open(linkCotacao, "_blank")}>
                  Abrir
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </fieldset>
    </div>
  );
}
