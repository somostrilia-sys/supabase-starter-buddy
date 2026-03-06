import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, Search, Download, AlertTriangle, BarChart3, Clock,
  Eye, FileText, DollarSign, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

// ── Mock ──
const tiposEvento = ["Colisão", "Furto", "Roubo", "Incêndio", "Alagamento", "Perda total", "Vidros", "Outros"];
const statusEvento = ["aberto", "em_analise", "aprovado", "negado", "pago", "encerrado"] as const;
type StatusEvento = typeof statusEvento[number];

const statusColor: Record<StatusEvento, string> = {
  aberto: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  em_analise: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  aprovado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  negado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  pago: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  encerrado: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const mockEventos = [
  { id: "EVT-001", tipo: "Colisão", data: "2025-06-15", associado: "Carlos Eduardo Silva", placa: "BRA2E19", descricao: "Colisão traseira no semáforo da Av. Paulista", valorEstimado: 8500, valorAprovado: 7200, status: "pago" as StatusEvento, rateio: true },
  { id: "EVT-002", tipo: "Roubo", data: "2025-06-20", associado: "Maria Fernanda Oliveira", placa: "RIO4F56", descricao: "Veículo roubado no estacionamento do shopping", valorEstimado: 45000, valorAprovado: null, status: "em_analise" as StatusEvento, rateio: true },
  { id: "EVT-003", tipo: "Vidros", data: "2025-06-25", associado: "José Roberto Santos", placa: "MGA7B32", descricao: "Para-brisa trincado por pedra na rodovia", valorEstimado: 1200, valorAprovado: 1200, status: "aprovado" as StatusEvento, rateio: false },
  { id: "EVT-004", tipo: "Alagamento", data: "2025-07-01", associado: "Fernanda Rodrigues", placa: "CWB1D45", descricao: "Motor alagado durante enchente na zona sul", valorEstimado: 12000, valorAprovado: null, status: "aberto" as StatusEvento, rateio: true },
  { id: "EVT-005", tipo: "Furto", data: "2025-07-03", associado: "Ricardo Almeida", placa: "CPR8H67", descricao: "Furto de rodas e pneus durante a madrugada", valorEstimado: 6800, valorAprovado: null, status: "aberto" as StatusEvento, rateio: true },
  { id: "EVT-006", tipo: "Incêndio", data: "2025-07-05", associado: "Ana Paula Costa", placa: "RJO3K21", descricao: "Curto-circuito causou incêndio no motor", valorEstimado: 35000, valorAprovado: 32000, status: "aprovado" as StatusEvento, rateio: true },
  { id: "EVT-007", tipo: "Outros", data: "2025-07-01", associado: "Rateio Administrativo", placa: "-", descricao: "Evento fictício para rateio administrativo mensal", valorEstimado: 0, valorAprovado: 0, status: "encerrado" as StatusEvento, rateio: true },
];

const mockRateioHist = [
  { periodo: "07/2025", totalEventos: 4, valorTotal: 101500, associados: 847, valorPorAssociado: 119.83, status: "calculado" },
  { periodo: "06/2025", totalEventos: 3, valorTotal: 54500, associados: 832, valorPorAssociado: 65.50, status: "distribuído" },
  { periodo: "05/2025", totalEventos: 2, valorTotal: 28000, associados: 820, valorPorAssociado: 34.15, status: "distribuído" },
  { periodo: "04/2025", totalEventos: 5, valorTotal: 87200, associados: 815, valorPorAssociado: 107.00, status: "distribuído" },
];

const emptyForm = { tipo: "Colisão", data: "", associado: "", placa: "", descricao: "", valorEstimado: "", paraRateio: true };

export default function EventoTab() {
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [showCadastro, setShowCadastro] = useState(false);
  const [showDetalhe, setShowDetalhe] = useState<typeof mockEventos[0] | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = mockEventos.filter(e => {
    if (filtroTipo !== "todos" && e.tipo !== filtroTipo) return false;
    if (filtroStatus !== "todos" && e.status !== filtroStatus) return false;
    if (busca && !e.associado.toLowerCase().includes(busca.toLowerCase()) && !e.placa.includes(busca.toUpperCase()) && !e.id.includes(busca.toUpperCase())) return false;
    return true;
  });

  const totalAberto = mockEventos.filter(e => e.status === "aberto" || e.status === "em_analise").length;
  const totalValor = mockEventos.reduce((s, e) => s + e.valorEstimado, 0);
  const mediaEvento = totalValor / mockEventos.filter(e => e.valorEstimado > 0).length;

  const handleSalvar = () => {
    if (!form.associado || !form.data) { toast.error("Associado e data obrigatórios"); return; }
    toast.success(form.paraRateio && form.valorEstimado === "0" ? "Evento para rateio cadastrado (R$ 0,00)" : "Evento cadastrado com sucesso");
    setShowCadastro(false); setForm(emptyForm);
  };

  const exportCsv = () => {
    const header = "ID;Tipo;Data;Associado;Placa;Valor Estimado;Status;Rateio\n";
    const rows = filtered.map(e => `${e.id};${e.tipo};${e.data};${e.associado};${e.placa};${e.valorEstimado};${e.status};${e.rateio ? "Sim" : "Não"}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "eventos.csv"; a.click();
    toast.success("Relatório exportado");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold">Eventos</h2><p className="text-sm text-muted-foreground">Cadastro, distribuição de rateio e monitoramento de eventos</p></div>
        <Button size="sm" onClick={() => setShowCadastro(true)}><Plus className="h-4 w-4" />Novo Evento</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{mockEventos.length}</p><p className="text-xs text-muted-foreground">Total de eventos</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{totalAberto}</p><p className="text-xs text-muted-foreground">Em aberto / análise</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">R$ {totalValor.toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Valor total estimado</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">R$ {mediaEvento.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p><p className="text-xs text-muted-foreground">Média por evento</p></CardContent></Card>
      </div>

      <Tabs defaultValue="eventos">
        <TabsList>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
          <TabsTrigger value="rateio">Distribuição de Rateio</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Rateio</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório</TabsTrigger>
        </TabsList>

        {/* ── EVENTOS ── */}
        <TabsContent value="eventos" className="space-y-4">
          <div className="grid sm:grid-cols-4 gap-3">
            <div><Label className="text-xs">Buscar</Label><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Código, associado ou placa..." value={busca} onChange={e => setBusca(e.target.value)} /></div></div>
            <div><Label className="text-xs">Tipo</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{tiposEvento.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label className="text-xs">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{statusEvento.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="flex items-end"><Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4" />Exportar</Button></div>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Código</TableHead><TableHead>Tipo</TableHead><TableHead>Data</TableHead><TableHead>Associado</TableHead><TableHead>Placa</TableHead><TableHead className="text-right">Valor Est.</TableHead><TableHead>Status</TableHead><TableHead>Rateio</TableHead><TableHead></TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-xs">{e.id}</TableCell>
                      <TableCell><Badge variant="outline">{e.tipo}</Badge></TableCell>
                      <TableCell>{new Date(e.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="font-medium">{e.associado}</TableCell>
                      <TableCell className="font-mono">{e.placa}</TableCell>
                      <TableCell className="text-right">R$ {e.valorEstimado.toLocaleString("pt-BR")}</TableCell>
                      <TableCell><Badge className={statusColor[e.status]}>{e.status.replace("_", " ")}</Badge></TableCell>
                      <TableCell>{e.rateio ? <Badge className="bg-primary/10 text-primary">Sim</Badge> : <Badge variant="secondary">Não</Badge>}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowDetalhe(e)}><Eye className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── RATEIO ── */}
        <TabsContent value="rateio" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" />Distribuição de Rateio — 07/2025</CardTitle>
              <CardDescription>Cálculo automático baseado nos eventos incluídos no rateio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{mockEventos.filter(e => e.rateio && e.valorEstimado > 0).length}</p>
                  <p className="text-xs text-muted-foreground">Eventos no rateio</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">R$ {mockEventos.filter(e => e.rateio).reduce((s, e) => s + e.valorEstimado, 0).toLocaleString("pt-BR")}</p>
                  <p className="text-xs text-muted-foreground">Valor total do rateio</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">R$ {(mockEventos.filter(e => e.rateio).reduce((s, e) => s + e.valorEstimado, 0) / 847).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-xs text-muted-foreground">Valor por associado (847)</p>
                </div>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader><TableRow><TableHead>Evento</TableHead><TableHead>Tipo</TableHead><TableHead>Associado</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {mockEventos.filter(e => e.rateio).map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="font-mono text-xs">{e.id}</TableCell>
                        <TableCell><Badge variant="outline">{e.tipo}</Badge></TableCell>
                        <TableCell>{e.associado}</TableCell>
                        <TableCell className="text-right font-semibold">R$ {e.valorEstimado.toLocaleString("pt-BR")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => toast.success("Rateio calculado e pronto para inclusão nos boletos")}><TrendingUp className="h-4 w-4" />Calcular Rateio</Button>
                <Button variant="outline" onClick={() => toast.info("Rateio incluído nos boletos do período 07/2025")}>Incluir nos Boletos</Button>
              </div>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div className="text-sm">
                <p className="font-semibold">Conformidade Regulatória</p>
                <p className="text-muted-foreground">Todos os eventos devem ser incluídos no rateio conforme normas regulatórias. Eventos fictícios (R$ 0,00) podem ser criados para distribuição administrativa.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── HISTÓRICO RATEIO ── */}
        <TabsContent value="historico" className="space-y-4">
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {mockRateioHist.map((r, i) => (
                <div key={i} className="relative flex items-start gap-4 pl-12">
                  <div className="absolute left-4 top-1 w-5 h-5 rounded-full border-2 bg-background border-primary flex items-center justify-center">
                    <DollarSign className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <Card className="flex-1">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">Rateio {r.periodo}</p>
                          <p className="text-sm text-muted-foreground">{r.totalEventos} eventos · {r.associados} associados</p>
                        </div>
                        <Badge className={r.status === "distribuído" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"}>{r.status}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                        <div><span className="text-muted-foreground">Total:</span> <span className="font-bold">R$ {r.valorTotal.toLocaleString("pt-BR")}</span></div>
                        <div><span className="text-muted-foreground">Por associado:</span> <span className="font-bold">R$ {r.valorPorAssociado.toFixed(2)}</span></div>
                        <div><span className="text-muted-foreground">Eventos:</span> <span className="font-bold">{r.totalEventos}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── RELATÓRIO ── */}
        <TabsContent value="relatorio" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Relatório de Eventos</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-4 gap-3 mb-4">
                <div><Label className="text-xs">Tipo</Label>
                  <Select defaultValue="todos"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{tiposEvento.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                </div>
                <div><Label className="text-xs">Status</Label>
                  <Select defaultValue="todos"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{statusEvento.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent></Select>
                </div>
                <div><Label className="text-xs">Data início</Label><Input type="date" /></div>
                <div><Label className="text-xs">Data fim</Label><Input type="date" /></div>
              </div>
              <Button onClick={exportCsv}><Download className="h-4 w-4" />Exportar Excel</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Cadastro */}
      <Dialog open={showCadastro} onOpenChange={setShowCadastro}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Evento</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Tipo *</Label>
                <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{tiposEvento.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Data *</Label><Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Associado *</Label><Input placeholder="Nome do associado" value={form.associado} onChange={e => setForm({ ...form, associado: e.target.value })} /></div>
              <div><Label className="text-xs">Placa</Label><Input placeholder="BRA2E19" value={form.placa} onChange={e => setForm({ ...form, placa: e.target.value.toUpperCase() })} /></div>
            </div>
            <div><Label className="text-xs">Descrição</Label><Textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
            <div><Label className="text-xs">Valor Estimado (R$)</Label><Input type="number" placeholder="0.00" value={form.valorEstimado} onChange={e => setForm({ ...form, valorEstimado: e.target.value })} /></div>
            <div className="flex items-center gap-2">
              <Checkbox id="rateio" checked={form.paraRateio} onCheckedChange={c => setForm({ ...form, paraRateio: !!c })} />
              <Label htmlFor="rateio" className="text-sm">Incluir no rateio</Label>
            </div>
            {form.paraRateio && form.valorEstimado === "0" && (
              <p className="text-xs text-yellow-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Evento fictício (R$ 0,00) será criado para distribuição no rateio</p>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCadastro(false)}>Cancelar</Button><Button onClick={handleSalvar}>Cadastrar Evento</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhe — Completo com abas */}
      <Dialog open={!!showDetalhe} onOpenChange={() => setShowDetalhe(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Evento {showDetalhe?.id}</DialogTitle>
            {showDetalhe && (
              <p className="text-sm text-muted-foreground mt-1">
                {showDetalhe.associado} — {showDetalhe.placa} — Protocolo <span className="font-bold">{showDetalhe.id}</span>
              </p>
            )}
          </DialogHeader>
          {showDetalhe && (
            <Tabs defaultValue="info" className="mt-2">
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="info">Informações Gerais</TabsTrigger>
                <TabsTrigger value="ocorrencia">Dados Ocorrência</TabsTrigger>
                <TabsTrigger value="analise">Análise</TabsTrigger>
                <TabsTrigger value="reparo">Reparo do Veículo</TabsTrigger>
                <TabsTrigger value="terceiro">Reparo Veículo Terceiro</TabsTrigger>
                <TabsTrigger value="patrimonial">Reparo Patrimonial</TabsTrigger>
                <TabsTrigger value="rateio-param">Parâmetros Rateio</TabsTrigger>
                <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              </TabsList>

              {/* ── INFORMAÇÕES GERAIS ── */}
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="bg-muted/50 border-l-4 border-primary p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-3">Dados do Evento</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div><Label className="text-xs">Código</Label><Input value={showDetalhe.id} readOnly /></div>
                    <div><Label className="text-xs">Tipo</Label><Input value={showDetalhe.tipo} readOnly /></div>
                    <div><Label className="text-xs">Data Evento</Label><Input value={new Date(showDetalhe.data).toLocaleDateString("pt-BR")} readOnly /></div>
                    <div><Label className="text-xs">Status</Label>
                      <Select defaultValue={showDetalhe.status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statusEvento.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div><Label className="text-xs">Rateio</Label><Input value={showDetalhe.rateio ? "Sim" : "Não"} readOnly /></div>
                    <div><Label className="text-xs">Data Cadastro</Label><Input value={new Date(showDetalhe.data).toLocaleDateString("pt-BR")} readOnly /></div>
                  </div>
                </div>
                <div className="bg-muted/50 border-l-4 border-primary p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-3">Associado / Veículo</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div><Label className="text-xs">Associado</Label><Input value={showDetalhe.associado} readOnly /></div>
                    <div><Label className="text-xs">Placa</Label><Input value={showDetalhe.placa} readOnly /></div>
                    <div><Label className="text-xs">CPF</Label><Input value="000.000.000-00" readOnly /></div>
                    <div><Label className="text-xs">Regional</Label><Input value="São Paulo" readOnly /></div>
                    <div><Label className="text-xs">Cooperativa</Label><Input value="Cooperativa Central" readOnly /></div>
                    <div><Label className="text-xs">Produto</Label><Input value="Proteção Total" readOnly /></div>
                  </div>
                </div>
                <div className="bg-muted/50 border-l-4 border-primary p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-3">Descrição Evento (Controle Interno)</h4>
                  <Textarea rows={4} defaultValue={showDetalhe.descricao} />
                </div>
              </TabsContent>

              {/* ── DADOS OCORRÊNCIA ── */}
              <TabsContent value="ocorrencia" className="space-y-4 mt-4">
                <div className="bg-muted/50 border-l-4 border-primary p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-3">Local e Circunstâncias</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div><Label className="text-xs">Endereço</Label><Input placeholder="Rua / Avenida" /></div>
                    <div><Label className="text-xs">Cidade</Label><Input placeholder="Cidade" /></div>
                    <div><Label className="text-xs">UF</Label><Input placeholder="SP" /></div>
                    <div><Label className="text-xs">CEP</Label><Input placeholder="00000-000" /></div>
                    <div><Label className="text-xs">Data/Hora Ocorrência</Label><Input type="datetime-local" /></div>
                    <div><Label className="text-xs">Boletim de Ocorrência</Label><Input placeholder="Nº B.O." /></div>
                  </div>
                </div>
                <div className="bg-muted/50 border-l-4 border-primary p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-3">Relato da Ocorrência</h4>
                  <Textarea rows={5} placeholder="Descreva os detalhes da ocorrência..." />
                </div>
                <div className="bg-muted/50 border-l-4 border-primary p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-3">Testemunhas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs">Nome Testemunha 1</Label><Input /></div>
                    <div><Label className="text-xs">Telefone</Label><Input /></div>
                    <div><Label className="text-xs">Nome Testemunha 2</Label><Input /></div>
                    <div><Label className="text-xs">Telefone</Label><Input /></div>
                  </div>
                </div>
              </TabsContent>

              {/* ── ANÁLISE ── */}
              <TabsContent value="analise" className="space-y-4 mt-4">
                <div className="bg-muted/50 border-l-4 border-primary p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-3">Parecer Técnico</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs">Analista Responsável</Label><Input placeholder="Nome do analista" /></div>
                    <div><Label className="text-xs">Data Análise</Label><Input type="date" /></div>
                  </div>
                  <div className="mt-3"><Label className="text-xs">Parecer</Label><Textarea rows={4} placeholder="Parecer técnico da análise..." /></div>
                </div>
                <div className="bg-muted/50 border-l-4 border-primary p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-3">Documentos Anexados</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2"><Checkbox id="doc-bo" /><Label htmlFor="doc-bo">Boletim de Ocorrência</Label></div>
                    <div className="flex items-center gap-2"><Checkbox id="doc-cnh" /><Label htmlFor="doc-cnh">CNH do Condutor</Label></div>
                    <div className="flex items-center gap-2"><Checkbox id="doc-fotos" /><Label htmlFor="doc-fotos">Fotos do Veículo</Label></div>
                    <div className="flex items-center gap-2"><Checkbox id="doc-laudo" /><Label htmlFor="doc-laudo">Laudo Pericial</Label></div>
                    <div className="flex items-center gap-2"><Checkbox id="doc-nf" /><Label htmlFor="doc-nf">Nota Fiscal Reparo</Label></div>
                    <div className="flex items-center gap-2"><Checkbox id="doc-orc" /><Label htmlFor="doc-orc">Orçamento</Label></div>
                  </div>
                </div>
              </TabsContent>

              {/* ── REPARO DO VEÍCULO ── */}
              <TabsContent value="reparo" className="space-y-4 mt-4">
                <div className="bg-muted/50 border-l-4 border-primary p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-3">Situação Reparo</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs">Situação do Item</Label>
                      <Select defaultValue="pendente"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pendente">Documentação Pendente</SelectItem><SelectItem value="em_reparo">Em Reparo</SelectItem><SelectItem value="concluido">Concluído</SelectItem><SelectItem value="aguardando_peca">Aguardando Peça</SelectItem></SelectContent></Select>
                    </div>
                    <div><Label className="text-xs">Oficina / Fornecedor</Label><Input placeholder="Nome da oficina" /></div>
                  </div>
                </div>
                <div className="bg-muted/50 border-l-4 border-primary p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-3">Custo</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div><Label className="text-xs">Valor Estimado (R$)</Label><Input type="number" defaultValue={showDetalhe.valorEstimado} /></div>
                    <div><Label className="text-xs">Valor Aprovado (R$)</Label><Input type="number" defaultValue={showDetalhe.valorAprovado ?? ""} /></div>
                    <div><Label className="text-xs">Valor Final (R$)</Label><Input type="number" placeholder="0.00" /></div>
                    <div><Label className="text-xs">Mão de Obra (R$)</Label><Input type="number" placeholder="0.00" /></div>
                    <div><Label className="text-xs">Peças (R$)</Label><Input type="number" placeholder="0.00" /></div>
                    <div><Label className="text-xs">Outros (R$)</Label><Input type="number" placeholder="0.00" /></div>
                  </div>
                </div>
                <div className="bg-muted/50 border-l-4 border-primary p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-3">Datas</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div><Label className="text-xs">Entrada na Oficina</Label><Input type="date" /></div>
                    <div><Label className="text-xs">Previsão Entrega</Label><Input type="date" /></div>
                    <div><Label className="text-xs">Entrega Real</Label><Input type="date" /></div>
                  </div>
                </div>
                <div className="bg-muted/50 border-l-4 border-primary p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-3">Condutor no Momento</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs">Nome</Label><Input /></div>
                    <div><Label className="text-xs">CPF</Label><Input /></div>
                    <div><Label className="text-xs">CNH</Label><Input /></div>
                    <div><Label className="text-xs">Categoria</Label><Input /></div>
                  </div>
                </div>
              </TabsContent>

              {/* ── REPARO VEÍCULO TERCEIRO ── */}
              <TabsContent value="terceiro" className="space-y-4 mt-4">
                <div className="bg-muted/50 border-l-4 border-primary p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-3">Dados do Terceiro</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div><Label className="text-xs">Nome</Label><Input /></div>
                    <div><Label className="text-xs">CPF/CNPJ</Label><Input /></div>
                    <div><Label className="text-xs">Telefone</Label><Input /></div>
                    <div><Label className="text-xs">Placa Terceiro</Label><Input /></div>
                    <div><Label className="text-xs">Marca/Modelo</Label><Input /></div>
                    <div><Label className="text-xs">Seguradora</Label><Input /></div>
                  </div>
                </div>
                <div className="bg-muted/50 border-l-4 border-primary p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-3">Custo Terceiro</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div><Label className="text-xs">Valor Estimado (R$)</Label><Input type="number" placeholder="0.00" /></div>
                    <div><Label className="text-xs">Valor Aprovado (R$)</Label><Input type="number" placeholder="0.00" /></div>
                    <div><Label className="text-xs">Valor Pago (R$)</Label><Input type="number" placeholder="0.00" /></div>
                  </div>
                </div>
              </TabsContent>

              {/* ── REPARO PATRIMONIAL ── */}
              <TabsContent value="patrimonial" className="space-y-4 mt-4">
                <div className="bg-muted/50 border-l-4 border-primary p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-3">Danos Patrimoniais</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs">Tipo do Patrimônio</Label>
                      <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="muro">Muro/Parede</SelectItem><SelectItem value="poste">Poste</SelectItem><SelectItem value="guardrail">Guardrail</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent></Select>
                    </div>
                    <div><Label className="text-xs">Proprietário</Label><Input /></div>
                    <div><Label className="text-xs">Valor Estimado (R$)</Label><Input type="number" placeholder="0.00" /></div>
                    <div><Label className="text-xs">Valor Aprovado (R$)</Label><Input type="number" placeholder="0.00" /></div>
                  </div>
                  <div className="mt-3"><Label className="text-xs">Descrição do Dano</Label><Textarea rows={3} /></div>
                </div>
              </TabsContent>

              {/* ── PARÂMETROS RATEIO ── */}
              <TabsContent value="rateio-param" className="space-y-4 mt-4">
                <div className="bg-muted/50 border-l-4 border-primary p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-3">Configuração de Rateio</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2"><Checkbox id="inc-rateio" defaultChecked={showDetalhe.rateio} /><Label htmlFor="inc-rateio">Incluir no rateio mensal</Label></div>
                    <div><Label className="text-xs">Período de Referência</Label><Input defaultValue="07/2025" /></div>
                    <div><Label className="text-xs">Percentual de Participação (%)</Label><Input type="number" defaultValue="100" /></div>
                    <div><Label className="text-xs">Nº de Parcelas</Label><Input type="number" defaultValue="1" /></div>
                  </div>
                </div>
              </TabsContent>

              {/* ── FINANCEIRO ── */}
              <TabsContent value="financeiro" className="space-y-4 mt-4">
                <div className="bg-muted/50 border-l-4 border-primary p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-3">Resumo Financeiro</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-background border"><p className="text-xs text-muted-foreground">Estimado</p><p className="text-lg font-bold">R$ {showDetalhe.valorEstimado.toLocaleString("pt-BR")}</p></div>
                    <div className="text-center p-3 bg-background border"><p className="text-xs text-muted-foreground">Aprovado</p><p className="text-lg font-bold text-green-600">R$ {(showDetalhe.valorAprovado ?? 0).toLocaleString("pt-BR")}</p></div>
                    <div className="text-center p-3 bg-background border"><p className="text-xs text-muted-foreground">Pago</p><p className="text-lg font-bold text-primary">R$ 0</p></div>
                    <div className="text-center p-3 bg-background border"><p className="text-xs text-muted-foreground">Saldo</p><p className="text-lg font-bold text-destructive">R$ {showDetalhe.valorEstimado.toLocaleString("pt-BR")}</p></div>
                  </div>
                </div>
                <div className="bg-muted/50 border-l-4 border-primary p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-3">Pagamentos</h4>
                  <Table>
                    <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Favorecido</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nenhum pagamento registrado</TableCell></TableRow>
                    </TableBody>
                  </Table>
                  <div className="mt-3"><Button size="sm" variant="outline"><Plus className="h-4 w-4" />Registrar Pagamento</Button></div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDetalhe(null)}>Fechar</Button>
            <Button onClick={() => { toast.success("Evento salvo"); setShowDetalhe(null); }}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
