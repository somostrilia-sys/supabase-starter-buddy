import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Search, Download, Plus, DollarSign, Clock, AlertTriangle, CheckCircle } from "lucide-react";

const mock = [
  { id: 1, descricao: "Mensalidade Jan - João Silva", cliente: "João Silva", vencimento: "2025-07-10", valor: 189.90, status: "pendente" as const, categoria: "Mensalidade" },
  { id: 2, descricao: "Adesão - Maria Santos", cliente: "Maria Santos", vencimento: "2025-07-05", valor: 350, status: "recebido" as const, categoria: "Adesão" },
  { id: 3, descricao: "Mensalidade Jan - Pedro Oliveira", cliente: "Pedro Oliveira", vencimento: "2025-06-28", valor: 189.90, status: "atrasado" as const, categoria: "Mensalidade" },
  { id: 4, descricao: "Taxa vistoria - Ana Costa", cliente: "Ana Costa", vencimento: "2025-07-15", valor: 120, status: "pendente" as const, categoria: "Vistoria" },
  { id: 5, descricao: "Mensalidade Jan - Carlos Lima", cliente: "Carlos Lima", vencimento: "2025-07-10", valor: 249.90, status: "recebido" as const, categoria: "Mensalidade" },
  { id: 6, descricao: "Evento especial - Marcos Souza", cliente: "Marcos Souza", vencimento: "2025-07-20", valor: 500, status: "pendente" as const, categoria: "Evento" },
];

const statusColor: Record<string, string> = { pendente: "bg-yellow-100 text-yellow-800", recebido: "bg-green-100 text-green-800", atrasado: "bg-red-100 text-red-800" };

const cards = [
  { label: "Total a Receber", value: "R$ 48.520", icon: DollarSign, color: "text-blue-600" },
  { label: "Recebido no Mês", value: "R$ 32.180", icon: CheckCircle, color: "text-green-600" },
  { label: "Pendente", value: "R$ 12.340", icon: Clock, color: "text-yellow-600" },
  { label: "Em Atraso", value: "R$ 4.000", icon: AlertTriangle, color: "text-red-600" },
];

export default function ContasReceberTab() {
  const [busca, setBusca] = useState("");
  const filtered = mock.filter(f => !busca || f.descricao.toLowerCase().includes(busca.toLowerCase()) || f.cliente.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(212_35%_18%)] flex items-center justify-center shadow-md"><TrendingUp className="h-5 w-5 text-[hsl(210_55%_70%)]" /></div>
          <div><h1 className="text-xl font-bold text-foreground">Contas a Receber</h1><p className="text-sm text-muted-foreground">Receitas e recebimentos programados</p></div>
        </div>
        <Button size="sm" className="gap-1.5 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white"><Plus className="h-4 w-4" />Novo Recebimento</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Card key={c.label} className="border-[hsl(210_30%_88%)]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(210_40%_95%)] flex items-center justify-center"><c.icon className={`h-5 w-5 ${c.color}`} /></div>
              <div><p className="text-xs text-muted-foreground">{c.label}</p><p className="text-lg font-bold text-foreground">{c.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-4"><div className="grid sm:grid-cols-2 gap-3 items-end">
        <div><Label className="text-xs font-medium text-[hsl(212_35%_25%)]">Buscar</Label><div className="relative mt-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9 border-[hsl(210_30%_85%)]" placeholder="Descrição ou cliente..." value={busca} onChange={e => setBusca(e.target.value)} /></div></div>
        <Button variant="outline" size="sm" className="gap-1.5 border-[hsl(210_30%_85%)] w-fit"><Download className="h-4 w-4" />Exportar</Button>
      </div></CardContent></Card>

      <Card className="border-[hsl(210_30%_88%)] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[hsl(212_35%_18%)] via-[hsl(212_35%_28%)] to-[hsl(210_40%_40%)]" />
        <CardContent className="p-0">
          <Table><TableHeader><TableRow className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_18%)] border-b-0">
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Descrição</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Cliente</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Categoria</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Vencimento</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Valor</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>{filtered.map((f, i) => (
            <TableRow key={f.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-[hsl(210_30%_97%)]'} hover:bg-[hsl(210_40%_94%)] transition-colors border-b border-[hsl(210_30%_90%)]`}>
              <TableCell className="font-medium">{f.descricao}</TableCell>
              <TableCell className="text-sm">{f.cliente}</TableCell>
              <TableCell><Badge variant="outline" className="border-[hsl(210_35%_70%)] text-[hsl(212_35%_30%)] bg-[hsl(210_40%_95%)]">{f.categoria}</Badge></TableCell>
              <TableCell className="text-sm font-mono">{f.vencimento}</TableCell>
              <TableCell className="text-right font-semibold text-green-600">R$ {f.valor.toLocaleString()}</TableCell>
              <TableCell><Badge className={statusColor[f.status]}>{f.status}</Badge></TableCell>
            </TableRow>
          ))}</TableBody></Table>
          <div className="px-4 py-3 bg-[hsl(210_30%_97%)] border-t border-[hsl(210_30%_90%)]"><span className="text-xs text-muted-foreground">{filtered.length} recebimento(s)</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
