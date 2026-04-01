import { useState } from "react";
import { ArrowLeft, Table2, Info, Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Plano {
  id: string;
  nome: string;
  descricao: string | null;
  valor_mensal: number;
  ativo: boolean;
}

interface Regional {
  id: string;
  nome: string;
}

const TIPOS_VEICULO = [
  { id: "todos", label: "Todos", multiplicador: 1.0 },
  { id: "automovel", label: "Automovel", multiplicador: 1.0 },
  { id: "motocicleta", label: "Motocicleta", multiplicador: 0.6 },
  { id: "pesados", label: "Pesados", multiplicador: 1.8 },
  { id: "utilitarios", label: "Utilitarios", multiplicador: 1.2 },
];

const FAIXAS_FIPE = [
  { id: "todas", label: "Todos" },
  { id: "ate20k", label: "Ate R$20k" },
  { id: "20k-40k", label: "R$20k - R$40k" },
  { id: "40k-80k", label: "R$40k - R$80k" },
  { id: "acima80k", label: "Acima de R$80k" },
];

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function badgeClass(tipo: string) {
  if (tipo === "basico" || tipo === "Basico")
    return "bg-muted text-muted-foreground border border-border";
  if (tipo === "intermediario" || tipo === "Intermediario")
    return "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
  return "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
}

interface Props {
  onBack: () => void;
}

export default function TabelaPlanos({ onBack }: Props) {
  const [regional, setRegional] = useState("todas");
  const [tipoVeiculo, setTipoVeiculo] = useState("todos");
  const [faixaFipe, setFaixaFipe] = useState("todas");
  const [detalhe, setDetalhe] = useState<Plano | null>(null);

  // Load regionais from Supabase
  const { data: regionais = [], isLoading: loadingRegionais } = useQuery({
    queryKey: ["tabela_planos_regionais"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("regionais")
        .select("id, nome")
        .order("nome");
      if (error) throw error;
      return (data || []) as Regional[];
    },
  });

  // Load planos from Supabase
  const { data: planos = [], isLoading: loadingPlanos } = useQuery({
    queryKey: ["tabela_planos_lista"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return (data || []) as Plano[];
    },
  });

  const loading = loadingRegionais || loadingPlanos;

  // For now, regional factor is 1.0 (could be extended with a fator column on regionais table)
  const fatorRegional = 1.0;
  const multiplicador =
    TIPOS_VEICULO.find((t) => t.id === tipoVeiculo)?.multiplicador ?? 1.0;

  const regionalLabel =
    regional === "todas"
      ? "Todas"
      : regionais.find((r) => r.id === regional)?.nome ?? "Todas";
  const tipoLabel =
    TIPOS_VEICULO.find((t) => t.id === tipoVeiculo)?.label ?? "Todos";

  return (
    <div className="p-6 lg:px-8 flex flex-col min-h-[calc(100vh-7.5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Financeiro
        </Button>
        <span className="text-muted-foreground">/</span>
        <Table2 className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Tabela de Planos</h1>
      </div>

      {/* Filtros */}
      <Card className="mb-5">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1.5 min-w-[160px]">
              <span className="text-xs font-medium text-muted-foreground">
                Regional
              </span>
              <Select value={regional} onValueChange={setRegional}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {regionais.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[160px]">
              <span className="text-xs font-medium text-muted-foreground">
                Tipo de Veiculo
              </span>
              <Select value={tipoVeiculo} onValueChange={setTipoVeiculo}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_VEICULO.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[190px]">
              <span className="text-xs font-medium text-muted-foreground">
                Faixa de Valor FIPE
              </span>
              <Select value={faixaFipe} onValueChange={setFaixaFipe}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FAIXAS_FIPE.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contexto ativo */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 px-1">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>
          Tipo:{" "}
          <span className="font-medium text-foreground">{tipoLabel}</span>
          {" . "}Regional:{" "}
          <span className="font-medium text-foreground">{regionalLabel}</span>
          {faixaFipe !== "todas" && (
            <>
              {" . "}FIPE:{" "}
              <span className="font-medium text-foreground">
                {FAIXAS_FIPE.find((f) => f.id === faixaFipe)?.label}
              </span>
            </>
          )}
          {" . "}
          <span className="text-muted-foreground/70">
            Duplo clique em uma linha para ver detalhes
          </span>
        </span>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Carregando planos...</span>
        </div>
      ) : planos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhum plano encontrado.</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-right">Valor Mensal</TableHead>
                  <TableHead className="text-right">Multiplicador</TableHead>
                  <TableHead className="text-right">Fator Regional</TableHead>
                  <TableHead className="text-right font-semibold">
                    Valor Final
                  </TableHead>
                  <TableHead className="text-center w-[160px]">Acao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planos.map((plano) => {
                  const valorFinal = (plano.valor_mensal || 0) * multiplicador * fatorRegional;
                  return (
                    <TableRow
                      key={plano.id}
                      className="cursor-pointer select-none hover:bg-muted/40"
                      onDoubleClick={() => setDetalhe(plano)}
                    >
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass(plano.nome)}`}
                        >
                          {plano.nome}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmt(plano.valor_mensal || 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {multiplicador.toFixed(1)}x
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {fatorRegional.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-primary">
                        {fmt(valorFinal)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Calculator className="h-3 w-3" />
                          Usar na Calculadora
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Detalhes */}
      <Dialog
        open={!!detalhe}
        onOpenChange={(open) => {
          if (!open) setDetalhe(null);
        }}
      >
        {detalhe && (
          <DialogContent className="max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass(detalhe.nome)}`}
                >
                  {detalhe.nome}
                </span>
                Detalhes do Plano
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 pt-1">
              {/* Info do plano */}
              <div>
                <p className="text-sm font-medium mb-2">Informacoes</p>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="px-3 py-2 text-muted-foreground">Nome</td>
                        <td className="px-3 py-2 font-medium">{detalhe.nome}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-3 py-2 text-muted-foreground">Descricao</td>
                        <td className="px-3 py-2">{detalhe.descricao || "—"}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-muted-foreground">Valor Mensal</td>
                        <td className="px-3 py-2 font-medium">{fmt(detalhe.valor_mensal || 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Valor por categoria */}
              <div>
                <p className="text-sm font-medium mb-2">
                  Valor base por categoria de veiculo
                </p>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                          Categoria
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">
                          Valor (sem fator regional)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {TIPOS_VEICULO.filter((t) => t.id !== "todos").map(
                        (t) => (
                          <tr key={t.id} className="border-t">
                            <td className="px-3 py-2 text-sm">{t.label}</td>
                            <td className="px-3 py-2 text-right text-sm font-medium">
                              {fmt((detalhe.valor_mensal || 0) * t.multiplicador)}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
