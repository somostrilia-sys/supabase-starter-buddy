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
import {
  Truck, Plus, Search, Download, RefreshCw, Clock, BarChart3,
  CheckCircle2, XCircle, AlertTriangle, FileText, Settings, Loader2,
  Building2, Car, Users, Activity, Calendar, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

// ── Mock Data ──
const mockFornecedores = [
  { id: "F-001", nome: "Auto Guincho Express", cnpj: "12.345.678/0001-90", tipo: "Guincho", status: "ativo" as const, telefone: "(11) 3456-7890", email: "contato@guincho.com", cidade: "São Paulo", estado: "SP", veiculosCobertos: 312, associadosVinc: 280 },
  { id: "F-002", nome: "ProTrack Rastreadores", cnpj: "23.456.789/0001-01", tipo: "Rastreador", status: "ativo" as const, telefone: "(11) 4567-8901", email: "suporte@protrack.com", cidade: "Campinas", estado: "SP", veiculosCobertos: 520, associadosVinc: 490 },
  { id: "F-003", nome: "Vidraçaria Cristal Auto", cnpj: "34.567.890/0001-12", tipo: "Vidros", status: "ativo" as const, telefone: "(21) 5678-9012", email: "orcamento@cristal.com", cidade: "Rio de Janeiro", estado: "RJ", veiculosCobertos: 195, associadosVinc: 180 },
  { id: "F-004", nome: "Oficina Mecânica Total", cnpj: "45.678.901/0001-23", tipo: "Oficina", status: "inativo" as const, telefone: "(31) 6789-0123", email: "total@oficina.com", cidade: "Belo Horizonte", estado: "MG", veiculosCobertos: 0, associadosVinc: 0 },
  { id: "F-005", nome: "SeguraVida Assistência 24h", cnpj: "56.789.012/0001-34", tipo: "Assistência", status: "ativo" as const, telefone: "(41) 7890-1234", email: "central@seguravida.com", cidade: "Curitiba", estado: "PR", veiculosCobertos: 847, associadosVinc: 780 },
  { id: "F-006", nome: "AutoPeças Premium", cnpj: "67.890.123/0001-45", tipo: "Peças", status: "ativo" as const, telefone: "(51) 8901-2345", email: "vendas@autopecas.com", cidade: "Porto Alegre", estado: "RS", veiculosCobertos: 150, associadosVinc: 140 },
];

const tiposServico = ["Guincho", "Rastreador", "Vidros", "Oficina", "Assistência", "Peças", "Elétrica", "Funilaria"];
const logSync = [
  { id: 1, data: "2025-07-08 06:00", fornecedor: "ProTrack Rastreadores", tipo: "Automático", registros: 520, status: "sucesso" as const, duracao: "12s" },
  { id: 2, data: "2025-07-08 06:00", fornecedor: "Auto Guincho Express", tipo: "Automático", registros: 312, status: "sucesso" as const, duracao: "8s" },
  { id: 3, data: "2025-07-07 06:00", fornecedor: "SeguraVida Assistência 24h", tipo: "Automático", registros: 847, status: "erro" as const, duracao: "45s" },
  { id: 4, data: "2025-07-07 06:00", fornecedor: "Vidraçaria Cristal Auto", tipo: "Manual", registros: 195, status: "sucesso" as const, duracao: "5s" },
  { id: 5, data: "2025-07-06 06:00", fornecedor: "ProTrack Rastreadores", tipo: "Automático", registros: 518, status: "sucesso" as const, duracao: "11s" },
  { id: 6, data: "2025-07-05 06:00", fornecedor: "AutoPeças Premium", tipo: "Automático", registros: 0, status: "pendente" as const, duracao: "-" },
];

const statusColor: Record<string, string> = {
  ativo: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  inativo: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  sucesso: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  erro: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  pendente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

const emptyForm = { nome: "", cnpj: "", tipo: "Guincho", telefone: "", email: "", cidade: "", estado: "", observacoes: "" };

export default function FornecedorTab() {
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [showCadastro, setShowCadastro] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [sincronizando, setSincronizando] = useState(false);
  const [progresso, setProgresso] = useState(0);

  const filtered = mockFornecedores.filter(f => {
    if (filtroTipo !== "todos" && f.tipo !== filtroTipo) return false;
    if (filtroStatus !== "todos" && f.status !== filtroStatus) return false;
    if (busca && !f.nome.toLowerCase().includes(busca.toLowerCase()) && !f.cnpj.includes(busca)) return false;
    return true;
  });

  const totalVeiculos = mockFornecedores.filter(f => f.status === "ativo").reduce((s, f) => s + f.veiculosCobertos, 0);
  const totalAssociados = mockFornecedores.filter(f => f.status === "ativo").reduce((s, f) => s + f.associadosVinc, 0);
  const ativos = mockFornecedores.filter(f => f.status === "ativo").length;

  const handleSync = () => {
    setSincronizando(true); setProgresso(0);
    const iv = setInterval(() => {
      setProgresso(p => { if (p >= 100) { clearInterval(iv); setSincronizando(false); toast.success("Sincronismo concluído"); return 100; } return p + 10; });
    }, 200);
  };

  const handleSalvar = () => {
    if (!form.nome || !form.cnpj) { toast.error("Nome e CNPJ obrigatórios"); return; }
    toast.success("Fornecedor cadastrado com sucesso");
    setShowCadastro(false); setForm(emptyForm);
  };

  const exportCsv = () => {
    const header = "ID;Nome;CNPJ;Tipo;Status;Telefone;Cidade/UF\n";
    const rows = filtered.map(f => `${f.id};${f.nome};${f.cnpj};${f.tipo};${f.status};${f.telefone};${f.cidade}/${f.estado}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "fornecedores.csv"; a.click();
    toast.success("Relatório exportado");
  };

  return (
    <div className="p-6 lg:px-8 space-y-6">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md">
            <Truck className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Fornecedores</h2>
            <p className="text-sm text-muted-foreground">Cadastro, sincronismo e análises de fornecedores</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={sincronizando} className="gap-1.5">
            <RefreshCw className={`h-4 w-4 ${sincronizando ? "animate-spin" : ""}`} />Sincronizar
          </Button>
          <Button size="sm" onClick={() => setShowCadastro(true)} className="gap-1.5 bg-primary hover:bg-primary/90 text-white">
            <Plus className="h-4 w-4" />Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* ── PROGRESS BAR ── */}
      {sincronizando && (
        <Card className="border-border bg-muted/50">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-foreground" />
              <span className="text-sm font-medium text-foreground">Sincronizando fornecedores...</span>
            </div>
            <Progress value={progresso} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* ── TABS ── */}
      <Tabs defaultValue="listagem">
        <TabsList className="bg-muted/50 border border-border">
          <TabsTrigger value="listagem" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5">
            <FileText className="h-3.5 w-3.5" />Listagem
          </TabsTrigger>
          <TabsTrigger value="sincronismo" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />Sincronismo
          </TabsTrigger>
          <TabsTrigger value="log" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5">
            <Clock className="h-3.5 w-3.5" />Log
          </TabsTrigger>
          <TabsTrigger value="relatorio" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5">
            <Download className="h-3.5 w-3.5" />Relatório
          </TabsTrigger>
        </TabsList>

        {/* ── LISTAGEM ── */}
        <TabsContent value="listagem" className="space-y-4 mt-4">
          {/* Filtros */}
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="grid sm:grid-cols-4 gap-3 items-end">
                <div>
                  <Label className="text-xs font-medium text-foreground">Buscar</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9 border-border focus-visible:ring-ring" placeholder="Nome ou CNPJ..." value={busca} onChange={e => setBusca(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-foreground">Tipo de Serviço</Label>
                  <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                    <SelectTrigger className="mt-1 border-border"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="todos">Todos</SelectItem>{tiposServico.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-foreground">Status</Label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="mt-1 border-border"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5 border-border hover:bg-muted/50">
                  <Download className="h-4 w-4" />Exportar CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card className="border-border overflow-hidden">
            
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary border-b-0">
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">ID</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Nome</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">CNPJ</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Tipo</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Contato</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Cidade/UF</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((f, i) => (
                    <TableRow key={f.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'} hover:bg-muted/40 transition-colors border-b border-border/60`}>
                      <TableCell className="font-mono text-xs text-foreground font-semibold">{f.id}</TableCell>
                      <TableCell className="font-medium text-foreground">{f.nome}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{f.cnpj}</TableCell>
                      <TableCell><Badge variant="outline" className="border-primary/30 text-foreground bg-primary/8">{f.tipo}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{f.telefone}</TableCell>
                      <TableCell className="text-sm">{f.cidade}/{f.estado}</TableCell>
                      <TableCell><Badge className={statusColor[f.status]}>{f.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="px-4 py-3 bg-muted/30 border-t border-border/60 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{filtered.length} fornecedor(es) encontrado(s)</span>
                <span className="text-xs text-muted-foreground">Total geral: {mockFornecedores.length}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SINCRONISMO ── */}
        <TabsContent value="sincronismo" className="space-y-5 mt-4">
          {/* Stat Cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="border-border overflow-hidden">
              
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md">
                  <Building2 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{ativos}</p>
                  <p className="text-xs text-muted-foreground font-medium">Fornecedores ativos</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border overflow-hidden">
              
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md">
                  <Car className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{totalVeiculos.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground font-medium">Veículos cobertos</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border overflow-hidden">
              
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{totalAssociados.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground font-medium">Associados vinculados</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cobertura */}
          <Card className="border-border overflow-hidden">
            
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-foreground" />
                <CardTitle className="text-base text-primary">Cobertura por Fornecedor</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {mockFornecedores.filter(f => f.status === "ativo").map(f => {
                const pct = Math.round((f.veiculosCobertos / 847) * 100);
                return (
                  <div key={f.id} className="space-y-1.5 p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-primary">{f.nome}</span>
                      <span className="text-muted-foreground font-medium">{f.veiculosCobertos} veículos ({pct}%)</span>
                    </div>
                    <Progress value={pct} className="h-2.5" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Vínculo */}
          <Card className="border-border overflow-hidden">
            
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-foreground" />
                <CardTitle className="text-base text-primary">Vínculo Associado × Fornecedor</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary border-b-0">
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Fornecedor</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Tipo</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Associados</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Veículos</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Cobertura</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockFornecedores.filter(f => f.status === "ativo").map((f, i) => (
                    <TableRow key={f.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'} hover:bg-muted/40 transition-colors border-b border-border/60`}>
                      <TableCell className="font-medium text-foreground">{f.nome}</TableCell>
                      <TableCell><Badge variant="outline" className="border-primary/30 text-foreground bg-primary/8">{f.tipo}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{f.associadosVinc}</TableCell>
                      <TableCell className="text-right font-medium">{f.veiculosCobertos}</TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-primary text-white hover:bg-primary/90">
                          {Math.round((f.veiculosCobertos / 847) * 100)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── LOG ── */}
        <TabsContent value="log" className="space-y-4 mt-4">
          <Card className="border-border overflow-hidden">
            
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-foreground" />
                  <CardTitle className="text-base text-primary">Log de Sincronismo</CardTitle>
                </div>
                <Badge variant="outline" className="gap-1.5 border-primary/30 text-foreground bg-primary/8">
                  <Calendar className="h-3 w-3" />Cron: diário às 06:00
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary border-b-0">
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Data/Hora</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Fornecedor</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Tipo</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Registros</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Duração</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logSync.map((l, i) => (
                    <TableRow key={l.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'} hover:bg-muted/40 transition-colors border-b border-border/60`}>
                      <TableCell className="text-sm font-mono text-foreground">{l.data}</TableCell>
                      <TableCell className="font-medium text-foreground">{l.fornecedor}</TableCell>
                      <TableCell><Badge variant="outline" className="border-primary/30 text-foreground bg-primary/8">{l.tipo}</Badge></TableCell>
                      <TableCell className="text-right font-semibold">{l.registros}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.duracao}</TableCell>
                      <TableCell><Badge className={statusColor[l.status]}>{l.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="px-4 py-3 bg-muted/30 border-t border-border/60 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{logSync.length} execução(ões) registrada(s)</span>
                <span className="text-xs font-medium text-foreground">
                  {logSync.filter(l => l.status === "sucesso").length} sucesso · {logSync.filter(l => l.status === "erro").length} erro · {logSync.filter(l => l.status === "pendente").length} pendente
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── RELATÓRIO ── */}
        <TabsContent value="relatorio" className="space-y-4 mt-4">
          <Card className="border-border overflow-hidden">
            
            <CardHeader className="border-b border-border/60">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-foreground" />
                <div>
                  <CardTitle className="text-base text-primary">Relatório de Fornecedores</CardTitle>
                  <CardDescription className="mt-0.5">Aplique os filtros e exporte os dados</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid sm:grid-cols-3 gap-4 mb-5">
                <div>
                  <Label className="text-xs font-medium text-foreground">Tipo de Serviço</Label>
                  <Select defaultValue="todos">
                    <SelectTrigger className="mt-1 border-border"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="todos">Todos</SelectItem>{tiposServico.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-foreground">Status</Label>
                  <Select defaultValue="todos">
                    <SelectTrigger className="mt-1 border-border"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-foreground">Região</Label>
                  <Select defaultValue="todos">
                    <SelectTrigger className="mt-1 border-border"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="todos">Todas</SelectItem><SelectItem value="SP">SP</SelectItem><SelectItem value="RJ">RJ</SelectItem><SelectItem value="MG">MG</SelectItem><SelectItem value="PR">PR</SelectItem><SelectItem value="RS">RS</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-border/60">
                <Button onClick={exportCsv} className="gap-1.5 bg-primary hover:bg-primary/90 text-white">
                  <Download className="h-4 w-4" />Exportar Excel
                </Button>
                <span className="text-xs text-muted-foreground">Os filtros serão aplicados na exportação</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── DIALOG CADASTRO ── */}
      <Dialog open={showCadastro} onOpenChange={setShowCadastro}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Plus className="h-4 w-4 text-accent" />
              </div>
              <DialogTitle className="text-primary">Novo Fornecedor</DialogTitle>
            </div>
          </DialogHeader>
          <div className="h-px bg-gradient-to-r from-primary  to-transparent" />
          <div className="grid gap-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-foreground">Nome *</Label>
                <Input className="mt-1 border-border" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs font-medium text-foreground">CNPJ *</Label>
                <Input className="mt-1 border-border" placeholder="00.000.000/0001-00" value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-foreground">Tipo de Serviço</Label>
                <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                  <SelectTrigger className="mt-1 border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{tiposServico.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-foreground">Telefone</Label>
                <Input className="mt-1 border-border" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-foreground">E-mail</Label>
              <Input className="mt-1 border-border" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-foreground">Cidade</Label>
                <Input className="mt-1 border-border" value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs font-medium text-foreground">Estado</Label>
                <Input className="mt-1 border-border" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-foreground">Observações</Label>
              <Textarea className="mt-1 border-border" value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="border-t border-border/60 pt-4">
            <Button variant="outline" onClick={() => setShowCadastro(false)} className="border-border">Cancelar</Button>
            <Button onClick={handleSalvar} className="bg-primary hover:bg-primary/90 text-white">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
