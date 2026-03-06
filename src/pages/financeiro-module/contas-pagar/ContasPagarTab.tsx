import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Search, Download, Plus, DollarSign, Clock, AlertTriangle, CheckCircle, CalendarDays } from "lucide-react";

const mock = [
  { id: 1, descricao: "Aluguel sede", fornecedor: "Imobiliária Central", vencimento: "2025-07-10", valor: 5500, status: "pendente" as const, categoria: "Operacional" },
  { id: 2, descricao: "Internet + Telefonia", fornecedor: "Vivo Empresas", vencimento: "2025-07-15", valor: 890, status: "pendente" as const, categoria: "Operacional" },
  { id: 3, descricao: "Serviço rastreamento Jul", fornecedor: "ProTrack", vencimento: "2025-07-05", valor: 4200, status: "pago" as const, categoria: "Fornecedores" },
  { id: 4, descricao: "Energia elétrica", fornecedor: "CPFL", vencimento: "2025-07-20", valor: 1250, status: "pendente" as const, categoria: "Operacional" },
  { id: 5, descricao: "Software ERP", fornecedor: "Totvs", vencimento: "2025-06-30", valor: 3800, status: "atrasado" as const, categoria: "Tecnologia" },
  { id: 6, descricao: "Honorários contábeis", fornecedor: "Contabilidade XYZ", vencimento: "2025-07-10", valor: 2500, status: "pago" as const, categoria: "Serviços" },
  { id: 7, descricao: "Material escritório", fornecedor: "Kalunga", vencimento: "2025-07-12", valor: 450, status: "pendente" as const, categoria: "Administrativo" },
  { id: 8, descricao: "Seguro escritório", fornecedor: "Porto Seguro", vencimento: "2025-07-25", valor: 1800, status: "pendente" as const, categoria: "Operacional" },
];

const statusColor: Record<string, string> = { pendente: "bg-yellow-100 text-yellow-800", pago: "bg-green-100 text-green-800", atrasado: "bg-red-100 text-red-800" };

const cards = [
  { label: "Total a Pagar", value: "R$ 20.390", icon: DollarSign, color: "text-red-500", bg: "bg-red-50" },
  { label: "Pago no Mês", value: "R$ 6.700", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  { label: "Pendente", value: "R$ 9.890", icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
  { label: "Em Atraso", value: "R$ 3.800", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
];

// Calendar mock - vencimentos do mês
const vencimentos = [
  { dia: 5, qtd: 1, valor: 4200 },
  { dia: 10, qtd: 2, valor: 8000 },
  { dia: 12, qtd: 1, valor: 450 },
  { dia: 15, qtd: 1, valor: 890 },
  { dia: 20, qtd: 1, valor: 1250 },
  { dia: 25, qtd: 1, valor: 1800 },
  { dia: 30, qtd: 1, valor: 3800 },
];

export default function ContasPagarTab() {
  const [busca, setBusca] = useState("");
  const filtered = mock.filter(f => !busca || f.descricao.toLowerCase().includes(busca.toLowerCase()) || f.fornecedor.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(212_35%_18%)] flex items-center justify-center shadow-md"><TrendingDown className="h-5 w-5 text-[hsl(210_55%_70%)]" /></div>
          <div><h1 className="text-xl font-bold text-foreground">Contas a Pagar</h1><p className="text-sm text-muted-foreground">Obrigações financeiras e pagamentos programados</p></div>
        </div>
        <Button size="sm" className="gap-1.5 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white"><Plus className="h-4 w-4" />Nova Despesa</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Card key={c.label} className="border-[hsl(210_30%_88%)]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}><c.icon className={`h-5 w-5 ${c.color}`} /></div>
              <div><p className="text-xs text-muted-foreground">{c.label}</p><p className="text-lg font-bold text-foreground">{c.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar Strip */}
      <Card className="border-[hsl(210_30%_88%)]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="h-4 w-4 text-[hsl(212_35%_30%)]" />
            <p className="text-sm font-semibold text-foreground">Calendário de Vencimentos - Julho 2025</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {vencimentos.map(v => (
              <div key={v.dia} className="flex flex-col items-center min-w-[70px] p-3 rounded-lg border border-[hsl(210_30%_88%)] bg-[hsl(210_30%_97%)] hover:bg-[hsl(210_40%_94%)] cursor-pointer transition-colors">
                <span className="text-xs text-muted-foreground">Dia</span>
                <span className="text-lg font-bold text-foreground">{v.dia}</span>
                <Badge variant="outline" className="text-[10px] mt-1 border-[hsl(210_35%_70%)]">{v.qtd} conta(s)</Badge>
                <span className="text-xs font-semibold text-red-500 mt-1">R$ {v.valor.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-4"><div className="grid sm:grid-cols-2 gap-3 items-end">
        <div><Label className="text-xs font-medium text-[hsl(212_35%_25%)]">Buscar</Label><div className="relative mt-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9 border-[hsl(210_30%_85%)]" placeholder="Descrição ou fornecedor..." value={busca} onChange={e => setBusca(e.target.value)} /></div></div>
        <Button variant="outline" size="sm" className="gap-1.5 border-[hsl(210_30%_85%)] w-fit"><Download className="h-4 w-4" />Exportar</Button>
      </div></CardContent></Card>

      {/* Table */}
      <Card className="border-[hsl(210_30%_88%)] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[hsl(212_35%_18%)] via-[hsl(212_35%_28%)] to-[hsl(210_40%_40%)]" />
        <CardContent className="p-0">
          <Table><TableHeader><TableRow className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_18%)] border-b-0">
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Descrição</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Fornecedor</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Categoria</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Vencimento</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Valor</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>{filtered.map((f, i) => (
            <TableRow key={f.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-[hsl(210_30%_97%)]'} hover:bg-[hsl(210_40%_94%)] transition-colors border-b border-[hsl(210_30%_90%)]`}>
              <TableCell className="font-medium">{f.descricao}</TableCell>
              <TableCell className="text-sm">{f.fornecedor}</TableCell>
              <TableCell><Badge variant="outline" className="border-[hsl(210_35%_70%)] text-[hsl(212_35%_30%)] bg-[hsl(210_40%_95%)]">{f.categoria}</Badge></TableCell>
              <TableCell className="text-sm font-mono">{f.vencimento}</TableCell>
              <TableCell className="text-right font-semibold text-red-500">R$ {f.valor.toLocaleString()}</TableCell>
              <TableCell><Badge className={statusColor[f.status]}>{f.status}</Badge></TableCell>
            </TableRow>
          ))}</TableBody></Table>
          <div className="px-4 py-3 bg-[hsl(210_30%_97%)] border-t border-[hsl(210_30%_90%)]"><span className="text-xs text-muted-foreground">{filtered.length} conta(s)</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
