import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Plus, Search, Download, Eye, Save, Loader2,
  AlertTriangle, Car, User, Wrench, Users, DollarSign,
  BarChart3, Clock, CheckCircle2, XCircle, FileText,
  ChevronRight, ChevronLeft, Upload, Trash2, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import EventoDetalhe from "./EventoDetalhe";

// ── Types & Constants ──────────────────────────────────────

const tiposEvento = ["Colisão", "Roubo", "Furto", "Fenômeno Natural", "Incêndio", "Periférico"];
const statusConsulta = ["Em análise", "Em reparo", "Aguardando docs", "Indenização integral", "Negado", "Reembolso"];
const regionais = ["Central SP", "Campinas", "Ribeirão Preto", "Litoral SP", "Curitiba", "Belo Horizonte"];
const categoriasVeiculo = ["Passeio", "Utilitário", "Caminhão", "Moto", "Van"];

const statusColor: Record<string, string> = {
  "Em análise": "bg-warning/10 text-warning",
  "Em reparo": "bg-primary/8 text-primary",
  "Aguardando docs": "bg-warning/10 text-warning",
  "Indenização integral": "bg-accent/8 text-accent",
  "Negado": "bg-destructive/8 text-destructive",
  "Reembolso": "bg-success/10 text-success",
};

// ── Mock Data (kept for complex UI sections) ─────────────

const mockTimeline = [
  { protocolo: "EVT-2025-0341", movimentacoes: [
    { data: "15/06/2025 08:30", acao: "Evento registrado", usuario: "João Mendes" },
    { data: "15/06/2025 14:00", acao: "Documentação recebida", usuario: "Ana Costa" },
    { data: "18/06/2025 10:15", acao: "Análise iniciada", usuario: "Pedro Lima" },
    { data: "22/06/2025 16:45", acao: "Orçamento aprovado — R$ 7.200,00", usuario: "Gerente" },
    { data: "25/06/2025 09:00", acao: "Enviado para oficina", usuario: "João Mendes" },
  ]},
  { protocolo: "EVT-2025-0298", movimentacoes: [
    { data: "20/06/2025 22:10", acao: "Evento registrado — Roubo", usuario: "Ana Costa" },
    { data: "21/06/2025 08:00", acao: "Boletim de ocorrência anexado", usuario: "Maria Fernanda" },
    { data: "23/06/2025 11:30", acao: "Análise pericial agendada", usuario: "Pedro Lima" },
  ]},
];

// ── Main Component ─────────────────────────────────────────

export default function EventoTab() {
  const [subTab, setSubTab] = useState<string>("cadastro");

  const tabs = [
    { id: "cadastro", label: "Cadastro de Evento", icon: Plus },
    { id: "consultar", label: "Consultar Eventos", icon: Search },
    { id: "rateio-eventos", label: "Eventos p/ Rateio", icon: AlertTriangle },
    { id: "distribuicao", label: "Distribuição Rateio", icon: DollarSign },
    { id: "historico", label: "Histórico Distrib.", icon: Clock },
    { id: "monitoramento", label: "Monitoramento", icon: BarChart3 },
    { id: "relatorios", label: "Relatórios", icon: FileText },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary">Eventos</h2>
        <p className="text-sm text-muted-foreground">Cadastro, rateio, distribuição e monitoramento de eventos</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
              subTab === t.id
                ? "bg-[#002050] text-white shadow-md"
                : "bg-[#003870] text-white hover:bg-[#002a57]"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "cadastro" && <CadastroEventoTab />}
      {subTab === "consultar" && <ConsultarEventosTab />}
      {subTab === "rateio-eventos" && <EventosRateioTab />}
      {subTab === "distribuicao" && <DistribuicaoRateioTab />}
      {subTab === "historico" && <HistoricoDistribuicaoTab />}
      {subTab === "monitoramento" && <MonitoramentoTab />}
      {subTab === "relatorios" && <RelatoriosEventoTab />}
    </div>
  );
}

// ── 1) CADASTRO DE EVENTO (9-step stepper) ─────────────────

function CadastroEventoTab() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [placaBusca, setPlacaBusca] = useState("");
  const [dadosCarregados, setDadosCarregados] = useState(false);
  const [dadosVeiculo, setDadosVeiculo] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    tipo: "Colisão",
    motivo: "",
    descricao: "",
    associado_nome: "",
    placa: "",
    modelo: "",
    ano_modelo: "",
    valor_fipe: 0,
    valor_estimado: 0,
    valor_real: 0,
    status: "Em análise",
    data_evento: "",
  });

  const steps = [
    "Informações Gerais", "Dados da Ocorrência", "Dados do Condutor",
    "Reparo Veículo Associado", "Veículo Terceiro", "Reparo Terceiro",
    "Reparo Patrimonial", "Parâmetros Rateio", "Termos",
  ];

  const buscarPlaca = async () => {
    if (!placaBusca) return;
    setLoading(true);
    try {
      // Try to find vehicle/associado by placa in existing eventos
      const { data, error } = await supabase
        .from("eventos")
        .select("associado_nome, placa, modelo, ano_modelo, valor_fipe")
        .eq("placa", placaBusca)
        .limit(1)
        .maybeSingle();

      if (data) {
        setDadosVeiculo(data);
        setFormData(prev => ({
          ...prev,
          associado_nome: data.associado_nome || "",
          placa: data.placa || placaBusca,
          modelo: data.modelo || "",
          ano_modelo: data.ano_modelo || "",
          valor_fipe: data.valor_fipe || 0,
        }));
        setDadosCarregados(true);
        toast.success("Dados carregados da placa " + placaBusca);
      } else {
        setDadosVeiculo(null);
        setFormData(prev => ({ ...prev, placa: placaBusca }));
        setDadosCarregados(true);
        toast.info("Placa não encontrada em eventos anteriores. Preencha manualmente.");
      }
    } catch (err) {
      toast.error("Erro ao buscar placa");
    } finally {
      setLoading(false);
    }
  };

  const salvarEvento = async () => {
    setSaving(true);
    try {
      const protocolo = `EVT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;

      const { data, error } = await supabase
        .from("eventos")
        .insert({
          protocolo,
          tipo: formData.tipo,
          motivo: formData.motivo,
          descricao: formData.descricao,
          associado_nome: formData.associado_nome,
          placa: formData.placa,
          modelo: formData.modelo,
          ano_modelo: formData.ano_modelo,
          valor_fipe: formData.valor_fipe,
          valor_estimado: formData.valor_estimado,
          valor_real: formData.valor_real,
          status: formData.status,
          data_evento: formData.data_evento || new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Evento cadastrado com sucesso — Protocolo ${protocolo}`);
      setStep(0);
      setDadosCarregados(false);
      setPlacaBusca("");
      setDadosVeiculo(null);
      setFormData({
        tipo: "Colisão", motivo: "", descricao: "", associado_nome: "",
        placa: "", modelo: "", ano_modelo: "", valor_fipe: 0,
        valor_estimado: 0, valor_real: 0, status: "Em análise", data_evento: "",
      });
    } catch (err: any) {
      toast.error("Erro ao salvar evento: " + (err.message || "Erro desconhecido"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <button
              onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                i === step ? "bg-primary text-white" :
                i < step ? "bg-secondary text-foreground" :
                "bg-muted text-muted-foreground"
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-current/20">
                {i < step ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1 shrink-0" />}
          </div>
        ))}
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-primary">{steps[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 0 - Informações Gerais */}
          {step === 0 && (
            <>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Buscar por Placa / Chassi</Label>
                  <Input placeholder="Ex: BRA2E19 ou 9BGKS48U..." value={placaBusca} onChange={e => setPlacaBusca(e.target.value.toUpperCase())} />
                </div>
                <Button onClick={buscarPlaca} disabled={loading} className="bg-primary hover:bg-primary/90 text-white gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Buscar
                </Button>
              </div>
              {dadosCarregados && (
                <div className="grid grid-cols-2 gap-3 p-4 bg-muted rounded-lg border border-border">
                  <div><Label className="text-xs text-muted-foreground">Associado</Label>
                    <Input className="text-sm font-medium" value={formData.associado_nome} onChange={e => setFormData(prev => ({ ...prev, associado_nome: e.target.value }))} />
                  </div>
                  <div><Label className="text-xs text-muted-foreground">Modelo</Label>
                    <Input className="text-sm" value={formData.modelo} onChange={e => setFormData(prev => ({ ...prev, modelo: e.target.value }))} />
                  </div>
                  <div><Label className="text-xs text-muted-foreground">Placa</Label><p className="text-sm font-mono">{formData.placa || placaBusca}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Ano Modelo</Label>
                    <Input className="text-sm" value={formData.ano_modelo} onChange={e => setFormData(prev => ({ ...prev, ano_modelo: e.target.value }))} />
                  </div>
                  <div><Label className="text-xs text-muted-foreground">Valor FIPE</Label>
                    <Input type="number" className="text-sm" value={formData.valor_fipe} onChange={e => setFormData(prev => ({ ...prev, valor_fipe: Number(e.target.value) }))} />
                  </div>
                  <div><Label className="text-xs text-muted-foreground">Status</Label><Badge className="bg-success/10 text-success">Ativo</Badge></div>
                </div>
              )}
            </>
          )}

          {/* Step 1 - Dados da Ocorrência */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Data do Evento *</Label><Input type="date" value={formData.data_evento} onChange={e => setFormData(prev => ({ ...prev, data_evento: e.target.value }))} /></div>
              <div><Label className="text-xs">Hora</Label><Input type="time" defaultValue="14:30" /></div>
              <div><Label className="text-xs">Data do Reporte</Label><Input type="date" defaultValue={new Date().toISOString().split("T")[0]} /></div>
              <div>
                <Label className="text-xs">Tipo de Evento *</Label>
                <Select value={formData.tipo} onValueChange={v => setFormData(prev => ({ ...prev, tipo: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{tiposEvento.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="col-span-2"><Label className="text-xs">Descrição da Ocorrência</Label><Textarea value={formData.descricao} onChange={e => setFormData(prev => ({ ...prev, descricao: e.target.value }))} placeholder="Descreva o que aconteceu..." className="min-h-[80px]" /></div>
              <div className="col-span-2"><Label className="text-xs">Motivo</Label><Input value={formData.motivo} onChange={e => setFormData(prev => ({ ...prev, motivo: e.target.value }))} placeholder="Motivo do evento" /></div>
            </div>
          )}

          {/* Step 2 - Dados do Condutor */}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Nome do Condutor</Label><Input defaultValue={formData.associado_nome} /></div>
              <div><Label className="text-xs">CPF</Label><Input placeholder="000.000.000-00" /></div>
              <div><Label className="text-xs">CNH</Label><Input placeholder="00000000000" /></div>
              <div><Label className="text-xs">Data de Nascimento</Label><Input type="date" /></div>
              <div><Label className="text-xs">Telefone</Label><Input placeholder="(00) 00000-0000" /></div>
              <div className="col-span-2"><Label className="text-xs">Observações</Label><Textarea placeholder="Observações sobre o condutor..." /></div>
            </div>
          )}

          {/* Step 3 - Reparo Veículo Associado */}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Oficina</Label><Input placeholder="Nome da oficina" /></div>
              <div>
                <Label className="text-xs">Tipo de Reparo</Label>
                <Select defaultValue="funilaria"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                  <SelectItem value="funilaria">Funilaria e Pintura</SelectItem>
                  <SelectItem value="mecanica">Mecânica</SelectItem>
                  <SelectItem value="eletrica">Elétrica</SelectItem>
                  <SelectItem value="vidros">Vidros</SelectItem>
                </SelectContent></Select>
              </div>
              <div className="col-span-2"><Label className="text-xs">Descrição do Serviço</Label><Textarea placeholder="Descreva os serviços necessários..." /></div>
              <div><Label className="text-xs">Valor Estimado</Label><Input type="number" value={formData.valor_estimado} onChange={e => setFormData(prev => ({ ...prev, valor_estimado: Number(e.target.value) }))} /></div>
              <div><Label className="text-xs">Valor Real/Aprovado</Label><Input type="number" value={formData.valor_real} onChange={e => setFormData(prev => ({ ...prev, valor_real: Number(e.target.value) }))} /></div>
              <div><Label className="text-xs">Previsão de Conclusão</Label><Input type="date" /></div>
              <div>
                <Label className="text-xs">Status do Reparo</Label>
                <Select defaultValue="em-andamento"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                  <SelectItem value="orcamento">Orçamento</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="em-andamento">Em andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent></Select>
              </div>
            </div>
          )}

          {/* Step 4 - Veículo Terceiro */}
          {step === 4 && (
            <div className="space-y-4">
              <Card className="border-border">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-primary">Terceiro #1 — Dados Pessoais</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Nome</Label><Input placeholder="Nome completo" /></div>
                    <div><Label className="text-xs">CPF</Label><Input placeholder="000.000.000-00" /></div>
                    <div><Label className="text-xs">CNH</Label><Input placeholder="00000000000" /></div>
                    <div><Label className="text-xs">Telefone</Label><Input placeholder="(00) 00000-0000" /></div>
                    <div><Label className="text-xs">E-mail</Label><Input placeholder="email@exemplo.com" /></div>
                    <div>
                      <Label className="text-xs">Situação</Label>
                      <Select defaultValue="envolvido"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                        <SelectItem value="envolvido">Envolvido</SelectItem>
                        <SelectItem value="vitima">Vítima</SelectItem>
                        <SelectItem value="causador">Causador</SelectItem>
                      </SelectContent></Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-primary">Terceiro #1 — Dados do Veículo</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Placa</Label><Input placeholder="ABC1D23" /></div>
                    <div><Label className="text-xs">Chassi</Label><Input placeholder="Chassi do veículo" /></div>
                    <div><Label className="text-xs">Marca</Label><Input placeholder="Marca" /></div>
                    <div><Label className="text-xs">Modelo</Label><Input placeholder="Modelo" /></div>
                    <div><Label className="text-xs">Ano</Label><Input placeholder="2024" /></div>
                    <div><Label className="text-xs">Cor</Label><Input placeholder="Cor" /></div>
                  </div>
                </CardContent>
              </Card>
              <Button variant="outline" className="gap-2 border-border" onClick={() => toast.info("Formulário de terceiro adicional aberto")}>
                <Plus className="h-4 w-4" />Adicionar outro terceiro
              </Button>
            </div>
          )}

          {/* Step 5 - Reparo Terceiro */}
          {step === 5 && (
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Oficina</Label><Input placeholder="Nome da oficina" /></div>
              <div className="col-span-2"><Label className="text-xs">Descrição do Serviço</Label><Textarea placeholder="Descreva os reparos do terceiro..." /></div>
              <div><Label className="text-xs">Valor do Orçamento</Label><Input type="number" placeholder="0.00" /></div>
              <div><Label className="text-xs">Valor Aprovado</Label><Input type="number" placeholder="0.00" /></div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select defaultValue="orcamento"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                  <SelectItem value="orcamento">Orçamento</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="em-andamento">Em andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent></Select>
              </div>
            </div>
          )}

          {/* Step 6 - Reparo Patrimonial */}
          {step === 6 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label className="text-xs">Descrição do Dano Patrimonial</Label><Textarea placeholder="Descreva os danos patrimoniais..." /></div>
              <div><Label className="text-xs">Valor Estimado</Label><Input type="number" placeholder="0.00" /></div>
              <div><Label className="text-xs">Valor Aprovado</Label><Input type="number" placeholder="0.00" /></div>
              <div>
                <Label className="text-xs">Situação</Label>
                <Select defaultValue="pendente"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em-analise">Em análise</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent></Select>
              </div>
              <div className="col-span-2"><Label className="text-xs">Observações</Label><Textarea placeholder="Observações adicionais..." /></div>
            </div>
          )}

          {/* Step 7 - Parâmetros Rateio */}
          {step === 7 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex items-center gap-3">
                <Checkbox id="elegivel" defaultChecked />
                <Label htmlFor="elegivel" className="text-sm">Elegível para rateio</Label>
              </div>
              <div>
                <Label className="text-xs">Regional</Label>
                <Select defaultValue="Central SP"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{regionais.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
              </div>
              <div>
                <Label className="text-xs">Categoria do Veículo</Label>
                <Select defaultValue="Passeio"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categoriasVeiculo.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Valor do Evento para Rateio</Label><Input type="number" placeholder="0.00" /></div>
            </div>
          )}

          {/* Step 8 - Termos */}
          {step === 8 && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Upload de Documentos</Label>
                <div className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => toast.info("Selecione os documentos para upload")}>
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Clique ou arraste arquivos aqui</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG — máx. 10MB</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Documentos Anexados</Label>
                <p className="text-xs text-muted-foreground">Nenhum documento anexado ainda.</p>
              </div>
              <div className="p-3 bg-muted rounded-lg border border-border">
                <p className="text-xs font-semibold text-primary mb-2">Registro de Aceite de Termos</p>
                <div className="space-y-1.5">
                  {[
                    { termo: "Termo de Responsabilidade", aceito: false, data: "" },
                    { termo: "Termo de Ciência de Rateio", aceito: false, data: "" },
                    { termo: "Autorização de Vistoria", aceito: false, data: "" },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {t.aceito ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className={t.aceito ? "font-medium" : "text-muted-foreground"}>{t.termo}</span>
                      {t.data && <span className="text-muted-foreground ml-auto">{t.data}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)} className="gap-2 border-border">
          <ChevronLeft className="h-4 w-4" />Anterior
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} className="gap-2 bg-primary hover:bg-primary/90 text-white">
            Próximo<ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={salvarEvento} disabled={saving} className="gap-2 bg-primary hover:bg-primary/90 text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Salvar Evento
          </Button>
        )}
      </div>
    </div>
  );
}

// ── 2) CONSULTAR EVENTOS ───────────────────────────────────

function ConsultarEventosTab() {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvento, setSelectedEvento] = useState<any | null>(null);

  const fetchEventos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("eventos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setEventos(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar eventos: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  const filtered = eventos.filter(e => {
    if (filtroStatus !== "Todos" && e.status !== filtroStatus) return false;
    if (busca) {
      const term = busca.toLowerCase();
      const matchAssociado = (e.associado_nome || "").toLowerCase().includes(term);
      const matchPlaca = (e.placa || "").toLowerCase().includes(term);
      const matchProtocolo = (e.protocolo || "").toLowerCase().includes(term);
      if (!matchAssociado && !matchPlaca && !matchProtocolo) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs">Buscar</Label>
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Protocolo, associado ou placa..." value={busca} onChange={e => setBusca(e.target.value)} /></div>
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Todos">Todos</SelectItem>{statusConsulta.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        </div>
        <Button variant="outline" className="gap-2 border-border" onClick={fetchEventos} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Carregando eventos...</span>
        </div>
      ) : (
        <div className="border rounded-lg border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="text-xs">Protocolo</TableHead>
                <TableHead className="text-xs">Associado</TableHead>
                <TableHead className="text-xs">Placa</TableHead>
                <TableHead className="text-xs">Tipo</TableHead>
                <TableHead className="text-xs">Data</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs w-16">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(e => (
                <TableRow key={e.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedEvento(e)}>
                  <TableCell className="font-mono text-xs">{e.protocolo}</TableCell>
                  <TableCell className="text-sm font-medium">{e.associado_nome || "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{e.placa || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs border-primary/30 bg-primary/8">{e.tipo || "—"}</Badge></TableCell>
                  <TableCell className="text-sm">{e.data_evento ? new Date(e.data_evento).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell><Badge className={`text-xs ${statusColor[e.status] || "bg-gray-100 text-gray-800"}`}>{e.status || "—"}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(ev) => { ev.stopPropagation(); setSelectedEvento(e); }}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum evento encontrado</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{filtered.length} evento(s) encontrado(s)</p>

      {selectedEvento && (
        <EventoDetalhe evento={selectedEvento} onClose={() => setSelectedEvento(null)} />
      )}
    </div>
  );
}

// ── 3) EVENTOS PARA RATEIO ─────────────────────────────────

function EventosRateioTab() {
  const [mes, setMes] = useState("07/2025");
  const [valor, setValor] = useState("");
  const [cat, setCat] = useState("");
  const [reg, setReg] = useState("");
  const [eventosRateio, setEventosRateio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchEventosRateio = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("evento_rateio")
        .select("*, eventos(protocolo, tipo, associado_nome)")
        .eq("tipo", "ficticio")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEventosRateio(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar eventos de rateio: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEventosRateio();
  }, [fetchEventosRateio]);

  const criarEventoFicticio = async () => {
    if (!mes) {
      toast.error("Mês de referência é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const distribuicao: Record<string, any> = {};
      if (cat) distribuicao.categoria = cat;
      if (reg) distribuicao.regional = reg;

      const { error } = await supabase
        .from("evento_rateio")
        .insert({
          tipo: "ficticio",
          mes_referencia: mes,
          valor_distribuido: valor ? parseFloat(valor.replace(/[^\d.,]/g, "").replace(",", ".")) : 0,
          distribuicao,
        });

      if (error) throw error;
      toast.success("Evento fictício criado para " + mes);
      setValor("");
      setCat("");
      setReg("");
      fetchEventosRateio();
    } catch (err: any) {
      toast.error("Erro ao criar evento: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-primary">Criar Evento Fictício para Rateio</CardTitle>
          <CardDescription>Eventos administrativos com valor zerado ou ajustes para distribuição mensal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div><Label className="text-xs">Mês Referência *</Label><Input value={mes} onChange={e => setMes(e.target.value)} placeholder="MM/AAAA" /></div>
            <div><Label className="text-xs">Valor Total</Label><Input value={valor} onChange={e => setValor(e.target.value)} placeholder="R$ 0,00" /></div>
            <div>
              <Label className="text-xs">Categoria Veículo</Label>
              <Select value={cat} onValueChange={setCat}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{categoriasVeiculo.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
            <div>
              <Label className="text-xs">Regional</Label>
              <Select value={reg} onValueChange={setReg}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{regionais.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <Button className="mt-4 gap-2 bg-primary hover:bg-primary/90 text-white" disabled={saving} onClick={criarEventoFicticio}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Criar Evento
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base text-primary">Eventos Fictícios Cadastrados</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Carregando...</span>
            </div>
          ) : (
            <div className="border rounded-lg border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="text-xs">Mês</TableHead>
                    <TableHead className="text-xs">Evento Vinculado</TableHead>
                    <TableHead className="text-xs text-right">Valor Distribuído</TableHead>
                    <TableHead className="text-xs">Categoria</TableHead>
                    <TableHead className="text-xs">Regional</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventosRateio.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm font-mono">{e.mes_referencia || "—"}</TableCell>
                      <TableCell className="text-sm">{e.eventos?.protocolo || "Sem vínculo"}</TableCell>
                      <TableCell className="text-sm text-right font-medium">R$ {(e.valor_distribuido || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-sm">{e.distribuicao?.categoria || "—"}</TableCell>
                      <TableCell className="text-sm">{e.distribuicao?.regional || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {eventosRateio.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum evento fictício cadastrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── 4) DISTRIBUIÇÃO DE RATEIO ──────────────────────────────

function DistribuicaoRateioTab() {
  const [mesRef, setMesRef] = useState("07/2025");
  const [dataLimite, setDataLimite] = useState("2025-07-25");
  const [valorBase, setValorBase] = useState("85.50");
  const [distribuicaoData, setDistribuicaoData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchDistribuicao = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("evento_rateio")
        .select("*")
        .eq("tipo", "real")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data for display - extract from distribuicao JSONB
      const rows = (data || []).flatMap(r => {
        const dist = r.distribuicao;
        if (dist && Array.isArray(dist)) {
          return dist.map((d: any) => ({
            id: r.id,
            regional: d.regional || "—",
            categoria: d.categoria || "—",
            qtdeVeiculos: d.qtdeVeiculos || 0,
            valorBase: d.valorBase || parseFloat(valorBase) || 0,
            fator: d.fator || 1.0,
            valorCalc: d.valorCalc || 0,
          }));
        }
        // Single distribution row
        return [{
          id: r.id,
          regional: dist?.regional || "—",
          categoria: dist?.categoria || "—",
          qtdeVeiculos: dist?.qtdeVeiculos || 0,
          valorBase: dist?.valorBase || parseFloat(valorBase) || 0,
          fator: dist?.fator || 1.0,
          valorCalc: dist?.valorCalc || r.valor_distribuido || 0,
        }];
      });

      setDistribuicaoData(rows);
    } catch (err: any) {
      toast.error("Erro ao carregar distribuição: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  }, [valorBase]);

  useEffect(() => {
    fetchDistribuicao();
  }, [fetchDistribuicao]);

  const totalDistribuido = distribuicaoData.reduce((s, d) => s + (d.qtdeVeiculos * d.valorCalc), 0);

  const gravarRateio = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("evento_rateio")
        .insert({
          tipo: "real",
          mes_referencia: mesRef,
          valor_distribuido: totalDistribuido,
          distribuicao: distribuicaoData.map(d => ({
            regional: d.regional,
            categoria: d.categoria,
            qtdeVeiculos: d.qtdeVeiculos,
            valorBase: d.valorBase,
            fator: d.fator,
            valorCalc: d.valorCalc,
          })),
        });

      if (error) throw error;
      toast.success("Rateio gravado com sucesso para " + mesRef);
      fetchDistribuicao();
    } catch (err: any) {
      toast.error("Erro ao gravar rateio: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-3 items-end flex-wrap">
        <div><Label className="text-xs">Mês Referência</Label><Input value={mesRef} onChange={e => setMesRef(e.target.value)} className="w-32" /></div>
        <div><Label className="text-xs">Data Limite</Label><Input type="date" value={dataLimite} onChange={e => setDataLimite(e.target.value)} className="w-44" /></div>
        <div><Label className="text-xs">Valor Base (1ª cota)</Label><Input value={valorBase} onChange={e => setValorBase(e.target.value)} className="w-32" /></div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Carregando distribuição...</span>
        </div>
      ) : (
        <div className="border rounded-lg border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="text-xs">Regional</TableHead>
                <TableHead className="text-xs">Categoria</TableHead>
                <TableHead className="text-xs text-right">Qtde Veículos</TableHead>
                <TableHead className="text-xs text-right">Valor Base</TableHead>
                <TableHead className="text-xs text-right">Fator Multiplicador</TableHead>
                <TableHead className="text-xs text-right">Valor Calculado</TableHead>
                <TableHead className="text-xs text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distribuicaoData.map((d, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{d.regional}</TableCell>
                  <TableCell className="text-sm">{d.categoria}</TableCell>
                  <TableCell className="text-sm text-right">{d.qtdeVeiculos}</TableCell>
                  <TableCell className="text-sm text-right">R$ {(d.valorBase || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-right font-mono">{(d.fator || 0).toFixed(2)}x</TableCell>
                  <TableCell className="text-sm text-right font-medium">R$ {(d.valorCalc || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-right font-medium">R$ {(d.qtdeVeiculos * d.valorCalc).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
              {distribuicaoData.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma distribuição encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-primary">Total Distribuído: R$ {totalDistribuido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-white" disabled={saving} onClick={gravarRateio}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Gravar Rateio
        </Button>
      </div>
    </div>
  );
}

// ── 5) HISTÓRICO DE DISTRIBUIÇÃO ───────────────────────────

function HistoricoDistribuicaoTab() {
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistorico = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("evento_rateio")
          .select("*")
          .order("mes_referencia", { ascending: false });

        if (error) throw error;

        // Group by mes_referencia
        const grouped: Record<string, { valorTotal: number; count: number; createdAt: string }> = {};
        (data || []).forEach(r => {
          const mes = r.mes_referencia || "Sem mês";
          if (!grouped[mes]) {
            grouped[mes] = { valorTotal: 0, count: 0, createdAt: r.created_at };
          }
          grouped[mes].valorTotal += r.valor_distribuido || 0;
          grouped[mes].count += 1;
          // Keep the latest created_at
          if (r.created_at > grouped[mes].createdAt) {
            grouped[mes].createdAt = r.created_at;
          }
        });

        const rows = Object.entries(grouped).map(([mes, info]) => ({
          mes,
          valorTotal: info.valorTotal,
          registros: info.count,
          data: info.createdAt,
        }));

        setHistorico(rows);
      } catch (err: any) {
        toast.error("Erro ao carregar histórico: " + (err.message || ""));
      } finally {
        setLoading(false);
      }
    };

    fetchHistorico();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando histórico...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="border rounded-lg border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="text-xs">Mês Referência</TableHead>
              <TableHead className="text-xs text-right">Valor Total Distribuído</TableHead>
              <TableHead className="text-xs text-right">Registros</TableHead>
              <TableHead className="text-xs">Data Lançamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historico.map((h, i) => (
              <TableRow key={i}>
                <TableCell className="text-sm font-mono font-medium">{h.mes}</TableCell>
                <TableCell className="text-sm text-right font-bold">R$ {h.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-sm text-right">{h.registros}</TableCell>
                <TableCell className="text-sm">{h.data ? new Date(h.data).toLocaleDateString("pt-BR") : "—"}</TableCell>
              </TableRow>
            ))}
            {historico.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum histórico encontrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── 6) MONITORAMENTO ───────────────────────────────────────

function MonitoramentoTab() {
  const [monTab, setMonTab] = useState<"eventos" | "estado" | "processo">("eventos");
  const [kpiData, setKpiData] = useState({ colisao: 0, rouboFurto: 0, totalReparos: 0, valorTotal: 0, mediaCusto: 0 });
  const [statusCounts, setStatusCounts] = useState<{ status: string; qtde: number; cor: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMonitoramento = async () => {
      setLoading(true);
      try {
        const { data: eventos, error } = await supabase
          .from("eventos")
          .select("tipo, status, valor_real, valor_estimado")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const all = eventos || [];

        // KPIs
        const colisao = all.filter(e => e.tipo === "Colisão").length;
        const rouboFurto = all.filter(e => e.tipo === "Roubo" || e.tipo === "Furto").length;
        const totalReparos = all.filter(e => e.status === "Em reparo").length;
        const valorTotal = all.reduce((s, e) => s + (e.valor_real || e.valor_estimado || 0), 0);
        const mediaCusto = all.length > 0 ? valorTotal / all.length : 0;

        setKpiData({ colisao, rouboFurto, totalReparos, valorTotal, mediaCusto });

        // Status counts
        const statusMap: Record<string, number> = {};
        all.forEach(e => {
          const s = e.status || "Sem status";
          statusMap[s] = (statusMap[s] || 0) + 1;
        });

        const statusColorMap: Record<string, string> = {
          "Em análise": "bg-warning/10 text-warning",
          "Em reparo": "bg-primary/8 text-primary",
          "Aguardando docs": "bg-warning/10 text-warning",
          "Indenização integral": "bg-accent/8 text-accent",
          "Negado": "bg-destructive/8 text-destructive",
          "Reembolso": "bg-success/10 text-success",
        };

        setStatusCounts(
          Object.entries(statusMap).map(([status, qtde]) => ({
            status,
            qtde,
            cor: statusColorMap[status] || "bg-gray-100 text-gray-800",
          }))
        );
      } catch (err: any) {
        toast.error("Erro ao carregar monitoramento: " + (err.message || ""));
      } finally {
        setLoading(false);
      }
    };

    fetchMonitoramento();
  }, []);

  const kpis = [
    { label: "Colisão", valor: kpiData.colisao, icon: Car },
    { label: "Roubo/Furto", valor: kpiData.rouboFurto, icon: AlertTriangle },
    { label: "Total Reparos", valor: kpiData.totalReparos, icon: Wrench },
    { label: "Valor Total", valor: `R$ ${kpiData.valorTotal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`, icon: DollarSign },
    { label: "Média Custo", valor: `R$ ${kpiData.mediaCusto.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-1 mb-5 overflow-x-auto flex-wrap">
        {(["eventos", "estado", "processo"] as const).map(t => (
          <button key={t} onClick={() => setMonTab(t)} className={`rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all capitalize ${monTab === t ? "bg-[#002050] text-white shadow-md" : "bg-[#003870] text-white hover:bg-[#002a57]"}`}>
            {t === "estado" ? "Estado do Tempo" : t === "processo" ? "Processo" : "Eventos"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Carregando...</span>
        </div>
      ) : (
        <>
          {monTab === "eventos" && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {kpis.map((k, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-4 text-center">
                    <k.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-xl font-bold text-primary">{k.valor}</p>
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {monTab === "estado" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {statusCounts.map((e, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{e.status}</p>
                    </div>
                    <Badge className={`text-sm font-bold ${e.cor}`}>{e.qtde}</Badge>
                  </CardContent>
                </Card>
              ))}
              {statusCounts.length === 0 && (
                <p className="col-span-4 text-center py-8 text-muted-foreground">Nenhum evento encontrado</p>
              )}
            </div>
          )}

          {monTab === "processo" && (
            <div className="space-y-6">
              {mockTimeline.map((evt, ei) => (
                <Card key={ei} className="border-border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-primary">Protocolo {evt.protocolo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative pl-6">
                      <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
                      <div className="space-y-3">
                        {evt.movimentacoes.map((m, mi) => (
                          <div key={mi} className="relative flex gap-3">
                            <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-primary border-2 border-white" />
                            <div>
                              <p className="text-sm font-medium">{m.acao}</p>
                              <p className="text-xs text-muted-foreground">{m.data} — {m.usuario}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── 7) RELATÓRIOS ──────────────────────────────────────────

function RelatoriosEventoTab() {
  const [relTab, setRelTab] = useState<"eventos" | "cotacao" | "sincronismo">("eventos");
  const [loadingExport, setLoadingExport] = useState<string | null>(null);
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventos = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("eventos")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        setEventos(data || []);
      } catch (err: any) {
        toast.error("Erro ao carregar eventos: " + (err.message || ""));
      } finally {
        setLoading(false);
      }
    };
    fetchEventos();
  }, []);

  const handleExport = (tipo: string) => {
    setLoadingExport(tipo);
    setTimeout(() => { toast.success(`Relatório de ${tipo} exportado para Excel`); setLoadingExport(null); }, 900);
  };

  const mockCotacao = [
    { evento: "EVT-2025-0341", oficina1: "Auto Center Paulista", valor1: 8500, oficina2: "Funilaria SP", valor2: 9200, oficina3: "CarFix", valor3: 7800, escolhida: "CarFix" },
    { evento: "EVT-2025-0345", oficina1: "Reparo Total", valor1: 4200, oficina2: "AutoTech", valor2: 3900, oficina3: "MasterCar", valor3: 4500, escolhida: "AutoTech" },
  ];

  const mockSincronismo = [
    { protocolo: "EVT-2025-0341", dataCadastro: "15/06/2025", dataSync: "15/06/2025 08:45", status: "Sincronizado" },
    { protocolo: "EVT-2025-0298", dataCadastro: "20/06/2025", dataSync: "20/06/2025 22:30", status: "Sincronizado" },
    { protocolo: "EVT-2025-0315", dataCadastro: "25/06/2025", dataSync: "26/06/2025 08:00", status: "Atrasado" },
    { protocolo: "EVT-2025-0345", dataCadastro: "10/07/2025", dataSync: "-", status: "Pendente" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-1 mb-5 overflow-x-auto flex-wrap">
        {([
          { id: "eventos" as const, label: "Relatório de Eventos" },
          { id: "cotacao" as const, label: "Cotação / Orçamento" },
          { id: "sincronismo" as const, label: "Sincronismo" },
        ]).map(t => (
          <button key={t.id} onClick={() => setRelTab(t.id)} className={`rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${relTab === t.id ? "bg-[#002050] text-white shadow-md" : "bg-[#003870] text-white hover:bg-[#002a57]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {relTab === "eventos" && (
        <div className="space-y-4">
          <div className="flex gap-3 items-end flex-wrap">
            <div><Label className="text-xs">De</Label><Input type="date" className="w-40" /></div>
            <div><Label className="text-xs">Até</Label><Input type="date" className="w-40" /></div>
            <div><Label className="text-xs">Tipo</Label>
              <Select defaultValue="Todos"><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Todos">Todos</SelectItem>{tiposEvento.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
            <Button variant="outline" className="gap-2 border-border" disabled={loadingExport === "eventos"} onClick={() => handleExport("eventos")}>
              {loadingExport === "eventos" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Exportar Excel
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Carregando...</span>
            </div>
          ) : (
            <div className="border rounded-lg border-border overflow-hidden">
              <Table>
                <TableHeader><TableRow className="bg-muted"><TableHead className="text-xs">Protocolo</TableHead><TableHead className="text-xs">Associado</TableHead><TableHead className="text-xs">Placa</TableHead><TableHead className="text-xs">Tipo</TableHead><TableHead className="text-xs">Data</TableHead><TableHead className="text-xs">Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {eventos.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-xs">{e.protocolo}</TableCell>
                      <TableCell className="text-sm">{e.associado_nome || "—"}</TableCell>
                      <TableCell className="font-mono text-sm">{e.placa || "—"}</TableCell>
                      <TableCell className="text-sm">{e.tipo || "—"}</TableCell>
                      <TableCell className="text-sm">{e.data_evento ? new Date(e.data_evento).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell><Badge className={`text-xs ${statusColor[e.status] || ""}`}>{e.status || "—"}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {eventos.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum evento encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {relTab === "cotacao" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" className="gap-2 border-border" disabled={loadingExport === "cotacao"} onClick={() => handleExport("cotação")}>
              {loadingExport === "cotacao" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Exportar Excel
            </Button>
          </div>
          <div className="border rounded-lg border-border overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-muted"><TableHead className="text-xs">Evento</TableHead><TableHead className="text-xs">Oficina 1</TableHead><TableHead className="text-xs text-right">Valor</TableHead><TableHead className="text-xs">Oficina 2</TableHead><TableHead className="text-xs text-right">Valor</TableHead><TableHead className="text-xs">Oficina 3</TableHead><TableHead className="text-xs text-right">Valor</TableHead><TableHead className="text-xs">Escolhida</TableHead></TableRow></TableHeader>
              <TableBody>
                {mockCotacao.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{c.evento}</TableCell>
                    <TableCell className="text-sm">{c.oficina1}</TableCell>
                    <TableCell className="text-sm text-right">R$ {c.valor1.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-sm">{c.oficina2}</TableCell>
                    <TableCell className="text-sm text-right">R$ {c.valor2.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-sm">{c.oficina3}</TableCell>
                    <TableCell className="text-sm text-right">R$ {c.valor3.toLocaleString("pt-BR")}</TableCell>
                    <TableCell><Badge className="bg-success/10 text-success text-xs">{c.escolhida}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {relTab === "sincronismo" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" className="gap-2 border-border" disabled={loadingExport === "sincronismo"} onClick={() => handleExport("sincronismo")}>
              {loadingExport === "sincronismo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Exportar Excel
            </Button>
          </div>
          <div className="border rounded-lg border-border overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-muted"><TableHead className="text-xs">Protocolo</TableHead><TableHead className="text-xs">Data Cadastro</TableHead><TableHead className="text-xs">Data Sincronização</TableHead><TableHead className="text-xs">Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {mockSincronismo.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{s.protocolo}</TableCell>
                    <TableCell className="text-sm">{s.dataCadastro}</TableCell>
                    <TableCell className="text-sm">{s.dataSync}</TableCell>
                    <TableCell><Badge className={`text-xs ${s.status === "Sincronizado" ? "bg-success/10 text-success" : s.status === "Atrasado" ? "bg-warning/10 text-warning" : "bg-warning/10 text-warning"}`}>{s.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
