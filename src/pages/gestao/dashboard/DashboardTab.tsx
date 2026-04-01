import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { subDays, startOfWeek, startOfMonth, endOfMonth, getWeek, getDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Car, FileText, CheckCircle, CalendarCheck, Users, AlertTriangle, Loader2, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, AreaChart, Area } from "recharts";

// recebimentoDiarioData is now fetched from Supabase inside the component

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <div className="w-1 h-4 bg-primary rounded-full" />
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}


type InadimplenteRow = {
  id: string;
  vencimento: string;
  valor: number;
  contratos?: {
    associado_id: string;
    associados?: {
      id: string;
      nome: string;
      status?: string;
    } | null;
  } | null;
};

function diasAtraso(vencimento: string) {
  const v = new Date(vencimento + "T12:00:00");
  return Math.floor((Date.now() - v.getTime()) / 86400000);
}

export default function DashboardTab() {
  const [modalOpen, setModalOpen] = useState(false);

  // Inadimplência +5 dias — associados com mensalidades em aberto há mais de 5 dias
  const { data: inadimplentes = [], isLoading: loadingInad } = useQuery({
    queryKey: ["inadimplentes"],
    queryFn: async () => {
      const corte = subDays(new Date(), 5).toISOString().split("T")[0];
      const { data, error } = await (supabase as any)
        .from("mensalidades")
        .select("*, contratos(associado_id, associados(id, nome, status))")
        .eq("status", "em_aberto")
        .lt("vencimento", corte);
      if (error) throw error;
      return (data || []) as InadimplenteRow[];
    },
  });

  // Group by associado — mostra todos os inadimplentes com +5 dias
  const porAssociado = Object.values(
    inadimplentes.reduce<Record<string, { nome: string; associado_id: string; boletos: InadimplenteRow[] }>>((acc, m) => {
      const assId = m.contratos?.associado_id ?? "unknown";
      const assNome = m.contratos?.associados?.nome ?? "—";
      if (!acc[assId]) acc[assId] = { nome: assNome, associado_id: assId, boletos: [] };
      acc[assId].boletos.push(m);
      return acc;
    }, {})
  );

  // ── Real KPIs ──
  const mesAtual = new Date().toISOString().slice(0, 7);

  const { data: totalAtivos = 0, isLoading: loadingAtivos } = useQuery({
    queryKey: ["kpi_associados_ativos"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("associados").select("id", { count: "exact", head: true }).eq("status", "ativo");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: totalInadimpl = 0, isLoading: loadingInadimpl } = useQuery({
    queryKey: ["kpi_inadimpl_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("associados").select("id", { count: "exact", head: true }).in("status", ["inativo", "inativo_pendencia"]);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: receitaMes = 0, isLoading: loadingReceita } = useQuery({
    queryKey: ["kpi_receita_mes", mesAtual],
    queryFn: async () => {
      const mesInicio = mesAtual + "-01";
      const proximoMes = mesAtual.slice(0, 4) + "-" + String(Number(mesAtual.slice(5, 7)) % 12 + 1).padStart(2, "0") + "-01";
      const { data, error } = await (supabase as any)
        .from("boletos").select("valor").eq("status", "baixado")
        .gte("data_pagamento", mesInicio).lt("data_pagamento", proximoMes);
      if (error) throw error;
      return (data || []).reduce((s: number, m: { valor: number }) => s + (m.valor ?? 0), 0);
    },
  });

  const { data: sinistrosPend = 0, isLoading: loadingSinistros } = useQuery({
    queryKey: ["kpi_sinistros_pendentes"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("eventos").select("id", { count: "exact", head: true }).in("status", ["aberto", "em_andamento"]);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: totalVeiculos = 0 } = useQuery({
    queryKey: ["kpi_veiculos_total"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("veiculos").select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: vistoriasPend = 0, isLoading: loadingVistoria } = useQuery({
    queryKey: ["kpi_vistorias_pendentes"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("revistoria_pendencias").select("id", { count: "exact", head: true }).eq("status", "pendente");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: boletosMes = { gerados: 0, recebidos: 0 } } = useQuery({
    queryKey: ["kpi_boletos_mes", mesAtual],
    queryFn: async () => {
      const mesInicio = mesAtual + "-01";
      const proximoMes = mesAtual.slice(0, 4) + "-" + String(Number(mesAtual.slice(5, 7)) % 12 + 1).padStart(2, "0") + "-01";
      // Boletos gerados: count of boletos created in current month
      const { count: gerados, error: errGerados } = await (supabase as any)
        .from("boletos").select("id", { count: "exact", head: true })
        .gte("created_at", mesInicio + "T00:00:00Z").lt("created_at", proximoMes + "T00:00:00Z");
      if (errGerados) throw errGerados;
      // Boletos recebidos: count of boletos with status=baixado and data_pagamento in current month
      const { count: recebidos, error: errRecebidos } = await (supabase as any)
        .from("boletos").select("id", { count: "exact", head: true })
        .eq("status", "baixado")
        .gte("data_pagamento", mesInicio).lt("data_pagamento", proximoMes);
      if (errRecebidos) throw errRecebidos;
      return { gerados: gerados ?? 0, recebidos: recebidos ?? 0 };
    },
  });

  // ── Recebimentos de hoje agrupados por hora ──
  const hojeStr = new Date().toISOString().split("T")[0];

  const { data: recebimentoDiarioData = [] } = useQuery({
    queryKey: ["chart_recebimentos_hoje", hojeStr],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("boletos")
        .select("valor, data_pagamento")
        .eq("status", "baixado")
        .gte("data_pagamento", hojeStr + "T00:00:00")
        .lt("data_pagamento", hojeStr + "T23:59:59");
      if (error) throw error;
      const rows = (data || []) as { valor: number; data_pagamento: string }[];
      const porHora: Record<number, number> = {};
      rows.forEach(r => {
        const h = new Date(r.data_pagamento).getHours();
        porHora[h] = (porHora[h] || 0) + (r.valor ?? 0);
      });
      // Return hours 7-18 (business hours)
      return Array.from({ length: 12 }, (_, i) => i + 7).map(h => ({
        hora: `${String(h).padStart(2, "0")}h`,
        valor: porHora[h] || 0,
      }));
    },
  });

  // ── Boletos do mês agrupados por semana ──
  const now = new Date();
  const mesInicio = startOfMonth(now);
  const mesFim = endOfMonth(now);

  const { data: boletosDoMesData = [] } = useQuery({
    queryKey: ["chart_boletos_semana", mesAtual],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("boletos")
        .select("status, created_at")
        .gte("created_at", mesInicio.toISOString())
        .lte("created_at", mesFim.toISOString());
      if (error) throw error;
      const rows = (data || []) as { status: string; created_at: string }[];
      const weeks: Record<number, { gerados: number; recebidos: number }> = {};
      rows.forEach(r => {
        const d = new Date(r.created_at);
        const weekNum = Math.ceil(d.getDate() / 7);
        if (!weeks[weekNum]) weeks[weekNum] = { gerados: 0, recebidos: 0 };
        weeks[weekNum].gerados += 1;
        if (r.status === "baixado") weeks[weekNum].recebidos += 1;
      });
      return [1, 2, 3, 4, 5].filter(w => weeks[w]).map(w => ({
        semana: `Sem ${w}`,
        gerados: weeks[w].gerados,
        recebidos: weeks[w].recebidos,
      }));
    },
  });

  // ── Veículos cadastrados na semana agrupados por dia ──
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const { data: veiculosDiaData = [] } = useQuery({
    queryKey: ["chart_veiculos_dia", weekStart.toISOString()],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("veiculos")
        .select("created_at")
        .gte("created_at", weekStart.toISOString()) as any);
      if (error) throw error;
      const rows = (data || []) as { created_at: string }[];
      const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 };
      rows.forEach(r => {
        const dayIdx = getDay(new Date(r.created_at));
        counts[dayIdx] = (counts[dayIdx] || 0) + 1;
      });
      // Return Mon-Sun order
      return [1, 2, 3, 4, 5, 6, 0].map(d => ({
        dia: diasSemana[d],
        cadastrados: counts[d] || 0,
      }));
    },
  });

  const fechamentoData = [
    { name: "Ativos", value: totalAtivos, color: "hsl(var(--primary))" },
    { name: "Inativos", value: totalInadimpl, color: "hsl(var(--muted-foreground))" },
  ];
  const totalFechamento = totalAtivos + totalInadimpl;
  const pctParticipantes = totalFechamento > 0 ? ((totalAtivos / totalFechamento) * 100).toFixed(1) : "0.0";

  function KpiCard({ title, value, icon: Icon, loading, format = "number" }: {
    title: string; value: number; icon: React.ElementType; loading?: boolean; format?: "number" | "currency";
  }) {
    const disp = format === "currency"
      ? "R$ " + value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
      : value.toLocaleString("pt-BR");
    return (
      <Card className="shadow-none">
        <CardContent className="p-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
          {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
            <p className="text-xl font-bold tracking-tight leading-tight">{disp}</p>
          )}
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1 leading-tight">{title}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 min-h-full">
      {/* ═══ INADIMPLÊNCIA ═══ */}
      <SectionDivider title="Inadimplência & Revistoria" />
      <Card
        className="shadow-none border-red-200 bg-destructive/40 cursor-pointer hover:bg-destructive/70 transition-colors"
        onClick={() => setModalOpen(true)}
      >
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/8 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-xl font-bold text-destructive">
                {loadingInad ? <Loader2 className="w-5 h-5 animate-spin inline" /> : porAssociado.length}
              </p>
              <p className="text-[10px] font-medium text-destructive uppercase tracking-wider">
                Inadimplência +5 dias / Pendentes de Revistoria
              </p>
            </div>
          </div>
          <span className="text-xs text-red-400">Clique para ver lista →</span>
        </CardContent>
      </Card>

      {/* Modal inadimplentes */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Inadimplência +5 dias / Pendentes de Revistoria
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mb-3">
            Associados com mensalidades em aberto há mais de 5 dias.
          </p>
          {loadingInad ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : porAssociado.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">Nenhum associado inadimplente +5 dias encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-center">Boletos Abertos</TableHead>
                  <TableHead className="text-center">Dias Atraso (máx)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porAssociado.map(a => {
                  const maxDias = Math.max(...a.boletos.map(b => diasAtraso(b.vencimento)));
                  return (
                    <TableRow key={a.associado_id}>
                      <TableCell className="font-medium text-sm">{a.nome}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-destructive/8 text-destructive border-red-200">
                          {a.boletos.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm font-mono">{maxDias} dias</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ CADASTRO & VEÍCULOS ═══ */}
      <SectionDivider title="Cadastro & Veículos" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard title="Associados Ativos" value={totalAtivos} icon={Users} loading={loadingAtivos} />
        <KpiCard title="Inadimplentes / Inativos" value={totalInadimpl} icon={AlertTriangle} loading={loadingInadimpl} />
        <KpiCard title="Vistorias Pendentes" value={vistoriasPend} icon={CalendarCheck} loading={loadingVistoria} />
        <KpiCard title="Veículos Cadastrados" value={totalVeiculos} icon={Car} />
        <KpiCard title="Sinistros em Aberto" value={sinistrosPend} icon={BarChart3} loading={loadingSinistros} />
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
              <CardTitle className="text-sm font-semibold">Ativos vs Inativos</CardTitle>
              <span className="text-xs text-muted-foreground">{pctParticipantes}% ativos</span>
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
                <span className="text-xs text-muted-foreground">Ativos ({totalAtivos.toLocaleString("pt-BR")})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                <span className="text-xs text-muted-foreground">Inativos ({totalInadimpl})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ FINANCEIRO ═══ */}
      <SectionDivider title="Financeiro" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiCard title="Receita do Mês" value={receitaMes} icon={CheckCircle} loading={loadingReceita} format="currency" />
        <KpiCard title="Boletos Gerados no Mês" value={boletosMes.gerados} icon={FileText} />
        <KpiCard title="Boletos Recebidos no Mês" value={boletosMes.recebidos} icon={CalendarCheck} />
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
