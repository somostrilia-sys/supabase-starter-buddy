import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Car, ClipboardCheck, Check, X, Upload, Calendar } from "lucide-react";
import { mockVeiculos, checklistLabels, type MockVeiculo } from "./mockVeiculos";

export default function CadastrarVistoria() {
  const [searchVeic, setSearchVeic] = useState("");
  const [selectedVeic, setSelectedVeic] = useState<MockVeiculo | null>(null);
  const [form, setForm] = useState({
    tipo: "",
    data: new Date().toISOString().split("T")[0],
    resultado: "",
    inspetor: "",
    observacoes: "",
  });
  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    Object.fromEntries(checklistLabels.map(item => [item, true]))
  );

  const filteredVeic = searchVeic.length >= 2
    ? mockVeiculos.filter(v =>
        v.placa.toLowerCase().includes(searchVeic.toLowerCase()) ||
        v.associadoNome.toLowerCase().includes(searchVeic.toLowerCase())
      ).slice(0, 5)
    : [];

  const toggleItem = (item: string) => setChecklist(p => ({ ...p, [item]: !p[item] }));
  const allChecked = Object.values(checklist).every(Boolean);
  const checkedCount = Object.values(checklist).filter(Boolean).length;

  const handleSubmit = () => {
    if (!selectedVeic || !form.tipo || !form.resultado) return;
    toast.success("Vistoria registrada com sucesso!", {
      description: `${selectedVeic.placa} - ${form.tipo} - ${form.resultado}`,
    });
    setSelectedVeic(null);
    setSearchVeic("");
    setForm({ tipo: "", data: new Date().toISOString().split("T")[0], resultado: "", inspetor: "", observacoes: "" });
    setChecklist(Object.fromEntries(checklistLabels.map(item => [item, true])));
  };

  const vistoriaColor = (r: string) => {
    if (r === "Aprovada") return "bg-emerald-500/10 text-emerald-600";
    if (r === "Reprovada") return "bg-destructive/10 text-destructive";
    return "bg-amber-500/10 text-amber-600";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-lg font-bold mb-6">Cadastrar Vistoria</h2>

      {/* Select Vehicle */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Car className="h-4 w-4" /> 1. Selecionar Veículo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchVeic} onChange={e => { setSearchVeic(e.target.value); setSelectedVeic(null); }} placeholder="Buscar por placa ou associado" className="pl-10" />
          </div>
          {selectedVeic ? (
            <Card className="border-primary">
              <CardContent className="p-3 flex items-center gap-3">
                <Car className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-mono font-medium text-sm">{selectedVeic.placa} - {selectedVeic.marca} {selectedVeic.modelo}</p>
                  <p className="text-xs text-muted-foreground">{selectedVeic.associadoNome}</p>
                </div>
                <Check className="h-5 w-5 text-primary" />
              </CardContent>
            </Card>
          ) : (
            filteredVeic.map(v => (
              <Card key={v.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => { setSelectedVeic(v); setSearchVeic(v.placa); }}>
                <CardContent className="p-3 flex items-center gap-3">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium font-mono">{v.placa} - {v.marca} {v.modelo}</p>
                    <p className="text-xs text-muted-foreground">{v.associadoNome}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {selectedVeic && (
        <>
          {/* Vistoria Form */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" /> 2. Dados da Vistoria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Tipo *</Label>
                  <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                    <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                      {["Admissão", "Periódica", "Transferência"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data *</Label>
                  <Input type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} />
                </div>
                <div>
                  <Label>Resultado *</Label>
                  <Select value={form.resultado} onValueChange={v => setForm(p => ({ ...p, resultado: v }))}>
                    <SelectTrigger><SelectValue placeholder="Resultado" /></SelectTrigger>
                    <SelectContent>
                      {["Aprovada", "Reprovada", "Pendente"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Inspetor</Label>
                  <Select value={form.inspetor} onValueChange={v => setForm(p => ({ ...p, inspetor: v }))}>
                    <SelectTrigger><SelectValue placeholder="Inspetor" /></SelectTrigger>
                    <SelectContent>
                      {["João Ferreira", "André Costa", "Luciana Almeida", "Roberto Dias"].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checklist */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" /> 3. Checklist de Itens
                </CardTitle>
                <Badge variant="outline" className={allChecked ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}>
                  {checkedCount}/{checklistLabels.length} OK
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {checklistLabels.map(item => (
                  <div
                    key={item}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      checklist[item] ? "bg-emerald-500/5 border-emerald-200" : "bg-destructive/5 border-destructive/20"
                    }`}
                    onClick={() => toggleItem(item)}
                  >
                    <Checkbox checked={checklist[item]} onCheckedChange={() => toggleItem(item)} />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Observations & Photos */}
          <Card className="mb-6">
            <CardContent className="p-4 space-y-4">
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={form.observacoes}
                  onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
                  placeholder="Observações sobre a vistoria..."
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Fotos da Vistoria</Label>
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="h-3.5 w-3.5" /> Adicionar Fotos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Historical Vistorias */}
          {selectedVeic.vistorias.length > 0 && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Histórico de Vistorias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative border-l-2 border-muted ml-3 space-y-4">
                  {selectedVeic.vistorias.map(vist => (
                    <div key={vist.id} className="ml-4 relative">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-card bg-primary" />
                      <div className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">{vist.tipo}</p>
                          <Badge variant="outline" className={vistoriaColor(vist.resultado)}>{vist.resultado}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(vist.data).toLocaleDateString("pt-BR")} • {vist.inspetor}</p>
                        {vist.observacoes && <p className="text-xs text-muted-foreground mt-1">{vist.observacoes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Button onClick={handleSubmit} disabled={!form.tipo || !form.resultado} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <ClipboardCheck className="h-4 w-4" /> Registrar Vistoria
          </Button>
        </>
      )}
    </div>
  );
}
