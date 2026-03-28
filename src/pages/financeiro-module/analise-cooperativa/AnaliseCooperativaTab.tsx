import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const cooperativas = [
  { nome: "Cooperativa Central", associados: 520, faturamento: 245000, custo: 98000, inadimplencia: 3.2 },
  { nome: "Cooperativa Regional Sul", associados: 380, faturamento: 178000, custo: 72000, inadimplencia: 4.1 },
  { nome: "Cooperativa Noroeste", associados: 290, faturamento: 132000, custo: 58000, inadimplencia: 2.8 },
  { nome: "Cooperativa Leste", associados: 210, faturamento: 96000, custo: 45000, inadimplencia: 5.5 },
  { nome: "Cooperativa Norte", associados: 175, faturamento: 82000, custo: 38000, inadimplencia: 3.9 },
];

const chartData = cooperativas.map(c => ({ name: c.nome.replace("Cooperativa ", ""), Faturamento: c.faturamento, Custo: c.custo }));

export default function AnaliseCooperativaTab() {
  const totalFat = cooperativas.reduce((s, c) => s + c.faturamento, 0);
  const totalAssoc = cooperativas.reduce((s, c) => s + c.associados, 0);

  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md"><Building className="h-5 w-5 text-accent" /></div>
        <div><h1 className="text-xl font-bold text-foreground">Análise por Cooperativa</h1><p className="text-sm text-muted-foreground">Performance financeira agrupada por cooperativa</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Cooperativas Ativas</p><p className="text-xl font-bold text-foreground">{cooperativas.length}</p></CardContent></Card>
        <Card className="border-border"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Associados</p><p className="text-xl font-bold text-foreground">{totalAssoc.toLocaleString()}</p></CardContent></Card>
        <Card className="border-border"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Faturamento Total</p><p className="text-xl font-bold text-success">R$ {totalFat.toLocaleString()}</p></CardContent></Card>
      </div>

      <Card className="border-border">
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} /><Legend />
              <Bar dataKey="Faturamento" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              <Bar dataKey="Custo" fill="hsl(var(--muted-foreground) / 0.4)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border overflow-hidden">
        
        <CardContent className="p-0">
          <Table><TableHeader><TableRow className="bg-primary hover:bg-primary border-b-0">
            <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Cooperativa</TableHead>
            <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Associados</TableHead>
            <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Faturamento</TableHead>
            <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Custo</TableHead>
            <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Margem</TableHead>
            <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Inadimplência</TableHead>
          </TableRow></TableHeader>
          <TableBody>{cooperativas.map((c, i) => {
            const margem = ((c.faturamento - c.custo) / c.faturamento * 100).toFixed(1);
            return (
              <TableRow key={c.nome} className={`${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'} hover:bg-muted/40 transition-colors border-b border-border/60`}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell className="text-right font-semibold">{c.associados}</TableCell>
                <TableCell className="text-right font-semibold text-success">R$ {c.faturamento.toLocaleString()}</TableCell>
                <TableCell className="text-right font-semibold text-destructive">R$ {c.custo.toLocaleString()}</TableCell>
                <TableCell className="text-right"><Badge className={Number(margem) >= 55 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>{margem}%</Badge></TableCell>
                <TableCell className="text-right"><Badge className={c.inadimplencia <= 3.5 ? "bg-success/10 text-success" : c.inadimplencia <= 5 ? "bg-warning/10 text-warning" : "bg-destructive/8 text-destructive"}>{c.inadimplencia}%</Badge></TableCell>
              </TableRow>
            );
          })}</TableBody></Table>
        </CardContent>
      </Card>
    </div>
  );
}
