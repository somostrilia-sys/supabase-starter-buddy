import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Loader2, Car } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function VeiculosSemCoberturaTab() {
  const { data: modelos = [], isLoading } = useQuery({
    queryKey: ["veiculos-sem-cobertura"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("modelos_veiculo")
        .select("id, nome, cod_fipe, tipo_veiculo, motivo_rejeicao, marca:marcas_veiculo(nome)")
        .eq("aceito", false)
        .not("motivo_rejeicao", "is", null)
        .order("nome")
        .limit(100);
      return data || [];
    },
  });

  const porMotivo = useMemo(() => {
    const map: Record<string, number> = {};
    modelos.forEach((m: any) => {
      const motivo = m.motivo_rejeicao || "Sem motivo";
      map[motivo] = (map[motivo] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [modelos]);

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-red-400" /></div>
          <div><p className="text-xl font-bold">{modelos.length}</p><p className="text-xs text-muted-foreground">Veiculos Rejeitados</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><Car className="h-5 w-5 text-amber-400" /></div>
          <div><p className="text-xl font-bold">{porMotivo.length}</p><p className="text-xs text-muted-foreground">Motivos Distintos</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-2">Top Motivos</p>
          <div className="space-y-1">{porMotivo.slice(0, 3).map(([motivo, qtd]) => (
            <div key={motivo} className="flex justify-between text-xs"><span className="truncate flex-1">{motivo}</span><Badge variant="outline" className="text-[9px] ml-2">{qtd}</Badge></div>
          ))}</div>
        </CardContent></Card>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        <Table><TableHeader><TableRow className="bg-muted/60">
          <TableHead className="text-[10px] uppercase">Marca</TableHead>
          <TableHead className="text-[10px] uppercase">Modelo</TableHead>
          <TableHead className="text-[10px] uppercase">Cod FIPE</TableHead>
          <TableHead className="text-[10px] uppercase">Tipo</TableHead>
          <TableHead className="text-[10px] uppercase">Motivo Rejeicao</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {modelos.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum veiculo rejeitado encontrado</TableCell></TableRow>
          ) : modelos.map((m: any) => (
            <TableRow key={m.id}>
              <TableCell className="text-xs font-medium">{m.marca?.nome || "—"}</TableCell>
              <TableCell className="text-sm">{m.nome}</TableCell>
              <TableCell className="text-xs font-mono text-muted-foreground">{m.cod_fipe || "—"}</TableCell>
              <TableCell className="text-xs">{m.tipo_veiculo || "—"}</TableCell>
              <TableCell><Badge className="bg-red-500/10 text-red-400 text-[10px]">{m.motivo_rejeicao}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      </CardContent></Card>
    </div>
  );
}
