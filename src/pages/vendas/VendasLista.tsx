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
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { stageColumns, consultores, cooperativas, regionais, planos, PipelineStage } from "./pipeline/mockData";

interface VendaDeal {
  id: number;
  lead_nome: string;
  cpf_cnpj: string;
  telefone: string;
  email: string;
  veiculo_modelo: string;
  veiculo_placa: string;
  plano: string;
  stage: PipelineStage;
  consultor: string;
  cooperativa: string;
  regional: string;
  created_at: string;
  data_pagamento: string | null;
  status_gestao: "Sincronizado" | "Pendente" | "Erro" | "Não Enviado";
  status_pagamento: string;
}

const gestaoColors: Record<string, string> = {
  Sincronizado: "bg-success/15 text-success border-green-300",
  Pendente: "bg-warning/10 text-warning border-warning/30",
  Erro: "bg-destructive/15 text-destructive border-red-300",
  "Não Enviado": "bg-muted text-muted-foreground",
};

const planoColors: Record<string, string> = {
  "Básico": "bg-muted text-muted-foreground",
  "Intermediário": "bg-primary/15 text-primary border-blue-300",
  "Premium": "bg-warning/10 text-warning border-amber-400",
  "Frota": "bg-primary/15 text-purple-700 border-purple-300",
};

const day = 86400000;
const mockVendas: VendaDeal[] = [
  { id: 1001, lead_nome: "João Pereira da Silva", cpf_cnpj: "123.456.789-00", telefone: "(11) 98765-1234", email: "joao@email.com", veiculo_modelo: "Honda Civic 2022", veiculo_placa: "ABC-1D23", plano: "Premium", stage: "em_negociacao", consultor: "Ana Silva", cooperativa: "Coop Norte", regional: "SP Capital", created_at: new Date(Date.now() - 10 * day).toISOString(), data_pagamento: new Date(Date.now() - 2 * day).toISOString(), status_gestao: "Sincronizado", status_pagamento: "Pago Boleto" },
  { id: 1002, lead_nome: "Maria Oliveira Santos", cpf_cnpj: "987.654.321-00", telefone: "(11) 97654-5678", email: "maria@email.com", veiculo_modelo: "VW Gol 2023", veiculo_placa: "DEF-2G34", plano: "Básico", stage: "cotacoes_recebidas", consultor: "Carlos Souza", cooperativa: "Coop Sul", regional: "Interior SP", created_at: new Date(Date.now() - 8 * day).toISOString(), data_pagamento: null, status_gestao: "Não Enviado", status_pagamento: "Sem Pagamento" },
  { id: 1003, lead_nome: "Carlos Eduardo Ferreira", cpf_cnpj: "456.789.123-00", telefone: "(21) 99876-4321", email: "carlos.f@email.com", veiculo_modelo: "Fiat Argo 2024", veiculo_placa: "GHI-3J45", plano: "Intermediário", stage: "aguardando_vistoria", consultor: "Maria Lima", cooperativa: "Coop Leste", regional: "RJ", created_at: new Date(Date.now() - 6 * day).toISOString(), data_pagamento: null, status_gestao: "Pendente", status_pagamento: "Boleto Gerado" },
  { id: 1004, lead_nome: "Ana Beatriz Costa", cpf_cnpj: "321.654.987-00", telefone: "(11) 91234-5678", email: "ana.b@email.com", veiculo_modelo: "Toyota Corolla 2023", veiculo_placa: "JKL-4M56", plano: "Premium", stage: "vendas_concretizadas", consultor: "Ana Silva", cooperativa: "Coop Norte", regional: "SP Capital", created_at: new Date(Date.now() - 15 * day).toISOString(), data_pagamento: new Date(Date.now() - 5 * day).toISOString(), status_gestao: "Sincronizado", status_pagamento: "Pago Cartão" },
  { id: 1005, lead_nome: "Roberto Lima Souza", cpf_cnpj: "654.321.987-00", telefone: "(31) 98765-9876", email: "roberto.l@email.com", veiculo_modelo: "Hyundai HB20 2024", veiculo_placa: "MNO-5P67", plano: "Básico", stage: "em_negociacao", consultor: "Carlos Souza", cooperativa: "Coop Sul", regional: "MG", created_at: new Date(Date.now() - 4 * day).toISOString(), data_pagamento: null, status_gestao: "Erro", status_pagamento: "Sem Pagamento" },
  { id: 1006, lead_nome: "Fernanda Alves Dias", cpf_cnpj: "789.123.456-11", telefone: "(11) 93456-7890", email: "fernanda@email.com", veiculo_modelo: "Chevrolet Tracker 2024", veiculo_placa: "QRS-6T78", plano: "Premium", stage: "liberado_cadastro", consultor: "Maria Lima", cooperativa: "Coop Norte", regional: "SP Capital", created_at: new Date(Date.now() - 12 * day).toISOString(), data_pagamento: new Date(Date.now() - 1 * day).toISOString(), status_gestao: "Sincronizado", status_pagamento: "Pago Boleto" },
  { id: 1007, lead_nome: "Pedro Henrique Souza", cpf_cnpj: "147.258.369-22", telefone: "(21) 92345-6789", email: "pedro.h@email.com", veiculo_modelo: "Jeep Compass 2024", veiculo_placa: "UVW-7X89", plano: "Frota", stage: "cotacoes_recebidas", consultor: "Ana Silva", cooperativa: "Coop Leste", regional: "RJ", created_at: new Date(Date.now() - 2 * day).toISOString(), data_pagamento: null, status_gestao: "Não Enviado", status_pagamento: "Sem Pagamento" },
  { id: 1008, lead_nome: "Juliana Mendes Rocha", cpf_cnpj: "258.369.147-33", telefone: "(31) 91234-0987", email: "juliana.m@email.com", veiculo_modelo: "Honda HR-V 2023", veiculo_placa: "YZA-8B01", plano: "Intermediário", stage: "vendas_concretizadas", consultor: "Carlos Souza", cooperativa: "Coop Sul", regional: "MG", created_at: new Date(Date.now() - 20 * day).toISOString(), data_pagamento: new Date(Date.now() - 8 * day).toISOString(), status_gestao: "Sincronizado", status_pagamento: "Pago Dinheiro" },
  { id: 1009, lead_nome: "Lucas Gabriel Martins", cpf_cnpj: "369.147.258-44", telefone: "(11) 94567-8901", email: "lucas.g@email.com", veiculo_modelo: "Renault Kwid 2024", veiculo_placa: "BCD-9E12", plano: "Básico", stage: "aguardando_vistoria", consultor: "Maria Lima", cooperativa: "Coop Norte", regional: "Interior SP", created_at: new Date(Date.now() - 3 * day).toISOString(), data_pagamento: null, status_gestao: "Pendente", status_pagamento: "Boleto Vencido" },
  { id: 1010, lead_nome: "Camila Rodrigues Silva", cpf_cnpj: "741.852.963-55", telefone: "(21) 95678-9012", email: "camila.r@email.com", veiculo_modelo: "Nissan Kicks 2024", veiculo_placa: "FGH-0I23", plano: "Premium", stage: "em_negociacao", consultor: "Ana Silva", cooperativa: "Coop Leste", regional: "RJ", created_at: new Date(Date.now() - 7 * day).toISOString(), data_pagamento: null, status_gestao: "Não Enviado", status_pagamento: "Sem Pagamento" },
  { id: 1011, lead_nome: "Bruno Cardoso Neto", cpf_cnpj: "852.963.741-66", telefone: "(31) 96789-0123", email: "bruno.c@email.com", veiculo_modelo: "Hyundai Creta 2023", veiculo_placa: "JKL-1M34", plano: "Intermediário", stage: "liberado_cadastro", consultor: "Carlos Souza", cooperativa: "Coop Sul", regional: "MG", created_at: new Date(Date.now() - 9 * day).toISOString(), data_pagamento: new Date(Date.now() - 3 * day).toISOString(), status_gestao: "Pendente", status_pagamento: "Pago Cartão" },
  { id: 1012, lead_nome: "Tatiana Dias Pereira", cpf_cnpj: "963.741.852-77", telefone: "(11) 97890-1234", email: "tatiana.d@email.com", veiculo_modelo: "VW T-Cross 2024", veiculo_placa: "NOP-2Q45", plano: "Frota", stage: "cotacoes_recebidas", consultor: "Maria Lima", cooperativa: "Coop Norte", regional: "SP Capital", created_at: new Date(Date.now() - 1 * day).toISOString(), data_pagamento: null, status_gestao: "Não Enviado", status_pagamento: "Sem Pagamento" },
];

const etapasFilter = [
  { value: "all", label: "Todas" },
  ...stageColumns.map(s => ({ value: s.key, label: s.label })),
  { value: "arquivadas", label: "Arquivadas" },
];
const statusPagamentoOptions = ["Todos", "Boleto Gerado", "Boleto Vencido", "Pago Cartão", "Pago Boleto", "Pago Dinheiro", "Sem Pagamento"];

type SortKey = "id" | "lead_nome" | "created_at" | "stage";

export default function VendasLista() {
  const [deals] = useState(mockVendas);
  const [fEtapa, setFEtapa] = useState("all");
  const [fConsultor, setFConsultor] = useState("all");
  const [fCoop, setFCoop] = useState("all");
  const [fRegional, setFRegional] = useState("all");
  const [fDateType, setFDateType] = useState("created_at");
  const [fDateStart, setFDateStart] = useState<Date | undefined>();
  const [fDateEnd, setFDateEnd] = useState<Date | undefined>();
  const [fStatusPag, setFStatusPag] = useState("Todos");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [newDealOpen, setNewDealOpen] = useState(false);
  const [form, setForm] = useState({ lead_nome: "", cpf_cnpj: "", telefone: "", email: "", placa: "", modelo: "", plano: "", cooperativa: "", regional: "", consultor: "", observacoes: "" });

  const filtered = useMemo(() => {
    return deals.filter(d => {
      if (fEtapa !== "all" && d.stage !== fEtapa) return false;
      if (fConsultor !== "all" && d.consultor !== fConsultor) return false;
      if (fCoop !== "all" && d.cooperativa !== fCoop) return false;
      if (fRegional !== "all" && d.regional !== fRegional) return false;
      if (fStatusPag !== "Todos" && d.status_pagamento !== fStatusPag) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!d.lead_nome.toLowerCase().includes(s) && !d.veiculo_placa.toLowerCase().includes(s) && !String(d.id).includes(s)) return false;
      }
      const dateField = fDateType === "created_at" ? d.created_at : d.data_pagamento;
      if (fDateStart && dateField && new Date(dateField) < fDateStart) return false;
      if (fDateEnd && dateField && new Date(dateField) > new Date(fDateEnd.getTime() + day)) return false;
      return true;
    });
  }, [deals, fEtapa, fConsultor, fCoop, fRegional, fStatusPag, search, fDateType, fDateStart, fDateEnd]);

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
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function clearFilters() {
    setFEtapa("all"); setFConsultor("all"); setFCoop("all"); setFRegional("all"); setFStatusPag("Todos"); setSearch(""); setFDateStart(undefined); setFDateEnd(undefined);
  }

  const stageLabel = (s: PipelineStage) => stageColumns.find(c => c.key === s)?.label || s;
  const stageColor = (s: PipelineStage) => stageColumns.find(c => c.key === s)?.color || "#888";
  const activeFilters = [fEtapa !== "all", fConsultor !== "all", fCoop !== "all", fRegional !== "all", fStatusPag !== "Todos", !!fDateStart, !!fDateEnd, !!search].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Negociações</h1>
          <p className="text-sm text-muted-foreground">Lista completa de todas as cotações do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-3.5 w-3.5 mr-1" />Filtros
            {activeFilters > 0 && <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">{activeFilters}</Badge>}
          </Button>
          <Button onClick={() => setNewDealOpen(true)}><Plus className="h-4 w-4 mr-1" />Nova Negociação</Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <div className="space-y-1"><Label className="text-xs">Etapa</Label>
                <Select value={fEtapa} onValueChange={setFEtapa}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{etapasFilter.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Consultor</Label>
                <Select value={fConsultor} onValueChange={setFConsultor}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todos</SelectItem>{consultores.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Cooperativa</Label>
                <Select value={fCoop} onValueChange={setFCoop}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todas</SelectItem>{cooperativas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Regional</Label>
                <Select value={fRegional} onValueChange={setFRegional}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todas</SelectItem>{regionais.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Tipo Data</Label>
                <Select value={fDateType} onValueChange={setFDateType}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="created_at">Data Cadastro Gestão</SelectItem><SelectItem value="data_pagamento">Data Pagamento</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Data Início</Label>
                <Popover><PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-8 w-full text-xs justify-start", !fDateStart && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />{fDateStart ? format(fDateStart, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={fDateStart} onSelect={setFDateStart} className="p-3 pointer-events-auto" /></PopoverContent></Popover>
              </div>
              <div className="space-y-1"><Label className="text-xs">Data Fim</Label>
                <Popover><PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-8 w-full text-xs justify-start", !fDateEnd && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />{fDateEnd ? format(fDateEnd, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={fDateEnd} onSelect={setFDateEnd} className="p-3 pointer-events-auto" /></PopoverContent></Popover>
              </div>
              <div className="space-y-1"><Label className="text-xs">Status Pagamento</Label>
                <Select value={fStatusPag} onValueChange={setFStatusPag}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{statusPagamentoOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Busca</Label>
                <div className="relative"><Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" /><Input className="h-8 text-xs pl-7" placeholder="Nome, placa ou ID..." value={search} onChange={e => setSearch(e.target.value)} /></div>
              </div>
              <div className="flex items-end"><Button size="sm" variant="outline" onClick={clearFilters}><X className="h-3 w-3 mr-1" />Limpar</Button></div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-3 border-b-2 border-[#747474]">
            <span className="text-sm font-medium">{sorted.length} negociações</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline"><Download className="h-3.5 w-3.5 mr-1" />Exportar Excel</Button>
              <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="10">10/pág</SelectItem><SelectItem value="25">25/pág</SelectItem><SelectItem value="50">50/pág</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs cursor-pointer whitespace-nowrap" onClick={() => toggleSort("id")}><span className="flex items-center gap-1">ID<ArrowUpDown className="h-3 w-3 text-muted-foreground/50" /></span></TableHead>
                  <TableHead className="text-xs cursor-pointer whitespace-nowrap" onClick={() => toggleSort("lead_nome")}><span className="flex items-center gap-1">Lead<ArrowUpDown className="h-3 w-3 text-muted-foreground/50" /></span></TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Veículo</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Plano</TableHead>
                  <TableHead className="text-xs cursor-pointer whitespace-nowrap" onClick={() => toggleSort("stage")}><span className="flex items-center gap-1">Etapa<ArrowUpDown className="h-3 w-3 text-muted-foreground/50" /></span></TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Consultor</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Cooperativa</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Regional</TableHead>
                  <TableHead className="text-xs cursor-pointer whitespace-nowrap" onClick={() => toggleSort("created_at")}><span className="flex items-center gap-1">Data Criação<ArrowUpDown className="h-3 w-3 text-muted-foreground/50" /></span></TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Data Pagamento</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Status Gestão</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map(d => (
                  <TableRow key={d.id} className="hover:bg-muted/30">
                    <TableCell className="text-xs font-mono">{d.id}</TableCell>
                    <TableCell className="text-sm font-medium">{d.lead_nome}</TableCell>
                    <TableCell className="text-xs"><div>{d.veiculo_modelo}</div><span className="font-mono text-muted-foreground">{d.veiculo_placa}</span></TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-[10px]", planoColors[d.plano])}>{d.plano}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]" style={{ backgroundColor: `${stageColor(d.stage)}15`, color: stageColor(d.stage), borderColor: `${stageColor(d.stage)}40` }}>{stageLabel(d.stage)}</Badge></TableCell>
                    <TableCell className="text-xs">{d.consultor}</TableCell>
                    <TableCell className="text-xs">{d.cooperativa}</TableCell>
                    <TableCell className="text-xs">{d.regional}</TableCell>
                    <TableCell className="text-xs">{new Date(d.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-xs">{d.data_pagamento ? new Date(d.data_pagamento).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-[10px]", gestaoColors[d.status_gestao])}>{d.status_gestao}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="h-3.5 w-3.5 mr-2" />Ver Detalhes</DropdownMenuItem>
                          <DropdownMenuItem><ArrowRight className="h-3.5 w-3.5 mr-2" />Mover p/ Vendas Concretizadas</DropdownMenuItem>
                          <DropdownMenuItem><User className="h-3.5 w-3.5 mr-2" />Transferir Consultor</DropdownMenuItem>
                          <DropdownMenuItem><CheckCircle className="h-3.5 w-3.5 mr-2" />Aceitar Cotação</DropdownMenuItem>
                          <DropdownMenuItem><XCircle className="h-3.5 w-3.5 mr-2" />Cancelar Aceite</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem><Archive className="h-3.5 w-3.5 mr-2" />Arquivar</DropdownMenuItem>
                          <DropdownMenuItem><ArrowRight className="h-3.5 w-3.5 mr-2" />Voltar p/ Cadastro</DropdownMenuItem>
                          <DropdownMenuItem><Send className="h-3.5 w-3.5 mr-2" />Enviar Cotação Frota</DropdownMenuItem>
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
              <span className="text-xs text-muted-foreground">Página {page} de {totalPages} ({sorted.length} total)</span>
              <div className="flex gap-1">
                <Button size="icon" variant="outline" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="outline" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New deal modal */}
      <Dialog open={newDealOpen} onOpenChange={setNewDealOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Negociação</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Nome do Lead *</Label><Input value={form.lead_nome} onChange={e => setForm({ ...form, lead_nome: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>CPF/CNPJ</Label><Input value={form.cpf_cnpj} onChange={e => setForm({ ...form, cpf_cnpj: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>E-mail</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Placa</Label><Input value={form.placa} onChange={e => setForm({ ...form, placa: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Modelo</Label><Input value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Plano</Label>
                <Select value={form.plano} onValueChange={v => setForm({ ...form, plano: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{planos.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Consultor</Label>
                <Select value={form.consultor} onValueChange={v => setForm({ ...form, consultor: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{consultores.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={3} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewDealOpen(false)}>Cancelar</Button>
              <Button disabled={!form.lead_nome}>Criar Negociação</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
