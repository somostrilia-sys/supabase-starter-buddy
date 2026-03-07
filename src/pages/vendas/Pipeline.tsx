import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus, LayoutGrid, List, Search, Filter, X, Eye, MoreVertical,
  ArrowUpDown, GripVertical, Car, User, Calendar, Clock, Download,
  ChevronLeft, ChevronRight, Pencil, ArrowRight, Archive,
  CheckCircle, AlertCircle, Shield, Send, Radio, AlertTriangle, DollarSign,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  PipelineDeal, PipelineStage, stageColumns, mockDeals,
  consultores, gerentes, cooperativas, regionais, planos,
} from "./pipeline/mockData";
import DealDetailModal from "./pipeline/DealDetailModal";

function daysStalled(updated: string) {
  return Math.floor((Date.now() - new Date(updated).getTime()) / 86400000);
}

function StalledBadge({ days }: { days: number }) {
  if (days < 1) return <Badge className="bg-green-500/15 text-green-700 border-green-300 text-[9px] px-1.5 py-0">Hoje</Badge>;
  if (days <= 3) return <Badge className="bg-amber-500/15 text-amber-700 border-amber-300 text-[9px] px-1.5 py-0">{days} dias</Badge>;
  return <Badge className="bg-red-500/15 text-red-700 border-red-300 text-[9px] px-1.5 py-0">{days} dias</Badge>;
}

type SortKey = "id" | "lead_nome" | "veiculo_modelo" | "plano" | "stage" | "consultor" | "cooperativa" | "regional" | "created_at" | "updated_at";

export default function Pipeline() {
  const [deals, setDeals] = useState<PipelineDeal[]>(mockDeals);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [detailDeal, setDetailDeal] = useState<PipelineDeal | null>(null);

  // Filters
  const [fConsultor, setFConsultor] = useState("all");
  const [fGerente, setFGerente] = useState("all");
  const [fCoop, setFCoop] = useState("all");
  const [fRegional, setFRegional] = useState("all");
  const [fEtapa, setFEtapa] = useState("all");
  const [fDateStart, setFDateStart] = useState("");
  const [fDateEnd, setFDateEnd] = useState("");
  const [fDateType, setFDateType] = useState("created_at");
  const [showFilters, setShowFilters] = useState(false);

  // List view
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // New deal form
  const [form, setForm] = useState({ lead_nome: "", cpf_cnpj: "", telefone: "", email: "", placa: "", modelo: "", plano: "", cooperativa: "", regional: "", consultor: "", observacoes: "" });
  const [formTouched, setFormTouched] = useState({ lead_nome: false, telefone: false });

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  const activeFilterCount = [fConsultor !== "all", fGerente !== "all", fCoop !== "all", fRegional !== "all", fEtapa !== "all", !!fDateStart, !!fDateEnd].filter(Boolean).length;

  const filtered = useMemo(() => {
    return deals.filter(d => {
      if (fConsultor !== "all" && d.consultor !== fConsultor) return false;
      if (fGerente !== "all" && d.gerente !== fGerente) return false;
      if (fCoop !== "all" && d.cooperativa !== fCoop) return false;
      if (fRegional !== "all" && d.regional !== fRegional) return false;
      if (fEtapa !== "all" && d.stage !== fEtapa) return false;
      const dateField = fDateType === "created_at" ? d.created_at : d.updated_at;
      if (fDateStart && dateField < fDateStart) return false;
      if (fDateEnd && dateField > fDateEnd + "T23:59:59") return false;
      return true;
    });
  }, [deals, fConsultor, fGerente, fCoop, fRegional, fEtapa, fDateStart, fDateEnd, fDateType]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const paged = sorted.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(sorted.length / perPage);

  function clearFilters() {
    setFConsultor("all"); setFGerente("all"); setFCoop("all"); setFRegional("all"); setFEtapa("all"); setFDateStart(""); setFDateEnd("");
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function handleDragStart(e: React.DragEvent, id: string) { setDraggedId(id); e.dataTransfer.effectAllowed = "move"; }
  function handleDragOver(e: React.DragEvent, stage: PipelineStage) { e.preventDefault(); setDragOverStage(stage); }
  function handleDrop(stage: PipelineStage) {
    if (draggedId) setDeals(prev => prev.map(d => d.id === draggedId ? { ...d, stage, updated_at: new Date().toISOString() } : d));
    setDraggedId(null); setDragOverStage(null);
  }

  const formNomeInvalid = formTouched.lead_nome && !form.lead_nome.trim();
  const formTelInvalid = formTouched.telefone && !form.telefone.trim();
  const canCreateDeal = form.lead_nome.trim().length > 0 && form.telefone.trim().length > 0;

  function handleNewDeal() {
    setFormTouched({ lead_nome: true, telefone: true });
    if (!canCreateDeal) return;
    const newDeal: PipelineDeal = {
      id: `p${Date.now()}`, codigo: `NEG-2026-${String(Date.now()).slice(-3)}`, lead_nome: form.lead_nome.trim(), cpf_cnpj: form.cpf_cnpj, telefone: form.telefone.trim(), email: form.email,
      veiculo_modelo: form.modelo, veiculo_placa: form.placa, plano: form.plano || "Básico", valor_plano: 149.90, stage: "cotacoes_recebidas",
      consultor: form.consultor || consultores[0], cooperativa: form.cooperativa || cooperativas[0], regional: form.regional || regionais[0],
      gerente: gerentes[0], origem: "Manual", observacoes: form.observacoes, enviado_sga: false, visualizacoes_proposta: 0,
      status_icons: { aceita: false, pendente: true, aprovada: false, sga: false, rastreador: false, inadimplencia: false },
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    setDeals(prev => [newDeal, ...prev]);
    setNewDealOpen(false);
    setForm({ lead_nome: "", cpf_cnpj: "", telefone: "", email: "", placa: "", modelo: "", plano: "", cooperativa: "", regional: "", consultor: "", observacoes: "" });
    setFormTouched({ lead_nome: false, telefone: false });
  }

  const stageLabel = (s: PipelineStage) => stageColumns.find(c => c.key === s)?.label || s;
  const stageColor = (s: PipelineStage) => stageColumns.find(c => c.key === s)?.color || "#888";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground">Funil de vendas - gerencie suas negociações</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-3.5 w-3.5 mr-1" />Filtros
            {activeFilterCount > 0 && <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">{activeFilterCount}</Badge>}
          </Button>
          <div className="flex border rounded-lg overflow-hidden">
            <Button size="icon" variant={viewMode === "kanban" ? "default" : "ghost"} className="rounded-none h-8 w-8" onClick={() => setViewMode("kanban")}><LayoutGrid className="h-4 w-4" /></Button>
            <Button size="icon" variant={viewMode === "list" ? "default" : "ghost"} className="rounded-none h-8 w-8" onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <div className="space-y-1"><Label className="text-xs">Consultor</Label>
                <Select value={fConsultor} onValueChange={setFConsultor}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todos</SelectItem>{consultores.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Gerente</Label>
                <Select value={fGerente} onValueChange={setFGerente}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todos</SelectItem>{gerentes.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
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
              <div className="space-y-1"><Label className="text-xs">Etapa</Label>
                <Select value={fEtapa} onValueChange={setFEtapa}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todas</SelectItem>{stageColumns.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Data Início</Label><Input type="date" className="h-8 text-xs" value={fDateStart} onChange={e => setFDateStart(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Data Fim</Label><Input type="date" className="h-8 text-xs" value={fDateEnd} onChange={e => setFDateEnd(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Tipo Data</Label>
                <Select value={fDateType} onValueChange={setFDateType}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="created_at">Data Criação</SelectItem><SelectItem value="updated_at">Última Movimentação</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button size="sm" variant="outline" onClick={clearFilters}><X className="h-3 w-3 mr-1" />Limpar</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KANBAN VIEW */}
      {viewMode === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ minHeight: "70vh" }}>
          {stageColumns.map(col => {
            const colDeals = filtered.filter(d => d.stage === col.key);
            const isOver = dragOverStage === col.key;
            return (
              <div
                key={col.key}
                className={`flex flex-col rounded-xl overflow-hidden min-w-[260px] w-[260px] shrink-0 transition-all ${col.bg} ${isOver ? "ring-2 shadow-lg" : "shadow-sm"}`}
                style={{ borderTop: `4px solid ${col.color}` }}
                onDragOver={e => handleDragOver(e, col.key)}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={() => handleDrop(col.key)}
              >
                <div className="px-3 pt-3 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/80">{col.label}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] h-5">{colDeals.length}</Badge>
                  </div>
                </div>
                <ScrollArea className="flex-1 px-2 pb-2">
                  <div className="space-y-2">
                    {colDeals.map(deal => {
                      const days = daysStalled(deal.updated_at);
                      const si = deal.status_icons;
                      return (
                        <div
                          key={deal.id}
                          draggable
                          onDragStart={e => handleDragStart(e, deal.id)}
                          onClick={() => setDetailDeal(deal)}
                          className={`group bg-card border cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] ${draggedId === deal.id ? "opacity-40" : ""}`}
                          style={{ borderLeft: `3px solid ${col.color}` }}
                        >
                          <div className="p-3 space-y-1.5">
                            {/* Header: nome + código + menu */}
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-[13px] font-semibold leading-tight font-['Source_Serif_4']">{deal.lead_nome}</p>
                                <span className="text-[10px] font-mono text-muted-foreground">{deal.codigo}</span>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}><MoreVertical className="h-3.5 w-3.5" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setDetailDeal(deal)}><Eye className="h-3.5 w-3.5 mr-2" />Ver Detalhes</DropdownMenuItem>
                                  <DropdownMenuItem><ArrowRight className="h-3.5 w-3.5 mr-2" />Mover Etapa</DropdownMenuItem>
                                  <DropdownMenuItem><User className="h-3.5 w-3.5 mr-2" />Transferir Consultor</DropdownMenuItem>
                                  <DropdownMenuItem><Archive className="h-3.5 w-3.5 mr-2" />Arquivar</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Veículo + Placa */}
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Car className="h-3 w-3 shrink-0" />
                              <span className="text-[11px] truncate font-['Source_Serif_4']">{deal.veiculo_modelo}</span>
                              <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 rounded-none">{deal.veiculo_placa}</Badge>
                            </div>

                            {/* Plano + Valor */}
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-none">{deal.plano}</Badge>
                              <span className="text-[11px] font-bold text-foreground font-['Source_Serif_4']">R$ {deal.valor_plano.toFixed(2).replace(".", ",")}</span>
                            </div>

                            {/* Status icons row */}
                            <TooltipProvider delayDuration={200}>
                              <div className="flex items-center gap-1 pt-0.5">
                                <Tooltip><TooltipTrigger><CheckCircle className={`h-3.5 w-3.5 ${si.aceita ? "text-green-600" : "text-muted-foreground/25"}`} /></TooltipTrigger><TooltipContent className="text-[10px]">Aceita</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger><AlertCircle className={`h-3.5 w-3.5 ${si.pendente ? "text-amber-500" : "text-muted-foreground/25"}`} /></TooltipTrigger><TooltipContent className="text-[10px]">Pendente</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger><Shield className={`h-3.5 w-3.5 ${si.aprovada ? "text-blue-600" : "text-muted-foreground/25"}`} /></TooltipTrigger><TooltipContent className="text-[10px]">Aprovada</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger><Send className={`h-3.5 w-3.5 ${si.sga ? "text-green-600" : "text-muted-foreground/25"}`} /></TooltipTrigger><TooltipContent className="text-[10px]">SGA</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger><Radio className={`h-3.5 w-3.5 ${si.rastreador ? "text-blue-600" : "text-muted-foreground/25"}`} /></TooltipTrigger><TooltipContent className="text-[10px]">Rastreador</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger><AlertTriangle className={`h-3.5 w-3.5 ${si.inadimplencia ? "text-red-600" : "text-muted-foreground/25"}`} /></TooltipTrigger><TooltipContent className="text-[10px]">Inadimplência</TooltipContent></Tooltip>
                              </div>
                            </TooltipProvider>

                            {/* Data + Stalled */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span className="text-[10px]">{new Date(deal.created_at).toLocaleDateString("pt-BR")} {new Date(deal.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                              </div>
                              <StalledBadge days={days} />
                            </div>

                            {/* Footer: Consultor (responsável comercial) */}
                            <div className="flex items-center justify-end gap-1.5 pt-0.5 border-t border-muted/40 mt-1">
                              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-[9px] font-bold text-primary">{deal.consultor.charAt(0)}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground font-['Source_Serif_4']">{deal.consultor}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {colDeals.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/30 gap-2">
                        <Car className="h-6 w-6" /><p className="text-xs">Arraste cards aqui</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-3 border-b">
              <span className="text-sm font-medium">{sorted.length} registros</span>
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
                    {([
                      ["id", "ID"], ["lead_nome", "Lead"], ["veiculo_modelo", "Veículo"], ["plano", "Plano"],
                      ["stage", "Etapa"], ["consultor", "Consultor"], ["cooperativa", "Cooperativa"],
                      ["regional", "Regional"], ["created_at", "Data Criação"], ["updated_at", "Última Mov."],
                    ] as [SortKey, string][]).map(([key, label]) => (
                      <TableHead key={key} className="text-xs cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort(key)}>
                        <span className="flex items-center gap-1">{label}<ArrowUpDown className="h-3 w-3 text-muted-foreground/50" /></span>
                      </TableHead>
                    ))}
                    <TableHead className="text-xs">SGA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map(deal => (
                    <TableRow key={deal.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setDetailDeal(deal)}>
                      <TableCell className="text-xs font-mono">{deal.id}</TableCell>
                      <TableCell className="font-medium text-sm">{deal.lead_nome}</TableCell>
                      <TableCell className="text-xs">
                        <div>{deal.veiculo_modelo}</div>
                        <span className="font-mono text-muted-foreground">{deal.veiculo_placa}</span>
                      </TableCell>
                      <TableCell className="text-xs">{deal.plano}</TableCell>
                      <TableCell>
                        <Badge className="text-[10px]" style={{ backgroundColor: `${stageColor(deal.stage)}20`, color: stageColor(deal.stage), borderColor: `${stageColor(deal.stage)}40` }} variant="outline">
                          {stageLabel(deal.stage)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{deal.consultor}</TableCell>
                      <TableCell className="text-xs">{deal.cooperativa}</TableCell>
                      <TableCell className="text-xs">{deal.regional}</TableCell>
                      <TableCell className="text-xs">{new Date(deal.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-xs">{new Date(deal.updated_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{deal.enviado_sga ? <Badge className="bg-green-600 text-white text-[9px]">SGA</Badge> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t">
                <span className="text-xs text-muted-foreground">Página {page} de {totalPages}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="outline" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="outline" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Floating button */}
      <Button
        className="fixed bottom-6 right-6 h-12 px-5 rounded-full shadow-xl z-50"
        onClick={() => setNewDealOpen(true)}
      >
        <Plus className="h-5 w-5 mr-2" />Nova Negociação
      </Button>

      {/* New deal modal */}
      <Dialog open={newDealOpen} onOpenChange={setNewDealOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Negociação</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Nome do Lead *</Label><Input value={form.lead_nome} onChange={e => setForm({ ...form, lead_nome: e.target.value })} placeholder="Nome completo" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>CPF/CNPJ</Label><Input value={form.cpf_cnpj} onChange={e => setForm({ ...form, cpf_cnpj: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Telefone/WhatsApp</Label><Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>E-mail</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Placa do Veículo</Label><Input value={form.placa} onChange={e => setForm({ ...form, placa: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Modelo do Veículo</Label><Input value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Plano</Label>
                <Select value={form.plano} onValueChange={v => setForm({ ...form, plano: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{planos.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Cooperativa</Label>
                <Select value={form.cooperativa} onValueChange={v => setForm({ ...form, cooperativa: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{cooperativas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Regional</Label>
                <Select value={form.regional} onValueChange={v => setForm({ ...form, regional: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{regionais.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Consultor Responsável</Label>
                <Select value={form.consultor} onValueChange={v => setForm({ ...form, consultor: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{consultores.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={3} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewDealOpen(false)}>Cancelar</Button>
              <Button onClick={handleNewDeal} disabled={!form.lead_nome}>Criar Negociação</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deal detail modal */}
      {detailDeal && (
        <DealDetailModal deal={detailDeal} open={!!detailDeal} onOpenChange={o => { if (!o) setDetailDeal(null); }} />
      )}
    </div>
  );
}
