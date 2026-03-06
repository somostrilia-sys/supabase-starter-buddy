import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Receipt, Search, Download, Plus, FileText } from "lucide-react";

const mockBoletos = [
  { id: "BOL-001", associado: "João Silva", cpf: "123.456.789-00", vencimento: "2025-07-15", valor: 189.90, status: "pendente" as const },
  { id: "BOL-002", associado: "Maria Oliveira", cpf: "234.567.890-11", vencimento: "2025-07-15", valor: 245.00, status: "pago" as const },
  { id: "BOL-003", associado: "Carlos Santos", cpf: "345.678.901-22", vencimento: "2025-07-10", valor: 189.90, status: "atrasado" as const },
  { id: "BOL-004", associado: "Ana Costa", cpf: "456.789.012-33", vencimento: "2025-07-20", valor: 312.50, status: "pago" as const },
  { id: "BOL-005", associado: "Pedro Lima", cpf: "567.890.123-44", vencimento: "2025-07-15", valor: 189.90, status: "pendente" as const },
  { id: "BOL-006", associado: "Fernanda Souza", cpf: "678.901.234-55", vencimento: "2025-07-05", valor: 245.00, status: "atrasado" as const },
];

const statusColor: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  pago: "bg-green-100 text-green-800",
  atrasado: "bg-red-100 text-red-800",
  cancelado: "bg-gray-100 text-gray-800",
};

export default function BoletosTab() {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const filtered = mockBoletos.filter(b => {
    if (filtroStatus !== "todos" && b.status !== filtroStatus) return false;
    if (busca && !b.associado.toLowerCase().includes(busca.toLowerCase()) && !b.cpf.includes(busca)) return false;
    return true;
  });

  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(212_35%_18%)] flex items-center justify-center shadow-md">
            <Receipt className="h-5 w-5 text-[hsl(210_55%_70%)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Boletos</h1>
            <p className="text-sm text-muted-foreground">Geração, consulta e controle de boletos</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white"><Plus className="h-4 w-4" />Gerar Lote</Button>
      </div>

      <Card className="border-[hsl(210_30%_88%)]">
        <CardContent className="p-4">
          <div className="grid sm:grid-cols-3 gap-3 items-end">
            <div>
              <Label className="text-xs font-medium text-[hsl(212_35%_25%)]">Buscar</Label>
              <div className="relative mt-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9 border-[hsl(210_30%_85%)]" placeholder="Associado ou CPF..." value={busca} onChange={e => setBusca(e.target.value)} /></div>
            </div>
            <div>
              <Label className="text-xs font-medium text-[hsl(212_35%_25%)]">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}><SelectTrigger className="mt-1 border-[hsl(210_30%_85%)]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="pago">Pago</SelectItem><SelectItem value="atrasado">Atrasado</SelectItem></SelectContent></Select>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 border-[hsl(210_30%_85%)]"><Download className="h-4 w-4" />Exportar</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[hsl(210_30%_88%)] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[hsl(212_35%_18%)] via-[hsl(212_35%_28%)] to-[hsl(210_40%_40%)]" />
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_18%)] border-b-0">
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">ID</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Associado</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">CPF</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Vencimento</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Valor</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b, i) => (
                <TableRow key={b.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-[hsl(210_30%_97%)]'} hover:bg-[hsl(210_40%_94%)] transition-colors border-b border-[hsl(210_30%_90%)]`}>
                  <TableCell className="font-mono text-xs text-[hsl(212_35%_30%)] font-semibold">{b.id}</TableCell>
                  <TableCell className="font-medium">{b.associado}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{b.cpf}</TableCell>
                  <TableCell className="text-sm">{b.vencimento}</TableCell>
                  <TableCell className="text-right font-semibold">R$ {b.valor.toFixed(2)}</TableCell>
                  <TableCell><Badge className={statusColor[b.status]}>{b.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 py-3 bg-[hsl(210_30%_97%)] border-t border-[hsl(210_30%_90%)]">
            <span className="text-xs text-muted-foreground">{filtered.length} boleto(s)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
