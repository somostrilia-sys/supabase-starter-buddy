import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useUsuario } from "@/hooks/useUsuario";
import {
  Users, FileText, Handshake, DollarSign, TrendingUp, Trophy, ArrowRightLeft,
  BarChart3, Target,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid, Legend,
} from "recharts";

const PIE_COLORS = ["hsl(212,50%,35%)", "hsl(142,50%,40%)", "hsl(38,90%,50%)", "hsl(0,65%,50%)", "hsl(262,50%,50%)", "hsl(180,50%,40%)", "hsl(320,50%,50%)"];
const FUNNEL_COLORS = ["hsl(212,50%,50%)", "hsl(212,50%,60%)", "hsl(38,90%,50%)", "hsl(142,50%,50%)", "hsl(142,50%,35%)"];
const formatCurrency = (v: number) => `R$ ${(v / 1000).toFixed(0)}k`;

function getDateRange(periodo: string, dataInicio: string, dataFim: string) {
  if (dataInicio && dataFim) return { start: dataInicio, end: dataFim };
  const now = new Date();
  const end = now.toISOString();
  let start: Date;
  switch (periodo) {
    case "semana": start = new Date(now.getTime() - 7 * 86400000); break;
    case "30d": start = new Date(now.getTime() - 30 * 86400000); break;
    case "trimestre": start = new Date(now.getFullYear(), now.getMonth() - 3, 1); break;
    case "ano": start = new Date(now.getFullYear(), 0, 1); break;
    case "todos": start = new Date(2020, 0, 1); break;
    default: start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { start: start.toISOString(), end };
}

export default function DashboardVendas() {
  const { usuario: _u, isConsultor: _iC, isGestor: _iG, canViewAllData: _cA, cooperativas: _mC, loading: _uLoading } = useUsuario();
  const [periodo, setPeriodo] = useState("30d");
  const [consultor, setConsultor] = useState("Todos");
  const [cooperativa, setCooperativa] = useState("Todas");
  const [scopeApplied, setScopeApplied] = useState(false);

  // Apply scope once usuario loads — consultor/gestor não pode alterar para fora do escopo
  if (!scopeApplied && !_uLoading && _u) {
    if (_iC && _u.nome) { setConsultor(_u.nome); setScopeApplied(true); }
    else if (_iG && !_cA && _mC.length > 0) { setCooperativa(_mC[0]); setScopeApplied(true); }
    else { setScopeApplied(true); }
  }
  // Enforce scope — impedir consultor/gestor de trocar filtro fora do escopo
  const canChangeConsultor = !_iC;
  const canChangeCooperativa = !_iG || _cA;
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const range = getDateRange(periodo, dataInicio, dataFim);

  // Comissao por consultor (campo comissao_pct da tabela usuarios)
  const { data: usuariosComissao } = useQuery({
    queryKey: ["dash_usuarios_comissao"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("usuarios").select("nome, comissao_pct").eq("status", "ativo");
      return (data || []) as { nome: string; comissao_pct: number | null }[];
    },
  });

  // Cooperativas reais
  const { data: coopsDb } = useQuery({
    queryKey: ["dash_coops"],
    queryFn: async () => {
      const { data } = await supabase.from("cooperativas" as any).select("nome").eq("ativa", true).order("nome");
      return ["Todas", ...(data || []).map((c: any) => c.nome)];
    },
  });

  // Consultores reais
  const { data: consultoresDb } = useQuery({
    queryKey: ["dash_consultores"],
    queryFn: async () => {
      const { data } = await supabase.from("usuarios").select("nome").eq("status", "ativo").order("nome");
      return ["Todos", ...(data || []).map((u: any) => u.nome)];
    },
  });

  // Negociacoes com filtros (paginado pra superar limite 1000)
  // FIX: PostgREST needs both created_at filters via separate appends.
  // The old code used the constructor object (which calls .set()) for the first filter,
  // then .append() for the second. URLSearchParams constructor with an object only keeps
  // the last value for duplicate keys. We now use .append() for both date filters.
  const { data: negsData, isLoading: negsLoading } = useQuery({
    queryKey: ["dash_negs", range.start, range.end, consultor, cooperativa],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const url = import.meta.env.VITE_SUPABASE_URL;
      const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      let allData: any[] = [];
      for (let page = 0; page < 5; page++) {
        const params = new URLSearchParams();
        params.set("select", "stage,consultor,cooperativa,valor_plano,origem,created_at");
        params.set("order", "created_at.desc");
        params.set("offset", String(page * 1000));
        params.set("limit", "1000");
        // PostgREST supports multiple same-name params for AND range filters
        params.append("created_at", `gte.${range.start}`);
        params.append("created_at", `lte.${range.end}`);
        if (consultor !== "Todos") params.set("consultor", `eq.${consultor}`);
        if (cooperativa !== "Todas") params.set("cooperativa", `ilike.%${cooperativa}%`);
        const resp = await fetch(`${url}/rest/v1/negociacoes?${params.toString()}`, {
          headers: { apikey, Authorization: `Bearer ${token || apikey}` },
        });
        const data = await resp.json();
        if (!Array.isArray(data) || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < 1000) break;
      }
      return allData;
    },
  });

  const negs = negsData || [];
  const totalLeads = negs.length;
  const propostas = negs.filter(n => n.stage !== "novo_lead").length;
  const contratos = negs.filter(n => n.stage === "concluido").length;
  const faturamento = negs.reduce((s: number, n: any) => s + (Number(n.valor_plano) || 0), 0);
  const conversao = totalLeads > 0 ? ((contratos / totalLeads) * 100).toFixed(1) : "0";
  // Calcula comissoes usando comissao_pct real de cada consultor (fallback 10%)
  const comissoes = (() => {
    const pctMap: Record<string, number> = {};
    (usuariosComissao || []).forEach((u) => { pctMap[u.nome] = Number(u.comissao_pct) || 10; });
    return negs.reduce((acc: number, n: any) => {
      const pct = pctMap[n.consultor] ?? 10;
      return acc + (Number(n.valor_plano) || 0) * (pct / 100);
    }, 0);
  })();

  // Funil
  const funilData = [
    { etapa: "Novo Lead", valor: negs.filter(n => n.stage === "novo_lead").length },
    { etapa: "Em Contato", valor: negs.filter(n => n.stage === "em_contato").length },
    { etapa: "Negociacao", valor: negs.filter(n => n.stage === "em_negociacao").length },
    { etapa: "Vistoria", valor: negs.filter(n => n.stage === "aguardando_vistoria").length },
    { etapa: "Concluido", valor: contratos },
  ];

  // Evolucao mensal (ultimos 12 meses)
  const evolucaoMensal = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    const mes = d.toLocaleString("pt-BR", { month: "short" }).replace(".", "");
    const mesNum = d.getMonth();
    const anoNum = d.getFullYear();
    const mesNegs = negsData?.filter((n: any) => {
      const nd = new Date(n.created_at);
      return nd.getMonth() === mesNum && nd.getFullYear() === anoNum;
    }) || [];
    return {
      mes: mes.charAt(0).toUpperCase() + mes.slice(1),
      vendas: mesNegs.filter((n: any) => n.stage === "concluido").length,
      faturamento: mesNegs.reduce((s: number, n: any) => s + (Number(n.valor_plano) || 0), 0),
    };
  });

  // Ranking consultores
  const rankingMap: Record<string, { contratos: number; faturamento: number; total: number }> = {};
  negs.forEach((n: any) => {
    const c = n.consultor || "Sem consultor";
    if (!rankingMap[c]) rankingMap[c] = { contratos: 0, faturamento: 0, total: 0 };
    rankingMap[c].total++;
    if (n.stage === "concluido") rankingMap[c].contratos++;
    rankingMap[c].faturamento += Number(n.valor_plano) || 0;
  });
  const ranking = Object.entries(rankingMap)
    .map(([nome, d]) => ({
      nome,
      ...d,
      avatar: nome.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
    }))
    .sort((a, b) => b.contratos - a.contratos || b.faturamento - a.faturamento)
    .slice(0, 10);

  // Distribuicao por cooperativa
  const coopMap: Record<string, number> = {};
  negs.forEach((n: any) => {
    const c = n.cooperativa || "Sem cooperativa";
    coopMap[c] = (coopMap[c] || 0) + 1;
  });
  const distribuicao = Object.entries(coopMap)
    .map(([name, value]) => ({ name: name.replace(/FILIAL |Filial /gi, ""), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-[#1A3A5C] p-5 border border-[#747474]">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Dashboard de Vendas</h1>
            <p className="text-xs text-slate-400">Visao geral do desempenho comercial</p>
          </div>
          {negsLoading && (
            <Badge className="ml-auto bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px]">
              Carregando...
            </Badge>
          )}
          {!negsLoading && totalLeads > 0 && (
            <Badge className="ml-auto bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
              {totalLeads} negociacoes
            </Badge>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div>
          <Label className="text-xs font-semibold">Periodo</Label>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="30d">Ultimos 30 dias</SelectItem>
              <SelectItem value="mes">Este Mes</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="ano">Este Ano</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Consultor</Label>
          <Select value={consultor} onValueChange={setConsultor} disabled={!canChangeConsultor}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(consultoresDb || ["Todos"]).map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Cooperativa</Label>
          <Select value={cooperativa} onValueChange={setCooperativa} disabled={!canChangeCooperativa}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(coopsDb || ["Todas"]).map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Data Inicio</Label>
          <Input type="date" className="w-full" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs font-semibold">Data Fim</Label>
          <Input type="date" className="w-full" value={dataFim} onChange={e => setDataFim(e.target.value)} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {
            label: "Total Leads",
            value: totalLeads.toString(),
            icon: Users,
            iconColor: "text-blue-400",
            bgIcon: "bg-blue-500/15",
            borderColor: "border-blue-500/25",
            bgCard: "bg-blue-500/5",
          },
          {
            label: "Propostas Enviadas",
            value: propostas.toString(),
            icon: FileText,
            iconColor: "text-amber-400",
            bgIcon: "bg-amber-500/15",
            borderColor: "border-amber-500/25",
            bgCard: "bg-amber-500/5",
          },
          {
            label: "Contratos Fechados",
            value: contratos.toString(),
            icon: Handshake,
            iconColor: "text-emerald-400",
            bgIcon: "bg-emerald-500/15",
            borderColor: "border-emerald-500/25",
            bgCard: "bg-emerald-500/5",
          },
          {
            label: "Faturamento Total",
            value: `R$ ${faturamento.toLocaleString("pt-BR")}`,
            icon: DollarSign,
            iconColor: "text-slate-300",
            bgIcon: "bg-slate-500/15",
            borderColor: "border-[#747474]",
            bgCard: "",
          },
          {
            label: "Taxa de Conversao",
            value: `${conversao}%`,
            icon: TrendingUp,
            iconColor: "text-emerald-400",
            bgIcon: "bg-emerald-500/15",
            borderColor: "border-emerald-500/25",
            bgCard: "bg-emerald-500/5",
          },
          {
            label: "Comissoes Estimadas",
            value: `R$ ${comissoes.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`,
            icon: Target,
            iconColor: "text-violet-400",
            bgIcon: "bg-violet-500/15",
            borderColor: "border-violet-500/25",
            bgCard: "bg-violet-500/5",
          },
        ].map(c => (
          <Card key={c.label} className={`${c.borderColor} ${c.bgCard}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${c.bgIcon} flex items-center justify-center`}>
                  <c.icon className={`h-5 w-5 ${c.iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funil + Evolucao */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-[#747474]">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-400" />
              Funil de Vendas
            </h3>
            {totalLeads === 0 && !negsLoading ? (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
                Sem dados no periodo selecionado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={funilData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(0,0%,25%)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(0,0%,60%)" }} />
                  <YAxis type="category" dataKey="etapa" tick={{ fontSize: 12, fill: "hsl(0,0%,70%)" }} width={75} />
                  <Tooltip
                    formatter={(v: number) => [v, "Negociacoes"]}
                    contentStyle={{ backgroundColor: "hsl(210,30%,15%)", border: "1px solid hsl(0,0%,30%)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "hsl(0,0%,80%)" }}
                  />
                  <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                    {funilData.map((_, i) => <Cell key={i} fill={FUNNEL_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#747474]">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Evolucao Mensal (12 meses)
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,25%)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(0,0%,60%)" }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "hsl(0,0%,60%)" }} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={formatCurrency} tick={{ fontSize: 10, fill: "hsl(0,0%,60%)" }} />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    name === "faturamento" ? `R$ ${v.toLocaleString("pt-BR")}` : v,
                    name === "faturamento" ? "Faturamento" : "Vendas",
                  ]}
                  contentStyle={{ backgroundColor: "hsl(210,30%,15%)", border: "1px solid hsl(0,0%,30%)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "hsl(0,0%,80%)" }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="left" type="monotone" dataKey="vendas" stroke="hsl(212,50%,55%)" strokeWidth={2} dot={{ r: 3 }} name="Vendas" />
                <Line yAxisId="right" type="monotone" dataKey="faturamento" stroke="hsl(142,50%,50%)" strokeWidth={2} dot={{ r: 3 }} name="Faturamento" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ranking + Pizza */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 overflow-hidden border-[#747474]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-amber-400" />
              <h3 className="font-semibold text-sm">Ranking de Consultores</h3>
              {ranking.length > 0 && (
                <Badge variant="outline" className="ml-auto text-[10px] border-[#747474]">
                  Top {ranking.length}
                </Badge>
              )}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#747474]">
                    <TableHead className="text-xs font-bold uppercase w-8">#</TableHead>
                    <TableHead className="text-xs font-bold uppercase">Consultor</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-center">Leads</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-center">Contratos</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-right">Faturamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhuma negociacao no periodo
                      </TableCell>
                    </TableRow>
                  ) : ranking.map((c, i) => (
                    <TableRow key={c.nome} className="border-[#747474]/30">
                      <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] bg-blue-500/10 text-blue-400">
                              {c.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{c.nome}</span>
                          {i === 0 && c.contratos > 0 && (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px] px-1.5 py-0">
                              TOP
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{c.total}</TableCell>
                      <TableCell className="text-center font-semibold">{c.contratos}</TableCell>
                      <TableCell className="text-right">R$ {c.faturamento.toLocaleString("pt-BR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#747474]">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-violet-400" />
              Distribuicao por Cooperativa
            </h3>
            {distribuicao.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={distribuicao}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    fontSize={10}
                  >
                    {distribuicao.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [`${v} negociacoes`, "Total"]}
                    contentStyle={{ backgroundColor: "hsl(210,30%,15%)", border: "1px solid hsl(0,0%,30%)", borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                Sem dados no periodo
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
