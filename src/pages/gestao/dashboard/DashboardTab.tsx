import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, FileText, CheckCircle, CalendarCheck, Users, Snowflake, TrendingUp, TrendingDown, BarChart3, PieChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, AreaChart, Area } from "recharts";

const boletosDoMesData = [
  { semana: "Sem 1", gerados: 210, recebidos: 145 },
  { semana: "Sem 2", gerados: 195, recebidos: 178 },
  { semana: "Sem 3", gerados: 230, recebidos: 201 },
  { semana: "Sem 4", gerados: 212, recebidos: 99 },
];

const veiculosDiaData = [
  { dia: "Seg", cadastrados: 8 },
  { dia: "Ter", cadastrados: 14 },
  { dia: "Qua", cadastrados: 6 },
  { dia: "Qui", cadastrados: 19 },
  { dia: "Sex", cadastrados: 12 },
  { dia: "Sáb", cadastrados: 3 },
  { dia: "Dom", cadastrados: 1 },
];

const fechamentoData = [
  { name: "Participantes", value: 1342, color: "hsl(var(--primary))" },
  { name: "Congelados", value: 89, color: "hsl(var(--muted-foreground))" },
];

const recebimentoDiarioData = [
  { hora: "08h", valor: 1200 },
  { hora: "09h", valor: 3400 },
  { hora: "10h", valor: 2800 },
  { hora: "11h", valor: 5100 },
  { hora: "12h", valor: 1900 },
  { hora: "13h", valor: 4200 },
  { hora: "14h", valor: 6300 },
  { hora: "15h", valor: 3700 },
  { hora: "16h", valor: 2100 },
];

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <div className="w-1 h-4 bg-primary rounded-full" />
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

const kpisCadastro = [
  { title: "Veículos Cadastrados Hoje", value: 12, icon: Car, trend: +8 },
  { title: "Veículos no Fechamento", value: 1342, icon: Users, trend: +1.5 },
  { title: "Veículos Congelados", value: 89, icon: Snowflake, trend: -2 },
];

const kpisFinanceiro = [
  { title: "Boletos Gerados no Mês", value: 847, icon: FileText, trend: +3.2 },
  { title: "Boletos Recebidos no Mês", value: 623, icon: CheckCircle, trend: +12 },
  { title: "Boletos Recebidos Hoje", value: 18, icon: CalendarCheck, trend: -5 },
];

export default function DashboardTab() {
  const totalFechamento = 1342 + 89;
  const pctParticipantes = ((1342 / totalFechamento) * 100).toFixed(1);

  const renderKpi = (kpi: { title: string; value: number; icon: React.ElementType; trend: number }) => {
    const isPositive = kpi.trend >= 0;
    return (
      <Card key={kpi.title} className="shadow-none">
        <CardContent className="p-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <kpi.icon className="w-4 h-4 text-muted-foreground" />
            <span className={`text-[11px] font-medium flex items-center gap-0.5 ${isPositive ? "text-accent" : "text-destructive"}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? "+" : ""}{kpi.trend}%
            </span>
          </div>
          <p className="text-xl font-bold tracking-tight leading-tight">{kpi.value.toLocaleString("pt-BR")}</p>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1 leading-tight">{kpi.title}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-5 min-h-full">
      {/* ═══ CADASTRO & VEÍCULOS ═══ */}
      <SectionDivider title="Cadastro & Veículos" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {kpisCadastro.map(renderKpi)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="shadow-none">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Veículos Cadastrados na Semana</CardTitle>
              <span className="text-xs text-muted-foreground">{veiculosDiaData.reduce((a, b) => a + b.cadastrados, 0)} total</span>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={veiculosDiaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="cadastrados" name="Cadastrados" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Fechamento</CardTitle>
              <span className="text-xs text-muted-foreground">{pctParticipantes}% participando</span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-3">
            <ResponsiveContainer width="100%" height={160}>
              <RechartsPie>
                <Pie data={fechamentoData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
                  {fechamentoData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Participantes ({(1342).toLocaleString("pt-BR")})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                <span className="text-xs text-muted-foreground">Congelados ({89})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ FINANCEIRO ═══ */}
      <SectionDivider title="Financeiro" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {kpisFinanceiro.map(renderKpi)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="shadow-none">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Boletos: Gerados vs Recebidos</CardTitle>
              <span className="text-xs text-muted-foreground">Mês atual</span>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={boletosDoMesData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="semana" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="gerados" name="Gerados" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="recebidos" name="Recebidos" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recebimentos de Hoje</CardTitle>
              <span className="text-xs text-muted-foreground">
                R$ {recebimentoDiarioData.reduce((a, b) => a + b.valor, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={recebimentoDiarioData}>
                <defs>
                  <linearGradient id="recebGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hora" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Valor"]}
                />
                <Area type="monotone" dataKey="valor" stroke="hsl(var(--accent))" fill="url(#recebGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
