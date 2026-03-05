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

const kpis = [
  { title: "Veículos Cadastrados Hoje", value: 12, icon: Car, trend: +8, description: "vs. ontem" },
  { title: "Boletos Gerados no Mês", value: 847, icon: FileText, trend: +3.2, description: "vs. mês anterior" },
  { title: "Boletos Recebidos no Mês", value: 623, icon: CheckCircle, trend: +12, description: "vs. mês anterior" },
  { title: "Boletos Recebidos Hoje", value: 18, icon: CalendarCheck, trend: -5, description: "vs. ontem" },
  { title: "Veículos no Fechamento", value: 1342, icon: Users, trend: +1.5, description: "participantes ativos" },
  { title: "Veículos Congelados", value: 89, icon: Snowflake, trend: -2, description: "fora do fechamento" },
];

export default function DashboardTab() {
  const totalFechamento = 1342 + 89;
  const pctParticipantes = ((1342 / totalFechamento) * 100).toFixed(1);

  return (
    <div className="p-4 md:p-6 space-y-5 min-h-full">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi) => {
          const isPositive = kpi.trend >= 0;
          return (
            <Card key={kpi.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <kpi.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className={`text-xs font-semibold flex items-center gap-0.5 ${isPositive ? "text-green-600" : "text-red-500"}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPositive ? "+" : ""}{kpi.trend}%
                  </span>
                </div>
                <p className="text-2xl font-bold tracking-tight">{kpi.value.toLocaleString("pt-BR")}</p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1 leading-tight">{kpi.title}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Boletos Gerados vs Recebidos */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Boletos: Gerados vs Recebidos</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Comparativo semanal do mês atual</p>
              </div>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={boletosDoMesData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="semana" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="gerados" name="Gerados" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recebidos" name="Recebidos" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Participação no Fechamento */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Fechamento</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{pctParticipantes}% participando</p>
              </div>
              <PieChart className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-3">
            <ResponsiveContainer width="100%" height={180}>
              <RechartsPie>
                <Pie
                  data={fechamentoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {fechamentoData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Participantes ({(1342).toLocaleString("pt-BR")})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
                <span className="text-xs text-muted-foreground">Congelados ({89})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Veículos cadastrados na semana */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Veículos Cadastrados na Semana</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Total: {veiculosDiaData.reduce((a, b) => a + b.cadastrados, 0)} veículos</p>
              </div>
              <Car className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={veiculosDiaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="cadastrados" name="Cadastrados" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recebimento do dia (por hora) */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Recebimentos de Hoje</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Total: R$ {recebimentoDiarioData.reduce((a, b) => a + b.valor, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <CalendarCheck className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={recebimentoDiarioData}>
                <defs>
                  <linearGradient id="recebGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hora" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Valor"]}
                />
                <Area type="monotone" dataKey="valor" stroke="hsl(142 71% 45%)" fill="url(#recebGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
