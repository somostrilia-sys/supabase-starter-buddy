import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/hooks/useBrand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, Car, AlertTriangle, Wallet, Handshake, TrendingUp,
  PercentCircle, Target, Shield, DollarSign, ArrowRight,
  BarChart3, PieChart, Activity, ChevronRight, LogOut,
  Receipt, FileText, CircleDot,
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

/* ─── Module definitions ─── */
const modules = [
  {
    title: "Gestão",
    subtitle: "Associados, veículos, sinistros e documentação",
    icon: Shield,
    route: "/gestao",
    color: "hsl(var(--gestao))",
  },
  {
    title: "Financeiro",
    subtitle: "Fluxo diário, boletos e conciliação",
    icon: DollarSign,
    route: "/financeiro/fluxo-diario",
    color: "hsl(var(--financeiro))",
  },
  {
    title: "Vendas",
    subtitle: "Pipeline, contatos, metas e afiliados",
    icon: Target,
    route: "/vendas/pipeline",
    color: "hsl(var(--vendas))",
  },
];

/* ─── Chart configs ─── */
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

/* ─── Components ─── */
function ModuleSection({
  icon: Icon,
  title,
  color,
  action,
  onAction,
  children,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            <Icon className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
          </div>
        </div>
        {action && onAction && (
          <button
            onClick={onAction}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border rounded px-3 py-1.5 hover:bg-muted"
          >
            {action}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="pl-0">{children}</div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
}) {
  return (
    <Card className="shadow-none border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight">
              {label}
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground leading-tight">{subtitle}</p>
            )}
          </div>
          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { brand } = useBrand();
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
      {/* ══════════ HEADER ══════════ */}
      <header className="border-b sticky top-0 z-20" style={{ backgroundColor: `hsl(${brand.headerBg})` }}>
        <div className="px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {brand.logoUrl && <img src={brand.logoUrl} alt={brand.name} className="h-8 object-contain" />}
            <div>
              <span className="font-bold text-sm tracking-tight text-white">{brand.name}</span>
              <span className="text-xs text-white/50 ml-2 hidden sm:inline">{brand.subtitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/50 hidden md:block">{user?.email}</span>
            <div className="h-4 w-px bg-white/20 hidden md:block" />
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-white/60 hover:text-white hover:bg-white/10 h-8 gap-1.5 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="px-6 lg:px-8 py-8 space-y-10">
        {/* ══════════ PAGE TITLE ══════════ */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Painel Principal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão consolidada da sua associação de proteção veicular
          </p>
        </div>

        {/* ══════════ MODULE NAVIGATION ══════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <button
              key={mod.title}
              onClick={() => navigate(mod.route)}
              className="group relative flex items-center gap-5 rounded-lg border bg-card p-6 text-left hover:border-primary/40 transition-all duration-200"
            >
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: mod.color }}
              >
                <mod.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-base text-foreground">{mod.title}</h2>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{mod.subtitle}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-border group-hover:text-primary transition-colors shrink-0" />
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* ══════════ GESTÃO SECTION ══════════ */}
        {/* ═══════════════════════════════════════ */}
        <ModuleSection
          icon={Shield}
          title="Gestão"
          color="hsl(var(--gestao))"
          action="Abrir módulo"
          onAction={() => navigate("/gestao")}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Associados Ativos" value={stats.associadosAtivos} icon={Users} />
            <KpiCard label="Veículos Protegidos" value={stats.veiculos} icon={Car} />
            <KpiCard
              label="Eventos Abertos"
              value={stats.eventosAbertos}
              icon={AlertTriangle}
              subtitle={stats.eventosAbertos > 0 ? "Requer atenção" : "Nenhum pendente"}
            />
            <KpiCard
              label="Inativos / Suspensos"
              value={`${stats.associadosInativos} / ${stats.associadosSuspensos}`}
              icon={Users}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <Card className="shadow-none border">
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-sm font-semibold text-foreground">Crescimento Mensal</CardTitle>
                <p className="text-xs text-muted-foreground">Associados e veículos cadastrados</p>
              </CardHeader>
              <CardContent className="px-3 pb-4">
                <ChartContainer config={monthlyChartConfig} className="h-[200px] w-full">
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
            <Card className="shadow-none border">
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-sm font-semibold text-foreground">Status dos Associados</CardTitle>
                <p className="text-xs text-muted-foreground">Distribuição atual da base</p>
              </CardHeader>
              <CardContent className="px-3 pb-4">
                <ChartContainer config={pieChartConfig} className="h-[200px] w-full">
                  <RPieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </RPieChart>
                </ChartContainer>
                <div className="flex justify-center gap-5 mt-2">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className="text-muted-foreground font-medium">{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ModuleSection>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* ═══════════════════════════════════════ */}
        {/* ══════════ FINANCEIRO SECTION ══════════ */}
        {/* ═══════════════════════════════════════ */}
        <ModuleSection
          icon={DollarSign}
          title="Financeiro"
          color="hsl(var(--financeiro))"
          action="Abrir módulo"
          onAction={() => navigate("/financeiro/fluxo-diario")}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Recebido Hoje"
              value={`R$ ${stats.recebidoHoje.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              icon={Wallet}
            />
            <KpiCard
              label="Inadimplência"
              value={`${stats.inadimplencia}%`}
              icon={PercentCircle}
              subtitle={stats.inadimplencia > 20 ? "Acima do aceitável" : "Dentro da meta"}
            />
            <KpiCard label="Receita Semanal" value="R$ 10.350,00" icon={Receipt} subtitle="Últimos 7 dias" />
            <KpiCard label="Boletos em Aberto" value="124" icon={FileText} subtitle="Vencendo este mês" />
          </div>
          <div className="mt-4">
            <Card className="shadow-none border">
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-sm font-semibold text-foreground">Receitas da Semana</CardTitle>
                <p className="text-xs text-muted-foreground">Recebimentos diários acumulados</p>
              </CardHeader>
              <CardContent className="px-3 pb-4">
                <ChartContainer config={areaChartConfig} className="h-[200px] w-full">
                  <AreaChart data={fakeArea}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="dia" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <defs>
                      <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="valor" stroke="hsl(var(--chart-2))" fill="url(#colorValor)" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </ModuleSection>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* ═══════════════════════════════════════ */}
        {/* ══════════ VENDAS SECTION ══════════ */}
        {/* ═══════════════════════════════════════ */}
        <ModuleSection
          icon={Target}
          title="Vendas"
          color="hsl(var(--vendas))"
          action="Abrir módulo"
          onAction={() => navigate("/vendas/pipeline")}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-8">
            <KpiCard label="Negociações Ativas" value={stats.negociacoesAtivas} icon={Handshake} />
            <KpiCard label="Vendas no Mês" value={stats.vendasMes} icon={TrendingUp} />
            <KpiCard
              label="Taxa de Conversão"
              value={`${stats.conversao}%`}
              icon={Target}
              subtitle={stats.conversao >= 30 ? "Boa performance" : "Abaixo da meta"}
            />
            <KpiCard label="Leads no Pipeline" value="47" icon={CircleDot} subtitle="Em qualificação" />
          </div>
        </ModuleSection>
      </div>
    </div>
  );
}
