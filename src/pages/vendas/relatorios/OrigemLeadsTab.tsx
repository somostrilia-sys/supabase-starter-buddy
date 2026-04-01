import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const COLORS = ["#3B82F6", "#22C55E", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#F97316", "#EC4899", "#14B8A6", "#6366F1"];

export default function OrigemLeadsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["origem-leads"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("negociacoes")
        .select("id, origem, stage");
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando origens...</span>
      </div>
    );
  }

  const negociacoes = data || [];
  const total = negociacoes.length;

  // Group by origem
  const byOrigem: Record<string, { total: number; concluido: number }> = {};
  for (const n of negociacoes) {
    const key = n.origem || "Não informado";
    if (!byOrigem[key]) byOrigem[key] = { total: 0, concluido: 0 };
    byOrigem[key].total++;
    if (n.stage === "concluido") byOrigem[key].concluido++;
  }

  const origens = Object.entries(byOrigem)
    .map(([canal, d]) => ({
      canal,
      qtd: d.total,
      pct: total > 0 ? (d.total / total) * 100 : 0,
      conversao: d.total > 0 ? (d.concluido / d.total) * 100 : 0,
    }))
    .sort((a, b) => b.qtd - a.qtd);

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Distribuição por Canal</h3>
            {origens.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhum dado disponível</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={origens} dataKey="qtd" nameKey="canal" cx="50%" cy="50%" outerRadius={100} label={({ pct }) => `${pct.toFixed(1)}%`} fontSize={10}>
                    {origens.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend fontSize={11} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Análise por Canal</h3>
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Canal</TableHead>
                <TableHead className="text-xs text-right">Qtd</TableHead>
                <TableHead className="text-xs text-right">%</TableHead>
                <TableHead className="text-xs text-right">Conversão</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {origens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                      Nenhuma negociação encontrada
                    </TableCell>
                  </TableRow>
                ) : origens.map((o, i) => (
                  <TableRow key={o.canal}>
                    <TableCell className="text-sm">
                      <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }} />{o.canal}
                    </TableCell>
                    <TableCell className="text-sm text-right">{o.qtd}</TableCell>
                    <TableCell className="text-sm text-right text-muted-foreground">{o.pct.toFixed(1)}%</TableCell>
                    <TableCell className="text-sm text-right font-medium">{o.conversao.toFixed(1)}%</TableCell>
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
