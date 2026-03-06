import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, Car, AlertTriangle, Wallet, Handshake, TrendingUp,
  PercentCircle, Target, Shield, DollarSign, ArrowRight,
  BarChart3, PieChart, Activity, ChevronRight,
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

const modules = [
  {
    title: "Gestão",
    description: "Associados, veículos, sinistros e documentação",
    icon: Shield,
    route: "/gestao",
  },
  {
    title: "Financeiro",
    description: "Fluxo diário, boletos e conciliação",
    icon: DollarSign,
    route: "/financeiro/fluxo-diario",
  },
  {
    title: "Vendas",
    description: "Pipeline, contatos, metas e afiliados",
    icon: Target,
    route: "/vendas/pipeline",
  },
];

const monthlyChartConfig = {
  associados: { label: "Associados", color: "hsl(var(--chart-1))" },
  veiculos: { label: "Veículos", color: "hsl(var(--chart-2))" },
};

const pieChartConfig = {
  ativo: { label: "Ativos", color: "hsl(var(--chart-1))" },
  inativo: { label: "Inativos", color: "hsl(var(--chart-4))" },
  suspenso: { label: "Suspensos", color: "hsl(var(--chart-3))" },
};

const areaChartConfig = {
  valor: { label: "Recebido", color: "hsl(var(--chart-2))" },
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

function SectionHeader({ icon: Icon, title, action, onAction }: { icon: React.ElementType; title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-primary rounded-full" />
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h2>
      </div>
      {action && onAction && (
        <button onClick={onAction} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          {action}
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, subtitle }: { title: string; value: string | number; icon: React.ElementType; subtitle?: string }) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">{title}</p>
            <p className="text-lg font-bold tracking-tight leading-tight mt-0.5">{value}</p>
            {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm tracking-tight">GIA</span>
            <span className="text-xs text-muted-foreground ml-1">Proteção Veicular</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground text-xs h-8">
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">
        {/* Title + Module nav */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Painel Principal</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Visão consolidada da sua associação de proteção veicular</p>
        </div>

        {/* Module nav cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {modules.map((mod) => (
            <button
              key={mod.title}
              onClick={() => navigate(mod.route)}
              className="group flex items-center gap-4 rounded-md border bg-card p-4 text-left hover:bg-muted/50 hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                <mod.icon className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-sm">{mod.title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground shrink-0" />
            </button>
          ))}
        </div>

        {/* ═══ GESTÃO SECTION ═══ */}
        <div className="space-y-3">
          <SectionHeader icon={Shield} title="Gestão" action="Abrir módulo" onAction={() => navigate("/gestao")} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard title="Associados Ativos" value={stats.associadosAtivos} icon={Users} />
            <KpiCard title="Veículos Protegidos" value={stats.veiculos} icon={Car} />
            <KpiCard title="Eventos Abertos" value={stats.eventosAbertos} icon={AlertTriangle} subtitle={stats.eventosAbertos > 0 ? "Requer atenção" : "Nenhum pendente"} />
            <KpiCard title="Inativos / Suspensos" value={`${stats.associadosInativos} / ${stats.associadosSuspensos}`} icon={Users} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card className="shadow-none">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold">Crescimento Mensal</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">Associados e veículos cadastrados</p>
              </CardHeader>
              <CardContent>
                <ChartContainer config={monthlyChartConfig} className="h-[180px] w-full">
                  <BarChart data={fakeMonthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="associados" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="veiculos" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold">Status dos Associados</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">Distribuição atual da base</p>
              </CardHeader>
              <CardContent>
                <ChartContainer config={pieChartConfig} className="h-[180px] w-full">
                  <RPieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" nameKey="name">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </RPieChart>
                </ChartContainer>
                <div className="flex justify-center gap-4 mt-1">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className="text-muted-foreground">{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ═══ FINANCEIRO SECTION ═══ */}
        <div className="space-y-3">
          <SectionHeader icon={DollarSign} title="Financeiro" action="Abrir módulo" onAction={() => navigate("/financeiro/fluxo-diario")} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard
              title="Recebido Hoje"
              value={`R$ ${stats.recebidoHoje.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              icon={Wallet}
            />
            <KpiCard
              title="Inadimplência"
              value={`${stats.inadimplencia}%`}
              icon={PercentCircle}
              subtitle={stats.inadimplencia > 20 ? "Acima do aceitável" : "Dentro da meta"}
            />
            <KpiCard title="Receita Semanal" value="R$ 10.350,00" icon={Activity} subtitle="Últimos 7 dias" />
            <KpiCard title="Boletos em Aberto" value="124" icon={DollarSign} subtitle="Vencendo este mês" />
          </div>
          <Card className="shadow-none">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">Receitas da Semana</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">Recebimentos diários acumulados</p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={areaChartConfig} className="h-[180px] w-full">
                <AreaChart data={fakeArea}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="valor" stroke="hsl(var(--chart-2))" fill="url(#colorValor)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* ═══ VENDAS SECTION ═══ */}
        <div className="space-y-3 pb-8">
          <SectionHeader icon={Target} title="Vendas" action="Abrir módulo" onAction={() => navigate("/vendas/pipeline")} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard title="Negociações Ativas" value={stats.negociacoesAtivas} icon={Handshake} />
            <KpiCard title="Vendas no Mês" value={stats.vendasMes} icon={TrendingUp} />
            <KpiCard title="Taxa de Conversão" value={`${stats.conversao}%`} icon={Target} subtitle={stats.conversao >= 30 ? "Boa performance" : "Abaixo da meta"} />
            <KpiCard title="Leads no Pipeline" value="47" icon={Users} subtitle="Em qualificação" />
          </div>
        </div>
      </div>
    </div>
  );
}
