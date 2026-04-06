import { useState, useMemo } from "react";
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
import { Plus, Edit, Trash2, AlertTriangle, Loader2, MapPin, Search, X, ChevronDown, ChevronRight } from "lucide-react";
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

interface Municipio {
  id: number;
  nome: string;
  uf: string;
}

interface RegionalCidade {
  id: string;
  regional_id: string;
  municipio_id: number;
  municipios: { id: number; nome: string; uf: string };
}

// ── UFs do Brasil ──
const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

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

  // Cidades state
  const [expandedRegionalId, setExpandedRegionalId] = useState<string | null>(null);
  const [cidadeUfFilter, setCidadeUfFilter] = useState<string>("all");
  const [cidadeSearch, setCidadeSearch] = useState("");

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
        .select("id, nome, regional_id, ativa, codigo_sga, cpf_cnpj, regionais(id, nome)")
        .order("nome");
      if (error) throw error;
      return (data || []) as Cooperativa[];
    },
  });

  // Cidades vinculadas à regional expandida
  const { data: cidadesVinculadas = [], isLoading: loadingCidades } = useQuery({
    queryKey: ["regional-cidades", expandedRegionalId],
    enabled: !!expandedRegionalId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("regional_cidades")
        .select("id, regional_id, municipio_id, municipios(id, nome, uf)")
        .eq("regional_id", expandedRegionalId)
        .order("municipios(nome)");
      if (error) throw error;
      return (data || []) as RegionalCidade[];
    },
  });

  // Municípios disponíveis para adicionar (filtrados)
  const { data: municipios = [] } = useQuery({
    queryKey: ["municipios-lista"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("municipios")
        .select("id, nome, uf")
        .order("nome");
      if (error) throw error;
      return (data || []) as Municipio[];
    },
  });

  // Todas as cidades já vinculadas a qualquer regional (para checar conflitos)
  const { data: todasCidadesVinculadas = [] } = useQuery({
    queryKey: ["todas-regional-cidades"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("regional_cidades")
        .select("municipio_id, regional_id, regionais(nome)");
      if (error) throw error;
      return (data || []) as Array<{ municipio_id: number; regional_id: string; regionais: { nome: string } | null }>;
    },
  });

  const cidadesVinculadasMap = useMemo(() => {
    const map = new Map<number, { regional_id: string; regional_nome: string }>();
    todasCidadesVinculadas.forEach((c) => {
      map.set(c.municipio_id, { regional_id: c.regional_id, regional_nome: c.regionais?.nome || "" });
    });
    return map;
  }, [todasCidadesVinculadas]);

  // Contagem de cidades por regional
  const cidadeCountByRegional = useMemo(() => {
    const map = new Map<string, number>();
    todasCidadesVinculadas.forEach((c) => {
      map.set(c.regional_id, (map.get(c.regional_id) || 0) + 1);
    });
    return map;
  }, [todasCidadesVinculadas]);

  // Municípios filtrados para adicionar
  const municipiosFiltrados = useMemo(() => {
    if (!expandedRegionalId) return [];
    let filtered = municipios;
    if (cidadeUfFilter !== "all") {
      filtered = filtered.filter((m) => m.uf === cidadeUfFilter);
    }
    if (cidadeSearch.trim()) {
      const s = cidadeSearch.toLowerCase().trim();
      filtered = filtered.filter((m) => m.nome.toLowerCase().includes(s));
    }
    // Excluir cidades já vinculadas a ESTA regional
    const idsVinculados = new Set(cidadesVinculadas.map((c) => c.municipio_id));
    filtered = filtered.filter((m) => !idsVinculados.has(m.id));
    return filtered.slice(0, 50); // Limitar para performance
  }, [municipios, cidadeUfFilter, cidadeSearch, cidadesVinculadas, expandedRegionalId]);

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
      queryClient.invalidateQueries({ queryKey: ["todas-regional-cidades"] });
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
    onError: (e: any) => toast.error(e.message || "Erro ao excluir cooperativa."),
  });

  // ── Mutations: Cidades ──
  const addCidadeMutation = useMutation({
    mutationFn: async (payload: { regional_id: string; municipio_id: number }) => {
      const { error } = await (supabase as any).from("regional_cidades").insert(payload);
      if (error) {
        if (error.code === "23505") {
          const owner = cidadesVinculadasMap.get(payload.municipio_id);
          throw new Error(`Esta cidade já pertence à regional "${owner?.regional_nome || "outra"}"`);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regional-cidades", expandedRegionalId] });
      queryClient.invalidateQueries({ queryKey: ["todas-regional-cidades"] });
      toast.success("Cidade adicionada!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao adicionar cidade"),
  });

  const removeCidadeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("regional_cidades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regional-cidades", expandedRegionalId] });
      queryClient.invalidateQueries({ queryKey: ["todas-regional-cidades"] });
      toast.success("Cidade removida!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao remover cidade"),
  });

  // Adicionar todas as cidades de uma UF
  const addAllUfMutation = useMutation({
    mutationFn: async ({ regional_id, uf }: { regional_id: string; uf: string }) => {
      const cidadesUf = municipios.filter((m) => m.uf === uf);
      const idsVinculados = new Set(cidadesVinculadas.map((c) => c.municipio_id));
      const novas = cidadesUf.filter((m) => !idsVinculados.has(m.id) && !cidadesVinculadasMap.has(m.id));
      if (novas.length === 0) throw new Error("Todas as cidades desta UF já estão vinculadas");
      const rows = novas.map((m) => ({ regional_id, municipio_id: m.id }));
      const { error } = await (supabase as any).from("regional_cidades").insert(rows);
      if (error) throw error;
      return novas.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["regional-cidades", expandedRegionalId] });
      queryClient.invalidateQueries({ queryKey: ["todas-regional-cidades"] });
      toast.success(`${count} cidades adicionadas!`);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao adicionar cidades"),
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

  const toggleExpandRegional = (id: string) => {
    if (expandedRegionalId === id) {
      setExpandedRegionalId(null);
    } else {
      setExpandedRegionalId(id);
      setCidadeUfFilter("all");
      setCidadeSearch("");
    }
  };

  const isLoading = loadingRegionais || loadingCoops;

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
            <p className="text-sm text-muted-foreground">Gerencie as regionais e suas cidades atendidas</p>
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
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cooperativas</TableHead>
                  <TableHead>Cidades</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regionais.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhuma regional encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  regionais.map((r) => {
                    const isExpanded = expandedRegionalId === r.id;
                    return (
                      <>
                        <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpandRegional(r.id)}>
                          <TableCell>
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          </TableCell>
                          <TableCell className="font-medium">{r.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={r.ativo ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}>
                              {r.ativo ? "Ativa" : "Inativa"}
                            </Badge>
                          </TableCell>
                          <TableCell>{coopCountByRegional(r.id)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              <MapPin className="h-3 w-3" />
                              {cidadeCountByRegional.get(r.id) || 0} cidades
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditRegional(r)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget({ type: "regional", id: r.id, nome: r.nome })}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* Cidades Atendidas expandidas */}
                        {isExpanded && (
                          <TableRow key={`${r.id}-cidades`}>
                            <TableCell colSpan={6} className="bg-muted/30 p-4">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    Cidades Atendidas — {r.nome}
                                  </h4>
                                  {cidadeUfFilter !== "all" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1 text-xs"
                                      onClick={() => addAllUfMutation.mutate({ regional_id: r.id, uf: cidadeUfFilter })}
                                      disabled={addAllUfMutation.isPending}
                                    >
                                      {addAllUfMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                                      Adicionar todas de {cidadeUfFilter}
                                    </Button>
                                  )}
                                </div>

                                {/* Cidades vinculadas */}
                                {loadingCidades ? (
                                  <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando cidades...
                                  </div>
                                ) : cidadesVinculadas.length === 0 ? (
                                  <p className="text-sm text-muted-foreground py-2">Nenhuma cidade vinculada a esta regional.</p>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto p-2 border rounded-md bg-card">
                                    {cidadesVinculadas.map((cv) => (
                                      <Badge key={cv.id} variant="secondary" className="gap-1 pr-1">
                                        {cv.municipios.nome}/{cv.municipios.uf}
                                        <button
                                          onClick={() => removeCidadeMutation.mutate(cv.id)}
                                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {/* Adicionar cidades */}
                                <div className="border-t pt-4 space-y-3">
                                  <p className="text-xs font-medium text-muted-foreground">Adicionar cidades:</p>
                                  <div className="flex gap-2">
                                    <Select value={cidadeUfFilter} onValueChange={setCidadeUfFilter}>
                                      <SelectTrigger className="w-[120px]">
                                        <SelectValue placeholder="UF" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="all">Todas UFs</SelectItem>
                                        {UFS.map((uf) => (
                                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <div className="relative flex-1">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <Input
                                        placeholder="Buscar cidade..."
                                        value={cidadeSearch}
                                        onChange={(e) => setCidadeSearch(e.target.value)}
                                        className="pl-9"
                                      />
                                    </div>
                                  </div>

                                  {(cidadeUfFilter !== "all" || cidadeSearch.trim()) && (
                                    <div className="border rounded-md max-h-[250px] overflow-y-auto">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead className="text-xs">Cidade</TableHead>
                                            <TableHead className="text-xs w-16">UF</TableHead>
                                            <TableHead className="text-xs w-32">Status</TableHead>
                                            <TableHead className="text-xs w-20 text-right">Ação</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {municipiosFiltrados.length === 0 ? (
                                            <TableRow>
                                              <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">
                                                {cidadeSearch ? "Nenhuma cidade encontrada" : "Selecione uma UF ou busque por nome"}
                                              </TableCell>
                                            </TableRow>
                                          ) : (
                                            municipiosFiltrados.map((m) => {
                                              const owner = cidadesVinculadasMap.get(m.id);
                                              const isOwnedByOther = owner && owner.regional_id !== expandedRegionalId;
                                              return (
                                                <TableRow key={m.id}>
                                                  <TableCell className="text-xs">{m.nome}</TableCell>
                                                  <TableCell className="text-xs">{m.uf}</TableCell>
                                                  <TableCell className="text-xs">
                                                    {isOwnedByOther ? (
                                                      <span className="text-warning text-[10px]">Em: {owner.regional_nome}</span>
                                                    ) : (
                                                      <span className="text-muted-foreground text-[10px]">Disponível</span>
                                                    )}
                                                  </TableCell>
                                                  <TableCell className="text-right">
                                                    <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      className="h-7 w-7 p-0"
                                                      disabled={!!isOwnedByOther || addCidadeMutation.isPending}
                                                      onClick={() => addCidadeMutation.mutate({ regional_id: r.id, municipio_id: m.id })}
                                                    >
                                                      <Plus className="h-3.5 w-3.5" />
                                                    </Button>
                                                  </TableCell>
                                                </TableRow>
                                              );
                                            })
                                          )}
                                          {municipiosFiltrados.length >= 50 && (
                                            <TableRow>
                                              <TableCell colSpan={4} className="text-center text-[10px] text-muted-foreground py-2">
                                                Mostrando 50 primeiros resultados. Refine a busca para ver mais.
                                              </TableCell>
                                            </TableRow>
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })
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
