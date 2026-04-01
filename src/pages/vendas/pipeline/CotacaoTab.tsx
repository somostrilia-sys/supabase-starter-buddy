import React, { useState, useMemo, useCallback } from "react";
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
import { MessageSquare, Mail, Link2, CreditCard, CheckCircle, Shield, ShieldCheck, ShieldPlus, Search, Loader2, Car } from "lucide-react";

/* ─── FIPE mock data ─── */
const marcas = ["Chevrolet", "Hyundai", "Honda", "Toyota", "Volkswagen", "Fiat", "Jeep", "Nissan", "Renault", "Ford"];

const modelosPorMarca: Record<string, { modelo: string; codFipe: string; valorFipe: number }[]> = {
  Chevrolet: [
    { modelo: "Onix Plus 1.0 Turbo", codFipe: "015267-0", valorFipe: 95000 },
    { modelo: "Tracker Premier 1.2T", codFipe: "015312-9", valorFipe: 142000 },
    { modelo: "S10 High Country 2.8", codFipe: "015401-0", valorFipe: 265000 },
  ],
  Hyundai: [
    { modelo: "HB20 1.0 Comfort", codFipe: "037101-4", valorFipe: 82000 },
    { modelo: "Creta Ultimate 2.0", codFipe: "037205-3", valorFipe: 158000 },
  ],
  Honda: [
    { modelo: "Civic EXL 2.0", codFipe: "021176-0", valorFipe: 135000 },
    { modelo: "HR-V EXL", codFipe: "021190-6", valorFipe: 155000 },
  ],
  Toyota: [
    { modelo: "Corolla XEi 2.0", codFipe: "059210-1", valorFipe: 148000 },
    { modelo: "Corolla Cross XRE", codFipe: "059222-5", valorFipe: 170000 },
  ],
  Volkswagen: [
    { modelo: "Polo Highline 1.0 TSI", codFipe: "005580-2", valorFipe: 98000 },
    { modelo: "T-Cross Highline 1.4 TSI", codFipe: "005612-4", valorFipe: 145000 },
  ],
  Fiat: [
    { modelo: "Argo Drive 1.3", codFipe: "001423-8", valorFipe: 78000 },
    { modelo: "Pulse Impetus 1.0T", codFipe: "001440-8", valorFipe: 105000 },
  ],
  Jeep: [
    { modelo: "Compass Limited T270", codFipe: "064112-3", valorFipe: 185000 },
    { modelo: "Renegade Sport 1.3T", codFipe: "064095-0", valorFipe: 120000 },
  ],
  Nissan: [
    { modelo: "Kicks Advance", codFipe: "050030-2", valorFipe: 115000 },
  ],
  Renault: [
    { modelo: "Kwid Outsider 1.0", codFipe: "044015-9", valorFipe: 68000 },
  ],
  Ford: [
    { modelo: "Ranger Limited 3.0 V6", codFipe: "015780-0", valorFipe: 310000 },
  ],
};

/* ─── Mock plate → vehicle mapping for FIPE auto-lookup ─── */
const placaVeiculoMap: Record<string, { marca: string; modeloIdx: number; ano: string; cor: string; combustivel: string; chassi: string }> = {
  "ABC-1D23": { marca: "Honda", modeloIdx: 0, ano: "2022", cor: "Prata", combustivel: "Flex", chassi: "9BWZZZ377VT004251" },
  "DEF-2G34": { marca: "Volkswagen", modeloIdx: 0, ano: "2023", cor: "Branco", combustivel: "Flex", chassi: "9BWAB45U5KT123456" },
  "GHI-3J45": { marca: "Fiat", modeloIdx: 0, ano: "2024", cor: "Vermelho", combustivel: "Flex", chassi: "9BD195227L0123456" },
  "JKL-4M56": { marca: "Toyota", modeloIdx: 0, ano: "2023", cor: "Preto", combustivel: "Flex", chassi: "9BR53ZEC5L1234567" },
  "MNO-5P67": { marca: "Hyundai", modeloIdx: 0, ano: "2024", cor: "Cinza", combustivel: "Flex", chassi: "9BHBG51DBLP123456" },
  "QRS-6T78": { marca: "Chevrolet", modeloIdx: 1, ano: "2024", cor: "Azul", combustivel: "Flex", chassi: "9BGKS48B0LG123456" },
  "UVW-7X89": { marca: "Jeep", modeloIdx: 0, ano: "2024", cor: "Branco", combustivel: "Flex", chassi: "9BFBXXLCALM123456" },
  "YZA-8B01": { marca: "Honda", modeloIdx: 1, ano: "2023", cor: "Prata", combustivel: "Flex", chassi: "93HRV850LLH123456" },
};

const cores = ["Branco", "Prata", "Preto", "Cinza", "Vermelho", "Azul", "Marrom"];
const cambios = ["Automático", "Manual", "CVT", "Automatizado"];
const combustiveis = ["Flex", "Gasolina", "Etanol", "Diesel", "Elétrico", "Híbrido"];
const tiposVeiculo = ["Automóvel", "Motocicleta", "Caminhão", "Van/Utilitário", "Ônibus"];

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];
const cidadesPorUF: Record<string, string[]> = {
  SP: ["São Paulo", "Campinas", "Ribeirão Preto", "Santos", "Sorocaba"],
  RJ: ["Rio de Janeiro", "Niterói", "Petrópolis"],
  MG: ["Belo Horizonte", "Uberlândia", "Contagem"],
  PR: ["Curitiba", "Londrina", "Maringá"],
  GO: ["Goiânia", "Anápolis"],
  DF: ["Brasília"],
};

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
  // Infer initial marca/modelo from deal (empty if not found in mock list)
  const inferredMarca = marcas.find(m => {
    const models = modelosPorMarca[m];
    return models?.some(mod => deal.veiculo_modelo?.includes(mod.modelo.split(" ")[0]));
  }) || "";

  const [marca, setMarca] = useState(inferredMarca);
  const [marcaReal, setMarcaReal] = useState(""); // marca vinda da API (pode não estar na lista mock)
  const [modeloReal, setModeloReal] = useState(""); // modelo vindo da API
  const [valorFipeReal, setValorFipeReal] = useState(0); // valor FIPE real da API
  const [codFipeReal, setCodFipeReal] = useState(""); // código FIPE real da API
  const [modeloIdx, setModeloIdx] = useState(0);
  const [form, setForm] = useState({
    tipoVeiculo: "Automóvel",
    placa: deal.veiculo_placa || "",
    chassi: "",
    renavam: "",
    anoFab: "",
    cor: "",
    cambio: "",
    combustivel: "",
    quilometragem: "",
    numMotor: "",
    estadoCirc: "",
    cidadeCirc: "",
    diaVencimento: (() => { const d = new Date().getDate(); if (d >= 26 || d <= 5) return "1"; if (d >= 6 && d <= 15) return "10"; return "20"; })(),
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

  // Buscar preços reais por valor FIPE + regional + tipo veículo
  const carregarPrecos = async (vFipe: number, tipoVeiculo?: string) => {
    // Mapear tipo do form para tipo_veiculo na tabela_precos
    const tipoMap: Record<string, string> = {
      "Automóvel": "Carros e Utilitários Pequenos",
      "Motocicleta": "Motos",
      "Caminhão": "Caminhões e Micro-Ônibus",
      "Van/Utilitário": "Carros e Utilitários Pequenos",
      "Ônibus": "Caminhões e Micro-Ônibus",
    };
    const tipoDb = tipoMap[tipoVeiculo || form.tipoVeiculo] || "Carros e Utilitários Pequenos";

    // Buscar faixas que cobrem este valor FIPE + tipo veículo
    let query = supabase.from("tabela_precos" as any)
      .select("*")
      .lte("valor_menor", vFipe)
      .gte("valor_maior", vFipe)
      .eq("tipo_veiculo", tipoDb)
      .order("plano_normalizado");

    const { data: todos } = await query;

    if (todos && todos.length > 0) {
      // Filtrar pela regional normalizada do deal
      const reg = (deal.regional || "").toUpperCase().trim();
      const filtered = todos.filter((t: any) => {
        const rn = (t.regional_normalizado || "").toUpperCase().trim();
        return rn === reg || reg.includes(rn) || rn.includes(reg) ||
          reg.replace("REGIONAL ", "").includes(rn.replace("REGIONAL ", "")) ||
          rn.replace("REGIONAL ", "").includes(reg.replace("REGIONAL ", ""));
      });
      setPrecosReais(filtered.length > 0 ? filtered : todos);
    } else {
      setPrecosReais([]);
    }
  };

  // Auto-carregar dados reais do veículo ao montar
  const [dadosReaisCarregados, setDadosReaisCarregados] = React.useState(false);
  React.useEffect(() => {
    if (dadosReaisCarregados) return;
    const placa = (deal.veiculo_placa || "").replace(/[^A-Z0-9]/gi, "");
    if (placa.length >= 7) {
      setFipeLoading(true);
      callEdge("gia-buscar-placa", { acao: "placa", placa }).then(res => {
        if (res.sucesso && res.resultado) {
          const r = res.resultado;
          // Guardar dados reais da API
          setMarcaReal(r.marca || "");
          setModeloReal(r.modelo || "");
          setValorFipeReal(r.valorFipe || 0);
          setCodFipeReal(r.codFipe || "");
          // Preencher form com dados reais
          setForm(prev => ({
            ...prev,
            placa: deal.veiculo_placa || prev.placa,
            chassi: r.chassi || "",
            renavam: r.renavam || "",
            anoFab: r.anoFabricacao || "",
            cor: r.cor || "",
            combustivel: r.combustivel || "",
          }));
          // Setar marca no select (se encontrar no mock) ou deixar marcaReal
          const matchMarca = marcas.find(m => (r.marca || "").toUpperCase().includes(m.toUpperCase()));
          if (matchMarca) setMarca(matchMarca);

          const vFipe = r.valorFipe || 0;
          if (vFipe > 0) {
            carregarPrecos(vFipe);
            carregarCoberturas(planoSelecionado);
          }
          verificarAceitacao(r.marca || "", r.modelo || "");
          setFipeLoading(false);
          setFipeFetched(true);
          setDadosReaisCarregados(true);
        } else {
          setFipeLoading(false);
        }
      }).catch(() => setFipeLoading(false));
    }
  }, [deal.veiculo_placa, dadosReaisCarregados]);

  const modelos = modelosPorMarca[marca] || [];
  const modeloAtual = modelos[modeloIdx] || modelos[0];

  // planosConfig: usa preços reais se tiver, senão fallback mock
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
          adesao: Number(p?.adesao || 0),
          rastreador: p?.rastreador || "Não",
        };
      })
    : planosConfigDefault.map(p => ({ ...p, valorReal: 0, adesao: 400, rastreador: "Não" }));
  // Usar valor FIPE real da API se disponível, senão do mock
  const valorFipe = valorFipeReal > 0 ? valorFipeReal : (modeloAtual?.valorFipe || 0);
  const codFipe = codFipeReal || (modeloAtual?.codFipe || "");

  const cidades = cidadesPorUF[form.estadoCirc] || [];

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
        veiculo: `${marca} ${modeloAtual?.modelo || deal.veiculo_modelo}`,
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
      },
      coberturas: coberturasPlano.map((c: any) => ({ nome: c.cobertura, inclusa: c.inclusa, tipo: c.tipo, detalhe: c.detalhe })),
      consultor: { nome: deal.consultor || "Consultor", telefone: "", email: "" },
    });
    toast.success("PDF da cotação baixado!");
  };

  const handleEnviar = async (tipo: string) => {
    if (tipo === "PDF") { handleBaixarPdf(); return; }
    // Criar cotação no banco se não existe
    const { data: cotacao } = await supabase
      .from("cotacoes")
      .insert({
        negociacao_id: deal.id,
        todos_planos: precosReais.length > 0
          ? precosReais.map((p: any) => ({ nome: p.plano, valor_mensal: p.cota, adesao: p.adesao, rastreador: p.rastreador, franquia: p.valor_franquia }))
          : [{ nome: planoSelecionado, valor_mensal: valorFipe * 0.015 }],
        desconto_aplicado: 0,
      } as any)
      .select()
      .single();

    if (cotacao) {
      await supabase.from("negociacoes").update({
        cotacao_id: (cotacao as any).id,
        updated_at: new Date().toISOString(),
      } as any).eq("id", deal.id);

      // Auto-transição: em_contato → em_negociacao
      if (deal.stage === "em_contato") {
        await supabase.from("negociacoes").update({ stage: "em_negociacao" } as any).eq("id", deal.id);
        await supabase.from("pipeline_transicoes").insert({
          negociacao_id: deal.id,
          stage_anterior: "em_contato",
          stage_novo: "em_negociacao",
          motivo: `Cotação enviada via ${tipo}`,
          automatica: true,
        } as any);
      }
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
    } catch { /* fallback to mock */ }

    // Fallback: mock
    const veiculo = placaVeiculoMap[placa];
    if (!veiculo) {
      setFipeLoading(false);
      toast.error("Placa não encontrada. Selecione marca/modelo manualmente.");
      return;
    }
    setMarca(veiculo.marca);
    setModeloIdx(veiculo.modeloIdx);
    setForm(prev => ({ ...prev, anoFab: veiculo.ano, cor: veiculo.cor, combustivel: veiculo.combustivel, chassi: veiculo.chassi }));
    const modelo = modelosPorMarca[veiculo.marca]?.[veiculo.modeloIdx];
    const vFipe = modelo?.valorFipe || 0;
    if (vFipe > 0) { await carregarPrecos(vFipe); await carregarCoberturas(planoSelecionado); }

    setFipeLoading(false);
    setFipeFetched(true);
    toast.success(`FIPE: ${veiculo.marca} ${modelo?.modelo || ""} — ${formatCurrency(vFipe)}`);
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
            <p className="text-xs text-success">{marca} {modeloAtual?.modelo} — {formatCurrency(valorFipe)} — Ref. Março/2026</p>
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
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
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
            <Input className="rounded-none" value={form.renavam} onChange={e => set("renavam", e.target.value.replace(/\D/g, "").slice(0, 11))} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Marca (FIPE)</Label>
            <Select value={marca} onValueChange={v => { setMarca(v); setModeloIdx(0); }}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>{marcas.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Modelo (FIPE)</Label>
            <Select value={String(modeloIdx)} onValueChange={v => setModeloIdx(Number(v))}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>{modelos.map((m, i) => <SelectItem key={i} value={String(i)}>{m.modelo}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Ano Fabricação</Label>
            <Select value={form.anoFab} onValueChange={v => set("anoFab", v)}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>{anosDisp.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
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
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>{cores.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Câmbio</Label>
            <Select value={form.cambio} onValueChange={v => set("cambio", v)}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>{cambios.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Combustível</Label>
            <Select value={form.combustivel} onValueChange={v => set("combustivel", v)}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>{combustiveis.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Quilometragem</Label>
            <Input className="rounded-none" type="number" value={form.quilometragem} onChange={e => set("quilometragem", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Nº do Motor</Label>
            <Input className="rounded-none font-mono text-xs" value={form.numMotor} onChange={e => set("numMotor", e.target.value.toUpperCase())} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Estado Circulação</Label>
            <Select value={form.estadoCirc} onValueChange={v => { set("estadoCirc", v); set("cidadeCirc", ""); }}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>{UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Cidade Circulação</Label>
            <Select value={form.cidadeCirc} onValueChange={v => set("cidadeCirc", v)}>
              <SelectTrigger className="rounded-none"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{cidades.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Dia Vencimento</Label>
            <Select value={form.diaVencimento} onValueChange={v => set("diaVencimento", v)}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Dia 1 (fechamento entre 26 e 05)</SelectItem>
                <SelectItem value="10">Dia 10 (fechamento entre 06 e 15)</SelectItem>
                <SelectItem value="20">Dia 20 (fechamento entre 16 e 25)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">Calculado automaticamente pela data de fechamento</p>
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
            <Input className="rounded-none" value={form.implemento} onChange={e => set("implemento", e.target.value)} placeholder="Ex: Baú, Guincho..." />
          </div>
        </div>
        <div className="space-y-1 pt-1">
          <Label className={lbl}>Observações no Termo (cliente vê)</Label>
          <Textarea className="rounded-none" rows={2} value={form.obsContrato} onChange={e => set("obsContrato", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className={lbl}>Observações Internas (somente equipe)</Label>
          <Textarea className="rounded-none" rows={2} value={form.obsInterna} onChange={e => set("obsInterna", e.target.value)} />
        </div>
      </fieldset>

      {/* FROTA - Adicionar veículo */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-bold text-[#1A3A5C] border-b-2 border-[#747474] pb-1 w-full">FROTA</legend>
        <p className="text-xs text-muted-foreground">Adicione mais veículos para cotação em frota.</p>
        <Button size="sm" variant="outline" className="rounded-none" onClick={async () => {
          await supabase.from("negociacao_veiculos" as any).insert({
            negociacao_id: deal.id,
            placa: form.placa,
            marca: marca,
            modelo: modeloAtual?.modelo || deal.veiculo_modelo,
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

        <div className="grid grid-cols-3 gap-3">
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

        <div className="flex items-center gap-3 pt-1">
          <span className="text-sm text-muted-foreground">Plano selecionado:</span>
          <Badge className="rounded-none bg-[#1A3A5C] text-white">{planoSelecionado}</Badge>
          <span className="text-sm font-semibold">
            {formatCurrency(Math.round(valorFipe * (planosConfig.find(p => p.nome === planoSelecionado)?.percentual || 0)))}/mês
          </span>
        </div>

        {/* Campos de desconto para a cotação */}
        <div className="grid grid-cols-2 gap-4 pt-2 p-3 border rounded bg-muted/20">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Desconto Mensalidade (valor final)</Label>
            <Input className="rounded-none" type="number" placeholder="Deixe vazio = sem desconto" value={descontoMensal} onChange={e => setDescontoMensal(e.target.value)} />
            <p className="text-[10px] text-muted-foreground">Se preenchido, o PDF mostrará o valor original riscado + este valor</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Desconto Adesão (valor final)</Label>
            <Input className="rounded-none" type="number" placeholder="Deixe vazio = sem desconto" value={descontoAdesao} onChange={e => setDescontoAdesao(e.target.value)} />
            <p className="text-[10px] text-muted-foreground">Se preenchido, o PDF mostrará o valor original riscado + este valor</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="sm" variant="outline" className="rounded-none" onClick={() => handleEnviar("PDF")}>
            <Mail className="h-3.5 w-3.5 mr-1" />Enviar PDF
          </Button>
          <Button size="sm" variant="outline" className="rounded-none" onClick={() => handleEnviar("Link")}>
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
