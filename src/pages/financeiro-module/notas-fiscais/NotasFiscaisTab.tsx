import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Download, Plus } from "lucide-react";

const mock = [
  { id: 1, numero: "NF-001245", emissao: "2025-07-01", destinatario: "Cooperativa Central", valor: 45000, status: "emitida" as const, tipo: "Serviço" },
  { id: 2, numero: "NF-001246", emissao: "2025-07-02", destinatario: "Regional Sul", valor: 28500, status: "emitida" as const, tipo: "Serviço" },
  { id: 3, numero: "NF-001247", emissao: "2025-07-03", destinatario: "ProTrack Ltda", valor: 4200, status: "cancelada" as const, tipo: "Produto" },
  { id: 4, numero: "NF-001248", emissao: "2025-07-04", destinatario: "Imobiliária Central", valor: 5500, status: "emitida" as const, tipo: "Serviço" },
  { id: 5, numero: "NF-001249", emissao: "2025-07-05", destinatario: "CPFL Energia", valor: 1250, status: "pendente" as const, tipo: "Produto" },
];

const statusColor: Record<string, string> = { emitida: "bg-green-100 text-green-800", cancelada: "bg-red-100 text-red-800", pendente: "bg-yellow-100 text-yellow-800" };

export default function NotasFiscaisTab() {
  const [busca, setBusca] = useState("");
  const filtered = mock.filter(f => !busca || f.numero.toLowerCase().includes(busca.toLowerCase()) || f.destinatario.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(212_35%_18%)] flex items-center justify-center shadow-md"><FileText className="h-5 w-5 text-[hsl(210_55%_70%)]" /></div>
          <div><h1 className="text-xl font-bold text-foreground">Notas Fiscais</h1><p className="text-sm text-muted-foreground">Emissão e controle de notas fiscais</p></div>
        </div>
        <Button size="sm" className="gap-1.5 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white"><Plus className="h-4 w-4" />Emitir NF</Button>
      </div>

      <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-4"><div className="grid sm:grid-cols-2 gap-3 items-end">
        <div><Label className="text-xs font-medium text-[hsl(212_35%_25%)]">Buscar</Label><div className="relative mt-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9 border-[hsl(210_30%_85%)]" placeholder="Número ou destinatário..." value={busca} onChange={e => setBusca(e.target.value)} /></div></div>
        <Button variant="outline" size="sm" className="gap-1.5 border-[hsl(210_30%_85%)] w-fit"><Download className="h-4 w-4" />Exportar XML</Button>
      </div></CardContent></Card>

      <Card className="border-[hsl(210_30%_88%)] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[hsl(212_35%_18%)] via-[hsl(212_35%_28%)] to-[hsl(210_40%_40%)]" />
        <CardContent className="p-0">
          <Table><TableHeader><TableRow className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_18%)] border-b-0">
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Número</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Emissão</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Destinatário</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Tipo</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Valor</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>{filtered.map((f, i) => (
            <TableRow key={f.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-[hsl(210_30%_97%)]'} hover:bg-[hsl(210_40%_94%)] transition-colors border-b border-[hsl(210_30%_90%)]`}>
              <TableCell className="font-mono font-medium">{f.numero}</TableCell>
              <TableCell className="text-sm font-mono">{f.emissao}</TableCell>
              <TableCell className="font-medium">{f.destinatario}</TableCell>
              <TableCell><Badge variant="outline" className="border-[hsl(210_35%_70%)] text-[hsl(212_35%_30%)] bg-[hsl(210_40%_95%)]">{f.tipo}</Badge></TableCell>
              <TableCell className="text-right font-semibold">R$ {f.valor.toLocaleString()}</TableCell>
              <TableCell><Badge className={statusColor[f.status]}>{f.status}</Badge></TableCell>
            </TableRow>
          ))}</TableBody></Table>
          <div className="px-4 py-3 bg-[hsl(210_30%_97%)] border-t border-[hsl(210_30%_90%)]"><span className="text-xs text-muted-foreground">{filtered.length} nota(s)</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
