import { maskCpfCnpj, maskTelefone, maskPlaca } from "@/lib/masks";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  const { canLiberarCadastro, canConcretizarVenda, role } = usePermission();
  const leadScope = useLeadScope();
  const queryClient = useQueryClient();

  // Buscar cooperativas do usuário logado
  const { profile } = usePermission();
  const { data: usuarioLogado } = useQuery({
    queryKey: ["usuario_logado", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.email) return null;
      const { data } = await supabase.from("usuarios").select("nome, cooperativa, regional, funcao, grupo_permissao")
        .eq("email", user.user.email).limit(1).maybeSingle();
      return data as any;
    },
  });

  // Cooperativas do usuário: split por vírgula (alguns têm múltiplas)
  const minhasCooperativas = (usuarioLogado?.cooperativa || "").split(",").map((c: string) => c.trim()).filter(Boolean);
  const isAdmin = ["admin", "administrativo", "diretor"].includes(role);
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
  const [fOrigem, setFOrigem] = useState("all");
  const [fPlano, setFPlano] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // List view
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // New deal form
  const [form, setForm] = useState({ lead_nome: "", cpf_cnpj: "", telefone: "", email: "", placa: "", modelo: "", anoModelo: "", anoFab: "", plano: "", cooperativa: "", regional: "", consultor: "", observacoes: "", cidadeCirc: "", estadoCirc: "", origem: "" });
  const [formTouched, setFormTouched] = useState({ lead_nome: false, telefone: false });
  const [cidadesCircOptions, setCidadesCircOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!form.estadoCirc) { setCidadesCircOptions([]); return; }
    supabase.from("municipios" as any).select("nome").eq("uf", form.estadoCirc).order("nome")
      .then(({ data }) => setCidadesCircOptions((data || []).map((d: any) => d.nome)));
  }, [form.estadoCirc]);

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  // Hook de negociações (Supabase real)
  const { negociacoes, loading: negociacoesLoading, create: createNegociacao, update: updateNegociacao, reload: reloadNegociacoes, periodo, setPeriodo, totalCount } = useNegociacoes(undefined, "30d");

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
  const gerentesReais = [...new Set((usuariosReais || []).filter((u: any) => u.funcao === 'Administrador de Cooperativas' || u.funcao === 'Administrador Master').map((u: any) => u.nome).filter(Boolean))];

  // Carregar planos reais do banco
  const { data: planosDb } = useQuery({
    queryKey: ["planos_gia_db"],
    queryFn: async () => {
      const { data } = await supabase.from("planos_gia").select("nome").eq("ativo", true).order("nome");
      return (data || []).map((p: any) => p.nome);
    },
  });

  // Cooperativas reais extraídas das negociações carregadas (garante match perfeito)
  const cooperativasReaisNeg = useMemo(() => [...new Set(negociacoes.map(n => n.cooperativa).filter(Boolean))].sort(), [negociacoes]);
  const todasCooperativas = cooperativasReaisNeg.length > 0 ? cooperativasReaisNeg : (cooperativasDb && cooperativasDb.length > 0 ? cooperativasDb.map((c: any) => c.nome) : cooperativas);
  const cooperativasLista = isAdmin || minhasCooperativas.length === 0
    ? todasCooperativas
    : todasCooperativas.filter(c => minhasCooperativas.some((mc: string) => c.toLowerCase().includes(mc.toLowerCase()) || mc.toLowerCase().includes(c.toLowerCase())));
  const regionaisLista = regionaisDb && regionaisDb.length > 0 ? regionaisDb.map((r: any) => r.nome) : regionais;
  const consultoresLista = consultoresReais.length > 0 ? consultoresReais : consultores;
  const planosLista = planosDb && planosDb.length > 0 ? planosDb : planos;
  const [planosPermitidos, setPlanosPermitidos] = useState<string[]>([]);

  // Ao selecionar cooperativa → preencher regional automaticamente
  function handleCooperativaChange(coopNome: string) {
    setForm(f => {
      const coop = (cooperativasDb || []).find((c: any) => c.nome === coopNome);
      const regionalNome = coop?.regionais?.nome || f.regional;
      return { ...f, cooperativa: coopNome, regional: regionalNome, consultor: "" };
    });
  }

  // Normaliza nome de cooperativa para comparação (remove "filial", espaços extras, case)
  const normCoop = (s: string) => s.toLowerCase().replace(/filial\s*/gi, "").replace(/\s+/g, " ").trim();

  // Consultores filtrados pela cooperativa selecionada
  const consultoresDaCooperativa = form.cooperativa
    ? (() => {
        const coopSel = normCoop(form.cooperativa);
        const filtered = (usuariosReais || []).filter((u: any) => {
          const userCoops = (u.cooperativa || "").split(",").map((c: string) => normCoop(c));
          return userCoops.some((c: string) => c === coopSel || coopSel.includes(c) || c.includes(coopSel));
        });
        if (filtered.length === 0) {
          console.warn("[GIA] Nenhum consultor encontrado para cooperativa:", form.cooperativa,
            "| Cooperativas no banco:", [...new Set((usuariosReais || []).map((u: any) => u.cooperativa))]);
        }
        return filtered.length > 0 ? filtered.map((u: any) => u.nome).filter(Boolean) : consultoresLista;
      })()
    : consultoresLista;

  // Ao selecionar consultor → buscar cooperativa dele e preencher
  function handleConsultorChange(consultorNome: string) {
    const usuario = (usuariosReais || []).find((u: any) => u.nome === consultorNome);
    if (usuario) {
      const coops = (usuario.cooperativa || "").split(",").map((c: string) => c.trim()).filter(Boolean);
      if (coops.length === 1) {
        // Uma cooperativa → preenche direto + regional
        const coopMatch = (cooperativasDb || []).find((c: any) =>
          c.nome.toLowerCase().includes(coops[0].toLowerCase()) || coops[0].toLowerCase().includes(c.nome.toLowerCase())
        );
        setForm(f => ({
          ...f,
          consultor: consultorNome,
          cooperativa: coopMatch?.nome || coops[0],
          regional: coopMatch?.regionais?.nome || f.regional,
        }));
      } else {
        // Múltiplas → só preenche consultor, cooperativa fica pra escolher
        setForm(f => ({ ...f, consultor: consultorNome }));
      }
    } else {
      setForm(f => ({ ...f, consultor: consultorNome }));
    }
  }

  // leadsData removido — usar apenas useNegociacoes com RLS

  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (id.startsWith("p")) return;
      // Bloquear mudança de stage em negociações concluídas
      const deal = dealsToShow.find(d => d.id === id);
      if (deal?.stage === "concluido") {
        throw new Error("Negociação concluída não pode ser alterada.");
      }
      const { error } = await supabase.from("negociacoes").update({ stage: status } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["negociacoes"] }),
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
        consultor: data.consultor || usuarioLogado?.nome || undefined,
        observacoes: data.observacoes || undefined,
        cidade_circulacao: data.cidadeCirc || undefined,
        estado_circulacao: data.estadoCirc || undefined,
        stage: "novo_lead",
        origem: data.origem || "Manual",
        enviado_sga: false,
        visualizacoes_proposta: 0,
        status_icons: { aceita: false, pendente: true, aprovada: false, sga: false, rastreador: false, inadimplencia: false },
      });
      if (negError) throw negError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negociacoes"] });
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
    cidade_circulacao: n.cidade_circulacao || "",
    estado_circulacao: n.estado_circulacao || "",
    chassi: (n as any).chassi || "",
    renavam: (n as any).renavam || "",
    ano_fabricacao: (n as any).ano_fabricacao || "",
    ano_modelo: (n as any).ano_modelo || "",
    cor: (n as any).cor || "",
    combustivel: (n as any).combustivel || "",
    dia_vencimento: (n as any).dia_vencimento || "",
    vistoria_status: (n as any).vistoria_status || "",
    vistoria_motivo: (n as any).vistoria_motivo || "",
    created_at: n.created_at,
    updated_at: n.updated_at,
  } as any));

  const dealsToShow: PipelineDeal[] = negociacoesAsDeal;

  // --- Cash sound: SÓ toca quando IA aprova e move para concluído ---
  const cashAudioRef = useRef<HTMLAudioElement | null>(null);
  const concluídosProcessados = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  useEffect(() => {
    cashAudioRef.current = new Audio("/sounds/cash.mp3");
    cashAudioRef.current.volume = 0.7;
  }, []);

  // Marcar todos os concluídos existentes como já processados (não tocar som no load)
  useEffect(() => {
    if (dealsToShow.length === 0) return;
    if (!initialLoadDone.current) {
      dealsToShow.filter(d => d.stage === "concluido").forEach(d => concluídosProcessados.current.add(d.id));
      initialLoadDone.current = true;
    }
  }, [dealsToShow]);

  // Função chamada quando IA aprova e move para concluído
  const onDealConcluido = useCallback((dealId: string, dealNome: string) => {
    if (concluídosProcessados.current.has(dealId)) return;
    concluídosProcessados.current.add(dealId);
    if (cashAudioRef.current) {
      cashAudioRef.current.currentTime = 0;
      cashAudioRef.current.play().catch(() => {});
    }
    callEdge("gia-concluir-venda", { negociacao_id: dealId }).then(res => {
      if (res?.sucesso) toast.success(`🎉 Venda concluída: ${dealNome}`);
    }).catch(() => {});
  }, []);
  // --- Fim cash sound ---

  const activeFilterCount = [fConsultor !== "all", fGerente !== "all", fCoop !== "all", fRegional !== "all", fEtapa !== "all", fOrigem !== "all", fPlano !== "all", !!fDateStart, !!fDateEnd].filter(Boolean).length;

  // Origens únicas reais
  const origensReais = useMemo(() => [...new Set(dealsToShow.map(d => d.origem).filter(Boolean))].sort(), [dealsToShow]);

  // Normaliza texto pra comparação (lowercase, remove espaços extras)
  const norm = (s: string) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();

  const filtered = useMemo(() => {
    const nCoop = norm(fCoop);
    const nConsultor = norm(fConsultor);
    const nRegional = norm(fRegional);
    return dealsToShow.filter(d => {
      if (fConsultor !== "all" && norm(d.consultor) !== nConsultor) return false;
      if (fGerente !== "all" && d.gerente !== fGerente) return false;
      if (fCoop !== "all" && !norm(d.cooperativa).includes(nCoop) && !nCoop.includes(norm(d.cooperativa))) return false;
      if (fRegional !== "all" && norm(d.regional) !== nRegional) return false;
      if (fEtapa !== "all" && d.stage !== fEtapa) return false;
      if (fOrigem !== "all" && d.origem !== fOrigem) return false;
      if (fPlano !== "all" && d.plano !== fPlano) return false;
      const dateField = fDateType === "created_at" ? d.created_at : d.updated_at;
      if (fDateStart && dateField < fDateStart) return false;
      if (fDateEnd && dateField > fDateEnd + "T23:59:59") return false;
      return true;
    });
  }, [dealsToShow, fConsultor, fGerente, fCoop, fRegional, fEtapa, fOrigem, fPlano, fDateStart, fDateEnd, fDateType]);

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
    setFConsultor("all"); setFGerente("all"); setFCoop("all"); setFRegional("all"); setFEtapa("all"); setFOrigem("all"); setFPlano("all"); setFDateStart(""); setFDateEnd("");
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
        if (error) { toast.error("Erro ao mover negociação"); }
        else {
          await supabase.from("pipeline_transicoes").insert({
            negociacao_id: draggedId, stage_anterior: source.stage, stage_novo: stage,
            motivo: "Movido manualmente no pipeline", automatica: false,
          } as any);
        }
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
      await supabase.from("pipeline_transicoes").insert({
        negociacao_id: deal.id, stage_anterior: deal.stage, stage_novo: "liberado_cadastro",
        motivo: "Liberado para cadastro", automatica: false,
      } as any);
    } else {
      await updateLeadStatus.mutateAsync({ id: deal.id, status: "liberado_cadastro" });
    }
    toast.success("Lead liberado para cadastro! IA conferindo dados...");

    // IA confere automaticamente e move para concluido se tudo OK
    callEdge("gia-conferencia-final", { negociacao_id: deal.id }).then(res => {
      if (res?.aprovado) {
        onDealConcluido(deal.id, deal.lead_nome);
        reloadNegociacoes();
      } else if (res?.pendencias) {
        toast.info(`Pendências: ${res.pendencias.join(", ")}`, { duration: 8000 });
      }
    }).catch(() => {});
  }

  const formNomeInvalid = formTouched.lead_nome && !form.lead_nome.trim();
  const formTelInvalid = formTouched.telefone && !form.telefone.trim();
  const canCreateDeal = form.lead_nome.trim().length > 0 && form.telefone.trim().length > 0 && form.estadoCirc.length > 0 && form.cidadeCirc.trim().length > 0 && form.origem.length > 0;

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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-white/70" />
              <span className="text-sm font-semibold text-white/90">Filtros</span>
              <Badge className="bg-white/15 text-white text-[10px]">{totalCount.toLocaleString()} cotações</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">Período:</span>
              {(["7d","30d","90d","180d","365d","todos"] as const).map(p => (
                <Button key={p} size="sm" variant="ghost"
                  className={`h-6 px-2 text-[10px] ${periodo === p ? "bg-white/20 text-white font-bold" : "text-white/50 hover:text-white hover:bg-white/10"}`}
                  onClick={() => setPeriodo(p)}
                >
                  {p === "todos" ? "Todos" : p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : p === "90d" ? "3 meses" : p === "180d" ? "6 meses" : "1 ano"}
                </Button>
              ))}
            </div>
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
                <SelectContent><SelectItem value="all">Todos</SelectItem>{consultoresLista.filter(Boolean).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Etapa</Label>
              <Select value={fEtapa} onValueChange={setFEtapa}><SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todas</SelectItem>{stageColumns.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Cooperativa</Label>
              <Select value={fCoop} onValueChange={setFCoop}><SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todas</SelectItem>{cooperativasLista.filter(Boolean).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Regional</Label>
              <Select value={fRegional} onValueChange={setFRegional}><SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todas</SelectItem>{regionaisLista.filter(Boolean).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Gerente</Label>
              <Select value={fGerente} onValueChange={setFGerente}><SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todos</SelectItem>{gerentesReais.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Origem</Label>
              <Select value={fOrigem} onValueChange={setFOrigem}><SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todas</SelectItem>{origensReais.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Plano</Label>
              <Select value={fPlano} onValueChange={setFPlano}><SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todos</SelectItem>{planosLista.filter(Boolean).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Data Início</Label><Input type="date" className="h-8 text-xs bg-white/10 border-white/20 text-white" value={fDateStart} onChange={e => setFDateStart(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Data Fim</Label><Input type="date" className="h-8 text-xs bg-white/10 border-white/20 text-white" value={fDateEnd} onChange={e => setFDateEnd(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Tipo Data</Label>
              <Select value={fDateType} onValueChange={setFDateType}><SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="created_at">Data Criação</SelectItem><SelectItem value="updated_at">Última Movimentação</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          {/* Botões de ação - sempre visíveis */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/20 mt-3">
            <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white font-semibold text-xs h-9 px-4" onClick={() => { const t = new Date().toISOString().split("T")[0]; setFDateStart(t); setFDateEnd(t); }}>📅 Hoje</Button>
            <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white font-semibold text-xs h-9 px-4" onClick={() => { const d = new Date(); const s = new Date(d); s.setDate(d.getDate() - d.getDay()); setFDateStart(s.toISOString().split("T")[0]); setFDateEnd(d.toISOString().split("T")[0]); }}>📅 Semana</Button>
            <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white font-semibold text-xs h-9 px-4" onClick={() => { const d = new Date(); setFDateStart(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`); setFDateEnd(d.toISOString().split("T")[0]); }}>📅 Mês</Button>
            <div className="flex-1" />
            <Button size="sm" className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-sm h-9 px-8 shadow-lg" onClick={() => reloadNegociacoes()}>
              <Search className="h-4 w-4 mr-2" />FILTRAR
            </Button>
            <Button size="sm" className="bg-red-500/80 hover:bg-red-500 text-white font-semibold text-xs h-9 px-4" onClick={clearFilters}><X className="h-3.5 w-3.5 mr-1" />Limpar</Button>
          </div>
        </CardContent>
      </Card>

      {/* KANBAN VIEW */}
      {viewMode === "kanban" ? (
        <div className="relative w-full max-w-full">
          <div className="flex gap-3 overflow-x-scroll overflow-y-hidden pb-5 scrollbar-thin" style={{ height: "calc(100vh - 280px)" }}>
          {stageColumns.filter(col => col.key !== "perdido").map(col => {
            const allColDeals = filtered.filter(d => d.stage === col.key);
            const colDeals = allColDeals.slice(0, 50);
            const hasMore = allColDeals.length > 50;
            const isOver = dragOverStage === col.key;
            return (
              <div
                key={col.key}
                className={`flex flex-col rounded-xl overflow-hidden min-w-[300px] w-[300px] shrink-0 transition-all bg-muted/40 border border-border/50 ${isOver ? "ring-2 shadow-lg" : "shadow-sm"}`}
                onDragOver={e => handleDragOver(e, col.key)}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={() => handleDrop(col.key)}
              >
                <div className="px-0 pt-0 pb-2">
                  <div className="flex items-center justify-between rounded-t-xl px-4 py-2.5" style={{ backgroundColor: col.color }}>
                    <span className="text-sm font-bold text-white tracking-wide">{col.label}</span>
                    <Badge className="text-[10px] h-5 px-1.5 bg-white/20 text-white border-white/30">{allColDeals.length}</Badge>
                  </div>
                </div>
                <ScrollArea className="flex-1 px-2 pb-2" style={{ maxHeight: "calc(100vh - 300px)" }}>
                  <div className="space-y-2">
                    {colDeals.map(deal => {
                      const days = daysStalled(deal.updated_at);
                      const si = deal.status_icons;
                      return (
                        <div
                          key={deal.id}
                          draggable={deal.stage !== "concluido" && deal.stage !== "perdido"}
                          onDragStart={e => { if (deal.stage === "concluido" || deal.stage === "perdido") { e.preventDefault(); return; } handleDragStart(e, deal.id); }}
                          onClick={() => setDetailDeal(deal)}
                          className={`kanban-card group bg-card border border-border/50 border-l-[3px] rounded-lg cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150 ${draggedId === deal.id ? "opacity-80 ring-2 ring-primary" : ""} ${deal.stage === "concluido" ? "opacity-70" : ""}`}
                          style={{ borderLeftColor: col.color }}
                        >
                          <div className="p-2.5 space-y-1">
                            {/* Header: nome + código + menu */}
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold leading-tight text-black dark:text-white truncate">{deal.lead_nome}</p>
                                <span className="text-[9px] font-mono text-black/40 dark:text-white/40">{deal.codigo}</span>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0" onClick={e => e.stopPropagation()}><MoreVertical className="h-3 w-3" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setDetailDeal(deal)}><Eye className="h-3.5 w-3.5 mr-2" />Detalhes</DropdownMenuItem>
                                  <DropdownMenuItem><Archive className="h-3.5 w-3.5 mr-2" />Arquivar</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Veículo + Placa */}
                            <div className="flex items-center gap-1.5">
                              <Car className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                              <span className="text-[11px] font-medium text-black/70 dark:text-white/70 truncate flex-1">{deal.veiculo_modelo}</span>
                              {deal.veiculo_placa && <span className="text-[9px] font-mono font-bold bg-muted text-black/80 dark:text-white/80 px-1.5 py-0 rounded">{deal.veiculo_placa}</span>}
                            </div>

                            {/* Plano + Valor */}
                            {(deal.plano || deal.valor_plano > 0) && (
                              <div className="flex items-center justify-between">
                                {deal.plano && <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded">{deal.plano}</span>}
                                {deal.valor_plano > 0 && <span className="text-[11px] font-bold text-black dark:text-white">R$ {deal.valor_plano.toFixed(0)}</span>}
                              </div>
                            )}

                            {/* Vistoria status — só mostra em Liberado p/ Cadastro */}
                            {deal.stage === "liberado_cadastro" && (deal as any).vistoria_status === "reprovada" && (
                              <div className="bg-red-500/10 border border-red-500/30 rounded px-2 py-1">
                                <span className="text-[9px] font-bold text-red-500">⚠ Vistoria Reprovada</span>
                              </div>
                            )}
                            {deal.stage === "liberado_cadastro" && (deal as any).vistoria_status === "aprovada" && (
                              <div className="bg-green-500/10 border border-green-500/30 rounded px-2 py-0.5">
                                <span className="text-[9px] font-bold text-green-500">✓ Vistoria OK</span>
                              </div>
                            )}

                            {/* Status icons */}
                            <div className="flex items-center gap-1 pt-0.5">
                              <CheckCircle className={`h-3 w-3 ${si.aceita ? "text-success" : "text-muted-foreground/20"}`} />
                              <AlertCircle className={`h-3 w-3 ${si.pendente ? "text-amber-500" : "text-muted-foreground/20"}`} />
                              <Shield className={`h-3 w-3 ${si.aprovada ? "text-blue-600" : "text-muted-foreground/20"}`} />
                              <Send className={`h-3 w-3 ${si.sga ? "text-success" : "text-muted-foreground/20"}`} />
                              <Radio className={`h-3 w-3 ${si.rastreador ? "text-blue-600" : "text-muted-foreground/20"}`} />
                              <AlertTriangle className={`h-3 w-3 ${si.inadimplencia ? "text-destructive" : "text-muted-foreground/20"}`} />
                            </div>

                            {/* Data + Stalled */}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-black/50 dark:text-white/50">{new Date(deal.created_at).toLocaleDateString("pt-BR")}</span>
                              <StalledBadge days={days} />
                            </div>

                            {/* Footer: Consultor */}
                            <div className="flex items-center gap-1.5 pt-1.5 border-t border-border/30 mt-1">
                              <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                                <span className="text-[9px] font-bold text-primary">{deal.consultor?.charAt(0) || "?"}</span>
                              </div>
                              <span className="text-[10px] font-medium text-black/60 dark:text-white/60 truncate">{deal.consultor}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {hasMore && (
                      <div className="text-center py-2">
                        <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => setViewMode("list")}>
                          +{allColDeals.length - 50} mais — ver em lista
                        </Button>
                      </div>
                    )}
                    {allColDeals.length === 0 && (
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
              <div className="space-y-1.5"><Label>Placa do Veículo</Label><Input value={form.placa} maxLength={8} onChange={e => {
                const v = maskPlaca(e.target.value);
                setForm(f => ({ ...f, placa: v }));
                const clean = v.replace(/[^A-Z0-9]/g, "");
                if (clean.length >= 7) {
                  callEdge("gia-buscar-placa", { acao: "placa", placa: clean }).then(res => {
                    if (res.sucesso && res.resultado) {
                      const r = res.resultado;
                      setForm(f => ({ ...f, modelo: `${r.marca} ${r.modelo}`, anoModelo: r.anoModelo || "", anoFab: r.anoFabricacao || "" }));
                      toast.success(`${r.marca} ${r.modelo} ${r.anoFabricacao}/${r.anoModelo} — R$ ${(r.valorFipe || 0).toLocaleString("pt-BR")}`);
                      // Buscar planos permitidos pro modelo
                      supabase.from("modelos_veiculo" as any).select("planos").ilike("nome", `%${(r.submodelo || r.modelo || "").split(" ")[0]}%`).eq("aceito", true).limit(1).maybeSingle()
                        .then(({ data: mv }) => {
                          if (mv?.planos) setPlanosPermitidos((mv.planos as string).split(",").map((p: string) => p.trim()).filter(Boolean));
                          else setPlanosPermitidos([]);
                        });
                    }
                  }).catch(() => {});
                }
              }} placeholder="ABC-1D23" /></div>
              <div className="space-y-1.5"><Label>Modelo do Veículo</Label><Input value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} placeholder="Preenchido pela placa" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Ano Modelo *</Label><Input value={form.anoModelo} onChange={e => setForm({ ...form, anoModelo: e.target.value })} placeholder="2024" required /></div>
              <div className="space-y-1.5"><Label>Ano Fabricação *</Label><Input value={form.anoFab} onChange={e => setForm({ ...form, anoFab: e.target.value })} placeholder="2023" required /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Estado Circulação *</Label>
                <Select value={form.estadoCirc} onValueChange={v => setForm({ ...form, estadoCirc: v, cidadeCirc: "" })}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>
                    {["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Cidade Circulação *</Label>
                <Select value={form.cidadeCirc} onValueChange={v => setForm({ ...form, cidadeCirc: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione a cidade" /></SelectTrigger>
                  <SelectContent>
                    {cidadesCircOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Cooperativa</Label>
                <Select value={form.cooperativa} onValueChange={handleCooperativaChange}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{cooperativasLista.filter(Boolean).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Consultor Responsável</Label>
                <Input value={form.consultor || (usuarioLogado?.nome || "")} readOnly className="bg-muted cursor-not-allowed border border-gray-300" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Regional (preenchida pela cooperativa)</Label>
                <Input value={form.regional} readOnly className="bg-muted cursor-not-allowed" placeholder="Selecione a cooperativa" />
              </div>
            </div>
            <div className="space-y-1.5"><Label>Origem do Lead *</Label>
              <Select value={form.origem} onValueChange={v => setForm({ ...form, origem: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a origem" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tráfego Pago">Tráfego Pago</SelectItem>
                  <SelectItem value="LuxSales">LuxSales</SelectItem>
                  <SelectItem value="Indicação">Indicação</SelectItem>
                  <SelectItem value="Redes Sociais">Redes Sociais</SelectItem>
                  <SelectItem value="Site Objetivo">Site Objetivo</SelectItem>
                  <SelectItem value="Landing Page">Landing Page</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Telefone">Telefone</SelectItem>
                  <SelectItem value="Presencial">Presencial</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
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
        <DealDetailModal deal={detailDeal} open={!!detailDeal} onOpenChange={o => { if (!o) setDetailDeal(null); }} onUpdate={() => { queryClient.invalidateQueries({ queryKey: ["negociacoes"] }); reloadNegociacoes(); }} />
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
