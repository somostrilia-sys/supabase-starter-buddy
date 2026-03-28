import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, User, Car, Link2, Check, CheckCircle2 } from "lucide-react";

interface MockAssoc {
  id: string; nome: string; cpf: string; situacao: string; regional: string;
  telefone: string; email: string; cooperativa: string;
}

interface MockVeic {
  id: string; placa: string; modelo: string; marca: string; ano: number;
  cor: string; chassi: string; situacao: string;
}

const assocMock: MockAssoc[] = [
  { id: "a1", nome: "Carlos Alberto Silva", cpf: "342.876.541-09", situacao: "Ativo", regional: "Regional Capital", telefone: "(11) 99845-3210", email: "carlos.silva@email.com", cooperativa: "Cooperativa São Paulo" },
  { id: "a2", nome: "Maria Aparecida Santos", cpf: "456.123.789-00", situacao: "Ativo", regional: "Regional Interior", telefone: "(19) 98765-4321", email: "maria.santos@email.com", cooperativa: "Cooperativa Campinas" },
  { id: "a3", nome: "José Roberto Oliveira", cpf: "789.654.321-55", situacao: "Suspenso", regional: "Regional Litoral", telefone: "(13) 99654-8712", email: "jose.oliveira@email.com", cooperativa: "Cooperativa Santos" },
];

const veicMock: MockVeic[] = [
  { id: "v1", placa: "BRA-2E19", modelo: "T-Cross 200 TSI", marca: "Volkswagen", ano: 2024, cor: "Branco", chassi: "9BWZZZ377VT004251", situacao: "Disponível" },
  { id: "v2", placa: "RIO-4F23", modelo: "Civic EXL 2.0", marca: "Honda", ano: 2023, cor: "Prata", chassi: "93HFC6860PZ000123", situacao: "Disponível" },
  { id: "v3", placa: "MGA-8H45", modelo: "Onix Plus 1.0T", marca: "Chevrolet", ano: 2024, cor: "Preto", chassi: "9BGKT08DXRG123456", situacao: "Em vistoria" },
];

const statusColor = (s: string) => {
  if (s === "Ativo" || s === "Disponível") return "bg-success/10 text-success border-success/20";
  if (s === "Suspenso" || s === "Em vistoria") return "bg-warning/10 text-warning border-warning/25";
  return "bg-muted text-muted-foreground";
};

export default function VincularAssociado() {
  const [searchA, setSearchA] = useState("");
  const [searchV, setSearchV] = useState("");
  const [selA, setSelA] = useState<MockAssoc | null>(null);
  const [selV, setSelV] = useState<MockVeic | null>(null);
  const [plano, setPlano] = useState("");
  const [tabela, setTabela] = useState("");
  const [rastreadorObrig, setRastreadorObrig] = useState(false);
  const [obs, setObs] = useState("");
  const [resultsA, setResultsA] = useState<MockAssoc[]>([]);
  const [resultsV, setResultsV] = useState<MockVeic[]>([]);

  const buscarAssociado = () => {
    if (!searchA.trim()) return;
    const q = searchA.toLowerCase().replace(/\D/g, "") || searchA.toLowerCase();
    const r = assocMock.filter(a =>
      a.nome.toLowerCase().includes(searchA.toLowerCase()) ||
      a.cpf.replace(/\D/g, "").includes(q)
    );
    setResultsA(r);
    if (r.length === 0) toast.info("Nenhum associado encontrado");
  };

  const buscarVeiculo = () => {
    if (!searchV.trim()) return;
    const q = searchV.toLowerCase();
    const r = veicMock.filter(v =>
      v.placa.toLowerCase().replace("-", "").includes(q.replace("-", "")) ||
      v.chassi.toLowerCase().includes(q)
    );
    setResultsV(r);
    if (r.length === 0) toast.info("Nenhum veículo encontrado");
  };

  const handleVincular = () => {
    if (!selA || !selV) return;
    if (!plano) return toast.error("Selecione um plano");
    toast.success("Associado vinculado ao veículo com sucesso!", {
      description: `${selA.nome} → ${selV.placa} (${selV.modelo})`,
    });
    setSelA(null); setSelV(null); setSearchA(""); setSearchV("");
    setResultsA([]); setResultsV([]); setPlano(""); setTabela("");
    setRastreadorObrig(false); setObs("");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-bold">Vincular Associado a Veículo</h2>
        <p className="text-sm text-muted-foreground">Selecione um associado e um veículo existentes para criar a vinculação</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PAINEL ESQUERDO - ASSOCIADO */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Buscar Associado
              {selA && <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchA}
                  onChange={e => { setSearchA(e.target.value); setSelA(null); }}
                  onKeyDown={e => e.key === "Enter" && buscarAssociado()}
                  placeholder="CPF/CNPJ ou Nome"
                  className="pl-10"
                />
              </div>
              <Button onClick={buscarAssociado} variant="outline">Buscar</Button>
            </div>

            {selA ? (
              <Card className="border-success/30 bg-emerald-50/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{selA.nome}</p>
                    <Badge className={statusColor(selA.situacao)}>{selA.situacao}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">CPF:</span> {selA.cpf}</div>
                    <div><span className="text-muted-foreground">Regional:</span> {selA.regional}</div>
                    <div><span className="text-muted-foreground">Telefone:</span> {selA.telefone}</div>
                    <div><span className="text-muted-foreground">Email:</span> {selA.email}</div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => { setSelA(null); setResultsA([]); setSearchA(""); }}>
                    Alterar seleção
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {resultsA.map(a => (
                  <Card key={a.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelA(a)}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{a.nome}</p>
                        <p className="text-xs text-muted-foreground">{a.cpf} • {a.regional}</p>
                      </div>
                      <Badge className={`${statusColor(a.situacao)} text-xs`}>{a.situacao}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PAINEL DIREITO - VEÍCULO */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" /> Buscar Veículo
              {selV && <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchV}
                  onChange={e => { setSearchV(e.target.value); setSelV(null); }}
                  onKeyDown={e => e.key === "Enter" && buscarVeiculo()}
                  placeholder="Placa ou Chassi"
                  className="pl-10"
                />
              </div>
              <Button onClick={buscarVeiculo} variant="outline">Buscar</Button>
            </div>

            {selV ? (
              <Card className="border-success/30 bg-emerald-50/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold font-mono">{selV.placa}</p>
                    <Badge className={statusColor(selV.situacao)}>{selV.situacao}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Modelo:</span> {selV.modelo}</div>
                    <div><span className="text-muted-foreground">Marca:</span> {selV.marca}</div>
                    <div><span className="text-muted-foreground">Ano:</span> {selV.ano}</div>
                    <div><span className="text-muted-foreground">Cor:</span> {selV.cor}</div>
                    <div className="col-span-2"><span className="text-muted-foreground">Chassi:</span> {selV.chassi}</div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => { setSelV(null); setResultsV([]); setSearchV(""); }}>
                    Alterar seleção
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {resultsV.map(v => (
                  <Card key={v.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelV(v)}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Car className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{v.modelo} ({v.ano})</p>
                        <p className="text-xs text-muted-foreground font-mono">{v.placa} • {v.marca} • {v.cor}</p>
                      </div>
                      <Badge className={`${statusColor(v.situacao)} text-xs`}>{v.situacao}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO INFERIOR - PRODUTO/PLANO */}
      {selA && selV && (
        <Card className="mt-6 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" /> Produto / Plano
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Plano *</Label>
                <Select value={plano} onValueChange={setPlano}>
                  <SelectTrigger><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
                  <SelectContent>
                    {["Básico - R$ 89,90","Intermediário - R$ 139,90","Completo - R$ 189,90","Premium - R$ 249,90","Executivo - R$ 349,90"].map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tabela de Preço</Label>
                <Select value={tabela} onValueChange={setTabela}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {["Tabela SP Capital","Tabela Interior SP","Tabela RJ Metro","Tabela Nacional"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Valores (auto-preenchidos)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div><Label className="text-xs">Mensalidade</Label><Input value={plano ? "189,90" : ""} readOnly className="h-8 text-xs bg-muted/50" /></div>
                  <div><Label className="text-xs">Adesão</Label><Input value={plano ? "350,00" : ""} readOnly className="h-8 text-xs bg-muted/50" /></div>
                  <div><Label className="text-xs">Cota</Label><Input value={plano ? "2.500,00" : ""} readOnly className="h-8 text-xs bg-muted/50" /></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={rastreadorObrig} onCheckedChange={setRastreadorObrig} />
              <Label>Rastreador Obrigatório</Label>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={obs} onChange={e => setObs(e.target.value)} rows={3} placeholder="Observações sobre a vinculação..." />
            </div>
            <Button onClick={handleVincular} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Link2 className="h-4 w-4" /> Vincular Associado ao Veículo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
