import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Regional {
  id: string;
  nome: string;
  estado: string | null;
  ativo: boolean;
}

interface Cooperativa {
  id: string;
  nome: string;
  regional_id: string | null;
  ativa: boolean;
  codigo_sga: string | null;
  cpf_cnpj: string | null;
  regionais: { id: string; nome: string } | null;
}

export default function RegionaisCooperativasTab() {
  const queryClient = useQueryClient();

  // ── State ──
  const [showRegionalModal, setShowRegionalModal] = useState(false);
  const [showCoopModal, setShowCoopModal] = useState(false);
  const [editRegionalId, setEditRegionalId] = useState<string | null>(null);
  const [editCoopId, setEditCoopId] = useState<string | null>(null);
  const [nomeRegional, setNomeRegional] = useState("");
  const [codigoSgaRegional, setCodigoSgaRegional] = useState("");
  const [nomeCoop, setNomeCoop] = useState("");
  const [cnpjCoop, setCnpjCoop] = useState("");
  const [codigoSgaCoop, setCodigoSgaCoop] = useState("");
  const [regionalCoop, setRegionalCoop] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ type: "regional" | "cooperativa"; id: string; nome: string } | null>(null);

  // ── Queries ──
  const { data: regionais = [], isLoading: loadingRegionais } = useQuery({
    queryKey: ["regionais-tab"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("regionais")
        .select("id, nome, estado, ativo")
        .order("nome");
      if (error) throw error;
      return (data || []) as Regional[];
    },
  });

  const { data: cooperativas = [], isLoading: loadingCoops } = useQuery({
    queryKey: ["cooperativas-tab"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cooperativas")
        .select("id, nome, regional_id, ativo, codigo_sga, cpf_cnpj, regionais(id, nome)")
        .order("nome");
      if (error) throw error;
      return (data || []) as Cooperativa[];
    },
  });

  // ── Mutations: Regional ──
  const saveRegionalMutation = useMutation({
    mutationFn: async (payload: { id?: string; nome: string; codigo_sga?: string }) => {
      const row: any = { nome: payload.nome };
      if (payload.codigo_sga) row.codigo_sga = payload.codigo_sga;
      if (payload.id) {
        const { error } = await (supabase as any).from("regionais").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("regionais").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regionais-tab"] });
      queryClient.invalidateQueries({ queryKey: ["cooperativas-tab"] });
      toast.success(editRegionalId ? "Regional atualizada!" : "Regional cadastrada!");
      setShowRegionalModal(false);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar regional"),
  });

  const deleteRegionalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("regionais").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regionais-tab"] });
      queryClient.invalidateQueries({ queryKey: ["cooperativas-tab"] });
      toast.success("Regional removida!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao excluir regional. Pode haver cooperativas vinculadas."),
  });

  // ── Mutations: Cooperativa ──
  const saveCoopMutation = useMutation({
    mutationFn: async (payload: { id?: string; nome: string; regional_id?: string; cpf_cnpj?: string; codigo_sga?: string }) => {
      const row: any = { nome: payload.nome };
      if (payload.regional_id) row.regional_id = payload.regional_id;
      if (payload.cpf_cnpj) row.cpf_cnpj = payload.cpf_cnpj;
      if (payload.codigo_sga) row.codigo_sga = payload.codigo_sga;
      if (payload.id) {
        const { error } = await (supabase as any).from("cooperativas").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("cooperativas").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cooperativas-tab"] });
      toast.success(editCoopId ? "Cooperativa atualizada!" : "Cooperativa cadastrada!");
      setShowCoopModal(false);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar cooperativa"),
  });

  const deleteCoopMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("cooperativas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cooperativas-tab"] });
      toast.success("Cooperativa removida!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao excluir cooperativa. Pode haver registros vinculados."),
  });

  // ── Helpers ──
  const formatCnpj = (value: string) => {
    const nums = value.replace(/\D/g, "").slice(0, 14);
    return nums.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
      .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})/, "$1.$2.$3/$4")
      .replace(/^(\d{2})(\d{3})(\d{3})/, "$1.$2.$3")
      .replace(/^(\d{2})(\d{3})/, "$1.$2")
      .replace(/^(\d{2})/, "$1");
  };

  const openNewRegional = () => {
    setEditRegionalId(null);
    setNomeRegional("");
    setCodigoSgaRegional("");
    setShowRegionalModal(true);
  };

  const openEditRegional = (r: Regional) => {
    setEditRegionalId(r.id);
    setNomeRegional(r.nome);
    setCodigoSgaRegional("");
    setShowRegionalModal(true);
  };

  const openNewCoop = () => {
    setEditCoopId(null);
    setNomeCoop("");
    setCnpjCoop("");
    setCodigoSgaCoop("");
    setRegionalCoop("");
    setShowCoopModal(true);
  };

  const openEditCoop = (c: Cooperativa) => {
    setEditCoopId(c.id);
    setNomeCoop(c.nome);
    setCnpjCoop(c.cpf_cnpj || "");
    setCodigoSgaCoop(c.codigo_sga || "");
    setRegionalCoop(c.regional_id || "");
    setShowCoopModal(true);
  };

  const handleSaveRegional = () => {
    if (!nomeRegional.trim()) { toast.error("Preencha o nome da regional"); return; }
    saveRegionalMutation.mutate(
      editRegionalId
        ? { id: editRegionalId, nome: nomeRegional.trim(), codigo_sga: codigoSgaRegional.trim() || undefined }
        : { nome: nomeRegional.trim(), codigo_sga: codigoSgaRegional.trim() || undefined }
    );
  };

  const handleSaveCoop = () => {
    if (!nomeCoop.trim()) { toast.error("Preencha o nome da cooperativa"); return; }
    saveCoopMutation.mutate(
      editCoopId
        ? { id: editCoopId, nome: nomeCoop.trim(), regional_id: regionalCoop || undefined, cpf_cnpj: cnpjCoop.trim() || undefined, codigo_sga: codigoSgaCoop.trim() || undefined }
        : { nome: nomeCoop.trim(), regional_id: regionalCoop || undefined, cpf_cnpj: cnpjCoop.trim() || undefined, codigo_sga: codigoSgaCoop.trim() || undefined }
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "regional") {
      deleteRegionalMutation.mutate(deleteTarget.id);
    } else {
      deleteCoopMutation.mutate(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  const isLoading = loadingRegionais || loadingCoops;

  // Count cooperativas per regional
  const coopCountByRegional = (regionalId: string) =>
    cooperativas.filter((c) => c.regional_id === regionalId).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Regionais */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Regionais</h3>
            <p className="text-sm text-muted-foreground">Gerencie as regionais da organização</p>
          </div>
          <Button onClick={openNewRegional} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Regional
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cooperativas Vinculadas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regionais.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhuma regional encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  regionais.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={r.ativo ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}>
                          {r.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell>{coopCountByRegional(r.id)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditRegional(r)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget({ type: "regional", id: r.id, nome: r.nome })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Cooperativas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Cooperativas</h3>
            <p className="text-sm text-muted-foreground">Gerencie as cooperativas vinculadas às regionais</p>
          </div>
          <Button onClick={openNewCoop} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Cooperativa
          </Button>
        </div>
        <Alert variant="destructive" className="bg-warning/8 border-warning/25 text-warning">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription>Alteração de CNPJ requer abertura de chamado ao suporte.</AlertDescription>
        </Alert>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Regional</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cooperativas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhuma cooperativa encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  cooperativas.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell>{c.regionais?.nome || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={c.ativa ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}>
                          {c.ativa ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCoop(c)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget({ type: "cooperativa", id: c.id, nome: c.nome })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal Regional */}
      <Dialog open={showRegionalModal} onOpenChange={setShowRegionalModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editRegionalId ? "Editar Regional" : "Nova Regional"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={nomeRegional} onChange={e => setNomeRegional(e.target.value)} placeholder="Ex: Regional Centro-Oeste" /></div>
            <div><Label>Código Integração SGA</Label><Input value={codigoSgaRegional} onChange={e => setCodigoSgaRegional(e.target.value)} placeholder="Ex: SGA-CO005" /></div>
            <div className="flex justify-end gap-2 pt-4 border-t-2 border-[#747474]">
              <Button variant="outline" onClick={() => setShowRegionalModal(false)}>Cancelar</Button>
              <Button onClick={handleSaveRegional} disabled={saveRegionalMutation.isPending}>
                {saveRegionalMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Cooperativa */}
      <Dialog open={showCoopModal} onOpenChange={setShowCoopModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editCoopId ? "Editar Cooperativa" : "Nova Cooperativa"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={nomeCoop} onChange={e => setNomeCoop(e.target.value)} placeholder="Ex: Cooperativa Brasília" /></div>
            <div><Label>CNPJ</Label><Input value={cnpjCoop} onChange={e => setCnpjCoop(formatCnpj(e.target.value))} placeholder="00.000.000/0000-00" /></div>
            <div><Label>Código SGA</Label><Input value={codigoSgaCoop} onChange={e => setCodigoSgaCoop(e.target.value)} placeholder="Ex: COOP-007" /></div>
            <div>
              <Label>Regional</Label>
              <Select value={regionalCoop} onValueChange={setRegionalCoop}>
                <SelectTrigger><SelectValue placeholder="Selecione a regional" /></SelectTrigger>
                <SelectContent>
                  {regionais.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t-2 border-[#747474]">
              <Button variant="outline" onClick={() => setShowCoopModal(false)}>Cancelar</Button>
              <Button onClick={handleSaveCoop} disabled={saveCoopMutation.isPending}>
                {saveCoopMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {deleteTarget?.type === "regional" ? "a regional" : "a cooperativa"}{" "}
              <strong>{deleteTarget?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
