import { useState } from "react";
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
import EventoDetalhe from "./EventoDetalhe";

// ── Types & Constants ──────────────────────────────────────

const tiposEvento = ["Colisão", "Roubo", "Furto", "Fenômeno Natural", "Incêndio", "Periférico"];
const statusConsulta = ["Em análise", "Em reparo", "Aguardando docs", "Indenização integral", "Negado", "Reembolso"];
const regionais = ["Central SP", "Campinas", "Ribeirão Preto", "Litoral SP", "Curitiba", "Belo Horizonte"];
const categoriasVeiculo = ["Passeio", "Utilitário", "Caminhão", "Moto", "Van"];

const statusColor: Record<string, string> = {
  "Em análise": "bg-yellow-100 text-yellow-800",
  "Em reparo": "bg-blue-100 text-blue-800",
  "Aguardando docs": "bg-orange-100 text-orange-800",
  "Indenização integral": "bg-purple-100 text-purple-800",
  "Negado": "bg-red-100 text-red-800",
  "Reembolso": "bg-green-100 text-green-800",
};

// ── Mock Data ──────────────────────────────────────────────

const mockConsulta = [
  { protocolo: "EVT-2025-0341", associado: "Carlos Eduardo Silva", placa: "BRA2E19", tipo: "Colisão", data: "2025-06-15", status: "Em reparo", responsavel: "João Mendes" },
  { protocolo: "EVT-2025-0298", associado: "Maria Fernanda Oliveira", placa: "RIO4H77", tipo: "Roubo", data: "2025-06-20", status: "Em análise", responsavel: "Ana Costa" },
  { protocolo: "EVT-2025-0315", associado: "João Pedro Santos", placa: "SPO1C33", tipo: "Furto", data: "2025-06-25", status: "Aguardando docs", responsavel: "Pedro Lima" },
  { protocolo: "EVT-2025-0322", associado: "Ana Carolina Ferreira", placa: "MGA5B22", tipo: "Colisão", data: "2025-07-01", status: "Indenização integral", responsavel: "João Mendes" },
  { protocolo: "EVT-2025-0330", associado: "Roberto Almeida Neto", placa: "BSB3K11", tipo: "Fenômeno Natural", data: "2025-07-03", status: "Negado", responsavel: "Ana Costa" },
  { protocolo: "EVT-2025-0335", associado: "Fernanda Lima Costa", placa: "CWB7D55", tipo: "Incêndio", data: "2025-07-05", status: "Reembolso", responsavel: "Pedro Lima" },
  { protocolo: "EVT-2025-0340", associado: "Lucas Martins Souza", placa: "POA8F44", tipo: "Periférico", data: "2025-07-08", status: "Em análise", responsavel: "João Mendes" },
  { protocolo: "EVT-2025-0345", associado: "Patricia Rocha Lima", placa: "REC2G88", tipo: "Colisão", data: "2025-07-10", status: "Em reparo", responsavel: "Ana Costa" },
];

const mockEventosRateio = [
  { id: 1, mes: "07/2025", descricao: "Rateio Administrativo", valorTotal: 0, categoria: "Passeio", regional: "Central SP" },
  { id: 2, mes: "06/2025", descricao: "Ajuste Mensal Frota", valorTotal: 1500, categoria: "Utilitário", regional: "Campinas" },
  { id: 3, mes: "05/2025", descricao: "Evento Zerado - Adm", valorTotal: 0, categoria: "Passeio", regional: "Litoral SP" },
];

const mockDistribuicao = [
  { regional: "Central SP", categoria: "Passeio", qtdeVeiculos: 320, valorBase: 85.50, fator: 1.0, valorCalc: 85.50 },
  { regional: "Central SP", categoria: "Utilitário", qtdeVeiculos: 85, valorBase: 85.50, fator: 1.3, valorCalc: 111.15 },
  { regional: "Campinas", categoria: "Passeio", qtdeVeiculos: 210, valorBase: 85.50, fator: 0.9, valorCalc: 76.95 },
  { regional: "Campinas", categoria: "Caminhão", qtdeVeiculos: 45, valorBase: 85.50, fator: 1.8, valorCalc: 153.90 },
  { regional: "Ribeirão Preto", categoria: "Passeio", qtdeVeiculos: 130, valorBase: 85.50, fator: 0.85, valorCalc: 72.68 },
  { regional: "Litoral SP", categoria: "Moto", qtdeVeiculos: 57, valorBase: 85.50, fator: 0.6, valorCalc: 51.30 },
];

const mockHistDist = [
  { mes: "07/2025", valorTotal: 95420.00, qtdeVeiculos: 847, regionais: 4, usuario: "Admin", data: "2025-07-15" },
  { mes: "06/2025", valorTotal: 78350.00, qtdeVeiculos: 832, regionais: 4, usuario: "Gerente", data: "2025-06-14" },
  { mes: "05/2025", valorTotal: 62100.00, qtdeVeiculos: 820, regionais: 3, usuario: "Admin", data: "2025-05-15" },
  { mes: "04/2025", valorTotal: 87200.00, qtdeVeiculos: 815, regionais: 4, usuario: "Gerente", data: "2025-04-14" },
  { mes: "03/2025", valorTotal: 54800.00, qtdeVeiculos: 808, regionais: 3, usuario: "Admin", data: "2025-03-15" },
];

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
        <h2 className="text-xl font-bold text-[hsl(212_35%_18%)]">Eventos</h2>
        <p className="text-sm text-muted-foreground">Cadastro, rateio, distribuição e monitoramento de eventos</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-[hsl(210_30%_88%)] overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              subTab === t.id
                ? "border-[hsl(212_55%_40%)] text-[hsl(212_35%_18%)]"
                : "border-transparent text-muted-foreground hover:text-[hsl(212_35%_30%)]"
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
  const [placaBusca, setPlacaBusca] = useState("");
  const [dadosCarregados, setDadosCarregados] = useState(false);

  const steps = [
    "Informações Gerais", "Dados da Ocorrência", "Dados do Condutor",
    "Reparo Veículo Associado", "Veículo Terceiro", "Reparo Terceiro",
    "Reparo Patrimonial", "Parâmetros Rateio", "Termos",
  ];

  const buscarPlaca = () => {
    if (!placaBusca) return;
    setLoading(true);
    setTimeout(() => { setDadosCarregados(true); setLoading(false); toast.success("Dados carregados da placa " + placaBusca); }, 800);
  };

  const salvarEvento = () => {
    toast.success("Evento cadastrado com sucesso — Protocolo EVT-2025-0350");
    setStep(0); setDadosCarregados(false); setPlacaBusca("");
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
                i === step ? "bg-[hsl(212_35%_18%)] text-white" :
                i < step ? "bg-[hsl(210_40%_90%)] text-[hsl(212_35%_30%)]" :
                "bg-[hsl(210_40%_96%)] text-muted-foreground"
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

      <Card className="border-[hsl(210_30%_88%)] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[hsl(212_35%_18%)]">{steps[step]}</CardTitle>
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
                <Button onClick={buscarPlaca} disabled={loading} className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Buscar
                </Button>
              </div>
              {dadosCarregados && (
                <div className="grid grid-cols-2 gap-3 p-4 bg-[hsl(210_40%_96%)] rounded-lg border border-[hsl(210_30%_88%)]">
                  <div><Label className="text-xs text-muted-foreground">Associado</Label><p className="text-sm font-medium">Carlos Eduardo Silva</p></div>
                  <div><Label className="text-xs text-muted-foreground">CPF</Label><p className="text-sm">123.456.789-00</p></div>
                  <div><Label className="text-xs text-muted-foreground">Veículo</Label><p className="text-sm">Chevrolet Onix Plus 2023</p></div>
                  <div><Label className="text-xs text-muted-foreground">Placa</Label><p className="text-sm font-mono">{placaBusca || "BRA2E19"}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Chassi</Label><p className="text-sm font-mono">9BGKS48U0MG123456</p></div>
                  <div><Label className="text-xs text-muted-foreground">Cooperativa</Label><p className="text-sm">Central SP</p></div>
                  <div><Label className="text-xs text-muted-foreground">Cota</Label><p className="text-sm">R$ 50-70 mil</p></div>
                  <div><Label className="text-xs text-muted-foreground">Status</Label><Badge className="bg-green-100 text-green-800">Ativo</Badge></div>
                </div>
              )}
            </>
          )}

          {/* Step 1 - Dados da Ocorrência */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Data do Evento *</Label><Input type="date" defaultValue="2025-07-10" /></div>
              <div><Label className="text-xs">Hora</Label><Input type="time" defaultValue="14:30" /></div>
              <div><Label className="text-xs">Data do Reporte</Label><Input type="date" defaultValue="2025-07-10" /></div>
              <div>
                <Label className="text-xs">Tipo de Evento *</Label>
                <Select defaultValue="Colisão"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{tiposEvento.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="col-span-2"><Label className="text-xs">Descrição da Ocorrência</Label><Textarea defaultValue="Colisão traseira no semáforo da Av. Paulista, altura do nº 1.000. Condutor relata que o veículo de trás não freou a tempo." className="min-h-[80px]" /></div>
              <div className="col-span-2"><Label className="text-xs">Responsável pelo Atendimento</Label><Input defaultValue="João Mendes" /></div>
            </div>
          )}

          {/* Step 2 - Dados do Condutor */}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Nome do Condutor</Label><Input defaultValue="Carlos Eduardo Silva" /></div>
              <div><Label className="text-xs">CPF</Label><Input defaultValue="123.456.789-00" /></div>
              <div><Label className="text-xs">CNH</Label><Input defaultValue="04512378900" /></div>
              <div><Label className="text-xs">Data de Nascimento</Label><Input type="date" defaultValue="1985-03-15" /></div>
              <div><Label className="text-xs">Telefone</Label><Input defaultValue="(11) 99876-5432" /></div>
              <div className="col-span-2"><Label className="text-xs">Observações</Label><Textarea defaultValue="Condutor é o próprio associado. CNH categoria B, válida." /></div>
            </div>
          )}

          {/* Step 3 - Reparo Veículo Associado */}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Oficina</Label><Input defaultValue="Auto Center Paulista" /></div>
              <div>
                <Label className="text-xs">Tipo de Reparo</Label>
                <Select defaultValue="funilaria"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                  <SelectItem value="funilaria">Funilaria e Pintura</SelectItem>
                  <SelectItem value="mecanica">Mecânica</SelectItem>
                  <SelectItem value="eletrica">Elétrica</SelectItem>
                  <SelectItem value="vidros">Vidros</SelectItem>
                </SelectContent></Select>
              </div>
              <div className="col-span-2"><Label className="text-xs">Descrição do Serviço</Label><Textarea defaultValue="Troca do para-choque traseiro, lanterna esquerda e pintura. Alinhamento estrutural." /></div>
              <div><Label className="text-xs">Valor Estimado</Label><Input defaultValue="R$ 8.500,00" /></div>
              <div><Label className="text-xs">Valor Aprovado</Label><Input defaultValue="R$ 7.200,00" /></div>
              <div><Label className="text-xs">Previsão de Conclusão</Label><Input type="date" defaultValue="2025-08-05" /></div>
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
              <Card className="border-[hsl(210_30%_88%)]">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-[hsl(212_35%_18%)]">Terceiro #1 — Dados Pessoais</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Nome</Label><Input defaultValue="Marcos Pereira da Silva" /></div>
                    <div><Label className="text-xs">CPF</Label><Input defaultValue="567.890.123-00" /></div>
                    <div><Label className="text-xs">CNH</Label><Input defaultValue="09876543210" /></div>
                    <div><Label className="text-xs">Telefone</Label><Input defaultValue="(11) 98765-4321" /></div>
                    <div><Label className="text-xs">E-mail</Label><Input defaultValue="marcos.pereira@email.com" /></div>
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
              <Card className="border-[hsl(210_30%_88%)]">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-[hsl(212_35%_18%)]">Terceiro #1 — Dados do Veículo</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Placa</Label><Input defaultValue="XYZ9A88" /></div>
                    <div><Label className="text-xs">Chassi</Label><Input defaultValue="9BWZZZ377VT054321" /></div>
                    <div><Label className="text-xs">Marca</Label><Input defaultValue="Volkswagen" /></div>
                    <div><Label className="text-xs">Modelo</Label><Input defaultValue="Gol 1.0" /></div>
                    <div><Label className="text-xs">Ano</Label><Input defaultValue="2020" /></div>
                    <div><Label className="text-xs">Cor</Label><Input defaultValue="Prata" /></div>
                  </div>
                </CardContent>
              </Card>
              <Button variant="outline" className="gap-2 border-[hsl(210_30%_85%)]" onClick={() => toast.info("Formulário de terceiro adicional aberto")}>
                <Plus className="h-4 w-4" />Adicionar outro terceiro
              </Button>
            </div>
          )}

          {/* Step 5 - Reparo Terceiro */}
          {step === 5 && (
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Oficina</Label><Input defaultValue="Funilaria Brasil" /></div>
              <div className="col-span-2"><Label className="text-xs">Descrição do Serviço</Label><Textarea defaultValue="Reparo no para-choque dianteiro e troca do farol esquerdo do veículo terceiro." /></div>
              <div><Label className="text-xs">Valor do Orçamento</Label><Input defaultValue="R$ 3.200,00" /></div>
              <div><Label className="text-xs">Valor Aprovado</Label><Input defaultValue="R$ 2.800,00" /></div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select defaultValue="aprovado"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
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
              <div className="col-span-2"><Label className="text-xs">Descrição do Dano Patrimonial</Label><Textarea defaultValue="Poste de iluminação danificado na colisão. Muro do estabelecimento comercial atingido." /></div>
              <div><Label className="text-xs">Valor Estimado</Label><Input defaultValue="R$ 4.500,00" /></div>
              <div><Label className="text-xs">Valor Aprovado</Label><Input defaultValue="R$ 4.000,00" /></div>
              <div>
                <Label className="text-xs">Situação</Label>
                <Select defaultValue="em-analise"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em-analise">Em análise</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent></Select>
              </div>
              <div className="col-span-2"><Label className="text-xs">Observações</Label><Textarea defaultValue="Aguardando laudo da prefeitura para o poste. Proprietário do muro notificado." /></div>
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
              <div><Label className="text-xs">Valor do Evento para Rateio</Label><Input defaultValue="R$ 14.000,00" /></div>
            </div>
          )}

          {/* Step 8 - Termos */}
          {step === 8 && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Upload de Documentos</Label>
                <div className="mt-1 border-2 border-dashed border-[hsl(210_30%_85%)] rounded-lg p-6 text-center hover:border-[hsl(212_55%_40%)] transition-colors cursor-pointer" onClick={() => toast.info("Selecione os documentos para upload")}>
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Clique ou arraste arquivos aqui</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG — máx. 10MB</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Documentos Anexados</Label>
                {["Boletim_Ocorrencia.pdf", "Fotos_Veiculo.zip", "CNH_Condutor.jpg"].map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border rounded border-[hsl(210_30%_88%)] bg-[hsl(210_40%_96%)]">
                    <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-[hsl(212_55%_40%)]" /><span className="text-sm">{doc}</span></div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-[hsl(210_40%_96%)] rounded-lg border border-[hsl(210_30%_88%)]">
                <p className="text-xs font-semibold text-[hsl(212_35%_18%)] mb-2">Registro de Aceite de Termos</p>
                <div className="space-y-1.5">
                  {[
                    { termo: "Termo de Responsabilidade", aceito: true, data: "10/07/2025 14:35" },
                    { termo: "Termo de Ciência de Rateio", aceito: true, data: "10/07/2025 14:36" },
                    { termo: "Autorização de Vistoria", aceito: false, data: "" },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {t.aceito ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
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
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)} className="gap-2 border-[hsl(210_30%_85%)]">
          <ChevronLeft className="h-4 w-4" />Anterior
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} className="gap-2 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white">
            Próximo<ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={salvarEvento} className="gap-2 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white">
            <Save className="h-4 w-4" />Salvar Evento
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
  const [filtroResp, setFiltroResp] = useState("Todos");
  const [selectedEvento, setSelectedEvento] = useState<typeof mockConsulta[0] | null>(null);

  const responsaveis = ["Todos", ...Array.from(new Set(mockConsulta.map(e => e.responsavel)))];

  const filtered = mockConsulta.filter(e => {
    if (filtroStatus !== "Todos" && e.status !== filtroStatus) return false;
    if (filtroResp !== "Todos" && e.responsavel !== filtroResp) return false;
    if (busca && !e.associado.toLowerCase().includes(busca.toLowerCase()) && !e.placa.toLowerCase().includes(busca.toLowerCase()) && !e.protocolo.toLowerCase().includes(busca.toLowerCase())) return false;
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
        <div>
          <Label className="text-xs">Responsável</Label>
          <Select value={filtroResp} onValueChange={setFiltroResp}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{responsaveis.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>

      <div className="border rounded-lg border-[hsl(210_30%_88%)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(210_40%_96%)]">
              <TableHead className="text-xs">Protocolo</TableHead>
              <TableHead className="text-xs">Associado</TableHead>
              <TableHead className="text-xs">Placa</TableHead>
              <TableHead className="text-xs">Tipo</TableHead>
              <TableHead className="text-xs">Data</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Responsável</TableHead>
              <TableHead className="text-xs w-16">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(e => (
              <TableRow key={e.protocolo} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedEvento(e)}>
                <TableCell className="font-mono text-xs">{e.protocolo}</TableCell>
                <TableCell className="text-sm font-medium">{e.associado}</TableCell>
                <TableCell className="font-mono text-sm">{e.placa}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs border-[hsl(210_35%_70%)] bg-[hsl(210_40%_95%)]">{e.tipo}</Badge></TableCell>
                <TableCell className="text-sm">{new Date(e.data).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell><Badge className={`text-xs ${statusColor[e.status] || "bg-gray-100 text-gray-800"}`}>{e.status}</Badge></TableCell>
                <TableCell className="text-sm">{e.responsavel}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(ev) => { ev.stopPropagation(); setSelectedEvento(e); }}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum evento encontrado</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
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

  return (
    <div className="space-y-5">
      <Card className="border-[hsl(210_30%_88%)] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[hsl(212_35%_18%)]">Criar Evento Fictício para Rateio</CardTitle>
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
          <Button className="mt-4 gap-2 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white" onClick={() => toast.success("Evento fictício criado para " + mes)}>
            <Plus className="h-4 w-4" />Criar Evento
          </Button>
        </CardContent>
      </Card>

      <Card className="border-[hsl(210_30%_88%)] shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base text-[hsl(212_35%_18%)]">Eventos Fictícios Cadastrados</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-lg border-[hsl(210_30%_88%)] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[hsl(210_40%_96%)]">
                  <TableHead className="text-xs">Mês</TableHead>
                  <TableHead className="text-xs">Descrição</TableHead>
                  <TableHead className="text-xs text-right">Valor Total</TableHead>
                  <TableHead className="text-xs">Categoria</TableHead>
                  <TableHead className="text-xs">Regional</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockEventosRateio.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm font-mono">{e.mes}</TableCell>
                    <TableCell className="text-sm">{e.descricao}</TableCell>
                    <TableCell className="text-sm text-right font-medium">R$ {e.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-sm">{e.categoria}</TableCell>
                    <TableCell className="text-sm">{e.regional}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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

  const totalDistribuido = mockDistribuicao.reduce((s, d) => s + (d.qtdeVeiculos * d.valorCalc), 0);

  return (
    <div className="space-y-5">
      <div className="flex gap-3 items-end flex-wrap">
        <div><Label className="text-xs">Mês Referência</Label><Input value={mesRef} onChange={e => setMesRef(e.target.value)} className="w-32" /></div>
        <div><Label className="text-xs">Data Limite</Label><Input type="date" value={dataLimite} onChange={e => setDataLimite(e.target.value)} className="w-44" /></div>
        <div><Label className="text-xs">Valor Base (1ª cota)</Label><Input value={valorBase} onChange={e => setValorBase(e.target.value)} className="w-32" /></div>
      </div>

      <div className="border rounded-lg border-[hsl(210_30%_88%)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(210_40%_96%)]">
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
            {mockDistribuicao.map((d, i) => (
              <TableRow key={i}>
                <TableCell className="text-sm font-medium">{d.regional}</TableCell>
                <TableCell className="text-sm">{d.categoria}</TableCell>
                <TableCell className="text-sm text-right">{d.qtdeVeiculos}</TableCell>
                <TableCell className="text-sm text-right">R$ {d.valorBase.toFixed(2)}</TableCell>
                <TableCell className="text-sm text-right font-mono">{d.fator.toFixed(2)}x</TableCell>
                <TableCell className="text-sm text-right font-medium">R$ {d.valorCalc.toFixed(2)}</TableCell>
                <TableCell className="text-sm text-right font-medium">R$ {(d.qtdeVeiculos * d.valorCalc).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[hsl(212_35%_18%)]">Total Distribuído: R$ {totalDistribuido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        <Button className="gap-2 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white" onClick={() => toast.success("Rateio gravado com sucesso para " + mesRef)}>
          <Save className="h-4 w-4" />Gravar Rateio
        </Button>
      </div>
    </div>
  );
}

// ── 5) HISTÓRICO DE DISTRIBUIÇÃO ───────────────────────────

function HistoricoDistribuicaoTab() {
  return (
    <div className="space-y-5">
      <div className="border rounded-lg border-[hsl(210_30%_88%)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(210_40%_96%)]">
              <TableHead className="text-xs">Mês Referência</TableHead>
              <TableHead className="text-xs text-right">Valor Total Distribuído</TableHead>
              <TableHead className="text-xs text-right">Qtde Veículos</TableHead>
              <TableHead className="text-xs text-right">Regionais</TableHead>
              <TableHead className="text-xs">Usuário Responsável</TableHead>
              <TableHead className="text-xs">Data Lançamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockHistDist.map((h, i) => (
              <TableRow key={i}>
                <TableCell className="text-sm font-mono font-medium">{h.mes}</TableCell>
                <TableCell className="text-sm text-right font-bold">R$ {h.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-sm text-right">{h.qtdeVeiculos}</TableCell>
                <TableCell className="text-sm text-right">{h.regionais}</TableCell>
                <TableCell className="text-sm">{h.usuario}</TableCell>
                <TableCell className="text-sm">{new Date(h.data).toLocaleDateString("pt-BR")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── 6) MONITORAMENTO ───────────────────────────────────────

function MonitoramentoTab() {
  const [monTab, setMonTab] = useState<"eventos" | "estado" | "processo">("eventos");

  const kpis = [
    { label: "Colisão", valor: 12, icon: Car },
    { label: "Roubo/Furto", valor: 5, icon: AlertTriangle },
    { label: "Total Reparos", valor: 14, icon: Wrench },
    { label: "Valor Total", valor: "R$ 187.500", icon: DollarSign },
    { label: "Média Custo", valor: "R$ 11.030", icon: TrendingUp },
  ];

  const estadoDoTempo = [
    { status: "Aguardando cota", qtde: 3, cor: "bg-yellow-100 text-yellow-800" },
    { status: "Aprovados", qtde: 8, cor: "bg-green-100 text-green-800" },
    { status: "Em reparação", qtde: 5, cor: "bg-blue-100 text-blue-800" },
    { status: "Indenização integral", qtde: 2, cor: "bg-purple-100 text-purple-800" },
    { status: "Negados", qtde: 1, cor: "bg-red-100 text-red-800" },
    { status: "Reembolso", qtde: 3, cor: "bg-emerald-100 text-emerald-800" },
    { status: "Aguardando documentos", qtde: 4, cor: "bg-orange-100 text-orange-800" },
    { status: "Encerrados", qtde: 15, cor: "bg-gray-100 text-gray-800" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-[hsl(210_30%_88%)]">
        {(["eventos", "estado", "processo"] as const).map(t => (
          <button key={t} onClick={() => setMonTab(t)} className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors capitalize ${monTab === t ? "border-[hsl(212_55%_40%)] text-[hsl(212_35%_18%)]" : "border-transparent text-muted-foreground"}`}>
            {t === "estado" ? "Estado do Tempo" : t === "processo" ? "Processo" : "Eventos"}
          </button>
        ))}
      </div>

      {monTab === "eventos" && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {kpis.map((k, i) => (
            <Card key={i} className="border-[hsl(210_30%_88%)]">
              <CardContent className="p-4 text-center">
                <k.icon className="h-5 w-5 mx-auto mb-1 text-[hsl(212_55%_40%)]" />
                <p className="text-xl font-bold text-[hsl(212_35%_18%)]">{k.valor}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {monTab === "estado" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {estadoDoTempo.map((e, i) => (
            <Card key={i} className="border-[hsl(210_30%_88%)]">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{e.status}</p>
                </div>
                <Badge className={`text-sm font-bold ${e.cor}`}>{e.qtde}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {monTab === "processo" && (
        <div className="space-y-6">
          {mockTimeline.map((evt, ei) => (
            <Card key={ei} className="border-[hsl(210_30%_88%)] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[hsl(212_35%_18%)]">Protocolo {evt.protocolo}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-6">
                  <div className="absolute left-2 top-0 bottom-0 w-px bg-[hsl(210_30%_85%)]" />
                  <div className="space-y-3">
                    {evt.movimentacoes.map((m, mi) => (
                      <div key={mi} className="relative flex gap-3">
                        <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-[hsl(212_55%_40%)] border-2 border-white" />
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
    </div>
  );
}

// ── 7) RELATÓRIOS ──────────────────────────────────────────

function RelatoriosEventoTab() {
  const [relTab, setRelTab] = useState<"eventos" | "cotacao" | "sincronismo">("eventos");
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = (tipo: string) => {
    setLoading(tipo);
    setTimeout(() => { toast.success(`Relatório de ${tipo} exportado para Excel`); setLoading(null); }, 900);
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
      <div className="flex gap-1 border-b border-[hsl(210_30%_88%)]">
        {([
          { id: "eventos" as const, label: "Relatório de Eventos" },
          { id: "cotacao" as const, label: "Cotação / Orçamento" },
          { id: "sincronismo" as const, label: "Sincronismo" },
        ]).map(t => (
          <button key={t.id} onClick={() => setRelTab(t.id)} className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${relTab === t.id ? "border-[hsl(212_55%_40%)] text-[hsl(212_35%_18%)]" : "border-transparent text-muted-foreground"}`}>
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
            <Button variant="outline" className="gap-2 border-[hsl(210_30%_85%)]" disabled={loading === "eventos"} onClick={() => handleExport("eventos")}>
              {loading === "eventos" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Exportar Excel
            </Button>
          </div>
          <div className="border rounded-lg border-[hsl(210_30%_88%)] overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-[hsl(210_40%_96%)]"><TableHead className="text-xs">Protocolo</TableHead><TableHead className="text-xs">Associado</TableHead><TableHead className="text-xs">Placa</TableHead><TableHead className="text-xs">Tipo</TableHead><TableHead className="text-xs">Data</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Responsável</TableHead></TableRow></TableHeader>
              <TableBody>
                {mockConsulta.map(e => (
                  <TableRow key={e.protocolo}>
                    <TableCell className="font-mono text-xs">{e.protocolo}</TableCell>
                    <TableCell className="text-sm">{e.associado}</TableCell>
                    <TableCell className="font-mono text-sm">{e.placa}</TableCell>
                    <TableCell className="text-sm">{e.tipo}</TableCell>
                    <TableCell className="text-sm">{new Date(e.data).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell><Badge className={`text-xs ${statusColor[e.status] || ""}`}>{e.status}</Badge></TableCell>
                    <TableCell className="text-sm">{e.responsavel}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {relTab === "cotacao" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" className="gap-2 border-[hsl(210_30%_85%)]" disabled={loading === "cotacao"} onClick={() => handleExport("cotação")}>
              {loading === "cotacao" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Exportar Excel
            </Button>
          </div>
          <div className="border rounded-lg border-[hsl(210_30%_88%)] overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-[hsl(210_40%_96%)]"><TableHead className="text-xs">Evento</TableHead><TableHead className="text-xs">Oficina 1</TableHead><TableHead className="text-xs text-right">Valor</TableHead><TableHead className="text-xs">Oficina 2</TableHead><TableHead className="text-xs text-right">Valor</TableHead><TableHead className="text-xs">Oficina 3</TableHead><TableHead className="text-xs text-right">Valor</TableHead><TableHead className="text-xs">Escolhida</TableHead></TableRow></TableHeader>
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
                    <TableCell><Badge className="bg-green-100 text-green-800 text-xs">{c.escolhida}</Badge></TableCell>
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
            <Button variant="outline" className="gap-2 border-[hsl(210_30%_85%)]" disabled={loading === "sincronismo"} onClick={() => handleExport("sincronismo")}>
              {loading === "sincronismo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Exportar Excel
            </Button>
          </div>
          <div className="border rounded-lg border-[hsl(210_30%_88%)] overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-[hsl(210_40%_96%)]"><TableHead className="text-xs">Protocolo</TableHead><TableHead className="text-xs">Data Cadastro</TableHead><TableHead className="text-xs">Data Sincronização</TableHead><TableHead className="text-xs">Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {mockSincronismo.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{s.protocolo}</TableCell>
                    <TableCell className="text-sm">{s.dataCadastro}</TableCell>
                    <TableCell className="text-sm">{s.dataSync}</TableCell>
                    <TableCell><Badge className={`text-xs ${s.status === "Sincronizado" ? "bg-green-100 text-green-800" : s.status === "Atrasado" ? "bg-yellow-100 text-yellow-800" : "bg-orange-100 text-orange-800"}`}>{s.status}</Badge></TableCell>
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
