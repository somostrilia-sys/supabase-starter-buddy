import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Target, TrendingUp, AlertCircle, Plus, Percent, Trophy, Loader2, Medal, Award, Crown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const META_CONTRATOS_DEFAULT = 20;
const META_FATURAMENTO_DEFAULT = 30000;

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function getLastNMonths(n: number) {
  const now = new Date();
  const months: { year: number; month: number; label: string; key: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: MONTH_LABELS[d.getMonth()],
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }
  return months;
}

function getPeriodOptions() {
  const now = new Date();
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const lbl = `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
    options.push({ value: val, label: lbl });
  }
  return options;
}

function getInitials(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

async function fetchConsultoresData(periodoKey: string) {
  // Parse period
  const [yearStr, monthStr] = periodoKey.split("-");
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  const startOfMonth = new Date(year, month - 1, 1).toISOString();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  // Fetch active consultores with photo
  const { data: usuarios, error: errUsuarios } = await (supabase as any)
    .from("usuarios")
    .select("nome, foto_capa_url")
    .eq("status", "ativo")
    .eq("grupo_permissao", "Consultor");

  if (errUsuarios) throw errUsuarios;
  if (!usuarios || usuarios.length === 0) return [];

  const nomes: string[] = usuarios.map((u: any) => u.nome);
  const fotoMap: Record<string, string | null> = {};
  usuarios.forEach((u: any) => {
    fotoMap[u.nome] = u.foto_capa_url || null;
  });

  // Fetch metas from metas_consultores for this month/year
  const { data: metasDb } = await (supabase as any)
    .from("metas_consultores")
    .select("consultor_nome, meta_contratos, meta_faturamento")
    .eq("ano", year)
    .eq("mes", month);

  const metasMap: Record<string, { contratos: number; faturamento: number }> = {};
  (metasDb || []).forEach((m: any) => {
    metasMap[m.consultor_nome] = {
      contratos: m.meta_contratos ?? META_CONTRATOS_DEFAULT,
      faturamento: Number(m.meta_faturamento) || META_FATURAMENTO_DEFAULT,
    };
  });

  // Fetch all negociacoes for these consultores in the period
  const { data: negocios, error: errNeg } = await (supabase as any)
    .from("negociacoes")
    .select("consultor, valor_plano, stage, created_at")
    .in("consultor", nomes)
    .gte("created_at", startOfMonth)
    .lte("created_at", endOfMonth);

  if (errNeg) throw errNeg;

  const rows: any[] = negocios || [];

  // Build per-consultor stats
  const consultores = nomes.map((nome) => {
    const mine = rows.filter((r: any) => r.consultor === nome);
    const concluidos = mine.filter((r: any) => r.stage === "concluido");
    const atualContratos = concluidos.length;
    const atualFaturamento = concluidos.reduce((s: number, r: any) => s + (Number(r.valor_plano) || 0), 0);
    const totalLeads = mine.length;
    const conversao = totalLeads > 0 ? (atualContratos / totalLeads) * 100 : 0;

    const meta = metasMap[nome];

    return {
      nome,
      fotoUrl: fotoMap[nome] || null,
      metaContratos: meta?.contratos ?? META_CONTRATOS_DEFAULT,
      atualContratos,
      metaFaturamento: meta?.faturamento ?? META_FATURAMENTO_DEFAULT,
      atualFaturamento,
      conversao: Math.round(conversao * 10) / 10,
      totalLeads,
      ranking: 0,
    };
  });

  // Sort by atualContratos descending and assign ranking
  consultores.sort((a, b) => b.atualContratos - a.atualContratos);
  consultores.forEach((c, i) => (c.ranking = i + 1));

  return consultores;
}

async function fetchEvolucao() {
  const months = getLastNMonths(6);
  const startDate = new Date(months[0].year, months[0].month, 1).toISOString();
  const endMonth = months[months.length - 1];
  const endDate = new Date(endMonth.year, endMonth.month + 1, 0, 23, 59, 59, 999).toISOString();

  const { data: negocios, error } = await (supabase as any)
    .from("negociacoes")
    .select("consultor, valor_plano, stage, created_at")
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  if (error) throw error;

  const rows: any[] = negocios || [];

  // Count active consultores for meta calculation
  const { data: usuarios } = await (supabase as any)
    .from("usuarios")
    .select("nome")
    .eq("status", "ativo")
    .eq("grupo_permissao", "Consultor");

  const numConsultores = usuarios?.length || 1;

  // Fetch all metas for these months
  const { data: metasDb } = await (supabase as any)
    .from("metas_consultores")
    .select("consultor_nome, ano, mes, meta_contratos");

  const metasByMonth: Record<string, number> = {};
  (metasDb || []).forEach((m: any) => {
    const key = `${m.ano}-${m.mes}`;
    metasByMonth[key] = (metasByMonth[key] || 0) + (m.meta_contratos ?? META_CONTRATOS_DEFAULT);
  });

  return months.map((m) => {
    const inMonth = rows.filter((r: any) => {
      const d = new Date(r.created_at);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    });
    const concluidos = inMonth.filter((r: any) => r.stage === "concluido");
    const faturamento = concluidos.reduce((s: number, r: any) => s + (Number(r.valor_plano) || 0), 0);

    const monthKey = `${m.year}-${m.month + 1}`;
    const metaPerMonth = metasByMonth[monthKey] || numConsultores * META_CONTRATOS_DEFAULT;

    return {
      mes: m.label,
      meta: metaPerMonth,
      realizado: concluidos.length,
      faturamento,
    };
  });
}

function PodiumCard({
  consultor,
  place,
}: {
  consultor: any;
  place: 1 | 2 | 3;
}) {
  const colors: Record<number, string> = {
    1: "#FFD700",
    2: "#C0C0C0",
    3: "#CD7F32",
  };
  const heights: Record<number, string> = {
    1: "h-52",
    2: "h-44",
    3: "h-40",
  };
  const color = colors[place];
  const Icon = place === 1 ? Crown : place === 2 ? Medal : Award;
  const placeLabel = place === 1 ? "1o" : place === 2 ? "2o" : "3o";

  return (
    <Card
      className={`border-2 relative overflow-hidden flex flex-col items-center justify-end ${heights[place]}`}
      style={{ borderColor: color }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: color }}
      />
      <CardContent className="p-3 flex flex-col items-center gap-1.5 w-full">
        <Icon className="h-6 w-6" style={{ color }} />
        {consultor.fotoUrl ? (
          <img
            src={consultor.fotoUrl}
            alt={consultor.nome}
            className="w-14 h-14 rounded-full object-cover border-2"
            style={{ borderColor: color }}
          />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg border-2"
            style={{ backgroundColor: color, borderColor: color }}
          >
            {getInitials(consultor.nome)}
          </div>
        )}
        <p className="text-sm font-bold text-foreground text-center leading-tight truncate w-full">
          {consultor.nome}
        </p>
        <div className="text-center space-y-0.5">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{consultor.atualContratos}</span> vendas
          </p>
          <p className="text-xs font-semibold text-success">
            R$ {consultor.atualFaturamento.toLocaleString("pt-BR")}
          </p>
        </div>
        <Badge
          className="text-[10px] px-2 py-0"
          style={{ backgroundColor: `${color}22`, color, borderColor: color }}
          variant="outline"
        >
          {placeLabel} lugar
        </Badge>
      </CardContent>
    </Card>
  );
}

export default function Metas() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [metaConsultor, setMetaConsultor] = useState("");
  const [metaContratos, setMetaContratos] = useState("");
  const [metaFaturamento, setMetaFaturamento] = useState("");
  const [saving, setSaving] = useState(false);
  const periodOptions = useMemo(() => getPeriodOptions(), []);
  const [periodo, setPeriodo] = useState(periodOptions[0]?.value || "");

  const {
    data: consultores = [],
    isLoading: loadingConsultores,
  } = useQuery({
    queryKey: ["metas-consultores", periodo],
    queryFn: () => fetchConsultoresData(periodo),
    enabled: !!periodo,
  });

  const {
    data: evolucao = [],
    isLoading: loadingEvolucao,
  } = useQuery({
    queryKey: ["metas-evolucao"],
    queryFn: fetchEvolucao,
  });

  const isLoading = loadingConsultores || loadingEvolucao;

  const totalMeta = consultores.reduce((s: number, v: any) => s + v.metaContratos, 0);
  const totalAtual = consultores.reduce((s: number, v: any) => s + v.atualContratos, 0);
  const taxa = totalMeta > 0 ? (totalAtual / totalMeta) * 100 : 0;

  const kpis = [
    { label: "Meta do Mes", value: `${totalMeta} contratos`, icon: Target, color: "text-primary", bg: "bg-primary/8" },
    { label: "Atingido", value: `${totalAtual} contratos`, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
    { label: "Faltam", value: `${Math.max(totalMeta - totalAtual, 0)} contratos`, icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/8" },
    { label: "% Atingimento", value: `${taxa.toFixed(1)}%`, icon: Percent, color: "text-warning", bg: "bg-warning/10" },
  ];

  const sorted = [...consultores].sort((a: any, b: any) => a.ranking - b.ranking);

  // Podium: top 3
  const top3 = sorted.slice(0, 3);
  const first = top3.find((c: any) => c.ranking === 1);
  const second = top3.find((c: any) => c.ranking === 2);
  const third = top3.find((c: any) => c.ranking === 3);

  async function handleSaveMeta() {
    if (!metaConsultor) {
      toast.error("Selecione um consultor");
      return;
    }
    const [yearStr, monthStr] = periodo.split("-");
    const ano = parseInt(yearStr);
    const mes = parseInt(monthStr);
    const contratos = metaContratos ? parseInt(metaContratos) : META_CONTRATOS_DEFAULT;
    const faturamento = metaFaturamento ? parseFloat(metaFaturamento) : META_FATURAMENTO_DEFAULT;

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("metas_consultores")
        .upsert(
          {
            consultor_nome: metaConsultor,
            ano,
            mes,
            meta_contratos: contratos,
            meta_faturamento: faturamento,
          },
          { onConflict: "consultor_nome,ano,mes" }
        );
      if (error) throw error;

      toast.success("Meta salva com sucesso!");
      setModalOpen(false);
      setMetaConsultor("");
      setMetaContratos("");
      setMetaFaturamento("");
      queryClient.invalidateQueries({ queryKey: ["metas-consultores"] });
      queryClient.invalidateQueries({ queryKey: ["metas-evolucao"] });
    } catch (err: any) {
      toast.error("Erro ao salvar meta: " + (err.message || "Erro desconhecido"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md">
            <Target className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Metas de Vendas</h1>
            <p className="text-sm text-muted-foreground">Performance por consultor e evolucao mensal</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-36 border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {periodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={modalOpen} onOpenChange={(o) => { setModalOpen(o); if (!o) { setMetaConsultor(""); setMetaContratos(""); setMetaFaturamento(""); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Nova Meta</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Nova Meta</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Consultor</Label>
                  <Select value={metaConsultor} onValueChange={setMetaConsultor}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{consultores.map((v: any) => <SelectItem key={v.nome} value={v.nome}>{v.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Meta de Contratos</Label><Input className="mt-1" type="number" placeholder={String(META_CONTRATOS_DEFAULT)} value={metaContratos} onChange={(e) => setMetaContratos(e.target.value)} /></div>
                <div><Label className="text-xs">Meta de Faturamento (R$)</Label><Input className="mt-1" type="number" placeholder={String(META_FATURAMENTO_DEFAULT)} value={metaFaturamento} onChange={(e) => setMetaFaturamento(e.target.value)} /></div>
                <p className="text-xs text-muted-foreground">Periodo: {periodOptions.find((p) => p.value === periodo)?.label || periodo}</p>
                <Button className="w-full" onClick={handleSaveMeta} disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Criar Meta"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Carregando dados...</span>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-3 items-end max-w-2xl mx-auto">
              <div>{second && <PodiumCard consultor={second} place={2} />}</div>
              <div>{first && <PodiumCard consultor={first} place={1} />}</div>
              <div>{third && <PodiumCard consultor={third} place={3} />}</div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(k => (
              <Card key={k.label} className="border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                    <k.icon className={`h-5 w-5 ${k.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                    <p className="text-lg font-bold text-foreground">{k.value}</p>
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
                    <TableHead className="text-foreground/70 font-semibold text-[10px] uppercase tracking-[0.08em]">#</TableHead>
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
                  {sorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Nenhum consultor encontrado para este periodo.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sorted.map((c: any) => {
                      const pctContratos = c.metaContratos > 0 ? (c.atualContratos / c.metaContratos) * 100 : 0;
                      const barColor = pctContratos >= 80 ? "bg-success/80" : pctContratos >= 50 ? "bg-warning/80" : "bg-destructive/80";
                      return (
                        <TableRow key={c.nome} className="hover:bg-muted/30 transition-colors border-b-2 border-[#747474]">
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {c.ranking <= 3 && <Trophy className={`h-4 w-4 ${c.ranking === 1 ? "text-yellow-500" : c.ranking === 2 ? "text-gray-400" : "text-warning"}`} />}
                              <span className="font-bold text-foreground">{c.ranking}o</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {c.fotoUrl ? (
                                <img src={c.fotoUrl} alt={c.nome} className="w-7 h-7 rounded-full object-cover" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                  {getInitials(c.nome)}
                                </div>
                              )}
                              <span className="font-medium">{c.nome}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{c.metaContratos}</TableCell>
                          <TableCell className="text-center font-semibold">{c.atualContratos}</TableCell>
                          <TableCell className="text-right text-sm">R$ {c.metaFaturamento.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-semibold text-success">R$ {c.atualFaturamento.toLocaleString()}</TableCell>
                          <TableCell className="text-center"><Badge className={c.conversao >= 30 ? "bg-success/10 text-success" : c.conversao >= 20 ? "bg-warning/10 text-warning" : "bg-destructive/8 text-destructive"}>{c.conversao}%</Badge></TableCell>
                          <TableCell className="text-center text-sm">{c.totalLeads}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-20">
                                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(pctContratos, 100)}%` }} />
                                </div>
                              </div>
                              <span className="text-xs font-semibold">{pctContratos.toFixed(0)}%</span>
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
                <p className="text-sm font-semibold text-foreground mb-3">Evolucao Meta vs Realizado</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={evolucao}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="meta" fill="hsl(var(--muted-foreground) / 0.35)" name="Meta" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="realizado" fill="hsl(var(--primary))" name="Realizado" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-foreground mb-3">Faturamento Mensal</p>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={evolucao}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="faturamento" stroke="hsl(var(--accent))" strokeWidth={2} name="Faturamento" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
