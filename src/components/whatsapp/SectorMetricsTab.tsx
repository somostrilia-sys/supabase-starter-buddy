// SectorMetricsTab — KPIs do setor (24h, 7d, 30d) + top intents + custo IA
import { useQuery } from "@tanstack/react-query";
import { supabaseHub } from "@/integrations/hub/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Zap, Bot, User, Clock, CheckCircle2, DollarSign } from "lucide-react";

interface Props {
  setor: string;
}

export function SectorMetricsTab({ setor }: Props) {
  const { data: stats24h } = useQuery({
    queryKey: ["sector-metrics-24h", setor],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data } = await (supabaseHub as any).from("whatsapp_atendimentos")
        .select("status, intencao, ai_runs_count, resolvido_em, criado_em")
        .eq("setor", setor)
        .gte("criado_em", new Date(Date.now() - 24 * 3600_000).toISOString());
      const rows = data || [];
      const novo = rows.filter((r: any) => r.status === "aberto").length;
      const em_ia = rows.filter((r: any) => r.status === "em_ia").length;
      const em_humano = rows.filter((r: any) => r.status === "em_humano").length;
      const resolvido = rows.filter((r: any) => r.status === "resolvido").length;
      const total = rows.length;
      const pctAuto = total ? Math.round((resolvido / total) * 100) : 0;
      const intents: Record<string, number> = {};
      for (const r of rows) {
        if (r.intencao) intents[r.intencao] = (intents[r.intencao] || 0) + 1;
      }
      const topIntents = Object.entries(intents).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5);
      return { novo, em_ia, em_humano, resolvido, total, pctAuto, topIntents };
    },
  });

  const { data: custo30d } = useQuery({
    queryKey: ["sector-ia-custo-30d", setor],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await (supabaseHub as any).from("whatsapp_ia_usage")
        .select("custo_usd, tokens_input, tokens_output, criado_em")
        .eq("setor", setor)
        .gte("criado_em", new Date(Date.now() - 30 * 24 * 3600_000).toISOString());
      const rows = data || [];
      const total_usd = rows.reduce((a: number, r: any) => a + Number(r.custo_usd || 0), 0);
      return { total_usd, turns: rows.length };
    },
  });

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Métricas do setor {setor}
        </h3>
        <p className="text-xs text-muted-foreground">Últimas 24h + custo IA 30 dias.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground uppercase">Total 24h</p>
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats24h?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/5">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground uppercase">Novos</p>
              <Zap className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-700">{stats24h?.novo ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-violet-500/5">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground uppercase">Em IA</p>
              <Bot className="h-3.5 w-3.5 text-violet-500" />
            </div>
            <p className="text-2xl font-bold text-violet-700">{stats24h?.em_ia ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground uppercase">Humano</p>
              <User className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-700">{stats24h?.em_humano ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground uppercase">Resolvidos</p>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-700">{stats24h?.resolvido ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">{stats24h?.pctAuto ?? 0}% do total</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-violet-500" /> Custo IA (30 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold">${(custo30d?.total_usd || 0).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                ≈ R$ {((custo30d?.total_usd || 0) * 5).toFixed(2)} · {custo30d?.turns || 0} turns
              </p>
            </div>
            {custo30d?.turns ? (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Média/turn</p>
                <p className="text-sm font-bold">${(custo30d.total_usd / custo30d.turns).toFixed(4)}</p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {stats24h?.topIntents && stats24h.topIntents.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top intenções 24h</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {stats24h.topIntents.map(([intent, count]) => (
              <div key={intent} className="flex items-center justify-between py-1 border-b last:border-0">
                <span className="text-xs font-mono">{intent}</span>
                <Badge variant="secondary" className="text-[10px]">{count as number}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
