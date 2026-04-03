import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Calculator, Upload, Download, Save, Edit, Plus, Loader2,
  ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle,
  Info, Search, ChevronDown, ChevronUp, FileSpreadsheet, Play,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ImportExportCotas from "./ImportExportCotas";

// ── Types ──────────────────────────────────────────────────

interface FaixaFipe {
  id: string;
  categoria_id: string | null;
  fator: number;
  fipe_inicial: number;
  fipe_final: number;
  descricao: string | null;
  taxa_adm: number | null;
  ativo: boolean;
  created_at: string;
  categoria_nome?: string;
}

interface Regional {
  id: string;
  nome: string;
  estado: string | null;
  cidade: string | null;
  cooperativa_id: string | null;
  ativo: boolean;
  created_at: string;
  veiculos?: number;
}

interface CategoriaVeiculo {
  id: string;
  nome: string;
  ativo: boolean;
}

interface RateioConfig {
  id: string;
  mes_referencia: string;
  categoria_id: string | null;
  regional_id: string | null;
  valor_base: number | null;
  multiplicador: number | null;
  valor_calculado: number | null;
}

// ── Mock data that stays mock ──────────────────────────────

const mockHistImport = [
  { data: "10/12/2025 14:30", usuario: "Admin", arquivo: "cotas_dez2025.xlsx", registros: 45, status: "Sucesso" },
  { data: "01/11/2025 09:15", usuario: "Gerente", arquivo: "cotas_nov2025.csv", registros: 42, status: "Sucesso" },
  { data: "05/10/2025 16:00", usuario: "Admin", arquivo: "cotas_out2025.xlsx", registros: 38, status: "Parcial (3 erros)" },
];

// ── Hooks for Supabase data ────────────────────────────────

function useFaixasFipe() {
  const [data, setData] = useState<FaixaFipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      // Fetch faixas with categoria name via join
      const { data: faixas, error } = await supabase
        .from("faixas_fipe")
        .select("*, categorias_veiculo:categoria_id(id, nome)")
        .eq("ativo", true)
        .order("fipe_inicial", { ascending: true });

      if (error) {
        console.error("Erro ao buscar faixas_fipe:", error);
        toast.error("Erro ao carregar faixas FIPE");
        setLoading(false);
        return;
      }

      const mapped: FaixaFipe[] = (faixas || []).map((f: any) => ({
        id: f.id,
        categoria_id: f.categoria_id,
        fator: f.fator ?? 1,
        fipe_inicial: f.fipe_inicial ?? 0,
        fipe_final: f.fipe_final ?? 0,
        descricao: f.descricao,
        taxa_adm: f.taxa_adm,
        ativo: f.ativo,
        created_at: f.created_at,
        categoria_nome: f.categorias_veiculo?.nome ?? "Sem categoria",
      }));
      setData(mapped);
      setLoading(false);
    }
    fetch();
  }, []);

  return { faixas: data, loading };
}

function useCategorias() {
  const [data, setData] = useState<CategoriaVeiculo[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data: cats, error } = await supabase
        .from("categorias_veiculo")
        .select("id, nome, ativo")
        .eq("ativo", true)
        .order("nome");

      if (error) {
        console.error("Erro ao buscar categorias:", error);
        return;
      }
      setData(cats || []);
    }
    fetch();
  }, []);

  return data;
}

function useRegionais() {
  const [data, setData] = useState<Regional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const { data: regs, error } = await supabase
        .from("regionais")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) {
        console.error("Erro ao buscar regionais:", error);
        toast.error("Erro ao carregar regionais");
        setLoading(false);
        return;
      }

      // For now, vehicle counts are not available from a vehicles table,
      // so we set veiculos = 0. When a veiculos table exists, query counts here.
      const mapped: Regional[] = (regs || []).map((r: any) => ({
        ...r,
        veiculos: 0,
      }));
      setData(mapped);
      setLoading(false);
    }
    fetch();
  }, []);

  return { regionais: data, loading };
}

function useRateioConfig() {
  const [data, setData] = useState<RateioConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const { data: configs, error } = await supabase
        .from("rateio_config")
        .select("*")
        .order("mes_referencia", { ascending: false });

      if (error) {
        console.error("Erro ao buscar rateio_config:", error);
        toast.error("Erro ao carregar histórico de distribuição");
        setLoading(false);
        return;
      }
      setData(configs || []);
      setLoading(false);
    }
    fetch();
  }, []);

  return { configs: data, loading };
}

// ── Dashboard Component ─────────────────────────────────────

function DashboardRateio() {
  const [open, setOpen] = useState(false);
  const { faixas, loading: loadingFaixas } = useFaixasFipe();
  const { regionais, loading: loadingRegionais } = useRegionais();

  const totalVeiculos = regionais.reduce((s, r) => s + (r.veiculos ?? 0), 0);
  const regionalMaior = regionais.length > 0
    ? regionais.reduce((a, b) => ((b.veiculos ?? 0) > (a.veiculos ?? 0) ? b : a))
    : { nome: "—", veiculos: 0 };
  const maxVeiculos = Math.max(regionalMaior.veiculos ?? 1, 1);

  const fatorMedioGeral = faixas.length > 0
    ? faixas.reduce((s, c) => s + c.fator, 0) / faixas.length
    : 0;
  const custoMedioRateio = fatorMedioGeral * 50;

  // Resumo por categoria
  const categoriaResumo = useMemo(() => {
    const catMap = new Map<string, { total: number; count: number }>();
    faixas.forEach(f => {
      const cat = f.categoria_nome ?? "Sem categoria";
      const cur = catMap.get(cat) ?? { total: 0, count: 0 };
      cur.total += f.fator;
      cur.count += 1;
      catMap.set(cat, cur);
    });
    const totalFaixas = faixas.length || 1;
    return Array.from(catMap.entries()).map(([categoria, { total, count }]) => ({
      categoria,
      fatorMedio: count > 0 ? total / count : 0,
      pct: Math.round((count / totalFaixas) * 100),
    }));
  }, [faixas]);

  const isLoading = loadingFaixas || loadingRegionais;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors text-sm font-medium text-primary"
      >
        <span>{open ? "▼" : "▶"} Dashboard de Rateio</span>
        <span className="text-xs font-normal text-muted-foreground">
          {open ? "Ocultar" : "Ver Dashboard"}
        </span>
      </button>

      {open && (
        <div className="p-5 space-y-6 bg-background">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Carregando dados...</span>
            </div>
          ) : (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="border border-border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Veículos</p>
                  <p className="text-2xl font-bold text-primary">{totalVeiculos.toLocaleString("pt-BR")}</p>
                  <p className="text-xs text-muted-foreground mt-1">{regionais.length} regionais</p>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Regional com Mais Veículos</p>
                  <p className="text-lg font-bold text-primary">{regionalMaior.nome}</p>
                  <p className="text-xs text-muted-foreground mt-1">{(regionalMaior.veiculos ?? 0).toLocaleString("pt-BR")} veículos</p>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Custo Médio Rateio</p>
                  <p className="text-2xl font-bold text-primary">
                    {custoMedioRateio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">fator médio × R$ 50</p>
                </div>
              </div>

              {/* Gráfico de barras por regional */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Veículos por Regional</p>
                <div className="space-y-2">
                  {regionais.map(r => (
                    <div key={r.id} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-36 truncate shrink-0">{r.nome}</span>
                      <div className="flex-1 bg-primary/10 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${((r.veiculos ?? 0) / maxVeiculos) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-foreground w-12 text-right shrink-0">
                        {(r.veiculos ?? 0).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumo por categoria */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Resumo por Categoria</p>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted text-xs text-muted-foreground">
                        <th className="text-left px-3 py-2 font-medium">Categoria</th>
                        <th className="text-right px-3 py-2 font-medium">Fator Médio</th>
                        <th className="text-right px-3 py-2 font-medium">% das Faixas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoriaResumo.map((c, i) => (
                        <tr key={c.categoria} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                          <td className="px-3 py-2 font-medium">{c.categoria}</td>
                          <td className="px-3 py-2 text-right font-mono">{c.fatorMedio.toFixed(2)}x</td>
                          <td className="px-3 py-2 text-right">{c.pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────

export default function RateioTab() {
  const [subTab, setSubTab] = useState<"estrutura" | "distribuicao" | "historico" | "carga">("estrutura");
  const [showImportExport, setShowImportExport] = useState(false);

  const tabs = [
    { id: "estrutura" as const, label: "Estrutura de Cotas", icon: FileSpreadsheet },
    { id: "distribuicao" as const, label: "Distribuição de Rateio", icon: Calculator },
    { id: "historico" as const, label: "Histórico Distribuição", icon: Search },
    { id: "carga" as const, label: "Carga Inicial Gestão", icon: Upload },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary">Rateio</h2>
          <p className="text-sm text-muted-foreground">Estrutura de cotas, distribuição e histórico de rateio</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={() => setShowImportExport(true)}>
          <ArrowUpDown className="h-4 w-4" />
          Importar/Exportar
        </Button>
      </div>

      <Dialog open={showImportExport} onOpenChange={setShowImportExport}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar / Exportar Cotas</DialogTitle>
          </DialogHeader>
          <ImportExportCotas />
        </DialogContent>
      </Dialog>

      <DashboardRateio />

      <div className="flex gap-1 mb-5 overflow-x-auto flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
              subTab === t.id
                ? "bg-[#002050] text-white shadow-md"
                : "bg-[#003870] text-white hover:bg-[#002a57]"
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
  const { faixas, loading } = useFaixasFipe();
  const categorias = useCategorias();
  const { regionais } = useRegionais();
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [showEdit, setShowEdit] = useState<FaixaFipe | null>(null);
  const [showRateioManual, setShowRateioManual] = useState(false);
  const [rateioManual, setRateioManual] = useState({
    associado: "",
    valor: "",
    mesReferencia: "",
    regional: "",
    categoria: "",
  });
  const [salvandoManual, setSalvandoManual] = useState(false);

  const filtered = faixas.filter(c => filtroCategoria === "Todas" || c.categoria_nome === filtroCategoria);

  const categoriaNomes = useMemo(() => {
    const names = new Set(faixas.map(f => f.categoria_nome ?? "Sem categoria"));
    return Array.from(names).sort();
  }, [faixas]);


  const handleSalvarRateioManual = async () => {
    if (!rateioManual.associado || !rateioManual.valor || !rateioManual.mesReferencia || !rateioManual.regional || !rateioManual.categoria) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSalvandoManual(true);
    try {
      const { error } = await supabase.from("rateio_config").insert({
        mes_referencia: rateioManual.mesReferencia,
        regional_id: rateioManual.regional,
        categoria_id: rateioManual.categoria,
        valor_base: parseFloat(rateioManual.valor) || 0,
        multiplicador: 1.0,
        valor_calculado: parseFloat(rateioManual.valor) || 0,
      });
      if (error) throw error;
      toast.success("Rateio manual gravado com sucesso");
      setShowRateioManual(false);
      setRateioManual({ associado: "", valor: "", mesReferencia: "", regional: "", categoria: "" });
    } catch (e: any) {
      toast.error(e.message || "Erro ao gravar rateio manual");
    } finally {
      setSalvandoManual(false);
    }
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
              {categoriaNomes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex gap-2">
          <Button className="gap-2 text-xs bg-primary hover:bg-primary/90 text-white" onClick={() => setShowRateioManual(true)}>
            <Plus className="h-4 w-4" />Rateio Manual
          </Button>
        </div>
      </div>

      {/* Tabela de cotas */}
      <div className="border rounded-lg border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="text-xs">Valor Inicial (FIPE)</TableHead>
              <TableHead className="text-xs">Valor Final (FIPE)</TableHead>
              <TableHead className="text-xs">Categoria Veículo</TableHead>
              <TableHead className="text-xs">Descrição</TableHead>
              <TableHead className="text-xs text-right">Fator Multiplicador</TableHead>
              <TableHead className="text-xs w-[60px]">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Carregando faixas FIPE...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                  Nenhuma faixa FIPE encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="text-sm font-mono">R$ {c.fipe_inicial.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-sm font-mono">R$ {c.fipe_final.toLocaleString("pt-BR")}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs border-primary/30 bg-primary/8">{c.categoria_nome}</Badge></TableCell>
                  <TableCell className="text-sm">{c.descricao ?? "—"}</TableCell>
                  <TableCell className="text-sm text-right font-bold font-mono">{c.fator.toFixed(1)}x</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowEdit(c)}><Edit className="h-3 w-3" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Histórico de importações (stays mock) */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-primary">Histórico de Importações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
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
                    <TableCell><Badge className={`text-xs ${h.status === "Sucesso" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{h.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-primary">Editar Cota</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Valor Inicial (R$)</Label><Input defaultValue={showEdit?.fipe_inicial} /></div>
            <div><Label className="text-xs">Valor Final (R$)</Label><Input defaultValue={showEdit?.fipe_final} /></div>
            <div><Label className="text-xs">Categoria</Label>
              <Select defaultValue={showEdit?.categoria_nome}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categoriaNomes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label className="text-xs">Fator Multiplicador</Label><Input defaultValue={showEdit?.fator} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(null)} className="border-border">Cancelar</Button>
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2" onClick={() => { toast.success("Cota atualizada"); setShowEdit(null); }}>
              <Save className="h-4 w-4" />Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rateio Manual Dialog */}
      <Dialog open={showRateioManual} onOpenChange={setShowRateioManual}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-primary">Rateio Manual</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Associado / Veículo</Label>
              <Input
                value={rateioManual.associado}
                onChange={e => setRateioManual(prev => ({ ...prev, associado: e.target.value }))}
                placeholder="Nome do associado ou placa do veículo"
              />
            </div>
            <div>
              <Label className="text-xs">Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={rateioManual.valor}
                onChange={e => setRateioManual(prev => ({ ...prev, valor: e.target.value }))}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label className="text-xs">Mês Referência</Label>
              <Input
                value={rateioManual.mesReferencia}
                onChange={e => setRateioManual(prev => ({ ...prev, mesReferencia: e.target.value }))}
                placeholder="MM/AAAA"
              />
            </div>
            <div>
              <Label className="text-xs">Regional</Label>
              <Select value={rateioManual.regional} onValueChange={v => setRateioManual(prev => ({ ...prev, regional: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione a regional" /></SelectTrigger>
                <SelectContent>
                  {regionais.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={rateioManual.categoria} onValueChange={v => setRateioManual(prev => ({ ...prev, categoria: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                <SelectContent>
                  {categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRateioManual(false)} className="border-border">Cancelar</Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-white gap-2"
              onClick={handleSalvarRateioManual}
              disabled={salvandoManual}
            >
              {salvandoManual ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
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
  const { faixas, loading: loadingFaixas } = useFaixasFipe();
  const { regionais, loading: loadingRegionais } = useRegionais();
  const categorias = useCategorias();
  const [step, setStep] = useState(0);
  const [mesRef, setMesRef] = useState("12/2025");
  const [dataLimite, setDataLimite] = useState("2025-12-15");
  const [valorBase, setValorBase] = useState("532.35");
  const [valoresBase, setValoresBase] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  // Initialize valoresBase when categorias load
  useEffect(() => {
    if (categorias.length > 0 && Object.keys(valoresBase).length === 0) {
      const initial: Record<string, string> = {};
      categorias.forEach(c => {
        initial[c.id] = valorBase;
      });
      setValoresBase(initial);
    }
  }, [categorias]);

  const steps = [
    "Mês Referência", "Data Limite", "Categorias e Regionais",
    "Valor Base", "Cálculo Automático", "Tabela Completa",
    "Validação", "Gravar Rateio",
  ];

  const totalVeiculos = regionais.reduce((s, r) => s + (r.veiculos ?? 0), 0);
  const vb = parseFloat(valorBase) || 0;

  // Build distribution table
  const distribuicao = regionais.map(r => ({
    regional: r.nome,
    categoria: "Automóvel",
    qtdeVeiculos: r.veiculos ?? 0,
    qtdeCotas: Math.floor((r.veiculos ?? 0) * 1.1),
    valorCota: vb,
    valorCotaAlterado: vb,
    valorRateado: (r.veiculos ?? 0) * vb,
  }));

  const totalRateado = distribuicao.reduce((s, d) => s + d.valorRateado, 0);

  const salvarRateio = async () => {
    if (regionais.length === 0) {
      toast.error("Nenhuma regional encontrada. Cadastre regionais antes de distribuir rateio.");
      return;
    }
    setSalvando(true);
    try {
      const records = regionais.map(r => ({
        mes_referencia: mesRef,
        regional_id: r.id,
        categoria_id: null,
        valor_base: vb,
        multiplicador: 1.0,
        valor_calculado: (r.veiculos ?? 0) * vb,
      }));

      const { error } = await supabase.from("rateio_config").insert(records);
      if (error) throw error;

      toast.success(`Rateio gravado com sucesso para ${mesRef} — Total: R$ ${totalRateado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
      setStep(0);
    } catch (e: any) {
      toast.error(e.message || "Erro ao gravar rateio");
    } finally {
      setSalvando(false);
    }
  };

  const isLoading = loadingFaixas || loadingRegionais;

  return (
    <div className="space-y-5">
      {/* Card explicativo */}
      <Card className="border-border bg-muted/50">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-primary">Conceito Mutualista</p>
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
                i === step ? "bg-primary text-white" :
                i < step ? "bg-secondary text-foreground" :
                "bg-muted text-muted-foreground"
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

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-primary">Passo {step + 1}: {steps[step]}</CardTitle>
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
              {isLoading ? (
                <div className="flex items-center justify-center py-8 gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Carregando dados...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card className="border-border"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-primary">{totalVeiculos.toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Total Veículos</p></CardContent></Card>
                    <Card className="border-border"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-primary">{regionais.length}</p><p className="text-xs text-muted-foreground">Regionais</p></CardContent></Card>
                    <Card className="border-border"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-primary">{categorias.length}</p><p className="text-xs text-muted-foreground">Categorias</p></CardContent></Card>
                    <Card className="border-border"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-primary">{faixas.length}</p><p className="text-xs text-muted-foreground">Intervalos FIPE</p></CardContent></Card>
                  </div>
                  <div className="border rounded-lg border-border overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-muted"><TableHead className="text-xs">Regional</TableHead><TableHead className="text-xs text-right">Veículos</TableHead><TableHead className="text-xs text-right">% do Total</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {regionais.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="text-sm font-medium">{r.nome}</TableCell>
                            <TableCell className="text-sm text-right">{(r.veiculos ?? 0).toLocaleString("pt-BR")}</TableCell>
                            <TableCell className="text-sm text-right">{totalVeiculos > 0 ? (((r.veiculos ?? 0) / totalVeiculos) * 100).toFixed(1) : "0.0"}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3 - Valor Base */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold">Valor Base Padrão — Primeira Cota (R$)</Label>
                <Input value={valorBase} onChange={e => {
                  setValorBase(e.target.value);
                  // Update all categories that still have the old default
                  const updated = { ...valoresBase };
                  Object.keys(updated).forEach(k => { updated[k] = e.target.value; });
                  setValoresBase(updated);
                }} className="w-48" />
                <p className="text-xs text-muted-foreground mt-1">Este valor sera aplicado como padrao. Ajuste por categoria abaixo se necessario.</p>
              </div>
              <div className="border rounded-lg border-border p-4 space-y-3">
                <p className="text-xs font-semibold text-primary">Valor Base por Categoria</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categorias.map(cat => (
                    <div key={cat.id} className="flex items-center gap-3">
                      <Label className="text-xs w-44 shrink-0">{cat.nome}</Label>
                      <Input
                        value={valoresBase[cat.id] ?? valorBase}
                        onChange={e => setValoresBase(prev => ({ ...prev, [cat.id]: e.target.value }))}
                        className="w-32"
                        type="number"
                        step="0.01"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">As demais cotas serao calculadas multiplicando o valor base pelo fator da categoria: <strong>Valor Cota = Valor Base x Fator</strong>.</p>
            </div>
          )}

          {/* Step 4 - Cálculo Automático */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Valores calculados automaticamente: <strong>Valor Cota = R$ {vb.toFixed(2)} × Fator</strong></p>
              {loadingFaixas ? (
                <div className="flex items-center justify-center py-8 gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Carregando faixas...</span>
                </div>
              ) : (
                <div className="border rounded-lg border-border overflow-hidden">
                  <Table>
                    <TableHeader><TableRow className="bg-muted"><TableHead className="text-xs">Categoria</TableHead><TableHead className="text-xs">Intervalo FIPE</TableHead><TableHead className="text-xs text-right">Fator</TableHead><TableHead className="text-xs text-right">Valor Cota Calculado</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {faixas.map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="text-sm">{c.categoria_nome}</TableCell>
                          <TableCell className="text-sm font-mono">R$ {c.fipe_inicial.toLocaleString("pt-BR")} — R$ {c.fipe_final.toLocaleString("pt-BR")}</TableCell>
                          <TableCell className="text-sm text-right font-mono">{c.fator.toFixed(1)}x</TableCell>
                          <TableCell className="text-sm text-right font-bold">R$ {(vb * c.fator).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {/* Step 5 - Tabela Completa */}
          {step === 5 && (
            <div className="border rounded-lg border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
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
                  <TableRow className="bg-muted font-bold">
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
                <Card className="border-green-200 bg-success/8"><CardContent className="p-3 text-center"><CheckCircle2 className="h-5 w-5 mx-auto text-success mb-1" /><p className="text-xs font-medium text-success">Mês: {mesRef}</p></CardContent></Card>
                <Card className="border-green-200 bg-success/8"><CardContent className="p-3 text-center"><CheckCircle2 className="h-5 w-5 mx-auto text-success mb-1" /><p className="text-xs font-medium text-success">{totalVeiculos.toLocaleString("pt-BR")} veículos</p></CardContent></Card>
                <Card className="border-green-200 bg-success/8"><CardContent className="p-3 text-center"><CheckCircle2 className="h-5 w-5 mx-auto text-success mb-1" /><p className="text-xs font-medium text-success">{regionais.length} regionais</p></CardContent></Card>
                <Card className="border-green-200 bg-success/8"><CardContent className="p-3 text-center"><CheckCircle2 className="h-5 w-5 mx-auto text-success mb-1" /><p className="text-xs font-medium text-success">R$ {totalRateado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></CardContent></Card>
              </div>
              <div className="p-3 bg-warning/8 border border-yellow-200 rounded-lg text-sm text-warning flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Confirme os valores antes de gravar. Esta ação gerará os boletos com os valores de rateio para o período {mesRef}.</span>
              </div>
            </div>
          )}

          {/* Step 7 - Gravar */}
          {step === 7 && (
            <div className="text-center py-6 space-y-4">
              <Calculator className="h-12 w-12 mx-auto text-primary" />
              <div>
                <p className="text-lg font-bold text-primary">Rateio pronto para gravação</p>
                <p className="text-sm text-muted-foreground mt-1">Mês: {mesRef} · Veículos: {totalVeiculos.toLocaleString("pt-BR")} · Total: R$ {totalRateado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          )}

          {/* Navigation buttons inside card */}
          <div className="flex justify-between pt-4">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> Anterior
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} className="gap-2 ml-auto">
                Próximo <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={salvarRateio} disabled={salvando} className="gap-2 ml-auto bg-success hover:bg-success/90">
                {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Gravar Rateio
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 3) HISTÓRICO DE DISTRIBUIÇÃO
// ═══════════════════════════════════════════════════════════

function HistoricoDistribuicao() {
  const { configs, loading: loadingConfigs } = useRateioConfig();
  const { regionais } = useRegionais();
  const [expandido, setExpandido] = useState<number | null>(null);
  const [filtroRegional, setFiltroRegional] = useState("Todas");
  const [loadingExport, setLoadingExport] = useState<string | null>(null);

  // Group rateio_config by mes_referencia
  const histDist = useMemo(() => {
    const grouped = new Map<string, RateioConfig[]>();
    configs.forEach(c => {
      const mes = c.mes_referencia;
      if (!grouped.has(mes)) grouped.set(mes, []);
      grouped.get(mes)!.push(c);
    });

    // Build a regional id->name map
    const regMap = new Map<string, string>();
    regionais.forEach(r => regMap.set(r.id, r.nome));

    return Array.from(grouped.entries()).map(([mes, items]) => {
      const valorTotal = items.reduce((s, i) => s + (i.valor_calculado ?? 0), 0);
      const regionaisIds = new Set(items.map(i => i.regional_id).filter(Boolean));
      const detalhes = Array.from(
        items.reduce((map, i) => {
          const rid = i.regional_id ?? "unknown";
          const cur = map.get(rid) ?? { regional: regMap.get(rid) ?? rid, veiculos: 0, valor: 0 };
          cur.valor += i.valor_calculado ?? 0;
          // veiculos count not available in rateio_config, approximate from entries
          cur.veiculos += 1;
          map.set(rid, cur);
          return map;
        }, new Map<string, { regional: string; veiculos: number; valor: number }>()).values()
      );

      return {
        mes,
        valorTotal,
        qtdeEntradas: items.length,
        regionais: regionaisIds.size,
        intervalos: items.length,
        detalhes,
      };
    });
  }, [configs, regionais]);

  const handleExport = () => {
    setLoadingExport("excel");
    setTimeout(() => { toast.success("Relatório exportado para Excel"); setLoadingExport(null); }, 900);
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
              {regionais.map(r => <SelectItem key={r.id} value={r.nome}>{r.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="gap-2 text-xs border-border ml-auto" disabled={loadingExport === "excel"} onClick={handleExport}>
          {loadingExport === "excel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Exportar Excel
        </Button>
      </div>

      <div className="border rounded-lg border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="text-xs w-[30px]"></TableHead>
              <TableHead className="text-xs">Mês Referência</TableHead>
              <TableHead className="text-xs text-right">Valor Total Distribuído</TableHead>
              <TableHead className="text-xs text-right">Entradas</TableHead>
              <TableHead className="text-xs text-right">Regionais</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingConfigs ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Carregando histórico...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : histDist.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                  Nenhum histórico de distribuição encontrado.
                </TableCell>
              </TableRow>
            ) : (
              histDist.map((h, i) => (
                <>
                  <TableRow key={i} className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandido(expandido === i ? null : i)}>
                    <TableCell className="px-2">
                      {expandido === i ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{h.mes}</TableCell>
                    <TableCell className="text-sm text-right font-bold">R$ {h.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-sm text-right">{h.qtdeEntradas.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-sm text-right">{h.regionais}</TableCell>
                  </TableRow>
                  {expandido === i && h.detalhes.length > 0 && (
                    <TableRow key={`det-${i}`}>
                      <TableCell colSpan={5} className="bg-muted/50 p-4">
                        <p className="text-xs font-semibold text-primary mb-2">Detalhes por Regional — {h.mes}</p>
                        <div className="border rounded border-border overflow-hidden">
                          <Table>
                            <TableHeader><TableRow className="bg-muted/40"><TableHead className="text-xs">Regional</TableHead><TableHead className="text-xs text-right">Entradas</TableHead><TableHead className="text-xs text-right">Valor</TableHead></TableRow></TableHeader>
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
              ))
            )}
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
  const { regionais, loading: loadingRegionais } = useRegionais();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Build carga data from regionais
  const cargaGestao = useMemo(() => {
    return regionais.map(r => ({
      regional: r.nome,
      totalVeiculos: r.veiculos ?? 0,
      totalCotas: Math.floor((r.veiculos ?? 0) * 1.1),
      automoveis: Math.floor((r.veiculos ?? 0) * 0.75),
      motos: Math.floor((r.veiculos ?? 0) * 0.15),
      pesados: Math.floor((r.veiculos ?? 0) * 0.10),
      status: (r.veiculos ?? 0) < 50 ? "Pendente" as const : "Executada" as const,
    }));
  }, [regionais]);

  const totalVeiculos = cargaGestao.reduce((s, r) => s + r.totalVeiculos, 0);
  const totalCotas = cargaGestao.reduce((s, r) => s + r.totalCotas, 0);
  const executadas = cargaGestao.filter(r => r.status === "Executada").length;

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
      <Card className="border-border bg-muted/50">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-primary">Carga Inicial — Sistema Gestão</p>
            <p className="text-xs text-muted-foreground mt-1">Dados referentes a <strong>01/12/2025</strong> do sistema legado Gestão. Esta operação importa a estrutura de veículos e cotas para o novo sistema.</p>
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
        <Card className="border-border"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-primary">{totalVeiculos.toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Total Veículos</p></CardContent></Card>
        <Card className="border-border"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-primary">{totalCotas.toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Total Cotas</p></CardContent></Card>
        <Card className="border-border"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-success">{executadas}/{cargaGestao.length}</p><p className="text-xs text-muted-foreground">Regionais Executadas</p></CardContent></Card>
        <Card className="border-border"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-warning">{cargaGestao.length - executadas}</p><p className="text-xs text-muted-foreground">Pendentes</p></CardContent></Card>
      </div>

      {/* Table */}
      <div className="border rounded-lg border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
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
            {loadingRegionais ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Carregando regionais...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {cargaGestao.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm font-medium">{r.regional}</TableCell>
                    <TableCell className="text-sm text-right">{r.totalVeiculos.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-sm text-right">{r.totalCotas.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-sm text-right">{r.automoveis.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-sm text-right">{r.motos.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-sm text-right">{r.pesados.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${r.status === "Executada" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted font-bold">
                  <TableCell className="text-sm">TOTAL</TableCell>
                  <TableCell className="text-sm text-right">{totalVeiculos.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-sm text-right">{totalCotas.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-sm text-right">{cargaGestao.reduce((s, r) => s + r.automoveis, 0).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-sm text-right">{cargaGestao.reduce((s, r) => s + r.motos, 0).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-sm text-right">{cargaGestao.reduce((s, r) => s + r.pesados, 0).toLocaleString("pt-BR")}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Executar Carga */}
      <div className="flex justify-end">
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-white" onClick={() => setShowConfirm(true)}>
          <Play className="h-4 w-4" />Executar Carga Inicial
        </Button>
      </div>

      {/* Confirmação */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-primary">Confirmar Carga Inicial</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="p-3 bg-warning/8 border border-yellow-200 rounded-lg text-sm text-warning flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Esta ação irá importar os dados do sistema Gestão para as <strong>{cargaGestao.length - executadas} regionais pendentes</strong>. Os valores de cota serão zerados (R$ 0,00). Deseja continuar?</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Data Operação: 01/12/2025 16:25:52</p>
              <p>• Data Limite: 31/12/2058</p>
              <p>• Regionais pendentes: {cargaGestao.filter(r => r.status === "Pendente").map(r => r.regional).join(", ")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="border-border">Cancelar</Button>
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-white" onClick={executarCarga} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {loading ? "Executando..." : "Confirmar Carga"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
