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
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md"><Building2 className="h-5 w-5 text-accent" /></div>
          <div><h1 className="text-xl font-bold text-foreground">Extrato Bancário</h1><p className="text-sm text-muted-foreground">Movimentações bancárias consolidadas</p></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 border-border"><Upload className="h-4 w-4" />Importar OFX</Button>
          <Button variant="outline" size="sm" className="gap-1.5 border-border"><Download className="h-4 w-4" />Exportar</Button>
        </div>
      </div>

      <Card className="border-border"><CardContent className="p-4"><div className="grid sm:grid-cols-3 gap-3 items-end">
        <div><Label className="text-xs font-medium text-foreground">Conta</Label><Select value={conta} onValueChange={setConta}><SelectTrigger className="mt-1 border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas as contas</SelectItem><SelectItem value="bb">Banco do Brasil</SelectItem><SelectItem value="caixa">Caixa Econômica</SelectItem><SelectItem value="sicoob">Sicoob</SelectItem></SelectContent></Select></div>
        <div><Label className="text-xs font-medium text-foreground">Buscar</Label><div className="relative mt-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9 border-border" placeholder="Descrição..." value={busca} onChange={e => setBusca(e.target.value)} /></div></div>
        <div className="text-right"><p className="text-xs text-muted-foreground">Saldo Atual</p><p className="text-2xl font-bold text-foreground">R$ 218.110,50</p></div>
      </div></CardContent></Card>

      <Card className="border-border overflow-hidden">
        
        <CardContent className="p-0">
          <Table><TableHeader><TableRow className="bg-primary hover:bg-primary border-b-0">
            <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Data</TableHead>
            <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Descrição</TableHead>
            <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Tipo</TableHead>
            <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Valor</TableHead>
            <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Saldo</TableHead>
          </TableRow></TableHeader>
          <TableBody>{filtered.map((f, i) => (
            <TableRow key={f.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'} hover:bg-muted/40 transition-colors border-b border-border/60`}>
              <TableCell className="text-sm font-mono">{f.data}</TableCell>
              <TableCell className="font-medium">{f.descricao}</TableCell>
              <TableCell><Badge className={f.tipo === "credito" ? "bg-success/10 text-success" : "bg-destructive/8 text-destructive"}>{f.tipo === "credito" ? "Crédito" : "Débito"}</Badge></TableCell>
              <TableCell className={`text-right font-semibold ${f.tipo === "credito" ? "text-success" : "text-destructive"}`}>{f.tipo === "credito" ? "+" : "-"} R$ {f.valor.toLocaleString()}</TableCell>
              <TableCell className="text-right font-semibold text-foreground">R$ {f.saldo.toLocaleString()}</TableCell>
            </TableRow>
          ))}</TableBody></Table>
          <div className="px-4 py-3 bg-muted/30 border-t border-border/60"><span className="text-xs text-muted-foreground">{filtered.length} lançamento(s)</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
