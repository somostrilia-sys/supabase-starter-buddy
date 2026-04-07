import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function MotivosTab({ filters }: { filters?: { cooperativa: string; consultor: string; dateStart?: Date; dateEnd?: Date } }) {
  const { data: perdidos, isLoading } = useQuery({
    queryKey: ["motivos-perda", filters?.cooperativa, filters?.consultor, filters?.dateStart?.toISOString(), filters?.dateEnd?.toISOString()],
    queryFn: async () => {
      let q = (supabase as any).from("negociacoes")
        .select("id, consultor, cooperativa, observacoes, updated_at")
        .eq("stage", "perdido");
      if (filters?.cooperativa && filters.cooperativa !== "all") q = q.eq("cooperativa", filters.cooperativa);
      if (filters?.consultor && filters.consultor !== "all") q = q.eq("consultor", filters.consultor);
      if (filters?.dateStart) q = q.gte("updated_at", filters.dateStart.toISOString());
      if (filters?.dateEnd) q = q.lte("updated_at", new Date(filters.dateEnd.getFullYear(), filters.dateEnd.getMonth(), filters.dateEnd.getDate(), 23, 59, 59).toISOString());
      const { data } = await q;

      // Also get motivos from pipeline_transicoes
      const { data: trans } = await (supabase as any).from("pipeline_transicoes")
        .select("negociacao_id, motivo").eq("stage_novo", "perdido");
      const motivoMap: Record<string, string> = {};
      (trans || []).forEach((t: any) => { if (t.motivo) motivoMap[t.negociacao_id] = t.motivo; });

      return (data || []).map((n: any) => ({
        ...n,
        motivo: motivoMap[n.id] || n.observacoes || "Sem motivo registrado",
      }));
    },
  });

  const motivos = useMemo(() => {
    if (!perdidos) return [];
    const counts: Record<string, number> = {};
    perdidos.forEach((t: any) => {
      const m = t.motivo?.trim() || "Sem motivo";
      counts[m] = (counts[m] || 0) + 1;
    });
    const total = perdidos.length;
    return Object.entries(counts)
      .map(([motivo, qtd]) => ({ motivo: motivo.slice(0, 50), qtd, pct: total > 0 ? Math.round((qtd / total) * 1000) / 10 : 0 }))
      .sort((a, b) => b.qtd - a.qtd);
  }, [perdidos]);

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <span className="font-semibold">{perdidos?.length || 0} negociacoes perdidas</span>
      </div>
      {motivos.length > 0 && (
        <Card><CardContent className="p-4">
          <ResponsiveContainer width="100%" height={Math.max(200, motivos.length * 35)}>
            <BarChart data={motivos.slice(0, 15)} layout="vertical" margin={{ left: 150 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="motivo" type="category" tick={{ fontSize: 10 }} width={140} />
              <Tooltip />
              <Bar dataKey="qtd" fill="hsl(0, 70%, 55%)" radius={[0, 4, 4, 0]} name="Qtd" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card>
      )}
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="bg-muted/60">
            <TableHead className="text-[10px] uppercase">Motivo</TableHead>
            <TableHead className="text-[10px] uppercase text-center">Qtd</TableHead>
            <TableHead className="text-[10px] uppercase text-center">%</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {motivos.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhuma perda encontrada</TableCell></TableRow>
            ) : motivos.map(m => (
              <TableRow key={m.motivo}>
                <TableCell className="text-sm">{m.motivo}</TableCell>
                <TableCell className="text-center font-semibold">{m.qtd}</TableCell>
                <TableCell className="text-center"><Badge variant="outline" className="text-[10px]">{m.pct}%</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
