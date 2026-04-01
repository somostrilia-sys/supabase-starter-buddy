import { useState, useMemo } from "react";
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
  PhoneCall, Send, Eye, Flame, Activity, ArrowRightLeft,
} from "lucide-react";

function AIAdvisorSection() {
  const [showAdvisor, setShowAdvisor] = useState(true);
  const { profile } = useAuth();
  const [aiData, setAiData] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const fetchAI = async () => {
    if (!profile?.id) return;
    setAiLoading(true); setAiError("");
    try {
      const res = await callEdge("gia-conselheiro-ia", { consultor_id: profile.id });
      if (res.sucesso === false) setAiError(res.error || "Erro ao consultar IA");
      else setAiData(res);
    } catch { setAiError("Erro de conexao"); }
    setAiLoading(false);
  };

  if (!showAdvisor) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShowAdvisor(true)} className="mb-2">
        <Brain className="h-3.5 w-3.5 mr-1" />Mostrar Conselheiro IA
      </Button>
    );
  }

  const hasData = !!aiData;
  const nextAction = aiData?.proxima_melhor_acao;
  const analise = aiData?.analise_pipeline;
  const agenda = aiData?.agenda_sugerida || [];

  const prioridadeColors: Record<string, string> = {
    urgente: "bg-destructive/15 text-destructive border-red-300",
    alta: "bg-warning/10 text-warning border-warning/30",
    media: "bg-primary/15 text-primary border-blue-300",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-1.5">Conselheiro de IA <Badge className="bg-violet-500/15 text-violet-700 border-violet-300 text-[9px]">BETA</Badge></h2>
            <p className="text-[11px] text-muted-foreground">Analise inteligente do seu pipeline em tempo real</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={fetchAI} disabled={aiLoading}>
            {aiLoading ? <Flame className="h-3 w-3 mr-1 animate-spin" /> : <Brain className="h-3 w-3 mr-1" />}
            {aiLoading ? "Consultando..." : "Atualizar IA"}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowAdvisor(false)}><X className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {aiError && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">{aiError}</div>
      )}

      {!hasData && !aiLoading && !aiError && (
        <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/80 to-indigo-50/50 dark:from-violet-950/30 dark:to-indigo-950/20">
          <CardContent className="p-6 text-center">
            <Brain className="h-8 w-8 mx-auto text-violet-400 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Sem analise disponivel</p>
            <p className="text-xs text-muted-foreground mt-1">Clique em "Atualizar IA" para gerar uma analise do seu pipeline</p>
          </CardContent>
        </Card>
      )}

      {hasData && (
        <>
          {/* Row 1: Next Best Action + Pipeline Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {nextAction && (
              <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/80 to-indigo-50/50 dark:from-violet-950/30 dark:to-indigo-950/20">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-violet-700 dark:text-violet-400">
                    <Target className="h-3.5 w-3.5" />PROXIMA MELHOR ACAO
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold">{nextAction.nome_lead || nextAction.lead}</p>
                      <p className="text-[11px] text-muted-foreground">{nextAction.motivo || `etapa ${nextAction.stage}`}</p>
                    </div>
                    <Badge className={cn("text-[9px] shrink-0", prioridadeColors[nextAction.urgencia || "alta"])}>
                      {(nextAction.urgencia || "alta").toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <PhoneCall className="h-3 w-3" /><span>Canal sugerido: <strong className="text-foreground">{nextAction.canal_sugerido || nextAction.canal}</strong></span>
                  </div>
                  <p className="text-xs bg-white/60 dark:bg-white/5 rounded p-2 border border-violet-200/50 dark:border-violet-800/50 italic">
                    {nextAction.mensagem_sugerida || nextAction.argumento}
                  </p>
                  <Button size="sm" className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs h-8">
                    <PhoneCall className="h-3 w-3 mr-1" />Executar Agora <ArrowRight className="h-3 w-3 ml-auto" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {analise && (
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-primary dark:text-blue-400">
                    <TrendingUp className="h-3.5 w-3.5" />ANALISE DO PIPELINE
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-destructive/8 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/50">
                      <p className="text-lg font-bold text-destructive dark:text-red-400">{analise.leads_parados ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">Leads Parados</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-success/8 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/50">
                      <p className="text-lg font-bold text-success dark:text-green-400">{analise.leads_quentes ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">Leads Quentes</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-primary/6 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50">
                      <p className="text-lg font-bold text-primary dark:text-blue-400">{analise.taxa_conversao ?? 0}%</p>
                      <p className="text-[10px] text-muted-foreground">Taxa Conversao</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/50">
                      <p className="text-lg font-bold text-violet-700 dark:text-violet-400">
                        {analise.oportunidade_valor ? `R$ ${Number(analise.oportunidade_valor).toLocaleString("pt-BR")}` : "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Oportunidades</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Row 2: Agenda Sugerida */}
          {agenda.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-success dark:text-emerald-400">
                  <CalendarDays className="h-3.5 w-3.5" />AGENDA SUGERIDA PARA HOJE
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-1.5">
                  {agenda.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
                      <span className="text-xs font-mono font-bold text-muted-foreground w-12 shrink-0">{item.horario || item.hora}</span>
                      <div className="h-8 w-[2px] rounded-full bg-emerald-300 dark:bg-emerald-700 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.descricao || item.tarefa}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{item.canal}</span>
                          {item.prioridade && (
                            <Badge className={cn("text-[9px]", prioridadeColors[item.prioridade])}>{item.prioridade}</Badge>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7 px-2">
                        <CheckCircle className="h-3 w-3 mr-1" />Feito
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
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
      if (fConsultor !== "all" && t.negociacoes?.consultor !== fConsultor) return false;
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
  const hoje = transicoes.filter((t: any) => isToday(new Date(t.created_at))).length;
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const estaSemana = transicoes.filter((t: any) => isAfter(new Date(t.created_at), weekStart)).length;
  const manuais = transicoes.filter((t: any) => !t.automatica).length;
  const automaticas = transicoes.filter((t: any) => t.automatica).length;

  function clearFilters() {
    setFConsultor("all"); setFTipo("all"); setFDateStart(undefined); setFDateEnd(undefined);
  }
  const activeFilters = [fConsultor !== "all", fTipo !== "all", !!fDateStart, !!fDateEnd].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Atividades</h1>
          <p className="text-sm text-muted-foreground">Timeline de transicoes do pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-3.5 w-3.5 mr-1" />Filtros
            {activeFilters > 0 && <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">{activeFilters}</Badge>}
          </Button>
        </div>
      </div>

      {/* AI Advisor */}
      <AIAdvisorSection />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-primary/25 bg-primary/5 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-blue-900/40 flex items-center justify-center"><Activity className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{hoje}</p><p className="text-xs text-muted-foreground">Hoje</p></div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 bg-violet-50/50 dark:bg-violet-950/20 dark:border-violet-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center"><CalendarDays className="h-5 w-5 text-violet-600" /></div>
            <div><p className="text-2xl font-bold">{estaSemana}</p><p className="text-xs text-muted-foreground">Esta Semana</p></div>
          </CardContent>
        </Card>
        <Card className="border-warning/25 bg-warning/5 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 dark:bg-amber-900/40 flex items-center justify-center"><Clock className="h-5 w-5 text-warning" /></div>
            <div><p className="text-2xl font-bold">{manuais}</p><p className="text-xs text-muted-foreground">Manuais</p></div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-success/5 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 dark:bg-green-900/40 flex items-center justify-center"><Zap className="h-5 w-5 text-success" /></div>
            <div><p className="text-2xl font-bold">{automaticas}</p><p className="text-xs text-muted-foreground">Automaticas</p></div>
          </CardContent>
        </Card>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1"><Label className="text-xs">Tipo</Label>
                <Select value={fTipo} onValueChange={setFTipo}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatica">Automatica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Data Inicio</Label>
                <Popover><PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-8 w-full text-xs justify-start", !fDateStart && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />{fDateStart ? format(fDateStart, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={fDateStart} onSelect={setFDateStart} className="p-3 pointer-events-auto" /></PopoverContent></Popover>
              </div>
              <div className="space-y-1"><Label className="text-xs">Data Fim</Label>
                <Popover><PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-8 w-full text-xs justify-start", !fDateEnd && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />{fDateEnd ? format(fDateEnd, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={fDateEnd} onSelect={setFDateEnd} className="p-3 pointer-events-auto" /></PopoverContent></Popover>
              </div>
              <div className="space-y-1"><Label className="text-xs">Consultor</Label>
                <Select value={fConsultor} onValueChange={setFConsultor}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {consultores.map((c: any) => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end"><Button size="sm" variant="outline" onClick={clearFilters}><X className="h-3 w-3 mr-1" />Limpar</Button></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Timeline de Transicoes
            <Badge variant="outline" className="text-[10px] ml-auto">{filtered.length} registros</Badge>
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
              <p className="text-sm font-medium">Nenhuma transicao encontrada</p>
              <p className="text-xs mt-1">As movimentacoes do pipeline aparecerao aqui</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((t: any) => {
                const date = new Date(t.created_at);
                const neg = t.negociacoes;
                return (
                  <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0">
                    <div className="shrink-0 mt-0.5">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        t.automatica ? "bg-success/15" : "bg-primary/15"
                      )}>
                        {t.automatica
                          ? <Zap className="h-3.5 w-3.5 text-success" />
                          : <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{neg?.lead_nome || "Lead"}</span>
                        {neg?.veiculo_placa && (
                          <Badge variant="outline" className="text-[9px]">{neg.veiculo_placa}</Badge>
                        )}
                        <Badge variant="outline" className={cn("text-[9px]", t.automatica ? "bg-success/10 text-success border-green-300" : "bg-primary/10 text-primary border-blue-300")}>
                          {t.automatica ? "Automatica" : "Manual"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium text-foreground">{t.stage_anterior || "—"}</span>
                        {" "}→{" "}
                        <span className="font-medium text-foreground">{t.stage_novo || "—"}</span>
                      </p>
                      {t.motivo && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">{t.motivo}</p>
                      )}
                      {neg?.consultor && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">Consultor: {neg.consultor}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] text-muted-foreground">{format(date, "dd/MM/yyyy")}</p>
                      <p className="text-[10px] text-muted-foreground">{format(date, "HH:mm")}</p>
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
