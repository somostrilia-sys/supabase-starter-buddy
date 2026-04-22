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
import DistribuicaoRateioFerramenta from "@/pages/gestao/ferramentas/DistribuicaoRateioFerramenta";

// ── Types ──────────────────────────────────────────────────

interface FaixaFipe {
  id: string;
  regional_id: string | null;
  regional_nome: string;
  fator: number;                // cota_fator no banco
  fipe_inicial: number;         // fipe_min no banco
  fipe_final: number;           // fipe_max no banco
  taxa_adm: number;             // taxa_administrativa no banco
  valor_rateio: number;         // rateio no banco
  tipo_veiculo: string;
  created_at: string;
  // Propriedades legadas (read-only, não existem no schema atual)
  categoria_id: string | null;
  descricao: string | null;
  valor_cota: number | null;
  codigo_sga: string | null;
  ativo: boolean;
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
      // Paginação manual (919 rows, PostgREST default 1000).
      // Schema: id, regional_id, fipe_min, fipe_max, taxa_administrativa, rateio,
      // cota_fator, tipo_veiculo, created_at. Sem `ativo`, sem `categoria_id`,
      // sem `descricao`, sem `valor_cota` (campos legados do UI antigo).
      const PAGE_SIZE = 1000;
      let all: any[] = [];
      let from = 0;
      while (true) {
        const { data: faixas, error } = await supabase
          .from("faixas_fipe")
          .select("id, regional_id, fipe_min, fipe_max, taxa_administrativa, rateio, cota_fator, tipo_veiculo, created_at, regionais:regional_id(nome)")
          .order("regional_id")
          .order("tipo_veiculo")
          .order("fipe_min")
          .range(from, from + PAGE_SIZE - 1);
        if (error) {
          console.error("Erro ao buscar faixas_fipe:", error);
          toast.error(`Erro ao carregar faixas FIPE: ${error.message}`);
          setLoading(false);
          return;
        }
        if (!faixas || faixas.length === 0) break;
        all = all.concat(faixas);
        if (faixas.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      const mapped: FaixaFipe[] = all.map((f: any) => ({
        id: f.id,
        regional_id: f.regional_id,
        regional_nome: f.regionais?.nome || "—",
        fator: Number(f.cota_fator) || 1,
        fipe_inicial: Number(f.fipe_min) || 0,
        fipe_final: Number(f.fipe_max) || 0,
        taxa_adm: Number(f.taxa_administrativa) || 0,
        valor_rateio: Number(f.rateio) || 0,
        tipo_veiculo: f.tipo_veiculo || "",
        created_at: f.created_at,
        // Campos legados mantidos para retrocompatibilidade (não usados)
        categoria_id: null,
        descricao: f.tipo_veiculo || "",
        valor_cota: null,
        codigo_sga: null,
        ativo: true,
        categoria_nome: f.tipo_veiculo || "Sem categoria",
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
  const [filtroRegional, setFiltroRegional] = useState("Todas");
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

  const filtered = faixas.filter(c =>
    (filtroCategoria === "Todas" || c.categoria_nome === filtroCategoria) &&
    (filtroRegional === "Todas" || c.regional_nome === filtroRegional)
  );

  const categoriaNomes = useMemo(() => {
    const names = new Set(faixas.map(f => f.categoria_nome ?? "Sem categoria"));
    return Array.from(names).sort();
  }, [faixas]);

  const regionaisNomes = useMemo(() => {
    const names = new Set(faixas.map(f => f.regional_nome));
    return Array.from(names).filter(n => n !== "—").sort();
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
          <Label className="text-xs">Regional</Label>
          <Select value={filtroRegional} onValueChange={setFiltroRegional}>
            <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              {regionaisNomes.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
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
        <div className="max-h-[60vh] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted sticky top-0 z-10">
              <TableHead className="text-xs">Regional</TableHead>
              <TableHead className="text-xs">Valor Inicial (FIPE)</TableHead>
              <TableHead className="text-xs">Valor Final (FIPE)</TableHead>
              <TableHead className="text-xs">Categoria</TableHead>
              <TableHead className="text-xs text-right">Taxa Adm. (R$)</TableHead>
              <TableHead className="text-xs text-right">Rateio (R$)</TableHead>
              <TableHead className="text-xs text-right">Fator</TableHead>
              <TableHead className="text-xs w-[60px]">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Carregando faixas FIPE...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">
                  Nenhuma faixa FIPE encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="text-xs">{c.regional_nome}</TableCell>
                  <TableCell className="text-sm font-mono">R$ {c.fipe_inicial.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-sm font-mono">R$ {c.fipe_final.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs border-primary/30 bg-primary/8">{c.categoria_nome}</Badge></TableCell>
                  <TableCell className="text-sm text-right font-mono">R$ {c.taxa_adm.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-sm text-right font-mono">R$ {c.valor_rateio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-sm text-right font-bold font-mono">{c.fator.toFixed(2)}x</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowEdit(c)}><Edit className="h-3 w-3" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
        <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/30">
          {filtered.length} {filtered.length === 1 ? "faixa" : "faixas"} · vínculos distintos de <strong>faixa × categoria × regional</strong> (valores podem variar por regional)
        </div>
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

      {/* Edit Dialog — Cotas editáveis com persistência real */}
      <EditCotaDialog showEdit={showEdit} setShowEdit={setShowEdit} onSaved={() => window.location.reload()} />


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
  // Reusa a logica de Ferramentas > Distribuicao de Rateio.
  // Antes era um wizard de 8 passos com simulacao sem persistencia;
  // agora usa o componente DistribuicaoRateioFerramenta (persistencia real em rateio_config).
  return <DistribuicaoRateioFerramenta />;
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

// ═══════════════════════════════════════════════════════════
// EditCotaDialog — edição persistente de faixas FIPE
// ═══════════════════════════════════════════════════════════
function EditCotaDialog({ showEdit, setShowEdit, onSaved }: { showEdit: any; setShowEdit: (v: any) => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (showEdit) {
      setForm({
        fipe_inicial: showEdit.fipe_inicial ?? 0,
        fipe_final: showEdit.fipe_final ?? 0,
        fator: showEdit.fator ?? 1,
        taxa_adm: showEdit.taxa_adm ?? 0,
        valor_rateio: showEdit.valor_rateio ?? 0,
        tipo_veiculo: showEdit.tipo_veiculo ?? "",
      });
    }
  }, [showEdit]);

  const save = async () => {
    if (!showEdit) return;
    setSaving(true);
    try {
      // Usar nomes reais de coluna de faixas_fipe (schema: fipe_min, fipe_max,
      // cota_fator, taxa_administrativa, rateio, tipo_veiculo).
      // Antes o save usava fipe_inicial/fipe_final/fator/taxa_adm/valor_cota/valor_rateio/descricao
      // — nomes de coluna inexistentes que causavam erro 42703 silencioso.
      const { error } = await (supabase as any).from("faixas_fipe").update({
        fipe_min: Number(form.fipe_inicial),
        fipe_max: Number(form.fipe_final),
        cota_fator: Number(form.fator),
        taxa_administrativa: Number(form.taxa_adm),
        rateio: Number(form.valor_rateio),
        tipo_veiculo: form.tipo_veiculo || null,
      }).eq("id", showEdit.id);
      if (error) throw error;
      toast.success("Faixa atualizada");
      setShowEdit(null);
      onSaved();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    }
    setSaving(false);
  };

  return (
    <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-primary">Editar Faixa FIPE</DialogTitle>
          {showEdit?.regional_nome && (
            <p className="text-xs text-muted-foreground">Regional: <strong>{showEdit.regional_nome}</strong></p>
          )}
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Fipe Inicial (R$) *</Label>
            <Input type="number" step="0.01" value={form.fipe_inicial} onChange={e => setForm((p: any) => ({ ...p, fipe_inicial: e.target.value }))} /></div>
          <div><Label className="text-xs">Fipe Final (R$) *</Label>
            <Input type="number" step="0.01" value={form.fipe_final} onChange={e => setForm((p: any) => ({ ...p, fipe_final: e.target.value }))} /></div>
          <div><Label className="text-xs">Fator Multiplicador</Label>
            <Input type="number" step="0.01" value={form.fator} onChange={e => setForm((p: any) => ({ ...p, fator: e.target.value }))} /></div>
          <div><Label className="text-xs">Taxa Administrativa (R$)</Label>
            <Input type="number" step="0.01" value={form.taxa_adm} onChange={e => setForm((p: any) => ({ ...p, taxa_adm: e.target.value }))} /></div>
          <div className="col-span-2"><Label className="text-xs">Valor Rateio (R$)</Label>
            <Input type="number" step="0.01" value={form.valor_rateio} onChange={e => setForm((p: any) => ({ ...p, valor_rateio: e.target.value }))} /></div>
          <div className="col-span-2"><Label className="text-xs">Tipo Veículo</Label>
            <Select value={form.tipo_veiculo} onValueChange={v => setForm((p: any) => ({ ...p, tipo_veiculo: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AUTOMOVEL">Automóvel</SelectItem>
                <SelectItem value="UTILITARIOS">Utilitários</SelectItem>
                <SelectItem value="MOTOCICLETA">Motocicleta</SelectItem>
                <SelectItem value="PESADOS">Pesados</SelectItem>
                <SelectItem value="VANS E PESADOS P.P">Vans e Pesados P.P</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowEdit(null)}>Cancelar</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
