import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, Car, AlertTriangle, Wallet, Handshake, TrendingUp,
  PercentCircle, Target, Shield, DollarSign, ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const modules = [
  {
    title: "Gestão",
    description: "Associados, veículos, sinistros, vistorias e documentação",
    icon: Shield,
    color: "bg-primary/10 text-primary",
    borderColor: "hover:border-primary/40",
    route: "/associados",
  },
  {
    title: "Financeiro",
    description: "Fluxo diário, boletos, conciliação e relatórios",
    icon: DollarSign,
    color: "bg-accent/10 text-accent",
    borderColor: "hover:border-accent/40",
    route: "/financeiro/fluxo-diario",
  },
  {
    title: "Vendas",
    description: "Pipeline, contatos, atividades, metas e afiliados",
    icon: Target,
    color: "bg-warning/10 text-warning",
    borderColor: "hover:border-warning/40",
    route: "/vendas/pipeline",
  },
];

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
      dealsAbertosRes, dealsGanhosRes, dealsTotalRes,
    ] = await Promise.all([
      supabase.from("associados").select("id", { count: "exact", head: true }).eq("status", "ativo"),
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
      associadosAtivos: assocRes.count ?? 0,
      veiculos: veicRes.count ?? 0,
      eventosAbertos: sinRes.count ?? 0,
      recebidoHoje,
      negociacoesAtivas: dealsAbertosRes.count ?? 0,
      vendasMes: ganhosMes,
      inadimplencia,
      conversao,
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel Principal</h1>
        <p className="text-muted-foreground text-sm">Selecione um módulo para começar</p>
      </div>

      {/* 3 Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map((mod) => (
          <Card
            key={mod.title}
            className={`border-2 border-border/50 ${mod.borderColor} transition-all duration-200 cursor-pointer group hover:shadow-lg`}
            onClick={() => navigate(mod.route)}
          >
            <CardContent className="flex flex-col items-center justify-center text-center p-8 gap-5">
              <div className={`w-16 h-16 rounded-2xl ${mod.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                <mod.icon className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold tracking-tight">{mod.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{mod.description}</p>
              </div>
              <Button variant="outline" size="sm" className="mt-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Acessar <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dashboard Geral */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Visão Geral</h2>
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
          <StatCard title="Taxa de Conversão" value={`${stats.conversao}%`} icon={Target} />
        </div>
      </div>
    </div>
  );
}
