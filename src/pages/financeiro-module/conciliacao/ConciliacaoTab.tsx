import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Upload, Download, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

const mockConciliacao = [
  { id: 1, data: "2025-07-08", descSistema: "Boleto BOL-002 - Maria Oliveira", descBanco: "PAG BOLETO 234567890", valorSistema: 245.00, valorBanco: 245.00, status: "conciliado" as const },
  { id: 2, data: "2025-07-07", descSistema: "Boleto BOL-004 - Ana Costa", descBanco: "TED RECEBIDA 456789", valorSistema: 312.50, valorBanco: 312.50, status: "conciliado" as const },
  { id: 3, data: "2025-07-07", descSistema: "—", descBanco: "DEPÓSITO 12345", valorSistema: 0, valorBanco: 1500.00, status: "pendente" as const },
  { id: 4, data: "2025-07-06", descSistema: "Pagamento Fornecedor #F-002", descBanco: "—", valorSistema: 4200.00, valorBanco: 0, status: "divergente" as const },
  { id: 5, data: "2025-07-06", descSistema: "Boleto BOL-005 - Pedro Lima", descBanco: "PIX RECEBIDO 567890", valorSistema: 189.90, valorBanco: 189.90, status: "conciliado" as const },
];

const statusMap = {
  conciliado: { label: "Conciliado", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
  divergente: { label: "Divergente", color: "bg-red-100 text-red-800", icon: XCircle },
};

export default function ConciliacaoTab() {
  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md">
            <ArrowLeftRight className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Conciliação Bancária</h1>
            <p className="text-sm text-muted-foreground">Confronto entre lançamentos do sistema e extrato bancário</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5"><Upload className="h-4 w-4" />Importar Extrato</Button>
          <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-white"><ArrowLeftRight className="h-4 w-4" />Conciliar</Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-border overflow-hidden"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">3</p><p className="text-xs text-muted-foreground">Conciliados</p></CardContent></Card>
        <Card className="border-border overflow-hidden"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">1</p><p className="text-xs text-muted-foreground">Pendente</p></CardContent></Card>
        <Card className="border-border overflow-hidden"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-500">1</p><p className="text-xs text-muted-foreground">Divergente</p></CardContent></Card>
      </div>

      <Card className="border-border overflow-hidden">
        
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary border-b-0">
                <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Data</TableHead>
                <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Sistema</TableHead>
                <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Banco</TableHead>
                <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Valor Sistema</TableHead>
                <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Valor Banco</TableHead>
                <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockConciliacao.map((c, i) => (
                <TableRow key={c.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'} hover:bg-muted/40 transition-colors border-b border-border/60`}>
                  <TableCell className="text-sm font-mono text-foreground">{c.data}</TableCell>
                  <TableCell className="text-sm">{c.descSistema}</TableCell>
                  <TableCell className="text-sm">{c.descBanco}</TableCell>
                  <TableCell className="text-right font-medium">{c.valorSistema > 0 ? `R$ ${c.valorSistema.toFixed(2)}` : "—"}</TableCell>
                  <TableCell className="text-right font-medium">{c.valorBanco > 0 ? `R$ ${c.valorBanco.toFixed(2)}` : "—"}</TableCell>
                  <TableCell><Badge className={statusMap[c.status].color}>{statusMap[c.status].label}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
