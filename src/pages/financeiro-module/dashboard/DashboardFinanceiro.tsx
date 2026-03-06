import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Receipt, Wallet, ArrowUpRight, ArrowDownRight, Building2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from "recharts";

const receitasMensais = [
  { mes: "Jan", receitas: 185000, despesas: 142000 },
  { mes: "Fev", receitas: 198000, despesas: 151000 },
  { mes: "Mar", receitas: 210000, despesas: 148000 },
  { mes: "Abr", receitas: 195000, despesas: 155000 },
  { mes: "Mai", receitas: 225000, despesas: 160000 },
  { mes: "Jun", receitas: 240000, despesas: 158000 },
];

const despesasCategoria = [
  { name: "Sinistros", value: 45000, color: "hsl(0, 70%, 50%)" },
  { name: "Operacional", value: 32000, color: "hsl(212, 35%, 25%)" },
  { name: "Pessoal", value: 28000, color: "hsl(210, 55%, 70%)" },
  { name: "Fornecedores", value: 18000, color: "hsl(45, 80%, 50%)" },
  { name: "Impostos", value: 15000, color: "hsl(150, 50%, 40%)" },
];

const fluxoCaixaDiario = [
  { dia: "01", entrada: 12500, saida: 8200 },
  { dia: "05", entrada: 18300, saida: 6700 },
  { dia: "10", entrada: 9800, saida: 14200 },
  { dia: "15", entrada: 22100, saida: 11500 },
  { dia: "20", entrada: 15600, saida: 9300 },
  { dia: "25", entrada: 28400, saida: 12800 },
  { dia: "30", entrada: 19700, saida: 7600 },
];

const inadimplencia = [
  { mes: "Jan", taxa: 4.2 }, { mes: "Fev", taxa: 3.8 }, { mes: "Mar", taxa: 5.1 },
  { mes: "Abr", taxa: 4.5 }, { mes: "Mai", taxa: 3.9 }, { mes: "Jun", taxa: 3.2 },
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

const kpis = [
  { title: "Receita do Mês", value: "R$ 240.000", icon: TrendingUp, trend: +12, color: "text-green-600" },
  { title: "Despesas do Mês", value: "R$ 158.000", icon: TrendingDown, trend: -3, color: "text-red-500" },
  { title: "Saldo Atual", value: "R$ 82.000", icon: Wallet, trend: +18, color: "text-[hsl(212_35%_25%)]" },
  { title: "Boletos Recebidos", value: "1.247", icon: Receipt, trend: +5, color: "text-[hsl(210_55%_50%)]" },
  { title: "Inadimplência", value: "3,2%", icon: ArrowDownRight, trend: -15, color: "text-green-600" },
  { title: "Contas a Vencer", value: "R$ 45.200", icon: DollarSign, trend: 0, color: "text-amber-600" },
];

export default function DashboardFinanceiro() {
  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[hsl(212_35%_18%)] flex items-center justify-center shadow-md">
          <DollarSign className="h-5 w-5 text-[hsl(210_55%_70%)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard Financeiro</h1>
          <p className="text-sm text-muted-foreground">Visão consolidada das finanças da associação</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="border-[hsl(210_30%_88%)] overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[hsl(212_35%_18%)] via-[hsl(212_35%_28%)] to-[hsl(210_40%_40%)]" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{kpi.title}</span>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className="text-xl font-bold text-[hsl(212_35%_20%)]">{kpi.value}</p>
              {kpi.trend !== 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {kpi.trend > 0 ? <ArrowUpRight className="h-3 w-3 text-green-600" /> : <ArrowDownRight className="h-3 w-3 text-red-500" />}
                  <span className={`text-xs font-medium ${kpi.trend > 0 ? "text-green-600" : "text-red-500"}`}>{Math.abs(kpi.trend)}%</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <SectionDivider title="Evolução Financeira" />

      <div className="grid md:grid-cols-2 gap-5">
        {/* Receitas vs Despesas */}
        <Card className="border-[hsl(210_30%_88%)] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[hsl(212_35%_18%)] to-[hsl(210_40%_40%)]" />
          <CardHeader className="pb-2 border-b border-[hsl(210_30%_90%)]">
            <CardTitle className="text-sm text-[hsl(212_35%_20%)]">Receitas vs Despesas (mensal)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={receitasMensais}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 30% 90%)" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} />
                <Bar dataKey="receitas" fill="hsl(212 35% 25%)" radius={[4,4,0,0]} name="Receitas" />
                <Bar dataKey="despesas" fill="hsl(210 55% 70%)" radius={[4,4,0,0]} name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Despesas por Categoria */}
        <Card className="border-[hsl(210_30%_88%)] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[hsl(212_35%_18%)] to-[hsl(210_40%_40%)]" />
          <CardHeader className="pb-2 border-b border-[hsl(210_30%_90%)]">
            <CardTitle className="text-sm text-[hsl(212_35%_20%)]">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={despesasCategoria} dataKey="value" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                  {despesasCategoria.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
          <div className="px-4 pb-4 flex flex-wrap gap-3">
            {despesasCategoria.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <SectionDivider title="Fluxo de Caixa & Inadimplência" />

      <div className="grid md:grid-cols-2 gap-5">
        {/* Fluxo de Caixa */}
        <Card className="border-[hsl(210_30%_88%)] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[hsl(212_35%_18%)] to-[hsl(210_40%_40%)]" />
          <CardHeader className="pb-2 border-b border-[hsl(210_30%_90%)]">
            <CardTitle className="text-sm text-[hsl(212_35%_20%)]">Fluxo de Caixa Diário</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={fluxoCaixaDiario}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 30% 90%)" />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} />
                <Area type="monotone" dataKey="entrada" stroke="hsl(212 35% 25%)" fill="hsl(212 35% 25% / 0.2)" name="Entradas" />
                <Area type="monotone" dataKey="saida" stroke="hsl(0 70% 50%)" fill="hsl(0 70% 50% / 0.1)" name="Saídas" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Inadimplência */}
        <Card className="border-[hsl(210_30%_88%)] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[hsl(212_35%_18%)] to-[hsl(210_40%_40%)]" />
          <CardHeader className="pb-2 border-b border-[hsl(210_30%_90%)]">
            <CardTitle className="text-sm text-[hsl(212_35%_20%)]">Taxa de Inadimplência (%)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={inadimplencia}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 30% 90%)" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 8]} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Line type="monotone" dataKey="taxa" stroke="hsl(212 35% 25%)" strokeWidth={2} dot={{ fill: "hsl(212 35% 25%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
