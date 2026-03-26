import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Car, FileText, CheckCircle, CalendarCheck, Users, AlertTriangle, Loader2, BarChart3 } from "lucide-react";
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


type InadimplenteRow = {
  id: string;
  vencimento: string;
  valor: number;
  contratos?: {
    associado_id: string;
    associados?: {
      id: string;
      nome: string;
      revistoria_status?: string;
    } | null;
  } | null;
};

function diasAtraso(vencimento: string) {
  const v = new Date(vencimento + "T12:00:00");
  return Math.floor((Date.now() - v.getTime()) / 86400000);
}

export default function DashboardTab() {
  const [modalOpen, setModalOpen] = useState(false);

  // Inadimplência +5 dias — associados SÓ saem quando revistoria_status = "realizada"
  const { data: inadimplentes = [], isLoading: loadingInad } = useQuery({
    queryKey: ["inadimplentes"],
    queryFn: async () => {
      const corte = subDays(new Date(), 5).toISOString().split("T")[0];
      const { data, error } = await (supabase as any)
        .from("mensalidades")
        .select("*, contratos(associado_id, associados(id, nome, revistoria_status))")
        .eq("status", "em_aberto")
        .lt("vencimento", corte);
      if (error) throw error;
      return (data || []) as InadimplenteRow[];
    },
  });

  // Group by associado — só mostra quem NÃO tem revistoria_status = "realizada"
  const porAssociado = Object.values(
    inadimplentes.reduce<Record<string, { nome: string; associado_id: string; boletos: InadimplenteRow[]; revistoria_status: string }>>((acc, m) => {
      const assId = m.contratos?.associado_id ?? "unknown";
      const assNome = m.contratos?.associados?.nome ?? "—";
      const revStatus = m.contratos?.associados?.revistoria_status ?? "pendente";
      if (!acc[assId]) acc[assId] = { nome: assNome, associado_id: assId, boletos: [], revistoria_status: revStatus };
      acc[assId].boletos.push(m);
      return acc;
    }, {})
  ).filter(a => a.revistoria_status !== "realizada");

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
      const { data, error } = await (supabase
        .from("mensalidades").select("valor").eq("status", "pago")
        .gte("data_pagamento", mesInicio).lt("data_pagamento", proximoMes) as any);
      if (error) throw error;
      return (data || []).reduce((s: number, m: { valor: number }) => s + (m.valor ?? 0), 0);
    },
  });

  const { data: sinistrosPend = 0, isLoading: loadingSinistros } = useQuery({
    queryKey: ["kpi_sinistros_pendentes"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("sinistros").select("id", { count: "exact", head: true }).in("status", ["aberto", "em_analise"]);
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
        .from("vistorias").select("id", { count: "exact", head: true }).eq("status", "pendente");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: boletosMes = { gerados: 0, recebidos: 0 } } = useQuery({
    queryKey: ["kpi_boletos_mes", mesAtual],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("mensalidades").select("status").gte("created_at", mesAtual + "-01T00:00:00Z") as any);
      if (error) throw error;
      const rows = (data || []) as { status: string }[];
      return { gerados: rows.length, recebidos: rows.filter(r => r.status === "pago").length };
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
        className="shadow-none border-red-200 bg-red-50/40 cursor-pointer hover:bg-red-50/70 transition-colors"
        onClick={() => setModalOpen(true)}
      >
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-red-700">
                {loadingInad ? <Loader2 className="w-5 h-5 animate-spin inline" /> : porAssociado.length}
              </p>
              <p className="text-[10px] font-medium text-red-500 uppercase tracking-wider">
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
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Inadimplência +5 dias / Pendentes de Revistoria
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mb-3">
            Associados saem desta lista somente quando <strong>revistoria_status = "realizada"</strong>.
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
                  <TableHead>Status Revistoria</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porAssociado.map(a => {
                  const maxDias = Math.max(...a.boletos.map(b => diasAtraso(b.vencimento)));
                  return (
                    <TableRow key={a.associado_id}>
                      <TableCell className="font-medium text-sm">{a.nome}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                          {a.boletos.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm font-mono">{maxDias} dias</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={a.revistoria_status === "realizada" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"}>
                          {a.revistoria_status === "realizada" ? "✅ Realizada" : "⏳ Pendente"}
                        </Badge>
                      </TableCell>
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
