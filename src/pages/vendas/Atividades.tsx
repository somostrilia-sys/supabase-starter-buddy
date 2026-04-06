import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, isToday, startOfWeek, isAfter } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase, callEdge } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Brain,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  TrendingUp,
  Target,
  PhoneCall,
  MessageSquare,
  Mail,
  User,
  ArrowRightLeft,
  Activity,
  Filter,
  X,
  Flame,
  Send,
  Eye,
  Calendar,
  Bell,
  ClipboardCheck,
  FileWarning,
  Users,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

/* ─── Constantes ──────────────────────────────────────────── */

const prioridadeColors: Record<string, string> = {
  urgente: "bg-red-500/15 text-red-400 border-red-500/30",
  alta: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  media: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  baixa: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const canalIcons: Record<string, any> = {
  whatsapp: MessageSquare,
  telefone: PhoneCall,
  email: Mail,
  visita: User,
};

/* ─── AI Advisor Section ──────────────────────────────────── */

function AIAdvisorSection() {
  const [showAdvisor, setShowAdvisor] = useState(true);
  const { profile } = useAuth();
  const [aiData, setAiData] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [autoLoaded, setAutoLoaded] = useState(false);

  const fetchAI = async () => {
    if (!profile?.id) return;
    setAiLoading(true);
    setAiError("");
    try {
      const { data: usuario } = await (supabase as any)
        .from("usuarios")
        .select("id")
        .eq("auth_id", profile.user_id)
        .maybeSingle();
      const consultorId = usuario?.id || profile.id;
      const res = await callEdge("gia-conselheiro-ia", {
        modo: "agenda",
        consultor_id: consultorId,
      });
      if (res.sucesso === false) {
        setAiError(res.error || "Erro ao consultar IA");
      } else {
        setAiData(res);
      }
    } catch {
      setAiError("Erro de conexao com o servidor");
    }
    setAiLoading(false);
  };

  useEffect(() => {
    if (profile?.id && !autoLoaded && !aiData) {
      setAutoLoaded(true);
      fetchAI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  if (!showAdvisor) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowAdvisor(true)}
        className="mb-2 border-[#747474]"
      >
        <Brain className="h-3.5 w-3.5 mr-1" />
        Mostrar Conselheiro IA
      </Button>
    );
  }

  const hasData = !!aiData;
  const contextoIA = aiData?.contexto_ia || "comercial";
  const nomeUsuario = aiData?.nome_usuario;
  const nextAction = aiData?.proxima_melhor_acao;
  const analise = aiData?.analise_pipeline || aiData?.analise_cadastro || aiData?.analise_equipe;
  const agenda: any[] = aiData?.agenda_sugerida || [];

  // Config por contexto
  const ctxConfig: Record<string, { icon: any; gradient: string; label: string; subtitle: string; analyLabel: string; analyIcon: any }> = {
    comercial: { icon: TrendingUp, gradient: "from-[#1A3A5C] to-[#0F2847]", label: "Conselheiro de IA", subtitle: "Analise inteligente do seu pipeline em tempo real", analyLabel: "Analise do Pipeline", analyIcon: TrendingUp },
    cadastro: { icon: ClipboardCheck, gradient: "from-[#1A4A3C] to-[#0F3027]", label: "Conselheiro de Cadastro", subtitle: "Conferencia de cadastros e qualidade de dados", analyLabel: "Pendencias de Cadastro", analyIcon: FileWarning },
    diretoria: { icon: BarChart3, gradient: "from-[#3A1A5C] to-[#280F47]", label: "Visao Diretoria", subtitle: "Performance da equipe e decisoes pendentes", analyLabel: "Visao da Equipe", analyIcon: Users },
    administrativo: { icon: ShieldCheck, gradient: "from-[#3A1A5C] to-[#280F47]", label: "Painel Administrativo", subtitle: "Conferencias, excecoes e gestao operacional", analyLabel: "Visao Administrativa", analyIcon: ShieldCheck },
    gestor_comercial: { icon: Users, gradient: "from-[#1A3A5C] to-[#0F2847]", label: "Conselheiro Gestor", subtitle: "Performance e gestao da sua equipe comercial", analyLabel: "Equipe Comercial", analyIcon: Users },
  };
  const ctx = ctxConfig[contextoIA] || ctxConfig.comercial;
  const CtxIcon = ctx.icon;
  const AnalyIcon = ctx.analyIcon;

  // Saudação personalizada
  const saudacao = nomeUsuario
    ? contextoIA === "cadastro" ? `Ola ${nomeUsuario.split(" ")[0]}, aqui esta sua conferencia de cadastros de hoje`
    : contextoIA === "diretoria" || contextoIA === "administrativo" ? `Ola ${nomeUsuario.split(" ")[0]}, aqui esta o panorama da equipe`
    : contextoIA === "gestor_comercial" ? `Ola ${nomeUsuario.split(" ")[0]}, aqui esta a performance da sua equipe`
    : ctx.subtitle
    : ctx.subtitle;

  return (
    <Card className={cn("border-[#747474] bg-gradient-to-r backdrop-blur shadow-xl shadow-blue-900/10", ctx.gradient)}>
      {/* ── Header ── */}
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
              <CtxIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                {ctx.label}
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/40 text-[9px] font-semibold tracking-wider">
                  BETA
                </Badge>
              </h2>
              <p className="text-[11px] text-slate-400">
                {saudacao}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300"
              onClick={fetchAI}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <Brain className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Brain className="h-3.5 w-3.5 mr-1.5" />
              )}
              {aiLoading ? "Consultando..." : "Atualizar IA"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white"
              onClick={() => setShowAdvisor(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5 space-y-4">
        {/* Error */}
        {aiError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {aiError}
          </div>
        )}

        {/* Loading */}
        {aiLoading && (
          <div className="py-10 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-500/10 flex items-center justify-center mb-3 animate-pulse">
              <Brain className="h-8 w-8 text-violet-400 animate-bounce" />
            </div>
            <p className="text-sm font-medium text-slate-300">
              Consultando IA...
            </p>
            <p className="text-xs text-slate-500 mt-1">
              A IA esta processando seus dados
            </p>
          </div>
        )}

        {/* Empty */}
        {!hasData && !aiLoading && !aiError && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-500/10 flex items-center justify-center mb-3">
              <Brain className="h-8 w-8 text-violet-400/60" />
            </div>
            <p className="text-sm font-medium text-slate-300">
              Sem analise disponivel
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Clique em &quot;Atualizar IA&quot; para gerar uma analise
            </p>
          </div>
        )}

        {/* Data loaded — 3 columns */}
        {hasData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* ── a) Analise (adapta por contexto) ── */}
            <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <AnalyIcon className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                  {ctx.analyLabel}
                </span>
              </div>

              {/* Cadastro context */}
              {contextoIA === "cadastro" ? (<>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/[0.06] border border-amber-500/20">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                    <FileWarning className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-400 leading-none">{analise?.cadastros_pendentes ?? 0}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Cadastros Pendentes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/[0.06] border border-red-500/20">
                  <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-400 leading-none">{analise?.dados_incompletos ?? 0}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Dados Incompletos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/[0.06] border border-blue-500/20">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-400 leading-none">{analise?.contratos_pendentes ?? 0}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Contratos Pendentes</p>
                  </div>
                </div>
              </>) : (contextoIA === "diretoria" || contextoIA === "administrativo") ? (<>
                {/* Diretoria/ADM context */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-violet-500/[0.06] border border-violet-500/20">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-violet-400 leading-none">{analise?.leads_totais ?? 0}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Leads da Equipe</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/[0.06] border border-red-500/20">
                  <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-400 leading-none">{analise?.excecoes_pendentes ?? 0}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Excecoes Pendentes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <BarChart3 className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-400 leading-none">{analise?.meta_percentual ?? 0}%</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Meta Atingida</p>
                  </div>
                </div>
              </>) : (<>
                {/* Comercial / Gestor Comercial context */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/[0.06] border border-red-500/20">
                  <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-400 leading-none">{analise?.leads_parados ?? 0}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Leads Parados</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <Flame className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-400 leading-none">{analise?.leads_quentes ?? 0}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Leads Quentes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/[0.06] border border-blue-500/20">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-400 leading-none">{analise?.taxa_conversao ?? 0}%</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Taxa Conversao</p>
                  </div>
                </div>
              </>)}
            </div>

            {/* ── b) Proxima Melhor Acao ── */}
            <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/10 border border-emerald-500/20 p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                  Proxima Melhor Acao
                </span>
              </div>

              {nextAction ? (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-sm font-bold text-white">
                      {nextAction.nome_lead || nextAction.lead || nextAction.tipo || "Acao"}
                    </p>
                    <Badge
                      className={cn(
                        "text-[9px] shrink-0",
                        prioridadeColors[
                          nextAction.stage || nextAction.urgencia || "alta"
                        ] || "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      )}
                    >
                      {(
                        nextAction.stage ||
                        nextAction.urgencia ||
                        nextAction.tipo ||
                        "—"
                      ).toUpperCase()}
                    </Badge>
                  </div>

                  {/* Canal */}
                  {(nextAction.canal_sugerido || nextAction.canal) && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-3">
                      {(() => {
                        const canal = (
                          nextAction.canal_sugerido ||
                          nextAction.canal ||
                          ""
                        ).toLowerCase();
                        const Icon = canalIcons[canal] || PhoneCall;
                        return <Icon className="h-3.5 w-3.5" />;
                      })()}
                      <span>
                        Canal:{" "}
                        <strong className="text-white">
                          {nextAction.canal_sugerido || nextAction.canal || "—"}
                        </strong>
                      </span>
                    </div>
                  )}

                  {/* Mensagem/descricao sugerida */}
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-4 flex-1">
                    <p className="text-xs text-slate-300 italic leading-relaxed">
                      &ldquo;
                      {nextAction.mensagem_sugerida ||
                        nextAction.descricao ||
                        nextAction.argumento ||
                        "Sem descricao"}
                      &rdquo;
                    </p>
                  </div>

                  <Button
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-medium"
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    {contextoIA === "cadastro" ? "Conferir Agora" : contextoIA === "diretoria" || contextoIA === "administrativo" ? "Resolver Agora" : "Executar Agora"}
                  </Button>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-slate-500 text-center">
                    Nenhuma acao sugerida no momento
                  </p>
                </div>
              )}
            </div>

            {/* ── c) Agenda Sugerida ── */}
            <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                  {contextoIA === "cadastro" ? "Agenda de Revisao" : contextoIA === "diretoria" || contextoIA === "administrativo" ? "Acoes Prioritarias" : "Agenda Sugerida"}
                </span>
                {agenda.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[9px] ml-auto border-amber-500/30 text-amber-400"
                  >
                    {agenda.length} itens
                  </Badge>
                )}
              </div>

              {agenda.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-slate-500 text-center">
                    Nenhuma atividade sugerida
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5 flex-1 overflow-y-auto max-h-72">
                  {agenda.slice(0, 6).map((item: any, i: number) => {
                    const canal = (item.canal || "").toLowerCase();
                    const CanalIcon = canalIcons[canal] || Activity;
                    const prio = item.prioridade || "media";
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors",
                          i % 2 === 0
                            ? "bg-white/[0.02]"
                            : "bg-white/[0.05]"
                        )}
                      >
                        <span className="text-[11px] font-mono font-bold text-amber-400/90 w-10 shrink-0">
                          {item.horario || item.hora || "—"}
                        </span>
                        <Badge
                          className={cn(
                            "text-[8px] px-1.5 py-0 shrink-0",
                            prioridadeColors[prio]
                          )}
                        >
                          {prio}
                        </Badge>
                        <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center shrink-0">
                          <CanalIcon className="h-3 w-3 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-white truncate">
                            {item.nome_lead || item.lead || "Lead"}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {item.descricao || item.tarefa || item.canal || ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */

export default function Atividades() {
  const [fConsultor, setFConsultor] = useState("all");
  const [fTipo, setFTipo] = useState("all");
  const [fDateStart, setFDateStart] = useState("");
  const [fDateEnd, setFDateEnd] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  /* Fetch pipeline_transicoes */
  const { data: transicoes = [], isLoading } = useQuery({
    queryKey: ["pipeline-transicoes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("pipeline_transicoes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        console.error("Transicoes error:", error);
        return [];
      }
      return data || [];
    },
  });

  /* Fetch consultores */
  const { data: consultores = [] } = useQuery({
    queryKey: ["usuarios-consultores"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("usuarios")
        .select("id, nome")
        .order("nome");
      return data || [];
    },
  });

  /* Filtered list */
  const filtered = useMemo(() => {
    return transicoes.filter((t: any) => {
      if (fTipo !== "all") {
        if (fTipo === "automatica" && !t.automatica) return false;
        if (fTipo === "manual" && t.automatica) return false;
      }
      if (fConsultor !== "all" && t.consultor_id !== fConsultor) return false;
      if (fDateStart) {
        const tDate = new Date(t.created_at);
        if (tDate < new Date(fDateStart)) return false;
      }
      if (fDateEnd) {
        const tDate = new Date(t.created_at);
        const endOfDay = new Date(fDateEnd);
        endOfDay.setHours(23, 59, 59, 999);
        if (tDate > endOfDay) return false;
      }
      return true;
    });
  }, [transicoes, fConsultor, fTipo, fDateStart, fDateEnd]);

  /* KPIs */
  const hoje = transicoes.filter((t: any) =>
    isToday(new Date(t.created_at))
  ).length;
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const estaSemana = transicoes.filter((t: any) =>
    isAfter(new Date(t.created_at), weekStart)
  ).length;
  const manuais = transicoes.filter((t: any) => !t.automatica).length;
  const automaticas = transicoes.filter((t: any) => t.automatica).length;

  function clearFilters() {
    setFConsultor("all");
    setFTipo("all");
    setFDateStart("");
    setFDateEnd("");
  }

  const activeFilters = [
    fConsultor !== "all",
    fTipo !== "all",
    !!fDateStart,
    !!fDateEnd,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Atividades</h1>
          <p className="text-sm text-muted-foreground">
            Timeline de transicoes do pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="border-[#747474]"
          >
            <Filter className="h-3.5 w-3.5 mr-1" />
            Filtros
            {activeFilters > 0 && (
              <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
                {activeFilters}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* ── AI Advisor ── */}
      <AIAdvisorSection />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-blue-500/25 border-[#747474]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{hoje}</p>
              <p className="text-xs text-muted-foreground">Hoje</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-500/25 border-[#747474]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{estaSemana}</p>
              <p className="text-xs text-muted-foreground">Esta Semana</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/25 border-[#747474]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{manuais}</p>
              <p className="text-xs text-muted-foreground">Manuais</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/25 border-[#747474]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Zap className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{automaticas}</p>
              <p className="text-xs text-muted-foreground">Automaticas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters Panel ── */}
      {showFilters && (
        <Card className="border-[#747474]">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Select value={fTipo} onValueChange={setFTipo}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatica">Automatica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Consultor</Label>
                <Select value={fConsultor} onValueChange={setFConsultor}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {consultores.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data Inicio</Label>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={fDateStart}
                  onChange={(e) => setFDateStart(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data Fim</Label>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={fDateEnd}
                  onChange={(e) => setFDateEnd(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearFilters}
                  className="border-[#747474]"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Timeline de Transicoes ── */}
      <Card className="border-[#747474]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Timeline de Transicoes
            <Badge
              variant="outline"
              className="text-[10px] ml-auto border-[#747474]"
            >
              {filtered.length} registros
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">
                Nenhuma transicao encontrada
              </p>
              <p className="text-xs mt-1">
                As movimentacoes do pipeline aparecerao aqui
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((t: any) => {
                const date = new Date(t.created_at);
                return (
                  <div
                    key={t.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-colors border-b border-[#747474]/20 last:border-0"
                  >
                    {/* Icon */}
                    <div className="shrink-0 mt-0.5">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          t.automatica
                            ? "bg-blue-500/15"
                            : "bg-emerald-500/15"
                        )}
                      >
                        {t.automatica ? (
                          <Zap className="h-3.5 w-3.5 text-blue-400" />
                        ) : (
                          <ArrowRightLeft className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">Lead</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px]",
                            t.automatica
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          )}
                        >
                          {t.automatica ? "Automatica" : "Manual"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium text-foreground">
                          {t.stage_anterior || "—"}
                        </span>
                        {" \u2192 "}
                        <span className="font-medium text-foreground">
                          {t.stage_novo || "—"}
                        </span>
                      </p>
                      {t.motivo && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">
                          {t.motivo}
                        </p>
                      )}
                    </div>

                    {/* Date */}
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] text-muted-foreground">
                        {format(date, "dd/MM/yyyy")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(date, "HH:mm")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
