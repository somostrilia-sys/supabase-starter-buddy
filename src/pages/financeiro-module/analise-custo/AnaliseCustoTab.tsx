import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const consultores = [
  { nome: "Carlos Lima", faturamento: 125000, custo: 45000, margem: 64, roi: 2.78 },
  { nome: "Maria Santos", faturamento: 98000, custo: 38000, margem: 61.2, roi: 2.58 },
  { nome: "Pedro Oliveira", faturamento: 87500, custo: 42000, margem: 52, roi: 2.08 },
  { nome: "Ana Costa", faturamento: 76000, custo: 35000, margem: 53.9, roi: 2.17 },
  { nome: "João Silva", faturamento: 68000, custo: 40000, margem: 41.2, roi: 1.70 },
  { nome: "Marcos Souza", faturamento: 54000, custo: 32000, margem: 40.7, roi: 1.69 },
];

const chartData = consultores.map(c => ({ name: c.nome.split(" ")[0], Faturamento: c.faturamento, Custo: c.custo }));

export default function AnaliseCustoTab() {
  const totalFat = consultores.reduce((s, c) => s + c.faturamento, 0);
  const totalCusto = consultores.reduce((s, c) => s + c.custo, 0);

  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[hsl(212_35%_18%)] flex items-center justify-center shadow-md"><BarChart3 className="h-5 w-5 text-[hsl(210_55%_70%)]" /></div>
        <div><h1 className="text-xl font-bold text-foreground">Análise Custo vs Faturamento</h1><p className="text-sm text-muted-foreground">Performance por consultor - ranking de eficiência</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Faturamento Total</p><p className="text-xl font-bold text-green-600">R$ {totalFat.toLocaleString()}</p></CardContent></Card>
        <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Custo Total</p><p className="text-xl font-bold text-red-500">R$ {totalCusto.toLocaleString()}</p></CardContent></Card>
        <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Margem Média</p><p className="text-xl font-bold text-foreground">{((totalFat - totalCusto) / totalFat * 100).toFixed(1)}%</p></CardContent></Card>
      </div>

      <Card className="border-[hsl(210_30%_88%)]">
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} /><Legend />
              <Bar dataKey="Faturamento" fill="hsl(142, 50%, 45%)" radius={[4,4,0,0]} />
              <Bar dataKey="Custo" fill="hsl(0, 55%, 50%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-[hsl(210_30%_88%)] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[hsl(212_35%_18%)] via-[hsl(212_35%_28%)] to-[hsl(210_40%_40%)]" />
        <CardContent className="p-0">
          <Table><TableHeader><TableRow className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_18%)] border-b-0">
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">#</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Consultor</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Faturamento</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Custo</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Margem</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">ROI</TableHead>
          </TableRow></TableHeader>
          <TableBody>{consultores.map((c, i) => (
            <TableRow key={c.nome} className={`${i % 2 === 0 ? 'bg-card' : 'bg-[hsl(210_30%_97%)]'} hover:bg-[hsl(210_40%_94%)] transition-colors border-b border-[hsl(210_30%_90%)]`}>
              <TableCell className="font-bold text-[hsl(212_35%_25%)]">{i + 1}º</TableCell>
              <TableCell className="font-medium">{c.nome}</TableCell>
              <TableCell className="text-right font-semibold text-green-600">R$ {c.faturamento.toLocaleString()}</TableCell>
              <TableCell className="text-right font-semibold text-red-500">R$ {c.custo.toLocaleString()}</TableCell>
              <TableCell className="text-right"><Badge className={c.margem >= 50 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>{c.margem}%</Badge></TableCell>
              <TableCell className="text-right font-semibold">{c.roi.toFixed(2)}x</TableCell>
            </TableRow>
          ))}</TableBody></Table>
        </CardContent>
      </Card>
    </div>
  );
}
