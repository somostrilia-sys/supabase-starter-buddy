import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#14b8a6", "#e11d48"];

export default function OrigemLeadsTab({ filters }: { filters?: { cooperativa: string; consultor: string; dateStart?: Date; dateEnd?: Date } }) {
  const { data: negocios, isLoading } = useQuery({
    queryKey: ["origem-leads", filters?.cooperativa, filters?.consultor, filters?.dateStart?.toISOString(), filters?.dateEnd?.toISOString()],
    queryFn: async () => {
      let q = (supabase as any).from("negociacoes").select("id, origem, stage, created_at");
      if (filters?.cooperativa && filters.cooperativa !== "all") q = q.eq("cooperativa", filters.cooperativa);
      if (filters?.consultor && filters.consultor !== "all") q = q.eq("consultor", filters.consultor);
      if (filters?.dateStart) q = q.gte("created_at", filters.dateStart.toISOString());
      if (filters?.dateEnd) q = q.lte("created_at", new Date(filters.dateEnd.getFullYear(), filters.dateEnd.getMonth(), filters.dateEnd.getDate(), 23, 59, 59).toISOString());
      const { data } = await q;
      return (data || []) as any[];
    },
  });

  const origens = useMemo(() => {
    if (!negocios) return [];
    const map: Record<string, { total: number; concluidos: number }> = {};
    negocios.forEach((n: any) => {
      const o = n.origem || "Nao informado";
      if (!map[o]) map[o] = { total: 0, concluidos: 0 };
      map[o].total++;
      if (n.stage === "concluido") map[o].concluidos++;
    });
    const total = negocios.length;
    return Object.entries(map)
      .map(([origem, d]) => ({ origem, total: d.total, concluidos: d.concluidos, pct: total > 0 ? Math.round((d.total / total) * 1000) / 10 : 0, taxa: d.total > 0 ? Math.round((d.concluidos / d.total) * 1000) / 10 : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [negocios]);

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const pieData = origens.slice(0, 10).map(o => ({ name: o.origem, value: o.total }));

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-sm font-semibold mb-3">Distribuicao por Canal</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
              {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm font-semibold mb-3">Taxa de Conversao por Canal</p>
          <div className="space-y-2">
            {origens.slice(0, 10).map((o, i) => (
              <div key={o.origem} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs flex-1 truncate">{o.origem}</span>
                <div className="w-24 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(o.taxa, 100)}%` }} /></div>
                <span className="text-xs font-semibold w-12 text-right">{o.taxa}%</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>
      <Card><CardContent className="p-0">
        <Table><TableHeader><TableRow className="bg-muted/60">
          <TableHead className="text-[10px] uppercase">Canal</TableHead>
          <TableHead className="text-[10px] uppercase text-center">Leads</TableHead>
          <TableHead className="text-[10px] uppercase text-center">Convertidos</TableHead>
          <TableHead className="text-[10px] uppercase text-center">% Total</TableHead>
          <TableHead className="text-[10px] uppercase text-center">Taxa Conversao</TableHead>
        </TableRow></TableHeader>
        <TableBody>{origens.map(o => (
          <TableRow key={o.origem}>
            <TableCell className="font-medium text-sm">{o.origem}</TableCell>
            <TableCell className="text-center font-semibold">{o.total}</TableCell>
            <TableCell className="text-center font-semibold text-emerald-400">{o.concluidos}</TableCell>
            <TableCell className="text-center"><Badge variant="outline" className="text-[10px]">{o.pct}%</Badge></TableCell>
            <TableCell className="text-center"><Badge className={o.taxa >= 30 ? "bg-emerald-500/10 text-emerald-400" : o.taxa >= 15 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}>{o.taxa}%</Badge></TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </CardContent></Card>
    </div>
  );
}
