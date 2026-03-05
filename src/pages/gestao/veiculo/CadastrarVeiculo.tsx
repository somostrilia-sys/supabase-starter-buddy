import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, ChevronRight, Upload, Car, User, Search as SearchIcon, Loader2 } from "lucide-react";
import { fipeMock } from "./mockVeiculos";
import { mockAssociados } from "../associado/mockAssociados";

const steps = [
  { label: "Veículo", icon: Car },
  { label: "Associado", icon: User },
];

const ufs = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

export default function CadastrarVeiculo() {
  const [step, setStep] = useState(0);
  const [fipeLoading, setFipeLoading] = useState(false);
  const [fipeResults, setFipeResults] = useState<typeof fipeMock["Chevrolet"]>([]);
  const [searchAssoc, setSearchAssoc] = useState("");
  const [selectedAssoc, setSelectedAssoc] = useState<string | null>(null);

  const [form, setForm] = useState({
    placa: "", chassi: "", marca: "", modelo: "", ano: "", anoModelo: "",
    tipo: "", categoria: "", cota: "", cor: "", combustivel: "", cambio: "",
    motor: "", valorFipe: "", km: "",
  });

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const maskPlaca = (v: string) => {
    return v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  };

  const consultarFipe = () => {
    if (!form.marca) { toast.error("Selecione a marca primeiro"); return; }
    setFipeLoading(true);
    setTimeout(() => {
      const results = fipeMock[form.marca] || [];
      setFipeResults(results);
      setFipeLoading(false);
      if (results.length === 0) toast.info("Nenhum resultado FIPE encontrado para esta marca");
    }, 800);
  };

  const selectFipe = (item: typeof fipeMock["Chevrolet"][0]) => {
    setForm(p => ({
      ...p,
      modelo: item.modelo,
      ano: String(item.ano),
      anoModelo: String(item.ano),
      valorFipe: String(item.valor),
    }));
    toast.success(`FIPE aplicado: ${item.modelo} ${item.ano}`);
  };

  const filteredAssoc = searchAssoc.length >= 2
    ? mockAssociados.filter(a =>
        a.nome.toLowerCase().includes(searchAssoc.toLowerCase()) ||
        a.cpf.replace(/\D/g, "").includes(searchAssoc.replace(/\D/g, ""))
      ).slice(0, 5)
    : [];

  const canNext = () => {
    if (step === 0) return form.placa.length === 7 && form.marca && form.modelo;
    if (step === 1) return !!selectedAssoc;
    return false;
  };

  const handleSubmit = () => {
    const assoc = mockAssociados.find(a => a.id === selectedAssoc);
    toast.success("Veículo cadastrado com sucesso!", {
      description: `${form.placa} - ${form.modelo} vinculado a ${assoc?.nome}`,
    });
    setStep(0);
    setForm({ placa: "", chassi: "", marca: "", modelo: "", ano: "", anoModelo: "", tipo: "", categoria: "", cota: "", cor: "", combustivel: "", cambio: "", motor: "", valorFipe: "", km: "" });
    setSelectedAssoc(null);
    setSearchAssoc("");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-lg font-bold mb-6">Cadastrar Veículo</h2>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                i === step ? "bg-primary text-primary-foreground font-semibold" :
                i < step ? "bg-primary/10 text-primary cursor-pointer" :
                "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
              <span>{s.label}</span>
            </button>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{steps[step].label}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Placa Mercosul *</Label>
                  <Input value={form.placa} onChange={e => set("placa", maskPlaca(e.target.value))} placeholder="ABC1D23" className="font-mono uppercase" maxLength={7} />
                </div>
                <div>
                  <Label>Chassi</Label>
                  <Input value={form.chassi} onChange={e => set("chassi", e.target.value.toUpperCase())} placeholder="9BRXXXXXXXXXXX" maxLength={17} className="font-mono" />
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <Select value={form.tipo} onValueChange={v => set("tipo", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {["Automóvel", "Moto", "Caminhão", "Van/Utilitário"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* FIPE Section */}
              <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Consulta FIPE</Label>
                  <Badge variant="outline" className="text-xs">Tabela Referência</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <Label className="text-xs">Marca *</Label>
                    <Select value={form.marca} onValueChange={v => { set("marca", v); setFipeResults([]); }}>
                      <SelectTrigger><SelectValue placeholder="Marca" /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(fipeMock).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Button variant="outline" onClick={consultarFipe} disabled={!form.marca || fipeLoading} className="gap-2">
                      {fipeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
                      Consultar FIPE
                    </Button>
                  </div>
                </div>
                {fipeResults.length > 0 && (
                  <div className="grid gap-2">
                    {fipeResults.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-md border bg-card hover:border-primary/50 cursor-pointer transition-colors" onClick={() => selectFipe(r)}>
                        <div>
                          <p className="text-sm font-medium">{r.modelo} ({r.ano})</p>
                          <p className="text-xs text-muted-foreground">{r.marca}</p>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                          R$ {r.valor.toLocaleString("pt-BR")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Modelo *</Label>
                  <Input value={form.modelo} onChange={e => set("modelo", e.target.value)} placeholder="Modelo" />
                </div>
                <div>
                  <Label>Ano Fabricação</Label>
                  <Input type="number" value={form.ano} onChange={e => set("ano", e.target.value)} placeholder="2024" />
                </div>
                <div>
                  <Label>Ano Modelo</Label>
                  <Input type="number" value={form.anoModelo} onChange={e => set("anoModelo", e.target.value)} placeholder="2025" />
                </div>
                <div>
                  <Label>Cor</Label>
                  <Select value={form.cor} onValueChange={v => set("cor", v)}>
                    <SelectTrigger><SelectValue placeholder="Cor" /></SelectTrigger>
                    <SelectContent>
                      {["Branco", "Prata", "Preto", "Cinza", "Vermelho", "Azul", "Bege", "Marrom"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Combustível</Label>
                  <Select value={form.combustivel} onValueChange={v => set("combustivel", v)}>
                    <SelectTrigger><SelectValue placeholder="Combustível" /></SelectTrigger>
                    <SelectContent>
                      {["Flex", "Gasolina", "Diesel", "Etanol", "Elétrico"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Câmbio</Label>
                  <Select value={form.cambio} onValueChange={v => set("cambio", v)}>
                    <SelectTrigger><SelectValue placeholder="Câmbio" /></SelectTrigger>
                    <SelectContent>
                      {["Automático", "Manual", "CVT", "Automatizado"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.categoria} onValueChange={v => set("categoria", v)}>
                    <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                    <SelectContent>
                      {["Passeio", "Trabalho", "Frota", "Especial"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cota</Label>
                  <Select value={form.cota} onValueChange={v => set("cota", v)}>
                    <SelectTrigger><SelectValue placeholder="Cota" /></SelectTrigger>
                    <SelectContent>
                      {["Cota A", "Cota B", "Cota C", "Cota D"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor FIPE (R$)</Label>
                  <Input value={form.valorFipe} onChange={e => set("valorFipe", e.target.value)} placeholder="0,00" />
                </div>
              </div>

              <div className="pt-2 border-t">
                <Label className="text-xs text-muted-foreground mb-2 block">Fotos do Veículo (opcional)</Label>
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="h-3.5 w-3.5" /> Adicionar Fotos
                </Button>
              </div>
            </>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchAssoc}
                  onChange={e => { setSearchAssoc(e.target.value); setSelectedAssoc(null); }}
                  placeholder="Buscar associado por nome ou CPF"
                  className="pl-10"
                />
              </div>

              {selectedAssoc ? (
                <Card className="border-primary">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{mockAssociados.find(a => a.id === selectedAssoc)?.nome}</p>
                      <p className="text-xs text-muted-foreground">{mockAssociados.find(a => a.id === selectedAssoc)?.cpf}</p>
                    </div>
                    <Check className="h-5 w-5 text-primary" />
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {filteredAssoc.map(a => (
                    <Card key={a.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => { setSelectedAssoc(a.id); setSearchAssoc(a.nome); }}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{a.nome}</p>
                          <p className="text-xs text-muted-foreground">{a.cpf} • {a.cidade}/{a.estado}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {searchAssoc.length >= 2 && filteredAssoc.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum associado encontrado.</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>Voltar</Button>
            {step < 1 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
                Próximo <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canNext()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Cadastrar Veículo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
