import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, Car, AlertTriangle, Wallet, Handshake, TrendingUp,
  PercentCircle, Target, BarChart3, Activity, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart as RPieChart, Pie, Cell, AreaChart, Area,
} from "recharts";

const monthlyChartConfig = {
  associados: { label: "Associados", color: "hsl(var(--chart-1))" },
  veiculos: { label: "Veículos", color: "hsl(var(--chart-2))" },
};

const areaChartConfig = {
  valor: { label: "Recebido", color: "hsl(var(--chart-5))" },
};

const pieChartConfig = {
  ativo: { label: "Ativos", color: "hsl(var(--chart-1))" },
  inativo: { label: "Inativos", color: "hsl(var(--chart-4))" },
  suspenso: { label: "Suspensos", color: "hsl(var(--chart-3))" },
};

const fakeMonthly = [
  { mes: "Jan", associados: 12, veiculos: 18 },
  { mes: "Fev", associados: 19, veiculos: 25 },
  { mes: "Mar", associados: 28, veiculos: 34 },
  { mes: "Abr", associados: 35, veiculos: 42 },
  { mes: "Mai", associados: 42, veiculos: 51 },
  { mes: "Jun", associados: 48, veiculos: 58 },
];

const fakeArea = [
  { dia: "Seg", valor: 1200 },
  { dia: "Ter", valor: 850 },
  { dia: "Qua", valor: 2100 },
  { dia: "Qui", valor: 1600 },
  { dia: "Sex", valor: 3200 },
  { dia: "Sáb", valor: 900 },
  { dia: "Dom", valor: 400 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    associadosAtivos: 0,
    associadosInativos: 0,
    associadosSuspensos: 0,
    veiculos: 0,
    eventosAbertos: 0,
    recebidoHoje: 0,
    negociacoesAtivas: 0,
    vendasMes: 0,
    inadimplencia: 0,
    conversao: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const today = new Date().toISOString().split("T")[0];
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split("T")[0];

    const [
      assocAtivos, assocInativos, assocSuspensos,
      veicRes, sinRes,
      pagoHojeRes, totalMensRes, atrasoRes,
      dealsAbertosRes, dealsGanhosRes, dealsTotalRes,
    ] = await Promise.all([
      supabase.from("associados").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("associados").select("id", { count: "exact", head: true }).eq("status", "inativo"),
      supabase.from("associados").select("id", { count: "exact", head: true }).eq("status", "suspenso"),
      supabase.from("veiculos").select("id", { count: "exact", head: true }),
      supabase.from("sinistros").select("id", { count: "exact", head: true }).in("status", ["aberto", "em_analise"]),
      supabase.from("mensalidades").select("valor").eq("status", "pago").eq("data_pagamento", today),
      supabase.from("mensalidades").select("id", { count: "exact", head: true }),
      supabase.from("mensalidades").select("id", { count: "exact", head: true }).eq("status", "atrasado"),
      supabase.from("deals").select("id", { count: "exact", head: true }).eq("status", "aberto").in("stage", ["negociacao", "proposta"]),
      supabase.from("deals").select("id", { count: "exact", head: true }).eq("status", "ganho").gte("updated_at", monthStartStr),
      supabase.from("deals").select("id", { count: "exact", head: true }).gte("created_at", monthStartStr),
    ]);

    const recebidoHoje = pagoHojeRes.data?.reduce((s, m) => s + Number(m.valor), 0) ?? 0;
    const totalMens = totalMensRes.count ?? 0;
    const atraso = atrasoRes.count ?? 0;
    const inadimplencia = totalMens > 0 ? Math.round((atraso / totalMens) * 100) : 0;
    const ganhosMes = dealsGanhosRes.count ?? 0;
    const totalDeals = dealsTotalRes.count ?? 0;
    const conversao = totalDeals > 0 ? Math.round((ganhosMes / totalDeals) * 100) : 0;

    setStats({
      associadosAtivos: assocAtivos.count ?? 0,
      associadosInativos: assocInativos.count ?? 0,
      associadosSuspensos: assocSuspensos.count ?? 0,
      veiculos: veicRes.count ?? 0,
      eventosAbertos: sinRes.count ?? 0,
      recebidoHoje,
      negociacoesAtivas: dealsAbertosRes.count ?? 0,
      vendasMes: ganhosMes,
      inadimplencia,
      conversao,
    });
  }

  const pieData = [
    { name: "Ativos", value: stats.associadosAtivos || 1, fill: "hsl(var(--chart-1))" },
    { name: "Inativos", value: stats.associadosInativos || 0, fill: "hsl(var(--chart-4))" },
    { name: "Suspensos", value: stats.associadosSuspensos || 0, fill: "hsl(var(--chart-3))" },
  ].filter((d) => d.value > 0);

  const kpis = [
    { title: "Associados Ativos", value: stats.associadosAtivos, icon: Users, trend: "+12%", trendUp: true },
    { title: "Veículos Protegidos", value: stats.veiculos, icon: Car, trend: "+8%", trendUp: true },
    { title: "Sinistros Abertos", value: stats.eventosAbertos, icon: AlertTriangle, trend: "-5%", trendUp: false },
    { title: "Recebido Hoje", value: `R$ ${stats.recebidoHoje.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: Wallet, trend: "+15%", trendUp: true },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral da sua associação de proteção veicular</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <kpi.icon className="w-5 h-5 text-primary" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${
                  kpi.trendUp
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}>
                  {kpi.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.trend}
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-label mt-1">{kpi.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { title: "Negociações", value: stats.negociacoesAtivas, icon: Handshake },
          { title: "Vendas/Mês", value: stats.vendasMes, icon: TrendingUp },
          { title: "Inadimplência", value: `${stats.inadimplencia}%`, icon: PercentCircle },
          { title: "Conversão", value: `${stats.conversao}%`, icon: Target },
        ].map((item) => (
          <Card key={item.title} className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-foreground">{item.value}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{item.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Crescimento Mensal</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7">
                Ver Todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={monthlyChartConfig} className="h-[200px] w-full">
              <BarChart data={fakeMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="associados" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="veiculos" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Area Chart */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent" />
                <CardTitle className="text-sm font-semibold">Receitas da Semana</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7">
                Ver Todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={areaChartConfig} className="h-[200px] w-full">
              <AreaChart data={fakeArea}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="valor" stroke="hsl(var(--chart-5))" fill="url(#colorValor)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-warning" />
                <CardTitle className="text-sm font-semibold">Status Associados</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieChartConfig} className="h-[200px] w-full">
              <RPieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </RPieChart>
            </ChartContainer>
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                  <span className="text-muted-foreground">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
