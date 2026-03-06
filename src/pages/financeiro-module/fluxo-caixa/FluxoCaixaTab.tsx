import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown, DollarSign, AlertTriangle, Search, Download, Plus } from "lucide-react";
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts";

// 30 days mock data
const fluxoData = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2025, 6, 1 + i);
  const entradas = Math.round(2000 + Math.random() * 6000);
  const saidas = Math.round(1000 + Math.random() * 4000);
  return {
    dia: `${d.getDate()}/${d.getMonth() + 1}`,
    Entradas: entradas,
    Saídas: saidas,
    Saldo: entradas - saidas,
  };
});

const lancamentos = [
  { id: 1, data: "2025-07-01", descricao: "Boletos compensados lote 142", tipo: "entrada" as const, categoria: "Mensalidade", conta: "Banco do Brasil", valor: 12800 },
  { id: 2, data: "2025-07-01", descricao: "Pagto Aluguel sede", tipo: "saida" as const, categoria: "Operacional", conta: "Banco do Brasil", valor: 5500 },
  { id: 3, data: "2025-07-02", descricao: "TED Recebida - Coop Central", tipo: "entrada" as const, categoria: "Repasse", conta: "Sicoob", valor: 45000 },
  { id: 4, data: "2025-07-02", descricao: "Pagto Fornecedor ProTrack", tipo: "saida" as const, categoria: "Fornecedores", conta: "Banco do Brasil", valor: 4200 },
  { id: 5, data: "2025-07-03", descricao: "PIX Recebido - Adesão novos", tipo: "entrada" as const, categoria: "Adesão", conta: "Caixa", valor: 3500 },
  { id: 6, data: "2025-07-03", descricao: "Energia elétrica", tipo: "saida" as const, categoria: "Operacional", conta: "Banco do Brasil", valor: 1250 },
  { id: 7, data: "2025-07-04", descricao: "DOC Recebido - Regional Sul", tipo: "entrada" as const, categoria: "Repasse", conta: "Sicoob", valor: 28500 },
  { id: 8, data: "2025-07-04", descricao: "Folha de pagamento", tipo: "saida" as const, categoria: "RH", conta: "Banco do Brasil", valor: 45000 },
];

const kpis = [
  { label: "Saldo Atual", value: "R$ 45.230", icon: DollarSign, color: "text-[hsl(212_55%_40%)]", bg: "bg-[hsl(210_40%_95%)]" },
  { label: "Entradas Hoje", value: "R$ 3.500", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
  { label: "Saídas Hoje", value: "R$ 1.200", icon: TrendingDown, color: "text-red-500", bg: "bg-red-50" },
  { label: "Saldo Projetado", value: "R$ 47.530", icon: Wallet, color: "text-[hsl(212_55%_40%)]", bg: "bg-[hsl(210_40%_95%)]" },
];

export default function FluxoCaixaTab() {
  const [busca, setBusca] = useState("");
  const [periodo, setPeriodo] = useState("jul-2025");
  const [categoria, setCategoria] = useState("todas");
  const [conta, setConta] = useState("todas");

  const filtered = lancamentos.filter(l =>
    (!busca || l.descricao.toLowerCase().includes(busca.toLowerCase())) &&
    (categoria === "todas" || l.categoria === categoria) &&
    (conta === "todas" || l.conta === conta)
  );

  return (
    <div className="p-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(212_35%_18%)] flex items-center justify-center shadow-md">
            <Wallet className="h-5 w-5 text-[hsl(210_55%_70%)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Fluxo de Caixa Diário</h1>
            <p className="text-sm text-muted-foreground">Entradas, saídas e saldo acumulado</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white">
          <Plus className="h-4 w-4" />Novo Lançamento
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="border-[hsl(210_30%_88%)]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-lg font-bold text-foreground">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert */}
      <Card className="border-yellow-300 bg-yellow-50">
        <CardContent className="p-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Alerta de Saldo Baixo</p>
            <p className="text-xs text-yellow-700">O saldo projetado para os próximos 5 dias está abaixo do limite mínimo configurado (R$ 50.000).</p>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="border-[hsl(210_30%_88%)]">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-foreground mb-3">Fluxo de Caixa - Últimos 30 dias</p>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={fluxoData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" tick={{ fontSize: 10 }} interval={2} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="Entradas" fill="hsl(142, 50%, 45%)" radius={[3, 3, 0, 0]} barSize={12} />
              <Bar dataKey="Saídas" fill="hsl(0, 55%, 55%)" radius={[3, 3, 0, 0]} barSize={12} />
              <Line type="monotone" dataKey="Saldo" stroke="hsl(212, 55%, 40%)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-[hsl(210_30%_88%)]">
        <CardContent className="p-4">
          <div className="grid sm:grid-cols-4 gap-3 items-end">
            <div>
              <Label className="text-xs font-medium text-[hsl(212_35%_25%)]">Período</Label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="mt-1 border-[hsl(210_30%_85%)]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="jul-2025">Julho 2025</SelectItem>
                  <SelectItem value="jun-2025">Junho 2025</SelectItem>
                  <SelectItem value="mai-2025">Maio 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-[hsl(212_35%_25%)]">Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="mt-1 border-[hsl(210_30%_85%)]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="Mensalidade">Mensalidade</SelectItem>
                  <SelectItem value="Adesão">Adesão</SelectItem>
                  <SelectItem value="Operacional">Operacional</SelectItem>
                  <SelectItem value="Repasse">Repasse</SelectItem>
                  <SelectItem value="RH">RH</SelectItem>
                  <SelectItem value="Fornecedores">Fornecedores</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-[hsl(212_35%_25%)]">Conta</Label>
              <Select value={conta} onValueChange={setConta}>
                <SelectTrigger className="mt-1 border-[hsl(210_30%_85%)]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as contas</SelectItem>
                  <SelectItem value="Banco do Brasil">Banco do Brasil</SelectItem>
                  <SelectItem value="Sicoob">Sicoob</SelectItem>
                  <SelectItem value="Caixa">Caixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9 border-[hsl(210_30%_85%)]" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} />
              </div>
              <Button variant="outline" size="icon" className="border-[hsl(210_30%_85%)] shrink-0"><Download className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-[hsl(210_30%_88%)] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[hsl(212_35%_18%)] via-[hsl(212_35%_28%)] to-[hsl(210_40%_40%)]" />
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_18%)] border-b-0">
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Data</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Descrição</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Categoria</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Conta</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Tipo</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l, i) => (
                <TableRow key={l.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-[hsl(210_30%_97%)]'} hover:bg-[hsl(210_40%_94%)] transition-colors border-b border-[hsl(210_30%_90%)]`}>
                  <TableCell className="text-sm font-mono">{l.data}</TableCell>
                  <TableCell className="font-medium">{l.descricao}</TableCell>
                  <TableCell><Badge variant="outline" className="border-[hsl(210_35%_70%)] text-[hsl(212_35%_30%)] bg-[hsl(210_40%_95%)]">{l.categoria}</Badge></TableCell>
                  <TableCell className="text-sm">{l.conta}</TableCell>
                  <TableCell><Badge className={l.tipo === "entrada" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{l.tipo === "entrada" ? "Entrada" : "Saída"}</Badge></TableCell>
                  <TableCell className={`text-right font-semibold ${l.tipo === "entrada" ? "text-green-600" : "text-red-500"}`}>{l.tipo === "entrada" ? "+" : "-"} R$ {l.valor.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 py-3 bg-[hsl(210_30%_97%)] border-t border-[hsl(210_30%_90%)]">
            <span className="text-xs text-muted-foreground">{filtered.length} lançamento(s)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
