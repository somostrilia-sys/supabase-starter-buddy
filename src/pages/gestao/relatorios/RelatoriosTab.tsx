import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import RelatoriosGeraisTab from "./RelatoriosGeraisTab";
import GerarRelatorio from "./GerarRelatorio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download, Search, Users, Car, FileText, BarChart3, Eye,
  DollarSign, UserCog, TrendingUp, Shield, Truck, AlertTriangle, Printer,
  Monitor, FileSpreadsheet, ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { exportCSV, exportExcel, exportPDF, printData, type ExportColumn } from "@/utils/exportUtils";

// ── Filter section data ──
const situacoesVeiculo = [
  "ATIVO", "INADIMPLENTE", "INATIVO", "INATIVO - COM PENDÊNCIA",
  "INATIVO - RETIRADA RASTREADOR", "NEGADO", "PENDENTE", "PENDENTE DE REVISTORIA",
  "ATIVO - (MIGRADO)", "INADIMPLENTE - (MIGRADO)", "INATIVO - (MIGRADO)", "PENDENTE - (MIGRADO)",
];

const situacoesAssociado = [
  "ATIVO", "ATIVO - (MIGRADO)", "INADIMPLENTE", "INADIMPLENTE - (MIGRADO)",
  "INATIVO", "INATIVO - COM PENDÊNCIA", "INATIVO - RETIRADA RASTREADOR", "NEGADO",
  "PENDENTE",
];

// regionaisLista and cooperativasLista are loaded from Supabase at runtime
const regionaisListaFallback: string[] = [];
const cooperativasListaFallback: string[] = [];

const tiposVeiculo = [
  "AUTOMÓVEL LEVE", "UTILITÁRIO", "MOTOCICLETA", "CAMINHÃO", "VAN/FURGÃO", "ÔNIBUS/MICRO",
];

const cotasVeiculo = [
  "R$ 20-30 MIL", "R$ 30-40 MIL", "R$ 40-50 MIL", "R$ 50-70 MIL",
  "R$ 70-100 MIL", "R$ 100-150 MIL", "R$ 150-200 MIL", "R$ 200-300 MIL",
];

const categoriasVeiculo = [
  "PASSEIO", "TRABALHO", "LOCAÇÃO", "APP (UBER/99)", "TÁXI",
];

// ── Reusable filter section component ──
function FilterSection({
  title, items, selected, onToggle, columns = 4, color = "primary",
}: {
  title: string; items: string[]; selected: Set<string>; onToggle: (item: string) => void; columns?: number; color?: "primary" | "success" | "warning" | "destructive";
}) {
  const allSelected = items.every(i => selected.has(i));
  const toggleAll = () => {
    if (allSelected) items.forEach(i => { if (selected.has(i)) onToggle(i); });
    else items.forEach(i => { if (!selected.has(i)) onToggle(i); });
  };
  const bgMap = { primary: "bg-primary", success: "bg-success", warning: "bg-warning", destructive: "bg-destructive" };
  return (
    <div className="border border-border">
      <div className={`${bgMap[color]} px-4 py-2`}>
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h4>
      </div>
      <div className="px-4 py-3 bg-card">
        <div className="mb-2">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <Checkbox checked={allSelected} onCheckedChange={toggleAll} className="h-4 w-4" />
            <span className="text-sm font-bold uppercase">TODOS</span>
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-1.5">
          {items.map(item => {
            const isChecked = selected.has(item);
            return (
              <label key={item} className="inline-flex items-center gap-2 cursor-pointer py-0.5">
                <Checkbox checked={isChecked} onCheckedChange={() => onToggle(item)} className="h-4 w-4" />
                <span className={`text-xs ${isChecked ? "text-primary font-medium" : "text-muted-foreground"}`}>{item}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Action bar with View/Print/Excel/PDF ──
function ReportActionBar({
  busca, setBusca, onGenerate, onExportCSV, onExportExcel, onExportPDF, onPrint, placeholder = "Busca rápida...",
}: {
  busca: string; setBusca: (v: string) => void; onGenerate: () => void;
  onExportCSV: () => void; onExportExcel: () => void; onExportPDF: () => void; onPrint: () => void;
  placeholder?: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = (action: string, fn: () => void) => {
    setLoading(action);
    setTimeout(() => { fn(); setLoading(null); }, 400);
  };

  return (
    <div className="flex items-center gap-3 bg-muted/50 border border-border p-4 flex-wrap">
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder={placeholder} value={busca} onChange={e => setBusca(e.target.value)} />
      </div>
      <Button onClick={() => handleAction("tela", onGenerate)} disabled={loading === "tela"}>
        {loading === "tela" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Monitor className="h-4 w-4" />}
        Visualizar Tela
      </Button>
      <Button variant="outline" onClick={() => handleAction("print", () => { onPrint(); toast.success("Enviado para impressão"); })} disabled={loading === "print"}>
        {loading === "print" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
        Imprimir
      </Button>
      <Button variant="outline" onClick={() => handleAction("csv", () => { onExportCSV(); toast.success("CSV exportado"); })} disabled={loading === "csv"}>
        {loading === "csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
        Exportar CSV
      </Button>
      <Button variant="outline" onClick={() => handleAction("excel", () => { onExportExcel(); toast.success("Excel exportado"); })} disabled={loading === "excel"}>
        {loading === "excel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
        Excel
      </Button>
      <Button variant="outline" onClick={() => handleAction("pdf", () => { onExportPDF(); toast.success("PDF gerado"); })} disabled={loading === "pdf"}>
        {loading === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        PDF
      </Button>
    </div>
  );
}

// ── Pagination ──
function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t-2 border-[#747474]">
      <span className="text-xs text-muted-foreground">Página {page} de {totalPages}</span>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="h-7 px-2">
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
          <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="h-7 w-7 p-0 text-xs" onClick={() => onPageChange(p)}>{p}</Button>
        ))}
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="h-7 px-2">
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Data loaded from Supabase (see hooks inside component) ──

const situacaoColor: Record<string, string> = {
  ativo: "bg-success/10 text-success dark:bg-green-900 dark:text-green-300",
  inativo: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  inadimplente: "bg-destructive/8 text-destructive dark:bg-red-900 dark:text-red-300",
  pendente: "bg-warning/10 text-warning dark:bg-yellow-900 dark:text-yellow-300",
  pago_dia: "bg-success/10 text-success dark:bg-green-900 dark:text-green-300",
  pago_atraso: "bg-warning/10 text-warning dark:bg-yellow-900 dark:text-yellow-300",
  vencido: "bg-destructive/8 text-destructive dark:bg-red-900 dark:text-red-300",
  cancelado: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const statusBoleto = ["pago_dia", "pago_atraso", "pendente", "vencido", "cancelado"];
const statusBoletoLabels: Record<string, string> = { pago_dia: "Pago em dia", pago_atraso: "Pago em atraso", pendente: "Pendente", vencido: "Vencido", cancelado: "Cancelado" };
const unidadesBoleto = ["Matriz São Paulo", "Filial RJ", "Filial MG", "Filial PR"];
const consultoresBoleto = ["Ana Oliveira", "Pedro Santos", "Lucas Ferreira"];
const tiposCobranca = ["Mensalidade", "Taxa administrativa", "Multa"];
const bancosBoleto = ["Banco do Brasil", "Itaú", "Bradesco", "Caixa", "Santander"];
const formasPagamento = ["Boleto", "PIX", "Cartão"];

const outrosRelatorios = [
  { id: "usuarios", label: "Usuários", icon: UserCog, desc: "Listagem de usuários do sistema com perfis e acessos" },
  { id: "produtividade", label: "Produtividade", icon: TrendingUp, desc: "Produtividade por operador/vendedor" },
  { id: "cobranca", label: "Cobrança", icon: DollarSign, desc: "Relatório detalhado de cobranças e inadimplência" },
  { id: "cotas", label: "Cotas", icon: BarChart3, desc: "Distribuição de veículos por faixa de cota" },
  { id: "alt_beneficiario", label: "Alterações de Beneficiário", icon: Users, desc: "Log de alterações em dados de associados" },
  { id: "alt_veiculos", label: "Alterações em Veículos", icon: Car, desc: "Histórico de modificações cadastrais de veículos" },
  { id: "veic_boletos", label: "Veículos e Boletos", icon: FileText, desc: "Vinculação financeira veículo × boleto" },
  { id: "eventos", label: "Eventos", icon: AlertTriangle, desc: "Relatório consolidado de sinistros e eventos" },
  { id: "fornecedores", label: "Fornecedores", icon: Truck, desc: "Relatório de fornecedores e sincronismos" },
];

const allColumns = [
  { key: "nome", label: "Nome" }, { key: "cpf", label: "CPF" }, { key: "endereco", label: "Endereço" },
  { key: "telefone", label: "Telefone" }, { key: "email", label: "E-mail" }, { key: "placa", label: "Placa" },
  { key: "modelo", label: "Modelo" }, { key: "ano", label: "Ano" }, { key: "tipo", label: "Tipo" },
  { key: "categoria", label: "Categoria" }, { key: "cota", label: "Cota" }, { key: "cooperativa", label: "Cooperativa" },
  { key: "regional", label: "Regional" }, { key: "dataCadastro", label: "Data Cadastro" }, { key: "situacao", label: "Situação" },
];

const PAGE_SIZE = 10;

export default function RelatoriosTab() {
  const [busca, setBusca] = useState("");
  const [buscaVeic, setBuscaVeic] = useState("");
  const [buscaBol, setBuscaBol] = useState("");
  const [detalhe, setDetalhe] = useState<any | null>(null);
  const [selectedCols, setSelectedCols] = useState<string[]>(["nome", "cpf", "telefone", "placa", "cooperativa", "situacao"]);
  const [outroAtivo, setOutroAtivo] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(true);
  const [pageAssoc, setPageAssoc] = useState(1);
  const [pageVeic, setPageVeic] = useState(1);
  const [pageBol, setPageBol] = useState(1);

  // Fetch regionais from Supabase
  const { data: regionaisData } = useQuery({
    queryKey: ["regionais-lista"],
    queryFn: async () => {
      const { data, error } = await supabase.from("regionais").select("nome");
      if (error) throw error;
      return (data || []).map((r: any) => r.nome as string);
    },
  });
  const regionaisLista = regionaisData?.length ? regionaisData : regionaisListaFallback;

  // Fetch cooperativas from Supabase
  const { data: cooperativasData } = useQuery({
    queryKey: ["cooperativas-lista"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cooperativas").select("nome");
      if (error) throw error;
      return (data || []).map((c: any) => c.nome as string);
    },
  });
  const cooperativasLista = cooperativasData?.length ? cooperativasData : cooperativasListaFallback;

  // Fetch associados from Supabase
  const { data: associadosData } = useQuery({
    queryKey: ["associados-relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase.from("associados").select("*");
      if (error) throw error;
      return data || [];
    },
  });
  const realAssociados: any[] = associadosData || [];

  // Fetch veiculos from Supabase with pagination
  const [veicPageDb, setVeicPageDb] = useState(1);
  const VEIC_PAGE_SIZE = 50;
  const { data: veiculosResult } = useQuery({
    queryKey: ["veiculos-relatorio", veicPageDb],
    queryFn: async () => {
      const offset = (veicPageDb - 1) * VEIC_PAGE_SIZE;
      const { data, error, count } = await (supabase as any)
        .from("veiculos")
        .select("*", { count: "exact" })
        .range(offset, offset + VEIC_PAGE_SIZE - 1);
      if (error) throw error;
      return { rows: data || [], total: count ?? 0 };
    },
  });
  const realVeiculos: any[] = veiculosResult?.rows || [];
  const totalVeiculosCount = veiculosResult?.total || 0;
  const totalPagesVeicDb = Math.ceil(totalVeiculosCount / VEIC_PAGE_SIZE);

  // Fetch boletos from Supabase
  const { data: boletosData } = useQuery({
    queryKey: ["boletos-relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase.from("boletos").select("*").limit(1000);
      if (error) throw error;
      return data || [];
    },
  });
  const realBoletos: any[] = boletosData || [];

  // Derived simple lists for "Demais" tab filters
  const cooperativasSimples = cooperativasLista.slice(0, 10);
  const regionaisSimples = regionaisLista.slice(0, 10);

  const [selSitVeiculo, setSelSitVeiculo] = useState<Set<string>>(new Set(situacoesVeiculo));
  const [selRegional, setSelRegional] = useState<Set<string>>(new Set());
  const [selCooperativa, setSelCooperativa] = useState<Set<string>>(new Set());
  const [selSitAssociado, setSelSitAssociado] = useState<Set<string>>(new Set(situacoesAssociado));
  const [selTipoVeiculo, setSelTipoVeiculo] = useState<Set<string>>(new Set(tiposVeiculo));
  const [selCota, setSelCota] = useState<Set<string>>(new Set(cotasVeiculo));
  const [selCategoria, setSelCategoria] = useState<Set<string>>(new Set(categoriasVeiculo));

  // Auto-select all regionais when they load from Supabase
  useEffect(() => {
    if (regionaisLista.length > 0) {
      setSelRegional(new Set(regionaisLista));
    }
  }, [regionaisLista]);

  // Boleto advanced filters
  const [bolFiltroData, setBolFiltroData] = useState("vencimento");
  const [bolDataDe, setBolDataDe] = useState("");
  const [bolDataAte, setBolDataAte] = useState("");
  const [bolStatus, setBolStatus] = useState("todos");
  const [bolUnidade, setBolUnidade] = useState("todas");
  const [bolConsultor, setBolConsultor] = useState("todos");
  const [bolValorMin, setBolValorMin] = useState("");
  const [bolValorMax, setBolValorMax] = useState("");
  const [bolNumero, setBolNumero] = useState("");
  const [bolTipoCobranca, setBolTipoCobranca] = useState("todos");
  const [bolBanco, setBolBanco] = useState("todos");
  const [bolFormaPgto, setBolFormaPgto] = useState("todos");
  const [bolContrato, setBolContrato] = useState("");

  const toggleInSet = (set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, item: string) => {
    setFn(prev => { const next = new Set(prev); if (next.has(item)) next.delete(item); else next.add(item); return next; });
  };

  const filteredAssoc = realAssociados.filter((a: any) => {
    const nome = (a.nome || "").toLowerCase();
    const cpf = a.cpf || "";
    const placa = a.placa || "";
    if (busca && !nome.includes(busca.toLowerCase()) && !cpf.includes(busca) && !placa.includes(busca.toUpperCase())) return false;
    return true;
  });

  const filteredBoletos = realBoletos.filter((b: any) => {
    const bNome = (b.associado_nome || "").toLowerCase();
    const bId = (b.nosso_numero || b.id || "").toString().toLowerCase();
    const bCpf = b.cpf || "";
    if (buscaBol && !bNome.includes(buscaBol.toLowerCase()) && !bId.includes(buscaBol.toLowerCase()) && !bCpf.includes(buscaBol)) return false;
    if (bolStatus !== "todos" && b.status !== bolStatus) return false;
    if (bolValorMin && (b.valor || 0) < parseFloat(bolValorMin)) return false;
    if (bolValorMax && (b.valor || 0) > parseFloat(bolValorMax)) return false;
    const dateField = bolFiltroData === "pagamento" ? b.data_pagamento : b.vencimento;
    if (bolDataDe && dateField && dateField < bolDataDe) return false;
    if (bolDataAte && dateField && dateField > bolDataAte) return false;
    return true;
  });

  const exportCsv = (data: Record<string, unknown>[], filename: string) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const header = keys.join(";") + "\n";
    const rows = data.map(r => keys.map(k => String(r[k] ?? "")).join(";")).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${filename}.csv`; a.click();
  };

  const toggleCol = (key: string) => setSelectedCols(prev => prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]);

  const totalPagesAssoc = Math.ceil(filteredAssoc.length / PAGE_SIZE);
  const pagedAssoc = filteredAssoc.slice((pageAssoc - 1) * PAGE_SIZE, pageAssoc * PAGE_SIZE);

  const totalPagesBol = Math.ceil(filteredBoletos.length / PAGE_SIZE);
  const pagedBoletos = filteredBoletos.slice((pageBol - 1) * PAGE_SIZE, pageBol * PAGE_SIZE);

  const somaBoletosTotal = filteredBoletos.reduce((s: number, b: any) => s + (b.valor || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Central de Relatórios</h2>
          <p className="text-sm text-muted-foreground">Relatórios completos com filtros avançados, visualização em tela e exportação</p>
        </div>
      </div>

      <Tabs defaultValue="associados">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="associados" className="gap-1"><Users className="h-3.5 w-3.5" />Associados</TabsTrigger>
          <TabsTrigger value="veiculos" className="gap-1"><Car className="h-3.5 w-3.5" />Veículos</TabsTrigger>
          <TabsTrigger value="boletos" className="gap-1"><FileText className="h-3.5 w-3.5" />Boletos</TabsTrigger>
          <TabsTrigger value="gerais" className="gap-1"><BarChart3 className="h-3.5 w-3.5" />Gerais</TabsTrigger>
          <TabsTrigger value="outros" className="gap-1"><BarChart3 className="h-3.5 w-3.5" />Demais</TabsTrigger>
          <TabsTrigger value="gerar" className="gap-1"><Download className="h-3.5 w-3.5" />Gerar Relatório</TabsTrigger>
        </TabsList>

        {/* ── ASSOCIADOS ── */}
        <TabsContent value="associados" className="space-y-0 mt-4">
          <div className="space-y-4 mb-6">
            <div className="border border-border">
              <div className="bg-primary px-4 py-2"><h4 className="text-sm font-bold text-white uppercase tracking-wider">Período</h4></div>
              <div className="px-4 py-3 bg-card grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><Label className="text-xs font-semibold">Data Cadastro De</Label><Input type="date" /></div>
                <div><Label className="text-xs font-semibold">Data Cadastro Até</Label><Input type="date" /></div>
                <div><Label className="text-xs font-semibold">Data Contrato De</Label><Input type="date" /></div>
                <div><Label className="text-xs font-semibold">Data Contrato Até</Label><Input type="date" /></div>
              </div>
            </div>
            <FilterSection title="Situação ATUAL do Veículo" items={situacoesVeiculo} selected={selSitVeiculo} onToggle={(item) => toggleInSet(selSitVeiculo, setSelSitVeiculo, item)} color="success" />
            <FilterSection title="Regional do Veículo" items={regionaisLista} selected={selRegional} onToggle={(item) => toggleInSet(selRegional, setSelRegional, item)} columns={2} color="primary" />
            <FilterSection title="Cooperativa do Veículo" items={cooperativasLista} selected={selCooperativa} onToggle={(item) => toggleInSet(selCooperativa, setSelCooperativa, item)} color="warning" />
            <FilterSection title="Situação do Associado" items={situacoesAssociado} selected={selSitAssociado} onToggle={(item) => toggleInSet(selSitAssociado, setSelSitAssociado, item)} color="destructive" />
            <FilterSection title="Tipo de Veículo" items={tiposVeiculo} selected={selTipoVeiculo} onToggle={(item) => toggleInSet(selTipoVeiculo, setSelTipoVeiculo, item)} columns={3} color="primary" />
            <FilterSection title="Faixa de Cota" items={cotasVeiculo} selected={selCota} onToggle={(item) => toggleInSet(selCota, setSelCota, item)} columns={4} color="success" />
            <FilterSection title="Categoria do Veículo" items={categoriasVeiculo} selected={selCategoria} onToggle={(item) => toggleInSet(selCategoria, setSelCategoria, item)} columns={3} color="warning" />

            <div className="border border-border">
              <div className="bg-primary px-4 py-2"><h4 className="text-sm font-bold text-white uppercase tracking-wider">Colunas Visíveis no Resultado</h4></div>
              <div className="px-4 py-3 bg-card">
                <div className="grid grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-1.5">
                  {allColumns.map(c => (
                    <label key={c.key} className="inline-flex items-center gap-2 cursor-pointer py-0.5">
                      <Checkbox checked={selectedCols.includes(c.key)} onCheckedChange={() => toggleCol(c.key)} className="h-4 w-4" />
                      <span className={`text-xs ${selectedCols.includes(c.key) ? "text-primary font-medium" : "text-muted-foreground"}`}>{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <ReportActionBar
              busca={busca}
              setBusca={setBusca}
              onGenerate={() => { setShowResults(true); setPageAssoc(1); toast.success("Relatório gerado"); }}
              onExport={() => exportCsv(filteredAssoc as unknown as Record<string, unknown>[], "associados")}
              placeholder="Busca rápida: Nome, CPF ou placa..."
            />
          </div>

          {showResults && (
            <>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow>{selectedCols.map(k => <TableHead key={k} className="font-bold text-xs uppercase">{allColumns.find(c => c.key === k)?.label}</TableHead>)}<TableHead></TableHead></TableRow></TableHeader>
                    <TableBody>
                      {pagedAssoc.map(a => (
                        <TableRow key={a.id} className="cursor-pointer" onClick={() => setDetalhe(a)}>
                          {selectedCols.map(k => (
                            <TableCell key={k} className="">
                              {k === "situacao" ? <Badge className={situacaoColor[a.situacao]}>{a.situacao}</Badge>
                               : k === "dataCadastro" ? new Date(a.dataCadastro).toLocaleDateString("pt-BR")
                               : String((a as Record<string, unknown>)[k] ?? "")}
                            </TableCell>
                          ))}
                          <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Pagination page={pageAssoc} totalPages={totalPagesAssoc} onPageChange={setPageAssoc} />
                </CardContent>
              </Card>
              <p className="text-xs text-muted-foreground mt-2">{filteredAssoc.length} registros encontrados</p>
            </>
          )}
        </TabsContent>

        {/* ── VEÍCULOS ── */}
        <TabsContent value="veiculos" className="space-y-0 mt-4">
          <div className="space-y-4 mb-6">
            <div className="border border-border">
              <div className="bg-primary px-4 py-2"><h4 className="text-sm font-bold text-white uppercase tracking-wider">Período</h4></div>
              <div className="px-4 py-3 bg-card grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><Label className="text-xs font-semibold">Data Cadastro De</Label><Input type="date" /></div>
                <div><Label className="text-xs font-semibold">Data Cadastro Até</Label><Input type="date" /></div>
                <div><Label className="text-xs font-semibold">Ano Fabricação De</Label><Input type="number" placeholder="2020" /></div>
                <div><Label className="text-xs font-semibold">Ano Fabricação Até</Label><Input type="number" placeholder="2025" /></div>
              </div>
            </div>
            <FilterSection title="Situação ATUAL do Veículo" items={situacoesVeiculo} selected={selSitVeiculo} onToggle={(item) => toggleInSet(selSitVeiculo, setSelSitVeiculo, item)} color="success" />
            <FilterSection title="Tipo de Veículo" items={tiposVeiculo} selected={selTipoVeiculo} onToggle={(item) => toggleInSet(selTipoVeiculo, setSelTipoVeiculo, item)} columns={3} color="primary" />
            <FilterSection title="Faixa de Cota" items={cotasVeiculo} selected={selCota} onToggle={(item) => toggleInSet(selCota, setSelCota, item)} columns={4} color="success" />
            <FilterSection title="Regional do Veículo" items={regionaisLista} selected={selRegional} onToggle={(item) => toggleInSet(selRegional, setSelRegional, item)} columns={2} color="primary" />
            <FilterSection title="Cooperativa do Veículo" items={cooperativasLista} selected={selCooperativa} onToggle={(item) => toggleInSet(selCooperativa, setSelCooperativa, item)} color="warning" />

            <ReportActionBar
              busca={buscaVeic}
              setBusca={setBuscaVeic}
              onGenerate={() => { setVeicPageDb(1); toast.success("Relatório gerado"); }}
              onExport={() => exportCsv(realVeiculos.map((v: any) => ({ placa: v.placa, modelo: v.modelo, ano: v.ano_fabricacao, marca: v.marca, cor: v.cor, chassi: v.chassi })), "veiculos")}
              placeholder="Busca por placa ou modelo..."
            />
          </div>

          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead className="font-bold text-xs uppercase">Placa</TableHead><TableHead className="font-bold text-xs uppercase">Modelo</TableHead><TableHead className="font-bold text-xs uppercase">Marca</TableHead><TableHead className="font-bold text-xs uppercase">Ano Fab.</TableHead><TableHead className="font-bold text-xs uppercase">Cor</TableHead><TableHead className="font-bold text-xs uppercase">Chassi</TableHead><TableHead className="font-bold text-xs uppercase">Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {realVeiculos.map((v: any) => (
                  <TableRow key={v.id}><TableCell className="font-mono">{v.placa}</TableCell><TableCell>{v.modelo}</TableCell><TableCell>{v.marca}</TableCell><TableCell>{v.ano_fabricacao}</TableCell><TableCell>{v.cor}</TableCell><TableCell className="font-mono text-xs">{v.chassi}</TableCell><TableCell><Badge variant="outline">{v.status || "—"}</Badge></TableCell></TableRow>
                ))}
                {realVeiculos.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Nenhum veículo encontrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t">
              <span className="text-xs text-muted-foreground">{totalVeiculosCount} veículos - Página {veicPageDb} de {totalPagesVeicDb || 1}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={veicPageDb <= 1} onClick={() => setVeicPageDb(p => p - 1)} className="h-7 px-2"><ChevronLeft className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" size="sm" disabled={veicPageDb >= totalPagesVeicDb} onClick={() => setVeicPageDb(p => p + 1)} className="h-7 px-2"><ChevronRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* ── BOLETOS ── */}
        <TabsContent value="boletos" className="space-y-4 mt-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{filteredBoletos.length}</p><p className="text-xs text-muted-foreground">Filtrados</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-success">{filteredBoletos.filter((b: any) => b.status === "pago_dia").length}</p><p className="text-xs text-muted-foreground">Pagos em dia</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-warning">{filteredBoletos.filter((b: any) => b.status === "pago_atraso").length}</p><p className="text-xs text-muted-foreground">Pagos em atraso</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{filteredBoletos.filter((b: any) => b.status === "vencido").length}</p><p className="text-xs text-muted-foreground">Vencidos</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">R$ {somaBoletosTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p><p className="text-xs text-muted-foreground">Valor total</p></CardContent></Card>
          </div>

          {/* Advanced Filters */}
          <div className="border border-border">
            <div className="bg-primary px-4 py-2"><h4 className="text-sm font-bold text-white uppercase tracking-wider">Filtros Avançados de Boletos</h4></div>
            <div className="px-4 py-4 bg-card space-y-4">
              {/* Row 1: Period */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><Label className="text-xs font-semibold">Tipo de Data</Label>
                  <Select value={bolFiltroData} onValueChange={setBolFiltroData}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="vencimento">Vencimento</SelectItem><SelectItem value="emissao">Emissão</SelectItem><SelectItem value="pagamento">Pagamento</SelectItem></SelectContent></Select>
                </div>
                <div><Label className="text-xs font-semibold">Data De</Label><Input type="date" value={bolDataDe} onChange={e => setBolDataDe(e.target.value)} /></div>
                <div><Label className="text-xs font-semibold">Data Até</Label><Input type="date" value={bolDataAte} onChange={e => setBolDataAte(e.target.value)} /></div>
                <div><Label className="text-xs font-semibold">Status do Boleto</Label>
                  <Select value={bolStatus} onValueChange={setBolStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{statusBoleto.map(s => <SelectItem key={s} value={s}>{statusBoletoLabels[s]}</SelectItem>)}</SelectContent></Select>
                </div>
              </div>
              {/* Row 2: Entity filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><Label className="text-xs font-semibold">Associado / Cliente</Label><Input placeholder="Nome ou CPF..." value={buscaBol} onChange={e => setBuscaBol(e.target.value)} /></div>
                <div><Label className="text-xs font-semibold">Unidade (Filial)</Label>
                  <Select value={bolUnidade} onValueChange={setBolUnidade}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas</SelectItem>{unidadesBoleto.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select>
                </div>
                <div><Label className="text-xs font-semibold">Consultor Responsável</Label>
                  <Select value={bolConsultor} onValueChange={setBolConsultor}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{consultoresBoleto.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                </div>
                <div><Label className="text-xs font-semibold">Número do Boleto</Label><Input placeholder="BOL-..." value={bolNumero} onChange={e => setBolNumero(e.target.value)} /></div>
              </div>
              {/* Row 3: Financial filters */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div><Label className="text-xs font-semibold">Valor Mínimo (R$)</Label><Input type="number" placeholder="0,00" value={bolValorMin} onChange={e => setBolValorMin(e.target.value)} /></div>
                <div><Label className="text-xs font-semibold">Valor Máximo (R$)</Label><Input type="number" placeholder="0,00" value={bolValorMax} onChange={e => setBolValorMax(e.target.value)} /></div>
                <div><Label className="text-xs font-semibold">Tipo de Cobrança</Label>
                  <Select value={bolTipoCobranca} onValueChange={setBolTipoCobranca}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{tiposCobranca.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                </div>
                <div><Label className="text-xs font-semibold">Banco Emissor</Label>
                  <Select value={bolBanco} onValueChange={setBolBanco}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{bancosBoleto.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select>
                </div>
                <div><Label className="text-xs font-semibold">Forma de Pagamento</Label>
                  <Select value={bolFormaPgto} onValueChange={setBolFormaPgto}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{formasPagamento.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select>
                </div>
              </div>
              {/* Row 4 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><Label className="text-xs font-semibold">Contrato Vinculado</Label><Input placeholder="CTR-..." value={bolContrato} onChange={e => setBolContrato(e.target.value)} /></div>
                <div className="flex items-end">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                    setBolFiltroData("vencimento"); setBolDataDe(""); setBolDataAte(""); setBolStatus("todos");
                    setBolUnidade("todas"); setBolConsultor("todos"); setBolValorMin(""); setBolValorMax("");
                    setBolNumero(""); setBolTipoCobranca("todos"); setBolBanco("todos"); setBolFormaPgto("todos");
                    setBolContrato(""); setBuscaBol(""); setPageBol(1);
                    toast.info("Filtros limpos");
                  }}>Limpar Filtros</Button>
                </div>
              </div>
            </div>
          </div>

          <ReportActionBar
            busca={buscaBol}
            setBusca={setBuscaBol}
            onGenerate={() => { setPageBol(1); toast.success("Relatório gerado com " + filteredBoletos.length + " resultado(s)"); }}
            onExport={() => exportCsv(filteredBoletos as unknown as Record<string, unknown>[], "boletos")}
            placeholder="Buscar por associado, CPF ou nº boleto..."
          />

          {/* Results Table */}
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase">Nº Boleto</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Associado</TableHead>
                  <TableHead className="font-bold text-xs uppercase">CPF</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-right">Valor</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Emissão</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Vencimento</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Pagamento</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Unidade</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Consultor</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Tipo</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Banco</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Pagto</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Contrato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedBoletos.length === 0 && (
                  <TableRow><TableCell colSpan={14} className="text-center py-8 text-muted-foreground">Nenhum boleto encontrado com os filtros aplicados</TableCell></TableRow>
                )}
                {pagedBoletos.map((b: any, i: number) => (
                  <TableRow key={b.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                    <TableCell className="font-mono text-xs">{b.nosso_numero || b.id}</TableCell>
                    <TableCell className="font-medium text-sm">{b.associado_nome || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{b.cpf || "—"}</TableCell>
                    <TableCell className="text-right font-semibold">R$ {(b.valor || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-sm">{b.created_at ? new Date(b.created_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell className="text-sm">{b.vencimento ? new Date(b.vencimento).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell className="text-sm">{b.data_pagamento ? new Date(b.data_pagamento).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell><Badge className={situacaoColor[b.status] || ""}>{statusBoletoLabels[b.status] ?? b.status}</Badge></TableCell>
                    <TableCell className="text-xs">{b.unidade || "—"}</TableCell>
                    <TableCell className="text-xs">{b.consultor || "—"}</TableCell>
                    <TableCell className="text-xs">{b.tipo || "—"}</TableCell>
                    <TableCell className="text-xs">{b.banco || "—"}</TableCell>
                    <TableCell className="text-xs">{b.forma_pagamento || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{b.contrato || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-t-2 border-[#747474]">
              <span className="text-xs text-muted-foreground">{filteredBoletos.length} boleto(s) encontrado(s)</span>
              <span className="text-sm font-bold">Total: R$ {somaBoletosTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            <Pagination page={pageBol} totalPages={totalPagesBol} onPageChange={setPageBol} />
          </CardContent></Card>
        </TabsContent>

        {/* ── GERAIS ── */}
        <TabsContent value="gerais" className="mt-4">
          <RelatoriosGeraisTab />
        </TabsContent>

        {/* ── DEMAIS ── */}
        <TabsContent value="outros" className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {outrosRelatorios.map(r => (
              <button
                key={r.id}
                onClick={() => setOutroAtivo(r.id)}
                className={`group flex items-center gap-5 border bg-muted/50 px-6 py-6 text-left hover:bg-muted transition-colors min-h-[100px] ${outroAtivo === r.id ? "border-primary" : "border-border"}`}
              >
                <div className="w-14 h-14 bg-primary flex items-center justify-center shrink-0">
                  <r.icon className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base">{r.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{r.desc}</p>
                </div>
              </button>
            ))}
          </div>
          {outroAtivo && (
            <div className="space-y-4">
              <div className="border border-border">
                <div className="bg-primary px-4 py-2">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Filtros — {outrosRelatorios.find(r => r.id === outroAtivo)?.label}
                  </h4>
                </div>
                <div className="px-4 py-3 bg-card grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><Label className="text-xs font-semibold">Data início</Label><Input type="date" /></div>
                  <div><Label className="text-xs font-semibold">Data fim</Label><Input type="date" /></div>
                  <div><Label className="text-xs font-semibold">Cooperativa</Label>
                    <Select defaultValue="todas"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas</SelectItem>{cooperativasSimples.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div><Label className="text-xs font-semibold">Regional</Label>
                    <Select defaultValue="todas"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas</SelectItem>{regionaisSimples.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
                  </div>
                </div>
              </div>

              <FilterSection title="Regional" items={regionaisLista} selected={selRegional} onToggle={(item) => toggleInSet(selRegional, setSelRegional, item)} columns={2} color="primary" />
              <FilterSection title="Cooperativa" items={cooperativasLista} selected={selCooperativa} onToggle={(item) => toggleInSet(selCooperativa, setSelCooperativa, item)} color="warning" />

              <ReportActionBar
                busca=""
                setBusca={() => {}}
                onGenerate={() => toast.success("Relatório gerado")}
                onExport={() => toast.success("Relatório exportado")}
                placeholder="Buscar..."
              />

              <div className="p-8 bg-muted text-center text-muted-foreground border">
                <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Aplique os filtros e clique em "Visualizar Tela"</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── GERAR RELATÓRIO ── */}
        <TabsContent value="gerar" className="mt-4">
          <GerarRelatorio />
        </TabsContent>
      </Tabs>

      {/* Detalhe Sheet */}
      <Sheet open={!!detalhe} onOpenChange={() => setDetalhe(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle className="">Cadastro Completo</SheetTitle></SheetHeader>
          {detalhe && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2 text-sm">
                {([
                  ["Nome", detalhe.nome], ["CPF", detalhe.cpf], ["Nascimento", new Date(detalhe.nascimento).toLocaleDateString("pt-BR")],
                  ["Telefone", detalhe.telefone], ["E-mail", detalhe.email], ["Endereço", detalhe.endereco],
                  ["Cooperativa", detalhe.cooperativa], ["Regional", detalhe.regional],
                  ["Data Cadastro", new Date(detalhe.dataCadastro).toLocaleDateString("pt-BR")],
                  ["Data Contrato", new Date(detalhe.dataContrato).toLocaleDateString("pt-BR")],
                ] as [string, string][]).map(([l, v]) => (
                  <div key={l} className="flex justify-between"><span className="text-muted-foreground">{l}:</span><span className="font-medium">{v}</span></div>
                ))}
                <div className="flex justify-between"><span className="text-muted-foreground">Situação:</span><Badge className={situacaoColor[detalhe.situacao]}>{detalhe.situacao}</Badge></div>
              </div>
              <div className="border-t-2 border-[#747474] pt-3 space-y-2 text-sm">
                <h4 className="font-bold">Veículo</h4>
                {([
                  ["Placa", detalhe.placa], ["Modelo", detalhe.modelo], ["Ano", String(detalhe.ano)],
                  ["Tipo", detalhe.tipo], ["Categoria", detalhe.categoria], ["Cota", detalhe.cota],
                ] as [string, string][]).map(([l, v]) => (
                  <div key={l} className="flex justify-between"><span className="text-muted-foreground">{l}:</span><span className="font-medium">{v}</span></div>
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
