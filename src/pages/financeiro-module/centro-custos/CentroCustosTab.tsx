import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FolderTree, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const centros = [
  { id: 1, nome: "Operacional", responsavel: "Carlos Lima", orcamento: 95000, realizado: 87400, status: "dentro" as const },
  { id: 2, nome: "Administrativo", responsavel: "Maria Santos", orcamento: 62000, realizado: 62330, status: "acima" as const },
  { id: 3, nome: "Comercial", responsavel: "Pedro Oliveira", orcamento: 35000, realizado: 28900, status: "dentro" as const },
  { id: 4, nome: "Tecnologia", responsavel: "Ana Costa", orcamento: 15000, realizado: 9600, status: "dentro" as const },
  { id: 5, nome: "Sinistros", responsavel: "João Silva", orcamento: 80000, realizado: 62400, status: "dentro" as const },
  { id: 6, nome: "Marketing", responsavel: "Marcos Souza", orcamento: 12000, realizado: 14200, status: "acima" as const },
];

const chartData = centros.map(c => ({ name: c.nome, Orçamento: c.orcamento, Realizado: c.realizado }));
const statusColor: Record<string, string> = { dentro: "bg-green-100 text-green-800", acima: "bg-red-100 text-red-800" };

export default function CentroCustosTab() {
  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md"><FolderTree className="h-5 w-5 text-accent" /></div>
          <div><h1 className="text-xl font-bold text-foreground">Centro de Custos</h1><p className="text-sm text-muted-foreground">Orçamento por centro de custo vs realizado</p></div>
        </div>
        <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-white"><Plus className="h-4 w-4" />Novo Centro</Button>
      </div>

      <Card className="border-border">
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} /><Bar dataKey="Orçamento" fill="hsl(var(--muted-foreground) / 0.4)" radius={[4,4,0,0]} /><Bar dataKey="Realizado" fill="hsl(var(--primary))" radius={[4,4,0,0]} /></BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border overflow-hidden">
        
        <CardContent className="p-0">
          <Table><TableHeader><TableRow className="bg-primary hover:bg-primary border-b-0">
            <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Centro</TableHead>
            <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Responsável</TableHead>
            <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Orçamento</TableHead>
            <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Realizado</TableHead>
            <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Variação</TableHead>
            <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>{centros.map((c, i) => {
            const variacao = ((c.realizado - c.orcamento) / c.orcamento * 100).toFixed(1);
            return (
              <TableRow key={c.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'} hover:bg-muted/40 transition-colors border-b border-border/60`}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell className="text-sm">{c.responsavel}</TableCell>
                <TableCell className="text-right font-semibold">R$ {c.orcamento.toLocaleString()}</TableCell>
                <TableCell className="text-right font-semibold">R$ {c.realizado.toLocaleString()}</TableCell>
                <TableCell className={`text-right font-semibold ${Number(variacao) > 0 ? "text-red-500" : "text-green-600"}`}>{Number(variacao) > 0 ? "+" : ""}{variacao}%</TableCell>
                <TableCell><Badge className={statusColor[c.status]}>{c.status === "dentro" ? "Dentro" : "Acima"}</Badge></TableCell>
              </TableRow>
            );
          })}</TableBody></Table>
        </CardContent>
      </Card>
    </div>
  );
}
