import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileBarChart, Download, Loader2 } from "lucide-react";

function buildPeriodos() {
  const periodos: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    periodos.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return periodos;
}

const periodos = buildPeriodos();

export default function DRETab() {
  const [periodo, setPeriodo] = useState(periodos[0].value);

  const { data: mensalidades = [], isLoading: loadingMens } = useQuery({
    queryKey: ["dre_mensalidades", periodo],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("mensalidades")
        .select("valor, status, data_vencimento")
        .eq("status", "pago")
        .gte("data_vencimento", `${periodo}-01`)
        .lte("data_vencimento", `${periodo}-31`) as any);
      if (error) throw error;
      return (data || []) as { valor: number; status: string; data_vencimento: string }[];
    },
  });

  const { data: contasPagar = [], isLoading: loadingCP } = useQuery({
    queryKey: ["dre_contas_pagar", periodo],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("contas_pagar")
        .select("valor, status, categoria, data_vencimento")
        .eq("status", "pago")
        .gte("data_vencimento", `${periodo}-01`)
        .lte("data_vencimento", `${periodo}-31`) as any);
      if (error) throw error;
      return (data || []) as { valor: number; status: string; categoria: string; data_vencimento: string }[];
    },
  });

  const isLoading = loadingMens || loadingCP;

  const totalReceita = mensalidades.reduce((s, m) => s + m.valor, 0);

  // Group despesas by categoria
  const despesasPorCategoria = contasPagar.reduce<Record<string, number>>((acc, c) => {
    acc[c.categoria] = (acc[c.categoria] ?? 0) + c.valor;
    return acc;
  }, {});

  const totalDespesas = contasPagar.reduce((s, c) => s + c.valor, 0);
  const resultado = totalReceita - totalDespesas;

  const fmt = (v: number) => `R$ ${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const periodoLabel = periodos.find(p => p.value === periodo)?.label ?? periodo;

  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(212_35%_18%)] flex items-center justify-center shadow-md">
            <FileBarChart className="h-5 w-5 text-[hsl(210_55%_70%)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">DRE - Demonstrativo de Resultados</h1>
            <p className="text-sm text-muted-foreground">Análise de receitas, custos e resultado operacional</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 border-[hsl(210_30%_85%)]">
          <Download className="h-4 w-4" />Exportar PDF
        </Button>
      </div>

      <Card className="border-[hsl(210_30%_88%)]">
        <CardContent className="p-4">
          <div className="grid sm:grid-cols-2 gap-3 items-end">
            <div>
              <Label className="text-xs font-medium text-[hsl(212_35%_25%)]">Período</Label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="mt-1 border-[hsl(210_30%_85%)]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {periodos.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card className="border-[hsl(210_30%_88%)] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[hsl(212_35%_18%)] via-[hsl(212_35%_28%)] to-[hsl(210_40%_40%)]" />
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_18%)] border-b-0">
                  <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Descrição</TableHead>
                  <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Valor (R$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* RECEITAS */}
                <TableRow className="bg-[hsl(210_30%_95%)] border-b border-[hsl(210_30%_90%)]">
                  <TableCell colSpan={2} className="font-bold text-[hsl(212_35%_25%)] text-sm">RECEITA OPERACIONAL</TableCell>
                </TableRow>
                <TableRow className="hover:bg-[hsl(210_40%_94%)] border-b border-[hsl(210_30%_90%)]">
                  <TableCell className="pl-8 text-sm">Mensalidades recebidas</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">{fmt(totalReceita)}</TableCell>
                </TableRow>

                {/* DESPESAS */}
                <TableRow className="bg-[hsl(210_30%_95%)] border-b border-[hsl(210_30%_90%)]">
                  <TableCell colSpan={2} className="font-bold text-[hsl(212_35%_25%)] text-sm">DESPESAS OPERACIONAIS</TableCell>
                </TableRow>
                {Object.keys(despesasPorCategoria).length === 0 ? (
                  <TableRow className="border-b border-[hsl(210_30%_90%)]">
                    <TableCell className="pl-8 text-sm text-muted-foreground">Nenhuma despesa registrada</TableCell>
                    <TableCell className="text-right text-muted-foreground">—</TableCell>
                  </TableRow>
                ) : Object.entries(despesasPorCategoria).map(([cat, valor]) => (
                  <TableRow key={cat} className="hover:bg-[hsl(210_40%_94%)] border-b border-[hsl(210_30%_90%)]">
                    <TableCell className="pl-8 text-sm">{cat}</TableCell>
                    <TableCell className="text-right font-semibold text-red-500">- {fmt(valor)}</TableCell>
                  </TableRow>
                ))}

                {/* TOTALS */}
                <TableRow className="bg-[hsl(210_30%_93%)] border-t-2 border-[hsl(212_35%_18%)]">
                  <TableCell className="font-bold text-[hsl(212_35%_18%)]">= TOTAL RECEITAS</TableCell>
                  <TableCell className="text-right font-bold text-green-600">{fmt(totalReceita)}</TableCell>
                </TableRow>
                <TableRow className="bg-[hsl(210_30%_93%)]">
                  <TableCell className="font-bold text-[hsl(212_35%_18%)]">= TOTAL DESPESAS</TableCell>
                  <TableCell className="text-right font-bold text-red-500">- {fmt(totalDespesas)}</TableCell>
                </TableRow>
                <TableRow className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_18%)]">
                  <TableCell className="font-bold text-white text-base">= RESULTADO LÍQUIDO</TableCell>
                  <TableCell className={`text-right font-bold text-base ${resultado >= 0 ? "text-green-300" : "text-red-300"}`}>
                    {resultado < 0 ? "- " : ""}{fmt(resultado)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Dados do período: {periodoLabel} — mensalidades com status "pago" + contas a pagar liquidadas
      </p>
    </div>
  );
}
