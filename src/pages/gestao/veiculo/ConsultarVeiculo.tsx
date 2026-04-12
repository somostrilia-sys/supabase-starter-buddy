import { useState, useEffect } from "react";
import { supabase, callEdge } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import PosVendaSection from "./PosVendaSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Search, Car, User, DollarSign, FileText, Clock, Eye, Pencil,
  ArrowLeft, Save, Upload, Trash2, Plus, Download, Printer,
  ChevronLeft, ChevronRight, Users, Package, ClipboardCheck,
  AlertTriangle, FileSignature, Phone as PhoneIcon, Calculator,
} from "lucide-react";

// ─── Types ───
interface Veiculo {
  id: string; nome: string; placa: string; chassi: string; idExterno: string;
  modelo: string; marca: string; anoFab: number; anoMod: number; cor: string;
  valorFipe: number; cota: string; combustivel: string; km: number;
  regional: string; cooperativa: string; tipoAdesao: string;
  dataCadastro: string; dataContrato: string; diaVenc: number;
  sitVeiculo: string; sitAssociado: string;
  associado_id?: string;
  condutores: { nome: string; cpf: string; cnh: string; dataNasc: string; situacao: string }[];
  lancamentos: { nTitulo: string; nBanco: string; tipo: string; banco: string; dtEmissao: string; dataVenc: string; dataPgto: string; valor: number; valorPago: number; parcela: string; nControle: string; status: string }[];
  agregados: { tipo: string; placa: string; cota: string; marcaModelo: string; valor: number; data: string; situacao: string }[];
  vistorias: { data: string; tipo: string; resultado: string; obs: string; usuario: string }[];
  documentos: { nome: string; tipo: string; data: string }[];
  observacoes: { data: string; descricao: string; usuario: string }[];
  fornecedores: { protocolo: string; fornecedor: string; produto: string; servico: string; motivo: string; situacao: string; dataAbertura: string; dataFechamento: string }[];
  contratos: { contrato: string; termo: string; status: string; ip: string; dataHoraEnvio: string; arquivo: string }[];
}

const calcIdade = (dn: string) => {
  const h = new Date(); const n = new Date(dn);
  let a = h.getFullYear() - n.getFullYear();
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) a--;
  return a;
};

const finBadge = (s: string) => {
  const m: Record<string,string> = { "Pago": "bg-success/10 text-success border-success/20", "Pendente": "bg-warning/10 text-warning border-warning/25", "Atrasado": "bg-destructive/8 text-destructive border-red-200" };
  return m[s] || "";
};

export default function ConsultarVeiculo() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ placa: "", chassi: "", idExterno: "", proprietario: "", idVeiculo: "", sitVeiculo: "Todos", sitAssociado: "Todos", cooperativa: "Todos", regional: "Todos" });
  const [results, setResults] = useState<Veiculo[]>([]);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Veiculo | null>(null);
  const { user } = useAuth();
  const [autoTab, setAutoTab] = useState<string | null>(null);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [condutorModal, setCondutorModal] = useState(false);
  const [newObs, setNewObs] = useState("");
  const [cooperativasList, setCooperativasList] = useState<{id: string; nome: string}[]>([]);
  const [regionaisList, setRegionaisList] = useState<{id: string; nome: string}[]>([]);
  const [contratoData, setContratoData] = useState<any>(null);
  const [cotacaoData, setCotacaoData] = useState<any>(null);

  // LAPS state
  const [lapsProdutosDisponiveis, setLapsProdutosDisponiveis] = useState<any[]>([]);
  const [lapsVeiculoProdutos, setLapsVeiculoProdutos] = useState<any[]>([]);
  const [lapsSelecionados, setLapsSelecionados] = useState<Record<string, boolean>>({});
  const [lapsCalculo, setLapsCalculo] = useState<any>(null);
  const [lapsAjusteDesc, setLapsAjusteDesc] = useState("");
  const [lapsAjusteValor, setLapsAjusteValor] = useState("");
  const [lapsSaving, setLapsSaving] = useState(false);
  const [lapsLoading, setLapsLoading] = useState(false);

  useEffect(() => {
    supabase.from("cooperativas").select("id, nome").eq("ativo", true).order("nome").then(({ data }) => {
      if (data) setCooperativasList(data as any);
    });
    supabase.from("regionais").select("id, nome").eq("ativo", true).order("nome").then(({ data }) => {
      if (data) setRegionaisList(data as any);
    });
  }, []);

  // Auto-buscar por placa via query params (atalho do Associado)
  useEffect(() => {
    const placaParam = searchParams.get("placa");
    const tabParam = searchParams.get("vtab") || searchParams.get("tab");
    if (placaParam && !searched) {
      setFilters(prev => ({ ...prev, placa: placaParam }));
      if (tabParam) setAutoTab(tabParam);
      setTimeout(() => {
        (async () => {
          setLoading(true);
          const { data } = await supabase.from("veiculos").select("*, associados(nome, cpf, status, telefone, email, regional_id, cooperativa_id, regionais(nome), cooperativas(nome))").ilike("placa", `%${placaParam.replace("-","")}%`).limit(10);
          const [condutoresRes, obsRes] = await Promise.all([
            (data ?? []).length > 0 ? (supabase as any).from("condutores").select("*").in("veiculo_id", (data ?? []).map((v: any) => v.id)) : { data: [] },
            (data ?? []).length > 0 ? (supabase as any).from("observacoes_veiculo").select("*").in("veiculo_id", (data ?? []).map((v: any) => v.id)).order("created_at", { ascending: false }) : { data: [] },
          ]);
          const condutoresByVeiculo: Record<string, any[]> = {};
          (condutoresRes.data || []).forEach((c: any) => { if (!condutoresByVeiculo[c.veiculo_id]) condutoresByVeiculo[c.veiculo_id] = []; condutoresByVeiculo[c.veiculo_id].push(c); });
          const obsByVeiculo: Record<string, any[]> = {};
          (obsRes.data || []).forEach((o: any) => { if (!obsByVeiculo[o.veiculo_id]) obsByVeiculo[o.veiculo_id] = []; obsByVeiculo[o.veiculo_id].push(o); });
          const mapped = (data ?? []).map((v: any) => ({
            id: v.id, nome: v.associados?.nome ?? "—", placa: v.placa ?? "", chassi: v.chassi ?? "",
            idExterno: v.renavam ?? "", modelo: v.modelo ?? "", marca: v.marca ?? "",
            anoFab: v.ano ?? 0, anoMod: v.ano ?? 0, cor: v.cor ?? "",
            valorFipe: v.valor_fipe ?? 0, cota: v.cota || "", combustivel: v.combustivel ?? "", km: v.quilometragem ?? 0,
            regional: v.associados?.regionais?.nome ?? "", cooperativa: v.associados?.cooperativas?.nome ?? "", tipoAdesao: "",
            dataCadastro: v.created_at?.split("T")[0] ?? "", dataContrato: "", diaVenc: v.dia_vencimento ?? 0,
            sitVeiculo: v.status ?? "Ativo", sitAssociado: v.associados?.status ?? "",
            associado_id: v.associado_id,
            condutores: (condutoresByVeiculo[v.id] || []).map((c: any) => ({ nome: c.nome, cpf: c.cpf || "", cnh: c.cnh || "", dataNasc: c.data_nascimento || "", situacao: c.situacao || "Ativo" })),
            lancamentos: [], agregados: [], vistorias: [], documentos: [],
            observacoes: (obsByVeiculo[v.id] || []).map((o: any) => ({ data: new Date(o.created_at).toLocaleDateString("pt-BR"), descricao: o.texto, usuario: o.usuario_nome || "" })),
            fornecedores: [], contratos: [],
          } as any));
          setResults(mapped);
          setSearched(true);
          setLoading(false);
          if (mapped.length === 1) selectVehicle(mapped[0]);
        })();
      }, 100);
    }
  }, [searchParams]);

  const setF = (k: string, v: string) => setFilters(p => ({ ...p, [k]: v }));

  const [loading, setLoading] = useState(false);

  const buscar = async () => {
    setLoading(true);
    let query = supabase.from("veiculos").select("*, associados(nome, cpf, status, telefone, email, regional_id, cooperativa_id, regionais(nome), cooperativas(nome))").limit(100);
    if (filters.placa) query = query.ilike("placa", `%${filters.placa.replace("-","")}%`);
    if (filters.chassi) query = query.ilike("chassi", `%${filters.chassi}%`);
    if (filters.proprietario) query = query.ilike("associados.nome", `%${filters.proprietario}%`);
    const { data } = await query;
    // Buscar condutores e observações em paralelo para cada veículo
    const veiculoIds = (data ?? []).map((v: any) => v.id);
    const [condutoresRes, obsRes] = await Promise.all([
      veiculoIds.length > 0 ? (supabase as any).from("condutores").select("*").in("veiculo_id", veiculoIds) : { data: [] },
      veiculoIds.length > 0 ? (supabase as any).from("observacoes_veiculo").select("*").in("veiculo_id", veiculoIds).order("created_at", { ascending: false }) : { data: [] },
    ]);
    const condutoresByVeiculo: Record<string, any[]> = {};
    (condutoresRes.data || []).forEach((c: any) => { if (!condutoresByVeiculo[c.veiculo_id]) condutoresByVeiculo[c.veiculo_id] = []; condutoresByVeiculo[c.veiculo_id].push(c); });
    const obsByVeiculo: Record<string, any[]> = {};
    (obsRes.data || []).forEach((o: any) => { if (!obsByVeiculo[o.veiculo_id]) obsByVeiculo[o.veiculo_id] = []; obsByVeiculo[o.veiculo_id].push(o); });

    const mapped: Veiculo[] = (data ?? []).map((v: any) => ({
      id: v.id, nome: v.associados?.nome ?? "—", placa: v.placa ?? "", chassi: v.chassi ?? "",
      idExterno: v.renavam ?? "", modelo: v.modelo ?? "", marca: v.marca ?? "",
      anoFab: v.ano ?? 0, anoMod: v.ano ?? 0, cor: v.cor ?? "",
      valorFipe: v.valor_fipe ?? 0, cota: v.cota || "", combustivel: v.combustivel ?? "", km: v.quilometragem ?? 0,
      regional: v.associados?.regionais?.nome ?? "", cooperativa: v.associados?.cooperativas?.nome ?? "", tipoAdesao: "",
      dataCadastro: v.created_at?.split("T")[0] ?? "", dataContrato: "", diaVenc: v.dia_vencimento ?? 0,
      sitVeiculo: v.status ?? "Ativo", sitAssociado: v.associados?.status ?? "",
      associado_id: v.associado_id,
      condutores: (condutoresByVeiculo[v.id] || []).map((c: any) => ({ nome: c.nome, cpf: c.cpf || "", cnh: c.cnh || "", dataNasc: c.data_nascimento || "", situacao: c.situacao || "Ativo" })),
      lancamentos: [], agregados: [], vistorias: [],
      documentos: [],
      observacoes: (obsByVeiculo[v.id] || []).map((o: any) => ({ data: new Date(o.created_at).toLocaleDateString("pt-BR"), descricao: o.texto, usuario: o.usuario_nome || "" })),
      fornecedores: [], contratos: [],
    }));
    let r = mapped;
    if (filters.sitVeiculo !== "Todos") r = r.filter(v => v.sitVeiculo === filters.sitVeiculo);
    if (filters.sitAssociado !== "Todos") r = r.filter(v => v.sitAssociado === filters.sitAssociado);
    if (filters.cooperativa !== "Todos") r = r.filter(v => v.cooperativa === filters.cooperativa);
    if (filters.regional !== "Todos") r = r.filter(v => v.regional === filters.regional);
    setResults(r);
    setSearched(true);
    setPage(1);
    setLoading(false);
  };

  const limpar = () => { setFilters({ placa:"",chassi:"",idExterno:"",proprietario:"",idVeiculo:"",sitVeiculo:"Todos",sitAssociado:"Todos",cooperativa:"Todos",regional:"Todos" }); setResults([]); setSearched(false); };

  const carregarLaps = async (veiculo: Veiculo) => {
    setLapsLoading(true);
    try {
      // Queries paralelas: associado, produtos, veículo_produtos e ajuste — tudo ao mesmo tempo
      const [assocRes, produtosRes, veicProdRes, ajusteRes] = await Promise.all([
        veiculo.associado_id
          ? supabase.from("associados").select("regional_id, endereco_cidade, endereco_uf").eq("id", veiculo.associado_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from("produtos_gia").select("*").eq("ativo", true).order("nome"),
        (supabase as any).from("veiculo_produtos").select("*").eq("veiculo_id", veiculo.id),
        (supabase as any).from("veiculos").select("ajuste_avulso_valor, ajuste_avulso_desc").eq("id", veiculo.id).maybeSingle(),
      ]);

      const assocData = assocRes.data;
      const todosProdutos = produtosRes.data || [];
      const veicProd = veicProdRes.data || [];
      const ajusteData = ajusteRes.data;

      // Resolver regional: cidade → municipios → regional_cidades (1-2 queries)
      let regId = assocData?.regional_id || null;
      const cidade = assocData?.endereco_cidade || "";
      const uf = assocData?.endereco_uf || "";
      if (cidade && uf && !regId) {
        const { data: mun } = await (supabase as any).from("municipios")
          .select("id").eq("uf", uf).ilike("nome", cidade).limit(1).maybeSingle();
        if (mun) {
          const { data: rc } = await (supabase as any).from("regional_cidades")
            .select("regional_id").eq("municipio_id", mun.id).limit(1).maybeSingle();
          if (rc) regId = rc.regional_id;
        }
        if (!regId) {
          const { data: fb } = await (supabase as any).from("regional_cidades")
            .select("regional_id, municipios!inner(uf)").eq("municipios.uf", uf).limit(1).maybeSingle();
          if (fb) regId = fb.regional_id;
        }
      }
      if (!regId && veiculo.regional) {
        const { data: regMatch } = await supabase.from("regionais").select("id").ilike("nome", `%${veiculo.regional}%`).limit(1).maybeSingle();
        if (regMatch) regId = regMatch.id;
      }

      // Filtrar produtos por regional + buscar faixa FIPE — em paralelo
      let tipoSga = "AUTOMOVEL";
      const modelo = (veiculo.modelo || "").toLowerCase();
      if (/moto|cg |cb |honda cg/i.test(modelo)) tipoSga = "MOTOCICLETA";
      else if (/scania|volvo fh|iveco|cargo|constellation/i.test(modelo)) tipoSga = "PESADOS";
      else if (/sprinter|daily|ducato|master/i.test(modelo)) tipoSga = "VANS E PESADOS P.P";
      else if (/fiorino|kangoo|doblo|strada|saveiro/i.test(modelo)) tipoSga = "UTILITARIOS";

      const [regrasRes, faixaRes] = await Promise.all([
        regId ? (supabase as any).from("produto_regras").select("produto_id").eq("regional_id", regId) : Promise.resolve({ data: null }),
        regId && veiculo.valorFipe > 0
          ? (supabase as any).from("faixas_fipe").select("taxa_administrativa, rateio")
              .eq("regional_id", regId).eq("tipo_veiculo", tipoSga)
              .lte("fipe_min", veiculo.valorFipe).gte("fipe_max", veiculo.valorFipe)
              .limit(1).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      // Filtrar produtos pela regional
      let produtosRegional = todosProdutos;
      if (regrasRes.data && regrasRes.data.length > 0) {
        const idsPermitidos = new Set(regrasRes.data.map((r: any) => r.produto_id));
        produtosRegional = todosProdutos.filter((p: any) => idsPermitidos.has(p.id));
      }
      setLapsProdutosDisponiveis(produtosRegional);

      // Marcar selecionados
      setLapsVeiculoProdutos(veicProd);
      const sel: Record<string, boolean> = {};
      veicProd.forEach((vp: any) => { sel[vp.produto_id] = true; });
      setLapsSelecionados(sel);

      // Ajuste avulso
      if (ajusteData && (ajusteData.ajuste_avulso_valor || ajusteData.ajuste_avulso_desc)) {
        setLapsAjusteDesc(ajusteData.ajuste_avulso_desc || "");
        setLapsAjusteValor(String(ajusteData.ajuste_avulso_valor || ""));
      } else {
        setLapsAjusteDesc("");
        setLapsAjusteValor("");
      }

      // Taxa e rateio
      const faixa = faixaRes.data;
      const taxaAdm = faixa ? Number(faixa.taxa_administrativa) || 0 : 0;
      const rateioVal = faixa ? Number(faixa.rateio) || 0 : 0;

      // Calcular mensalidade
      await calcularMensalidadeLaps(sel, taxaAdm, rateioVal, produtosRegional);
    } catch (err: any) {
      toast.error("Erro ao carregar LAPS: " + err.message);
    }
    setLapsLoading(false);
  };

  const calcularMensalidadeLaps = async (selecionados: Record<string, boolean>, taxaAdm?: number, rateioVal?: number, produtosOverride?: any[]) => {
    const produtos = produtosOverride || lapsProdutosDisponiveis;
    const produtoIds = Object.entries(selecionados).filter(([, v]) => v).map(([k]) => k);
    const subtotal = produtos.filter(p => produtoIds.includes(p.id)).reduce((s, p) => s + (p.valor || 0), 0);
    const ajusteNum = parseFloat(lapsAjusteValor) || 0;
    const taxa = taxaAdm ?? lapsCalculo?.taxa_administrativa ?? 0;
    const rateio = rateioVal ?? lapsCalculo?.rateio ?? 0;
    const total = subtotal + taxa + rateio + ajusteNum;
    setLapsCalculo({ subtotal_produtos: subtotal, taxa_administrativa: taxa, rateio, ajuste_avulso: ajusteNum, total_mensalidade: total });
  };

  const salvarLaps = async () => {
    if (!selected) return;
    setLapsSaving(true);
    try {
      const produtoIds = Object.entries(lapsSelecionados).filter(([, v]) => v).map(([k]) => k);
      // Deletar vínculos atuais e re-inserir
      await (supabase as any).from("veiculo_produtos").delete().eq("veiculo_id", selected.id);
      if (produtoIds.length > 0) {
        const inserts = produtoIds.map(pid => ({
          veiculo_id: selected.id, produto_id: pid, tipo: "principal",
        }));
        const { error } = await (supabase as any).from("veiculo_produtos").insert(inserts);
        if (error) throw error;
      }
      // Salvar ajuste avulso na tabela veiculos (colunas podem não existir ainda)
      const ajusteNum = parseFloat(lapsAjusteValor) || 0;
      await (supabase as any).from("veiculos").update({
        ajuste_avulso_valor: ajusteNum,
        ajuste_avulso_desc: lapsAjusteDesc.trim() || null,
      }).eq("id", selected.id).then(() => {}).catch(() => {});

      toast.success("Composição do plano salva com sucesso!");
      await carregarLaps(selected);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    }
    setLapsSaving(false);
  };

  const selectVehicle = async (v: Veiculo) => {
    setContratoData(null);
    setCotacaoData(null);

    // Auto-preencher cota via FIPE + faixa + regional (ERR-015)
    if (v.valorFipe > 0 && !v.cota) {
      try {
        const { data: faixa } = await (supabase as any)
          .from("faixas_fipe")
          .select("descricao, fipe_inicial, fipe_final, fator, taxa_adm")
          .lte("fipe_inicial", v.valorFipe)
          .gte("fipe_final", v.valorFipe)
          .limit(1);
        if (faixa && faixa.length > 0) {
          v = { ...v, cota: faixa[0].descricao || `${faixa[0].fipe_inicial}-${faixa[0].fipe_final}` };
        }
      } catch (e) { console.warn("Erro auto-fill cota:", e); }
    }
    setSelected(v);

    // Fetch contract/plan info and cotacao for the vehicle
    const [contratoRes, cotacaoRes] = await Promise.all([
      supabase
        .from("contratos")
        .select("*, planos(nome)")
        .eq("veiculo_id", v.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("cotacoes")
        .select("*")
        .eq("veiculo_id", v.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (contratoRes.data) setContratoData(contratoRes.data);
    if (cotacaoRes.data) setCotacaoData(cotacaoRes.data);
    // Load related data in parallel
    const [mensRes, sinistrosRes, docsRes] = await Promise.all([
      v.associado_id
        ? supabase.from("mensalidades").select("*").eq("associado_id", v.associado_id).order("data_vencimento", { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase.from("sinistros").select("*").eq("veiculo_id", v.id),
      supabase.from("vehicle_documents").select("*").eq("vehicle_id", v.id),
    ]);
    const lancamentos = (mensRes.data ?? []).map((m: any) => ({
      nTitulo: m.id?.slice(0, 8) ?? "", nBanco: "", tipo: "Mensalidade",
      banco: "", dtEmissao: m.created_at?.split("T")[0] ?? "",
      dataVenc: m.data_vencimento ?? "", dataPgto: m.data_pagamento ?? "",
      valor: m.valor ?? 0, valorPago: m.data_pagamento ? m.valor : 0,
      parcela: m.referencia ?? "-", nControle: "",
      status: m.status === "pago" ? "Pago" : m.status === "atrasado" ? "Atrasado" : "Pendente",
    }));
    const fornecedores = (sinistrosRes.data ?? []).map((s: any) => ({
      protocolo: s.id?.slice(0, 8) ?? "", fornecedor: "",
      produto: s.tipo ?? "", servico: s.tipo ?? "",
      motivo: s.descricao ?? "", situacao: s.status ?? "",
      dataAbertura: s.data_ocorrencia ?? "", dataFechamento: "",
    }));
    const documentos = (docsRes.data ?? []).map((d: any) => ({
      nome: d.nome_arquivo ?? "", tipo: d.tipo ?? "",
      data: d.created_at ? new Date(d.created_at).toLocaleDateString("pt-BR") : "",
    }));
    setSelected(prev => prev ? { ...prev, lancamentos, fornecedores, documentos } : prev);
  };

  const paged = results.slice((page-1)*perPage, page*perPage);
  const totalPages = Math.ceil(results.length / perPage);

  // ── LIST VIEW ──
  if (!selected) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-bold">Consultar / Alterar Veículo</h2>
          <p className="text-sm text-muted-foreground">Busca avançada de veículos com edição completa</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <div><Label className="text-xs">Placa</Label><Input value={filters.placa} onChange={e => setF("placa", e.target.value)} placeholder="ABC-1234" /></div>
              <div><Label className="text-xs">Chassi</Label><Input value={filters.chassi} onChange={e => setF("chassi", e.target.value)} /></div>
              <div><Label className="text-xs">Id Externo</Label><Input value={filters.idExterno} onChange={e => setF("idExterno", e.target.value)} /></div>
              <div><Label className="text-xs">Proprietário</Label><Input value={filters.proprietario} onChange={e => setF("proprietario", e.target.value)} /></div>
              <div><Label className="text-xs">Id Veículo</Label><Input value={filters.idVeiculo} onChange={e => setF("idVeiculo", e.target.value)} /></div>
              <div><Label className="text-xs">Sit. Veículo</Label>
                <Select value={filters.sitVeiculo} onValueChange={v => setF("sitVeiculo", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Todos","Ativo","Inativo","Negado","Pendente","Inadimplente"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Sit. Associado</Label>
                <Select value={filters.sitAssociado} onValueChange={v => setF("sitAssociado", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Todos","Ativo","Inativo","Suspenso"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Regional</Label>
                <Select value={filters.regional} onValueChange={v => setF("regional", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Todos">Todos</SelectItem>{regionaisList.map(r => <SelectItem key={r.id} value={r.nome}>{r.nome}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Cooperativa</Label>
                <Select value={filters.cooperativa} onValueChange={v => setF("cooperativa", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Todos">Todos</SelectItem>{cooperativasList.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={buscar} className="gap-1.5"><Search className="h-4 w-4" />Pesquisar</Button>
              <Button variant="outline" onClick={limpar}>Limpar</Button>
            </div>
          </CardContent>
        </Card>

        {searched && (
          <Card>
            <CardContent className="p-0">
              {results.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-12">Nenhum veículo encontrado.</p>
              ) : (
                <>
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead><TableHead>Placa</TableHead><TableHead>Regional</TableHead>
                          <TableHead>Dt Cadastro</TableHead><TableHead>Dt Contrato</TableHead><TableHead>Venc</TableHead>
                          <TableHead>Valor FIPE</TableHead><TableHead>Cota</TableHead>
                          <TableHead>Sit. Veículo</TableHead><TableHead>Sit. Assoc.</TableHead>
                          <TableHead>Cooperativa</TableHead><TableHead>Tipo</TableHead><TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paged.map(v => (
                          <TableRow key={v.id}>
                            <TableCell className="text-sm font-medium">{v.nome}</TableCell>
                            <TableCell className="font-mono text-sm">{v.placa}</TableCell>
                            <TableCell className="text-xs">{v.regional}</TableCell>
                            <TableCell className="text-xs">{new Date(v.dataCadastro).toLocaleDateString("pt-BR")}</TableCell>
                            <TableCell className="text-xs">{new Date(v.dataContrato).toLocaleDateString("pt-BR")}</TableCell>
                            <TableCell className="text-xs">Dia {v.diaVenc}</TableCell>
                            <TableCell className="text-xs">R$ {v.valorFipe.toLocaleString("pt-BR")}</TableCell>
                            <TableCell className="text-xs">{v.cota}</TableCell>
                            <TableCell><StatusBadge status={v.sitVeiculo} /></TableCell>
                            <TableCell><StatusBadge status={v.sitAssociado} /></TableCell>
                            <TableCell className="text-xs">{v.cooperativa}</TableCell>
                            <TableCell className="text-xs">{v.tipoAdesao}</TableCell>
                            <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => selectVehicle(v)}><Pencil className="h-3.5 w-3.5" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                  <div className="flex items-center justify-between p-3 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{results.length} resultado(s)</span>
                      <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(1); }}>
                        <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>{[10,25,50].map(n => <SelectItem key={n} value={String(n)}>{n}/pág</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={page<=1} onClick={() => setPage(p=>p-1)}><ChevronLeft className="h-4 w-4" /></Button>
                      <span className="text-sm px-2">{page}/{totalPages||1}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ── EDIT VIEW ──
  const sel = selected;
  const totalLanc = sel.lancamentos.reduce((s,l) => s + l.valor, 0);
  const pagos = sel.lancamentos.filter(l => l.status === "Pago").length;
  const atrasados = sel.lancamentos.filter(l => l.status === "Atrasado").length;

  return (
    <div className="max-w-7xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="gap-1.5 mb-4 text-muted-foreground"><ArrowLeft className="h-4 w-4" />Voltar</Button>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Car className="h-5 w-5 text-primary" /></div>
        <div>
          <h2 className="text-lg font-bold">{sel.placa} — {sel.modelo}</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">{sel.marca} {sel.anoFab}/{sel.anoMod} • {sel.nome} • <StatusBadge status={sel.sitVeiculo} /></p>
        </div>
      </div>

      <Tabs defaultValue={autoTab || "dados"} onValueChange={v => { if (v === "laps" && lapsProdutosDisponiveis.length === 0) carregarLaps(sel); }}>
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-auto">
            <TabsTrigger value="dados" className="text-xs gap-1"><Car className="h-3 w-3" />Dados</TabsTrigger>
            <TabsTrigger value="laps" className="text-xs gap-1" onClick={() => { if (lapsProdutosDisponiveis.length === 0) carregarLaps(sel); }}><Calculator className="h-3 w-3" />LAPS</TabsTrigger>
            <TabsTrigger value="condutores" className="text-xs gap-1"><Users className="h-3 w-3" />Condutores</TabsTrigger>
            <TabsTrigger value="financeiro" className="text-xs gap-1"><DollarSign className="h-3 w-3" />Financeiro</TabsTrigger>
            <TabsTrigger value="agregados" className="text-xs gap-1"><Package className="h-3 w-3" />Agregados</TabsTrigger>
            <TabsTrigger value="vistorias" className="text-xs gap-1"><ClipboardCheck className="h-3 w-3" />Vistorias</TabsTrigger>
            <TabsTrigger value="documentos" className="text-xs gap-1"><FileText className="h-3 w-3" />Documentos</TabsTrigger>
            <TabsTrigger value="observacoes" className="text-xs gap-1"><FileText className="h-3 w-3" />Obs</TabsTrigger>
            <TabsTrigger value="fornecedores" className="text-xs gap-1"><PhoneIcon className="h-3 w-3" />Fornecedores</TabsTrigger>
            <TabsTrigger value="contratos" className="text-xs gap-1"><FileSignature className="h-3 w-3" />Contratos</TabsTrigger>
            <TabsTrigger value="pos-venda" className="text-xs gap-1"><ClipboardCheck className="h-3 w-3" />Pós-Venda</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* TAB 1 - DADOS */}
        <TabsContent value="dados" className="mt-4">
          <Card><CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div><Label className="text-xs">Placa</Label><Input defaultValue={sel.placa} /></div>
              <div><Label className="text-xs">Chassi</Label><Input defaultValue={sel.chassi} /></div>
              <div><Label className="text-xs">Modelo</Label><Input defaultValue={sel.modelo} /></div>
              <div><Label className="text-xs">Marca</Label><Input defaultValue={sel.marca} /></div>
              <div><Label className="text-xs">Ano Fab</Label><Input defaultValue={String(sel.anoFab)} /></div>
              <div><Label className="text-xs">Ano Mod</Label><Input defaultValue={String(sel.anoMod)} /></div>
              <div><Label className="text-xs">Cor</Label><Input defaultValue={sel.cor} /></div>
              <div><Label className="text-xs">Combustível</Label><Input defaultValue={sel.combustivel} /></div>
              <div><Label className="text-xs">KM</Label><Input defaultValue={String(sel.km)} /></div>
              <div><Label className="text-xs">Valor FIPE (R$)</Label><Input defaultValue={sel.valorFipe.toLocaleString("pt-BR")} /></div>
              <div><Label className="text-xs">Cota</Label><Input defaultValue={sel.cota} /></div>
              <div><Label className="text-xs">Regional</Label><Input defaultValue={sel.regional} /></div>
              <div><Label className="text-xs">Cooperativa</Label><Input defaultValue={sel.cooperativa} /></div>
              <div><Label className="text-xs">Status Veículo</Label>
                <Select defaultValue={sel.sitVeiculo} onValueChange={async (v) => {
                  const { error } = await supabase.from("veiculos").update({ status: v } as any).eq("id", sel.id);
                  if (error) toast.error("Erro: " + error.message);
                  else { toast.success("Status atualizado!"); setSelected(prev => prev ? { ...prev, sitVeiculo: v } : prev); }
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Ativo","Inativo","Pendente","Inadimplente","Negado"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Tipo Adesão</Label><Input defaultValue={sel.tipoAdesao} /></div>
              <div><Label className="text-xs">Dia Vencimento</Label><Input defaultValue={String(sel.diaVenc)} /></div>
              <div><Label className="text-xs">Data Reativação</Label><Input type="date" /></div>
            </div>
            <div className="flex justify-end mt-4"><Button className="gap-1.5" onClick={async () => {
              const { error } = await supabase.from("veiculos").update({
                placa: sel.placa, chassi: sel.chassi, modelo: sel.modelo, marca: sel.marca,
                cor: sel.cor, updated_at: new Date().toISOString(),
              } as any).eq("id", sel.id);
              if (error) toast.error("Erro: " + error.message);
              else toast.success("Dados salvos no banco!");
            }}><Save className="h-4 w-4" />Salvar</Button></div>
          </CardContent></Card>

          {/* Informações de Plano */}
          <Card className="mt-4">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileSignature className="h-4 w-4 text-primary" />Informações de Plano</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
              {contratoData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Plano</Label><p className="text-sm font-medium">{contratoData.planos?.nome || contratoData.plano_id || "—"}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Valor Mensal</Label><p className="text-sm font-medium">R$ {contratoData.valor_mensal ? Number(contratoData.valor_mensal).toFixed(2).replace(".", ",") : "—"}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Data Início</Label><p className="text-sm font-medium">{contratoData.data_inicio ? new Date(contratoData.data_inicio).toLocaleDateString("pt-BR") : "—"}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Data Fim</Label><p className="text-sm font-medium">{contratoData.data_fim ? new Date(contratoData.data_fim).toLocaleDateString("pt-BR") : "—"}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Status</Label><p className="text-sm"><StatusBadge status={contratoData.status || "—"} /></p></div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum contrato ativo encontrado para este veículo.</p>
              )}
            </CardContent>
          </Card>

          {/* Informações de Cotação / Rateio */}
          {cotacaoData && (
            <Card className="mt-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" />Cotação / Rateio</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Valor Cotação</Label><p className="text-sm font-medium">R$ {cotacaoData.valor ? Number(cotacaoData.valor).toFixed(2).replace(".", ",") : "—"}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Cota/Rateio</Label><p className="text-sm font-medium">{cotacaoData.cota || cotacaoData.rateio || "—"}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Status</Label><p className="text-sm"><StatusBadge status={cotacaoData.status || "—"} /></p></div>
                  <div><Label className="text-xs text-muted-foreground">Data</Label><p className="text-sm font-medium">{cotacaoData.created_at ? new Date(cotacaoData.created_at).toLocaleDateString("pt-BR") : "—"}</p></div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB LAPS - COMPOSIÇÃO DO PLANO */}
        <TabsContent value="laps" className="mt-4 space-y-4">
          {lapsLoading ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Carregando produtos...</CardContent></Card>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* LEFT - Produtos Disponíveis */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4 text-primary" />Produtos Disponíveis</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0">
                    {lapsProdutosDisponiveis.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">Nenhum produto disponível para esta regional.</p>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {lapsProdutosDisponiveis.map(p => (
                          <div key={p.id} className="flex items-center gap-3 p-2 rounded-md border hover:bg-accent/50 transition-colors">
                            <Checkbox
                              checked={!!lapsSelecionados[p.id]}
                              onCheckedChange={(checked) => {
                                const novo = { ...lapsSelecionados, [p.id]: !!checked };
                                setLapsSelecionados(novo);
                                calcularMensalidadeLaps(novo);
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{p.nome}</p>
                              {p.descricao && <p className="text-xs text-muted-foreground truncate">{p.descricao}</p>}
                            </div>
                            <span className="text-sm font-mono font-medium text-primary whitespace-nowrap">
                              R$ {(p.valor || 0).toFixed(2).replace(".", ",")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* RIGHT - Produtos do Plano */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" />Produtos do Plano</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0">
                    {Object.entries(lapsSelecionados).filter(([, v]) => v).length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">Nenhum produto selecionado.</p>
                    ) : (
                      <Table>
                        <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {lapsProdutosDisponiveis.filter(p => lapsSelecionados[p.id]).map(p => (
                            <TableRow key={p.id}>
                              <TableCell className="text-sm">{p.nome}</TableCell>
                              <TableCell className="text-sm text-right font-mono">R$ {(p.valor || 0).toFixed(2).replace(".", ",")}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    <div className="mt-3 pt-3 border-t text-right">
                      <span className="text-sm text-muted-foreground">Subtotal: </span>
                      <span className="text-sm font-bold font-mono">
                        R$ {lapsProdutosDisponiveis.filter(p => lapsSelecionados[p.id]).reduce((s, p) => s + (p.valor || 0), 0).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Resumo de cálculo */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div>
                      <Label className="text-xs text-muted-foreground">Subtotal Produtos</Label>
                      <p className="text-sm font-mono font-medium">R$ {(lapsCalculo?.subtotal_produtos ?? 0).toFixed(2).replace(".", ",")}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Taxa Administrativa (FIPE)</Label>
                      <p className="text-sm font-mono font-medium">R$ {(lapsCalculo?.taxa_administrativa ?? 0).toFixed(2).replace(".", ",")}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Rateio</Label>
                      <p className="text-sm font-mono font-medium">R$ {(lapsCalculo?.rateio ?? 0).toFixed(2).replace(".", ",")}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Ajuste Avulso - Descrição</Label>
                      <Input
                        value={lapsAjusteDesc}
                        onChange={e => setLapsAjusteDesc(e.target.value)}
                        placeholder="Ex: Desconto fidelidade"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Valor (negativo=desconto)</Label>
                      <Input
                        value={lapsAjusteValor}
                        onChange={e => {
                          setLapsAjusteValor(e.target.value);
                          const ajuste = parseFloat(e.target.value) || 0;
                          const sub = lapsCalculo?.subtotal_produtos ?? 0;
                          const taxa = lapsCalculo?.taxa_administrativa ?? 0;
                          const rat = lapsCalculo?.rateio ?? 0;
                          setLapsCalculo((prev: any) => ({ ...prev, ajuste_avulso: ajuste, total_mensalidade: sub + taxa + rat + ajuste }));
                        }}
                        placeholder="0,00"
                        className="text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Mensalidade</p>
                      <p className="text-2xl font-bold text-primary font-mono">
                        R$ {(lapsCalculo?.total_mensalidade ?? 0).toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                    <Button className="gap-1.5" onClick={salvarLaps} disabled={lapsSaving}>
                      <Save className="h-4 w-4" />{lapsSaving ? "Salvando..." : "Salvar Composição"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* TAB 2 - CONDUTORES */}
        <TabsContent value="condutores" className="mt-4 space-y-4">
          <div className="flex justify-end"><Button size="sm" className="gap-1.5" onClick={() => setCondutorModal(true)}><Plus className="h-3.5 w-3.5" />Adicionar Condutor</Button></div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>CPF</TableHead><TableHead>CNH</TableHead><TableHead>Data Nasc</TableHead><TableHead>Idade</TableHead><TableHead>Situação</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {sel.condutores.map((c, i) => {
                  const dataValida = c.dataNasc && !isNaN(new Date(c.dataNasc).getTime());
                  return (
                    <TableRow key={i}>
                      <TableCell className="text-sm font-medium">{c.nome}</TableCell>
                      <TableCell className="text-sm">{c.cpf}</TableCell>
                      <TableCell className="text-sm">{c.cnh}</TableCell>
                      <TableCell className="text-sm">{dataValida ? new Date(c.dataNasc).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell className="text-sm">{dataValida ? calcIdade(c.dataNasc) + " anos" : "—"}</TableCell>
                      <TableCell>
                        <Select defaultValue={c.situacao || "Ativo"} onValueChange={async (v) => {
                          const condutoresDb = await (supabase as any).from("condutores").select("id").eq("veiculo_id", sel.id).eq("nome", c.nome).eq("cpf", c.cpf).limit(1).maybeSingle();
                          if (condutoresDb?.data?.id) {
                            const { error } = await (supabase as any).from("condutores").update({ situacao: v }).eq("id", condutoresDb.data.id);
                            if (error) toast.error("Erro: " + error.message);
                            else {
                              toast.success("Situação atualizada!");
                              setSelected(prev => prev ? { ...prev, condutores: prev.condutores.map((cc, ci) => ci === i ? { ...cc, situacao: v } : cc) } : prev);
                            }
                          }
                        }}>
                          <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>{["Ativo","Pendente","Inativo","Removido"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent></Card>
          <Dialog open={condutorModal} onOpenChange={setCondutorModal}>
            <DialogContent>
              <DialogHeader><DialogTitle>Adicionar Condutor</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome</Label><Input data-condutor-field /></div>
                <div><Label>CPF</Label><Input data-condutor-field placeholder="000.000.000-00" /></div>
                <div><Label>CNH</Label><Input data-condutor-field /></div>
                <div><Label>Data Nascimento</Label><Input data-condutor-field type="date" /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setCondutorModal(false)}>Cancelar</Button><Button onClick={async () => {
                const inputs = document.querySelectorAll<HTMLInputElement>("[data-condutor-field]");
                const nome = inputs[0]?.value || "";
                const cpf = inputs[1]?.value || "";
                const cnh = inputs[2]?.value || "";
                const dataNasc = inputs[3]?.value || "";
                if (!nome.trim()) { toast.error("Nome é obrigatório"); return; }
                const { error } = await (supabase as any).from("condutores").insert({ veiculo_id: sel.id, nome, cpf, cnh, data_nascimento: dataNasc || null, situacao: "Ativo" });
                if (error) { toast.error("Erro: " + error.message); return; }
                toast.success("Condutor salvo no banco!");
                setCondutorModal(false);
                setSelected(prev => prev ? { ...prev, condutores: [...prev.condutores, { nome, cpf, cnh, dataNasc, situacao: "Ativo" }] } : prev);
              }}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* TAB 3 - FINANCEIRO */}
        <TabsContent value="financeiro" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold text-primary">R$ {totalLanc.toFixed(2).replace(".",",")}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Pagos</p><p className="text-xl font-bold text-success">{pagos}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Atrasados</p><p className="text-xl font-bold text-destructive">{atrasados}</p></CardContent></Card>
          </div>
          <Card><CardContent className="p-0">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Nº Título</TableHead><TableHead>Nº Banco</TableHead><TableHead>Tipo</TableHead><TableHead>Banco</TableHead>
                  <TableHead>Dt Emissão</TableHead><TableHead>Data Venc</TableHead><TableHead>Data Pgto</TableHead>
                  <TableHead>Valor</TableHead><TableHead>Valor Pago</TableHead><TableHead>Parcela</TableHead>
                  <TableHead>Nº Controle</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {sel.lancamentos.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-mono">{l.nTitulo}</TableCell>
                      <TableCell className="text-xs">{l.nBanco}</TableCell>
                      <TableCell className="text-xs">{l.tipo}</TableCell>
                      <TableCell className="text-xs">{l.banco}</TableCell>
                      <TableCell className="text-xs">{new Date(l.dtEmissao).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-xs">{new Date(l.dataVenc).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-xs">{l.dataPgto ? new Date(l.dataPgto).toLocaleDateString("pt-BR") : "-"}</TableCell>
                      <TableCell className="text-xs">R$ {l.valor.toFixed(2).replace(".",",")}</TableCell>
                      <TableCell className="text-xs">R$ {l.valorPago.toFixed(2).replace(".",",")}</TableCell>
                      <TableCell className="text-xs">{l.parcela}</TableCell>
                      <TableCell className="text-xs font-mono">{l.nControle}</TableCell>
                      <TableCell><Badge variant="outline" className={`${finBadge(l.status)} text-xs`}>{l.status}</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Printer className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent></Card>
        </TabsContent>

        {/* TAB 4 - AGREGADOS */}
        <TabsContent value="agregados" className="mt-4">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Placa</TableHead><TableHead>Cota</TableHead><TableHead>Marca/Modelo</TableHead><TableHead>Valor</TableHead><TableHead>Data</TableHead><TableHead>Situação</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {sel.agregados.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">Nenhum agregado.</TableCell></TableRow>
                ) : sel.agregados.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{a.tipo}</TableCell>
                    <TableCell className="font-mono text-sm">{a.placa}</TableCell>
                    <TableCell className="text-sm">{a.cota}</TableCell>
                    <TableCell className="text-sm">{a.marcaModelo}</TableCell>
                    <TableCell className="text-sm">R$ {a.valor.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-sm">{new Date(a.data).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell><StatusBadge status={a.situacao} /></TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* TAB 5 - VISTORIAS */}
        {/* TAB - PRODUTOS DO VEÍCULO */}
        <TabsContent value="vistorias" className="mt-4">
          <VistoriaTabReal placa={sel.placa} veiculoId={sel.id} />
        </TabsContent>

        {/* TAB 6 - DOCUMENTOS */}
        <TabsContent value="documentos" className="mt-4 space-y-4">
          <label className="block border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Clique para enviar documento</p>
            <p className="text-xs text-muted-foreground">PDF, imagem ou documento</p>
            <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={async (e) => {
              const file = e.target.files?.[0]; if (!file) return;
              const ext = file.name.split(".").pop() || "pdf";
              const path = `veiculos/${sel.id}/${Date.now()}.${ext}`;
              const { error } = await supabase.storage.from("documentos").upload(path, file, { contentType: file.type, upsert: true });
              if (error) { toast.error("Erro: " + error.message); return; }
              await (supabase as any).from("vehicle_documents").insert({ vehicle_id: sel.id, nome_arquivo: file.name, tipo: ext.toUpperCase(), storage_path: path });
              toast.success("Documento enviado!");
              setSelected(prev => prev ? { ...prev, documentos: [...prev.documentos, { nome: file.name, tipo: ext.toUpperCase(), data: new Date().toLocaleDateString("pt-BR") }] } : prev);
              e.target.value = "";
            }} />
          </label>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Data</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {sel.documentos.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{d.nome}</TableCell>
                    <TableCell><Badge variant="outline">{d.tipo}</Badge></TableCell>
                    <TableCell className="text-sm">{d.data}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* TAB 7 - OBSERVAÇÕES */}
        <TabsContent value="observacoes" className="mt-4 space-y-4">
          <Card><CardContent className="p-4">
            <div className="flex gap-2 mb-4">
              <Textarea value={newObs} onChange={e => setNewObs(e.target.value)} placeholder="Nova observação..." rows={2} className="flex-1" />
              <Button className="self-end" onClick={async () => {
                if (!newObs.trim()) return;
                const emailUsuario = user?.email || "Gestor";
                const { error } = await (supabase as any).from("observacoes_veiculo").insert({ veiculo_id: sel.id, texto: newObs.trim(), usuario_nome: emailUsuario });
                if (error) { toast.error("Erro: " + error.message); return; }
                toast.success("Observação salva no banco!");
                setSelected(prev => prev ? { ...prev, observacoes: [{ data: new Date().toLocaleDateString("pt-BR"), descricao: newObs.trim(), usuario: emailUsuario }, ...prev.observacoes] } : prev);
                setNewObs("");
              }}>Salvar</Button>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Usuário</TableHead></TableRow></TableHeader>
              <TableBody>
                {sel.observacoes.map((o, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{o.data}</TableCell>
                    <TableCell className="text-sm">{o.descricao}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{o.usuario}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* TAB 8 - FORNECEDORES */}
        <TabsContent value="fornecedores" className="mt-4">
          <Card><CardContent className="p-0">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader><TableRow><TableHead>Protocolo</TableHead><TableHead>Fornecedor</TableHead><TableHead>Produto</TableHead><TableHead>Serviço</TableHead><TableHead>Motivo</TableHead><TableHead>Situação</TableHead><TableHead>Dt Abertura</TableHead><TableHead>Dt Fechamento</TableHead></TableRow></TableHeader>
                <TableBody>
                  {sel.fornecedores.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">Nenhum acionamento.</TableCell></TableRow>
                  ) : sel.fornecedores.map((f, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{f.protocolo}</TableCell>
                      <TableCell className="text-sm">{f.fornecedor}</TableCell>
                      <TableCell className="text-sm">{f.produto}</TableCell>
                      <TableCell className="text-sm">{f.servico}</TableCell>
                      <TableCell className="text-sm">{f.motivo}</TableCell>
                      <TableCell><StatusBadge status={f.situacao} /></TableCell>
                      <TableCell className="text-xs">{new Date(f.dataAbertura).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-xs">{f.dataFechamento ? new Date(f.dataFechamento).toLocaleDateString("pt-BR") : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent></Card>
        </TabsContent>

        {/* TAB 9 - CONTRATOS */}
        <TabsContent value="contratos" className="mt-4">
          <ContratosTabReal veiculoId={sel.id} />
        </TabsContent>

        {/* TAB PÓS-VENDA (VEI-001) */}
        <TabsContent value="pos-venda" className="mt-4">
          <PosVendaSection veiculoId={sel.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// VeiculoProdutosTab — lista produtos vinculados ao veículo
// ═══════════════════════════════════════════════════════════
function VeiculoProdutosTab({ veiculoId }: { veiculoId: string }) {
  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["veiculo-produtos", veiculoId],
    enabled: !!veiculoId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("veiculo_produtos")
        .select(`
          id, ativo, obrigatorio, tipo, valor_contratado, data_inicio, data_fim,
          produtos_gia(id, nome, valor, valor_base, classificacao, tipo)
        `)
        .eq("veiculo_id", veiculoId)
        .eq("ativo", true);
      return (data || []).filter((r: any) => r.produtos_gia);
    },
  });

  const obrigatorios = produtos.filter((p: any) => p.obrigatorio);
  const opcionais = produtos.filter((p: any) => !p.obrigatorio);
  const total = produtos.reduce((s: number, p: any) => s + Number(p.valor_contratado || p.produtos_gia?.valor || 0), 0);

  const fmt = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (isLoading) {
    return <Card><CardContent className="p-12 flex justify-center"><div className="animate-pulse text-sm text-muted-foreground">Carregando produtos...</div></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-muted-foreground">Total de produtos ativos</p>
            <p className="text-lg font-bold">{produtos.length} <span className="text-xs font-normal text-muted-foreground">({obrigatorios.length} obrigatórios · {opcionais.length} serviços)</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total mensal</p>
            <p className="text-lg font-bold font-mono text-primary">{fmt(total)}</p>
          </div>
        </CardContent>
      </Card>

      {obrigatorios.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">🔒 Produtos Obrigatórios ({obrigatorios.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Classificação</TableHead><TableHead>Desde</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
              <TableBody>
                {obrigatorios.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm font-medium">{p.produtos_gia?.nome}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.produtos_gia?.classificacao || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.data_inicio ? new Date(p.data_inicio).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(Number(p.valor_contratado || p.produtos_gia?.valor || 0))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {opcionais.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">+ Serviços ({opcionais.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Classificação</TableHead><TableHead>Desde</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
              <TableBody>
                {opcionais.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm font-medium">{p.produtos_gia?.nome}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.produtos_gia?.classificacao || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.data_inicio ? new Date(p.data_inicio).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(Number(p.valor_contratado || p.produtos_gia?.valor || 0))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {produtos.length === 0 && (
        <Card><CardContent className="p-12 text-center text-muted-foreground text-sm">
          Nenhum produto vinculado a este veículo.
        </CardContent></Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ContratosTabReal — carrega contratos do banco
// ═══════════════════════════════════════════════════════════
function ContratosTabReal({ veiculoId }: { veiculoId: string }) {
  const [contratos, setContratos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("contratos").select("*, planos(nome)").eq("veiculo_id", veiculoId).order("created_at", { ascending: false });
      setContratos(data || []);
      setIsLoading(false);
    })();
  }, [veiculoId]);

  if (isLoading) return <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">Carregando contratos...</CardContent></Card>;

  if (contratos.length === 0) {
    return <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">Nenhum contrato encontrado para este veículo.</CardContent></Card>;
  }

  return (
    <Card><CardContent className="p-0">
      <Table>
        <TableHeader><TableRow><TableHead>Plano</TableHead><TableHead>Valor Mensal</TableHead><TableHead>Status</TableHead><TableHead>Data Início</TableHead><TableHead>Data Fim</TableHead></TableRow></TableHeader>
        <TableBody>
          {contratos.map((c: any) => (
            <TableRow key={c.id}>
              <TableCell className="text-sm font-medium">{c.planos?.nome || c.plano_id || "—"}</TableCell>
              <TableCell className="text-sm font-mono">R$ {c.valor_mensal ? Number(c.valor_mensal).toFixed(2).replace(".", ",") : "—"}</TableCell>
              <TableCell><StatusBadge status={c.status || "—"} /></TableCell>
              <TableCell className="text-xs">{c.data_inicio ? new Date(c.data_inicio).toLocaleDateString("pt-BR") : "—"}</TableCell>
              <TableCell className="text-xs">{c.data_fim ? new Date(c.data_fim).toLocaleDateString("pt-BR") : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent></Card>
  );
}

// ═══════════════════════════════════════════════════════════
// VistoriaTabReal — vistorias do veículo a partir de negociacoes/vistoria_fotos
// ═══════════════════════════════════════════════════════════
function VistoriaTabReal({ placa, veiculoId }: { placa?: string; veiculoId?: string }) {
  const [vistorias, setVistorias] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resultado: any[] = [];
        // Busca negociações por placa
        if (placa) {
          const { data: negs } = await (supabase as any)
            .from("negociacoes")
            .select("id, lead_nome, veiculo_modelo, veiculo_placa, created_at, stage, vistoria_aprovada, vistoria_observacoes")
            .ilike("veiculo_placa", placa.toUpperCase());
          if (negs && negs.length > 0) {
            // Batch query fotos
            const negIds = negs.map((n: any) => n.id);
            const { data: allFotos } = await (supabase as any)
              .from("vistoria_fotos")
              .select("id, tipo, url, created_at, status, negociacao_id")
              .in("negociacao_id", negIds);
            const fotosByNeg: Record<string, any[]> = {};
            (allFotos || []).forEach((f: any) => { if (!fotosByNeg[f.negociacao_id]) fotosByNeg[f.negociacao_id] = []; fotosByNeg[f.negociacao_id].push(f); });
            negs.forEach((n: any) => {
              resultado.push({ id: n.id, data: n.created_at, tipo: "Vistoria de Venda", cliente: n.lead_nome, veiculo: n.veiculo_modelo, aprovada: n.vistoria_aprovada, observacoes: n.vistoria_observacoes, fotos: fotosByNeg[n.id] || [], origem: "negociacao" });
            });
          }
        }
        // Vistorias de gestão
        if (veiculoId) {
          const { data: vistoriasGestao } = await (supabase as any)
            .from("vistorias")
            .select("id, status, data_vistoria, tipo, observacoes, created_at, vistoria_fotos(id, tipo, url, created_at, status)")
            .eq("veiculo_id", veiculoId);
          (vistoriasGestao || []).forEach((vg: any) => {
            resultado.push({ id: vg.id, data: vg.data_vistoria || vg.created_at, tipo: vg.tipo || "Vistoria de Gestão", cliente: "-", veiculo: placa || "", aprovada: vg.status === "aprovada", observacoes: vg.observacoes, fotos: vg.vistoria_fotos || [], origem: "gestao" });
          });
        }
        if (!cancelled) {
          setVistorias(resultado.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
        }
      } catch (err: any) {
        console.error("Erro vistorias:", err);
        if (!cancelled) setVistorias([]);
      }
      if (!cancelled) setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [placa, veiculoId]);

  if (isLoading) {
    return <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">Carregando vistorias...</CardContent></Card>;
  }

  if (vistorias.length === 0) {
    return (
      <Card><CardContent className="p-12 text-center">
        <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Nenhuma vistoria encontrada para este veículo.</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-3">
      {vistorias.map((v: any) => (
        <Card key={v.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={v.aprovada ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-700"}>
                    {v.aprovada ? "Aprovada" : "Pendente/Em Análise"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{new Date(v.data).toLocaleDateString("pt-BR")}</span>
                </div>
                <p className="text-sm font-medium">{v.tipo}</p>
                <p className="text-xs text-muted-foreground">Cliente: {v.cliente}</p>
                {v.observacoes && <p className="text-xs mt-1 italic">{v.observacoes}</p>}
              </div>
              <Badge variant="outline" className="text-[10px]">{v.fotos.length} fotos</Badge>
            </div>
            {v.fotos.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 mt-3">
                {v.fotos.slice(0, 16).map((f: any) => (
                  <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="aspect-square rounded overflow-hidden border bg-muted hover:ring-2 hover:ring-primary">
                    <img src={f.url} alt={f.tipo} loading="lazy" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
