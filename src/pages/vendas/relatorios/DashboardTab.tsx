import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, XCircle, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const STAGE_COLORS: Record<string, string> = {
  novo_lead: "#6366F1",
  em_contato: "#3B82F6",
  em_negociacao: "#F97316",
  aguardando_vistoria: "#8B5CF6",
  liberado_cadastro: "#84CC16",
  concluido: "#22C55E",
  perdido: "#EF4444",
};

const STAGE_LABELS: Record<string, string> = {
  novo_lead: "Novo Lead",
  em_contato: "Em Contato",
  em_negociacao: "Em Negociação",
  aguardando_vistoria: "Ag. Vistoria",
  liberado_cadastro: "Lib. Cadastro",
  concluido: "Concluído",
  perdido: "Perdido",
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function DashboardTab({ filters }: { filters?: { cooperativa: string; consultor: string; dateStart?: Date; dateEnd?: Date } } = {}) {
  const { data: negociacoes, isLoading } = useQuery({
    queryKey: ["dashboard-negociacoes", filters?.cooperativa, filters?.consultor, filters?.dateStart?.toISOString(), filters?.dateEnd?.toISOString()],
    queryFn: async () => {
      let q = (supabase as any).from("negociacoes").select("id, stage, consultor, cooperativa, valor_plano, created_at, venda_concluida_em");
      if (filters?.cooperativa && filters.cooperativa !== "all") q = q.eq("cooperativa", filters.cooperativa);
      if (filters?.consultor && filters.consultor !== "all") q = q.eq("consultor", filters.consultor);
      if (filters?.dateStart) q = q.gte("created_at", filters.dateStart.toISOString());
      if (filters?.dateEnd) q = q.lte("created_at", filters.dateEnd.toISOString());
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando dashboard...</span>
      </div>
    );
  }

  const all = negociacoes || [];
  const totalNeg = all.length;
  const concluidas = all.filter((n: any) => n.stage === "concluido");
  const perdidas = all.filter((n: any) => n.stage === "perdido");
  const totalConcluidas = concluidas.length;
  const totalPerdidas = perdidas.length;
  const totalValor = concluidas.reduce((s: number, n: any) => s + (Number(n.valor_plano) || 0), 0);
  const conversionRate = totalNeg > 0 ? ((totalConcluidas / totalNeg) * 100).toFixed(1) : "0";

  // Negociacoes by month (last 6 months)
  const now = new Date();
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const count = all.filter((n: any) => {
      const d = new Date(n.created_at);
      return d >= start && d <= end;
    }).length;
    monthlyData.push({
      name: format(monthDate, "MMM/yy", { locale: ptBR }),
      value: count,
    });
  }

  // Stage distribution
  const stageCounts: Record<string, number> = {};
  all.forEach((n: any) => {
    stageCounts[n.stage] = (stageCounts[n.stage] || 0) + 1;
  });
  const stageData = Object.entries(stageCounts).map(([stage, count]) => ({
    name: STAGE_LABELS[stage] || stage,
    value: count,
    fill: STAGE_COLORS[stage] || "#94A3B8",
  }));

  // Top consultores by vendas concluidas
  const consultorVendas: Record<string, number> = {};
  concluidas.forEach((n: any) => {
    if (n.consultor) {
      consultorVendas[n.consultor] = (consultorVendas[n.consultor] || 0) + 1;
    }
  });
  const topConsultores = Object.entries(consultorVendas)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Negociações", value: totalNeg, icon: FileText, color: "text-blue-600", bg: "bg-primary/6 dark:bg-blue-950/30" },
          { label: "Vendas Concluídas", value: totalConcluidas, icon: TrendingUp, color: "text-success", bg: "bg-success/8 dark:bg-green-950/30" },
          { label: "Perdidas", value: totalPerdidas, icon: XCircle, color: "text-destructive", bg: "bg-destructive/8 dark:bg-red-950/30" },
          { label: "Taxa de Conversão", value: `${conversionRate}%`, icon: TrendingUp, color: "text-warning", bg: "bg-warning/8 dark:bg-amber-950/30" },
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Valor total card */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Valor Total Vendas Concluídas</p>
          <p className="text-2xl font-bold text-success">{fmt(totalValor)}</p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Negociacoes por mês */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Negociações por Mês (últimos 6 meses)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por stage */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Distribuição por Etapa</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stageData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={10}
                >
                  {stageData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Consultores */}
      {topConsultores.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Top Consultores por Vendas Concluídas</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topConsultores} layout="vertical" margin={{ left: 100 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={95} />
                <Tooltip />
                <Bar dataKey="value" fill="#22C55E" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
