import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/hooks/useBrand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, Car, AlertTriangle, Wallet, Handshake, TrendingUp,
  PercentCircle, Target, Shield, DollarSign, ArrowRight,
  BarChart3, Activity, ChevronRight, LogOut,
  Receipt, FileText, CircleDot, Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCountUp } from "@/hooks/useCountUp";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart as RPieChart, Pie, Cell,
} from "recharts";

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

const fakeMonthly = [
  { mes: "Jan", associados: 12, veiculos: 18 },
  { mes: "Fev", associados: 19, veiculos: 25 },
  { mes: "Mar", associados: 28, veiculos: 34 },
  { mes: "Abr", associados: 35, veiculos: 42 },
  { mes: "Mai", associados: 42, veiculos: 51 },
  { mes: "Jun", associados: 48, veiculos: 58 },
];

/* ─── Module buttons config ─── */
const modules = [
  {
    title: "GESTÃO",
    subtitle: "ASSOCIADOS, VEÍCULOS, SINISTROS E DOCUMENTAÇÃO",
    icon: Shield,
    route: "/gestao",
    bg: "linear-gradient(135deg, #1B8C3D 0%, #25A84C 100%)",
  },
  {
    title: "FINANCEIRO",
    subtitle: "FLUXO DIÁRIO, BOLETOS E CONCILIAÇÃO",
    icon: DollarSign,
    route: "/financeiro",
    bg: "linear-gradient(135deg, #1A3A5C 0%, #087DBE 100%)",
  },
  {
    title: "VENDAS",
    subtitle: "PIPELINE, CONTATOS, METAS E AFILIADOS",
    icon: Target,
    route: "/vendas/pipeline",
    bg: "linear-gradient(135deg, #C42B2B 0%, #E04040 100%)",
  },
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
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: color, boxShadow: `0 4px 14px -3px ${color}40` }}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
        </div>
        {action && onAction && (
          <button
            onClick={onAction}
            className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-white transition-all border-2 border-accent/50 rounded-lg px-4 py-2 hover:bg-accent hover:border-accent shadow-sm"
          >
            {action}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div>{children}</div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  subtitle,
  animDelay,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  animDelay?: number;
}) {
  const numericValue = typeof value === 'number' ? value : null;
  const animatedValue = useCountUp(numericValue ?? 0);

  return (
    <Card className={`shadow-sm border card-premium card-glow animate-fade-in-up animate-fade-in-up-${animDelay ?? 1}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight">
              {label}
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {numericValue !== null ? animatedValue : value}
            </p>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground leading-tight">{subtitle}</p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-accent" />
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
      supabase.from("negociacoes").select("id", { count: "exact", head: true }).in("stage", ["em_negociacao", "novo_lead", "em_contato", "aguardando_vistoria"]),
      supabase.from("negociacoes").select("id", { count: "exact", head: true }).eq("stage", "concluido").gte("updated_at", monthStartStr),
      supabase.from("negociacoes").select("id", { count: "exact", head: true }).gte("created_at", monthStartStr),
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
    <div className="min-h-screen bg-background dot-pattern relative">
      <BackgroundEffects />

      {/* ══════════ HEADER ══════════ */}
      <header className="border-b border-white/10 sticky top-0 z-20 gradient-header shadow-lg relative">
        <div className="px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {brand.logoUrl && <img src={brand.logoUrl} alt={brand.name} className="h-9 object-contain brightness-0 invert" />}
            <div>
              <span className="font-bold text-sm tracking-tight text-white">{brand.name}</span>
              <span className="text-xs text-white/30 ml-2 hidden sm:inline uppercase tracking-wider">{brand.subtitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/40 hidden md:block">{user?.email}</span>
            <div className="h-4 w-px bg-white/15 hidden md:block" />
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-white/50 hover:text-white hover:bg-white/10 h-8 gap-1.5 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="px-6 lg:px-8 py-8 relative z-10 space-y-8">

        {/* ══════════ PAGE TITLE (centered) ══════════ */}
        <div className="text-center animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground uppercase">
            Painel Principal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão consolidada da sua associação de proteção veicular
          </p>
        </div>

        {/* ══════════ MODULE NAVIGATION (colored pills) ══════════ */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {modules.map((mod, i) => (
            <button
              key={mod.title}
              onClick={() => navigate(mod.route)}
              className={`group relative flex items-center gap-4 rounded-2xl px-7 py-4 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-xl shadow-lg animate-fade-in-up animate-fade-in-up-${i + 1} min-w-[220px] sm:min-w-[240px]`}
              style={{ background: mod.bg }}
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <mod.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-extrabold text-lg text-white tracking-wide">{mod.title}</h2>
                <p className="text-[10px] text-white/70 mt-0.5 leading-tight font-medium">{mod.subtitle}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ══════════ GESTÃO SECTION ══════════ */}
        <ModuleSection
          icon={Shield}
          title="Gestão"
          color="hsl(var(--gestao))"
          action="Abrir módulo"
          onAction={() => navigate("/gestao")}
        >
          <div className="rounded-2xl border-[3px] border-blue-400/70 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Associados Ativos" value={stats.associadosAtivos} icon={Users} animDelay={1} />
              <KpiCard label="Veículos Protegidos" value={stats.veiculos} icon={Car} animDelay={2} />
              <KpiCard
                label="Eventos Abertos"
                value={stats.eventosAbertos}
                icon={AlertTriangle}
                subtitle={stats.eventosAbertos > 0 ? "Requer atenção" : "Nenhum pendente"}
                animDelay={3}
              />
              <KpiCard
                label="Inativos / Suspensos"
                value={`${stats.associadosInativos} / ${stats.associadosSuspensos}`}
                icon={Users}
                animDelay={4}
              />
            </div>
          </div>
          <div className="rounded-2xl border-[3px] border-blue-400/70 bg-white p-4 shadow-sm mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="shadow-sm border card-premium card-glow animate-fade-in-up animate-fade-in-up-5">
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
                      <Bar dataKey="associados" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="veiculos" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card className="shadow-sm border card-premium card-glow animate-fade-in-up animate-fade-in-up-6">
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
          </div>
        </ModuleSection>

        <div className="h-px bg-border" />

        {/* ══════════ FINANCEIRO SECTION ══════════ */}
        <ModuleSection
          icon={DollarSign}
          title="Financeiro"
          color="hsl(var(--financeiro))"
          action="Abrir módulo"
          onAction={() => navigate("/financeiro")}
        >
          <div className="rounded-2xl border-[3px] border-blue-400/70 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Recebido Hoje"
                value={`R$ ${stats.recebidoHoje.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                icon={Wallet}
                animDelay={1}
              />
              <KpiCard
                label="Inadimplência"
                value={`${stats.inadimplencia}%`}
                icon={PercentCircle}
                subtitle={stats.inadimplencia > 20 ? "Acima do aceitável" : "Dentro da meta"}
                animDelay={2}
              />
              <KpiCard label="Receita Semanal" value="R$ 10.350,00" icon={Receipt} subtitle="Últimos 7 dias" animDelay={3} />
              <KpiCard label="Boletos em Aberto" value="124" icon={FileText} subtitle="Vencendo este mês" animDelay={4} />
            </div>
          </div>
        </ModuleSection>
      </div>
    </div>
  );
}
