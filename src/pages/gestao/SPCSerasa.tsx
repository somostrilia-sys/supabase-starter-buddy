import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, AlertTriangle, Clock, CheckCircle, XCircle, Download, Search, FileText, ShieldAlert } from "lucide-react";

interface SPCSerasaProps {
  onBack: () => void;
}

const mockRegistros = [
  { id: "1", nome: "Carlos Alberto Souza", cpf: "123.456.789-00", cooperativa: "Coop Central", valor: 3250.0, dataEnvio: "2026-01-15", dataConfirmacao: "2026-01-20", situacao: "confirmado" },
  { id: "2", nome: "Maria das Graças Lima", cpf: "234.567.890-11", cooperativa: "Coop Norte", valor: 1890.5, dataEnvio: "2026-02-01", dataConfirmacao: null, situacao: "enviado" },
  { id: "3", nome: "José Pereira dos Santos", cpf: "345.678.901-22", cooperativa: "Coop Sul", valor: 5400.0, dataEnvio: null, dataConfirmacao: null, situacao: "pendente" },
  { id: "4", nome: "Ana Beatriz Oliveira", cpf: "456.789.012-33", cooperativa: "Coop Leste", valor: 2100.75, dataEnvio: "2026-01-10", dataConfirmacao: "2026-01-18", situacao: "confirmado" },
  { id: "5", nome: "Roberto Carlos Mendes", cpf: "567.890.123-44", cooperativa: "Coop Oeste", valor: 780.0, dataEnvio: "2026-02-10", dataConfirmacao: null, situacao: "cancelado" },
  { id: "6", nome: "Fernanda Silva Costa", cpf: "678.901.234-55", cooperativa: "Coop Central", valor: 4320.0, dataEnvio: "2026-02-15", dataConfirmacao: "2026-02-22", situacao: "confirmado" },
  { id: "7", nome: "Paulo Henrique Rocha", cpf: "789.012.345-66", cooperativa: "Coop Norte", valor: 1560.0, dataEnvio: null, dataConfirmacao: null, situacao: "pendente" },
  { id: "8", nome: "Luciana Ferreira Alves", cpf: "890.123.456-77", cooperativa: "Coop Sul", valor: 6890.25, dataEnvio: "2026-01-25", dataConfirmacao: null, situacao: "enviado" },
  { id: "9", nome: "Marcos Antônio Dias", cpf: "901.234.567-88", cooperativa: "Coop Leste", valor: 920.0, dataEnvio: "2026-02-05", dataConfirmacao: null, situacao: "cancelado" },
  { id: "10", nome: "Patrícia Gomes Ribeiro", cpf: "012.345.678-99", cooperativa: "Coop Oeste", valor: 3780.5, dataEnvio: null, dataConfirmacao: null, situacao: "pendente" },
];

const situacaoBadge = (s: string) => {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pendente: { label: "Pendente", variant: "secondary" },
    enviado: { label: "Enviado", variant: "default" },
    confirmado: { label: "Confirmado", variant: "destructive" },
    cancelado: { label: "Cancelado", variant: "outline" },
  };
  const cfg = map[s] || map.pendente;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

export default function SPCSerasa({ onBack }: SPCSerasaProps) {
  const [busca, setBusca] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState("todos");

  const stats = {
    negativados: mockRegistros.filter((r) => r.situacao === "confirmado").length,
    pendentes: mockRegistros.filter((r) => r.situacao === "pendente").length,
    confirmados: mockRegistros.filter((r) => r.situacao === "confirmado").length,
    cancelados: mockRegistros.filter((r) => r.situacao === "cancelado").length,
  };

  const filtrados = mockRegistros.filter((r) => {
    if (filtroSituacao !== "todos" && r.situacao !== filtroSituacao) return false;
    if (busca && !r.nome.toLowerCase().includes(busca.toLowerCase()) && !r.cpf.includes(busca)) return false;
    return true;
  });

  const negativados = mockRegistros.filter((r) => r.situacao === "confirmado");
  const totalDivida = negativados.reduce((s, r) => s + r.valor, 0);

  const statCards = [
    { label: "Total Enviados", value: stats.negativados + mockRegistros.filter(r => r.situacao === "enviado").length, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Pendentes de Envio", value: stats.pendentes, icon: Clock, color: "text-yellow-500", bg: "bg-warning/8" },
    { label: "Negativados Ativos", value: stats.confirmados, icon: CheckCircle, color: "text-success", bg: "bg-success/8" },
    { label: "Baixas / Cancelados", value: stats.cancelados, icon: XCircle, color: "text-muted-foreground", bg: "bg-muted" },
  ];

  const renderTable = (data: typeof mockRegistros) => (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Nome Associado</TableHead>
            <TableHead>CPF/CNPJ</TableHead>
            <TableHead>Cooperativa</TableHead>
            <TableHead className="text-right">Valor Dívida</TableHead>
            <TableHead>Data Envio</TableHead>
            <TableHead>Data Confirmação</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.nome}</TableCell>
              <TableCell className="font-mono text-xs">{r.cpf}</TableCell>
              <TableCell>{r.cooperativa}</TableCell>
              <TableCell className="text-right font-semibold">R$ {r.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
              <TableCell>{r.dataEnvio || "—"}</TableCell>
              <TableCell>{r.dataConfirmacao || "—"}</TableCell>
              <TableCell>{situacaoBadge(r.situacao)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm"><FileText className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h1 className="text-xl font-bold">SPC / Serasa</h1>
          <p className="text-sm text-muted-foreground">Envio e controle de inadimplentes para negativação</p>
        </div>
      </div>

      <Tabs defaultValue="relatorio">
        <TabsList>
          <TabsTrigger value="relatorio">Inadimplentes Enviados</TabsTrigger>
          <TabsTrigger value="negativados">Negativados Ativos</TabsTrigger>
        </TabsList>

        <TabsContent value="relatorio" className="space-y-6 mt-4">
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

          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Busca</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Nome ou CPF..." className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} />
              </div>
            </div>
            <div className="w-48">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Situação</label>
              <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline"><Download className="h-4 w-4 mr-2" />Exportar Relatório</Button>
          </div>

          {renderTable(filtrados)}
        </TabsContent>

        <TabsContent value="negativados" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="shadow-sm border-red-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-destructive">{negativados.length}</p>
                <p className="text-sm text-muted-foreground">Total Negativados</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-red-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-destructive">R$ {totalDivida.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                <p className="text-sm text-muted-foreground">Valor Total em Dívida</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-red-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-destructive">R$ {negativados.length ? (totalDivida / negativados.length).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00"}</p>
                <p className="text-sm text-muted-foreground">Média por Associado</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button variant="outline"><Download className="h-4 w-4 mr-2" />Exportar Lista</Button>
          </div>

          {renderTable(negativados)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
