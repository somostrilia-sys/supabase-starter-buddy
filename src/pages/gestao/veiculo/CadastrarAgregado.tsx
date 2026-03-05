import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Car, UserPlus, User, Check, Trash2 } from "lucide-react";
import { mockVeiculos, type MockVeiculo, type MockAgregado } from "./mockVeiculos";

export default function CadastrarAgregado() {
  const [searchVeic, setSearchVeic] = useState("");
  const [selectedVeic, setSelectedVeic] = useState<MockVeiculo | null>(null);
  const [form, setForm] = useState({ nome: "", cpf: "", cnh: "", parentesco: "", telefone: "" });

  const filteredVeic = searchVeic.length >= 2
    ? mockVeiculos.filter(v =>
        v.placa.toLowerCase().includes(searchVeic.toLowerCase()) ||
        v.associadoNome.toLowerCase().includes(searchVeic.toLowerCase())
      ).slice(0, 5)
    : [];

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const maskCpf = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
    return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
  };

  const maskTel = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  };

  const handleAdd = () => {
    if (!selectedVeic || !form.nome || !form.cpf) return;
    toast.success("Agregado cadastrado com sucesso!", {
      description: `${form.nome} vinculado ao veículo ${selectedVeic.placa}`,
    });
    setForm({ nome: "", cpf: "", cnh: "", parentesco: "", telefone: "" });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-lg font-bold mb-6">Cadastrar Agregado no Veículo</h2>

      {/* Step 1: Select Vehicle */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Car className="h-4 w-4" /> 1. Selecionar Veículo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchVeic} onChange={e => { setSearchVeic(e.target.value); setSelectedVeic(null); }} placeholder="Buscar por placa ou nome do associado" className="pl-10" />
          </div>

          {selectedVeic ? (
            <Card className="border-primary">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-mono font-medium text-sm">{selectedVeic.placa} - {selectedVeic.marca} {selectedVeic.modelo}</p>
                  <p className="text-xs text-muted-foreground">Associado: {selectedVeic.associadoNome}</p>
                </div>
                <Check className="h-5 w-5 text-primary" />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredVeic.map(v => (
                <Card key={v.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => { setSelectedVeic(v); setSearchVeic(v.placa); }}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium font-mono">{v.placa} - {v.marca} {v.modelo}</p>
                      <p className="text-xs text-muted-foreground">{v.associadoNome}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Aggregates */}
      {selectedVeic && selectedVeic.agregados.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" /> Agregados Atuais
              <Badge variant="outline" className="ml-auto">{selectedVeic.agregados.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedVeic.agregados.map(ag => (
              <div key={ag.id} className="flex items-center gap-3 p-2 rounded-md border">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{ag.nome}</p>
                  <p className="text-xs text-muted-foreground">{ag.cpf} • {ag.parentesco}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Add New */}
      {selectedVeic && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> 2. Dados do Agregado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Nome Completo *</Label>
                <Input value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Nome do condutor agregado" />
              </div>
              <div>
                <Label>CPF *</Label>
                <Input value={form.cpf} onChange={e => set("cpf", maskCpf(e.target.value))} placeholder="000.000.000-00" />
              </div>
              <div>
                <Label>CNH</Label>
                <Input value={form.cnh} onChange={e => set("cnh", e.target.value)} placeholder="Número da CNH" />
              </div>
              <div>
                <Label>Parentesco</Label>
                <Select value={form.parentesco} onValueChange={v => set("parentesco", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {["Cônjuge", "Filho(a)", "Pai/Mãe", "Irmão(ã)", "Outro"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={e => set("telefone", maskTel(e.target.value))} placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div className="pt-4 border-t">
              <Button onClick={handleAdd} disabled={!form.nome || form.cpf.replace(/\D/g, "").length < 11} className="gap-2">
                <UserPlus className="h-4 w-4" /> Cadastrar Agregado
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
