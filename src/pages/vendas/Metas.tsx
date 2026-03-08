import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Target, TrendingUp, AlertCircle, Plus, Percent, Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

const consultores = [
  { nome: "Maria Santos", metaContratos: 30, atualContratos: 26, metaFaturamento: 45000, atualFaturamento: 38500, conversao: 32.5, tempoMedio: 12, ranking: 1 },
  { nome: "João Pedro", metaContratos: 25, atualContratos: 18, metaFaturamento: 37500, atualFaturamento: 27000, conversao: 24.0, tempoMedio: 18, ranking: 3 },
  { nome: "Ana Costa", metaContratos: 20, atualContratos: 20, metaFaturamento: 30000, atualFaturamento: 30000, conversao: 40.0, tempoMedio: 8, ranking: 2 },
  { nome: "Carlos Lima", metaContratos: 28, atualContratos: 10, metaFaturamento: 42000, atualFaturamento: 15000, conversao: 15.6, tempoMedio: 22, ranking: 5 },
  { nome: "Fernanda Alves", metaContratos: 22, atualContratos: 17, metaFaturamento: 33000, atualFaturamento: 25500, conversao: 28.3, tempoMedio: 14, ranking: 4 },
];

const evolucao = [
  { mes: "Fev", meta: 120, realizado: 98, faturamento: 180000 },
  { mes: "Mar", meta: 125, realizado: 115, faturamento: 195000 },
  { mes: "Abr", meta: 110, realizado: 108, faturamento: 172000 },
  { mes: "Mai", meta: 130, realizado: 122, faturamento: 210000 },
  { mes: "Jun", meta: 125, realizado: 119, faturamento: 198000 },
  { mes: "Jul", meta: 125, realizado: 91, faturamento: 136000 },
];

const totalMeta = consultores.reduce((s, v) => s + v.metaContratos, 0);
const totalAtual = consultores.reduce((s, v) => s + v.atualContratos, 0);
const taxa = totalMeta > 0 ? (totalAtual / totalMeta) * 100 : 0;

const kpis = [
  { label: "Meta do Mês", value: `${totalMeta} contratos`, icon: Target, color: "text-[hsl(212_55%_40%)]", bg: "bg-[hsl(210_40%_95%)]" },
  { label: "Atingido", value: `${totalAtual} contratos`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
  { label: "Faltam", value: `${totalMeta - totalAtual} contratos`, icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
  { label: "% Atingimento", value: `${taxa.toFixed(1)}%`, icon: Percent, color: "text-yellow-600", bg: "bg-yellow-50" },
];

export default function Metas() {
  const [modalOpen, setModalOpen] = useState(false);
  const [periodo, setPeriodo] = useState("jul-2025");

  const sorted = [...consultores].sort((a, b) => a.ranking - b.ranking);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md">
            <Target className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Metas de Vendas</h1>
            <p className="text-sm text-muted-foreground">Performance por consultor e evolução mensal</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-36 border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="jul-2025">Julho 2025</SelectItem>
              <SelectItem value="jun-2025">Junho 2025</SelectItem>
              <SelectItem value="mai-2025">Maio 2025</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white"><Plus className="h-4 w-4" />Nova Meta</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Nova Meta</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Consultor</Label>
                  <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{consultores.map(v => <SelectItem key={v.nome} value={v.nome}>{v.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Meta de Contratos</Label><Input className="mt-1" type="number" placeholder="0" /></div>
                <div><Label className="text-xs">Meta de Faturamento (R$)</Label><Input className="mt-1" type="number" placeholder="0" /></div>
                <Button className="w-full bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white" onClick={() => setModalOpen(false)}>Criar Meta</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="border-[hsl(210_30%_88%)]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-lg font-bold text-foreground">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="border-border overflow-hidden">
        <div className="h-1 gradient-hero" />
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_18%)] border-b-0">
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">#</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Consultor</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-center">Meta Contr.</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-center">Atual</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Meta Fat.</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Atual Fat.</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-center">Conversão</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-center">Tempo Médio</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">% Atingimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((c, i) => {
                const pctContratos = c.metaContratos > 0 ? (c.atualContratos / c.metaContratos) * 100 : 0;
                const barColor = pctContratos >= 80 ? "bg-green-500" : pctContratos >= 50 ? "bg-yellow-500" : "bg-red-500";
                return (
                  <TableRow key={c.nome} className={`${i % 2 === 0 ? 'bg-card' : 'bg-[hsl(210_30%_97%)]'} hover:bg-[hsl(210_40%_94%)] transition-colors border-b border-[hsl(210_30%_90%)]`}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {c.ranking <= 3 && <Trophy className={`h-4 w-4 ${c.ranking === 1 ? "text-yellow-500" : c.ranking === 2 ? "text-gray-400" : "text-amber-700"}`} />}
                        <span className="font-bold text-[hsl(212_35%_25%)]">{c.ranking}º</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell className="text-center">{c.metaContratos}</TableCell>
                    <TableCell className="text-center font-semibold">{c.atualContratos}</TableCell>
                    <TableCell className="text-right text-sm">R$ {c.metaFaturamento.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">R$ {c.atualFaturamento.toLocaleString()}</TableCell>
                    <TableCell className="text-center"><Badge className={c.conversao >= 30 ? "bg-green-100 text-green-800" : c.conversao >= 20 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>{c.conversao}%</Badge></TableCell>
                    <TableCell className="text-center text-sm">{c.tempoMedio} dias</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20">
                          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(pctContratos, 100)}%` }} />
                          </div>
                        </div>
                        <span className="text-xs font-semibold">{pctContratos.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-[hsl(210_30%_88%)]">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-foreground mb-3">Evolução Meta vs Realizado</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={evolucao}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="meta" fill="hsl(210, 30%, 75%)" name="Meta" radius={[4, 4, 0, 0]} />
                <Bar dataKey="realizado" fill="hsl(212, 35%, 28%)" name="Realizado" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-[hsl(210_30%_88%)]">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-foreground mb-3">Faturamento Mensal</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={evolucao}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="faturamento" stroke="hsl(212, 55%, 40%)" strokeWidth={2} name="Faturamento" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
