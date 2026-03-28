import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const regionais = [
  { id: "sudeste", nome: "Sudeste", cotas: 12, cooperativas: 4 },
  { id: "sul", nome: "Sul", cotas: 10, cooperativas: 3 },
  { id: "nordeste", nome: "Nordeste", cotas: 8, cooperativas: 5 },
  { id: "centro-oeste", nome: "Centro-Oeste", cotas: 6, cooperativas: 2 },
  { id: "norte", nome: "Norte", cotas: 5, cooperativas: 2 },
];

const cooperativas = [
  { id: "central-sp", nome: "Central SP", regional: "Sudeste" },
  { id: "litoral-rj", nome: "Litoral RJ", regional: "Sudeste" },
  { id: "vale-mg", nome: "Vale MG", regional: "Sudeste" },
  { id: "serra-rs", nome: "Serra RS", regional: "Sul" },
  { id: "capital-pr", nome: "Capital PR", regional: "Sul" },
  { id: "metro-ba", nome: "Metro BA", regional: "Nordeste" },
  { id: "sertao-pe", nome: "Sertão PE", regional: "Nordeste" },
];

const cotasPreview = [
  { faixa: "R$ 0 - R$ 10.000", mensal: "R$ 89,90" },
  { faixa: "R$ 10.001 - R$ 20.000", mensal: "R$ 119,90" },
  { faixa: "R$ 20.001 - R$ 30.000", mensal: "R$ 149,90" },
  { faixa: "R$ 30.001 - R$ 50.000", mensal: "R$ 199,90" },
  { faixa: "R$ 50.001 - R$ 80.000", mensal: "R$ 279,90" },
];

export default function ReplicarItens({ onBack }: { onBack: () => void }) {
  const [tipo, setTipo] = useState<"regional" | "cooperativa">("regional");
  const [origem, setOrigem] = useState("");
  const [destinos, setDestinos] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const items = tipo === "regional" ? regionais : cooperativas;

  const toggleDestino = (id: string) => {
    setDestinos((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);
  };

  const handleReplicar = () => {
    setDone(true);
    toast.success(`Cotas replicadas para ${destinos.length} ${tipo === "regional" ? "regionais" : "cooperativas"}`);
  };

  if (done) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <h2 className="text-xl font-bold">Replicar Itens</h2>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <p className="font-semibold text-lg">Replicação Concluída!</p>
            <p className="text-sm text-muted-foreground">{cotasPreview.length} cotas replicadas para {destinos.length} destinos</p>
            <Button variant="outline" onClick={() => { setDone(false); setOrigem(""); setDestinos([]); }}>Nova Replicação</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl font-bold">Replicar Itens em Lote</h2>
          <p className="text-sm text-muted-foreground">Copiar cotas e configurações entre regionais ou cooperativas</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Tipo de Replicação</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Button variant={tipo === "regional" ? "default" : "outline"} size="sm" onClick={() => { setTipo("regional"); setOrigem(""); setDestinos([]); }}>Regional → Regionais</Button>
          <Button variant={tipo === "cooperativa" ? "default" : "outline"} size="sm" onClick={() => { setTipo("cooperativa"); setOrigem(""); setDestinos([]); }}>Cooperativa → Cooperativas</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Origem</CardTitle></CardHeader>
          <CardContent>
            <Select value={origem} onValueChange={(v) => { setOrigem(v); setDestinos([]); }}>
              <SelectTrigger><SelectValue placeholder={`Selecione a ${tipo}`} /></SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {origem && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Cotas a replicar:</p>
                {cotasPreview.map((c, i) => (
                  <div key={i} className="flex justify-between text-xs bg-muted/50 rounded px-3 py-1.5">
                    <span>{c.faixa}</span>
                    <span className="font-mono font-medium">{c.mensal}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Destinos</CardTitle>
              {destinos.length > 0 && <Badge variant="secondary">{destinos.length} selecionados</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.filter((item) => item.id !== origem).map((item) => (
              <label key={item.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
                <Checkbox checked={destinos.includes(item.id)} onCheckedChange={() => toggleDestino(item.id)} />
                <span className="text-sm">{item.nome}</span>
                {"regional" in item && <Badge variant="outline" className="text-xs ml-auto">{(item as any).regional}</Badge>}
              </label>
            ))}
            {!origem && <p className="text-xs text-muted-foreground text-center py-4">Selecione a origem primeiro</p>}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleReplicar} disabled={!origem || destinos.length === 0} className="gap-1.5">
          <Copy className="h-4 w-4" />Replicar {destinos.length > 0 ? `(${destinos.length})` : ""}
        </Button>
      </div>
    </div>
  );
}
