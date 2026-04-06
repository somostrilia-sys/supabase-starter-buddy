import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Users, Loader2, Plus, Edit, Trash2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface GrupoPermissao {
  id: string;
  nome: string;
  descricao: string | null;
  permissoes: string[];
  ativo: boolean;
  created_at: string;
}

// Lista mestre de permissões disponíveis no sistema
const PERMISSOES_DISPONIVEIS: { key: string; label: string; categoria: string }[] = [
  // Operacional
  { key: "atendimento", label: "Atendimento ao cliente", categoria: "Operacional" },
  { key: "cotacoes", label: "Criar e gerenciar cotações", categoria: "Operacional" },
  { key: "vendas", label: "Registrar vendas", categoria: "Operacional" },
  { key: "pipeline", label: "Visualizar pipeline próprio", categoria: "Operacional" },
  { key: "contatos", label: "Gerenciar contatos", categoria: "Operacional" },
  // Gestão
  { key: "equipe", label: "Gerenciar equipe", categoria: "Gestão" },
  { key: "relatorios", label: "Relatórios de desempenho", categoria: "Gestão" },
  { key: "aprovacoes", label: "Aprovar cotações e vistorias", categoria: "Gestão" },
  { key: "pipeline_equipe", label: "Pipeline da equipe", categoria: "Gestão" },
  { key: "metas", label: "Definir metas da equipe", categoria: "Gestão" },
  { key: "comissoes_equipe", label: "Visualizar comissões da equipe", categoria: "Gestão" },
  // Direção
  { key: "metas_globais", label: "Metas globais", categoria: "Direção" },
  { key: "config_estrategicas", label: "Configurações estratégicas", categoria: "Direção" },
  { key: "relatorios_gerenciais", label: "Relatórios gerenciais", categoria: "Direção" },
  { key: "auditoria", label: "Log de auditoria", categoria: "Direção" },
  { key: "usuarios", label: "Gerenciar todos os usuários", categoria: "Direção" },
  { key: "planos_precos", label: "Tabelas de preços e planos", categoria: "Direção" },
  // Financeiro
  { key: "boletos", label: "Emissão e gestão de boletos", categoria: "Financeiro" },
  { key: "contratos", label: "Contratos de adesão", categoria: "Financeiro" },
  { key: "cadastros", label: "Cadastros gerais", categoria: "Financeiro" },
  { key: "financeiro", label: "Módulo financeiro", categoria: "Financeiro" },
  { key: "conciliacao", label: "Conciliação bancária", categoria: "Financeiro" },
  { key: "notas_fiscais", label: "Notas fiscais", categoria: "Financeiro" },
];

const categorias = [...new Set(PERMISSOES_DISPONIVEIS.map((p) => p.categoria))];

export default function GrupoPermissoes() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [permissoesSel, setPermissoesSel] = useState<string[]>([]);
  const [ativo, setAtivo] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nome: string; userCount: number } | null>(null);

  // Buscar grupos do banco
  const { data: grupos = [], isLoading } = useQuery({
    queryKey: ["grupo_permissoes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("grupo_permissoes")
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data || []).map((g: any) => ({
        ...g,
        permissoes: Array.isArray(g.permissoes) ? g.permissoes : JSON.parse(g.permissoes || "[]"),
      })) as GrupoPermissao[];
    },
  });

  // Contar usuários por grupo
  const { data: usuariosPorGrupo = new Map() } = useQuery({
    queryKey: ["usuarios_grupo_count"],
    queryFn: async () => {
      const { data, error } = await supabase.from("usuarios").select("grupo_permissao");
      if (error) throw error;
      const contagem = new Map<string, number>();
      (data || []).forEach((u: any) => {
        const g = (u.grupo_permissao || "").toLowerCase();
        contagem.set(g, (contagem.get(g) || 0) + 1);
      });
      return contagem;
    },
  });

  const getUserCount = (nomeGrupo: string) => {
    return usuariosPorGrupo.get(nomeGrupo.toLowerCase()) || 0;
  };

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (payload: { id?: string; nome: string; descricao: string; permissoes: string[]; ativo: boolean }) => {
      const row = {
        nome: payload.nome,
        descricao: payload.descricao || null,
        permissoes: JSON.stringify(payload.permissoes),
        ativo: payload.ativo,
      };
      if (payload.id) {
        const { error } = await (supabase as any).from("grupo_permissoes").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("grupo_permissoes").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupo_permissoes"] });
      toast.success(editingId ? "Grupo atualizado!" : "Grupo criado!");
      setModalOpen(false);
    },
    onError: (e: any) => {
      if (e.message?.includes("duplicate") || e.code === "23505") {
        toast.error("Já existe um grupo com esse nome");
      } else {
        toast.error(e.message || "Erro ao salvar grupo");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("grupo_permissoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupo_permissoes"] });
      toast.success("Grupo excluído!");
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao excluir grupo"),
  });

  const openCreate = () => {
    setEditingId(null);
    setNome("");
    setDescricao("");
    setPermissoesSel([]);
    setAtivo(true);
    setModalOpen(true);
  };

  const openEdit = (g: GrupoPermissao) => {
    setEditingId(g.id);
    setNome(g.nome);
    setDescricao(g.descricao || "");
    setPermissoesSel([...g.permissoes]);
    setAtivo(g.ativo);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!nome.trim()) { toast.error("Preencha o nome do grupo"); return; }
    saveMutation.mutate({
      id: editingId || undefined,
      nome: nome.trim(),
      descricao: descricao.trim(),
      permissoes: permissoesSel,
      ativo,
    });
  };

  const togglePermissao = (key: string) => {
    setPermissoesSel((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const toggleCategoria = (cat: string) => {
    const keysInCat = PERMISSOES_DISPONIVEIS.filter((p) => p.categoria === cat).map((p) => p.key);
    const allSelected = keysInCat.every((k) => permissoesSel.includes(k));
    if (allSelected) {
      setPermissoesSel((prev) => prev.filter((p) => !keysInCat.includes(p)));
    } else {
      setPermissoesSel((prev) => [...new Set([...prev, ...keysInCat])]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando grupos...</span>
      </div>
    );
  }

  const totalUsuarios = Array.from(usuariosPorGrupo.values()).reduce((sum, c) => sum + c, 0);

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Grupos de Permissões</CardTitle>
              <CardDescription>
                Gerencie os perfis de acesso do sistema ({totalUsuarios} usuários total)
              </CardDescription>
            </div>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Novo Grupo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {grupos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum grupo de permissão cadastrado.
            </p>
          ) : (
            grupos.map((grupo) => {
              const userCount = getUserCount(grupo.nome);
              return (
                <div
                  key={grupo.id}
                  className="flex flex-col gap-3 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{grupo.nome}</p>
                          {!grupo.ativo && (
                            <Badge variant="secondary" className="text-[10px]">Inativo</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {grupo.descricao || "Sem descrição"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <Users className="h-3 w-3" />
                        {userCount} usuário{userCount !== 1 ? "s" : ""}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(grupo)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteTarget({ id: grupo.id, nome: grupo.nome, userCount })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="ml-14 flex flex-wrap gap-1.5">
                    {grupo.permissoes.length === 0 ? (
                      <span className="text-[10px] text-muted-foreground">Nenhuma permissão configurada</span>
                    ) : (
                      grupo.permissoes.map((perm) => {
                        const info = PERMISSOES_DISPONIVEIS.find((p) => p.key === perm);
                        return (
                          <span key={perm} className="text-[10px] bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="h-2.5 w-2.5 text-emerald-500" />
                            {info?.label || perm}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Modal Criar/Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Grupo de Permissão" : "Novo Grupo de Permissão"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome do Grupo *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Supervisor" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Acesso intermediário com aprovações" />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-xs text-muted-foreground">{ativo ? "Grupo ativo" : "Grupo inativo"}</p>
              </div>
              <Switch checked={ativo} onCheckedChange={setAtivo} />
            </div>

            <div className="space-y-3">
              <Label>Permissões</Label>
              <p className="text-xs text-muted-foreground">{permissoesSel.length} permissões selecionadas</p>

              {categorias.map((cat) => {
                const permsInCat = PERMISSOES_DISPONIVEIS.filter((p) => p.categoria === cat);
                const allSelected = permsInCat.every((p) => permissoesSel.includes(p.key));
                const someSelected = permsInCat.some((p) => permissoesSel.includes(p.key));
                return (
                  <div key={cat} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={allSelected}
                        // @ts-ignore
                        indeterminate={someSelected && !allSelected}
                        onCheckedChange={() => toggleCategoria(cat)}
                      />
                      <span className="text-sm font-medium">{cat}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {permsInCat.filter((p) => permissoesSel.includes(p.key)).length}/{permsInCat.length}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 ml-6">
                      {permsInCat.map((perm) => (
                        <div key={perm.key} className="flex items-center gap-2">
                          <Checkbox
                            checked={permissoesSel.includes(perm.key)}
                            onCheckedChange={() => togglePermissao(perm.key)}
                          />
                          <span className="text-xs">{perm.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
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
            <AlertDialogTitle>Excluir grupo "{deleteTarget?.nome}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && deleteTarget.userCount > 0 ? (
                <>
                  <span className="text-destructive font-medium">
                    Atenção: {deleteTarget.userCount} usuário(s) estão vinculados a este grupo.
                  </span>{" "}
                  Eles ficarão sem grupo de permissão. Deseja continuar?
                </>
              ) : (
                "Esta ação não pode ser desfeita."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
