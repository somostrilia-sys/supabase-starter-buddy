import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock } from "lucide-react";

interface Props {
  veiculoId: string;
  placa?: string;
}

export default function HistoricoEventosList({ veiculoId, placa }: Props) {
  const { data: eventos, isLoading } = useQuery({
    queryKey: ["historico_eventos", veiculoId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("pipeline_transicoes")
        .select("*, negociacoes!inner(veiculo_placa)")
        .eq("negociacoes.veiculo_placa", placa || "")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) return [];
      return data || [];
    },
    enabled: !!placa,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando histórico...
      </div>
    );
  }

  if (!eventos || eventos.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum evento registrado para este veículo.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Usuário</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventos.map((e: any) => (
              <TableRow key={e.id}>
                <TableCell className="text-xs font-mono">
                  {new Date(e.created_at).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="text-sm">{e.motivo || `${e.stage_anterior} → ${e.stage_novo}`}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {e.automatica ? "Sistema" : "Manual"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{e.usuario_nome || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
