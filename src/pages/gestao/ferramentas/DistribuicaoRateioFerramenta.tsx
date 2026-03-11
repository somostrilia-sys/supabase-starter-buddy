import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft, Calculator, CalendarIcon, DollarSign, Info, Loader2, Save, Trash2,
} from "lucide-react";
import { toast } from "sonner";

const categoriasOpcao = ["Automóvel", "Motocicleta", "Pesado", "Van"];
const regionaisOpcao = ["Sul", "Norte", "Sudeste", "Nordeste", "Centro-Oeste"];
const mesesRef = ["2026-03", "2026-02", "2026-01", "2025-12", "2025-11", "2025-10"];

interface CotaCalc {
  cota: string;
  multiplicador: number;
  valor: number;
}

const multiplicadores: { cota: string; mult: number }[] = [
  { cota: "1ª", mult: 1.0 },
  { cota: "2ª", mult: 1.5 },
  { cota: "3ª", mult: 2.0 },
  { cota: "4ª", mult: 2.5 },
  { cota: "5ª", mult: 3.0 },
];

export default function DistribuicaoRateioFerramenta({ onBack }: { onBack: () => void }) {
  const [mesRef, setMesRef] = useState("");
  const [categoria, setCategoria] = useState("");
  const [regional, setRegional] = useState("");
  const [valorBase, setValorBase] = useState("");
  const [dataLimite, setDataLimite] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<CotaCalc[] | null>(null);

  const calcular = async () => {
    if (!mesRef || !categoria || !valorBase) {
      return toast.error("Preencha mês, categoria e valor base");
    }
    const vb = parseFloat(valorBase.replace(",", "."));
    if (isNaN(vb) || vb <= 0) return toast.error("Valor base inválido");

    setLoading(true);
    // Simulate edge function call
    try {
      await new Promise(r => setTimeout(r, 800));
      const res = multiplicadores.map(m => ({
        cota: m.cota,
        multiplicador: m.mult,
        valor: vb * m.mult,
      }));
      setResultado(res);
      toast.success("Rateio calculado com sucesso!");
    } catch {
      toast.error("Erro ao calcular rateio");
    } finally {
      setLoading(false);
    }
  };

  const total = resultado?.reduce((s, r) => s + r.valor, 0) || 0;
  const pctTotal = resultado ? 100 : 0;

  const salvar = () => {
    toast.success(`Rateio ${mesRef} gravado — Total: R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    setResultado(null);
    setValorBase("");
  };

  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Calculator className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Distribuição de Rateio</h1>
      </div>

      {/* Info card */}
      <Card className="border-border bg-muted/30">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Conceito Mutualista</p>
            <p className="text-xs text-muted-foreground mt-1">
              O rateio distribui o custo entre associados ativos por categoria e regional.
              O valor base (1ª cota) é definido manualmente e as demais são calculadas:
              <strong> Valor Cota N = Valor Base × Multiplicador</strong>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Parâmetros do Rateio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Mês Referência *</Label>
              <Select value={mesRef} onValueChange={setMesRef}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {mesesRef.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Categoria *</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categoriasOpcao.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Regional (opcional)</Label>
              <Select value={regional} onValueChange={setRegional}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {regionaisOpcao.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Valor Base 1ª Cota (R$) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={valorBase}
                  onChange={e => setValorBase(e.target.value)}
                  placeholder="0,00"
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Data Limite Contrato</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataLimite && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataLimite ? format(dataLimite, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataLimite} onSelect={setDataLimite} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-end">
              <Button onClick={calcular} disabled={loading} className="gap-2 w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                Calcular Rateio
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {resultado && (
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Resultado do Cálculo</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">{mesRef}</Badge>
                <Badge variant="outline" className="text-xs">{categoria}</Badge>
                {regional && regional !== "todas" && <Badge variant="outline" className="text-xs">{regional}</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Cota</TableHead>
                    <TableHead className="text-xs text-right">Multiplicador</TableHead>
                    <TableHead className="text-xs text-right">Valor (R$)</TableHead>
                    <TableHead className="text-xs text-right">% do Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultado.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm font-medium">{r.cota}</TableCell>
                      <TableCell className="text-sm text-right font-mono">{r.multiplicador.toFixed(1)}x</TableCell>
                      <TableCell className="text-sm text-right font-bold font-mono">
                        R$ {r.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-sm text-right text-muted-foreground">
                        {((r.valor / total) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell className="text-sm">TOTAL</TableCell>
                    <TableCell className="text-sm text-right">—</TableCell>
                    <TableCell className="text-sm text-right font-mono">
                      R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-sm text-right">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-border"><CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Valor Base</p>
                <p className="text-lg font-bold">R$ {parseFloat(valorBase.replace(",", ".")).toFixed(2)}</p>
              </CardContent></Card>
              <Card className="border-border"><CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Cotas</p>
                <p className="text-lg font-bold">{resultado.length}</p>
              </CardContent></Card>
              <Card className="border-border"><CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Maior Cota</p>
                <p className="text-lg font-bold">R$ {Math.max(...resultado.map(r => r.valor)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </CardContent></Card>
              <Card className="border-border"><CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-primary">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </CardContent></Card>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setResultado(null)} className="gap-2">
                <Trash2 className="h-4 w-4" />Limpar
              </Button>
              <Button onClick={salvar} className="gap-2">
                <Save className="h-4 w-4" />Gravar Rateio
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
