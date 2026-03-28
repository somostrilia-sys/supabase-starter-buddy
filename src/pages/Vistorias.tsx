import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, Filter, Plus, ChevronLeft, ChevronRight,
  Calendar, User, Car, Loader2,
} from "lucide-react";

const statusMap: Record<string, { label: string; class: string }> = {
  pendente:      { label: "Pendente",      class: "bg-sky-500/15 text-sky-400 border-0" },
  em_andamento:  { label: "Em Andamento",  class: "bg-warning/80/15 text-amber-400 border-0" },
  aprovada:      { label: "Aprovada",      class: "bg-emerald-500/15 text-emerald-400 border-0" },
  reprovada:     { label: "Reprovada",     class: "bg-destructive/15 text-destructive border-0" },
};

const STATUS_OPTIONS = ["pendente", "em_andamento", "aprovada", "reprovada"] as const;

type VistoriaRow = {
  id: string;
  associado_id: string | null;
  veiculo_id: string | null;
  contrato_id: string | null;
  status: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  associados?: { nome: string } | null;
  veiculos?: { placa: string; marca: string; modelo: string } | null;
};

export default function Vistorias() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<VistoriaRow | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(0);
  const perPage = 10;

  // Nova Vistoria dialog state
  const [novaOpen, setNovaOpen] = useState(false);
  const [novaAssociadoBusca, setNovaAssociadoBusca] = useState("");
  const [novaAssociadoId, setNovaAssociadoId] = useState("");
  const [novaVeiculoId, setNovaVeiculoId] = useState("");
  const [novaStatus, setNovaStatus] = useState("pendente");
  const [novaObs, setNovaObs] = useState("");
  const [novaLoading, setNovaLoading] = useState(false);

  // Status update state for detail panel
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  // Fetch vistorias with joins
  const { data: vistorias = [], isLoading } = useQuery({
    queryKey: ["vistorias"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("vistorias")
        .select("*, associados(nome), veiculos(placa, marca, modelo)")
        .order("created_at", { ascending: false }) as any);
      if (error) throw error;
      return (data || []) as VistoriaRow[];
    },
  });

  // Associado search for Nova Vistoria form
  const { data: assocResults = [] } = useQuery({
    queryKey: ["assoc-search-vistoria", novaAssociadoBusca],
    enabled: novaAssociadoBusca.length >= 3,
    queryFn: async () => {
      const { data } = await supabase
        .from("associados")
        .select("id, nome, cpf")
        .ilike("nome", `%${novaAssociadoBusca}%`)
        .limit(5);
      return data || [];
    },
  });

  // Veiculos for selected associado
  const { data: veiculoResults = [] } = useQuery({
    queryKey: ["veic-by-assoc-vistoria", novaAssociadoId],
    enabled: !!novaAssociadoId,
    queryFn: async () => {
      const { data } = await supabase
        .from("veiculos")
        .select("id, placa, marca, modelo")
        .eq("associado_id", novaAssociadoId);
      return data || [];
    },
  });

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      setUpdatingStatus(true);
      const { error } = await supabase
        .from("vistorias")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      // audit_log
      if (user?.id) {
        await supabase.from("audit_log").insert({
          usuario_id: user.id,
          acao: "UPDATE_VISTORIA_STATUS",
          tabela: "vistorias",
          registro_id: id,
          dados_novos: { status } as any,
        });
      }
    },
    onSuccess: () => {
      toast.success("Status atualizado!");
      queryClient.invalidateQueries({ queryKey: ["vistorias"] });
      setSelected(null);
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
    onSettled: () => setUpdatingStatus(false),
  });

  // Create nova vistoria
  async function handleNovaVistoria() {
    if (!novaAssociadoId) { toast.error("Selecione um associado"); return; }
    setNovaLoading(true);
    try {
      const { error } = await supabase.from("vistorias").insert({
        associado_id: novaAssociadoId || null,
        veiculo_id: novaVeiculoId || null,
        status: novaStatus,
        observacoes: novaObs || null,
      });
      if (error) throw error;
      if (user?.id) {
        await supabase.from("audit_log").insert({
          usuario_id: user.id,
          acao: "CREATE_VISTORIA",
          tabela: "vistorias",
          dados_novos: { associado_id: novaAssociadoId, status: novaStatus } as any,
        });
      }
      toast.success("Vistoria criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["vistorias"] });
      setNovaOpen(false);
      setNovaAssociadoBusca(""); setNovaAssociadoId(""); setNovaVeiculoId(""); setNovaStatus("pendente"); setNovaObs("");
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setNovaLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return vistorias.filter(v => {
      if (filterStatus !== "all" && v.status !== filterStatus) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      const assocNome = v.associados?.nome?.toLowerCase() ?? "";
      const placa = v.veiculos?.placa?.toLowerCase() ?? "";
      const id = v.id.toLowerCase();
      return assocNome.includes(s) || placa.includes(s) || id.includes(s);
    });
  }, [vistorias, search, filterStatus]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice(page * perPage, (page + 1) * perPage);

  function getStatusInfo(status: string) {
    return statusMap[status] ?? { label: status, class: "bg-muted text-muted-foreground border-0" };
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vistorias</h1>
          <p className="text-sm text-muted-foreground">
            {vistorias.length} vistorias · {vistorias.filter(v => v.status === "pendente").length} pendentes
          </p>
        </div>
        <Button size="sm" onClick={() => setNovaOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nova Vistoria
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por associado, placa ou ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(0); }}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {STATUS_OPTIONS.map(s => (
                      <SelectItem key={s} value={s}>{getStatusInfo(s).label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => setFilterOpen(false)}>Aplicar</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="border border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    {["ID", "Associado", "Veículo", "Status", "Data"].map(h => (
                      <th key={h} className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-xs text-muted-foreground">Nenhuma vistoria encontrada</td></tr>
                  ) : pageData.map(v => (
                    <tr
                      key={v.id}
                      className="border-b border-border/30 hover:bg-muted/20 cursor-pointer transition-colors"
                      onClick={() => { setSelected(v); setNewStatus(v.status); }}
                    >
                      <td className="p-3 text-xs font-mono text-primary">{v.id.slice(0, 8)}…</td>
                      <td className="p-3 text-xs font-medium">{v.associados?.nome ?? <span className="text-muted-foreground">—</span>}</td>
                      <td className="p-3 text-xs">
                        {v.veiculos ? (
                          <><Badge variant="secondary" className="font-mono text-[9px]">{v.veiculos.placa}</Badge>{" "}
                          <span className="text-muted-foreground">{v.veiculos.marca} {v.veiculos.modelo}</span></>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3">
                        <Badge className={`text-[9px] ${getStatusInfo(v.status).class}`}>
                          {getStatusInfo(v.status).label}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(v.created_at).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {filtered.length === 0 ? "0" : `${page * perPage + 1}–${Math.min((page + 1) * perPage, filtered.length)}`} de {filtered.length}
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <SheetContent className="w-[460px] overflow-y-auto">
          {selected && (
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="font-bold text-lg">Vistoria</h3>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">{selected.id}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`text-[9px] ${getStatusInfo(selected.status).class}`}>
                    {getStatusInfo(selected.status).label}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Associado:</span> {selected.associados?.nome ?? "—"}
                </div>
                <div className="flex items-center gap-1.5">
                  <Car className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Veículo:</span>{" "}
                  {selected.veiculos ? `${selected.veiculos.marca} ${selected.veiculos.modelo}` : "—"}
                </div>
                {selected.veiculos && (
                  <div className="flex items-center gap-1.5 col-span-2">
                    <span className="text-muted-foreground">Placa:</span>
                    <Badge variant="secondary" className="font-mono text-[10px]">{selected.veiculos.placa}</Badge>
                  </div>
                )}
                <div className="flex items-center gap-1.5 col-span-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Data:</span>{" "}
                  {new Date(selected.created_at).toLocaleDateString("pt-BR")}
                </div>
              </div>
              {selected.observacoes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Observações</p>
                    <p className="text-xs">{selected.observacoes}</p>
                  </div>
                </>
              )}
              <Separator />
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Atualizar Status</p>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => (
                      <SelectItem key={s} value={s}>{getStatusInfo(s).label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={updatingStatus || newStatus === selected.status}
                  onClick={() => updateStatus.mutate({ id: selected.id, status: newStatus })}
                >
                  {updatingStatus && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
                  Salvar Status
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Nova Vistoria Dialog */}
      <Dialog open={novaOpen} onOpenChange={setNovaOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Vistoria</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Buscar Associado (mín. 3 letras)</Label>
              <Input
                placeholder="Digite o nome do associado..."
                value={novaAssociadoBusca}
                onChange={e => { setNovaAssociadoBusca(e.target.value); setNovaAssociadoId(""); setNovaVeiculoId(""); }}
                className="text-sm"
              />
              {assocResults.length > 0 && !novaAssociadoId && (
                <div className="border border-border rounded-md divide-y max-h-40 overflow-y-auto">
                  {assocResults.map((a: any) => (
                    <button
                      key={a.id}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition-colors"
                      onClick={() => { setNovaAssociadoId(a.id); setNovaAssociadoBusca(a.nome); }}
                    >
                      <span className="font-medium">{a.nome}</span>
                      <span className="text-muted-foreground ml-2">{a.cpf}</span>
                    </button>
                  ))}
                </div>
              )}
              {novaAssociadoId && (
                <p className="text-[11px] text-emerald-500">✓ Associado selecionado</p>
              )}
            </div>

            {novaAssociadoId && veiculoResults.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Veículo (opcional)</Label>
                <Select value={novaVeiculoId} onValueChange={setNovaVeiculoId}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecionar veículo" /></SelectTrigger>
                  <SelectContent>
                    {veiculoResults.map((v: any) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.placa} — {v.marca} {v.modelo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Status inicial</Label>
              <Select value={novaStatus} onValueChange={setNovaStatus}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>{getStatusInfo(s).label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Observações</Label>
              <Textarea
                placeholder="Observações da vistoria..."
                value={novaObs}
                onChange={e => setNovaObs(e.target.value)}
                className="text-xs"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaOpen(false)}>Cancelar</Button>
            <Button onClick={handleNovaVistoria} disabled={novaLoading || !novaAssociadoId}>
              {novaLoading && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
              Criar Vistoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
