import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, User, Car, Link2, Check, ArrowRight } from "lucide-react";
import { mockAssociados, mockVeiculosDisponiveis, type MockAssociado } from "./mockAssociados";

export default function VincularAssociado() {
  const [searchAssoc, setSearchAssoc] = useState("");
  const [searchVeic, setSearchVeic] = useState("");
  const [selectedAssoc, setSelectedAssoc] = useState<MockAssociado | null>(null);
  const [selectedVeic, setSelectedVeic] = useState<typeof mockVeiculosDisponiveis[0] | null>(null);

  const filteredAssoc = searchAssoc.length >= 2
    ? mockAssociados.filter(a =>
        a.nome.toLowerCase().includes(searchAssoc.toLowerCase()) ||
        a.cpf.replace(/\D/g, "").includes(searchAssoc.replace(/\D/g, "")) ||
        a.veiculos.some(v => v.placa.toLowerCase().includes(searchAssoc.toLowerCase()))
      ).slice(0, 5)
    : [];

  const filteredVeic = searchVeic.length >= 2
    ? mockVeiculosDisponiveis.filter(v =>
        v.placa.toLowerCase().includes(searchVeic.toLowerCase()) ||
        v.modelo.toLowerCase().includes(searchVeic.toLowerCase())
      )
    : mockVeiculosDisponiveis;

  const handleVincular = () => {
    if (!selectedAssoc || !selectedVeic) return;
    toast.success("Veículo vinculado com sucesso!", {
      description: `${selectedVeic.placa} - ${selectedVeic.modelo} → ${selectedAssoc.nome}`,
    });
    setSelectedAssoc(null);
    setSelectedVeic(null);
    setSearchAssoc("");
    setSearchVeic("");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-lg font-bold mb-6">Vincular Associado a Veículo</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Associado */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4" /> 1. Selecionar Associado
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchAssoc}
              onChange={e => { setSearchAssoc(e.target.value); setSelectedAssoc(null); }}
              placeholder="Buscar por nome, CPF ou placa"
              className="pl-10"
            />
          </div>

          {selectedAssoc ? (
            <Card className="border-primary">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{selectedAssoc.nome}</p>
                  <p className="text-xs text-muted-foreground">{selectedAssoc.cpf} • {selectedAssoc.codigo}</p>
                </div>
                <Check className="h-5 w-5 text-primary" />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredAssoc.map(a => (
                <Card
                  key={a.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => { setSelectedAssoc(a); setSearchAssoc(a.nome); }}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{a.nome}</p>
                      <p className="text-xs text-muted-foreground">{a.cpf}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Veículo */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-semibold">
            <Car className="h-4 w-4" /> 2. Selecionar Veículo
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchVeic}
              onChange={e => { setSearchVeic(e.target.value); setSelectedVeic(null); }}
              placeholder="Buscar por placa ou modelo"
              className="pl-10"
            />
          </div>

          <div className="space-y-2">
            {filteredVeic.map(v => {
              const isSelected = selectedVeic?.id === v.id;
              return (
                <Card
                  key={v.id}
                  className={`cursor-pointer transition-colors ${isSelected ? "border-primary" : "hover:border-primary/50"}`}
                  onClick={() => setSelectedVeic(v)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? "bg-primary/10" : "bg-muted"}`}>
                      <Car className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{v.modelo} ({v.ano})</p>
                      <p className="text-xs text-muted-foreground font-mono">{v.placa}</p>
                    </div>
                    {isSelected && <Check className="h-5 w-5 text-primary" />}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation */}
      {selectedAssoc && selectedVeic && (
        <Card className="mt-6 border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <p className="text-xs font-medium truncate max-w-[120px]">{selectedAssoc.nome}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary shrink-0" />
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <p className="text-xs font-medium font-mono">{selectedVeic.placa}</p>
              </div>
            </div>
            <Button onClick={handleVincular} className="w-full gap-2">
              <Link2 className="h-4 w-4" /> Confirmar Vinculação
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
