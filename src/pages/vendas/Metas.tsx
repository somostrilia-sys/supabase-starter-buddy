import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Target, TrendingUp, AlertCircle, Plus, Percent, Trophy, Loader2, Medal, Settings2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUsuario } from "@/hooks/useUsuario";
import { toast } from "sonner";

const META_CONTRATOS_DEFAULT = 20;
const META_FATURAMENTO_DEFAULT = 30000;
const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function getLastNMonths(n: number) {
  const now = new Date();
  const months: { year: number; month: number; label: string; key: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTH_LABELS[d.getMonth()], key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` });
  }
  return months;
}

function getPeriodOptions() {
  const now = new Date();
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({ value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}` });
  }
  return options;
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const medalColors = ["text-yellow-400", "text-slate-300", "text-amber-600"];
const medalBg = ["bg-yellow-400/20 border-yellow-400/40", "bg-slate-300/20 border-slate-300/40", "bg-amber-600/20 border-amber-600/40"];

async function fetchConsultoresData(periodoKey: string) {
  const [yearStr, monthStr] = periodoKey.split("-");
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  const startOfMonth = new Date(year, month - 1, 1).toISOString();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  const { data: usuarios } = await (supabase as any)
    .from("usuarios")
    .select("id, nome, cooperativa, contexto_ia")
    .eq("ativo", true);

  if (!usuarios || usuarios.length === 0) return { consultores: [], cooperativas: [] };

  // Get metas_config for this month
  const { data: metasConfig } = await (supabase as any)
    .from("metas_config")
    .select("*")
    .eq("mes_referencia", periodoKey);

  const configs = metasConfig || [];
  const metaGeral = configs.find((m: any) => m.tipo === "geral");

  const nomes: string[] = usuarios.map((u: any) => u.nome);

  const { data: negocios } = await (supabase as any)
    .from("negociacoes")
    .select("consultor, valor_plano, stage, created_at, cooperativa")
    .in("consultor", nomes)
    .gte("created_at", startOfMonth)
    .lte("created_at", endOfMonth);

  const rows: any[] = negocios || [];

  // Extract unique cooperativas
  const allCoops = new Set<string>();
  usuarios.forEach((u: any) => {
    if (u.cooperativa) u.cooperativa.split(",").forEach((c: string) => { if (c.trim()) allCoops.add(c.trim()); });
  });
  rows.forEach((r: any) => { if (r.cooperativa) allCoops.add(r.cooperativa); });

  const consultores = usuarios.map((u: any) => {
    const mine = rows.filter((r: any) => r.consultor === u.nome);
    const concluidos = mine.filter((r: any) => r.stage === "concluido");
    const atualContratos = concluidos.length;
    const atualFaturamento = concluidos.reduce((s: number, r: any) => s + (Number(r.valor_plano) || 0), 0);
    const totalLeads = mine.length;
    const conversao = totalLeads > 0 ? (atualContratos / totalLeads) * 100 : 0;

    // Resolve meta individual: individual > geral > default
    // (cooperativa meta is collective for the branch, not per-consultant)
    const metaIndividual = configs.find((m: any) => m.tipo === "individual" && m.usuario_id === u.id);
    const meta = metaIndividual || metaGeral;

    return {
      id: u.id,
      nome: u.nome,
      cooperativa: u.cooperativa || "",
      contexto_ia: u.contexto_ia,
      metaContratos: meta ? Number(meta.meta_contratos) : META_CONTRATOS_DEFAULT,
      atualContratos,
      metaFaturamento: meta ? Number(meta.meta_faturamento) : META_FATURAMENTO_DEFAULT,
      atualFaturamento,
      conversao: Math.round(conversao * 10) / 10,
      totalLeads,
      ranking: 0,
    };
  });

  consultores.sort((a, b) => b.atualContratos - a.atualContratos || b.atualFaturamento - a.atualFaturamento);
  consultores.forEach((c, i) => (c.ranking = i + 1));

  return { consultores, cooperativas: Array.from(allCoops).sort() };
}

async function fetchEvolucao() {
  const months = getLastNMonths(6);
  const startDate = new Date(months[0].year, months[0].month, 1).toISOString();
  const endMonth = months[months.length - 1];
  const endDate = new Date(endMonth.year, endMonth.month + 1, 0, 23, 59, 59, 999).toISOString();

  const { data: negocios } = await (supabase as any)
    .from("negociacoes")
    .select("consultor, valor_plano, stage, created_at")
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  const rows: any[] = negocios || [];

  return months.map((m) => {
    const inMonth = rows.filter((r: any) => {
      const d = new Date(r.created_at);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    });
    const concluidos = inMonth.filter((r: any) => r.stage === "concluido");
    const faturamento = concluidos.reduce((s: number, r: any) => s + (Number(r.valor_plano) || 0), 0);
    return { mes: m.label, realizado: concluidos.length, faturamento };
  });
}

function PodiumCard({ title, top3, accentFrom, accentTo }: { title: string; top3: any[]; accentFrom: string; accentTo: string }) {
  if (top3.length < 3) return null;
  const sizes = [
    { w: "w-[72px] h-[72px]", text: "text-lg", pedW: "w-28", pedPt: "pt-4 pb-3", mt: "", numW: "w-7 h-7", numText: "text-[11px]" },
    { w: "w-24 h-24", text: "text-2xl", pedW: "w-32", pedPt: "pt-5 pb-4", mt: "-mt-4", numW: "w-9 h-9", numText: "text-sm" },
    { w: "w-16 h-16", text: "text-base", pedW: "w-24", pedPt: "pt-3 pb-2.5", mt: "mt-2", numW: "w-6 h-6", numText: "text-[10px]" },
  ];
  const colors = [
    { border: "border-slate-300/40", bg: "from-slate-300/30 to-slate-400/10", numBg: "from-slate-200 to-slate-400", numColor: "text-slate-800", textColor: "text-slate-300", pedBg: "from-slate-500/20 to-slate-400/5", pedBorder: "border-slate-400/20" },
    { border: `border-yellow-400/50`, bg: `${accentFrom}/40 ${accentTo}/20`, numBg: `${accentFrom} ${accentTo}`, numColor: "text-amber-900", textColor: "text-yellow-300", pedBg: "from-yellow-500/20 to-amber-400/5", pedBorder: "border-yellow-400/30" },
    { border: "border-amber-600/40", bg: "from-amber-600/30 to-amber-700/10", numBg: "from-amber-600 to-amber-800", numColor: "text-amber-200", textColor: "text-amber-500", pedBg: "from-amber-700/15 to-amber-600/5", pedBorder: "border-amber-600/20" },
  ];
  const order = [1, 0, 2]; // 2nd, 1st, 3rd

  return (
    <Card className="border-border overflow-hidden bg-gradient-to-br from-[#0F1729] via-[#1A2744] to-[#0F1729]">
      <CardContent className="p-5 pb-7">
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-full px-3 py-1">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">{title}</span>
          </div>
        </div>
        <div className="flex justify-center items-end gap-2 sm:gap-4">
          {order.map((idx) => {
            const c = top3[idx];
            const s = sizes[idx];
            const cl = colors[idx];
            return (
              <div key={c.nome} className={`flex flex-col items-center ${s.mt}`}>
                <div className="relative mb-2">
                  <div className={`${s.w} rounded-full bg-gradient-to-br ${cl.bg} border-2 ${cl.border} flex items-center justify-center shadow-lg`}>
                    <span className={`${s.text} font-bold ${cl.textColor}`}>{initials(c.nome)}</span>
                  </div>
                  <div className={`absolute -top-1 -right-1 ${s.numW} rounded-full bg-gradient-to-br ${cl.numBg} flex items-center justify-center shadow-md`}>
                    <span className={`${s.numText} font-black ${cl.numColor}`}>{idx + 1}</span>
                  </div>
                </div>
                <div className={`bg-gradient-to-t ${cl.pedBg} border ${cl.pedBorder} rounded-t-xl ${s.pedW} ${s.pedPt} px-1.5 text-center`}>
                  <p className="text-[11px] font-bold text-white truncate">{c.nome.split(" ").slice(0, 2).join(" ")}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{c.atualContratos} vendas</p>
                  <p className="text-[10px] font-bold text-emerald-400">R$ {c.atualFaturamento.toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Metas() {
  const queryClient = useQueryClient();
  const { usuario, isConsultor, isGestor, isDiretor, canConfigMetas, cooperativas: minhasCoops } = useUsuario();
  const [modalOpen, setModalOpen] = useState(false);
  const [filterCoop, setFilterCoop] = useState("all");
  const [visao, setVisao] = useState<"consultores" | "filiais">("consultores");
  const periodOptions = useMemo(() => getPeriodOptions(), []);
  const [periodo, setPeriodo] = useState(periodOptions[0]?.value || "");

  // Config meta form
  const [cfgTipo, setCfgTipo] = useState<"individual" | "cooperativa" | "geral">("individual");
  const [cfgUsuarioId, setCfgUsuarioId] = useState("");
  const [cfgCooperativa, setCfgCooperativa] = useState("");
  const [cfgContratos, setCfgContratos] = useState("20");
  const [cfgFaturamento, setCfgFaturamento] = useState("30000");

  const { data: result, isLoading: loadingConsultores } = useQuery({
    queryKey: ["metas-consultores", periodo],
    queryFn: () => fetchConsultoresData(periodo),
    enabled: !!periodo,
  });

  const consultores = result?.consultores || [];
  const todasCoops = result?.cooperativas || [];

  const { data: evolucao = [], isLoading: loadingEvolucao } = useQuery({
    queryKey: ["metas-evolucao"],
    queryFn: fetchEvolucao,
  });

  const saveMeta = useMutation({
    mutationFn: async () => {
      const payload: any = {
        mes_referencia: periodo,
        tipo: cfgTipo,
        meta_contratos: parseInt(cfgContratos) || META_CONTRATOS_DEFAULT,
        meta_faturamento: parseFloat(cfgFaturamento) || META_FATURAMENTO_DEFAULT,
        configurado_por: usuario?.id,
      };
      if (cfgTipo === "individual") payload.usuario_id = cfgUsuarioId || null;
      if (cfgTipo === "cooperativa") payload.cooperativa = cfgCooperativa || null;

      const { error } = await (supabase as any).from("metas_config").upsert(payload, { onConflict: "mes_referencia,tipo,usuario_id,cooperativa" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Meta salva!");
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["metas-consultores"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isLoading = loadingConsultores || loadingEvolucao;

  // Filter by cooperativa
  const filtered = useMemo(() => {
    let list = consultores;
    if (filterCoop !== "all") {
      list = list.filter((c: any) => c.cooperativa && c.cooperativa.includes(filterCoop));
    }
    // Gestor: by default filter to their coops
    if (isGestor && filterCoop === "all" && minhasCoops.length > 0) {
      // Show all by default, let them filter
    }
    return list;
  }, [consultores, filterCoop, isGestor, minhasCoops]);

  // Consultores that this user can configure metas for
  const configurableConsultores = useMemo(() => {
    if (isDiretor) return consultores;
    if (isGestor && minhasCoops.length > 0) {
      return consultores.filter((c: any) => minhasCoops.some(coop => c.cooperativa?.includes(coop)));
    }
    return [];
  }, [consultores, isDiretor, isGestor, minhasCoops]);

  const configurableCoops = useMemo(() => {
    if (isDiretor) return todasCoops;
    if (isGestor) return minhasCoops;
    return [];
  }, [todasCoops, isDiretor, isGestor, minhasCoops]);

  // Check if there's a collective branch meta for the selected cooperativa
  const metaColetiva = useMemo(() => {
    if (filterCoop === "all") return null;
    const configs = result?.consultores ? [] : [];
    // We need to fetch from the query — let's check metas_config directly
    return null; // Will be handled via separate query
  }, [filterCoop]);

  const { data: metaFilialData } = useQuery({
    queryKey: ["meta-filial", periodo, filterCoop],
    queryFn: async () => {
      if (filterCoop === "all") return null;
      const { data } = await (supabase as any).from("metas_config").select("*")
        .eq("mes_referencia", periodo).eq("tipo", "cooperativa").eq("cooperativa", filterCoop).maybeSingle();
      return data;
    },
    enabled: filterCoop !== "all",
  });

  const totalAtual = filtered.reduce((s: number, v: any) => s + v.atualContratos, 0);
  const totalFatAtual = filtered.reduce((s: number, v: any) => s + v.atualFaturamento, 0);

  // If filtering by cooperativa and there's a collective meta, use that; otherwise sum individual
  const totalMeta = metaFilialData ? Number(metaFilialData.meta_contratos) : filtered.reduce((s: number, v: any) => s + v.metaContratos, 0);
  const totalFatMeta = metaFilialData ? Number(metaFilialData.meta_faturamento) : filtered.reduce((s: number, v: any) => s + v.metaFaturamento, 0);
  const taxa = totalMeta > 0 ? (totalAtual / totalMeta) * 100 : 0;

  const kpiLabel = filterCoop !== "all" && metaFilialData ? `Meta Filial ${filterCoop}` : "Meta do Mes";
  const kpis = [
    { label: kpiLabel, value: `${totalMeta} contratos`, icon: Target, color: "text-primary", bg: "bg-primary/8" },
    { label: "Atingido", value: `${totalAtual} contratos`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Faltam", value: `${Math.max(totalMeta - totalAtual, 0)} contratos`, icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/8" },
    { label: "% Atingimento", value: `${taxa.toFixed(1)}%`, icon: Percent, color: "text-amber-400", bg: "bg-amber-500/10" },
  ];

  // Top 3 podiums — national + filial side by side
  const top3Nacional = consultores.slice(0, 3);
  const filialSorted = useMemo(() => {
    if (filterCoop === "all") return [];
    const sorted = [...filtered].sort((a: any, b: any) => b.atualContratos - a.atualContratos || b.atualFaturamento - a.atualFaturamento);
    sorted.forEach((c: any, i: number) => { c.rankingFilial = i + 1; });
    return sorted;
  }, [filtered, filterCoop]);
  const top3Filial = filialSorted.slice(0, 3);
  const showFilialRanking = filterCoop !== "all";

  // Ranking de FILIAIS (coletivo) — agrupa por cooperativa
  const rankingFiliais = useMemo(() => {
    const map: Record<string, { nome: string; atualContratos: number; atualFaturamento: number; totalLeads: number; consultores: number }> = {};
    consultores.forEach((c: any) => {
      const coops = c.cooperativa ? c.cooperativa.split(",").map((s: string) => s.trim()).filter(Boolean) : ["Sem filial"];
      coops.forEach((coop: string) => {
        if (!map[coop]) map[coop] = { nome: coop, atualContratos: 0, atualFaturamento: 0, totalLeads: 0, consultores: 0 };
        map[coop].atualContratos += c.atualContratos;
        map[coop].atualFaturamento += c.atualFaturamento;
        map[coop].totalLeads += c.totalLeads;
        map[coop].consultores += 1;
      });
    });
    const arr = Object.values(map).sort((a, b) => b.atualContratos - a.atualContratos || b.atualFaturamento - a.atualFaturamento);
    arr.forEach((f, i) => { (f as any).ranking = i + 1; });
    return arr as (typeof map[string] & { ranking: number })[];
  }, [consultores]);
  const top3Filiais = rankingFiliais.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Metas de Vendas</h1>
          <p className="text-sm text-muted-foreground">Performance por consultor e evolucao mensal</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Toggle Consultores / Filiais */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setVisao("consultores")} className={`px-3 py-1.5 text-xs font-semibold transition-colors ${visao === "consultores" ? "bg-primary text-white" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>Consultores</button>
            <button onClick={() => setVisao("filiais")} className={`px-3 py-1.5 text-xs font-semibold transition-colors ${visao === "filiais" ? "bg-primary text-white" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>Filiais</button>
          </div>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-36 border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {periodOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {visao === "consultores" && (
          <Select value={filterCoop} onValueChange={setFilterCoop}>
            <SelectTrigger className="w-44 border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Brasil (Nacional)</SelectItem>
              {todasCoops.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          )}
          {canConfigMetas && (
            <Button size="sm" className="gap-1.5" onClick={() => setModalOpen(true)}>
              <Settings2 className="h-4 w-4" />Configurar Metas
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Carregando dados...</span>
        </div>
      ) : visao === "filiais" ? (
        <>
          {/* ── VISÃO FILIAIS ── */}
          {top3Filiais.length >= 3 && (
            <PodiumCard title="Ranking de Filiais" top3={top3Filiais.map(f => ({ nome: f.nome, atualContratos: f.atualContratos, atualFaturamento: f.atualFaturamento }))} accentFrom="from-blue-400" accentTo="to-indigo-500" />
          )}

          {/* Tabela Filiais */}
          <Card className="border-border overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60 border-b-2 border-[#747474]">
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em] w-16">#</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em]">Filial</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em] text-center">Consultores</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em] text-center">Vendas</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em] text-right">Faturamento</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em] text-center">Leads</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em] text-center">Conversao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankingFiliais.map((f: any) => {
                    const conv = f.totalLeads > 0 ? Math.round((f.atualContratos / f.totalLeads) * 1000) / 10 : 0;
                    return (
                      <TableRow key={f.nome} className="hover:bg-muted/30 transition-colors border-b border-[#747474]/20">
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {f.ranking <= 3 && <Medal className={`h-4 w-4 ${medalColors[f.ranking - 1]}`} />}
                            <span className="font-bold">{f.ranking}o</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{f.nome}</TableCell>
                        <TableCell className="text-center text-sm">{f.consultores}</TableCell>
                        <TableCell className="text-center font-bold">{f.atualContratos}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-400">R$ {f.atualFaturamento.toLocaleString()}</TableCell>
                        <TableCell className="text-center text-sm">{f.totalLeads}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={conv >= 30 ? "bg-emerald-500/10 text-emerald-400" : conv >= 20 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/8 text-red-400"}>
                            {conv}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* ── VISÃO CONSULTORES ── */}
          {/* Podium Top 3 — Nacional + Filial side by side */}
          {top3Nacional.length >= 3 && (
            <div className={`grid gap-4 ${top3Filial.length >= 3 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
              <PodiumCard title="Ranking Nacional" top3={top3Nacional} accentFrom="from-yellow-300" accentTo="to-amber-500" />
              {top3Filial.length >= 3 && (
                <PodiumCard title={`Ranking ${filterCoop}`} top3={top3Filial} accentFrom="from-blue-400" accentTo="to-indigo-500" />
              )}
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(k => (
              <Card key={k.label} className="border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                    <k.icon className={`h-5 w-5 ${k.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                    <p className="text-lg font-bold">{k.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table */}
          <Card className="border-border overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60 border-b-2 border-[#747474]">
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em] w-16"># BR</TableHead>
                    {showFilialRanking && <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em] w-16"># Filial</TableHead>}
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em]">Consultor</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em] text-center">Meta Contr.</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em] text-center">Atual</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em] text-right">Meta Fat.</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em] text-right">Atual Fat.</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em] text-center">Conversao</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em] text-center">Leads</TableHead>
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em]">% Atingimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={showFilialRanking ? 10 : 9} className="text-center py-8 text-muted-foreground">Nenhum consultor encontrado.</TableCell></TableRow>
                  ) : (
                    (showFilialRanking ? filialSorted : filtered).map((c: any) => {
                      const pct = c.metaContratos > 0 ? (c.atualContratos / c.metaContratos) * 100 : 0;
                      const barColor = pct >= 80 ? "bg-emerald-500/80" : pct >= 50 ? "bg-amber-500/80" : "bg-red-500/80";
                      const isMe = usuario?.nome === c.nome;
                      return (
                        <TableRow key={c.nome} className={`hover:bg-muted/30 transition-colors border-b border-[#747474]/20 ${isMe ? "bg-primary/5" : ""}`}>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {c.ranking <= 3 && <Medal className={`h-4 w-4 ${medalColors[c.ranking - 1]}`} />}
                              <span className="font-bold">{c.ranking}o</span>
                            </div>
                          </TableCell>
                          {showFilialRanking && (
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {c.rankingFilial <= 3 && <Medal className={`h-4 w-4 ${c.rankingFilial === 1 ? "text-blue-400" : c.rankingFilial === 2 ? "text-blue-300" : "text-blue-200"}`} />}
                                <span className="font-bold text-blue-400">{c.rankingFilial}o</span>
                              </div>
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-[10px] font-bold bg-white/5">{initials(c.nome)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className={`text-sm font-medium ${isMe ? "text-primary" : ""}`}>{c.nome}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{c.metaContratos}</TableCell>
                          <TableCell className="text-center font-semibold">{c.atualContratos}</TableCell>
                          <TableCell className="text-right text-sm">R$ {c.metaFaturamento.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-semibold text-emerald-400">R$ {c.atualFaturamento.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={c.conversao >= 30 ? "bg-emerald-500/10 text-emerald-400" : c.conversao >= 20 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/8 text-red-400"}>
                              {c.conversao}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm">{c.totalLeads}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-20">
                                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                </div>
                              </div>
                              <span className="text-xs font-semibold">{pct.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border">
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-3">Evolucao Realizado</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={evolucao}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="realizado" fill="hsl(var(--primary))" name="Contratos" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-3">Faturamento Mensal</p>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={evolucao}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="faturamento" stroke="hsl(152, 50%, 55%)" strokeWidth={2} name="Faturamento" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Config Meta Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Configurar Meta — {periodOptions.find(p => p.value === periodo)?.label}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Tipo de Meta</Label>
              <Select value={cfgTipo} onValueChange={(v: any) => setCfgTipo(v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual (consultor)</SelectItem>
                  {configurableCoops.length > 0 && <SelectItem value="cooperativa">Coletiva da Filial</SelectItem>}
                  {isDiretor && <SelectItem value="geral">Geral (todas as filiais)</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {cfgTipo === "individual" && (
              <div>
                <Label className="text-xs">Consultor</Label>
                <Select value={cfgUsuarioId} onValueChange={setCfgUsuarioId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {configurableConsultores.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {cfgTipo === "cooperativa" && (
              <div>
                <Label className="text-xs">Cooperativa</Label>
                <Select value={cfgCooperativa} onValueChange={setCfgCooperativa}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {configurableCoops.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Meta Contratos</Label>
                <Input className="mt-1" type="number" value={cfgContratos} onChange={e => setCfgContratos(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Meta Faturamento (R$)</Label>
                <Input className="mt-1" type="number" value={cfgFaturamento} onChange={e => setCfgFaturamento(e.target.value)} />
              </div>
            </div>

            <Button className="w-full" onClick={() => saveMeta.mutate()} disabled={saveMeta.isPending}>
              {saveMeta.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar Meta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
