import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Car, DollarSign } from "lucide-react";
import { toast } from "sonner";

// FIPE lookup requires external API integration (e.g., https://brasilapi.com.br/docs#tag/FIPE)
// Marca/Modelo/Ano selects are empty until API is connected
const marcas: string[] = [];
const modelosPorMarca: Record<string, string[]> = {};
const anos = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"];

interface FipeResult {
  marca: string;
  modelo: string;
  ano: string;
  valor: number;
  codFipe: string;
}

interface ConsultaFipeProps {
  onSelect?: (result: FipeResult) => void;
  compact?: boolean;
}

export default function ConsultaFipe({ onSelect, compact = false }: ConsultaFipeProps) {
  const [modo, setModo] = useState<"codigo" | "cascata">("codigo");
  const [codigoFipe, setCodigoFipe] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [ano, setAno] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FipeResult | null>(null);

  const buscarPorCodigo = async () => {
    if (!codigoFipe.trim()) return toast.error("Digite o código FIPE");
    setLoading(true);
    try {
      // TODO: Integrate with FIPE external API (e.g., BrasilAPI)
      await new Promise(r => setTimeout(r, 300));
      toast.info("Integração com API FIPE pendente de configuração");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const buscarPorCascata = async () => {
    if (!marca || !modelo || !ano) return toast.error("Selecione marca, modelo e ano");
    setLoading(true);
    try {
      // TODO: Integrate with FIPE external API (e.g., BrasilAPI)
      await new Promise(r => setTimeout(r, 300));
      toast.info("Integração com API FIPE pendente de configuração");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    if (result && onSelect) {
      onSelect(result);
      toast.success("Dados FIPE aplicados ao cadastro!");
    }
  };

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          variant={modo === "codigo" ? "default" : "outline"}
          size="sm"
          onClick={() => { setModo("codigo"); setResult(null); }}
          className="text-xs"
        >
          Por Código FIPE
        </Button>
        <Button
          variant={modo === "cascata" ? "default" : "outline"}
          size="sm"
          onClick={() => { setModo("cascata"); setResult(null); }}
          className="text-xs"
        >
          Por Marca/Modelo
        </Button>
      </div>

      {modo === "codigo" ? (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label className="text-xs">Código FIPE</Label>
            <Input
              value={codigoFipe}
              onChange={e => setCodigoFipe(e.target.value)}
              placeholder="Ex: 004399-0"
            />
          </div>
          <Button onClick={buscarPorCodigo} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Marca</Label>
            <Select value={marca} onValueChange={v => { setMarca(v); setModelo(""); setResult(null); }}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{marcas.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Modelo</Label>
            <Select value={modelo} onValueChange={v => { setModelo(v); setResult(null); }} disabled={!marca}>
              <SelectTrigger><SelectValue placeholder={marca ? "Selecione" : "Escolha marca"} /></SelectTrigger>
              <SelectContent>
                {(modelosPorMarca[marca] || []).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Ano</Label>
            <div className="flex gap-2">
              <Select value={ano} onValueChange={v => { setAno(v); setResult(null); }} disabled={!modelo}>
                <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                <SelectContent>{anos.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
              <Button onClick={buscarPorCascata} disabled={loading || !ano} size="icon" className="shrink-0">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FIPE Result */}
      {result && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                Tabela FIPE — Referência Março/2026
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">Cód: {result.codFipe}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Car className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{result.marca}</p>
                <p className="text-xs text-muted-foreground">{result.modelo} — {result.ano}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 justify-end">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold text-primary">
                    {result.valor.toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">Valor FIPE</p>
              </div>
            </div>
            {onSelect && (
              <Button onClick={handleSelect} className="w-full mt-3 gap-2" size="sm">
                Aplicar ao Cadastro
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
