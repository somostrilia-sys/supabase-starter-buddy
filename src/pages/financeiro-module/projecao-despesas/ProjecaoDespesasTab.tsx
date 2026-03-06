import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart as LineChartIcon, Plus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const projData = [
  { mes: "Jul", otimista: 145000, realista: 158000, conservador: 172000 },
  { mes: "Ago", otimista: 142000, realista: 160000, conservador: 178000 },
  { mes: "Set", otimista: 138000, realista: 155000, conservador: 175000 },
  { mes: "Out", otimista: 140000, realista: 162000, conservador: 180000 },
  { mes: "Nov", otimista: 148000, realista: 168000, conservador: 185000 },
  { mes: "Dez", otimista: 155000, realista: 175000, conservador: 195000 },
];

const recorrentes = [
  { id: 1, descricao: "Folha de pagamento", categoria: "RH", valor: 45000, frequencia: "Mensal" },
  { id: 2, descricao: "Aluguel sede", categoria: "Operacional", valor: 5500, frequencia: "Mensal" },
  { id: 3, descricao: "Rastreamento veicular", categoria: "Operacional", valor: 18900, frequencia: "Mensal" },
  { id: 4, descricao: "Software ERP", categoria: "Tecnologia", valor: 3800, frequencia: "Mensal" },
  { id: 5, descricao: "Internet + Telefonia", categoria: "Operacional", valor: 890, frequencia: "Mensal" },
  { id: 6, descricao: "Contabilidade", categoria: "Serviços", valor: 2500, frequencia: "Mensal" },
  { id: 7, descricao: "Seguro escritório", categoria: "Operacional", valor: 4200, frequencia: "Trimestral" },
];

export default function ProjecaoDespesasTab() {
  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(212_35%_18%)] flex items-center justify-center shadow-md"><LineChartIcon className="h-5 w-5 text-[hsl(210_55%_70%)]" /></div>
          <div><h1 className="text-xl font-bold text-foreground">Projeção de Despesas</h1><p className="text-sm text-muted-foreground">Cenários de despesas para os próximos 6 meses</p></div>
        </div>
        <Button size="sm" className="gap-1.5 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white"><Plus className="h-4 w-4" />Despesa Futura</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Cenário Otimista", value: "R$ 868.000", color: "text-green-600", desc: "Redução de custos projetada" },
          { label: "Cenário Realista", value: "R$ 978.000", color: "text-blue-600", desc: "Base histórica ajustada" },
          { label: "Cenário Conservador", value: "R$ 1.085.000", color: "text-red-600", desc: "Inclusão de riscos adicionais" },
        ].map(c => (
          <Card key={c.label} className="border-[hsl(210_30%_88%)]">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-[hsl(210_30%_88%)]">
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={projData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mes" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} /><Legend />
              <Line type="monotone" dataKey="otimista" stroke="hsl(142, 60%, 45%)" strokeWidth={2} name="Otimista" />
              <Line type="monotone" dataKey="realista" stroke="hsl(212, 55%, 50%)" strokeWidth={2} name="Realista" />
              <Line type="monotone" dataKey="conservador" stroke="hsl(0, 60%, 50%)" strokeWidth={2} name="Conservador" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-[hsl(210_30%_88%)] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[hsl(212_35%_18%)] via-[hsl(212_35%_28%)] to-[hsl(210_40%_40%)]" />
        <CardContent className="p-0">
          <Table><TableHeader><TableRow className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_18%)] border-b-0">
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Descrição</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Categoria</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Valor</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Frequência</TableHead>
          </TableRow></TableHeader>
          <TableBody>{recorrentes.map((r, i) => (
            <TableRow key={r.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-[hsl(210_30%_97%)]'} hover:bg-[hsl(210_40%_94%)] transition-colors border-b border-[hsl(210_30%_90%)]`}>
              <TableCell className="font-medium">{r.descricao}</TableCell>
              <TableCell><Badge variant="outline" className="border-[hsl(210_35%_70%)] text-[hsl(212_35%_30%)] bg-[hsl(210_40%_95%)]">{r.categoria}</Badge></TableCell>
              <TableCell className="text-right font-semibold text-red-500">R$ {r.valor.toLocaleString()}</TableCell>
              <TableCell className="text-sm">{r.frequencia}</TableCell>
            </TableRow>
          ))}</TableBody></Table>
        </CardContent>
      </Card>
    </div>
  );
}
