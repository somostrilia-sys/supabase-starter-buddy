import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Database, Clock, AlertTriangle, CheckCircle, Plus, Send, Ban, Download, Search, Settings } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface GestorSPCSerasaProps {
  onBack: () => void;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  enviado: { label: "Enviado", variant: "default" },
  negativado: { label: "Negativado", variant: "destructive" },
  baixa: { label: "Baixa", variant: "outline" },
};

const mockRegistros = [
  { id: "R001", nome: "Carlos Alberto Souza", cpf: "123.456.789-00", cooperativa: "Coop Central", valor: 3250.0, status: "negativado", dataRegistro: "2025-11-10", dataAtualizacao: "2026-01-20" },
  { id: "R002", nome: "Maria das Graças Lima", cpf: "234.567.890-11", cooperativa: "Coop Norte", valor: 1890.5, status: "enviado", dataRegistro: "2026-01-05", dataAtualizacao: "2026-02-01" },
  { id: "R003", nome: "José Pereira dos Santos", cpf: "345.678.901-22", cooperativa: "Coop Sul", valor: 5400.0, status: "pendente", dataRegistro: "2026-02-20", dataAtualizacao: "2026-02-20" },
  { id: "R004", nome: "Ana Beatriz Oliveira", cpf: "456.789.012-33", cooperativa: "Coop Leste", valor: 2100.75, status: "negativado", dataRegistro: "2025-10-15", dataAtualizacao: "2026-01-18" },
  { id: "R005", nome: "Roberto Carlos Mendes", cpf: "567.890.123-44", cooperativa: "Coop Oeste", valor: 780.0, status: "baixa", dataRegistro: "2025-09-01", dataAtualizacao: "2026-02-10" },
  { id: "R006", nome: "Fernanda Silva Costa", cpf: "678.901.234-55", cooperativa: "Coop Central", valor: 4320.0, status: "negativado", dataRegistro: "2025-12-05", dataAtualizacao: "2026-02-22" },
  { id: "R007", nome: "Paulo Henrique Rocha", cpf: "789.012.345-66", cooperativa: "Coop Norte", valor: 1560.0, status: "pendente", dataRegistro: "2026-02-25", dataAtualizacao: "2026-02-25" },
  { id: "R008", nome: "Luciana Ferreira Alves", cpf: "890.123.456-77", cooperativa: "Coop Sul", valor: 6890.25, status: "enviado", dataRegistro: "2026-01-20", dataAtualizacao: "2026-01-25" },
  { id: "R009", nome: "Marcos Antônio Dias", cpf: "901.234.567-88", cooperativa: "Coop Leste", valor: 920.0, status: "baixa", dataRegistro: "2025-08-10", dataAtualizacao: "2026-02-05" },
  { id: "R010", nome: "Patrícia Gomes Ribeiro", cpf: "012.345.678-99", cooperativa: "Coop Oeste", valor: 3780.5, status: "pendente", dataRegistro: "2026-03-01", dataAtualizacao: "2026-03-01" },
  { id: "R011", nome: "Ricardo Barbosa Neto", cpf: "111.222.333-44", cooperativa: "Coop Central", valor: 2450.0, status: "negativado", dataRegistro: "2025-11-20", dataAtualizacao: "2026-01-15" },
  { id: "R012", nome: "Simone Araujo Pinto", cpf: "555.666.777-88", cooperativa: "Coop Norte", valor: 1120.0, status: "enviado", dataRegistro: "2026-02-10", dataAtualizacao: "2026-02-15" },
];

const mockHistorico = [
  { id: 1, dataHora: "2026-03-04 14:32", usuario: "Admin", acao: "envio", associado: "Carlos Alberto Souza", detalhes: "Registro enviado ao SPC" },
  { id: 2, dataHora: "2026-03-04 11:15", usuario: "Gerente", acao: "baixa", associado: "Roberto Carlos Mendes", detalhes: "Baixa por pagamento integral" },
  { id: 3, dataHora: "2026-03-03 16:45", usuario: "Admin", acao: "envio", associado: "Maria das Graças Lima", detalhes: "Registro enviado ao Serasa" },
  { id: 4, dataHora: "2026-03-03 09:20", usuario: "Operador", acao: "cancelamento", associado: "Marcos Antônio Dias", detalhes: "Cancelado por acordo" },
  { id: 5, dataHora: "2026-03-02 15:00", usuario: "Admin", acao: "envio", associado: "Fernanda Silva Costa", detalhes: "Registro enviado ao SPC" },
  { id: 6, dataHora: "2026-03-02 10:30", usuario: "Gerente", acao: "confirmacao", associado: "Ana Beatriz Oliveira", detalhes: "Negativação confirmada pelo SPC" },
  { id: 7, dataHora: "2026-03-01 14:10", usuario: "Admin", acao: "envio", associado: "Luciana Ferreira Alves", detalhes: "Registro enviado ao Serasa" },
  { id: 8, dataHora: "2026-02-28 17:45", usuario: "Operador", acao: "cadastro", associado: "Patrícia Gomes Ribeiro", detalhes: "Novo registro cadastrado" },
  { id: 9, dataHora: "2026-02-28 11:20", usuario: "Gerente", acao: "baixa", associado: "Marcos Antônio Dias", detalhes: "Baixa por negociação" },
  { id: 10, dataHora: "2026-02-27 09:00", usuario: "Admin", acao: "envio", associado: "Ricardo Barbosa Neto", detalhes: "Registro enviado ao SPC" },
  { id: 11, dataHora: "2026-02-26 16:30", usuario: "Operador", acao: "cadastro", associado: "Paulo Henrique Rocha", detalhes: "Novo registro cadastrado" },
  { id: 12, dataHora: "2026-02-25 14:00", usuario: "Admin", acao: "confirmacao", associado: "Carlos Alberto Souza", detalhes: "Negativação confirmada pelo Serasa" },
  { id: 13, dataHora: "2026-02-24 10:15", usuario: "Gerente", acao: "envio", associado: "Simone Araujo Pinto", detalhes: "Registro enviado ao SPC" },
  { id: 14, dataHora: "2026-02-23 08:45", usuario: "Operador", acao: "cadastro", associado: "José Pereira dos Santos", detalhes: "Novo registro cadastrado" },
  { id: 15, dataHora: "2026-02-22 15:30", usuario: "Admin", acao: "confirmacao", associado: "Fernanda Silva Costa", detalhes: "Negativação confirmada pelo SPC" },
];

const barData = [
  { mes: "Out/25", total: 8 }, { mes: "Nov/25", total: 12 }, { mes: "Dez/25", total: 6 },
  { mes: "Jan/26", total: 15 }, { mes: "Fev/26", total: 10 }, { mes: "Mar/26", total: 4 },
];

const COLORS = ["hsl(var(--primary))", "hsl(45, 93%, 47%)", "hsl(0, 84%, 60%)", "hsl(142, 71%, 45%)"];

const acaoBadge = (a: string) => {
  const map: Record<string, { label: string; color: string }> = {
    envio: { label: "Envio", color: "bg-primary/60/10 text-blue-600 border-blue-200" },
    baixa: { label: "Baixa", color: "bg-success/80/10 text-green-600 border-green-200" },
    cancelamento: { label: "Cancelamento", color: "bg-destructive/80/10 text-red-600 border-red-200" },
    confirmacao: { label: "Confirmação", color: "bg-primary/60/10 text-purple-600 border-purple-200" },
    cadastro: { label: "Cadastro", color: "bg-gray-500/10 text-gray-600 border-gray-200" },
  };
  const cfg = map[a] || map.cadastro;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>{cfg.label}</span>;
};

const topCoops = [
  { nome: "Coop Central", total: 3 }, { nome: "Coop Norte", total: 2 },
  { nome: "Coop Sul", total: 2 }, { nome: "Coop Leste", total: 2 }, { nome: "Coop Oeste", total: 1 },
];

export default function GestorSPCSerasa({ onBack }: GestorSPCSerasaProps) {
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroCoop, setFiltroCoop] = useState("todos");
  const [busca, setBusca] = useState("");
  const [filtroAcao, setFiltroAcao] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const stats = {
    total: mockRegistros.length,
    pendentes: mockRegistros.filter((r) => r.status === "pendente").length,
    negativados: mockRegistros.filter((r) => r.status === "negativado").length,
    baixas: mockRegistros.filter((r) => r.status === "baixa").length,
  };

  const pieData = [
    { name: "Pendente", value: stats.pendentes },
    { name: "Enviado", value: mockRegistros.filter((r) => r.status === "enviado").length },
    { name: "Negativado", value: stats.negativados },
    { name: "Baixa", value: stats.baixas },
  ];

  const filtradosRegistros = mockRegistros.filter((r) => {
    if (filtroStatus !== "todos" && r.status !== filtroStatus) return false;
    if (filtroCoop !== "todos" && r.cooperativa !== filtroCoop) return false;
    if (busca && !r.nome.toLowerCase().includes(busca.toLowerCase()) && !r.cpf.includes(busca)) return false;
    return true;
  });

  const filtradosHistorico = mockHistorico.filter((h) => {
    if (filtroAcao !== "todos" && h.acao !== filtroAcao) return false;
    return true;
  });

  const toggleSelecionado = (id: string) => {
    setSelecionados((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const statCards = [
    { label: "Total Registros", value: stats.total, icon: Database, color: "text-primary", bg: "bg-primary/10" },
    { label: "Envios Pendentes", value: stats.pendentes, icon: Clock, color: "text-yellow-500", bg: "bg-warning/80/10" },
    { label: "Negativados Ativos", value: stats.negativados, icon: AlertTriangle, color: "text-red-500", bg: "bg-destructive/80/10" },
    { label: "Baixas Realizadas", value: stats.baixas, icon: CheckCircle, color: "text-green-500", bg: "bg-success/80/10" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Gestor SPC / Serasa</h1>
          <p className="text-sm text-muted-foreground">Painel administrativo de gestão de negativações</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="visao">
        <TabsList>
          <TabsTrigger value="visao">Visão Geral</TabsTrigger>
          <TabsTrigger value="gerenciar">Gerenciar Registros</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="visao" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">Negativações por Mês</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="mes" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">Distribuição por Status</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                      {pieData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Top 5 Cooperativas com Mais Negativados</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topCoops.map((c, i) => (
                  <div key={c.nome} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="flex-1 font-medium text-sm">{c.nome}</span>
                    <Badge variant="destructive">{c.total}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gerenciar" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Busca</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Nome ou CPF..." className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} />
              </div>
            </div>
            <div className="w-40">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="negativado">Negativado</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-44">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Cooperativa</label>
              <Select value={filtroCoop} onValueChange={setFiltroCoop}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {["Coop Central", "Coop Norte", "Coop Sul", "Coop Leste", "Coop Oeste"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4 mr-2" />Novo Registro</Button>
          </div>

          {selecionados.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted border">
              <span className="text-sm font-medium">{selecionados.length} selecionado(s)</span>
              <Button size="sm" variant="default"><Send className="h-3 w-3 mr-1" />Enviar Selecionados</Button>
              <Button size="sm" variant="outline"><Ban className="h-3 w-3 mr-1" />Cancelar Selecionados</Button>
            </div>
          )}

          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10"></TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Cooperativa</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Registro</TableHead>
                  <TableHead>Atualização</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradosRegistros.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Checkbox checked={selecionados.includes(r.id)} onCheckedChange={() => toggleSelecionado(r.id)} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell className="font-medium">{r.nome}</TableCell>
                    <TableCell className="font-mono text-xs">{r.cpf}</TableCell>
                    <TableCell>{r.cooperativa}</TableCell>
                    <TableCell className="text-right font-semibold">R$ {r.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell><Badge variant={statusMap[r.status]?.variant || "secondary"}>{statusMap[r.status]?.label || r.status}</Badge></TableCell>
                    <TableCell>{r.dataRegistro}</TableCell>
                    <TableCell>{r.dataAtualizacao}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {r.status === "pendente" && <Button size="sm" variant="default" className="h-7 text-xs"><Send className="h-3 w-3 mr-1" />Enviar</Button>}
                        {r.status === "negativado" && <Button size="sm" variant="outline" className="h-7 text-xs"><CheckCircle className="h-3 w-3 mr-1" />Baixa</Button>}
                        {r.status !== "baixa" && <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive"><Ban className="h-3 w-3" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-48">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo de Ação</label>
              <Select value={filtroAcao} onValueChange={setFiltroAcao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="envio">Envio</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="cancelamento">Cancelamento</SelectItem>
                  <SelectItem value="confirmacao">Confirmação</SelectItem>
                  <SelectItem value="cadastro">Cadastro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline"><Download className="h-4 w-4 mr-2" />Exportar Histórico</Button>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Associado</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradosHistorico.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-mono text-xs">{h.dataHora}</TableCell>
                    <TableCell>{h.usuario}</TableCell>
                    <TableCell>{acaoBadge(h.acao)}</TableCell>
                    <TableCell className="font-medium">{h.associado}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{h.detalhes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Registro SPC/Serasa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input placeholder="Nome completo" /></div>
            <div><Label>CPF/CNPJ</Label><Input placeholder="000.000.000-00" /></div>
            <div>
              <Label>Cooperativa</Label>
              <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {["Coop Central", "Coop Norte", "Coop Sul", "Coop Leste", "Coop Oeste"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valor Dívida (R$)</Label><Input type="number" placeholder="0,00" /></div>
            <div><Label>Motivo</Label><Input placeholder="Motivo da negativação" /></div>
            <div><Label>Observações</Label><Textarea placeholder="Observações adicionais..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={() => setModalOpen(false)}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
