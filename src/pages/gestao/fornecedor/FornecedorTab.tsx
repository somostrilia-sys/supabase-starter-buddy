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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold">Fornecedores</h2><p className="text-sm text-muted-foreground">Cadastro, sincronismo e análises de fornecedores</p></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={sincronizando}><RefreshCw className={`h-4 w-4 ${sincronizando ? "animate-spin" : ""}`} />Sincronizar</Button>
          <Button size="sm" onClick={() => setShowCadastro(true)}><Plus className="h-4 w-4" />Novo Fornecedor</Button>
        </div>
      </div>

      {sincronizando && (
        <Card><CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Sincronizando fornecedores...</span></div>
          <Progress value={progresso} className="h-2" />
        </CardContent></Card>
      )}

      <Tabs defaultValue="listagem">
        <TabsList>
          <TabsTrigger value="listagem">Listagem</TabsTrigger>
          <TabsTrigger value="sincronismo">Análise de Sincronismo</TabsTrigger>
          <TabsTrigger value="log">Log de Execuções</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório</TabsTrigger>
        </TabsList>

        {/* ── LISTAGEM ── */}
        <TabsContent value="listagem" className="space-y-4">
          <div className="grid sm:grid-cols-4 gap-3">
            <div><Label className="text-xs">Buscar</Label><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Nome ou CNPJ..." value={busca} onChange={e => setBusca(e.target.value)} /></div></div>
            <div><Label className="text-xs">Tipo</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{tiposServico.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label className="text-xs">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent></Select>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4" />Exportar</Button>
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>ID</TableHead><TableHead>Nome</TableHead><TableHead>CNPJ</TableHead><TableHead>Tipo</TableHead><TableHead>Contato</TableHead><TableHead>Cidade/UF</TableHead><TableHead>Status</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-xs">{f.id}</TableCell>
                      <TableCell className="font-medium">{f.nome}</TableCell>
                      <TableCell className="font-mono text-xs">{f.cnpj}</TableCell>
                      <TableCell><Badge variant="outline">{f.tipo}</Badge></TableCell>
                      <TableCell className="text-xs">{f.telefone}</TableCell>
                      <TableCell>{f.cidade}/{f.estado}</TableCell>
                      <TableCell><Badge className={statusColor[f.status]}>{f.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SINCRONISMO ── */}
        <TabsContent value="sincronismo" className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{mockFornecedores.filter(f => f.status === "ativo").length}</p><p className="text-xs text-muted-foreground">Fornecedores ativos</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{totalVeiculos}</p><p className="text-xs text-muted-foreground">Veículos cobertos</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{totalAssociados}</p><p className="text-xs text-muted-foreground">Associados vinculados</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Cobertura por Fornecedor</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {mockFornecedores.filter(f => f.status === "ativo").map(f => {
                const pct = Math.round((f.veiculosCobertos / 847) * 100);
                return (
                  <div key={f.id} className="space-y-1">
                    <div className="flex justify-between text-sm"><span className="font-medium">{f.nome}</span><span className="text-muted-foreground">{f.veiculosCobertos} veículos ({pct}%)</span></div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Vínculo Associado × Fornecedor</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Fornecedor</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Associados</TableHead><TableHead className="text-right">Veículos</TableHead><TableHead className="text-right">Cobertura</TableHead></TableRow></TableHeader>
                <TableBody>
                  {mockFornecedores.filter(f => f.status === "ativo").map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.nome}</TableCell>
                      <TableCell><Badge variant="outline">{f.tipo}</Badge></TableCell>
                      <TableCell className="text-right">{f.associadosVinc}</TableCell>
                      <TableCell className="text-right">{f.veiculosCobertos}</TableCell>
                      <TableCell className="text-right font-semibold">{Math.round((f.veiculosCobertos / 847) * 100)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── LOG ── */}
        <TabsContent value="log" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Log de Sincronismo</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1"><Settings className="h-3 w-3" />Cron: diário às 06:00</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Data/Hora</TableHead><TableHead>Fornecedor</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Registros</TableHead><TableHead>Duração</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {logSync.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm">{l.data}</TableCell>
                      <TableCell className="font-medium">{l.fornecedor}</TableCell>
                      <TableCell><Badge variant="outline">{l.tipo}</Badge></TableCell>
                      <TableCell className="text-right">{l.registros}</TableCell>
                      <TableCell>{l.duracao}</TableCell>
                      <TableCell><Badge className={statusColor[l.status]}>{l.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── RELATÓRIO ── */}
        <TabsContent value="relatorio" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Relatório de Fornecedores</CardTitle><CardDescription>Aplique os filtros acima e exporte</CardDescription></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                <div><Label className="text-xs">Tipo de Serviço</Label>
                  <Select defaultValue="todos"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{tiposServico.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                </div>
                <div><Label className="text-xs">Status</Label>
                  <Select defaultValue="todos"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent></Select>
                </div>
                <div><Label className="text-xs">Região</Label>
                  <Select defaultValue="todos"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todas</SelectItem><SelectItem value="SP">SP</SelectItem><SelectItem value="RJ">RJ</SelectItem><SelectItem value="MG">MG</SelectItem><SelectItem value="PR">PR</SelectItem><SelectItem value="RS">RS</SelectItem></SelectContent></Select>
                </div>
              </div>
              <Button onClick={exportCsv}><Download className="h-4 w-4" />Exportar Excel</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Cadastro */}
      <Dialog open={showCadastro} onOpenChange={setShowCadastro}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Fornecedor</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Nome *</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
              <div><Label className="text-xs">CNPJ *</Label><Input placeholder="00.000.000/0001-00" value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Tipo de Serviço</Label>
                <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{tiposServico.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Telefone</Label><Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">E-mail</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Cidade</Label><Input value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} /></div>
              <div><Label className="text-xs">Estado</Label><Input value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Observações</Label><Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCadastro(false)}>Cancelar</Button><Button onClick={handleSalvar}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
