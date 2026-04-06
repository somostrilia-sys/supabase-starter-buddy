import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const fmt = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ProdutosPorCooperativa() {
  const [cooperativaId, setCooperativaId] = useState<string>("");

  const { data: cooperativas = [] } = useQuery({
    queryKey: ["coop-select"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("cooperativas").select("id, nome").order("nome");
      return data || [];
    },
  });

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["prods-coop", cooperativaId],
    enabled: !!cooperativaId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("produto_cooperativas")
        .select(`
          produto_id,
          produtos_gia!inner(
            id, nome, codigo_sga, valor, valor_base, classificacao, tipo, ativo,
            fornecedor:fornecedor_id(nome)
          )
        `)
        .eq("cooperativa_id", cooperativaId);
      return (data || []).map((r: any) => r.produtos_gia).filter(Boolean);
    },
  });

  const totalMensal = produtos.filter((p: any) => p.ativo).reduce((s: number, p: any) => s + Number(p.valor || p.valor_base || 0), 0);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Utilização de Produtos por Cooperativa</h2>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <Label className="text-xs">Selecione a Cooperativa</Label>
          <Select value={cooperativaId} onValueChange={setCooperativaId}>
            <SelectTrigger><SelectValue placeholder="Escolha uma cooperativa para ver os produtos vinculados" /></SelectTrigger>
            <SelectContent>
              {cooperativas.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {cooperativaId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Produtos Vinculados
              <div className="flex gap-2 text-sm font-normal">
                <Badge variant="outline">{produtos.length} produtos</Badge>
                <Badge variant="outline" className="font-mono">{fmt(totalMensal)}/mês</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : produtos.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">Nenhum produto vinculado a esta cooperativa</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cód. SGA</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Classificação</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtos.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs font-mono text-muted-foreground">{p.codigo_sga || "—"}</TableCell>
                      <TableCell className="text-sm font-medium">{p.nome}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{p.classificacao || "—"}</Badge></TableCell>
                      <TableCell className="text-xs">{p.fornecedor?.nome || "—"}</TableCell>
                      <TableCell className="text-xs">{p.tipo || "TODOS"}</TableCell>
                      <TableCell className="text-sm font-mono text-right">{fmt(Number(p.valor || p.valor_base || 0))}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={p.ativo ? "bg-emerald-500/10 text-emerald-600 text-[10px]" : "bg-muted text-muted-foreground text-[10px]"}>
                          {p.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
