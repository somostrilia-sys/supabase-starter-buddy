import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Phone, Mail, MessageCircle, Users, MapPin, Clock,
  CheckCircle, AlertTriangle, CalendarIcon, Filter, X,
  MoreVertical, Pencil, Trash2, Target, Zap,
  TrendingUp, Bell, CalendarDays, ArrowRight, Brain,
  PhoneCall, Send, Eye, AlertCircle, Flame,
} from "lucide-react";
import { consultores, cooperativas, regionais } from "./pipeline/mockData";

interface Atividade {
  id: string;
  tipo: string;
  descricao: string;
  lead_vinculado: string | null;
  responsavel: string;
  data: string;
  hora: string;
  status: "Pendente" | "Concluída" | "Atrasada";
}

const tipoIcons: Record<string, React.ElementType> = {
  "Ligação": Phone, "Visita": MapPin, "Email": Mail, "WhatsApp": MessageCircle, "Reunião": Users,
};
const tipos = ["Ligação", "Visita", "Email", "WhatsApp", "Reunião"];
const statusColors: Record<string, string> = {
  "Pendente": "bg-amber-500/15 text-amber-700 border-amber-300",
  "Concluída": "bg-green-500/15 text-green-700 border-green-300",
  "Atrasada": "bg-red-500/15 text-red-700 border-red-300",
};

const day = 86400000;
const now = Date.now();

const mockAtividades: Atividade[] = [
  { id: "at1", tipo: "Ligação", descricao: "Ligar para apresentar planos de proteção veicular Premium", lead_vinculado: "João Pereira", responsavel: "Ana Silva", data: new Date(now - 2 * day).toISOString().split("T")[0], hora: "09:00", status: "Atrasada" },
  { id: "at2", tipo: "WhatsApp", descricao: "Enviar proposta atualizada com valores de adesão e mensalidade", lead_vinculado: "Maria Santos", responsavel: "Carlos Souza", data: new Date(now - 1 * day).toISOString().split("T")[0], hora: "10:30", status: "Atrasada" },
  { id: "at3", tipo: "Email", descricao: "Encaminhar documentação para análise do contrato", lead_vinculado: "Carlos Oliveira", responsavel: "Maria Lima", data: new Date(now).toISOString().split("T")[0], hora: "08:00", status: "Pendente" },
  { id: "at4", tipo: "Reunião", descricao: "Reunião presencial para fechamento de contrato frota", lead_vinculado: "Ana Costa", responsavel: "Ana Silva", data: new Date(now).toISOString().split("T")[0], hora: "14:00", status: "Pendente" },
  { id: "at5", tipo: "Visita", descricao: "Visita para vistoria do veículo no local do cliente", lead_vinculado: "Roberto Lima", responsavel: "Carlos Souza", data: new Date(now).toISOString().split("T")[0], hora: "16:00", status: "Pendente" },
  { id: "at6", tipo: "Ligação", descricao: "Follow-up sobre cotação enviada na semana passada", lead_vinculado: "Fernanda Alves", responsavel: "Maria Lima", data: new Date(now + 1 * day).toISOString().split("T")[0], hora: "09:30", status: "Pendente" },
  { id: "at7", tipo: "WhatsApp", descricao: "Enviar boleto de adesão e confirmar pagamento", lead_vinculado: "Pedro Souza", responsavel: "Ana Silva", data: new Date(now - 3 * day).toISOString().split("T")[0], hora: "11:00", status: "Concluída" },
  { id: "at8", tipo: "Email", descricao: "Solicitar documentos pessoais para cadastro no sistema", lead_vinculado: "Juliana Mendes", responsavel: "Carlos Souza", data: new Date(now - 4 * day).toISOString().split("T")[0], hora: "15:00", status: "Concluída" },
  { id: "at9", tipo: "Reunião", descricao: "Apresentação comercial para empresa com frota de 15 veículos", lead_vinculado: null, responsavel: "Maria Lima", data: new Date(now - 2 * day).toISOString().split("T")[0], hora: "10:00", status: "Concluída" },
  { id: "at10", tipo: "Visita", descricao: "Retirar documentação assinada na sede da cooperativa", lead_vinculado: "Camila Rodrigues", responsavel: "Ana Silva", data: new Date(now + 2 * day).toISOString().split("T")[0], hora: "13:00", status: "Pendente" },
];

// ── Mock AI Advisor Data ──
const mockNextAction = {
  lead: "João Pereira",
  motivo: "Sem interação há 2 dias — etapa Cotações Recebidas",
  canal: "Ligação",
  argumento: "Reforçar benefícios do plano Premium e prazo especial de adesão sem taxa até sexta-feira.",
  urgencia: "alta" as const,
};

const mockSugestaoTarefa = {
  tipo: "Follow-up",
  lead: "Maria Santos",
  descricao: "Reenviar cotação por WhatsApp com comparativo de planos. Lead visualizou proposta 1x mas não respondeu.",
  prioridade: "urgente" as const,
};

const mockAnalise = {
  leadsParados: 3,
  leadsQuentes: 2,
  taxaConversao: 12.5,
  oportunidades: "R$ 1.429,50",
};

const mockAlertas = [
  { id: "al1", tipo: "risco", texto: "Roberto Lima — inadimplente, em negociação há 5 dias sem resposta", icon: AlertCircle },
  { id: "al2", tipo: "expirada", texto: "Cotação de Carlos Oliveira expira em 2 dias — nenhuma visualização", icon: Eye },
  { id: "al3", tipo: "followup", texto: "Follow-up atrasado: Fernanda Alves aguarda retorno desde segunda", icon: Clock },
  { id: "al4", tipo: "quente", texto: "Ana Costa visualizou proposta 3x — oportunidade quente para fechamento", icon: Flame },
];

const mockAgenda = [
  { hora: "08:00", tarefa: "Enviar documentação para Carlos Oliveira", canal: "Email", prioridade: "alta" as const },
  { hora: "09:00", tarefa: "Ligar para João Pereira — reativar negociação", canal: "Ligação", prioridade: "urgente" as const },
  { hora: "10:30", tarefa: "WhatsApp para Maria Santos — reenviar cotação", canal: "WhatsApp", prioridade: "alta" as const },
  { hora: "14:00", tarefa: "Reunião presencial com Ana Costa — fechamento", canal: "Presencial", prioridade: "media" as const },
  { hora: "16:00", tarefa: "Visita para vistoria — Roberto Lima", canal: "Presencial", prioridade: "media" as const },
];

const prioridadeColors: Record<string, string> = {
  urgente: "bg-red-500/15 text-red-700 border-red-300",
  alta: "bg-amber-500/15 text-amber-700 border-amber-300",
  media: "bg-blue-500/15 text-blue-700 border-blue-300",
};

const alertaColors: Record<string, string> = {
  risco: "text-red-600",
  expirada: "text-amber-600",
  followup: "text-orange-600",
  quente: "text-green-600",
};

function AIAdvisorSection() {
  const [showAdvisor, setShowAdvisor] = useState(true);

  if (!showAdvisor) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShowAdvisor(true)} className="mb-2">
        <Brain className="h-3.5 w-3.5 mr-1" />Mostrar Conselheiro IA
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-1.5">Conselheiro de IA <Badge className="bg-violet-500/15 text-violet-700 border-violet-300 text-[9px]">BETA</Badge></h2>
            <p className="text-[11px] text-muted-foreground">Análise inteligente do seu pipeline em tempo real</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowAdvisor(false)}><X className="h-3.5 w-3.5" /></Button>
      </div>

      {/* Row 1: Next Best Action + Task Suggestion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/80 to-indigo-50/50 dark:from-violet-950/30 dark:to-indigo-950/20">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-violet-700 dark:text-violet-400">
              <Target className="h-3.5 w-3.5" />PRÓXIMA MELHOR AÇÃO
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold">{mockNextAction.lead}</p>
                <p className="text-[11px] text-muted-foreground">{mockNextAction.motivo}</p>
              </div>
              <Badge className={cn("text-[9px] shrink-0", prioridadeColors[mockNextAction.urgencia])}>
                {mockNextAction.urgencia.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <PhoneCall className="h-3 w-3" /><span>Canal sugerido: <strong className="text-foreground">{mockNextAction.canal}</strong></span>
            </div>
            <p className="text-xs bg-white/60 dark:bg-white/5 rounded p-2 border border-violet-200/50 dark:border-violet-800/50 italic">
              💡 {mockNextAction.argumento}
            </p>
            <Button size="sm" className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs h-8">
              <PhoneCall className="h-3 w-3 mr-1" />Executar Agora <ArrowRight className="h-3 w-3 ml-auto" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <Zap className="h-3.5 w-3.5" />SUGESTÃO DE TAREFA
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            <div>
              <p className="text-sm font-bold">{mockSugestaoTarefa.tipo}: {mockSugestaoTarefa.lead}</p>
              <Badge className={cn("text-[9px] mt-1", prioridadeColors[mockSugestaoTarefa.prioridade])}>
                {mockSugestaoTarefa.prioridade.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{mockSugestaoTarefa.descricao}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
                <Send className="h-3 w-3 mr-1" />Criar Atividade
              </Button>
              <Button size="sm" variant="ghost" className="text-xs h-8">Ignorar</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Pipeline Analysis + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
              <TrendingUp className="h-3.5 w-3.5" />ANÁLISE DO PIPELINE
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/50">
                <p className="text-lg font-bold text-red-700 dark:text-red-400">{mockAnalise.leadsParados}</p>
                <p className="text-[10px] text-muted-foreground">Leads Parados</p>
              </div>
              <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/50">
                <p className="text-lg font-bold text-green-700 dark:text-green-400">{mockAnalise.leadsQuentes}</p>
                <p className="text-[10px] text-muted-foreground">Leads Quentes</p>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{mockAnalise.taxaConversao}%</p>
                <p className="text-[10px] text-muted-foreground">Taxa Conversão</p>
              </div>
              <div className="p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/50">
                <p className="text-lg font-bold text-violet-700 dark:text-violet-400">{mockAnalise.oportunidades}</p>
                <p className="text-[10px] text-muted-foreground">Oportunidades</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-red-700 dark:text-red-400">
              <Bell className="h-3.5 w-3.5" />ALERTAS INTELIGENTES
              <Badge className="bg-red-500/15 text-red-700 border-red-300 text-[9px] ml-auto">{mockAlertas.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            {mockAlertas.map(a => (
              <div key={a.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <a.icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", alertaColors[a.tipo])} />
                <p className="text-[11px] leading-tight">{a.texto}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Agenda Sugerida */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
            <CalendarDays className="h-3.5 w-3.5" />AGENDA SUGERIDA PARA HOJE
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-1.5">
            {mockAgenda.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
                <span className="text-xs font-mono font-bold text-muted-foreground w-12 shrink-0">{item.hora}</span>
                <div className="h-8 w-[2px] rounded-full bg-emerald-300 dark:bg-emerald-700 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.tarefa}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{item.canal}</span>
                    <Badge className={cn("text-[9px]", prioridadeColors[item.prioridade])}>{item.prioridade}</Badge>
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
    </div>
  );
}

export default function Atividades() {
  const [atividades, setAtividades] = useState(mockAtividades);
  const [fStatus, setFStatus] = useState("all");
  const [fTipo, setFTipo] = useState("all");
  const [fConsultor, setFConsultor] = useState("all");
  const [fCoop, setFCoop] = useState("all");
  const [fRegional, setFRegional] = useState("all");
  const [fDateStart, setFDateStart] = useState<Date | undefined>();
  const [fDateEnd, setFDateEnd] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ tipo: "", data: "", hora: "", descricao: "", responsavel: "", lead: "", lembrete: false });

  const filtered = useMemo(() => {
    return atividades.filter(a => {
      if (fStatus !== "all" && a.status !== fStatus) return false;
      if (fTipo !== "all" && a.tipo !== fTipo) return false;
      if (fConsultor !== "all" && a.responsavel !== fConsultor) return false;
      if (fDateStart && a.data < format(fDateStart, "yyyy-MM-dd")) return false;
      if (fDateEnd && a.data > format(fDateEnd, "yyyy-MM-dd")) return false;
      return true;
    });
  }, [atividades, fStatus, fTipo, fConsultor, fDateStart, fDateEnd]);

  const pendentes = filtered.filter(a => a.status === "Pendente").length;
  const concluidasHoje = filtered.filter(a => a.status === "Concluída" && a.data === new Date().toISOString().split("T")[0]).length;
  const atrasadas = filtered.filter(a => a.status === "Atrasada").length;

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(a => a.id)));
  }
  function concluirSelecionados() {
    setAtividades(prev => prev.map(a => selected.has(a.id) ? { ...a, status: "Concluída" as const } : a));
    toast({ title: `${selected.size} atividades concluídas` });
    setSelected(new Set());
  }
  function excluirSelecionados() {
    setAtividades(prev => prev.filter(a => !selected.has(a.id)));
    toast({ title: `${selected.size} atividades excluídas` });
    setSelected(new Set());
  }
  function concluir(id: string) {
    setAtividades(prev => prev.map(a => a.id === id ? { ...a, status: "Concluída" as const } : a));
    toast({ title: "Atividade concluída" });
  }
  function excluir(id: string) {
    setAtividades(prev => prev.filter(a => a.id !== id));
    toast({ title: "Atividade excluída" });
  }
  function clearFilters() { setFStatus("all"); setFTipo("all"); setFConsultor("all"); setFCoop("all"); setFRegional("all"); setFDateStart(undefined); setFDateEnd(undefined); }
  const activeFilters = [fStatus !== "all", fTipo !== "all", fConsultor !== "all", fCoop !== "all", fRegional !== "all", !!fDateStart, !!fDateEnd].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Atividades</h1>
          <p className="text-sm text-muted-foreground">Central de tarefas e compromissos da equipe comercial</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-3.5 w-3.5 mr-1" />Filtros
            {activeFilters > 0 && <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">{activeFilters}</Badge>}
          </Button>
          <Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4 mr-1" />Nova Atividade</Button>
        </div>
      </div>

      {/* AI Advisor */}
      <AIAdvisorSection />

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{pendentes}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{concluidasHoje}</p><p className="text-xs text-muted-foreground">Concluídas Hoje</p></div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
            <div><p className="text-2xl font-bold">{atrasadas}</p><p className="text-xs text-muted-foreground">Atrasadas</p></div>
          </CardContent>
        </Card>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <div className="space-y-1"><Label className="text-xs">Status</Label>
                <Select value={fStatus} onValueChange={setFStatus}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="Pendente">Pendente</SelectItem><SelectItem value="Concluída">Concluída</SelectItem><SelectItem value="Atrasada">Atrasada</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Tipo</Label>
                <Select value={fTipo} onValueChange={setFTipo}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todos</SelectItem>{tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Data Início</Label>
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
                  <SelectContent><SelectItem value="all">Todos</SelectItem>{consultores.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Cooperativa</Label>
                <Select value={fCoop} onValueChange={setFCoop}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todas</SelectItem>{cooperativas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Regional</Label>
                <Select value={fRegional} onValueChange={setFRegional}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todas</SelectItem>{regionais.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-end"><Button size="sm" variant="outline" onClick={clearFilters}><X className="h-3 w-3 mr-1" />Limpar</Button></div>
            </div>
          </CardContent>
        </Card>
      )}

      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border">
          <span className="text-sm font-medium">{selected.size} selecionado(s)</span>
          <Button size="sm" onClick={concluirSelecionados} className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="h-3.5 w-3.5 mr-1" />Concluir Selecionados</Button>
          <Button size="sm" variant="destructive" onClick={excluirSelecionados}><Trash2 className="h-3.5 w-3.5 mr-1" />Excluir Selecionados</Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"><Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></TableHead>
                  <TableHead className="text-xs">Tipo</TableHead>
                  <TableHead className="text-xs">Descrição</TableHead>
                  <TableHead className="text-xs">Lead Vinculado</TableHead>
                  <TableHead className="text-xs">Responsável</TableHead>
                  <TableHead className="text-xs">Data/Hora</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(a => {
                  const Icon = tipoIcons[a.tipo] || Phone;
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/30">
                      <TableCell><Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggleSelect(a.id)} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" /><span className="text-xs">{a.tipo}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm max-w-[250px] truncate">{a.descricao}</TableCell>
                      <TableCell className="text-xs">{a.lead_vinculado ? <span className="text-primary cursor-pointer hover:underline">{a.lead_vinculado}</span> : "—"}</TableCell>
                      <TableCell className="text-xs">{a.responsavel}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{new Date(a.data + "T00:00:00").toLocaleDateString("pt-BR")} {a.hora}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px]", statusColors[a.status], a.status === "Atrasada" && "animate-pulse")}>
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {a.status !== "Concluída" && <DropdownMenuItem onClick={() => concluir(a.id)}><CheckCircle className="h-3.5 w-3.5 mr-2" />Concluir</DropdownMenuItem>}
                            <DropdownMenuItem><Pencil className="h-3.5 w-3.5 mr-2" />Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => excluir(a.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" />Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Atividade</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Tipo</Label>
              <Select value={newForm.tipo} onValueChange={v => setNewForm({ ...newForm, tipo: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Data</Label>
                <Popover><PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start", !newForm.data && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4 mr-2" />{newForm.data || "Selecione"}
                  </Button>
                </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={newForm.data ? new Date(newForm.data + "T00:00:00") : undefined} onSelect={d => setNewForm({ ...newForm, data: d ? format(d, "yyyy-MM-dd") : "" })} className="p-3 pointer-events-auto" /></PopoverContent></Popover>
              </div>
              <div className="space-y-1.5"><Label>Hora</Label>
                <Select value={newForm.hora} onValueChange={v => setNewForm({ ...newForm, hora: v })}><SelectTrigger><SelectValue placeholder="Horário" /></SelectTrigger>
                  <SelectContent>{Array.from({ length: 24 }, (_, i) => { const h = `${String(i).padStart(2, "0")}:00`; return <SelectItem key={h} value={h}>{h}</SelectItem>; })}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Descrição Detalhada</Label><Textarea value={newForm.descricao} onChange={e => setNewForm({ ...newForm, descricao: e.target.value })} rows={3} /></div>
            <div className="space-y-1.5"><Label>Consultor Responsável</Label>
              <Select value={newForm.responsavel} onValueChange={v => setNewForm({ ...newForm, responsavel: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{consultores.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Vincular Negociação (opcional)</Label><Input value={newForm.lead} onChange={e => setNewForm({ ...newForm, lead: e.target.value })} placeholder="Buscar por nome ou ID" /></div>
            <div className="flex items-center gap-2"><Switch checked={newForm.lembrete} onCheckedChange={v => setNewForm({ ...newForm, lembrete: v })} /><span className="text-sm">Enviar lembrete ao responsável</span></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
              <Button disabled={!newForm.tipo || !newForm.descricao}>Salvar Atividade</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}