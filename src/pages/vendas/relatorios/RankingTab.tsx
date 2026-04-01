import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const medalColors = ["text-amber-500", "text-slate-400", "text-warning"];
const podiumBg = ["border-warning/30 bg-warning/50 dark:bg-amber-950/20", "border-slate-300 bg-slate-50/50 dark:bg-slate-950/20", "border-amber-600/30 bg-warning/30 dark:bg-amber-950/10"];

function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function RankingTab() {
  const { data: ranking, isLoading } = useQuery({
    queryKey: ["ranking-consultores"],
    queryFn: async () => {
      // Fetch all negociacoes with consultor info
      const { data: negociacoes, error } = await (supabase as any)
        .from("negociacoes")
        .select("id, stage, consultor, valor_plano");
      if (error) throw error;

      const all = (negociacoes || []) as any[];

      // Group by consultor
      const byConsultor: Record<string, { total: number; concluido: number; valor: number }> = {};
      for (const n of all) {
        const key = n.consultor || "Sem consultor";
        if (!byConsultor[key]) byConsultor[key] = { total: 0, concluido: 0, valor: 0 };
        byConsultor[key].total++;
        if (n.stage === "concluido") {
          byConsultor[key].concluido++;
          byConsultor[key].valor += Number(n.valor_plano) || 0;
        }
      }

      // Build ranking sorted by concluido desc
      const rows = Object.entries(byConsultor)
        .map(([nome, d]) => ({
          nome,
          vendas: d.concluido,
          valor: d.valor,
          taxa: d.total > 0 ? (d.concluido / d.total) * 100 : 0,
        }))
        .sort((a, b) => b.vendas - a.vendas)
        .map((r, i) => ({ ...r, pos: i + 1 }));

      return rows;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando ranking...</span>
      </div>
    );
  }

  const rows = ranking || [];

  return (
    <div className="space-y-4">
      {/* Podium */}
      {rows.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {rows.slice(0, 3).map((r, i) => (
            <Card key={r.nome} className={podiumBg[i]}>
              <CardContent className="p-4 text-center">
                <Trophy className={`h-8 w-8 mx-auto mb-2 ${medalColors[i]}`} />
                <p className="font-bold text-lg">{r.nome}</p>
                <p className="text-2xl font-bold">{r.vendas} vendas</p>
                <p className="text-sm text-muted-foreground">{fmt(r.valor)}</p>
                <Badge variant="outline" className="mt-2 text-[10px]">{r.taxa.toFixed(1)}% conversão</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs w-16">#</TableHead>
              <TableHead className="text-xs">Consultor</TableHead>
              <TableHead className="text-xs text-right">Vendas</TableHead>
              <TableHead className="text-xs text-right">Valor Total</TableHead>
              <TableHead className="text-xs text-right">Taxa Conversão</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    Nenhuma negociação encontrada
                  </TableCell>
                </TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.pos}>
                  <TableCell className="font-bold">
                    {r.pos <= 3 ? <Trophy className={`h-4 w-4 inline ${medalColors[r.pos - 1]}`} /> : r.pos}
                  </TableCell>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell className="text-right font-bold">{r.vendas}</TableCell>
                  <TableCell className="text-right">{fmt(r.valor)}</TableCell>
                  <TableCell className="text-right">{r.taxa.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
