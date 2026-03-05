import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calculator, Archive, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const captacaoData = [
  { name: "Pipeline", value: 42 },
  { name: "Formulário", value: 28 },
  { name: "Powerlink", value: 18 },
  { name: "Afiliados", value: 15 },
  { name: "Importação", value: 9 },
];

const vendasPagamento = [
  { name: "Cartão", value: 35 },
  { name: "Boleto", value: 28 },
  { name: "Dinheiro", value: 12 },
  { name: "Sem Pagamento", value: 8 },
];

const PIE_COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#94A3B8"];

export default function DashboardTab() {
  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Negociações Criadas", value: 112, change: "+12%", icon: FileText, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Cotações Criadas", value: 87, change: "+8%", icon: Calculator, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
          { label: "Neg. Arquivadas", value: 23, change: "-5%", icon: Archive, color: "text-muted-foreground", bg: "bg-muted/50" },
          { label: "Vendas Concretizadas", value: 45, change: "+18%", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
        ].map(c => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}><c.icon className={`h-5 w-5 ${c.color}`} /></div>
                <div>
                  <p className="text-2xl font-bold">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
              </div>
              <Badge variant="outline" className={`mt-2 text-[10px] ${c.change.startsWith("+") ? "text-green-600 border-green-300" : "text-red-600 border-red-300"}`}>{c.change} vs mês anterior</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Captações */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Captações por Origem</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={captacaoData} layout="vertical" margin={{ left: 70 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={65} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vendas por pagamento */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Vendas por Forma de Pagamento</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={vendasPagamento} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {vendasPagamento.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Mini cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">38</p><p className="text-xs text-muted-foreground">Vistorias Realizadas</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-green-600">32</p><p className="text-xs text-muted-foreground">Vistorias Aprovadas</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-red-600">4</p><p className="text-xs text-muted-foreground">Vistorias Reprovadas</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-amber-600">2</p><p className="text-xs text-muted-foreground">Vistorias Pendentes</p></CardContent></Card>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-blue-600">45</p><p className="text-xs text-muted-foreground">Cadastros SGA Sincronizados</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">89</p><p className="text-xs text-muted-foreground">Atividades Criadas</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-green-600">72</p><p className="text-xs text-muted-foreground">Atividades Concluídas</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-red-600">17</p><p className="text-xs text-muted-foreground">Atividades Atrasadas</p></CardContent></Card>
      </div>
    </div>
  );
}
