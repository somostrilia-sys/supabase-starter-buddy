import { useState, useEffect } from "react";
import { supabase, callEdge } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import PosVendaSection from "./PosVendaSection";
import HistoricoEventosList from "@/components/HistoricoEventosList";
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
  lancamentos: { id?: string; nTitulo: string; nBanco: string; tipo: string; banco: string; dtEmissao: string; dataVenc: string; dataPgto: string; valor: number; valorPago: number; parcela: string; nControle: string; status: string; linhaDigitavel?: string; pixCopiaCola?: string; pdfPath?: string | null; linkBoleto?: string }[];
  agregados: { tipo: string; placa: string; cota: string; marcaModelo: string; valor: number; data: string; situacao: string }[];
  vistorias: { data: string; tipo: string; resultado: string; obs: string; usuario: string }[];
  documentos: { nome: string; tipo: string; data: string; storage_path?: string | null; bucket?: string; fonte?: string }[];
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
  const [origemData, setOrigemData] = useState<any>(null);

  // LAPS state
  const [lapsProdutosDisponiveis, setLapsProdutosDisponiveis] = useState<any[]>([]);
  const [lapsVeiculoProdutos, setLapsVeiculoProdutos] = useState<any[]>([]);
  const [lapsSelecionados, setLapsSelecionados] = useState<Record<string, boolean>>({});
  const [lapsCalculo, setLapsCalculo] = useState<any>(null);
  const [lapsAjusteDesc, setLapsAjusteDesc] = useState("");
  const [lapsAjusteValor, setLapsAjusteValor] = useState("");
  const [lapsDescontoValor, setLapsDescontoValor] = useState("");
  const [lapsDescontoDesc, setLapsDescontoDesc] = useState("");
  const [lapsAcrescimoValor, setLapsAcrescimoValor] = useState("");
  const [lapsAcrescimoDesc, setLapsAcrescimoDesc] = useState("");
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
        (supabase as any).from("veiculos").select("ajuste_avulso_valor, ajuste_avulso_desc, desconto_valor, desconto_desc, acrescimo_valor, acrescimo_desc").eq("id", veiculo.id).maybeSingle(),
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

      // Desconto + Acréscimo (separados); compatibilidade com ajuste_avulso legado
      setLapsDescontoValor(ajusteData?.desconto_valor ? String(ajusteData.desconto_valor) : "");
      setLapsDescontoDesc(ajusteData?.desconto_desc || "");
      setLapsAcrescimoValor(ajusteData?.acrescimo_valor ? String(ajusteData.acrescimo_valor) : "");
      setLapsAcrescimoDesc(ajusteData?.acrescimo_desc || "");
      // Mantém ajuste avulso legado pra display histórico
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

      // Calcular mensalidade — passar ajusteInicial explícito (setLapsAjusteValor só flush no próximo render)
      const ajusteInicial = ajusteData?.ajuste_avulso_valor != null
        ? parseFloat(String(ajusteData.ajuste_avulso_valor)) || 0
        : 0;
      calcularMensalidadeLaps(sel, taxaAdm, rateioVal, produtosRegional, ajusteInicial);
    } catch (err: any) {
      toast.error("Erro ao carregar LAPS: " + err.message);
    }
    setLapsLoading(false);
  };

  const calcularMensalidadeLaps = (
    selecionados: Record<string, boolean>,
    taxaAdm?: number,
    rateioVal?: number,
    produtosOverride?: any[],
    ajusteOverride?: number,
  ) => {
    const produtos = produtosOverride || lapsProdutosDisponiveis;
    const produtoIds = Object.entries(selecionados).filter(([, v]) => v).map(([k]) => k);
    const subtotal = produtos.filter(p => produtoIds.includes(p.id)).reduce((s, p) => s + (p.valor || 0), 0);
    // Prioridade: valor passado explicitamente > state atual (evita race condition no load inicial)
    const ajusteNum = ajusteOverride !== undefined ? ajusteOverride : (parseFloat(lapsAjusteValor) || 0);
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
      // Salvar desconto + acréscimo separados (substitui ajuste_avulso legado)
      const descontoNum = parseFloat(lapsDescontoValor) || 0;
      const acrescimoNum = parseFloat(lapsAcrescimoValor) || 0;
      await (supabase as any).from("veiculos").update({
        desconto_valor: descontoNum,
        desconto_desc: lapsDescontoDesc.trim() || null,
        acrescimo_valor: acrescimoNum,
        acrescimo_desc: lapsAcrescimoDesc.trim() || null,
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
    setOrigemData(null);

    // === Origem & vínculos (campos populados pelo gia-concluir-venda v3) ===
    const { data: veicFull } = await (supabase as any)
      .from("veiculos")
      .select(`
        id, renavam, cod_fipe, ano_fabricacao,
        taxa_administrativa_sga, valor_adicional_sga, desconto_valor, acrescimo_valor,
        consultor_venda_id, vistoria_id, contrato_id, negociacao_origem_id, voluntario_id,
        consultor:usuarios!veiculos_consultor_venda_id_fkey(id, nome, email, regional, cooperativa),
        voluntario:voluntarios!veiculos_voluntario_id_fkey(id, nome, email, funcao, telefone),
        vistoria:vistorias!veiculos_vistoria_id_fkey(id, status, created_at, ai_aprovada, ai_score, laudo_url, laudo_storage_path, laudo_aprovado_em),
        contrato:contratos!veiculos_contrato_id_fkey(id, numero, valor_mensal, status, autentique_link, autentique_status, pdf_storage_path, data_inicio, dia_vencimento),
        origem:negociacoes!veiculos_negociacao_origem_id_fkey(id, codigo, consultor, cooperativa, regional, venda_concluida_em, created_at)
      `)
      .eq("id", v.id)
      .maybeSingle();
    if (veicFull) setOrigemData(veicFull);

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
    const [boletosRes, sinistrosRes, docsRes, docsAssocRes, docsSgaRes] = await Promise.all([
      v.id
        ? supabase.from("boletos").select("id, nosso_numero, valor, vencimento, data_pagamento, valor_pagamento, status, referencia, codigo_banco, nome_banco, tipo, linha_digitavel, pix_copia_cola, pdf_storage_path, link_boleto, data_emissao, situacao_descricao").eq("veiculo_id", v.id).gte("vencimento", "2025-01-01").order("vencimento", { ascending: false }).limit(500)
        : Promise.resolve({ data: [] }),
      supabase.from("sinistros").select("*").eq("veiculo_id", v.id),
      supabase.from("vehicle_documents").select("*").eq("vehicle_id", v.id),
      v.associado_id
        ? (supabase as any).from("documentos_associado").select("*").or(`associado_id.eq.${v.associado_id},veiculo_id.eq.${v.id}`).order("created_at", { ascending: false })
        : (supabase as any).from("documentos_associado").select("*").eq("veiculo_id", v.id).order("created_at", { ascending: false }),
      v.placa
        ? (supabase as any).from("sga_arquivo_veiculo").select("id,arquivo_nome,arquivo_tipo,arquivo_data,storage_path,size_bytes,content_type,created_at").eq("placa", v.placa).not("downloaded_at", "is", null).order("arquivo_data", { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);
    const hoje = new Date().toISOString().slice(0,10);
    const statusLabel = (b: any) => {
      if (b.data_pagamento) return "Pago";
      if (b.status === "baixado" || b.status === "pago") return "Pago";
      if (b.vencimento && b.vencimento < hoje) return "Atrasado";
      return "Pendente";
    };
    const lancamentos = (boletosRes.data ?? []).map((b: any) => ({
      id: b.id,
      nTitulo: b.nosso_numero ?? "",
      nBanco: b.codigo_banco ?? "",
      tipo: b.tipo || "Mensalidade",
      banco: b.nome_banco ?? "",
      dtEmissao: b.data_emissao ?? "",
      dataVenc: b.vencimento ?? "",
      dataPgto: b.data_pagamento ?? "",
      valor: Number(b.valor ?? 0),
      valorPago: Number(b.valor_pagamento ?? (b.data_pagamento ? b.valor : 0)),
      parcela: b.referencia ?? "-",
      nControle: b.id?.slice(0, 8) ?? "",
      status: statusLabel(b),
      linhaDigitavel: b.linha_digitavel || "",
      pixCopiaCola: b.pix_copia_cola || "",
      pdfPath: b.pdf_storage_path || null,
      linkBoleto: b.link_boleto || "",
    }));
    const fornecedores = (sinistrosRes.data ?? []).map((s: any) => ({
      protocolo: s.id?.slice(0, 8) ?? "", fornecedor: "",
      produto: s.tipo ?? "", servico: s.tipo ?? "",
      motivo: s.descricao ?? "", situacao: s.status ?? "",
      dataAbertura: s.data_ocorrencia ?? "", dataFechamento: "",
    }));
    const documentosLegados = (docsRes.data ?? []).map((d: any) => ({
      nome: d.nome_arquivo ?? "", tipo: d.tipo ?? "",
      data: d.created_at ? new Date(d.created_at).toLocaleDateString("pt-BR") : "",
      storage_path: d.storage_path || null, bucket: "documentos", fonte: "legado",
    }));
    const documentosVendas = (docsAssocRes.data ?? []).map((d: any) => ({
      nome: d.titulo ?? d.storage_path?.split("/").pop() ?? "documento",
      tipo: (d.categoria || "doc").toUpperCase(),
      data: d.created_at ? new Date(d.created_at).toLocaleDateString("pt-BR") : "",
      storage_path: d.storage_path, bucket: d.bucket || "documentos", fonte: "vendas",
    }));
    const parseSgaData = (s: string | null): string => {
      if (!s) return "";
      const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/) || s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      return m ? s.slice(0, 10) : s;
    };
    const documentosSga = (docsSgaRes.data ?? []).map((d: any) => ({
      nome: d.arquivo_nome || d.storage_path?.split("/").pop() || "arquivo",
      tipo: d.arquivo_tipo || "SGA",
      data: parseSgaData(d.arquivo_data) || (d.created_at ? new Date(d.created_at).toLocaleDateString("pt-BR") : ""),
      storage_path: d.storage_path, bucket: "sga-arquivos", fonte: "sga",
    }));
    const documentos = [...documentosVendas, ...documentosLegados, ...documentosSga];
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
                            <TableCell className="text-sm font-medium">
                              {v.associado_id ? (
                                <button
                                  className="text-primary hover:underline text-left"
                                  onClick={() => navigate(`/gestao?tab=associado&sub=alterar&associado_id=${v.associado_id}`)}
                                  title="Abrir Consultar/Alterar Associado"
                                >
                                  {v.nome}
                                </button>
                              ) : (
                                v.nome
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-sm">{v.placa}</TableCell>
                            <TableCell className="text-xs">{v.regional}</TableCell>
                            <TableCell className="text-xs">{v.dataCadastro ? new Date(v.dataCadastro).toLocaleDateString("pt-BR") : "—"}</TableCell>
                            <TableCell className="text-xs">{v.dataContrato ? new Date(v.dataContrato).toLocaleDateString("pt-BR") : "—"}</TableCell>
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
            <TabsTrigger value="composicao" className="text-xs gap-1"><Calculator className="h-3 w-3" />Composição</TabsTrigger>
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
            <TabsTrigger value="historico-eventos" className="text-xs gap-1"><Clock className="h-3 w-3" />Histórico Eventos</TabsTrigger>
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

          {/* Origem da Venda (vínculos do módulo Vendas) */}
          {origemData && (origemData.origem || origemData.consultor || origemData.voluntario || origemData.vistoria || origemData.contrato) && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileSignature className="h-4 w-4 text-primary" />Origem da Venda
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Consultor (vendeu)</Label>
                    <p className="text-sm font-medium">{origemData.consultor?.nome || origemData.voluntario?.nome || origemData.origem?.consultor || "—"}</p>
                    {(origemData.consultor?.email || origemData.voluntario?.email) && (
                      <p className="text-xs text-muted-foreground">{origemData.consultor?.email || origemData.voluntario?.email}</p>
                    )}
                    {origemData.voluntario?.funcao && !origemData.consultor && (
                      <p className="text-xs text-muted-foreground">{origemData.voluntario.funcao}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Cooperativa</Label>
                    <p className="text-sm font-medium">{origemData.consultor?.cooperativa || origemData.origem?.cooperativa || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Regional</Label>
                    <p className="text-sm font-medium">{origemData.consultor?.regional || origemData.origem?.regional || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Venda concluída em</Label>
                    <p className="text-sm font-medium">
                      {origemData.origem?.venda_concluida_em
                        ? new Date(origemData.origem.venda_concluida_em).toLocaleDateString("pt-BR")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Renavam</Label>
                    <p className="text-sm font-mono">{origemData.renavam || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Cód. FIPE</Label>
                    <p className="text-sm font-mono">{origemData.cod_fipe || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Ano Fabricação</Label>
                    <p className="text-sm font-medium">{origemData.ano_fabricacao || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Negociação</Label>
                    {origemData.origem ? (
                      <p className="text-sm font-mono">{origemData.origem.codigo || origemData.origem.id?.slice(0,8)}</p>
                    ) : <p className="text-sm text-muted-foreground">—</p>}
                  </div>
                </div>

                {/* Vistoria */}
                {origemData.vistoria && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium">Vistoria</span>
                        <StatusBadge status={origemData.vistoria.status || "pendente"} />
                        {origemData.vistoria.ai_aprovada != null && (
                          <Badge variant={origemData.vistoria.ai_aprovada ? "default" : "destructive"} className="text-xs">
                            IA {origemData.vistoria.ai_aprovada ? "aprovou" : "rejeitou"}
                            {origemData.vistoria.ai_score != null && ` (${Number(origemData.vistoria.ai_score).toFixed(0)}%)`}
                          </Badge>
                        )}
                      </div>
                      {origemData.vistoria.laudo_url && (
                        <a href={origemData.vistoria.laudo_url} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline" className="gap-1"><Download className="h-3.5 w-3.5" />Laudo PDF</Button>
                        </a>
                      )}
                    </div>
                    {origemData.vistoria.laudo_aprovado_em && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Laudo aprovado em {new Date(origemData.vistoria.laudo_aprovado_em).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                )}

                {/* Contrato + Autentique */}
                {origemData.contrato && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <FileSignature className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium">Contrato {origemData.contrato.numero || ""}</span>
                        <StatusBadge status={origemData.contrato.status || "—"} />
                        {origemData.contrato.autentique_status && (
                          <Badge variant="secondary" className="text-xs">Autentique: {origemData.contrato.autentique_status}</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {origemData.contrato.autentique_link && (
                          <a href={origemData.contrato.autentique_link} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="outline" className="gap-1"><Eye className="h-3.5 w-3.5" />Assinatura</Button>
                          </a>
                        )}
                        {origemData.contrato.pdf_storage_path && (
                          <a
                            href={`${(supabase as any).storage?.from?.("documentos")?.getPublicUrl?.(origemData.contrato.pdf_storage_path)?.data?.publicUrl || ""}`}
                            target="_blank" rel="noreferrer"
                          >
                            <Button size="sm" variant="outline" className="gap-1"><Download className="h-3.5 w-3.5" />PDF</Button>
                          </a>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Valor mensal R$ {Number(origemData.contrato.valor_mensal || 0).toFixed(2).replace(".", ",")}
                      {origemData.contrato.dia_vencimento && ` · vence dia ${origemData.contrato.dia_vencimento}`}
                    </p>
                  </div>
                )}

                {/* Ajustes / mirrors SGA */}
                {(origemData.taxa_administrativa_sga || origemData.valor_adicional_sga || origemData.desconto_valor || origemData.acrescimo_valor) && (
                  <div className="pt-3 border-t grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Taxa admin</Label>
                      <p className="text-sm font-medium">R$ {Number(origemData.taxa_administrativa_sga || 0).toFixed(2).replace(".", ",")}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Adicional</Label>
                      <p className="text-sm font-medium">R$ {Number(origemData.valor_adicional_sga || 0).toFixed(2).replace(".", ",")}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Acréscimo</Label>
                      <p className="text-sm font-medium">R$ {Number(origemData.acrescimo_valor || 0).toFixed(2).replace(".", ",")}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Desconto</Label>
                      <p className="text-sm font-medium">R$ {Number(origemData.desconto_valor || 0).toFixed(2).replace(".", ",")}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB COMPOSIÇÃO - breakdown oficial via gia-calculo-mensalidade v2 (fonte única) */}
        <TabsContent value="composicao" className="mt-4">
          <ComposicaoTab veiculoId={sel.id} />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end mb-4">
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
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end p-3 bg-muted/30 rounded">
                    <div>
                      <Label className="text-xs">Motivo Ajuste</Label>
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
                          calcularMensalidadeLaps(lapsSelecionados, undefined, undefined, undefined, parseFloat(e.target.value) || 0);
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
                  <TableHead>Nº Título</TableHead><TableHead>Banco</TableHead>
                  <TableHead>Dt Emissão</TableHead><TableHead>Vencimento</TableHead><TableHead>Pagamento</TableHead>
                  <TableHead>Valor</TableHead><TableHead>Valor Pago</TableHead><TableHead>Referência</TableHead>
                  <TableHead>Status</TableHead><TableHead>Linha digitável</TableHead><TableHead className="text-right">Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {sel.lancamentos.length === 0 ? (
                    <TableRow><TableCell colSpan={11} className="text-center text-sm text-muted-foreground py-8">Nenhum boleto encontrado para esta placa a partir de 01/01/2025.</TableCell></TableRow>
                  ) : sel.lancamentos.map((l, i) => (
                    <TableRow key={l.id ?? i}>
                      <TableCell className="text-xs font-mono">{l.nTitulo}</TableCell>
                      <TableCell className="text-xs">{l.banco || l.nBanco || "-"}</TableCell>
                      <TableCell className="text-xs">{l.dtEmissao ? new Date(l.dtEmissao).toLocaleDateString("pt-BR") : "-"}</TableCell>
                      <TableCell className="text-xs">{l.dataVenc ? new Date(l.dataVenc).toLocaleDateString("pt-BR") : "-"}</TableCell>
                      <TableCell className="text-xs">{l.dataPgto ? new Date(l.dataPgto).toLocaleDateString("pt-BR") : "-"}</TableCell>
                      <TableCell className="text-xs">R$ {l.valor.toFixed(2).replace(".",",")}</TableCell>
                      <TableCell className="text-xs">R$ {l.valorPago.toFixed(2).replace(".",",")}</TableCell>
                      <TableCell className="text-xs">{l.parcela}</TableCell>
                      <TableCell><Badge variant="outline" className={`${finBadge(l.status)} text-xs`}>{l.status}</Badge></TableCell>
                      <TableCell className="text-xs font-mono max-w-[180px]">
                        {l.linhaDigitavel ? (
                          <button
                            title={l.linhaDigitavel}
                            onClick={() => { navigator.clipboard.writeText(l.linhaDigitavel!); toast.success("Linha digitável copiada"); }}
                            className="truncate block w-full text-left hover:text-primary"
                          >{l.linhaDigitavel}</button>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {l.pixCopiaCola && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Copiar Pix"
                              onClick={() => { navigator.clipboard.writeText(l.pixCopiaCola!); toast.success("Pix copia-e-cola copiado"); }}>
                              <DollarSign className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Abrir PDF" disabled={!l.pdfPath && !l.linkBoleto}
                            onClick={async () => {
                              if (l.pdfPath) {
                                const { data, error } = await supabase.storage.from("sga-boletos").createSignedUrl(l.pdfPath, 3600);
                                if (error || !data?.signedUrl) { toast.error("Falha ao abrir PDF"); return; }
                                window.open(data.signedUrl, "_blank");
                              } else if (l.linkBoleto) {
                                window.open(l.linkBoleto, "_blank");
                              }
                            }}>
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
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
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Origem</TableHead><TableHead>Data</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {sel.documentos.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">Nenhum documento.</TableCell></TableRow>
                )}
                {sel.documentos.map((d, i) => {
                  const isPrivate = d.bucket === "sga-arquivos";
                  const publicUrl = !isPrivate && d.storage_path && d.bucket
                    ? (supabase as any).storage?.from?.(d.bucket)?.getPublicUrl?.(d.storage_path)?.data?.publicUrl
                    : null;
                  const openSigned = async (download: boolean) => {
                    if (!d.storage_path || !d.bucket) return;
                    const { data, error } = await supabase.storage.from(d.bucket).createSignedUrl(d.storage_path, 3600, download ? { download: d.nome || true } : undefined);
                    if (error || !data?.signedUrl) { toast.error("Falha ao abrir arquivo"); return; }
                    window.open(data.signedUrl, "_blank", "noopener");
                  };
                  const fonteLabel = d.fonte === "vendas" ? "Vendas" : "Legado";
                  const fonteVariant = d.fonte === "vendas" ? "default" : "secondary";
                  return (
                    <TableRow key={`${d.fonte}-${i}`}>
                      <TableCell className="text-sm">{d.nome}</TableCell>
                      <TableCell><Badge variant="outline">{d.tipo}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={fonteVariant as any} className="text-xs">{fonteLabel}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{d.data}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {publicUrl && (
                            <>
                              <a href={publicUrl} target="_blank" rel="noreferrer"><Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button></a>
                              <a href={publicUrl} download><Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button></a>
                            </>
                          )}
                          {isPrivate && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openSigned(false)}><Eye className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openSigned(true)}><Download className="h-3.5 w-3.5" /></Button>
                            </>
                          )}
                          {d.fonte === "legado" && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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

        {/* TAB HISTÓRICO EVENTOS (sync CRM Eventos → GIA) */}
        <TabsContent value="historico-eventos" className="mt-4">
          <HistoricoEventosList veiculoId={sel.id} placa={sel.placa} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ComposicaoTab — chama gia-calculo-mensalidade (fonte única Vendas↔Gestão)
// ═══════════════════════════════════════════════════════════
function ComposicaoTab({ veiculoId }: { veiculoId: string }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["composicao", veiculoId],
    enabled: !!veiculoId,
    queryFn: async () => {
      const res = await callEdge("gia-calculo-mensalidade", { veiculo_id: veiculoId });
      if (!res?.sucesso) throw new Error(res?.error || "Falha ao calcular");
      return res;
    },
  });

  if (isLoading) return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Calculando composição...</CardContent></Card>;
  if (!data?.sucesso) return <Card><CardContent className="p-8 text-center text-sm text-destructive">Erro ao calcular mensalidade.</CardContent></Card>;

  const c = data.composicao;
  const fmt = (n: number) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;

  const fonteTaxaLabel: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    sga_mirror: { label: "mirror SGA", variant: "secondary" },
    faixas_fipe: { label: "faixas FIPE", variant: "default" },
    tabela_precos: { label: "tabela preços", variant: "default" },
    zero: { label: "zero", variant: "outline" },
  };

  return (
    <div className="space-y-4">
      {/* Header com veículo + plano */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Veículo</p>
              <p className="text-base font-semibold">{data.veiculo?.placa} · {data.veiculo?.marca} {data.veiculo?.modelo}</p>
              <p className="text-xs text-muted-foreground mt-1">
                FIPE {fmt(data.veiculo?.valor_fipe || 0)} · {data.veiculo?.grupo?.nome || "sem plano"} · {data.veiculo?.regional?.nome || "sem regional"}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => refetch()} className="gap-1">
              <Calculator className="h-3.5 w-3.5" />Recalcular
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Calculator className="h-4 w-4 text-primary" />Composição da Mensalidade</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="w-24 text-right">Valor</TableHead></TableRow></TableHeader>
            <TableBody>
              {c.produtos.length === 0 && (
                <TableRow><TableCell colSpan={2} className="text-center text-xs text-muted-foreground py-4">Nenhum produto vinculado</TableCell></TableRow>
              )}
              {c.produtos.map((p: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="text-sm pl-8">
                    {p.nome || p.produto_id}
                  </TableCell>
                  <TableCell className="text-sm text-right font-mono">{fmt(p.valor)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30">
                <TableCell className="text-sm font-medium">Subtotal produtos</TableCell>
                <TableCell className="text-sm text-right font-mono font-medium">{fmt(c.subtotal_produtos)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-sm">
                  Taxa administrativa
                  <Badge variant={fonteTaxaLabel[c.fonte_taxa]?.variant || "outline"} className="ml-2 text-xs">
                    {fonteTaxaLabel[c.fonte_taxa]?.label || c.fonte_taxa}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-right font-mono">+ {fmt(c.taxa_administrativa)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-sm">
                  Rateio
                  <Badge variant={fonteTaxaLabel[c.fonte_rateio]?.variant || "outline"} className="ml-2 text-xs">
                    {fonteTaxaLabel[c.fonte_rateio]?.label || c.fonte_rateio}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-right font-mono">+ {fmt(c.rateio)}</TableCell>
              </TableRow>
              {c.valor_adicional !== 0 && (
                <TableRow>
                  <TableCell className="text-sm">Valor adicional (OUTROS)</TableCell>
                  <TableCell className="text-sm text-right font-mono">{c.valor_adicional >= 0 ? "+ " : "− "}{fmt(Math.abs(c.valor_adicional))}</TableCell>
                </TableRow>
              )}
              {c.acrescimo > 0 && (
                <TableRow>
                  <TableCell className="text-sm">
                    Acréscimo manual
                    {data.ajustes_descricao?.acrescimo_desc && <p className="text-xs text-muted-foreground mt-0.5">{data.ajustes_descricao.acrescimo_desc}</p>}
                  </TableCell>
                  <TableCell className="text-sm text-right font-mono text-warning">+ {fmt(c.acrescimo)}</TableCell>
                </TableRow>
              )}
              {c.desconto > 0 && (
                <TableRow>
                  <TableCell className="text-sm">
                    Desconto manual
                    {data.ajustes_descricao?.desconto_desc && <p className="text-xs text-muted-foreground mt-0.5">{data.ajustes_descricao.desconto_desc}</p>}
                  </TableCell>
                  <TableCell className="text-sm text-right font-mono text-success">− {fmt(c.desconto)}</TableCell>
                </TableRow>
              )}
              <TableRow className="bg-primary/5 border-t-2">
                <TableCell className="text-base font-bold">TOTAL MENSAL</TableCell>
                <TableCell className="text-base text-right font-mono font-bold">{fmt(c.total)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Editar ajuste manual (acréscimo/desconto) */}
      <AjusteManualEditor veiculoId={veiculoId} onSaved={() => refetch()} />

      {/* Histórico últimos boletos */}
      {data.historico_ultimos_boletos?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />Últimos boletos do associado</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Vencimento</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.historico_ultimos_boletos.map((b: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{b.vencimento ? new Date(b.vencimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell className="text-sm font-mono">{fmt(b.valor)}</TableCell>
                    <TableCell><StatusBadge status={b.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// AjusteManualEditor — editor inline acréscimo/desconto
// ═══════════════════════════════════════════════════════════
function AjusteManualEditor({ veiculoId, onSaved }: { veiculoId: string; onSaved: () => void }) {
  const [acrescimoValor, setAcrescimoValor] = useState("");
  const [acrescimoDesc, setAcrescimoDesc] = useState("");
  const [descontoValor, setDescontoValor] = useState("");
  const [descontoDesc, setDescontoDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("veiculos")
        .select("acrescimo_valor, acrescimo_desc, desconto_valor, desconto_desc")
        .eq("id", veiculoId).maybeSingle();
      if (data) {
        setAcrescimoValor(data.acrescimo_valor ? String(data.acrescimo_valor) : "");
        setAcrescimoDesc(data.acrescimo_desc || "");
        setDescontoValor(data.desconto_valor ? String(data.desconto_valor) : "");
        setDescontoDesc(data.desconto_desc || "");
      }
      setLoaded(true);
    })();
  }, [veiculoId]);

  if (!loaded) return null;

  const salvar = async () => {
    setSaving(true);
    const { error } = await supabase.from("veiculos").update({
      acrescimo_valor: Number(acrescimoValor) || 0,
      acrescimo_desc: acrescimoDesc || null,
      desconto_valor: Number(descontoValor) || 0,
      desconto_desc: descontoDesc || null,
      updated_at: new Date().toISOString(),
    } as any).eq("id", veiculoId);
    setSaving(false);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Ajuste salvo"); onSaved(); }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><Pencil className="h-4 w-4 text-primary" />Ajuste Manual (acréscimo/desconto)</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <p className="text-xs text-muted-foreground">Divergência de valor vs SGA/Power vira acréscimo ou desconto aqui — recalcula total na hora.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">+ Acréscimo (R$)</Label>
            <Input type="number" step="0.01" min="0" value={acrescimoValor} onChange={e => setAcrescimoValor(e.target.value)} placeholder="0,00" />
            <Input value={acrescimoDesc} onChange={e => setAcrescimoDesc(e.target.value)} placeholder="Motivo do acréscimo" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">− Desconto (R$)</Label>
            <Input type="number" step="0.01" min="0" value={descontoValor} onChange={e => setDescontoValor(e.target.value)} placeholder="0,00" />
            <Input value={descontoDesc} onChange={e => setDescontoDesc(e.target.value)} placeholder="Motivo do desconto" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={salvar} disabled={saving} className="gap-1.5"><Save className="h-4 w-4" />{saving ? "Salvando..." : "Salvar e recalcular"}</Button>
        </div>
      </CardContent>
    </Card>
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
