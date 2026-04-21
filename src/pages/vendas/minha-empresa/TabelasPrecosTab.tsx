import { useState, useMemo, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChevronDown, ChevronRight, Search, Loader2, Plus, Edit, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";
import TabelaMestreModal from "./TabelaMestreModal";

interface TabelaPrecoRow {
  id: string;
  tabela_id: string;
  plano: string;
  cota: number;
  valor_menor: number;
  valor_maior: number;
  taxa_administrativa: number;
  adesao: number;
  rastreador: string;
  instalacao: number;
  tipo_franquia: string;
  valor_franquia: number;
  regional: string;
  tipo_veiculo: string;
  plano_normalizado: string;
  regional_normalizado: string;
  grupo_produto_id: string | null;
  regional_id: string | null;
  regional_nome?: string; // populated via join
}

interface GrupoProduto {
  id: string;
  nome: string;
}

interface Regional {
  id: string;
  nome: string;
}

interface TabelaAgrupada {
  regional: string;
  tipo_veiculo: string;
  planos: string[];
  faixas: number;
  rows: TabelaPrecoRow[];
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const TIPOS_VEICULO = ["leves", "motos", "pesados", "utilitarios", "vans"];

const emptyForm = {
  plano: "",
  regional_id: "",
  tipo_veiculo: "",
  valor_menor: "",
  valor_maior: "",
  cota: "",
  taxa_administrativa: "",
  adesao: "",
  rastreador: "",
  instalacao: "",
  tipo_franquia: "",
  valor_franquia: "",
  grupo_produto_id: "",
  tabela_id: "",
};

type FormData = typeof emptyForm;

export default function TabelasPrecosTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterRegional, setFilterRegional] = useState<string>("all");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; plano: string } | null>(null);
  const [mestreOpen, setMestreOpen] = useState<{ tabelaId: string; label: string } | null>(null);

  const { data: rows, isLoading, error } = useQuery<TabelaPrecoRow[]>({
    queryKey: ["tabela_precos"],
    queryFn: async () => {
      // Paginação manual: PostgREST default limita a 1000 rows e estávamos cortando
      // Pesados/Vans de várias regionais silenciosamente.
      const PAGE_SIZE = 1000;
      let allRows: any[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("tabela_precos")
          .select("*, regionais:regional_id(nome)")
          .order("regional")
          .order("tipo_veiculo")
          .order("plano")
          .order("valor_menor")
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allRows = allRows.concat(data);
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }
      return allRows.map((r: any) => ({
        ...r,
        // Prioriza campo texto "regional" (consistente com o gravado na import)
        // sobre o join por regional_id (que tem inconsistências pré-existentes).
        regional_nome: r.regional || r.regionais?.nome || "Sem regional",
      })) as TabelaPrecoRow[];
    },
  });

  const { data: gruposProdutos = [] } = useQuery({
    queryKey: ["grupos_produtos_select"],
    queryFn: async () => {
      const { data, error } = await supabase.from("grupos_produtos").select("id, nome").eq("ativo", true).order("nome");
      if (error) throw error;
      return (data || []) as GrupoProduto[];
    },
  });

  const { data: regionaisDb = [] } = useQuery({
    queryKey: ["regionais_select"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("regionais").select("id, nome").eq("ativo", true).order("nome");
      if (error) throw error;
      return (data || []) as Regional[];
    },
  });

  const grouped = useMemo<TabelaAgrupada[]>(() => {
    if (!rows) return [];
    const map = new Map<string, TabelaPrecoRow[]>();
    for (const r of rows) {
      const key = `${r.regional_nome || r.regional}||${r.tipo_veiculo}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries()).map(([, items]) => {
      const planos = [...new Set(items.map((i) => i.plano))];
      const faixas = new Set(items.map((i) => `${i.valor_menor}-${i.valor_maior}`)).size;
      return { regional: items[0].regional_nome || items[0].regional, tipo_veiculo: items[0].tipo_veiculo, planos, faixas, rows: items };
    });
  }, [rows]);

  const regionais = useMemo(() => [...new Set(grouped.map((g) => g.regional))].sort(), [grouped]);
  const tiposVeiculo = useMemo(() => [...new Set(grouped.map((g) => g.tipo_veiculo))].sort(), [grouped]);

  const filtered = useMemo(() => {
    return grouped.filter((g) => {
      if (filterRegional !== "all" && g.regional !== filterRegional) return false;
      if (filterTipo !== "all" && g.tipo_veiculo !== filterTipo) return false;
      if (search) {
        const s = search.toLowerCase();
        return g.regional.toLowerCase().includes(s) || g.tipo_veiculo.toLowerCase().includes(s) || g.planos.some((p) => p.toLowerCase().includes(s));
      }
      return true;
    });
  }, [grouped, filterRegional, filterTipo, search]);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  };

  // ── Mutations ──
  const saveMutation = useMutation({
    mutationFn: async (payload: { id?: string; data: Record<string, any> }) => {
      if (payload.id) {
        const { error } = await supabase.from("tabela_precos").update(payload.data).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tabela_precos").insert(payload.data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tabela_precos"] });
      toast.success(editingId ? "Faixa atualizada!" : "Faixa criada!");
      setModalOpen(false);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tabela_precos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tabela_precos"] });
      toast.success("Faixa removida!");
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao remover"),
  });

  const openCreate = (defaults?: { regional_id?: string; tipo_veiculo?: string; plano?: string }) => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      regional_id: defaults?.regional_id || "",
      tipo_veiculo: defaults?.tipo_veiculo || "",
      plano: defaults?.plano || "",
      tabela_id: `tab_${Date.now()}`,
    });
    setModalOpen(true);
  };

  const openEdit = (row: TabelaPrecoRow) => {
    setEditingId(row.id);
    setForm({
      plano: row.plano || "",
      regional_id: row.regional_id || "",
      tipo_veiculo: row.tipo_veiculo || "",
      valor_menor: row.valor_menor?.toString() || "",
      valor_maior: row.valor_maior?.toString() || "",
      cota: row.cota?.toString() || "",
      taxa_administrativa: row.taxa_administrativa?.toString() || "",
      adesao: row.adesao?.toString() || "",
      rastreador: row.rastreador || "",
      instalacao: row.instalacao?.toString() || "",
      tipo_franquia: row.tipo_franquia || "",
      valor_franquia: row.valor_franquia?.toString() || "",
      grupo_produto_id: row.grupo_produto_id || "",
      tabela_id: row.tabela_id || "",
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.plano || !form.regional_id || !form.tipo_veiculo) {
      toast.error("Preencha Plano, Regional e Tipo de Veículo");
      return;
    }
    if (!form.valor_menor || !form.valor_maior) {
      toast.error("Preencha os valores da faixa FIPE");
      return;
    }
    // Buscar nome da regional selecionada para popular campo legado
    const regNome = regionaisDb.find((r) => r.id === form.regional_id)?.nome || "";
    const data: Record<string, any> = {
      plano: form.plano,
      regional_id: form.regional_id,
      regional: regNome,
      tipo_veiculo: form.tipo_veiculo,
      valor_menor: parseFloat(form.valor_menor),
      valor_maior: parseFloat(form.valor_maior),
      cota: form.cota ? parseFloat(form.cota) : null,
      taxa_administrativa: form.taxa_administrativa ? parseFloat(form.taxa_administrativa) : null,
      adesao: form.adesao ? parseFloat(form.adesao) : null,
      rastreador: form.rastreador || null,
      instalacao: form.instalacao ? parseFloat(form.instalacao) : null,
      tipo_franquia: form.tipo_franquia || null,
      valor_franquia: form.valor_franquia ? parseFloat(form.valor_franquia) : null,
      grupo_produto_id: form.grupo_produto_id || null,
      tabela_id: form.tabela_id || `tab_${Date.now()}`,
      plano_normalizado: form.plano.toLowerCase().trim(),
      regional_normalizado: regNome.toLowerCase().trim(),
    };
    saveMutation.mutate({ id: editingId || undefined, data });
  };

  const updateForm = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Carregando tabelas de precos...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-destructive">Erro ao carregar tabelas: {(error as Error).message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tabelas de Preços</h3>
          <p className="text-sm text-muted-foreground">
            {rows?.length ?? 0} registros em {grouped.length} combinações regional/veículo
          </p>
        </div>
        <Button onClick={() => openCreate()} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Faixa
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar regional, tipo ou plano..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 border-[#747474]" />
        </div>
        <Select value={filterRegional} onValueChange={setFilterRegional}>
          <SelectTrigger className="w-[220px] border-[#747474]"><SelectValue placeholder="Regional" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as regionais</SelectItem>
            {regionais.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[260px] border-[#747474]"><SelectValue placeholder="Tipo Veículo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {tiposVeiculo.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-[#747474]">
                <TableHead className="w-10"></TableHead>
                <TableHead>Regional</TableHead>
                <TableHead>Tipo Veículo</TableHead>
                <TableHead>Planos</TableHead>
                <TableHead className="text-center">Faixas</TableHead>
                <TableHead className="text-right w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhuma tabela encontrada</TableCell>
                </TableRow>
              )}
              {filtered.map((g) => {
                const key = `${g.regional}||${g.tipo_veiculo}`;
                const isExpanded = expandedKeys.has(key);
                const byPlano = new Map<string, TabelaPrecoRow[]>();
                for (const r of g.rows) {
                  if (!byPlano.has(r.plano)) byPlano.set(r.plano, []);
                  byPlano.get(r.plano)!.push(r);
                }

                return (
                  <Fragment key={key}>
                    <TableRow className="cursor-pointer hover:bg-muted/50 border-b border-[#747474]/30" onClick={() => toggleExpand(key)}>
                      <TableCell>
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell className="font-medium">{g.regional}</TableCell>
                      <TableCell><Badge variant="outline" className="border-[#747474]">{g.tipo_veiculo}</Badge></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {g.planos.map((p) => <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono">{g.faixas}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Editar Tabela Mestre"
                          onClick={() => setMestreOpen({
                            tabelaId: g.rows[0]?.tabela_id || `${g.regional}|${g.tipo_veiculo}`,
                            label: `${g.regional} — ${g.tipo_veiculo}`,
                          })}
                        >
                          <Layers className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Nova Faixa" onClick={() => openCreate({ regional_id: g.rows[0]?.regional_id || "", tipo_veiculo: g.tipo_veiculo })}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0 bg-muted/30">
                          <div className="p-4 space-y-4">
                            {Array.from(byPlano.entries()).map(([plano, items]) => (
                              <div key={plano}>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-semibold text-foreground">{plano}</h4>
                                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => openCreate({ regional_id: g.rows[0]?.regional_id || "", tipo_veiculo: g.tipo_veiculo, plano })}>
                                    <Plus className="h-3 w-3" /> Faixa
                                  </Button>
                                </div>
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="border-b border-[#747474]/50">
                                        <TableHead className="text-xs">Faixa FIPE</TableHead>
                                        <TableHead className="text-xs">Cota</TableHead>
                                        <TableHead className="text-xs">Taxa Adm.</TableHead>
                                        <TableHead className="text-xs">Adesão</TableHead>
                                        <TableHead className="text-xs">Rastreador</TableHead>
                                        <TableHead className="text-xs">Instalação</TableHead>
                                        <TableHead className="text-xs">Franquia</TableHead>
                                        <TableHead className="text-xs text-right">Ações</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {items.map((row) => (
                                        <TableRow key={row.id} className="border-b border-[#747474]/20">
                                          <TableCell className="text-xs font-mono whitespace-nowrap">
                                            {formatCurrency(row.valor_menor)} — {formatCurrency(row.valor_maior)}
                                          </TableCell>
                                          <TableCell className="text-xs">{formatCurrency(row.cota)}</TableCell>
                                          <TableCell className="text-xs">{formatCurrency(row.taxa_administrativa)}</TableCell>
                                          <TableCell className="text-xs">{formatCurrency(row.adesao)}</TableCell>
                                          <TableCell className="text-xs">{row.rastreador || "—"}</TableCell>
                                          <TableCell className="text-xs">{formatCurrency(row.instalacao)}</TableCell>
                                          <TableCell className="text-xs">
                                            {row.tipo_franquia ? `${row.tipo_franquia} ${formatCurrency(row.valor_franquia)}` : "—"}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row)}>
                                              <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ id: row.id, plano: row.plano })}>
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Editar Tabela Mestre */}
      {mestreOpen && (
        <TabelaMestreModal
          open={!!mestreOpen}
          onClose={() => setMestreOpen(null)}
          tabelaId={mestreOpen.tabelaId}
          tabelaLabel={mestreOpen.label}
        />
      )}

      {/* Modal Criar/Editar Faixa */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Faixa de Preço" : "Nova Faixa de Preço"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Regional *</Label>
                <Select value={form.regional_id} onValueChange={(v) => updateForm("regional_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione a regional" /></SelectTrigger>
                  <SelectContent>
                    {regionaisDb.map((r) => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo Veículo *</Label>
                <Select value={form.tipo_veiculo} onValueChange={(v) => updateForm("tipo_veiculo", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_VEICULO.map((t) => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Plano *</Label>
                <Input value={form.plano} onChange={(e) => updateForm("plano", e.target.value)} placeholder="Ex: PLANO COMPLETO" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Grupo de Produto (vínculo)</Label>
                <Select value={form.grupo_produto_id} onValueChange={(v) => updateForm("grupo_produto_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {gruposProdutos.map((g) => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Valor FIPE Menor *</Label>
                <Input type="number" value={form.valor_menor} onChange={(e) => updateForm("valor_menor", e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Valor FIPE Maior *</Label>
                <Input type="number" value={form.valor_maior} onChange={(e) => updateForm("valor_maior", e.target.value)} placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Cota</Label>
                <Input type="number" value={form.cota} onChange={(e) => updateForm("cota", e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Taxa Administrativa</Label>
                <Input type="number" value={form.taxa_administrativa} onChange={(e) => updateForm("taxa_administrativa", e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Adesão</Label>
                <Input type="number" value={form.adesao} onChange={(e) => updateForm("adesao", e.target.value)} placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Rastreador</Label>
                <Input value={form.rastreador} onChange={(e) => updateForm("rastreador", e.target.value)} placeholder="Ex: INCLUSO" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Instalação</Label>
                <Input type="number" value={form.instalacao} onChange={(e) => updateForm("instalacao", e.target.value)} placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo Franquia</Label>
                <Input value={form.tipo_franquia} onChange={(e) => updateForm("tipo_franquia", e.target.value)} placeholder="Ex: REDUZIDA" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Valor Franquia</Label>
                <Input type="number" value={form.valor_franquia} onChange={(e) => updateForm("valor_franquia", e.target.value)} placeholder="0.00" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingId ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir faixa de preço?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta faixa do plano <strong>{deleteTarget?.plano}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
