import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function MotivosTab() {
  const { data: transicoes, isLoading } = useQuery({
    queryKey: ["motivos-perda"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("pipeline_transicoes")
        .select("id, negociacao_id, stage_novo, motivo")
        .eq("stage_novo", "perdido");
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const motivos = useMemo(() => {
    if (!transicoes) return [];

    const counts: Record<string, number> = {};
    (transicoes as any[]).forEach((t: any) => {
      const motivo = t.motivo?.trim() || "Sem motivo";
      counts[motivo] = (counts[motivo] || 0) + 1;
    });

    const total = Object.values(counts).reduce((s, v) => s + v, 0);

    return Object.entries(counts)
      .map(([motivo, qtd]) => ({
        motivo,
        qtd,
        pct: total > 0 ? Number(((qtd / total) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.qtd - a.qtd);
  }, [transicoes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando motivos de perda...</span>
      </div>
    );
  }

  if (motivos.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Nenhuma negociação perdida encontrada.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Motivos de Perda</h3>
            <ResponsiveContainer width="100%" height={Math.max(280, motivos.length * 36)}>
              <BarChart data={motivos} layout="vertical" margin={{ left: 120 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="motivo" tick={{ fontSize: 11 }} width={115} />
                <Tooltip />
                <Bar dataKey="qtd" fill="#EF4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Detalhamento</h3>
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Motivo</TableHead>
                <TableHead className="text-xs text-right">Qtd</TableHead>
                <TableHead className="text-xs text-right">%</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {motivos.map(m => (
                  <TableRow key={m.motivo}>
                    <TableCell className="text-sm">{m.motivo}</TableCell>
                    <TableCell className="text-sm text-right font-medium">{m.qtd}</TableCell>
                    <TableCell className="text-sm text-right text-muted-foreground">{m.pct}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
