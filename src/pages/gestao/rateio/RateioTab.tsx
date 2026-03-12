import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Calculator, Upload, Download, Save, Edit, Plus, Loader2,
  ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle,
  Info, Search, ChevronDown, ChevronUp, FileSpreadsheet, Play,
} from "lucide-react";
import { toast } from "sonner";

// ── Constants ──────────────────────────────────────────────

const categoriasVeiculo = ["Automóvel", "Motocicleta", "Pesados", "Utilitários", "Vans"];
const regionaisData = [
  { nome: "Matriz", veiculos: 1265 },
  { nome: "SP Interior", veiculos: 4748 },
  { nome: "Sul Interior", veiculos: 1598 },
  { nome: "Norte Minas Sul", veiculos: 266 },
  { nome: "Minas Interior", veiculos: 418 },
  { nome: "Norte", veiculos: 265 },
  { nome: "Paraná", veiculos: 270 },
  { nome: "Bahia", veiculos: 291 },
  { nome: "Ceará", veiculos: 142 },
  { nome: "Natal", veiculos: 28 },
  { nome: "Alagoas", veiculos: 48 },
  { nome: "Mato Grosso Sul", veiculos: 8 },
];

// ── Mock Data ──────────────────────────────────────────────

const mockCotas = [
  // Automóvel
  { id: 1, valorInicial: 0, valorFinal: 8000, categoria: "Automóvel", regional: "Todas", fator: 1.0 },
  { id: 2, valorInicial: 8001, valorFinal: 20000, categoria: "Automóvel", regional: "Todas", fator: 1.2 },
  { id: 3, valorInicial: 20001, valorFinal: 40000, categoria: "Automóvel", regional: "Todas", fator: 1.5 },
  // Motocicleta
  { id: 4, valorInicial: 0, valorFinal: 5000, categoria: "Motocicleta", regional: "Todas", fator: 0.6 },
  { id: 5, valorInicial: 5001, valorFinal: 15000, categoria: "Motocicleta", regional: "Todas", fator: 0.8 },
  { id: 6, valorInicial: 15001, valorFinal: 30000, categoria: "Motocicleta", regional: "Todas", fator: 1.0 },
  // Pesados
  { id: 7, valorInicial: 0, valorFinal: 50000, categoria: "Pesados", regional: "Todas", fator: 1.8 },
  { id: 8, valorInicial: 50001, valorFinal: 150000, categoria: "Pesados", regional: "Todas", fator: 2.2 },
  { id: 9, valorInicial: 150001, valorFinal: 300000, categoria: "Pesados", regional: "Todas", fator: 2.8 },
  // Utilitários
  { id: 10, valorInicial: 0, valorFinal: 30000, categoria: "Utilitários", regional: "Todas", fator: 1.1 },
  { id: 11, valorInicial: 30001, valorFinal: 60000, categoria: "Utilitários", regional: "Todas", fator: 1.3 },
  { id: 12, valorInicial: 60001, valorFinal: 120000, categoria: "Utilitários", regional: "Todas", fator: 1.6 },
  // Vans
  { id: 13, valorInicial: 0, valorFinal: 40000, categoria: "Vans", regional: "Todas", fator: 1.2 },
  { id: 14, valorInicial: 40001, valorFinal: 80000, categoria: "Vans", regional: "Todas", fator: 1.4 },
  { id: 15, valorInicial: 80001, valorFinal: 150000, categoria: "Vans", regional: "Todas", fator: 1.7 },
];

const mockHistImport = [
  { data: "10/12/2025 14:30", usuario: "Admin", arquivo: "cotas_dez2025.xlsx", registros: 45, status: "Sucesso" },
  { data: "01/11/2025 09:15", usuario: "Gerente", arquivo: "cotas_nov2025.csv", registros: 42, status: "Sucesso" },
  { data: "05/10/2025 16:00", usuario: "Admin", arquivo: "cotas_out2025.xlsx", registros: 38, status: "Parcial (3 erros)" },
];

const mockHistDist = [
  { mes: "Dez/2025", valorTotal: 127840.50, qtdeVeiculos: 9347, regionais: 12, intervalos: 15, usuario: "Admin", dataHora: "15/12/2025 16:30:00", detalhes: [
    { regional: "Matriz", veiculos: 1265, valor: 17285.40 }, { regional: "SP Interior", veiculos: 4748, valor: 64902.30 }, { regional: "Sul Interior", veiculos: 1598, valor: 21835.60 },
  ]},
  { mes: "Nov/2025", valorTotal: 118520.00, qtdeVeiculos: 9210, regionais: 12, intervalos: 15, usuario: "Gerente", dataHora: "14/11/2025 15:45:00", detalhes: [
    { regional: "Matriz", veiculos: 1240, valor: 16150.00 }, { regional: "SP Interior", veiculos: 4680, valor: 60840.00 },
  ]},
  { mes: "Out/2025", valorTotal: 112300.00, qtdeVeiculos: 9050, regionais: 11, intervalos: 15, usuario: "Admin", dataHora: "15/10/2025 14:20:00", detalhes: [
    { regional: "Matriz", veiculos: 1220, valor: 15860.00 },
  ]},
  { mes: "Set/2025", valorTotal: 105800.00, qtdeVeiculos: 8900, regionais: 11, intervalos: 15, usuario: "Admin", dataHora: "15/09/2025 16:10:00", detalhes: [] },
  { mes: "Ago/2025", valorTotal: 98500.00, qtdeVeiculos: 8750, regionais: 10, intervalos: 12, usuario: "Gerente", dataHora: "14/08/2025 15:55:00", detalhes: [] },
];

const mockCargaGestao = regionaisData.map(r => ({
  regional: r.nome,
  totalVeiculos: r.veiculos,
  totalCotas: Math.floor(r.veiculos * 1.1),
  automoveis: Math.floor(r.veiculos * 0.75),
  motos: Math.floor(r.veiculos * 0.15),
  pesados: Math.floor(r.veiculos * 0.10),
  status: r.nome === "Natal" || r.nome === "Alagoas" || r.nome === "Mato Grosso Sul" ? "Pendente" as const : "Executada" as const,
}));

// ── Main Component ─────────────────────────────────────────

export default function RateioTab() {
  const [subTab, setSubTab] = useState<"estrutura" | "distribuicao" | "historico" | "carga">("estrutura");

  const tabs = [
    { id: "estrutura" as const, label: "Estrutura de Cotas", icon: FileSpreadsheet },
    { id: "distribuicao" as const, label: "Distribuição de Rateio", icon: Calculator },
    { id: "historico" as const, label: "Histórico Distribuição", icon: Search },
    { id: "carga" as const, label: "Carga Inicial Gestão", icon: Upload },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[hsl(212_35%_18%)]">Rateio</h2>
        <p className="text-sm text-muted-foreground">Estrutura de cotas, distribuição e histórico de rateio</p>
      </div>

      <div className="flex gap-1 border-b border-[hsl(210_30%_88%)] overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              subTab === t.id
                ? "border-[hsl(212_55%_40%)] text-[hsl(212_35%_18%)]"
                : "border-transparent text-muted-foreground hover:text-[hsl(212_35%_30%)]"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "estrutura" && <EstruturaCotas />}
      {subTab === "distribuicao" && <DistribuicaoRateio />}
      {subTab === "historico" && <HistoricoDistribuicao />}
      {subTab === "carga" && <CargaInicialGestao />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 1) ESTRUTURA DE COTAS
// ═══════════════════════════════════════════════════════════

function EstruturaCotas() {
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEdit, setShowEdit] = useState<typeof mockCotas[0] | null>(null);

  const filtered = mockCotas.filter(c => filtroCategoria === "Todas" || c.categoria === filtroCategoria);

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      toast.success("Planilha importada com sucesso — 15 registros processados");
      setShowUpload(false);
    }, 1500);
  };

  return (
    <div className="space-y-5">
      {/* Filtros e ações */}
      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <Label className="text-xs">Categoria</Label>
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              {categoriasVeiculo.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" className="gap-2 text-xs border-[hsl(210_30%_85%)]" onClick={() => setShowUpload(true)}>
            <Upload className="h-4 w-4" />Importar Planilha
          </Button>
          <Button className="gap-2 text-xs bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white" onClick={() => toast.success("Cota adicionada")}>
            <Plus className="h-4 w-4" />Nova Cota
          </Button>
        </div>
      </div>

      {/* Tabela de cotas */}
      <div className="border rounded-lg border-[hsl(210_30%_88%)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(210_40%_96%)]">
              <TableHead className="text-xs">Valor Inicial (FIPE)</TableHead>
              <TableHead className="text-xs">Valor Final (FIPE)</TableHead>
              <TableHead className="text-xs">Categoria Veículo</TableHead>
              <TableHead className="text-xs">Regional</TableHead>
              <TableHead className="text-xs text-right">Fator Multiplicador</TableHead>
              <TableHead className="text-xs w-[60px]">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell className="text-sm font-mono">R$ {c.valorInicial.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-sm font-mono">R$ {c.valorFinal.toLocaleString("pt-BR")}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs border-[hsl(210_35%_70%)] bg-[hsl(210_40%_95%)]">{c.categoria}</Badge></TableCell>
                <TableCell className="text-sm">{c.regional}</TableCell>
                <TableCell className="text-sm text-right font-bold font-mono">{c.fator.toFixed(1)}x</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowEdit(c)}><Edit className="h-3 w-3" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Histórico de importações */}
      <Card className="border-[hsl(210_30%_88%)] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-[hsl(212_35%_18%)]">Histórico de Importações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg border-[hsl(210_30%_88%)] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[hsl(210_40%_96%)]">
                  <TableHead className="text-xs">Data/Hora</TableHead>
                  <TableHead className="text-xs">Usuário</TableHead>
                  <TableHead className="text-xs">Arquivo</TableHead>
                  <TableHead className="text-xs text-right">Registros</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockHistImport.map((h, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{h.data}</TableCell>
                    <TableCell className="text-sm">{h.usuario}</TableCell>
                    <TableCell className="text-sm font-mono">{h.arquivo}</TableCell>
                    <TableCell className="text-sm text-right">{h.registros}</TableCell>
                    <TableCell><Badge className={`text-xs ${h.status === "Sucesso" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{h.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[hsl(212_35%_18%)]">Importar Planilha de Cotas</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-[hsl(210_30%_85%)] rounded-lg p-8 text-center hover:border-[hsl(212_55%_40%)] transition-colors cursor-pointer" onClick={handleUpload}>
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-[hsl(212_55%_40%)]" />
                  <p className="text-sm">Processando arquivo...</p>
                  <Progress value={65} className="w-48 mx-auto" />
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Clique ou arraste o arquivo .xlsx / .csv</p>
                </>
              )}
            </div>
            <Button variant="outline" size="sm" className="gap-2 text-xs border-[hsl(210_30%_85%)]" onClick={() => toast.info("Download do modelo iniciado")}>
              <Download className="h-3 w-3" />Baixar Modelo de Planilha
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[hsl(212_35%_18%)]">Editar Cota</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Valor Inicial (R$)</Label><Input defaultValue={showEdit?.valorInicial} /></div>
            <div><Label className="text-xs">Valor Final (R$)</Label><Input defaultValue={showEdit?.valorFinal} /></div>
            <div><Label className="text-xs">Categoria</Label>
              <Select defaultValue={showEdit?.categoria}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categoriasVeiculo.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label className="text-xs">Fator Multiplicador</Label><Input defaultValue={showEdit?.fator} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(null)} className="border-[hsl(210_30%_85%)]">Cancelar</Button>
            <Button className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white gap-2" onClick={() => { toast.success("Cota atualizada"); setShowEdit(null); }}>
              <Save className="h-4 w-4" />Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 2) DISTRIBUIÇÃO DE RATEIO
// ═══════════════════════════════════════════════════════════

function DistribuicaoRateio() {
  const [step, setStep] = useState(0);
  const [mesRef, setMesRef] = useState("12/2025");
  const [dataLimite, setDataLimite] = useState("2025-12-15");
  const [valorBase, setValorBase] = useState("532.35");

  const steps = [
    "Mês Referência", "Data Limite", "Categorias e Regionais",
    "Valor Base", "Cálculo Automático", "Tabela Completa",
    "Validação", "Gravar Rateio",
  ];

  const totalVeiculos = regionaisData.reduce((s, r) => s + r.veiculos, 0);
  const vb = parseFloat(valorBase) || 0;

  // Build distribution table
  const distribuicao = regionaisData.map(r => ({
    regional: r.nome,
    categoria: "Automóvel",
    qtdeVeiculos: r.veiculos,
    qtdeCotas: Math.floor(r.veiculos * 1.1),
    valorCota: vb,
    valorCotaAlterado: vb,
    valorRateado: r.veiculos * vb,
  }));

  const totalRateado = distribuicao.reduce((s, d) => s + d.valorRateado, 0);

  const salvarRateio = () => {
    toast.success(`Rateio gravado com sucesso para ${mesRef} — Total: R$ ${totalRateado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    setStep(0);
  };

  return (
    <div className="space-y-5">
      {/* Card explicativo */}
      <Card className="border-[hsl(210_30%_88%)] bg-[hsl(210_40%_97%)]">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-[hsl(212_55%_40%)] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[hsl(212_35%_18%)]">Conceito Mutualista</p>
            <p className="text-xs text-muted-foreground mt-1">O rateio distribui o custo total dos eventos entre todos os associados ativos, conforme a categoria do veículo e o fator multiplicador da cota. O valor base (primeira cota) é definido manualmente e as demais são calculadas automaticamente: <strong>Valor Cota N = Valor Base × Fator Multiplicador</strong>.</p>
          </div>
        </CardContent>
      </Card>

      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <button
              onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                i === step ? "bg-[hsl(212_35%_18%)] text-white" :
                i < step ? "bg-[hsl(210_40%_90%)] text-[hsl(212_35%_30%)]" :
                "bg-[hsl(210_40%_96%)] text-muted-foreground"
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-current/20">
                {i < step ? "✓" : i + 1}
              </span>
              <span className="hidden lg:inline">{s}</span>
            </button>
            {i < steps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5 shrink-0" />}
          </div>
        ))}
      </div>

      <Card className="border-[hsl(210_30%_88%)] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[hsl(212_35%_18%)]">Passo {step + 1}: {steps[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 0 - Mês Referência */}
          {step === 0 && (
            <div>
              <Label className="text-xs">Mês/Ano de Referência</Label>
              <Input value={mesRef} onChange={e => setMesRef(e.target.value)} placeholder="MM/AAAA" className="w-40" />
              <p className="text-xs text-muted-foreground mt-2">Selecione o período para cálculo da distribuição de rateio.</p>
            </div>
          )}

          {/* Step 1 - Data Limite */}
          {step === 1 && (
            <div>
              <Label className="text-xs">Data Limite de Participação</Label>
              <Input type="date" value={dataLimite} onChange={e => setDataLimite(e.target.value)} className="w-48" />
              <p className="text-xs text-muted-foreground mt-2">Veículos ativados após esta data não participam do rateio deste mês.</p>
            </div>
          )}

          {/* Step 2 - Categorias e Regionais */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-[hsl(212_35%_18%)]">{totalVeiculos.toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Total Veículos</p></CardContent></Card>
                <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-[hsl(212_35%_18%)]">{regionaisData.length}</p><p className="text-xs text-muted-foreground">Regionais</p></CardContent></Card>
                <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-[hsl(212_35%_18%)]">{categoriasVeiculo.length}</p><p className="text-xs text-muted-foreground">Categorias</p></CardContent></Card>
                <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-[hsl(212_35%_18%)]">{mockCotas.length}</p><p className="text-xs text-muted-foreground">Intervalos FIPE</p></CardContent></Card>
              </div>
              <div className="border rounded-lg border-[hsl(210_30%_88%)] overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-[hsl(210_40%_96%)]"><TableHead className="text-xs">Regional</TableHead><TableHead className="text-xs text-right">Veículos</TableHead><TableHead className="text-xs text-right">% do Total</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {regionaisData.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm font-medium">{r.nome}</TableCell>
                        <TableCell className="text-sm text-right">{r.veiculos.toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-sm text-right">{((r.veiculos / totalVeiculos) * 100).toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Step 3 - Valor Base */}
          {step === 3 && (
            <div>
              <Label className="text-xs">Valor Base — Primeira Cota (R$)</Label>
              <Input value={valorBase} onChange={e => setValorBase(e.target.value)} className="w-48" />
              <p className="text-xs text-muted-foreground mt-2">Este é o valor da cota base (fator 1.0x). As demais cotas serão calculadas multiplicando este valor pelo fator da categoria.</p>
            </div>
          )}

          {/* Step 4 - Cálculo Automático */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Valores calculados automaticamente: <strong>Valor Cota = R$ {vb.toFixed(2)} × Fator</strong></p>
              <div className="border rounded-lg border-[hsl(210_30%_88%)] overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-[hsl(210_40%_96%)]"><TableHead className="text-xs">Categoria</TableHead><TableHead className="text-xs">Intervalo FIPE</TableHead><TableHead className="text-xs text-right">Fator</TableHead><TableHead className="text-xs text-right">Valor Cota Calculado</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {mockCotas.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm">{c.categoria}</TableCell>
                        <TableCell className="text-sm font-mono">R$ {c.valorInicial.toLocaleString("pt-BR")} — R$ {c.valorFinal.toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-sm text-right font-mono">{c.fator.toFixed(1)}x</TableCell>
                        <TableCell className="text-sm text-right font-bold">R$ {(vb * c.fator).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Step 5 - Tabela Completa */}
          {step === 5 && (
            <div className="border rounded-lg border-[hsl(210_30%_88%)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[hsl(210_40%_96%)]">
                    <TableHead className="text-xs">Regional</TableHead>
                    <TableHead className="text-xs">Categoria</TableHead>
                    <TableHead className="text-xs text-right">Qtde Veículos</TableHead>
                    <TableHead className="text-xs text-right">Qtde Cotas</TableHead>
                    <TableHead className="text-xs text-right">Valor Cota</TableHead>
                    <TableHead className="text-xs text-right">Valor Alterado</TableHead>
                    <TableHead className="text-xs text-right">Valor Rateado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distribuicao.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm font-medium">{d.regional}</TableCell>
                      <TableCell className="text-sm">{d.categoria}</TableCell>
                      <TableCell className="text-sm text-right">{d.qtdeVeiculos.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-sm text-right">{d.qtdeCotas.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-sm text-right font-mono">R$ {d.valorCota.toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-right font-mono">R$ {d.valorCotaAlterado.toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-right font-bold">R$ {d.valorRateado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-[hsl(210_40%_96%)] font-bold">
                    <TableCell colSpan={2} className="text-sm">TOTAL</TableCell>
                    <TableCell className="text-sm text-right">{totalVeiculos.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-sm text-right">{Math.floor(totalVeiculos * 1.1).toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-sm text-right">—</TableCell>
                    <TableCell className="text-sm text-right">—</TableCell>
                    <TableCell className="text-sm text-right">R$ {totalRateado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}

          {/* Step 6 - Validação */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="border-green-200 bg-green-50"><CardContent className="p-3 text-center"><CheckCircle2 className="h-5 w-5 mx-auto text-green-600 mb-1" /><p className="text-xs font-medium text-green-800">Mês: {mesRef}</p></CardContent></Card>
                <Card className="border-green-200 bg-green-50"><CardContent className="p-3 text-center"><CheckCircle2 className="h-5 w-5 mx-auto text-green-600 mb-1" /><p className="text-xs font-medium text-green-800">{totalVeiculos.toLocaleString("pt-BR")} veículos</p></CardContent></Card>
                <Card className="border-green-200 bg-green-50"><CardContent className="p-3 text-center"><CheckCircle2 className="h-5 w-5 mx-auto text-green-600 mb-1" /><p className="text-xs font-medium text-green-800">12 regionais</p></CardContent></Card>
                <Card className="border-green-200 bg-green-50"><CardContent className="p-3 text-center"><CheckCircle2 className="h-5 w-5 mx-auto text-green-600 mb-1" /><p className="text-xs font-medium text-green-800">R$ {totalRateado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></CardContent></Card>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Confirme os valores antes de gravar. Esta ação gerará os boletos com os valores de rateio para o período {mesRef}.</span>
              </div>
            </div>
          )}

          {/* Step 7 - Gravar */}
          {step === 7 && (
            <div className="text-center py-6 space-y-4">
              <Calculator className="h-12 w-12 mx-auto text-[hsl(212_55%_40%)]" />
              <div>
                <p className="text-lg font-bold text-[hsl(212_35%_18%)]">Rateio pronto para gravação</p>
                <p className="text-sm text-muted-foreground mt-1">Mês: {mesRef} · Veículos: {totalVeiculos.toLocaleString("pt-BR")} · Total: R$ {totalRateado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
              <Button className="gap-2 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white" onClick={salvarRateio}>
                <Save className="h-4 w-4" />Gravar Rateio
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)} className="gap-2 border-[hsl(210_30%_85%)]">
          <ChevronLeft className="h-4 w-4" />Anterior
        </Button>
        {step < steps.length - 1 && (
          <Button onClick={() => setStep(step + 1)} className="gap-2 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white">
            Próximo<ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 3) HISTÓRICO DE DISTRIBUIÇÃO
// ═══════════════════════════════════════════════════════════

function HistoricoDistribuicao() {
  const [expandido, setExpandido] = useState<number | null>(null);
  const [filtroRegional, setFiltroRegional] = useState("Todas");
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = () => {
    setLoading("excel");
    setTimeout(() => { toast.success("Relatório exportado para Excel"); setLoading(null); }, 900);
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <Label className="text-xs">De</Label>
          <Input type="date" className="w-40" />
        </div>
        <div>
          <Label className="text-xs">Até</Label>
          <Input type="date" className="w-40" />
        </div>
        <div>
          <Label className="text-xs">Regional</Label>
          <Select value={filtroRegional} onValueChange={setFiltroRegional}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              {regionaisData.map(r => <SelectItem key={r.nome} value={r.nome}>{r.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="gap-2 text-xs border-[hsl(210_30%_85%)] ml-auto" disabled={loading === "excel"} onClick={handleExport}>
          {loading === "excel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Exportar Excel
        </Button>
      </div>

      <div className="border rounded-lg border-[hsl(210_30%_88%)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(210_40%_96%)]">
              <TableHead className="text-xs w-[30px]"></TableHead>
              <TableHead className="text-xs">Mês Referência</TableHead>
              <TableHead className="text-xs text-right">Valor Total Distribuído</TableHead>
              <TableHead className="text-xs text-right">Qtde Veículos</TableHead>
              <TableHead className="text-xs text-right">Regionais</TableHead>
              <TableHead className="text-xs text-right">Intervalos FIPE</TableHead>
              <TableHead className="text-xs">Usuário</TableHead>
              <TableHead className="text-xs">Data/Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockHistDist.map((h, i) => (
              <>
                <TableRow key={i} className="cursor-pointer hover:bg-[hsl(210_40%_97%)]" onClick={() => setExpandido(expandido === i ? null : i)}>
                  <TableCell className="px-2">
                    {expandido === i ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{h.mes}</TableCell>
                  <TableCell className="text-sm text-right font-bold">R$ {h.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-sm text-right">{h.qtdeVeiculos.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-sm text-right">{h.regionais}</TableCell>
                  <TableCell className="text-sm text-right">{h.intervalos}</TableCell>
                  <TableCell className="text-sm">{h.usuario}</TableCell>
                  <TableCell className="text-sm">{h.dataHora}</TableCell>
                </TableRow>
                {expandido === i && h.detalhes.length > 0 && (
                  <TableRow key={`det-${i}`}>
                    <TableCell colSpan={8} className="bg-[hsl(210_40%_97%)] p-4">
                      <p className="text-xs font-semibold text-[hsl(212_35%_18%)] mb-2">Detalhes por Regional — {h.mes}</p>
                      <div className="border rounded border-[hsl(210_30%_88%)] overflow-hidden">
                        <Table>
                          <TableHeader><TableRow className="bg-[hsl(210_40%_94%)]"><TableHead className="text-xs">Regional</TableHead><TableHead className="text-xs text-right">Veículos</TableHead><TableHead className="text-xs text-right">Valor</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {h.detalhes.map((d, di) => (
                              <TableRow key={di}>
                                <TableCell className="text-sm">{d.regional}</TableCell>
                                <TableCell className="text-sm text-right">{d.veiculos.toLocaleString("pt-BR")}</TableCell>
                                <TableCell className="text-sm text-right font-medium">R$ {d.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 4) CARGA INICIAL GESTÃO
// ═══════════════════════════════════════════════════════════

function CargaInicialGestao() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalVeiculos = mockCargaGestao.reduce((s, r) => s + r.totalVeiculos, 0);
  const totalCotas = mockCargaGestao.reduce((s, r) => s + r.totalCotas, 0);
  const executadas = mockCargaGestao.filter(r => r.status === "Executada").length;

  const executarCarga = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowConfirm(false);
      toast.success("Carga inicial executada com sucesso para as regionais pendentes");
    }, 2000);
  };

  return (
    <div className="space-y-5">
      {/* Info card */}
      <Card className="border-[hsl(210_30%_88%)] bg-[hsl(210_40%_97%)]">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-[hsl(212_55%_40%)] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[hsl(212_35%_18%)]">Carga Inicial — Sistema SGA</p>
            <p className="text-xs text-muted-foreground mt-1">Dados referentes a <strong>01/12/2025</strong> do sistema legado SGA. Esta operação importa a estrutura de veículos e cotas para o novo sistema.</p>
            <div className="flex gap-4 mt-2 text-xs">
              <span><strong>Valor Cota:</strong> R$ 0,00 (zerado)</span>
              <span><strong>Data Limite:</strong> 31/12/2058</span>
              <span><strong>Data Operação:</strong> 01/12/2025 16:25:52</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-[hsl(212_35%_18%)]">{totalVeiculos.toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Total Veículos</p></CardContent></Card>
        <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-[hsl(212_35%_18%)]">{totalCotas.toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Total Cotas</p></CardContent></Card>
        <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-green-700">{executadas}/{mockCargaSGA.length}</p><p className="text-xs text-muted-foreground">Regionais Executadas</p></CardContent></Card>
        <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-yellow-700">{mockCargaSGA.length - executadas}</p><p className="text-xs text-muted-foreground">Pendentes</p></CardContent></Card>
      </div>

      {/* Table */}
      <div className="border rounded-lg border-[hsl(210_30%_88%)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(210_40%_96%)]">
              <TableHead className="text-xs">Regional</TableHead>
              <TableHead className="text-xs text-right">Total Veículos</TableHead>
              <TableHead className="text-xs text-right">Total Cotas</TableHead>
              <TableHead className="text-xs text-right">Automóveis</TableHead>
              <TableHead className="text-xs text-right">Motos</TableHead>
              <TableHead className="text-xs text-right">Pesados</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCargaSGA.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="text-sm font-medium">{r.regional}</TableCell>
                <TableCell className="text-sm text-right">{r.totalVeiculos.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-sm text-right">{r.totalCotas.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-sm text-right">{r.automoveis.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-sm text-right">{r.motos.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-sm text-right">{r.pesados.toLocaleString("pt-BR")}</TableCell>
                <TableCell>
                  <Badge className={`text-xs ${r.status === "Executada" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{r.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-[hsl(210_40%_96%)] font-bold">
              <TableCell className="text-sm">TOTAL</TableCell>
              <TableCell className="text-sm text-right">{totalVeiculos.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-sm text-right">{totalCotas.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-sm text-right">{mockCargaSGA.reduce((s, r) => s + r.automoveis, 0).toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-sm text-right">{mockCargaSGA.reduce((s, r) => s + r.motos, 0).toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-sm text-right">{mockCargaSGA.reduce((s, r) => s + r.pesados, 0).toLocaleString("pt-BR")}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Executar Carga */}
      <div className="flex justify-end">
        <Button className="gap-2 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white" onClick={() => setShowConfirm(true)}>
          <Play className="h-4 w-4" />Executar Carga Inicial
        </Button>
      </div>

      {/* Confirmação */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[hsl(212_35%_18%)]">Confirmar Carga Inicial</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Esta ação irá importar os dados do sistema SGA para as <strong>{mockCargaSGA.length - executadas} regionais pendentes</strong>. Os valores de cota serão zerados (R$ 0,00). Deseja continuar?</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Data Operação: 01/12/2025 16:25:52</p>
              <p>• Data Limite: 31/12/2058</p>
              <p>• Regionais pendentes: {mockCargaSGA.filter(r => r.status === "Pendente").map(r => r.regional).join(", ")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="border-[hsl(210_30%_85%)]">Cancelar</Button>
            <Button className="gap-2 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white" onClick={executarCarga} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {loading ? "Executando..." : "Confirmar Carga"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
