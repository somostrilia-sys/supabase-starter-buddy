import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Plus, Edit, Trash2, GripVertical, ChevronLeft, ChevronRight } from "lucide-react";

const mockTabelas = [
  { id: 1, nome: "Tabela SP Capital", status: "Ativa", prioridade: 1, regional: "São Paulo", rastreadorObrigatorio: true, taxaInstalacao: "R$ 250,00" },
  { id: 2, nome: "Tabela Interior SP", status: "Ativa", prioridade: 2, regional: "Interior SP", rastreadorObrigatorio: false, taxaInstalacao: "R$ 200,00" },
  { id: 3, nome: "Tabela Sul", status: "Inativa", prioridade: 3, regional: "Regional Sul", rastreadorObrigatorio: true, taxaInstalacao: "R$ 180,00" },
  { id: 4, nome: "Tabela Nordeste", status: "Ativa", prioridade: 4, regional: "Regional Nordeste", rastreadorObrigatorio: false, taxaInstalacao: "R$ 150,00" },
];

const marcasVeiculos = {
  Toyota: [
    { nome: "Corolla", anoMin: 2015, anoMax: 2025 },
    { nome: "Hilux", anoMin: 2012, anoMax: 2025 },
    { nome: "Yaris", anoMin: 2018, anoMax: 2024 },
    { nome: "RAV4", anoMin: 2016, anoMax: 2025 },
  ],
  Chevrolet: [
    { nome: "Onix", anoMin: 2013, anoMax: 2025 },
    { nome: "Tracker", anoMin: 2017, anoMax: 2025 },
    { nome: "S10", anoMin: 2012, anoMax: 2025 },
    { nome: "Spin", anoMin: 2013, anoMax: 2024 },
  ],
  Fiat: [
    { nome: "Argo", anoMin: 2017, anoMax: 2025 },
    { nome: "Toro", anoMin: 2016, anoMax: 2025 },
    { nome: "Pulse", anoMin: 2021, anoMax: 2025 },
    { nome: "Strada", anoMin: 2010, anoMax: 2025 },
  ],
  VW: [
    { nome: "Polo", anoMin: 2014, anoMax: 2025 },
    { nome: "T-Cross", anoMin: 2019, anoMax: 2025 },
    { nome: "Amarok", anoMin: 2012, anoMax: 2025 },
    { nome: "Nivus", anoMin: 2020, anoMax: 2025 },
  ],
  Honda: [
    { nome: "Civic", anoMin: 2012, anoMax: 2025 },
    { nome: "HR-V", anoMin: 2015, anoMax: 2025 },
    { nome: "City", anoMin: 2014, anoMax: 2025 },
    { nome: "CR-V", anoMin: 2013, anoMax: 2025 },
  ],
};

const defaultFaixas = [
  { min: "0", max: "30000", mensalidade: "79,90", cota: "1500", taxaAdmin: "50,00", adesao: "299,90", semTaxaAdmin: false },
  { min: "30001", max: "60000", mensalidade: "119,90", cota: "2500", taxaAdmin: "60,00", adesao: "399,90", semTaxaAdmin: false },
  { min: "60001", max: "100000", mensalidade: "169,90", cota: "3500", taxaAdmin: "80,00", adesao: "499,90", semTaxaAdmin: false },
];

const planosDisponiveis = ["Básico", "Intermediário", "Premium", "Executivo", "Empresarial"];

export default function TabelasPrecosTab() {
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [nomeTabela, setNomeTabela] = useState("");
  const [statusTabela, setStatusTabela] = useState("Ativa");
  const [regionaisSelecionadas, setRegionaisSelecionadas] = useState<string[]>([]);
  const [veiculosSelecionados, setVeiculosSelecionados] = useState<string[]>([]);
  const [faixas, setFaixas] = useState(defaultFaixas);
  const [planosSelecionados, setPlanosSelecionados] = useState<string[]>([]);
  const [precosPlanos, setPrecosPlanos] = useState<Record<string, { mensalidade: string; adesao: string }>>({});

  const steps = ["Dados Gerais", "Veículos", "Intervalos FIPE", "Planos", "Preços dos Planos"];

  const toggleVeiculo = (v: string) => {
    setVeiculosSelecionados(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  };

  const togglePlano = (p: string) => {
    setPlanosSelecionados(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const addFaixa = () => {
    setFaixas([...faixas, { min: "", max: "", mensalidade: "", cota: "", taxaAdmin: "", adesao: "", semTaxaAdmin: false }]);
  };

  const updateFaixa = (idx: number, field: string, value: string | boolean) => {
    const updated = [...faixas];
    (updated[idx] as any)[field] = value;
    setFaixas(updated);
  };

  const regionaisOpcoes = ["São Paulo", "Interior SP", "Regional Sul", "Regional Nordeste", "Regional Norte", "Regional Centro-Oeste"];

  const toggleRegional = (r: string) => {
    setRegionaisSelecionadas(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const openWizard = () => {
    setWizardStep(0);
    setNomeTabela("");
    setStatusTabela("Ativa");
    setRegionaisSelecionadas([]);
    setVeiculosSelecionados([]);
    setFaixas(defaultFaixas);
    setPlanosSelecionados([]);
    setPrecosPlanos({});
    setShowWizard(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tabelas de Preços</h3>
          <p className="text-sm text-muted-foreground">Gerencie as tabelas de preços e faixas FIPE</p>
        </div>
        <Button onClick={openWizard} className="gap-2"><Plus className="h-4 w-4" /> Nova Tabela de Preço</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Regional</TableHead>
                <TableHead>Rastreador</TableHead>
                <TableHead>Taxa Instalação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTabelas.map((t) => (
                <TableRow key={t.id}>
                  <TableCell><GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" /></TableCell>
                  <TableCell className="font-medium">{t.nome}</TableCell>
                  <TableCell>
                    <Badge variant={t.status === "Ativa" ? "default" : "secondary"} className={t.status === "Ativa" ? "bg-emerald-500/10 text-emerald-600 border-success/20" : ""}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{t.prioridade}</TableCell>
                  <TableCell>{t.regional}</TableCell>
                  <TableCell>
                    <Switch checked={t.rastreadorObrigatorio} disabled />
                  </TableCell>
                  <TableCell>{t.taxaInstalacao}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Tabela de Preço</DialogTitle>
          </DialogHeader>

          {/* Stepper */}
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0 ${
                  i <= wizardStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {i + 1}
                </div>
                <span className={`ml-2 text-xs hidden sm:inline ${i <= wizardStep ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {step}
                </span>
                {i < steps.length - 1 && <div className={`flex-1 h-px mx-3 ${i < wizardStep ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          {/* Step 1 - Dados Gerais */}
          {wizardStep === 0 && (
            <div className="space-y-4">
              <div>
                <Label>Nome da Tabela</Label>
                <Input value={nomeTabela} onChange={e => setNomeTabela(e.target.value)} placeholder="Ex: Tabela SP Capital" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={statusTabela} onValueChange={setStatusTabela}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativa">Ativa</SelectItem>
                    <SelectItem value="Inativa">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Regionais</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {regionaisOpcoes.map(r => (
                    <div key={r} className="flex items-center gap-2">
                      <Checkbox checked={regionaisSelecionadas.includes(r)} onCheckedChange={() => toggleRegional(r)} />
                      <span className="text-sm">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 - Veículos */}
          {wizardStep === 1 && (
            <TooltipProvider>
              <div className="space-y-4">
                {Object.entries(marcasVeiculos).map(([marca, modelos]) => (
                  <div key={marca}>
                    <h4 className="font-semibold text-sm mb-2">{marca}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {modelos.map(m => (
                        <Tooltip key={m.nome}>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={veiculosSelecionados.includes(`${marca}-${m.nome}`)}
                                onCheckedChange={() => toggleVeiculo(`${marca}-${m.nome}`)}
                              />
                              <span className="text-sm">{m.nome}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Fabricação: {m.anoMin} a {m.anoMax}</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TooltipProvider>
          )}

          {/* Step 3 - Intervalos FIPE */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faixa Mín (R$)</TableHead>
                    <TableHead>Faixa Máx (R$)</TableHead>
                    <TableHead>Mensalidade</TableHead>
                    <TableHead>Cota Part.</TableHead>
                    <TableHead>Taxa Admin</TableHead>
                    <TableHead>Adesão</TableHead>
                    <TableHead>S/ Taxa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faixas.map((f, i) => (
                    <TableRow key={i}>
                      <TableCell><Input value={f.min} onChange={e => updateFaixa(i, "min", e.target.value)} className="w-24" /></TableCell>
                      <TableCell><Input value={f.max} onChange={e => updateFaixa(i, "max", e.target.value)} className="w-24" /></TableCell>
                      <TableCell><Input value={f.mensalidade} onChange={e => updateFaixa(i, "mensalidade", e.target.value)} className="w-20" /></TableCell>
                      <TableCell><Input value={f.cota} onChange={e => updateFaixa(i, "cota", e.target.value)} className="w-20" /></TableCell>
                      <TableCell><Input value={f.taxaAdmin} onChange={e => updateFaixa(i, "taxaAdmin", e.target.value)} className="w-20" /></TableCell>
                      <TableCell><Input value={f.adesao} onChange={e => updateFaixa(i, "adesao", e.target.value)} className="w-20" /></TableCell>
                      <TableCell><Checkbox checked={f.semTaxaAdmin} onCheckedChange={(v) => updateFaixa(i, "semTaxaAdmin", !!v)} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button variant="outline" onClick={addFaixa} className="gap-2"><Plus className="h-4 w-4" /> Adicionar Faixa</Button>
            </div>
          )}

          {/* Step 4 - Planos */}
          {wizardStep === 3 && (
            <div className="space-y-3">
              <Label>Selecione os planos para vincular</Label>
              {planosDisponiveis.map(p => (
                <div key={p} className="flex items-center gap-2">
                  <Checkbox checked={planosSelecionados.includes(p)} onCheckedChange={() => togglePlano(p)} />
                  <span className="text-sm">{p}</span>
                </div>
              ))}
            </div>
          )}

          {/* Step 5 - Preços dos Planos */}
          {wizardStep === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Planos com valor vazio serão ocultados na cotação.</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plano</TableHead>
                    <TableHead>Mensalidade (R$)</TableHead>
                    <TableHead>Adesão (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planosSelecionados.map(p => (
                    <TableRow key={p}>
                      <TableCell className="font-medium">{p}</TableCell>
                      <TableCell>
                        <Input
                          value={precosPlanos[p]?.mensalidade || ""}
                          onChange={e => setPrecosPlanos(prev => ({ ...prev, [p]: { ...prev[p], mensalidade: e.target.value, adesao: prev[p]?.adesao || "" } }))}
                          placeholder="0,00"
                          className="w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={precosPlanos[p]?.adesao || ""}
                          onChange={e => setPrecosPlanos(prev => ({ ...prev, [p]: { ...prev[p], adesao: e.target.value, mensalidade: prev[p]?.mensalidade || "" } }))}
                          placeholder="0,00"
                          className="w-28"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {planosSelecionados.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Nenhum plano selecionado na etapa anterior</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t-2 border-[#747474]">
            <Button variant="outline" onClick={() => wizardStep > 0 ? setWizardStep(wizardStep - 1) : setShowWizard(false)} className="gap-2">
              <ChevronLeft className="h-4 w-4" /> {wizardStep === 0 ? "Cancelar" : "Anterior"}
            </Button>
            {wizardStep < steps.length - 1 ? (
              <Button onClick={() => setWizardStep(wizardStep + 1)} className="gap-2">
                Próximo <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => setShowWizard(false)}>Salvar Tabela</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
