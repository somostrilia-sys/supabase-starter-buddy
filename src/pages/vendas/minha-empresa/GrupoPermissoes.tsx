import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Users, Loader2, Pencil, Save, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

const gruposDisponiveis = [
  { value: "Consultor", label: "Consultor", descricao: "Pipeline pessoal, cotacoes, metas, landing page", cor: "bg-blue-500/10 text-blue-400" },
  { value: "Gestor", label: "Gestor", descricao: "Equipe da cooperativa, relatorios, metas da unidade, importar leads", cor: "bg-violet-500/10 text-violet-400" },
  { value: "Diretor", label: "Diretor", descricao: "Acesso total, todas cooperativas, config empresa, usuarios", cor: "bg-amber-500/10 text-amber-400" },
];

const contextosDisponiveis = [
  { value: "comercial", label: "Comercial (Consultor)" },
  { value: "gestor_comercial", label: "Gestor Comercial" },
  { value: "diretoria", label: "Diretoria" },
  { value: "administrativo", label: "Administrativo" },
  { value: "cadastro", label: "Cadastro" },
];

export default function GrupoPermissoes() {
  const queryClient = useQueryClient();
  const [editUser, setEditUser] = useState<any>(null);
  const [editGrupo, setEditGrupo] = useState("");
  const [editContexto, setEditContexto] = useState("");

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["permissoes-usuarios"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("usuarios")
        .select("id, nome, email, grupo_permissao, contexto_ia, cooperativa, funcao")
        .eq("ativo", true)
        .order("nome");
      return data || [];
    },
  });

  const savePermissao = useMutation({
    mutationFn: async () => {
      if (!editUser) return;
      await (supabase as any).from("usuarios").update({
        grupo_permissao: editGrupo,
        contexto_ia: editContexto,
      }).eq("id", editUser.id);
    },
    onSuccess: () => {
      toast.success(`Permissoes de ${editUser?.nome} atualizadas`);
      setEditUser(null);
      queryClient.invalidateQueries({ queryKey: ["permissoes-usuarios"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Group by grupo_permissao
  const porGrupo: Record<string, any[]> = {};
  usuarios.forEach((u: any) => {
    const g = u.grupo_permissao || "Sem grupo";
    if (!porGrupo[g]) porGrupo[g] = [];
    porGrupo[g].push(u);
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Permissoes e Acessos</h3>
        <p className="text-sm text-muted-foreground">Gerencie grupo de permissao e contexto IA de cada colaborador ({usuarios.length} ativos)</p>
      </div>

      {gruposDisponiveis.map(grupo => {
        const membros = porGrupo[grupo.value] || [];
        return (
          <Collapsible key={grupo.value} defaultOpen={membros.length <= 30}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <CardTitle className="text-sm">{grupo.label}</CardTitle>
                        <CardDescription className="text-xs">{grupo.descricao}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={grupo.cor}>{membros.length}</Badge>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  {membros.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhum usuario neste grupo</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead className="text-[10px] uppercase">Nome</TableHead>
                          <TableHead className="text-[10px] uppercase">Cooperativa</TableHead>
                          <TableHead className="text-[10px] uppercase">Contexto IA</TableHead>
                          <TableHead className="text-[10px] uppercase w-20">Acoes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {membros.map((u: any) => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6"><AvatarFallback className="text-[9px] bg-white/5">{u.nome?.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}</AvatarFallback></Avatar>
                                <div>
                                  <p className="text-xs font-medium">{u.nome}</p>
                                  <p className="text-[10px] text-muted-foreground">{u.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{u.cooperativa || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">{u.contexto_ia || "comercial"}</Badge>
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => {
                                setEditUser(u);
                                setEditGrupo(u.grupo_permissao || "Consultor");
                                setEditContexto(u.contexto_ia || "comercial");
                              }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}

      {/* Other groups not in standard list */}
      {Object.entries(porGrupo).filter(([g]) => !gruposDisponiveis.some(gd => gd.value === g)).map(([grupo, membros]) => (
        <Card key={grupo}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{grupo}</CardTitle>
              <Badge variant="outline">{membros.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {membros.map((u: any) => u.nome).join(", ")}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Permissoes — {editUser?.nome}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Grupo de Permissao</p>
              <Select value={editGrupo} onValueChange={setEditGrupo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {gruposDisponiveis.map(g => <SelectItem key={g.value} value={g.value}>{g.label} — {g.descricao}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Contexto do Conselheiro IA</p>
              <Select value={editContexto} onValueChange={setEditContexto}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {contextosDisponiveis.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
              <Button onClick={() => savePermissao.mutate()} disabled={savePermissao.isPending}>
                {savePermissao.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
