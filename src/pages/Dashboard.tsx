import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Car, DollarSign, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const PIE_COLORS = ["hsl(217, 91%, 40%)", "hsl(168, 72%, 36%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)"];

export default function Dashboard() {
  const [stats, setStats] = useState({
    associados: 0,
    veiculos: 0,
    sinistrosAbertos: 0,
    mensalidadesPendentes: 0,
  });
  const [sinistrosPorTipo, setSinistrosPorTipo] = useState<any[]>([]);
  const [mensalidadesPorMes, setMensalidadesPorMes] = useState<any[]>([]);
  const [recentAssociados, setRecentAssociados] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const [assocRes, veicRes, sinRes, mensRes, sinTipoRes, recentRes] = await Promise.all([
      supabase.from("associados").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("veiculos").select("id", { count: "exact", head: true }),
      supabase.from("sinistros").select("id", { count: "exact", head: true }).in("status", ["aberto", "em_analise"]),
      supabase.from("mensalidades").select("id", { count: "exact", head: true }).eq("status", "pendente"),
      supabase.from("sinistros").select("tipo"),
      supabase.from("associados").select("id, nome, status, data_adesao").order("created_at", { ascending: false }).limit(5),
    ]);

    setStats({
      associados: assocRes.count ?? 0,
      veiculos: veicRes.count ?? 0,
      sinistrosAbertos: sinRes.count ?? 0,
      mensalidadesPendentes: mensRes.count ?? 0,
    });

    // Sinistros por tipo
    if (sinTipoRes.data) {
      const counts: Record<string, number> = {};
      sinTipoRes.data.forEach((s: any) => {
        counts[s.tipo] = (counts[s.tipo] || 0) + 1;
      });
      setSinistrosPorTipo(Object.entries(counts).map(([name, value]) => ({ name, value })));
    }

    if (recentRes.data) setRecentAssociados(recentRes.data);
  }

  const statusColor: Record<string, string> = {
    ativo: "bg-success/15 text-success border-0",
    inativo: "bg-muted text-muted-foreground border-0",
    suspenso: "bg-warning/15 text-warning border-0",
    cancelado: "bg-destructive/15 text-destructive border-0",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral da associação</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Associados Ativos" value={stats.associados} icon={Users} />
        <StatCard title="Veículos" value={stats.veiculos} icon={Car} />
        <StatCard title="Sinistros Abertos" value={stats.sinistrosAbertos} icon={AlertTriangle} />
        <StatCard title="Mensalidades Pendentes" value={stats.mensalidadesPendentes} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Sinistros por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {sinistrosPorTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={sinistrosPorTipo} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {sinistrosPorTipo.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                Nenhum sinistro registrado
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Últimos Associados</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAssociados.length > 0 ? (
              <div className="space-y-3">
                {recentAssociados.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{a.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Adesão: {new Date(a.data_adesao).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge className={statusColor[a.status] || ""} variant="outline">
                      {a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                Nenhum associado cadastrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
