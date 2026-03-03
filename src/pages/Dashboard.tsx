import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, Car, AlertTriangle, Wallet, Handshake, TrendingUp,
  PercentCircle, Target, Shield, DollarSign, ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const PIE_COLORS = ["hsl(217,91%,40%)", "hsl(168,72%,36%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)", "hsl(262,60%,55%)"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    associadosAtivos: 0,
    veiculos: 0,
    eventosAbertos: 0,
    recebidoHoje: 0,
    negociacoesAtivas: 0,
    vendasMes: 0,
    inadimplencia: 0,
    conversao: 0,
  });
  const [recentAssociados, setRecentAssociados] = useState<any[]>([]);
  const [sinistrosPorTipo, setSinistrosPorTipo] = useState<any[]>([]);
  const [mensalidadesRecentes, setMensalidadesRecentes] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const today = new Date().toISOString().split("T")[0];
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split("T")[0];

    const [
      assocRes, veicRes, sinRes,
      pagoHojeRes, totalMensRes, atrasoRes,
      sinTipoRes, recentRes, mensRecRes,
    ] = await Promise.all([
      supabase.from("associados").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("veiculos").select("id", { count: "exact", head: true }),
      supabase.from("sinistros").select("id", { count: "exact", head: true }).in("status", ["aberto", "em_analise"]),
      supabase.from("mensalidades").select("valor").eq("status", "pago").eq("data_pagamento", today),
      supabase.from("mensalidades").select("id", { count: "exact", head: true }),
      supabase.from("mensalidades").select("id", { count: "exact", head: true }).eq("status", "atrasado"),
      supabase.from("sinistros").select("tipo"),
      supabase.from("associados").select("id, nome, status, data_adesao").order("created_at", { ascending: false }).limit(5),
      supabase.from("mensalidades").select("*, associados(nome)").order("created_at", { ascending: false }).limit(5),
    ]);

    const recebidoHoje = pagoHojeRes.data?.reduce((s, m) => s + Number(m.valor), 0) ?? 0;
    const totalMens = totalMensRes.count ?? 0;
    const atraso = atrasoRes.count ?? 0;
    const inadimplencia = totalMens > 0 ? Math.round((atraso / totalMens) * 100) : 0;

    setStats({
      associadosAtivos: assocRes.count ?? 0,
      veiculos: veicRes.count ?? 0,
      eventosAbertos: sinRes.count ?? 0,
      recebidoHoje: recebidoHoje,
      negociacoesAtivas: 0,
      vendasMes: 0,
      inadimplencia,
      conversao: 0,
    });

    if (sinTipoRes.data) {
      const counts: Record<string, number> = {};
      sinTipoRes.data.forEach((s: any) => { counts[s.tipo] = (counts[s.tipo] || 0) + 1; });
      setSinistrosPorTipo(Object.entries(counts).map(([name, value]) => ({ name, value })));
    }

    if (recentRes.data) setRecentAssociados(recentRes.data);
    if (mensRecRes.data) setMensalidadesRecentes(mensRecRes.data);
  }

  const statusColor: Record<string, string> = {
    ativo: "bg-success/15 text-success border-0",
    inativo: "bg-muted text-muted-foreground border-0",
    suspenso: "bg-warning/15 text-warning border-0",
    cancelado: "bg-destructive/15 text-destructive border-0",
  };

  const mensStatusColor: Record<string, string> = {
    pendente: "bg-warning/15 text-warning border-0",
    pago: "bg-success/15 text-success border-0",
    atrasado: "bg-destructive/15 text-destructive border-0",
    cancelado: "bg-muted text-muted-foreground border-0",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral da associação</p>
      </div>

      {/* 8 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Associados Ativos" value={stats.associadosAtivos} icon={Users} />
        <StatCard title="Veículos Protegidos" value={stats.veiculos} icon={Car} />
        <StatCard title="Eventos Abertos" value={stats.eventosAbertos} icon={AlertTriangle} />
        <StatCard
          title="Recebido Hoje"
          value={`R$ ${stats.recebidoHoje.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={Wallet}
        />
        <StatCard title="Negociações Ativas" value={stats.negociacoesAtivas} icon={Handshake} />
        <StatCard title="Vendas no Mês" value={stats.vendasMes} icon={TrendingUp} />
        <StatCard
          title="Inadimplência"
          value={`${stats.inadimplencia}%`}
          icon={PercentCircle}
          className={stats.inadimplencia > 20 ? "ring-1 ring-destructive/30" : ""}
        />
        <StatCard
          title="Taxa de Conversão"
          value={`${stats.conversao}%`}
          icon={Target}
        />
      </div>

      {/* 3 Module Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gestão */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-sm font-semibold">Gestão</CardTitle>
              </div>
              <button
                onClick={() => navigate("/associados")}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentAssociados.length > 0 ? (
              <div className="space-y-2.5">
                {recentAssociados.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-1.5 border-b last:border-0 border-border/50">
                    <div>
                      <p className="text-sm font-medium">{a.nome}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(a.data_adesao).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge className={statusColor[a.status] || ""} variant="outline">
                      {a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum associado</p>
            )}
          </CardContent>
        </Card>

        {/* Financeiro */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <CardTitle className="text-sm font-semibold">Financeiro</CardTitle>
              </div>
              <button
                onClick={() => navigate("/financeiro/fluxo-diario")}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Ver mais <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {mensalidadesRecentes.length > 0 ? (
              <div className="space-y-2.5">
                {mensalidadesRecentes.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-1.5 border-b last:border-0 border-border/50">
                    <div>
                      <p className="text-sm font-medium">{(m.associados as any)?.nome || "—"}</p>
                      <p className="text-[11px] text-muted-foreground">
                        R$ {Number(m.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        {m.referencia ? ` · ${m.referencia}` : ""}
                      </p>
                    </div>
                    <Badge className={mensStatusColor[m.status] || ""} variant="outline">
                      {m.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma mensalidade</p>
            )}
          </CardContent>
        </Card>

        {/* Vendas */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-orange-500" />
                </div>
                <CardTitle className="text-sm font-semibold">Vendas</CardTitle>
              </div>
              <button
                onClick={() => navigate("/vendas/pipeline")}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Pipeline <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {sinistrosPorTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={sinistrosPorTipo}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {sinistrosPorTipo.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">Pipeline vazio</p>
                <button
                  onClick={() => navigate("/vendas/pipeline")}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Criar primeiro negócio →
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
