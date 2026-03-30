import { useState } from "react";
import { ArrowLeft, Table2, Info, Calculator } from "lucide-react";
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

interface Props {
  onBack: () => void;
}

const PLANOS = [
  {
    id: "basico",
    label: "Básico",
    valor: 149.9,
    coberturas: [
      "Colisão",
      "Roubo e furto",
      "Incêndio",
      "Assistência 24h básica",
    ],
    carencias: [
      { tipo: "Colisão", prazo: "90 dias" },
      { tipo: "Roubo/Furto", prazo: "60 dias" },
      { tipo: "Incêndio", prazo: "30 dias" },
      { tipo: "Assistência 24h", prazo: "0 dias (imediato)" },
    ],
  },
  {
    id: "intermediario",
    label: "Intermediário",
    valor: 199.9,
    coberturas: [
      "Colisão",
      "Roubo e furto",
      "Incêndio",
      "Assistência 24h completa",
      "Vidros e retrovisores",
      "Carro reserva (5 dias)",
    ],
    carencias: [
      { tipo: "Colisão", prazo: "90 dias" },
      { tipo: "Roubo/Furto", prazo: "60 dias" },
      { tipo: "Incêndio", prazo: "30 dias" },
      { tipo: "Vidros", prazo: "45 dias" },
      { tipo: "Carro reserva", prazo: "60 dias" },
      { tipo: "Assistência 24h", prazo: "0 dias (imediato)" },
    ],
  },
  {
    id: "completo",
    label: "Completo",
    valor: 299.9,
    coberturas: [
      "Colisão",
      "Roubo e furto",
      "Incêndio",
      "Assistência 24h premium",
      "Vidros e retrovisores",
      "Carro reserva (15 dias)",
      "Danos a terceiros",
      "Proteção contra enchente e granizo",
    ],
    carencias: [
      { tipo: "Colisão", prazo: "90 dias" },
      { tipo: "Roubo/Furto", prazo: "60 dias" },
      { tipo: "Incêndio", prazo: "30 dias" },
      { tipo: "Vidros", prazo: "45 dias" },
      { tipo: "Carro reserva", prazo: "60 dias" },
      { tipo: "Danos a terceiros", prazo: "90 dias" },
      { tipo: "Enchente/Granizo", prazo: "90 dias" },
      { tipo: "Assistência 24h", prazo: "0 dias (imediato)" },
    ],
  },
] as const;

type PlanoId = (typeof PLANOS)[number]["id"];
type Plano = (typeof PLANOS)[number];

const TIPOS_VEICULO = [
  { id: "todos", label: "Todos", multiplicador: 1.0 },
  { id: "automovel", label: "Automóvel", multiplicador: 1.0 },
  { id: "motocicleta", label: "Motocicleta", multiplicador: 0.6 },
  { id: "pesados", label: "Pesados", multiplicador: 1.8 },
  { id: "utilitarios", label: "Utilitários", multiplicador: 1.2 },
];

const REGIONAIS = [
  { id: "todas", label: "Todas", fator: 1.0 },
  { id: "Matriz", label: "Matriz", fator: 1.0 },
  { id: "SP Interior", label: "SP Interior", fator: 1.05 },
  { id: "Sul Interior", label: "Sul Interior", fator: 0.98 },
  { id: "Norte Minas Sul", label: "Norte Minas Sul", fator: 0.95 },
  { id: "Minas Interior", label: "Minas Interior", fator: 0.97 },
  { id: "Norte", label: "Norte", fator: 0.92 },
  { id: "Paraná", label: "Paraná", fator: 1.02 },
  { id: "Bahia", label: "Bahia", fator: 0.9 },
  { id: "Ceará", label: "Ceará", fator: 0.88 },
  { id: "Natal", label: "Natal", fator: 0.87 },
  { id: "Alagoas", label: "Alagoas", fator: 0.86 },
  { id: "Mato Grosso Sul", label: "Mato Grosso Sul", fator: 0.93 },
];

const FAIXAS_FIPE = [
  { id: "todas", label: "Todos" },
  { id: "ate20k", label: "Até R$20k" },
  { id: "20k-40k", label: "R$20k – R$40k" },
  { id: "40k-80k", label: "R$40k – R$80k" },
  { id: "acima80k", label: "Acima de R$80k" },
];

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function badgeClass(planoId: PlanoId) {
  if (planoId === "basico")
    return "bg-muted text-muted-foreground border border-border";
  if (planoId === "intermediario")
    return "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
  return "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
}

export default function TabelaPlanos({ onBack }: Props) {
  const [regional, setRegional] = useState("todas");
  const [tipoVeiculo, setTipoVeiculo] = useState("todos");
  const [faixaFipe, setFaixaFipe] = useState("todas");
  const [detalhe, setDetalhe] = useState<Plano | null>(null);

  const fatorRegional = REGIONAIS.find((r) => r.id === regional)?.fator ?? 1.0;
  const multiplicador =
    TIPOS_VEICULO.find((t) => t.id === tipoVeiculo)?.multiplicador ?? 1.0;

  const regionalLabel =
    REGIONAIS.find((r) => r.id === regional)?.label ?? "Todas";
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
                  {REGIONAIS.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[160px]">
              <span className="text-xs font-medium text-muted-foreground">
                Tipo de Veículo
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
          {" · "}Regional:{" "}
          <span className="font-medium text-foreground">{regionalLabel}</span>
          {faixaFipe !== "todas" && (
            <>
              {" · "}FIPE:{" "}
              <span className="font-medium text-foreground">
                {FAIXAS_FIPE.find((f) => f.id === faixaFipe)?.label}
              </span>
            </>
          )}
          {" · "}
          <span className="text-muted-foreground/70">
            Duplo clique em uma linha para ver detalhes
          </span>
        </span>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano</TableHead>
                <TableHead className="text-right">Valor Base</TableHead>
                <TableHead className="text-right">Multiplicador</TableHead>
                <TableHead className="text-right">Fator Regional</TableHead>
                <TableHead className="text-right font-semibold">
                  Valor Final
                </TableHead>
                <TableHead className="text-center w-[160px]">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PLANOS.map((plano) => {
                const valorFinal = plano.valor * multiplicador * fatorRegional;
                return (
                  <TableRow
                    key={plano.id}
                    className="cursor-pointer select-none hover:bg-muted/40"
                    onDoubleClick={() => setDetalhe(plano)}
                  >
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass(plano.id)}`}
                      >
                        {plano.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmt(plano.valor)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {multiplicador.toFixed(1)}×
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
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass(detalhe.id)}`}
                >
                  {detalhe.label}
                </span>
                Detalhes do Plano
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 pt-1">
              {/* Coberturas */}
              <div>
                <p className="text-sm font-medium mb-2">
                  Coberturas incluídas
                </p>
                <ul className="space-y-1.5">
                  {detalhe.coberturas.map((c) => (
                    <li
                      key={c}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Carências */}
              <div>
                <p className="text-sm font-medium mb-2">
                  Carências por tipo de sinistro
                </p>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                          Tipo de Sinistro
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">
                          Carência
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalhe.carencias.map((c) => (
                        <tr key={c.tipo} className="border-t">
                          <td className="px-3 py-2 text-sm">{c.tipo}</td>
                          <td className="px-3 py-2 text-right text-sm text-muted-foreground">
                            {c.prazo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Valor por categoria */}
              <div>
                <p className="text-sm font-medium mb-2">
                  Valor base por categoria de veículo
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
                              {fmt(detalhe.valor * t.multiplicador)}
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
