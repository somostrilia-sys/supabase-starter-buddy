import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Loader2, ChevronDown, ChevronRight, ListChecks } from "lucide-react";
import { toast } from "sonner";

interface Opcional {
  id: string;
  nome: string;
  categoria: string | null;
  valor_mensal: number | null;
  tipo_veiculo: string | null;
  ativo: boolean;
}

type FormData = {
  nome: string;
  categoria: string;
  nova_categoria: string;
  valor_mensal: string;
  tipo_veiculo: string;
  ativo: boolean;
};

const TIPOS_VEICULO = ["todos", "leves", "motos", "pesados"];

const emptyForm: FormData = {
  nome: "",
  categoria: "",
  nova_categoria: "",
  valor_mensal: "",
  tipo_veiculo: "todos",
  ativo: true,
};

export default function OpcionaisCatalogoTab() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: opcionais = [], isLoading } = useQuery<Opcional[]>({
    queryKey: ["opcionais_catalogo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opcionais_catalogo" as any)
        .select("id, nome, categoria, valor_mensal, tipo_veiculo, ativo")
        .order("categoria")
        .order("nome");
      if (error) throw error;
      return (data || []) as any as Opcional[];
    },
  });

  const categorias = useMemo(() => {
    const cats = [...new Set(opcionais.map((o) => o.categoria || "Sem Categoria"))];
    cats.sort();
    return cats;
  }, [opcionais]);

  const grouped = useMemo(() => {
    const map = new Map<string, Opcional[]>();
    for (const o of opcionais) {
      const cat = o.categoria || "Sem Categoria";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(o);
    }
    return map;
  }, [opcionais]);

  // Expand all by default when data loads
  useMemo(() => {
    if (categorias.length > 0 && expandedCats.size === 0) {
      setExpandedCats(new Set(categorias));
    }
  }, [categorias]);

  const createMutation = useMutation({
    mutationFn: async (payload: { nome: string; categoria: string; valor_mensal: number | null; tipo_veiculo: string; ativo: boolean }) => {
      const { error } = await supabase.from("opcionais_catalogo" as any).insert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opcionais_catalogo"] });
      toast.success("Opcional criado com sucesso");
    },
    onError: () => toast.error("Erro ao criar opcional"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; nome: string; categoria: string; valor_mensal: number | null; tipo_veiculo: string; ativo: boolean }) => {
      const { error } = await supabase.from("opcionais_catalogo" as any).update(payload as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opcionais_catalogo"] });
      toast.success("Opcional atualizado");
    },
    onError: () => toast.error("Erro ao atualizar opcional"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("opcionais_catalogo" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opcionais_catalogo"] });
      toast.success("Opcional removido");
    },
    onError: () => toast.error("Erro ao remover opcional"),
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("opcionais_catalogo" as any).update({ ativo } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opcionais_catalogo"] });
    },
    onError: () => toast.error("Erro ao alterar status"),
  });

  function toggleCat(cat: string) {
    setExpandedCats((prev) => {
      const n = new Set(prev);
      n.has(cat) ? n.delete(cat) : n.add(cat);
      return n;
    });
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(o: Opcional) {
    setEditingId(o.id);
    setForm({
      nome: o.nome,
      categoria: o.categoria || "",
      nova_categoria: "",
      valor_mensal: o.valor_mensal != null ? String(o.valor_mensal) : "",
      tipo_veiculo: o.tipo_veiculo || "todos",
      ativo: o.ativo,
    });
    setModalOpen(true);
  }

  function handleSave() {
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    const categoria = form.nova_categoria.trim() || form.categoria || "Geral";
    const valor_mensal = form.valor_mensal ? parseFloat(form.valor_mensal) : null;
    const payload = {
      nome: form.nome.trim(),
      categoria,
      valor_mensal,
      tipo_veiculo: form.tipo_veiculo,
      ativo: form.ativo,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id);
    setDeleteConfirm(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando opcionais...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1A3A5C]">Opcionais do Catálogo</h3>
          <p className="text-xs text-muted-foreground">
            {opcionais.length} opcionais em {categorias.length} categorias
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 rounded-none">
          <Plus className="h-4 w-4" /> Novo Opcional
        </Button>
      </div>

      {opcionais.length === 0 ? (
        <Card className="rounded-none">
          <CardContent className="py-12 text-center">
            <ListChecks className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum opcional cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {categorias.map((cat) => {
            const items = grouped.get(cat) || [];
            const isExpanded = expandedCats.has(cat);
            const ativos = items.filter((i) => i.ativo).length;
            return (
              <Card key={cat} className="rounded-none">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleCat(cat)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium text-[#1A3A5C]">{cat}</span>
                    <Badge variant="outline" className="rounded-none text-xs">
                      {items.length} {items.length === 1 ? "item" : "itens"}
                    </Badge>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-success/20 rounded-none text-xs">
                      {ativos} {ativos === 1 ? "ativo" : "ativos"}
                    </Badge>
                  </div>
                </div>
                {isExpanded && (
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Nome</TableHead>
                          <TableHead className="text-xs">Valor Mensal</TableHead>
                          <TableHead className="text-xs">Tipo Veículo</TableHead>
                          <TableHead className="text-xs text-center">Ativo</TableHead>
                          <TableHead className="text-xs text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((o) => (
                          <TableRow key={o.id}>
                            <TableCell className="text-sm font-medium">{o.nome}</TableCell>
                            <TableCell className="text-sm">
                              {o.valor_mensal != null
                                ? `R$ ${o.valor_mensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-sm capitalize">{o.tipo_veiculo || "todos"}</TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={o.ativo}
                                onCheckedChange={(v) => toggleAtivoMutation.mutate({ id: o.id, ativo: v })}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(o)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteConfirm(o.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setEditingId(null);
            setForm(emptyForm);
          }
        }}
      >
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="text-[#1A3A5C]">
              {editingId ? "Editar Opcional" : "Novo Opcional"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                className="rounded-none"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Carro Reserva"
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.categoria}
                onValueChange={(v) => setForm((f) => ({ ...f, categoria: v, nova_categoria: "" }))}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Selecione ou crie nova" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__nova__">+ Nova categoria</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.categoria === "__nova__" && (
                <Input
                  className="rounded-none mt-2"
                  placeholder="Nome da nova categoria"
                  value={form.nova_categoria}
                  onChange={(e) => setForm((f) => ({ ...f, nova_categoria: e.target.value }))}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Valor Mensal (R$)</Label>
              <Input
                className="rounded-none"
                type="number"
                step="0.01"
                min="0"
                value={form.valor_mensal}
                onChange={(e) => setForm((f) => ({ ...f, valor_mensal: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Veículo</Label>
              <Select
                value={form.tipo_veiculo}
                onValueChange={(v) => setForm((f) => ({ ...f, tipo_veiculo: v }))}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_VEICULO.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.ativo}
                onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))}
              />
              <Label>{form.ativo ? "Ativo" : "Inativo"}</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="rounded-none" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button className="rounded-none" onClick={handleSave}>
                {editingId ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="text-[#1A3A5C]">Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Tem certeza que deseja remover este opcional? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="rounded-none" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="rounded-none"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Remover
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
