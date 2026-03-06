import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, Search, Download, Upload } from "lucide-react";

const mock = [
  { id: 1, data: "2025-07-01", descricao: "TED Recebida - Coop Central", tipo: "credito" as const, valor: 45000, saldo: 187500 },
  { id: 2, data: "2025-07-01", descricao: "Pagto Fornecedor - ProTrack", tipo: "debito" as const, valor: 4200, saldo: 183300 },
  { id: 3, data: "2025-07-02", descricao: "Boletos compensados lote 142", tipo: "credito" as const, valor: 12800, saldo: 196100 },
  { id: 4, data: "2025-07-02", descricao: "Tarifa bancária", tipo: "debito" as const, valor: 89.50, saldo: 196010.50 },
  { id: 5, data: "2025-07-03", descricao: "PIX Recebido - Adesão", tipo: "credito" as const, valor: 350, saldo: 196360.50 },
  { id: 6, data: "2025-07-03", descricao: "Pagto Aluguel", tipo: "debito" as const, valor: 5500, saldo: 190860.50 },
  { id: 7, data: "2025-07-04", descricao: "DOC Recebido - Regional Sul", tipo: "credito" as const, valor: 28500, saldo: 219360.50 },
  { id: 8, data: "2025-07-04", descricao: "Pagto Energia", tipo: "debito" as const, valor: 1250, saldo: 218110.50 },
];

export default function ExtratoBancarioTab() {
  const [busca, setBusca] = useState("");
  const [conta, setConta] = useState("todas");
  const filtered = mock.filter(f => !busca || f.descricao.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(212_35%_18%)] flex items-center justify-center shadow-md"><Building2 className="h-5 w-5 text-[hsl(210_55%_70%)]" /></div>
          <div><h1 className="text-xl font-bold text-foreground">Extrato Bancário</h1><p className="text-sm text-muted-foreground">Movimentações bancárias consolidadas</p></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 border-[hsl(210_30%_85%)]"><Upload className="h-4 w-4" />Importar OFX</Button>
          <Button variant="outline" size="sm" className="gap-1.5 border-[hsl(210_30%_85%)]"><Download className="h-4 w-4" />Exportar</Button>
        </div>
      </div>

      <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-4"><div className="grid sm:grid-cols-3 gap-3 items-end">
        <div><Label className="text-xs font-medium text-[hsl(212_35%_25%)]">Conta</Label><Select value={conta} onValueChange={setConta}><SelectTrigger className="mt-1 border-[hsl(210_30%_85%)]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas as contas</SelectItem><SelectItem value="bb">Banco do Brasil</SelectItem><SelectItem value="caixa">Caixa Econômica</SelectItem><SelectItem value="sicoob">Sicoob</SelectItem></SelectContent></Select></div>
        <div><Label className="text-xs font-medium text-[hsl(212_35%_25%)]">Buscar</Label><div className="relative mt-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9 border-[hsl(210_30%_85%)]" placeholder="Descrição..." value={busca} onChange={e => setBusca(e.target.value)} /></div></div>
        <div className="text-right"><p className="text-xs text-muted-foreground">Saldo Atual</p><p className="text-2xl font-bold text-foreground">R$ 218.110,50</p></div>
      </div></CardContent></Card>

      <Card className="border-[hsl(210_30%_88%)] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[hsl(212_35%_18%)] via-[hsl(212_35%_28%)] to-[hsl(210_40%_40%)]" />
        <CardContent className="p-0">
          <Table><TableHeader><TableRow className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_18%)] border-b-0">
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Data</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Descrição</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Tipo</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Valor</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Saldo</TableHead>
          </TableRow></TableHeader>
          <TableBody>{filtered.map((f, i) => (
            <TableRow key={f.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-[hsl(210_30%_97%)]'} hover:bg-[hsl(210_40%_94%)] transition-colors border-b border-[hsl(210_30%_90%)]`}>
              <TableCell className="text-sm font-mono">{f.data}</TableCell>
              <TableCell className="font-medium">{f.descricao}</TableCell>
              <TableCell><Badge className={f.tipo === "credito" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{f.tipo === "credito" ? "Crédito" : "Débito"}</Badge></TableCell>
              <TableCell className={`text-right font-semibold ${f.tipo === "credito" ? "text-green-600" : "text-red-500"}`}>{f.tipo === "credito" ? "+" : "-"} R$ {f.valor.toLocaleString()}</TableCell>
              <TableCell className="text-right font-semibold text-foreground">R$ {f.saldo.toLocaleString()}</TableCell>
            </TableRow>
          ))}</TableBody></Table>
          <div className="px-4 py-3 bg-[hsl(210_30%_97%)] border-t border-[hsl(210_30%_90%)]"><span className="text-xs text-muted-foreground">{filtered.length} lançamento(s)</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
