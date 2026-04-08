import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Plus, Download, MoreVertical, ArrowUpDown, Eye, ArrowRight, User,
  CheckCircle, XCircle, Archive, Send, Search, CalendarIcon, Filter, X,
  ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import { stageColumns, stageColumnPerdido, type PipelineStage } from "./pipeline/mockData";
import { useQuery } from "@tanstack/react-query";
import { useLeadScope } from "@/hooks/usePermission";
import { supabase } from "@/integrations/supabase/client";

interface NegociacaoRow {
  id: string;
  codigo: string;
  lead_nome: string;
  cpf_cnpj: string;
  telefone: string;
  email: string;
  veiculo_modelo: string;
  veiculo_placa: string;
  plano: string;
  valor_plano: number;
  stage: string;
  consultor: string;
  cooperativa: string;
  origem: string;
  created_at: string;
  venda_concluida_em: string | null;
}

const planoColors: Record<string, string> = {
  "Basico": "bg-muted text-muted-foreground",
  "Intermediario": "bg-primary/15 text-primary border-blue-300",
  "Premium": "bg-warning/10 text-warning border-amber-400",
  "Frota": "bg-primary/15 text-purple-700 border-purple-300",
};

const day = 86400000;

const allStages = [...stageColumns, stageColumnPerdido];
const etapasFilter = [
  { value: "all", label: "Todas" },
  ...allStages.map((s) => ({ value: s.key, label: s.label })),
];

type SortKey = "id" | "lead_nome" | "created_at" | "stage" | "valor_plano";

async function fetchNegociacoes(scope?: { consultor?: string; cooperativas?: string[] }) {
  let q = (supabase as any)
    .from("negociacoes")
    .select("id, codigo, lead_nome, cpf_cnpj, telefone, email, veiculo_modelo, veiculo_placa, plano, valor_plano, stage, consultor, cooperativa, origem, created_at, venda_concluida_em")
    .order("created_at", { ascending: false });
  if (scope?.consultor) q = q.eq("consultor", scope.consultor);
  if (scope?.cooperativas && scope.cooperativas.length > 0) q = q.in("cooperativa", scope.cooperativas);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as NegociacaoRow[];
}

export default function VendasLista() {
  const scope = useLeadScope();
  const [fEtapa, setFEtapa] = useState("all");
  const [fConsultor, setFConsultor] = useState("all");
  const [fCoop, setFCoop] = useState("all");
  const [fDateType, setFDateType] = useState("created_at");
  const [fDateStart, setFDateStart] = useState<Date | undefined>();
  const [fDateEnd, setFDateEnd] = useState<Date | undefined>();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [newDealOpen, setNewDealOpen] = useState(false);
  const [form, setForm] = useState({
    lead_nome: "",
    cpf_cnpj: "",
    telefone: "",
    email: "",
    placa: "",
    modelo: "",
    plano: "",
    cooperativa: "",
    consultor: "",
    observacoes: "",
  });

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["negociacoes-lista", scope?.consultor, scope?.cooperativas?.join(",")],
    queryFn: () => fetchNegociacoes(scope),
  });

  // Extract unique values for filters
  const consultoresUnicos = useMemo(
    () => [...new Set(deals.map((d) => d.consultor).filter(Boolean))],
    [deals]
  );
  const cooperativasUnicas = useMemo(
    () => [...new Set(deals.map((d) => d.cooperativa).filter(Boolean))],
    [deals]
  );

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      if (fEtapa !== "all" && d.stage !== fEtapa) return false;
      if (fConsultor !== "all" && d.consultor !== fConsultor) return false;
      if (fCoop !== "all" && d.cooperativa !== fCoop) return false;
      if (search) {
        const s = search.toLowerCase();
        if (
          !d.lead_nome?.toLowerCase().includes(s) &&
          !d.veiculo_placa?.toLowerCase().includes(s) &&
          !d.codigo?.toLowerCase().includes(s) &&
          !String(d.id).includes(s)
        )
          return false;
      }
      const dateField = fDateType === "created_at" ? d.created_at : d.venda_concluida_em;
      if (fDateStart && dateField && new Date(dateField) < fDateStart) return false;
      if (fDateEnd && dateField && new Date(dateField) > new Date(fDateEnd.getTime() + day)) return false;
      return true;
    });
  }, [deals, fEtapa, fConsultor, fCoop, search, fDateType, fDateStart, fDateEnd]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const paged = sorted.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(sorted.length / perPage);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function clearFilters() {
    setFEtapa("all");
    setFConsultor("all");
    setFCoop("all");
    setSearch("");
    setFDateStart(undefined);
    setFDateEnd(undefined);
  }

  const stageLabel = (s: string) => allStages.find((c) => c.key === s)?.label || s;
  const stageColor = (s: string) => allStages.find((c) => c.key === s)?.color || "#888";
  const activeFilters = [
    fEtapa !== "all",
    fConsultor !== "all",
    fCoop !== "all",
    !!fDateStart,
    !!fDateEnd,
    !!search,
  ].filter(Boolean).length;

  function fmt(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Carregando negociacoes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Negociacoes</h1>
          <p className="text-sm text-muted-foreground">
            Lista completa de todas as negociacoes do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-3.5 w-3.5 mr-1" />
            Filtros
            {activeFilters > 0 && (
              <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
                {activeFilters}
              </Badge>
            )}
          </Button>
          <Button onClick={() => setNewDealOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Negociacao
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Etapa</Label>
                <Select value={fEtapa} onValueChange={setFEtapa}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {etapasFilter.map((e) => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Consultor</Label>
                <Select value={fConsultor} onValueChange={setFConsultor}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {consultoresUnicos.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cooperativa</Label>
                <Select value={fCoop} onValueChange={setFCoop}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {cooperativasUnicas.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipo Data</Label>
                <Select value={fDateType} onValueChange={setFDateType}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Data Cadastro</SelectItem>
                    <SelectItem value="venda_concluida_em">Data Conclusao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data Inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("h-8 w-full text-xs justify-start", !fDateStart && "text-muted-foreground")}
                    >
                      <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                      {fDateStart ? format(fDateStart, "dd/MM/yyyy") : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fDateStart} onSelect={setFDateStart} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data Fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("h-8 w-full text-xs justify-start", !fDateEnd && "text-muted-foreground")}
                    >
                      <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                      {fDateEnd ? format(fDateEnd, "dd/MM/yyyy") : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fDateEnd} onSelect={setFDateEnd} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Busca</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    className="h-8 text-xs pl-7"
                    placeholder="Nome, placa ou ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button size="sm" variant="outline" onClick={clearFilters}>
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-3 border-b-2 border-[#747474]">
            <span className="text-sm font-medium">{sorted.length} negociacoes</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Download className="h-3.5 w-3.5 mr-1" />
                Exportar Excel
              </Button>
              <Select
                value={String(perPage)}
                onValueChange={(v) => {
                  setPerPage(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10/pag</SelectItem>
                  <SelectItem value="25">25/pag</SelectItem>
                  <SelectItem value="50">50/pag</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs cursor-pointer whitespace-nowrap" onClick={() => toggleSort("id")}>
                    <span className="flex items-center gap-1">
                      Codigo
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                    </span>
                  </TableHead>
                  <TableHead className="text-xs cursor-pointer whitespace-nowrap" onClick={() => toggleSort("lead_nome")}>
                    <span className="flex items-center gap-1">
                      Lead
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                    </span>
                  </TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Veiculo</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Plano</TableHead>
                  <TableHead className="text-xs cursor-pointer whitespace-nowrap" onClick={() => toggleSort("valor_plano")}>
                    <span className="flex items-center gap-1">
                      Valor
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                    </span>
                  </TableHead>
                  <TableHead className="text-xs cursor-pointer whitespace-nowrap" onClick={() => toggleSort("stage")}>
                    <span className="flex items-center gap-1">
                      Etapa
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                    </span>
                  </TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Consultor</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Cooperativa</TableHead>
                  <TableHead className="text-xs cursor-pointer whitespace-nowrap" onClick={() => toggleSort("created_at")}>
                    <span className="flex items-center gap-1">
                      Data Criacao
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                    </span>
                  </TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Data Conclusao</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-sm text-muted-foreground py-8">
                      Nenhuma negociacao encontrada.
                    </TableCell>
                  </TableRow>
                )}
                {paged.map((d) => (
                  <TableRow key={d.id} className="hover:bg-muted/30">
                    <TableCell className="text-xs font-mono">{d.codigo || d.id}</TableCell>
                    <TableCell className="text-sm font-medium">{d.lead_nome}</TableCell>
                    <TableCell className="text-xs">
                      <div>{d.veiculo_modelo}</div>
                      <span className="font-mono text-muted-foreground">{d.veiculo_placa}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px]", planoColors[d.plano] || "")}>
                        {d.plano || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-right font-medium">
                      {d.valor_plano ? fmt(d.valor_plano) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px]"
                        style={{
                          backgroundColor: `${stageColor(d.stage)}15`,
                          color: stageColor(d.stage),
                          borderColor: `${stageColor(d.stage)}40`,
                        }}
                      >
                        {stageLabel(d.stage)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{d.consultor || "—"}</TableCell>
                    <TableCell className="text-xs">{d.cooperativa || "—"}</TableCell>
                    <TableCell className="text-xs">
                      {new Date(d.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-xs">
                      {d.venda_concluida_em
                        ? new Date(d.venda_concluida_em).toLocaleDateString("pt-BR")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-3.5 w-3.5 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ArrowRight className="h-3.5 w-3.5 mr-2" />
                            Mover p/ Concluido
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <User className="h-3.5 w-3.5 mr-2" />
                            Transferir Consultor
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Archive className="h-3.5 w-3.5 mr-2" />
                            Arquivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t-2 border-[#747474]">
              <span className="text-xs text-muted-foreground">
                Pagina {page} de {totalPages} ({sorted.length} total)
              </span>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New deal modal */}
      <Dialog open={newDealOpen} onOpenChange={setNewDealOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Negociacao</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome do Lead *</Label>
              <Input
                value={form.lead_nome}
                onChange={(e) => setForm({ ...form, lead_nome: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CPF/CNPJ</Label>
                <Input
                  value={form.cpf_cnpj}
                  onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Placa</Label>
                <Input
                  value={form.placa}
                  onChange={(e) => setForm({ ...form, placa: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Modelo</Label>
                <Input
                  value={form.modelo}
                  onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Consultor</Label>
                <Select value={form.consultor} onValueChange={(v) => setForm({ ...form, consultor: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {consultoresUnicos.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Cooperativa</Label>
                <Select value={form.cooperativa} onValueChange={(v) => setForm({ ...form, cooperativa: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {cooperativasUnicas.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observacoes</Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewDealOpen(false)}>
                Cancelar
              </Button>
              <Button disabled={!form.lead_nome}>Criar Negociacao</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
