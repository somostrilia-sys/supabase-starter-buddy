import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PieChart as PieChartIcon, Search, CreditCard, UserPlus, Shield, Calendar, Handshake, MoreHorizontal } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const categorias = [
  { nome: "Mensalidade", icon: CreditCard, valor: 185400, qtd: 1240, color: "hsl(212, 55%, 40%)" },
  { nome: "Adesão", icon: UserPlus, valor: 12600, qtd: 36, color: "hsl(142, 50%, 45%)" },
  { nome: "Sinistro", icon: Shield, valor: 8200, qtd: 12, color: "hsl(0, 55%, 50%)" },
  { nome: "Evento", icon: Calendar, valor: 4500, qtd: 9, color: "hsl(45, 70%, 50%)" },
  { nome: "Negociação", icon: Handshake, valor: 15800, qtd: 22, color: "hsl(270, 50%, 50%)" },
  { nome: "Outras", icon: MoreHorizontal, valor: 3200, qtd: 18, color: "hsl(200, 30%, 60%)" },
];

const pieData = categorias.map(c => ({ name: c.nome, value: c.valor }));
const COLORS = categorias.map(c => c.color);

const detalhes = [
  { id: 1, data: "2025-07-01", descricao: "Mensalidade Jul - Lote 142", categoria: "Mensalidade", valor: 45200, status: "recebido" },
  { id: 2, data: "2025-07-02", descricao: "Adesão novos - Regional Sul", categoria: "Adesão", valor: 3500, status: "recebido" },
  { id: 3, data: "2025-07-03", descricao: "Recuperação sinistro #245", categoria: "Sinistro", valor: 8200, status: "pendente" },
  { id: 4, data: "2025-07-04", descricao: "Evento proteção jul", categoria: "Evento", valor: 4500, status: "recebido" },
  { id: 5, data: "2025-07-05", descricao: "Acordo negociação #89", categoria: "Negociação", valor: 5200, status: "pendente" },
];

const statusColor: Record<string, string> = { recebido: "bg-green-100 text-green-800", pendente: "bg-yellow-100 text-yellow-800" };

export default function RecebimentosCategoriaTab() {
  const [busca, setBusca] = useState("");
  const filtered = detalhes.filter(d => !busca || d.descricao.toLowerCase().includes(busca.toLowerCase()));
  const total = categorias.reduce((s, c) => s + c.valor, 0);

  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[hsl(212_35%_18%)] flex items-center justify-center shadow-md"><PieChartIcon className="h-5 w-5 text-[hsl(210_55%_70%)]" /></div>
        <div><h1 className="text-xl font-bold text-foreground">Recebimentos por Categoria</h1><p className="text-sm text-muted-foreground">Distribuição de receitas por tipo de recebimento</p></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {categorias.map(c => (
          <Card key={c.nome} className="border-[hsl(210_30%_88%)]">
            <CardContent className="p-4 text-center">
              <c.icon className="h-6 w-6 mx-auto mb-2" style={{ color: c.color }} />
              <p className="text-xs text-muted-foreground">{c.nome}</p>
              <p className="text-lg font-bold text-foreground">R$ {(c.valor / 1000).toFixed(0)}k</p>
              <p className="text-xs text-muted-foreground">{c.qtd} lançamentos</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-[hsl(210_30%_88%)]">
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie><Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} /><Legend /></PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-4">
        <div><Label className="text-xs font-medium text-[hsl(212_35%_25%)]">Buscar</Label><div className="relative mt-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9 border-[hsl(210_30%_85%)]" placeholder="Descrição..." value={busca} onChange={e => setBusca(e.target.value)} /></div></div>
      </CardContent></Card>

      <Card className="border-[hsl(210_30%_88%)] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[hsl(212_35%_18%)] via-[hsl(212_35%_28%)] to-[hsl(210_40%_40%)]" />
        <CardContent className="p-0">
          <Table><TableHeader><TableRow className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_18%)] border-b-0">
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Data</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Descrição</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Categoria</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Valor</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>{filtered.map((d, i) => (
            <TableRow key={d.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-[hsl(210_30%_97%)]'} hover:bg-[hsl(210_40%_94%)] transition-colors border-b border-[hsl(210_30%_90%)]`}>
              <TableCell className="text-sm font-mono">{d.data}</TableCell>
              <TableCell className="font-medium">{d.descricao}</TableCell>
              <TableCell><Badge variant="outline" className="border-[hsl(210_35%_70%)] text-[hsl(212_35%_30%)] bg-[hsl(210_40%_95%)]">{d.categoria}</Badge></TableCell>
              <TableCell className="text-right font-semibold text-green-600">R$ {d.valor.toLocaleString()}</TableCell>
              <TableCell><Badge className={statusColor[d.status]}>{d.status}</Badge></TableCell>
            </TableRow>
          ))}</TableBody></Table>
        </CardContent>
      </Card>
    </div>
  );
}
