import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown, DollarSign, Search, Download, Loader2 } from "lucide-react";
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts";

function buildPeriodos() {
  const periodos: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    periodos.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return periodos;
}

const periodos = buildPeriodos();

type Lancamento = {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  tipo: "entrada" | "saida";
  valor: number;
};

export default function FluxoCaixaTab() {
  const [busca, setBusca] = useState("");
  const [periodo, setPeriodo] = useState(periodos[0].value);
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const { data: mensalidades = [], isLoading: loadingMens } = useQuery({
    queryKey: ["fluxo_mensalidades", periodo],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("mensalidades")
        .select("id, data_pagamento, valor, referencia, associados(nome)")
        .eq("status", "pago")
        .gte("data_pagamento", `${periodo}-01`)
        .lte("data_pagamento", `${periodo}-31`) as any);
      if (error) throw error;
      return (data || []) as { id: string; data_pagamento: string; valor: number; referencia: string | null; associados?: { nome: string } | null }[];
    },
  });

  const { data: contasPagar = [], isLoading: loadingCP } = useQuery({
    queryKey: ["fluxo_contas_pagar", periodo],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("contas_pagar")
        .select("id, data_pagamento, valor, descricao, categoria")
        .eq("status", "pago")
        .gte("data_pagamento", `${periodo}-01`)
        .lte("data_pagamento", `${periodo}-31`) as any);
      if (error) throw error;
      return (data || []) as { id: string; data_pagamento: string; valor: number; descricao: string; categoria: string }[];
    },
  });

  const isLoading = loadingMens || loadingCP;

  const lancamentos: Lancamento[] = useMemo(() => {
    const entradas: Lancamento[] = mensalidades.map(m => ({
      id: m.id,
      data: m.data_pagamento,
      descricao: `Mensalidade${m.referencia ? ` ${m.referencia}` : ""}${m.associados?.nome ? ` - ${m.associados.nome}` : ""}`,
      categoria: "Mensalidade",
      tipo: "entrada",
      valor: m.valor,
    }));
    const saidas: Lancamento[] = contasPagar.map(c => ({
      id: c.id,
      data: c.data_pagamento,
      descricao: c.descricao,
      categoria: c.categoria,
      tipo: "saida",
      valor: c.valor,
    }));
    return [...entradas, ...saidas].sort((a, b) => b.data.localeCompare(a.data));
  }, [mensalidades, contasPagar]);

  const filtered = lancamentos.filter(l => {
    if (filtroTipo !== "todos" && l.tipo !== filtroTipo) return false;
    if (busca && !l.descricao.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const totalEntradas = lancamentos.filter(l => l.tipo === "entrada").reduce((s, l) => s + l.valor, 0);
  const totalSaidas   = lancamentos.filter(l => l.tipo === "saida").reduce((s, l) => s + l.valor, 0);
  const saldo         = totalEntradas - totalSaidas;

  // Build chart data: group by day
  const chartData = useMemo(() => {
    const byDay: Record<string, { Entradas: number; Saídas: number }> = {};
    lancamentos.forEach(l => {
      if (!byDay[l.data]) byDay[l.data] = { Entradas: 0, Saídas: 0 };
      if (l.tipo === "entrada") byDay[l.data].Entradas += l.valor;
      else byDay[l.data].Saídas += l.valor;
    });
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, vals]) => ({
        dia: new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        ...vals,
        Saldo: vals.Entradas - vals.Saídas,
      }));
  }, [lancamentos]);

  const fmtValor = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md">
            <Wallet className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Fluxo de Caixa</h1>
            <p className="text-sm text-muted-foreground">Entradas de mensalidades e saídas de contas pagas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Entradas", value: fmtValor(totalEntradas), icon: TrendingUp,  color: "text-green-600", bg: "bg-success/8" },
          { label: "Total Saídas",   value: fmtValor(totalSaidas),   icon: TrendingDown, color: "text-red-500",  bg: "bg-destructive/8" },
          { label: "Saldo do Período", value: fmtValor(saldo),       icon: DollarSign,  color: saldo >= 0 ? "text-primary" : "text-red-600", bg: "bg-primary/8" },
        ].map(k => (
          <Card key={k.label} className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-foreground mb-3">Fluxo por dia — {periodos.find(p => p.value === periodo)?.label}</p>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                <Legend />
                <Bar dataKey="Entradas" fill="hsl(142, 50%, 45%)" radius={[3, 3, 0, 0]} barSize={14} />
                <Bar dataKey="Saídas" fill="hsl(0, 55%, 55%)" radius={[3, 3, 0, 0]} barSize={14} />
                <Line type="monotone" dataKey="Saldo" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="grid sm:grid-cols-4 gap-3 items-end">
            <div>
              <Label className="text-xs font-medium text-foreground">Período</Label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="mt-1 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {periodos.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-foreground">Tipo</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="mt-1 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-foreground">Buscar</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9 border-border" placeholder="Descrição..." value={busca} onChange={e => setBusca(e.target.value)} />
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 border-border w-fit">
              <Download className="h-4 w-4" />Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border overflow-hidden">
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary border-b-0">
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Data</TableHead>
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Descrição</TableHead>
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Categoria</TableHead>
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Tipo</TableHead>
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                      Nenhum lançamento no período
                    </TableCell>
                  </TableRow>
                ) : filtered.map((l, i) => (
                  <TableRow key={l.id + l.tipo} className={`${i % 2 === 0 ? "bg-card" : "bg-muted/30"} hover:bg-muted/40 transition-colors border-b border-border/60`}>
                    <TableCell className="text-sm font-mono">
                      {new Date(l.data + "T12:00:00").toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{l.descricao}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary/30 text-foreground bg-primary/8">{l.categoria}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={l.tipo === "entrada" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {l.tipo === "entrada" ? "Entrada" : "Saída"}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${l.tipo === "entrada" ? "text-green-600" : "text-red-500"}`}>
                      {l.tipo === "entrada" ? "+" : "-"} {fmtValor(l.valor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="px-4 py-3 bg-muted/30 border-t border-border/60">
            <span className="text-xs text-muted-foreground">{filtered.length} lançamento(s)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
