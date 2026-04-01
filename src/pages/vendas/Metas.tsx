import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Target, TrendingUp, AlertCircle, Plus, Percent, Trophy, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const META_CONTRATOS_DEFAULT = 20;
const META_FATURAMENTO_DEFAULT = 30000;

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function getLastNMonths(n: number) {
  const now = new Date();
  const months: { year: number; month: number; label: string; key: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: MONTH_LABELS[d.getMonth()],
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }
  return months;
}

function getPeriodOptions() {
  const now = new Date();
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const lbl = `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
    options.push({ value: val, label: lbl });
  }
  return options;
}

async function fetchConsultoresData(periodoKey: string) {
  // Parse period
  const [yearStr, monthStr] = periodoKey.split("-");
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  const startOfMonth = new Date(year, month - 1, 1).toISOString();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  // Fetch active consultores
  const { data: usuarios, error: errUsuarios } = await (supabase as any)
    .from("usuarios")
    .select("nome")
    .eq("status", "ativo")
    .eq("grupo_permissao", "Consultor");

  if (errUsuarios) throw errUsuarios;
  if (!usuarios || usuarios.length === 0) return [];

  const nomes: string[] = usuarios.map((u: any) => u.nome);

  // Fetch all negociacoes for these consultores in the period
  const { data: negocios, error: errNeg } = await (supabase as any)
    .from("negociacoes")
    .select("consultor, valor_plano, stage, created_at")
    .in("consultor", nomes)
    .gte("created_at", startOfMonth)
    .lte("created_at", endOfMonth);

  if (errNeg) throw errNeg;

  const rows: any[] = negocios || [];

  // Build per-consultor stats
  const consultores = nomes.map((nome) => {
    const mine = rows.filter((r: any) => r.consultor === nome);
    const concluidos = mine.filter((r: any) => r.stage === "concluido");
    const atualContratos = concluidos.length;
    const atualFaturamento = concluidos.reduce((s: number, r: any) => s + (Number(r.valor_plano) || 0), 0);
    const totalLeads = mine.length;
    const conversao = totalLeads > 0 ? (atualContratos / totalLeads) * 100 : 0;

    return {
      nome,
      metaContratos: META_CONTRATOS_DEFAULT,
      atualContratos,
      metaFaturamento: META_FATURAMENTO_DEFAULT,
      atualFaturamento,
      conversao: Math.round(conversao * 10) / 10,
      totalLeads,
      ranking: 0,
    };
  });

  // Sort by atualContratos descending and assign ranking
  consultores.sort((a, b) => b.atualContratos - a.atualContratos);
  consultores.forEach((c, i) => (c.ranking = i + 1));

  return consultores;
}

async function fetchEvolucao() {
  const months = getLastNMonths(6);
  const startDate = new Date(months[0].year, months[0].month, 1).toISOString();
  const endMonth = months[months.length - 1];
  const endDate = new Date(endMonth.year, endMonth.month + 1, 0, 23, 59, 59, 999).toISOString();

  const { data: negocios, error } = await (supabase as any)
    .from("negociacoes")
    .select("consultor, valor_plano, stage, created_at")
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  if (error) throw error;

  const rows: any[] = negocios || [];

  // Count active consultores for meta calculation
  const { data: usuarios } = await (supabase as any)
    .from("usuarios")
    .select("nome")
    .eq("status", "ativo")
    .eq("grupo_permissao", "Consultor");

  const numConsultores = usuarios?.length || 1;
  const metaPerMonth = numConsultores * META_CONTRATOS_DEFAULT;

  return months.map((m) => {
    const inMonth = rows.filter((r: any) => {
      const d = new Date(r.created_at);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    });
    const concluidos = inMonth.filter((r: any) => r.stage === "concluido");
    const faturamento = concluidos.reduce((s: number, r: any) => s + (Number(r.valor_plano) || 0), 0);

    return {
      mes: m.label,
      meta: metaPerMonth,
      realizado: concluidos.length,
      faturamento,
    };
  });
}

export default function Metas() {
  const [modalOpen, setModalOpen] = useState(false);
  const periodOptions = useMemo(() => getPeriodOptions(), []);
  const [periodo, setPeriodo] = useState(periodOptions[0]?.value || "");

  const {
    data: consultores = [],
    isLoading: loadingConsultores,
  } = useQuery({
    queryKey: ["metas-consultores", periodo],
    queryFn: () => fetchConsultoresData(periodo),
    enabled: !!periodo,
  });

  const {
    data: evolucao = [],
    isLoading: loadingEvolucao,
  } = useQuery({
    queryKey: ["metas-evolucao"],
    queryFn: fetchEvolucao,
  });

  const isLoading = loadingConsultores || loadingEvolucao;

  const totalMeta = consultores.reduce((s: number, v: any) => s + v.metaContratos, 0);
  const totalAtual = consultores.reduce((s: number, v: any) => s + v.atualContratos, 0);
  const taxa = totalMeta > 0 ? (totalAtual / totalMeta) * 100 : 0;

  const kpis = [
    { label: "Meta do Mês", value: `${totalMeta} contratos`, icon: Target, color: "text-primary", bg: "bg-primary/8" },
    { label: "Atingido", value: `${totalAtual} contratos`, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
    { label: "Faltam", value: `${Math.max(totalMeta - totalAtual, 0)} contratos`, icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/8" },
    { label: "% Atingimento", value: `${taxa.toFixed(1)}%`, icon: Percent, color: "text-warning", bg: "bg-warning/10" },
  ];

  const sorted = [...consultores].sort((a: any, b: any) => a.ranking - b.ranking);

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
              {periodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Nova Meta</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Nova Meta</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Consultor</Label>
                  <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{consultores.map((v: any) => <SelectItem key={v.nome} value={v.nome}>{v.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Meta de Contratos</Label><Input className="mt-1" type="number" placeholder="0" /></div>
                <div><Label className="text-xs">Meta de Faturamento (R$)</Label><Input className="mt-1" type="number" placeholder="0" /></div>
                <Button className="w-full" onClick={() => setModalOpen(false)}>Criar Meta</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Carregando dados...</span>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(k => (
              <Card key={k.label} className="border-border">
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
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60 border-b-2 border-[#747474]">
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em]">#</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em]">Consultor</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em] text-center">Meta Contr.</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em] text-center">Atual</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em] text-right">Meta Fat.</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em] text-right">Atual Fat.</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em] text-center">Conversão</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em] text-center">Leads</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em]">% Atingimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Nenhum consultor encontrado para este período.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sorted.map((c: any) => {
                      const pctContratos = c.metaContratos > 0 ? (c.atualContratos / c.metaContratos) * 100 : 0;
                      const barColor = pctContratos >= 80 ? "bg-success/80" : pctContratos >= 50 ? "bg-warning/80" : "bg-destructive/80";
                      return (
                        <TableRow key={c.nome} className="hover:bg-muted/30 transition-colors border-b-2 border-[#747474]">
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {c.ranking <= 3 && <Trophy className={`h-4 w-4 ${c.ranking === 1 ? "text-yellow-500" : c.ranking === 2 ? "text-gray-400" : "text-warning"}`} />}
                              <span className="font-bold text-foreground">{c.ranking}º</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{c.nome}</TableCell>
                          <TableCell className="text-center">{c.metaContratos}</TableCell>
                          <TableCell className="text-center font-semibold">{c.atualContratos}</TableCell>
                          <TableCell className="text-right text-sm">R$ {c.metaFaturamento.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-semibold text-success">R$ {c.atualFaturamento.toLocaleString()}</TableCell>
                          <TableCell className="text-center"><Badge className={c.conversao >= 30 ? "bg-success/10 text-success" : c.conversao >= 20 ? "bg-warning/10 text-warning" : "bg-destructive/8 text-destructive"}>{c.conversao}%</Badge></TableCell>
                          <TableCell className="text-center text-sm">{c.totalLeads}</TableCell>
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
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-foreground mb-3">Evolução Meta vs Realizado</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={evolucao}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="meta" fill="hsl(var(--muted-foreground) / 0.35)" name="Meta" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="realizado" fill="hsl(var(--primary))" name="Realizado" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-foreground mb-3">Faturamento Mensal</p>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={evolucao}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="faturamento" stroke="hsl(var(--accent))" strokeWidth={2} name="Faturamento" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
