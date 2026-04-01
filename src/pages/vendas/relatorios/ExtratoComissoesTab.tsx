import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Users, DollarSign, TrendingUp, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface ComissaoRow {
  consultor: string;
  qtdVendas: number;
  totalAdesoes: number;
  comissaoPct: number;
  totalComissoes: number;
}

export default function ExtratoComissoesTab() {
  const { data: usuarios, isLoading: loadingUsuarios } = useQuery({
    queryKey: ["extrato-usuarios"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("usuarios")
        .select("id, nome, comissao_pct")
        .eq("status", "ativo");
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { data: negociacoes, isLoading: loadingNeg } = useQuery({
    queryKey: ["extrato-negociacoes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("negociacoes")
        .select("id, consultor, valor_plano, stage, venda_concluida_em")
        .eq("stage", "concluido");
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const isLoading = loadingUsuarios || loadingNeg;

  const rows: ComissaoRow[] = useMemo(() => {
    if (!usuarios || !negociacoes) return [];

    const userMap = new Map<string, number>();
    (usuarios as any[]).forEach((u: any) => {
      userMap.set(u.nome, Number(u.comissao_pct) || 0);
    });

    const grouped: Record<string, { qtd: number; totalValor: number; pct: number }> = {};

    (negociacoes as any[]).forEach((n: any) => {
      const consultor = n.consultor;
      if (!consultor) return;
      if (!grouped[consultor]) {
        grouped[consultor] = { qtd: 0, totalValor: 0, pct: userMap.get(consultor) || 0 };
      }
      grouped[consultor].qtd += 1;
      grouped[consultor].totalValor += Number(n.valor_plano) || 0;
    });

    return Object.entries(grouped)
      .map(([consultor, g]) => ({
        consultor,
        qtdVendas: g.qtd,
        totalAdesoes: g.totalValor,
        comissaoPct: g.pct,
        totalComissoes: g.totalValor * (g.pct / 100),
      }))
      .sort((a, b) => b.totalComissoes - a.totalComissoes);
  }, [usuarios, negociacoes]);

  const totals = useMemo(() => ({
    qtdVendas: rows.reduce((s, c) => s + c.qtdVendas, 0),
    totalAdesoes: rows.reduce((s, c) => s + c.totalAdesoes, 0),
    totalComissoes: rows.reduce((s, c) => s + c.totalComissoes, 0),
    pctMedia: rows.length ? rows.reduce((s, c) => s + c.comissaoPct, 0) / rows.length : 0,
  }), [rows]);

  const consultoresAtivos = rows.length;
  const ticketMedio = rows.length ? totals.totalComissoes / rows.length : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando comissões...</span>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Nenhuma venda concluída encontrada para calcular comissões.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cards resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Comissões</p>
              <p className="text-lg font-bold">{fmt(totals.totalComissoes)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Consultores com Vendas</p>
              <p className="text-lg font-bold">{consultoresAtivos}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/8 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Comissão Média por Consultor</p>
              <p className="text-lg font-bold">{fmt(ticketMedio)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 pb-2">
            <p className="text-sm font-semibold">Extrato de Comissões</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consultor</TableHead>
                <TableHead className="text-center">Qtd Vendas</TableHead>
                <TableHead className="text-right">Total Adesões (R$)</TableHead>
                <TableHead className="text-center">% Comissão</TableHead>
                <TableHead className="text-right">Total Comissões (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(c => (
                <TableRow key={c.consultor}>
                  <TableCell className="font-medium">{c.consultor}</TableCell>
                  <TableCell className="text-center">{c.qtdVendas}</TableCell>
                  <TableCell className="text-right">{fmt(c.totalAdesoes)}</TableCell>
                  <TableCell className="text-center">{c.comissaoPct}%</TableCell>
                  <TableCell className="text-right font-semibold">{fmt(c.totalComissoes)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-center">{totals.qtdVendas}</TableCell>
                <TableCell className="text-right">{fmt(totals.totalAdesoes)}</TableCell>
                <TableCell className="text-center">{totals.pctMedia.toFixed(1)}%</TableCell>
                <TableCell className="text-right">{fmt(totals.totalComissoes)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
