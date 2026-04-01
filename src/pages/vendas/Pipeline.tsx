import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus, LayoutGrid, List, Search, Filter, X, Eye, MoreVertical,
  ArrowUpDown, GripVertical, Car, User, Calendar, Clock, Download,
  ChevronLeft, ChevronRight, Pencil, ArrowRight, Archive,
  CheckCircle, AlertCircle, Shield, Send, Radio, AlertTriangle, DollarSign,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  PipelineDeal, PipelineStage, stageColumns, DRAG_ALLOWED,
  consultores, gerentes, cooperativas, regionais, planos,
} from "./pipeline/mockData";
import DealDetailModal from "./pipeline/DealDetailModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, callEdge } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePermission, useLeadScope } from "@/hooks/usePermission";
import ConcretizarVendaModal from "./ConcretizarVendaModal";
import { useNegociacoes } from "@/hooks/useNegociacoes";

function daysStalled(updated: string) {
  return Math.floor((Date.now() - new Date(updated).getTime()) / 86400000);
}

function stallLabel(days: number) {
  if (days < 1) return "Hoje";
  if (days === 1) return "1 dia";
  return `${days} dias`;
}

function StalledBadge({ days }: { days: number }) {
  const label = stallLabel(days);
  if (days < 1) return <Badge className="bg-success/15 text-success border-green-300 text-[9px] px-1.5 py-0">{label}</Badge>;
  if (days <= 3) return <Badge className="bg-warning/10 text-warning border-warning/30 text-[9px] px-1.5 py-0">{label}</Badge>;
  return <Badge className="bg-destructive/15 text-destructive border-red-300 text-[9px] px-1.5 py-0">{label}</Badge>;
}

type SortKey = "id" | "lead_nome" | "veiculo_modelo" | "plano" | "stage" | "consultor" | "cooperativa" | "regional" | "created_at" | "updated_at";

export default function Pipeline() {
  const { canLiberarCadastro, canConcretizarVenda } = usePermission();
  const leadScope = useLeadScope();
  const queryClient = useQueryClient();
  const [concretizarDeal, setConcretizarDeal] = useState<PipelineDeal | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [detailDeal, setDetailDeal] = useState<PipelineDeal | null>(null);

  // Busca multi-critério
  const [busca, setBusca] = useState({ placa: "", nome: "", codigo: "" });

  // Filters
  const [fConsultor, setFConsultor] = useState("all");
  const [fGerente, setFGerente] = useState("all");
  const [fCoop, setFCoop] = useState("all");
  const [fRegional, setFRegional] = useState("all");
  const [fEtapa, setFEtapa] = useState("all");
  const [fDateStart, setFDateStart] = useState("");
  const [fDateEnd, setFDateEnd] = useState("");
  const [fDateType, setFDateType] = useState("created_at");
  const [showFilters, setShowFilters] = useState(false);

  // List view
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Masks
  function maskCpfCnpj(v: string) {
    const d = v.replace(/\D/g, "");
    if (d.length <= 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, e) => e ? `${a}.${b}.${c}-${e}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a);
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (_, a, b, c, e, f) => f ? `${a}.${b}.${c}/${e}-${f}` : e ? `${a}.${b}.${c}/${e}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a);
  }
  function maskTelefone(v: string) {
    const d = v.replace(/\D/g, "");
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, a, b, c) => c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a ? `(${a}` : "");
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) => c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a ? `(${a}` : "");
  }
  function maskPlaca(v: string) {
    const clean = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length <= 3) return clean;
    return clean.slice(0, 3) + "-" + clean.slice(3, 7);
  }

  // New deal form
  const [form, setForm] = useState({ lead_nome: "", cpf_cnpj: "", telefone: "", email: "", placa: "", modelo: "", anoModelo: "", anoFab: "", plano: "", cooperativa: "", regional: "", consultor: "", observacoes: "" });
  const [formTouched, setFormTouched] = useState({ lead_nome: false, telefone: false });

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  // Hook de negociações (Supabase real)
  const { negociacoes, loading: negociacoesLoading, create: createNegociacao, update: updateNegociacao } = useNegociacoes();

  // Dados reais de cooperativas com regional vinculada
  const { data: cooperativasDb } = useQuery({
    queryKey: ["cooperativas_com_regional"],
    queryFn: async () => {
      const { data } = await supabase.from("cooperativas" as any).select("id, nome, regional_id, regionais(id, nome)").eq("ativa", true).order("nome");
      return (data || []) as any[];
    },
  });
  const { data: regionaisDb } = useQuery({
    queryKey: ["regionais_db"],
    queryFn: async () => {
      const { data } = await supabase.from("regionais").select("id, nome").order("nome");
      return (data || []) as any[];
    },
  });
  const { data: usuariosReais } = useQuery({
    queryKey: ["usuarios_reais"],
    queryFn: async () => {
      const { data } = await supabase.from("usuarios").select("nome, funcao, cooperativa, regional, gerente").eq("status", "ativo");
      return data || [];
    },
  });
  const consultoresReais = [...new Set((usuariosReais || []).map((u: any) => u.nome).filter(Boolean))];

  // Carregar planos reais do banco
  const { data: planosDb } = useQuery({
    queryKey: ["planos_gia_db"],
    queryFn: async () => {
      const { data } = await supabase.from("planos_gia").select("nome").eq("ativo", true).order("nome");
      return (data || []).map((p: any) => p.nome);
    },
  });

  const cooperativasLista = cooperativasDb && cooperativasDb.length > 0 ? cooperativasDb.map((c: any) => c.nome) : cooperativas;
  const regionaisLista = regionaisDb && regionaisDb.length > 0 ? regionaisDb.map((r: any) => r.nome) : regionais;
  const consultoresLista = consultoresReais.length > 0 ? consultoresReais : consultores;
  const planosLista = planosDb && planosDb.length > 0 ? planosDb : planos;

  // Ao selecionar cooperativa → preencher regional automaticamente
  function handleCooperativaChange(coopNome: string) {
    setForm(f => {
      const coop = (cooperativasDb || []).find((c: any) => c.nome === coopNome);
      const regionalNome = coop?.regionais?.nome || f.regional;
      return { ...f, cooperativa: coopNome, regional: regionalNome };
    });
  }

  // Supabase leads query with busca + RBAC scope
  const { data: leadsData } = useQuery({
    queryKey: ["leads", busca, leadScope],
    queryFn: async () => {
      let query = supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (busca.placa) query = query.eq("placa", busca.placa.toUpperCase().replace(/\s/g, '') as any);
      if (busca.nome && busca.nome.length >= 3) query = query.ilike("nome", `%${busca.nome}%` as any);
      if (busca.codigo) query = query.eq("codigo_negociacao", busca.codigo as any);
      if (leadScope.usuario_id) query = query.eq("usuario_id", leadScope.usuario_id as any);
      if (leadScope.unidade_id) query = query.eq("unidade_id", leadScope.unidade_id as any);
      const { data, error } = await query;
      if (error) return [];
      return data || [];
    },
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (id.startsWith("p")) return;
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const createLead = useMutation({
    mutationFn: async (data: typeof form) => {
      // Criar na tabela negociacoes (nova)
      const { error: negError } = await createNegociacao({
        lead_nome: data.lead_nome,
        telefone: data.telefone,
        email: data.email || undefined,
        cpf_cnpj: data.cpf_cnpj || undefined,
        veiculo_modelo: data.modelo || undefined,
        veiculo_placa: data.placa ? data.placa.toUpperCase().replace(/\s/g, "") : undefined,
        plano: data.plano || undefined,
        cooperativa: data.cooperativa || undefined,
        regional: data.regional || undefined,
        consultor: data.consultor || undefined,
        observacoes: data.observacoes || undefined,
        stage: "novo_lead",
        origem: "Manual",
        enviado_sga: false,
        visualizacoes_proposta: 0,
        status_icons: { aceita: false, pendente: true, aprovada: false, sga: false, rastreador: false, inadimplencia: false },
      });
      if (negError) {
        // Fallback: criar na tabela leads (antiga)
        const { error } = await supabase.from("leads").insert({
          nome: data.lead_nome,
          telefone: data.telefone,
          email: data.email || null,
          cpf: data.cpf_cnpj || null,
          veiculo_interesse: data.modelo || null,
          plano_interesse: data.plano || null,
          consultor_nome: data.consultor || null,
          observacoes: data.observacoes || null,
          status: "novo_lead",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setNewDealOpen(false);
      toast.success("Negociação criada com sucesso!");
      setForm({ lead_nome: "", cpf_cnpj: "", telefone: "", email: "", placa: "", modelo: "", anoModelo: "", anoFab: "", plano: "", cooperativa: "", regional: "", consultor: "", observacoes: "" });
      setFormTouched({ lead_nome: false, telefone: false });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Map negociacoes (Supabase real) → PipelineDeal
  const negociacoesAsDeal: PipelineDeal[] = negociacoes.map(n => ({
    id: n.id,
    codigo: n.codigo || `NEG-${new Date(n.created_at).getFullYear()}-${n.id.slice(-4).toUpperCase()}`,
    lead_nome: n.lead_nome,
    cpf_cnpj: n.cpf_cnpj || "",
    telefone: n.telefone || "",
    email: n.email || "",
    veiculo_modelo: n.veiculo_modelo || "",
    veiculo_placa: n.veiculo_placa || "",
    plano: n.plano || "",
    valor_plano: n.valor_plano || 0,
    stage: (n.stage as PipelineStage) || "novo_lead",
    consultor: n.consultor || "",
    cooperativa: n.cooperativa || "",
    regional: n.regional || "",
    gerente: n.gerente || "",
    origem: n.origem || "Manual",
    observacoes: n.observacoes || "",
    enviado_sga: n.enviado_sga || false,
    visualizacoes_proposta: n.visualizacoes_proposta || 0,
    status_icons: (n.status_icons as any) || { aceita: false, pendente: true, aprovada: false, sga: false, rastreador: false, inadimplencia: false },
    created_at: n.created_at,
    updated_at: n.updated_at,
  }));

  // Map leads data (tabela antiga)
  const leadsAsDeal: PipelineDeal[] = (leadsData || []).map(l => ({
    id: l.id,
    codigo: (l as any).codigo_negociacao || `NEG-${new Date(l.created_at).getFullYear()}-${l.id.slice(-3).toUpperCase()}`,
    lead_nome: l.nome,
    cpf_cnpj: l.cpf || "",
    telefone: l.telefone,
    email: l.email || "",
    veiculo_modelo: l.veiculo_interesse || "",
    veiculo_placa: "",
    plano: l.plano_interesse || "",
    valor_plano: 0,
    stage: (l.status as PipelineStage) || "novo_lead",
    consultor: l.consultor_nome || "",
    cooperativa: "",
    regional: "",
    gerente: "",
    origem: "Manual",
    observacoes: l.observacoes || "",
    enviado_sga: false,
    visualizacoes_proposta: 0,
    status_icons: { aceita: false, pendente: true, aprovada: false, sga: false, rastreador: false, inadimplencia: false },
    created_at: l.created_at,
    updated_at: l.updated_at,
  }));

  // Prioridade: negociacoes (nova tabela) > leads (tabela antiga)
  const dealsToShow: PipelineDeal[] = negociacoesAsDeal.length > 0
    ? negociacoesAsDeal
    : leadsAsDeal;

  const activeFilterCount = [fConsultor !== "all", fGerente !== "all", fCoop !== "all", fRegional !== "all", fEtapa !== "all", !!fDateStart, !!fDateEnd].filter(Boolean).length;

  const filtered = useMemo(() => {
    return dealsToShow.filter(d => {
      if (fConsultor !== "all" && d.consultor !== fConsultor) return false;
      if (fGerente !== "all" && d.gerente !== fGerente) return false;
      if (fCoop !== "all" && d.cooperativa !== fCoop) return false;
      if (fRegional !== "all" && d.regional !== fRegional) return false;
      if (fEtapa !== "all" && d.stage !== fEtapa) return false;
      const dateField = fDateType === "created_at" ? d.created_at : d.updated_at;
      if (fDateStart && dateField < fDateStart) return false;
      if (fDateEnd && dateField > fDateEnd + "T23:59:59") return false;
      return true;
    });
  }, [dealsToShow, fConsultor, fGerente, fCoop, fRegional, fEtapa, fDateStart, fDateEnd, fDateType]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const paged = sorted.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(sorted.length / perPage);

  function clearFilters() {
    setFConsultor("all"); setFGerente("all"); setFCoop("all"); setFRegional("all"); setFEtapa("all"); setFDateStart(""); setFDateEnd("");
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function handleDragStart(e: React.DragEvent, id: string) { setDraggedId(id); e.dataTransfer.effectAllowed = "move"; }
  function handleDragOver(e: React.DragEvent, stage: PipelineStage) {
    if (!draggedId) return;
    const source = dealsToShow.find(d => d.id === draggedId);
    if (!source || !DRAG_ALLOWED[source.stage]?.includes(stage)) return;
    e.preventDefault(); setDragOverStage(stage);
  }
  async function handleDrop(stage: PipelineStage) {
    if (draggedId) {
      const source = dealsToShow.find(d => d.id === draggedId);
      if (!source || !DRAG_ALLOWED[source.stage]?.includes(stage)) {
        setDraggedId(null); setDragOverStage(null);
        toast.error(`Não é permitido mover de "${source?.stage}" para "${stage}"`);
        return;
      }
      const isNegociacao = negociacoes.some(n => n.id === draggedId);
      if (isNegociacao) {
        const { error } = await updateNegociacao(draggedId, { stage });
        if (error) toast.error("Erro ao mover negociação");
      } else {
        await updateLeadStatus.mutateAsync({ id: draggedId, status: stage });
      }
    }
    setDraggedId(null); setDragOverStage(null);
  }

  async function handleLiberarCadastro(deal: PipelineDeal) {
    const isNegociacao = negociacoes.some(n => n.id === deal.id);
    if (isNegociacao) {
      const { error } = await updateNegociacao(deal.id, { stage: "liberado_cadastro" });
      if (error) { toast.error("Erro ao liberar cadastro"); return; }
    } else {
      await updateLeadStatus.mutateAsync({ id: deal.id, status: "liberado_cadastro" });
    }
    toast.success("Lead liberado para cadastro!");
  }

  const formNomeInvalid = formTouched.lead_nome && !form.lead_nome.trim();
  const formTelInvalid = formTouched.telefone && !form.telefone.trim();
  const canCreateDeal = form.lead_nome.trim().length > 0 && form.telefone.trim().length > 0;

  function handleNewDeal() {
    setFormTouched({ lead_nome: true, telefone: true });
    if (!canCreateDeal) return;
    createLead.mutate(form);
  }

  const stageLabel = (s: PipelineStage) => stageColumns.find(c => c.key === s)?.label || s;
  const stageColor = (s: PipelineStage) => stageColumns.find(c => c.key === s)?.color || "#888";

  return (
    <div className="space-y-4">
      {/* Header — barra com fundo azul escuro */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-[#1A3A5C] rounded-xl px-5 py-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Pipeline</h1>
          <p className="text-sm text-white/60">Funil de vendas — gerencie suas negociações</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-white/20 rounded-lg overflow-hidden">
            <Button size="icon" variant={viewMode === "kanban" ? "default" : "ghost"} className="rounded-none h-8 w-8 text-white hover:bg-white/10" onClick={() => setViewMode("kanban")}><LayoutGrid className="h-4 w-4" /></Button>
            <Button size="icon" variant={viewMode === "list" ? "default" : "ghost"} className="rounded-none h-8 w-8 text-white hover:bg-white/10" onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* Filtros — card único azul, sempre visível */}
      <Card className="bg-[#2c4a86] border-[#2c4a86] text-white [&_label]:text-white/80">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-white/70" />
            <span className="text-sm font-semibold text-white/90">Filtros</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="space-y-1"><Label className="text-xs">Placa</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50" />
                <Input className="h-8 text-xs pl-7 bg-white/10 border-white/20 text-white placeholder:text-white/40" placeholder="ABC1234" value={busca.placa}
                  onChange={e => setBusca(b => ({ ...b, placa: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Nome do Associado</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50" />
                <Input className="h-8 text-xs pl-7 bg-white/10 border-white/20 text-white placeholder:text-white/40" placeholder="Mín. 3 caracteres" value={busca.nome}
                  onChange={e => setBusca(b => ({ ...b, nome: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Consultor</Label>
              <Select value={fConsultor} onValueChange={setFConsultor}><SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todos</SelectItem>{consultoresLista.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Etapa</Label>
              <Select value={fEtapa} onValueChange={setFEtapa}><SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todas</SelectItem>{stageColumns.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Cooperativa</Label>
              <Select value={fCoop} onValueChange={setFCoop}><SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todas</SelectItem>{cooperativasLista.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Regional</Label>
              <Select value={fRegional} onValueChange={setFRegional}><SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todas</SelectItem>{regionaisLista.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Gerente</Label>
              <Select value={fGerente} onValueChange={setFGerente}><SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todos</SelectItem>{gerentes.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Data Início</Label><Input type="date" className="h-8 text-xs bg-white/10 border-white/20 text-white" value={fDateStart} onChange={e => setFDateStart(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Data Fim</Label><Input type="date" className="h-8 text-xs bg-white/10 border-white/20 text-white" value={fDateEnd} onChange={e => setFDateEnd(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Tipo Data</Label>
              <Select value={fDateType} onValueChange={setFDateType}><SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="created_at">Data Criação</SelectItem><SelectItem value="updated_at">Última Movimentação</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={clearFilters}><X className="h-3 w-3 mr-1" />Limpar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KANBAN VIEW */}
      {viewMode === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ minHeight: "70vh" }}>
          {stageColumns.map(col => {
            const colDeals = filtered.filter(d => d.stage === col.key);
            const isOver = dragOverStage === col.key;
            return (
              <div
                key={col.key}
                className={`flex flex-col rounded-xl overflow-hidden min-w-[260px] w-[260px] shrink-0 transition-all bg-muted/40 border border-border/50 ${isOver ? "ring-2 shadow-lg" : "shadow-sm"}`}
                onDragOver={e => handleDragOver(e, col.key)}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={() => handleDrop(col.key)}
              >
                <div className="px-0 pt-0 pb-2">
                  <div className="flex items-center justify-between rounded-t-xl px-4 py-2.5" style={{ backgroundColor: col.color }}>
                    <span className="text-sm font-bold text-white tracking-wide">{col.label}</span>
                    <Badge className="text-[10px] h-5 px-1.5 bg-white/20 text-white border-white/30">{colDeals.length}</Badge>
                  </div>
                </div>
                <ScrollArea className="flex-1 px-2 pb-2">
                  <div className="space-y-2">
                    {colDeals.map(deal => {
                      const days = daysStalled(deal.updated_at);
                      const si = deal.status_icons;
                      return (
                        <div
                          key={deal.id}
                          draggable
                          onDragStart={e => handleDragStart(e, deal.id)}
                          onClick={() => setDetailDeal(deal)}
                          className={`kanban-card group bg-card border-2 border-[#747474] border-l-4 rounded-lg cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 ${draggedId === deal.id ? "opacity-80 ring-2 ring-primary" : ""}`}
                          style={{ borderLeftColor: col.color }}
                        >
                          <div className="p-3 space-y-1.5">
                            {/* Header: nome + código + menu */}
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-[13px] font-semibold leading-tight">{deal.lead_nome}</p>
                                <span className="text-[10px] font-mono text-muted-foreground">{deal.codigo}</span>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}><MoreVertical className="h-3.5 w-3.5" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setDetailDeal(deal)}><Eye className="h-3.5 w-3.5 mr-2" />Ver Detalhes</DropdownMenuItem>
                                  <DropdownMenuItem><ArrowRight className="h-3.5 w-3.5 mr-2" />Mover Etapa</DropdownMenuItem>
                                  <DropdownMenuItem><User className="h-3.5 w-3.5 mr-2" />Transferir Consultor</DropdownMenuItem>
                                  <DropdownMenuItem><Archive className="h-3.5 w-3.5 mr-2" />Arquivar</DropdownMenuItem>
                                  {canLiberarCadastro && deal.stage !== "liberado_cadastro" && deal.stage !== "concluido" && deal.stage !== "perdido" && (
                                    <DropdownMenuItem onClick={e => { e.stopPropagation(); handleLiberarCadastro(deal); }}>
                                      <CheckCircle className="h-3.5 w-3.5 mr-2 text-success" />Liberar p/ Cadastro
                                    </DropdownMenuItem>
                                  )}
                                  {canConcretizarVenda && (deal.stage === "liberado_cadastro" || deal.stage === "concluido") && (
                                    <DropdownMenuItem onClick={e => { e.stopPropagation(); setConcretizarDeal(deal); }}>
                                      <DollarSign className="h-3.5 w-3.5 mr-2 text-success" />Concretizar Venda
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Veículo + Placa */}
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Car className="h-3 w-3 shrink-0" />
                              <span className="text-[11px] truncate">{deal.veiculo_modelo}</span>
                              <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 rounded-none">{deal.veiculo_placa}</Badge>
                            </div>

                            {/* Plano + Valor */}
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-none">{deal.plano}</Badge>
                              <span className="text-[11px] font-bold text-foreground">R$ {deal.valor_plano.toFixed(2).replace(".", ",")}</span>
                            </div>

                            {/* Status icons row */}
                            <TooltipProvider delayDuration={200}>
                              <div className="flex items-center gap-1 pt-0.5">
                                <Tooltip><TooltipTrigger><CheckCircle className={`h-3.5 w-3.5 ${si.aceita ? "text-success" : "text-muted-foreground/25"}`} /></TooltipTrigger><TooltipContent className="text-[10px]">Aceita</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger><AlertCircle className={`h-3.5 w-3.5 ${si.pendente ? "text-amber-500" : "text-muted-foreground/25"}`} /></TooltipTrigger><TooltipContent className="text-[10px]">Pendente</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger><Shield className={`h-3.5 w-3.5 ${si.aprovada ? "text-blue-600" : "text-muted-foreground/25"}`} /></TooltipTrigger><TooltipContent className="text-[10px]">Aprovada</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger><Send className={`h-3.5 w-3.5 ${si.sga ? "text-success" : "text-muted-foreground/25"}`} /></TooltipTrigger><TooltipContent className="text-[10px]">Gestão</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger><Radio className={`h-3.5 w-3.5 ${si.rastreador ? "text-blue-600" : "text-muted-foreground/25"}`} /></TooltipTrigger><TooltipContent className="text-[10px]">Rastreador</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger><AlertTriangle className={`h-3.5 w-3.5 ${si.inadimplencia ? "text-destructive" : "text-muted-foreground/25"}`} /></TooltipTrigger><TooltipContent className="text-[10px]">Inadimplência</TooltipContent></Tooltip>
                              </div>
                            </TooltipProvider>

                            {/* Data + Stalled */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span className="text-[10px]">{new Date(deal.created_at).toLocaleDateString("pt-BR")} {new Date(deal.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                              </div>
                              <StalledBadge days={days} />
                            </div>

                            {/* Footer: Consultor */}
                            <div className="flex items-center justify-end gap-1.5 pt-0.5 border-t-2 border-[#747474] mt-1">
                              <div className="w-5 h-5 rounded-full bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center shrink-0">
                                <span className="text-[9px] font-bold text-primary">{deal.consultor.charAt(0)}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">{deal.consultor}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {colDeals.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-20 gap-1 select-none">
                        <div className="w-8 h-1 rounded-full bg-border/50" />
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-3 border-b-2 border-[#747474]">
              <span className="text-sm font-medium">{sorted.length} registros</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline"><Download className="h-3.5 w-3.5 mr-1" />Exportar Excel</Button>
                <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(1); }}>
                  <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="10">10/pág</SelectItem><SelectItem value="25">25/pág</SelectItem><SelectItem value="50">50/pág</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {([
                      ["id", "ID"], ["lead_nome", "Lead"], ["veiculo_modelo", "Veículo"], ["plano", "Plano"],
                      ["stage", "Etapa"], ["consultor", "Consultor"], ["cooperativa", "Cooperativa"],
                      ["regional", "Regional"], ["created_at", "Data Criação"], ["updated_at", "Última Mov."],
                    ] as [SortKey, string][]).map(([key, label]) => (
                      <TableHead key={key} className="text-xs cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort(key)}>
                        <span className="flex items-center gap-1">{label}<ArrowUpDown className="h-3 w-3 text-muted-foreground/50" /></span>
                      </TableHead>
                    ))}
                    <TableHead className="text-xs">Gestão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map(deal => (
                    <TableRow key={deal.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setDetailDeal(deal)}>
                      <TableCell className="text-xs font-mono">{deal.id}</TableCell>
                      <TableCell className="font-medium text-sm">{deal.lead_nome}</TableCell>
                      <TableCell className="text-xs">
                        <div>{deal.veiculo_modelo}</div>
                        <span className="font-mono text-muted-foreground">{deal.veiculo_placa}</span>
                      </TableCell>
                      <TableCell className="text-xs">{deal.plano}</TableCell>
                      <TableCell>
                        <Badge className="text-[10px]" style={{ backgroundColor: `${stageColor(deal.stage)}20`, color: stageColor(deal.stage), borderColor: `${stageColor(deal.stage)}40` }} variant="outline">
                          {stageLabel(deal.stage)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{deal.consultor}</TableCell>
                      <TableCell className="text-xs">{deal.cooperativa}</TableCell>
                      <TableCell className="text-xs">{deal.regional}</TableCell>
                      <TableCell className="text-xs">{new Date(deal.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-xs">{new Date(deal.updated_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{deal.enviado_sga ? <Badge className="bg-success text-white text-[9px]">Gestão</Badge> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t-2 border-[#747474]">
                <span className="text-xs text-muted-foreground">Página {page} de {totalPages}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="outline" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="outline" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Floating button */}
      <Button
        className="fixed bottom-6 right-6 h-12 px-5 rounded-full shadow-2xl shadow-primary/25 transition-all hover:scale-[1.03] gap-2 z-50"
        onClick={() => setNewDealOpen(true)}
      >
        <Plus className="h-5 w-5" />
        <span className="hidden sm:inline">Nova Negociação</span>
      </Button>

      {/* New deal modal */}
      <Dialog open={newDealOpen} onOpenChange={setNewDealOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Negociação</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg border border-warning/25 bg-warning/8 text-warning text-xs">
              <strong>Dados mínimos para cotação:</strong> Preencha Nome e Telefone para criar a negociação.
            </div>
            <div className="space-y-1.5">
              <Label>Nome do Lead *</Label>
              <Input
                value={form.lead_nome}
                onChange={e => setForm({ ...form, lead_nome: e.target.value })}
                onBlur={() => setFormTouched(t => ({ ...t, lead_nome: true }))}
                placeholder="Nome completo"
                className={formNomeInvalid ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {formNomeInvalid && <p className="text-xs text-destructive">Nome é obrigatório</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>CPF/CNPJ</Label><Input value={form.cpf_cnpj} onChange={e => setForm({ ...form, cpf_cnpj: maskCpfCnpj(e.target.value) })} placeholder="000.000.000-00" maxLength={18} /></div>
              <div className="space-y-1.5">
                <Label>Telefone/WhatsApp *</Label>
                <Input
                  value={form.telefone}
                  onChange={e => setForm({ ...form, telefone: maskTelefone(e.target.value) })}
                  onBlur={() => setFormTouched(t => ({ ...t, telefone: true }))}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className={formTelInvalid ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {formTelInvalid && <p className="text-xs text-destructive">Telefone é obrigatório</p>}
              </div>
            </div>
            <div className="space-y-1.5"><Label>E-mail</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Placa do Veículo</Label><Input value={form.placa} maxLength={8} onChange={async e => {
                const v = maskPlaca(e.target.value);
                setForm(f => ({ ...f, placa: v }));
                const clean = v.replace(/[^A-Z0-9]/g, "");
                if (clean.length >= 7) {
                  try {
                    const res = await callEdge("gia-buscar-placa", { acao: "placa", placa: clean });
                    if (res.sucesso && res.resultado) {
                      const r = res.resultado;
                      setForm(f => ({ ...f, modelo: `${r.marca} ${r.modelo}`, anoModelo: r.anoModelo || "", anoFab: r.anoFabricacao || "" }));
                      toast.success(`${r.marca} ${r.modelo} ${r.anoFabricacao}/${r.anoModelo} — R$ ${(r.valorFipe || 0).toLocaleString("pt-BR")}`);
                    }
                  } catch {}
                }
              }} placeholder="ABC1D23" /></div>
              <div className="space-y-1.5"><Label>Modelo do Veículo</Label><Input value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} placeholder="Preenchido pela placa" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Ano Modelo *</Label><Input value={form.anoModelo} onChange={e => setForm({ ...form, anoModelo: e.target.value })} placeholder="2024" required /></div>
              <div className="space-y-1.5"><Label>Ano Fabricação *</Label><Input value={form.anoFab} onChange={e => setForm({ ...form, anoFab: e.target.value })} placeholder="2023" required /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Plano</Label>
                <Select value={form.plano} onValueChange={v => setForm({ ...form, plano: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{planosLista.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Cooperativa</Label>
                <Select value={form.cooperativa} onValueChange={handleCooperativaChange}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{cooperativasLista.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Regional (preenchida pela cooperativa)</Label>
                <Input value={form.regional} readOnly className="bg-muted cursor-not-allowed" placeholder="Selecione a cooperativa" />
              </div>
              <div className="space-y-1.5"><Label>Consultor Responsável</Label>
                <Select value={form.consultor} onValueChange={v => setForm({ ...form, consultor: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{consultoresLista.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={3} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setNewDealOpen(false); setFormTouched({ lead_nome: false, telefone: false }); }}>Cancelar</Button>
              <Button onClick={handleNewDeal} disabled={!canCreateDeal || createLead.isPending}>
                {createLead.isPending ? "Criando..." : "Criar Negociação"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deal detail modal */}
      {detailDeal && (
        <DealDetailModal deal={detailDeal} open={!!detailDeal} onOpenChange={o => { if (!o) setDetailDeal(null); }} />
      )}

      {/* Concretizar Venda Modal */}
      {concretizarDeal && (
        <ConcretizarVendaModal
          open={!!concretizarDeal}
          onOpenChange={o => { if (!o) setConcretizarDeal(null); }}
          leadNome={concretizarDeal.lead_nome}
          leadTelefone={concretizarDeal.telefone}
          leadId={concretizarDeal.id}
          onSuccess={() => setConcretizarDeal(null)}
        />
      )}
    </div>
  );
}
