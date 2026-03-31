import { useState } from "react";
import { ArrowLeft, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Props {
  onBack: () => void;
}

const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyamllZ3RxZm5nZGxpd2NscHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTY3MzMsImV4cCI6MjA5MDI5MjczM30.yZWSOqQwWhG_OcF-uNLvvy_ZwRYd2OC_Jjr5R_9Gucw";
const SUPABASE_FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const PLANOS = [
  { id: "basico", label: "Básico", valor: 149.9 },
  { id: "intermediario", label: "Intermediário", valor: 199.9 },
  { id: "completo", label: "Completo", valor: 299.9 },
];

const TIPOS_VEICULO = [
  { id: "automovel", label: "Automóvel", multiplicador: 1.0 },
  { id: "motocicleta", label: "Motocicleta", multiplicador: 0.6 },
  { id: "pesados", label: "Pesados", multiplicador: 1.8 },
  { id: "utilitarios", label: "Utilitários", multiplicador: 1.2 },
];

const REGIONAIS = [
  { id: "Matriz", label: "Matriz", fator: 1.0 },
  { id: "SP Interior", label: "SP Interior", fator: 1.05 },
  { id: "Sul Interior", label: "Sul Interior", fator: 0.95 },
  { id: "Norte Minas Sul", label: "Norte Minas Sul", fator: 0.95 },
  { id: "Minas Interior", label: "Minas Interior", fator: 0.95 },
  { id: "Norte", label: "Norte", fator: 0.95 },
  { id: "Paraná", label: "Paraná", fator: 0.95 },
  { id: "Bahia", label: "Bahia", fator: 0.95 },
  { id: "Ceará", label: "Ceará", fator: 0.95 },
  { id: "Natal", label: "Natal", fator: 0.95 },
  { id: "Alagoas", label: "Alagoas", fator: 0.95 },
  { id: "Mato Grosso Sul", label: "Mato Grosso Sul", fator: 0.95 },
];

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface Resultado {
  planoBase: number;
  taxaAdmin: number;
  rateio: number;
  total: number;
  planoLabel: string;
}

export default function CalculadoraMensalidade({ onBack }: Props) {
  const [valorFipe, setValorFipe] = useState("");
  const [tipoVeiculo, setTipoVeiculo] = useState("");
  const [regional, setRegional] = useState("");
  const [planoId, setPlanoId] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  function calcularLocal(valorPlano: number, tipoId: string, regionalId: string): { taxaAdmin: number; rateio: number } {
    const tipo = TIPOS_VEICULO.find((t) => t.id === tipoId);
    const reg = REGIONAIS.find((r) => r.id === regionalId);
    const multiplicador = tipo?.multiplicador ?? 1.0;
    const fator = reg?.fator ?? 1.0;
    const taxaAdmin = valorPlano * 0.08;
    const rateio = valorPlano * (multiplicador / 100) * fator;
    return { taxaAdmin, rateio };
  }

  async function calcular() {
    const plano = PLANOS.find((p) => p.id === planoId);
    if (!plano || !tipoVeiculo || !regional) return;

    const valorPlano = plano.valor;
    setLoading(true);

    let taxaAdmin = 0;
    let rateio = 0;

    try {
      const [resTaxa, resRateio] = await Promise.all([
        fetch(`${SUPABASE_FN}/calcular-taxa-admin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ANON_KEY}`,
          },
          body: JSON.stringify({ valor_plano: valorPlano, company_id: "objetivo" }),
        }),
        fetch(`${SUPABASE_FN}/calcular-rateio`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ANON_KEY}`,
          },
          body: JSON.stringify({
            plano: planoId,
            valor_base: valorPlano,
            regiao: regional,
            tipo_veiculo: tipoVeiculo,
            company_id: "objetivo",
          }),
        }),
      ]);

      if (resTaxa.ok && resRateio.ok) {
        const dataTaxa = await resTaxa.json();
        const dataRateio = await resRateio.json();
        taxaAdmin = dataTaxa.taxa_admin ?? dataTaxa.valor ?? calcularLocal(valorPlano, tipoVeiculo, regional).taxaAdmin;
        rateio = dataRateio.rateio ?? dataRateio.valor ?? calcularLocal(valorPlano, tipoVeiculo, regional).rateio;
      } else {
        const local = calcularLocal(valorPlano, tipoVeiculo, regional);
        taxaAdmin = local.taxaAdmin;
        rateio = local.rateio;
      }
    } catch {
      const local = calcularLocal(valorPlano, tipoVeiculo, regional);
      taxaAdmin = local.taxaAdmin;
      rateio = local.rateio;
    }

    setResultado({
      planoBase: valorPlano,
      taxaAdmin,
      rateio,
      total: valorPlano + taxaAdmin + rateio,
      planoLabel: plano.label,
    });
    setLoading(false);
  }

  function novaSimulacao() {
    setResultado(null);
    setValorFipe("");
    setTipoVeiculo("");
    setRegional("");
    setPlanoId("");
  }

  const podeCalcular = !!planoId && !!tipoVeiculo && !!regional;

  return (
    <div className="p-6 lg:px-8 flex flex-col min-h-[calc(100vh-7.5rem)]">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Financeiro
        </Button>
        <span className="text-muted-foreground">/</span>
        <Calculator className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Calculadora de Mensalidade</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados da Simulação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fipe">Valor FIPE do Veículo</Label>
              <Input
                id="fipe"
                type="number"
                placeholder="Ex: 45000"
                value={valorFipe}
                onChange={(e) => setValorFipe(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de Veículo</Label>
              <Select value={tipoVeiculo} onValueChange={setTipoVeiculo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
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

            <div className="space-y-1.5">
              <Label>Regional</Label>
              <Select value={regional} onValueChange={setRegional}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a regional" />
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

            <div className="space-y-1.5">
              <Label>Plano</Label>
              <Select value={planoId} onValueChange={setPlanoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  {PLANOS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label} — {fmt(p.valor)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full mt-2"
              onClick={calcular}
              disabled={!podeCalcular || loading}
            >
              {loading ? "Calculando..." : "Calcular"}
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
        {resultado && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resultado — Plano {resultado.planoLabel}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Componente</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Plano Base</TableCell>
                    <TableCell className="text-right">{fmt(resultado.planoBase)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Taxa Administrativa</TableCell>
                    <TableCell className="text-right">{fmt(resultado.taxaAdmin)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Rateio Regional</TableCell>
                    <TableCell className="text-right">{fmt(resultado.rateio)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="flex items-center justify-between px-1 pt-2 border-t">
                <span className="font-semibold text-sm">TOTAL MENSAL</span>
                <Badge variant="default" className="text-sm px-3 py-1">
                  {fmt(resultado.total)}
                </Badge>
              </div>

              <Button variant="outline" className="w-full" onClick={novaSimulacao}>
                Nova simulação
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
