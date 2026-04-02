import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isToday, startOfWeek, isAfter } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase, callEdge } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Clock, CheckCircle, AlertTriangle, CalendarIcon, Filter, X,
  Target, Zap, TrendingUp, Bell, CalendarDays, ArrowRight, Brain,
  PhoneCall, Send, Eye, Flame, Activity, ArrowRightLeft, MessageSquare,
  Mail, User,
} from "lucide-react";

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
      const res = await callEdge("gia-conselheiro-ia", {
        modo: "agenda",
        consultor_id: profile.id,
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

  // Auto-carregar IA na primeira vez
  useEffect(() => {
    if (profile?.id && !autoLoaded && !aiData) {
      setAutoLoaded(true);
      fetchAI();
    }
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
  const nextAction = aiData?.proxima_melhor_acao;
  const analise = aiData?.analise_pipeline;
  const agenda = aiData?.agenda_sugerida || [];

  return (
    <Card className="border-[#747474] bg-[#1A3A5C]/60 backdrop-blur">
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20">
              <Brain className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Conselheiro de IA
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/40 text-[9px] font-semibold tracking-wider">
                  BETA
                </Badge>
              </h2>
              <p className="text-[11px] text-slate-400">
                Analise inteligente do seu pipeline em tempo real
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
                <Flame className="h-3.5 w-3.5 mr-1.5 animate-spin" />
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
        {aiError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {aiError}
          </div>
        )}

        {!hasData && !aiLoading && !aiError && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-500/10 flex items-center justify-center mb-3">
              <Brain className="h-8 w-8 text-violet-400/60" />
            </div>
            <p className="text-sm font-medium text-slate-300">
              Sem analise disponivel
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Clique em "Atualizar IA" para gerar uma analise do seu pipeline
            </p>
          </div>
        )}

        {aiLoading && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-500/10 flex items-center justify-center mb-3 animate-pulse">
              <Brain className="h-8 w-8 text-violet-400" />
            </div>
            <p className="text-sm font-medium text-slate-300">
              Analisando seu pipeline...
            </p>
            <p className="text-xs text-slate-500 mt-1">
              A IA esta processando seus dados
            </p>
          </div>
        )}

        {hasData && (
          <>
            {/* Analise do Pipeline - 3 metricas em linha */}
            {analise && (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-[10px] text-red-400/80 font-medium uppercase tracking-wider">
                      Parados
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-red-400">
                    {analise.leads_parados ?? 0}
                  </p>
                  <p className="text-[10px] text-slate-500">leads sem movimento</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400/80 font-medium uppercase tracking-wider">
                      Quentes
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {analise.leads_quentes ?? 0}
                  </p>
                  <p className="text-[10px] text-slate-500">prontos p/ fechar</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/8 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-[10px] text-blue-400/80 font-medium uppercase tracking-wider">
                      Conversao
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">
                    {analise.taxa_conversao ?? 0}%
                  </p>
                  <p className="text-[10px] text-slate-500">taxa do periodo</p>
                </div>
              </div>
            )}

            {/* Proxima Melhor Acao */}
            {nextAction && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/25">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-violet-400" />
                  <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
                    Proxima Melhor Acao
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-bold text-white">
                      {nextAction.nome_lead || nextAction.lead || "Lead"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {nextAction.motivo || `Etapa: ${nextAction.stage || "—"}`}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "text-[9px] shrink-0",
                      prioridadeColors[nextAction.urgencia || nextAction.prioridade || "alta"]
                    )}
                  >
                    {(nextAction.urgencia || nextAction.prioridade || "alta").toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                  {(() => {
                    const canal = (nextAction.canal_sugerido || nextAction.canal || "").toLowerCase();
                    const Icon = canalIcons[canal] || PhoneCall;
                    return <Icon className="h-3.5 w-3.5" />;
                  })()}
                  <span>
                    Canal sugerido:{" "}
                    <strong className="text-white">
                      {nextAction.canal_sugerido || nextAction.canal || "—"}
                    </strong>
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-violet-500/15 mb-3">
                  <p className="text-xs text-slate-300 italic leading-relaxed">
                    "{nextAction.mensagem_sugerida || nextAction.argumento || "Mensagem nao disponivel"}"
                  </p>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs h-9 font-medium"
                >
                  <PhoneCall className="h-3.5 w-3.5 mr-1.5" />
                  Executar Agora
                  <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                </Button>
              </div>
            )}

            {/* Agenda Sugerida */}
            {agenda.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                    Agenda Sugerida para Hoje
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[9px] ml-auto border-emerald-500/30 text-emerald-400"
                  >
                    {agenda.length} atividades
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  {agenda.map((item: any, i: number) => {
                    const canal = (item.canal || "").toLowerCase();
                    const CanalIcon = canalIcons[canal] || Activity;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/3 hover:bg-white/6 transition-colors group border border-transparent hover:border-[#747474]/30"
                      >
                        <span className="text-xs font-mono font-bold text-emerald-400/80 w-12 shrink-0">
                          {item.horario || item.hora}
                        </span>
                        <div className="h-9 w-[2px] rounded-full bg-emerald-500/30 shrink-0" />
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                          <CanalIcon className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-white truncate">
                              {item.nome_lead || item.descricao || item.tarefa}
                            </p>
                            {item.tipo_acao && (
                              <Badge
                                variant="outline"
                                className="text-[9px] border-[#747474]/40 text-slate-400 shrink-0"
                              >
                                {item.tipo_acao}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500">
                              {item.descricao || item.canal}
                            </span>
                            {item.prioridade && (
                              <Badge
                                className={cn(
                                  "text-[9px]",
                                  prioridadeColors[item.prioridade]
                                )}
                              >
                                {item.prioridade}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7 px-2 text-emerald-400 hover:text-emerald-300"
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Feito
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Atividades() {
  const [fConsultor, setFConsultor] = useState("all");
  const [fTipo, setFTipo] = useState("all");
  const [fDateStart, setFDateStart] = useState<Date | undefined>();
  const [fDateEnd, setFDateEnd] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  // Fetch pipeline_transicoes (real activities)
  const { data: transicoes = [], isLoading } = useQuery({
    queryKey: ["pipeline-transicoes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("pipeline_transicoes")
        .select("*, negociacoes(lead_nome, veiculo_placa, consultor)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch consultores from usuarios
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

  // Filtered list
  const filtered = useMemo(() => {
    return transicoes.filter((t: any) => {
      if (fConsultor !== "all" && t.negociacoes?.consultor !== fConsultor)
        return false;
      if (fTipo !== "all") {
        if (fTipo === "automatica" && !t.automatica) return false;
        if (fTipo === "manual" && t.automatica) return false;
      }
      if (fDateStart) {
        const tDate = new Date(t.created_at);
        if (tDate < fDateStart) return false;
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

  // KPIs
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
    setFDateStart(undefined);
    setFDateEnd(undefined);
  }
  const activeFilters = [
    fConsultor !== "all",
    fTipo !== "all",
    !!fDateStart,
    !!fDateEnd,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
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

      {/* AI Advisor */}
      <AIAdvisorSection />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-blue-500/25 bg-[#1A3A5C]/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{hoje}</p>
              <p className="text-xs text-slate-400">Hoje</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-500/25 bg-violet-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{estaSemana}</p>
              <p className="text-xs text-slate-400">Esta Semana</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/25 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{manuais}</p>
              <p className="text-xs text-slate-400">Manuais</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/25 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Zap className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{automaticas}</p>
              <p className="text-xs text-slate-400">Automaticas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="border-[#747474]">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
                      <SelectItem key={c.id} value={c.nome}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data Inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-8 w-full text-xs justify-start",
                        !fDateStart && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                      {fDateStart
                        ? format(fDateStart, "dd/MM/yyyy")
                        : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fDateStart}
                      onSelect={setFDateStart}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data Fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-8 w-full text-xs justify-start",
                        !fDateEnd && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                      {fDateEnd
                        ? format(fDateEnd, "dd/MM/yyyy")
                        : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fDateEnd}
                      onSelect={setFDateEnd}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-end">
                <Button size="sm" variant="outline" onClick={clearFilters}>
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
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
                const neg = t.negociacoes;
                return (
                  <div
                    key={t.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/3 transition-colors border-b border-[#747474]/20 last:border-0"
                  >
                    <div className="shrink-0 mt-0.5">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          t.automatica
                            ? "bg-emerald-500/15"
                            : "bg-blue-500/15"
                        )}
                      >
                        {t.automatica ? (
                          <Zap className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <ArrowRightLeft className="h-3.5 w-3.5 text-blue-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {neg?.lead_nome || "Lead"}
                        </span>
                        {neg?.veiculo_placa && (
                          <Badge
                            variant="outline"
                            className="text-[9px] border-[#747474]"
                          >
                            {neg.veiculo_placa}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px]",
                            t.automatica
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                          )}
                        >
                          {t.automatica ? "Automatica" : "Manual"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium text-foreground">
                          {t.stage_anterior || "—"}
                        </span>
                        {" -> "}
                        <span className="font-medium text-foreground">
                          {t.stage_novo || "—"}
                        </span>
                      </p>
                      {t.motivo && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">
                          {t.motivo}
                        </p>
                      )}
                      {neg?.consultor && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Consultor: {neg.consultor}
                        </p>
                      )}
                    </div>
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
