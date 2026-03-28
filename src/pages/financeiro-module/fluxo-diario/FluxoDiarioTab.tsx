import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, Search, Download, Filter, ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react";

const mockFluxo = [
  { id: 1, data: "2025-07-08", descricao: "Recebimento boletos lote 145", tipo: "entrada", categoria: "Mensalidades", valor: 18500, saldo: 125800 },
  { id: 2, data: "2025-07-08", descricao: "Pagamento fornecedor - ProTrack", tipo: "saida", categoria: "Fornecedores", valor: 4200, saldo: 121600 },
  { id: 3, data: "2025-07-07", descricao: "Recebimento boletos avulsos", tipo: "entrada", categoria: "Mensalidades", valor: 3800, saldo: 107300 },
  { id: 4, data: "2025-07-07", descricao: "Folha de pagamento Jul/25", tipo: "saida", categoria: "Pessoal", valor: 28000, saldo: 103500 },
  { id: 5, data: "2025-07-06", descricao: "Indenização sinistro #S-0045", tipo: "saida", categoria: "Sinistros", valor: 12500, saldo: 131500 },
  { id: 6, data: "2025-07-06", descricao: "Recebimento PIX associados", tipo: "entrada", categoria: "Mensalidades", valor: 9200, saldo: 144000 },
  { id: 7, data: "2025-07-05", descricao: "Aluguel sede administrativa", tipo: "saida", categoria: "Operacional", valor: 5500, saldo: 134800 },
  { id: 8, data: "2025-07-05", descricao: "Recebimento cartão crédito", tipo: "entrada", categoria: "Mensalidades", valor: 22100, saldo: 140300 },
];

export default function FluxoDiarioTab() {
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const filtered = mockFluxo.filter(f => {
    if (filtroTipo !== "todos" && f.tipo !== filtroTipo) return false;
    if (busca && !f.descricao.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const totalEntradas = filtered.filter(f => f.tipo === "entrada").reduce((s, f) => s + f.valor, 0);
  const totalSaidas = filtered.filter(f => f.tipo === "saida").reduce((s, f) => s + f.valor, 0);

  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md">
          <Wallet className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Fluxo Diário</h1>
          <p className="text-sm text-muted-foreground">Movimentações financeiras do dia a dia</p>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-border overflow-hidden">
          
          <CardContent className="p-4 flex items-center gap-3">
            <ArrowUpRight className="h-5 w-5 text-green-600" />
            <div><p className="text-lg font-bold text-green-600">R$ {totalEntradas.toLocaleString()}</p><p className="text-xs text-muted-foreground">Entradas</p></div>
          </CardContent>
        </Card>
        <Card className="border-border overflow-hidden">
          
          <CardContent className="p-4 flex items-center gap-3">
            <ArrowDownRight className="h-5 w-5 text-red-500" />
            <div><p className="text-lg font-bold text-red-500">R$ {totalSaidas.toLocaleString()}</p><p className="text-xs text-muted-foreground">Saídas</p></div>
          </CardContent>
        </Card>
        <Card className="border-border overflow-hidden">
          
          <CardContent className="p-4 flex items-center gap-3">
            <Wallet className="h-5 w-5 text-foreground" />
            <div><p className="text-lg font-bold text-primary">R$ {(totalEntradas - totalSaidas).toLocaleString()}</p><p className="text-xs text-muted-foreground">Saldo</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="grid sm:grid-cols-3 gap-3 items-end">
            <div>
              <Label className="text-xs font-medium text-foreground">Buscar</Label>
              <div className="relative mt-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9 border-border" placeholder="Descrição..." value={busca} onChange={e => setBusca(e.target.value)} /></div>
            </div>
            <div>
              <Label className="text-xs font-medium text-foreground">Tipo</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}><SelectTrigger className="mt-1 border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="entrada">Entradas</SelectItem><SelectItem value="saida">Saídas</SelectItem></SelectContent></Select>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 border-border"><Download className="h-4 w-4" />Exportar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="border-border overflow-hidden">
        
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary border-b-0">
                <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Data</TableHead>
                <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Descrição</TableHead>
                <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Categoria</TableHead>
                <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Tipo</TableHead>
                <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Valor</TableHead>
                <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((f, i) => (
                <TableRow key={f.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'} hover:bg-muted/40 transition-colors border-b border-border/60`}>
                  <TableCell className="text-sm font-mono text-foreground">{f.data}</TableCell>
                  <TableCell className="font-medium text-foreground">{f.descricao}</TableCell>
                  <TableCell><Badge variant="outline" className="border-primary/30 text-foreground bg-primary/8">{f.categoria}</Badge></TableCell>
                  <TableCell>
                    <Badge className={f.tipo === "entrada" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {f.tipo === "entrada" ? "Entrada" : "Saída"}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${f.tipo === "entrada" ? "text-green-600" : "text-red-500"}`}>
                    {f.tipo === "entrada" ? "+" : "-"} R$ {f.valor.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">R$ {f.saldo.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 py-3 bg-muted/30 border-t border-border/60 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{filtered.length} movimentação(ões)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
