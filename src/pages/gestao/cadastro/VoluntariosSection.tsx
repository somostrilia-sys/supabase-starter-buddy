import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Search, Plus, Pencil, Trash2, Loader2, Users, Link as LinkIcon, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Voluntario {
  id: string;
  nome: string;
  email: string | null;
  cpf: string | null;
  telefone: string | null;
  whatsapp: string | null;
  ativo: boolean;
  lux_collaborator_id: string | null;
  gia_usuario_id: string | null;
  codigo_voluntario_sga: string | null;
  funcao: string | null;
  regional_id: string | null;
  cooperativa_id: string | null;
  comissao_tipo: string | null;
  comissao_percentual: number | null;
  comissao_valor_fixo: number | null;
  percentual_adesao: number | null;
  created_at: string;
}

const emptyForm: Partial<Voluntario> = {
  nome: "", email: "", cpf: "", telefone: "", whatsapp: "",
  ativo: true, funcao: "", regional_id: null, cooperativa_id: null,
  comissao_tipo: "percentual_adesao", comissao_percentual: null,
  comissao_valor_fixo: null, percentual_adesao: 100,
};

export default function VoluntariosSection() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"todos" | "ativo" | "inativo">("todos");
  const [filterVinculo, setFilterVinculo] = useState<"todos" | "triplo" | "lux_gia" | "lux_sga" | "so_lux" | "so_sga">("todos");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Voluntario>>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const set = (field: string, value: any) => setForm(p => ({ ...p, [field]: value }));

  // Queries
  const { data: voluntarios = [], isLoading } = useQuery({
    queryKey: ["voluntarios"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("voluntarios")
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data || []) as Voluntario[];
    },
  });

  const { data: regionais = [] } = useQuery({
    queryKey: ["regionais-vol"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("regionais").select("id, nome, codigo_numerico").eq("ativo", true).order("codigo_numerico");
      return data || [];
    },
  });

  const { data: cooperativas = [] } = useQuery({
    queryKey: ["coops-vol"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("cooperativas").select("id, nome").order("nome");
      return data || [];
    },
  });

  // Contadores de estatísticas
  const stats = useMemo(() => {
    const total = voluntarios.length;
    const ativos = voluntarios.filter(v => v.ativo).length;
    const triplo = voluntarios.filter(v => v.lux_collaborator_id && v.codigo_voluntario_sga && v.gia_usuario_id).length;
    const comLux = voluntarios.filter(v => v.lux_collaborator_id).length;
    const comSga = voluntarios.filter(v => v.codigo_voluntario_sga).length;
    const comGia = voluntarios.filter(v => v.gia_usuario_id).length;
    return { total, ativos, triplo, comLux, comSga, comGia };
  }, [voluntarios]);

  // Filtros
  const filtered = useMemo(() => {
    return voluntarios.filter(v => {
      if (search) {
        const s = search.toLowerCase();
        const match = v.nome?.toLowerCase().includes(s) ||
                      v.email?.toLowerCase().includes(s) ||
                      v.cpf?.includes(s) ||
                      v.codigo_voluntario_sga?.includes(s);
        if (!match) return false;
      }
      if (filterStatus === "ativo" && !v.ativo) return false;
      if (filterStatus === "inativo" && v.ativo) return false;

      const hasLux = !!v.lux_collaborator_id;
      const hasSga = !!v.codigo_voluntario_sga;
      const hasGia = !!v.gia_usuario_id;
      if (filterVinculo === "triplo" && !(hasLux && hasSga && hasGia)) return false;
      if (filterVinculo === "lux_gia" && !(hasLux && hasGia && !hasSga)) return false;
      if (filterVinculo === "lux_sga" && !(hasLux && hasSga && !hasGia)) return false;
      if (filterVinculo === "so_lux" && !(hasLux && !hasSga && !hasGia)) return false;
      if (filterVinculo === "so_sga" && !(hasSga && !hasLux && !hasGia)) return false;
      return true;
    });
  }, [voluntarios, search, filterStatus, filterVinculo]);

  // Handlers
  const openNew = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (v: Voluntario) => {
    setEditId(v.id);
    setForm({ ...v });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.nome) throw new Error("Nome obrigatório");
      const payload = {
        nome: form.nome,
        email: form.email || null,
        cpf: form.cpf || null,
        telefone: form.telefone || null,
        whatsapp: form.whatsapp || null,
        ativo: form.ativo ?? true,
        funcao: form.funcao || null,
        regional_id: form.regional_id || null,
        cooperativa_id: form.cooperativa_id || null,
        comissao_tipo: form.comissao_tipo || null,
        comissao_percentual: form.comissao_percentual,
        comissao_valor_fixo: form.comissao_valor_fixo,
        percentual_adesao: form.percentual_adesao ?? 100,
        updated_at: new Date().toISOString(),
      };
      if (editId) {
        const { error } = await (supabase as any).from("voluntarios").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("voluntarios").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["voluntarios"] });
      toast.success(editId ? "Voluntário atualizado!" : "Voluntário cadastrado!");
      setModalOpen(false);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar"),
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await (supabase as any).from("voluntarios").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["voluntarios"] });
      toast.success("Status atualizado");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("voluntarios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["voluntarios"] });
      toast.success("Voluntário removido");
      setDeleteId(null);
    },
    onError: (e: any) => {
      toast.error(e.message || "Erro: provavelmente há negociações ou veículos vinculados");
      setDeleteId(null);
    },
  });

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <Card><CardContent className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Total</p>
          <p className="text-xl font-bold">{stats.total}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Ativos</p>
          <p className="text-xl font-bold text-emerald-600">{stats.ativos}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Triplo Vínculo</p>
          <p className="text-xl font-bold text-primary">{stats.triplo}</p>
          <p className="text-[9px] text-muted-foreground">Lux+SGA+Vendas</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Com LuxSales</p>
          <p className="text-xl font-bold">{stats.comLux}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Com SGA</p>
          <p className="text-xl font-bold">{stats.comSga}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Com Vendas</p>
          <p className="text-xl font-bold">{stats.comGia}</p>
        </CardContent></Card>
      </div>

      {/* Header + Filtros */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-base font-bold">Voluntários (Consultores Unificados)</h3>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5"><Plus className="h-4 w-4" /> Novo Voluntário</Button>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Busca</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" placeholder="Nome, email, CPF ou código..." />
            </div>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Vínculos</Label>
            <Select value={filterVinculo} onValueChange={(v: any) => setFilterVinculo(v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="triplo">Triplo (Lux + SGA + Vendas)</SelectItem>
                <SelectItem value="lux_gia">Lux + Vendas</SelectItem>
                <SelectItem value="lux_sga">Lux + SGA</SelectItem>
                <SelectItem value="so_lux">Apenas LuxSales</SelectItem>
                <SelectItem value="so_sga">Apenas SGA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Cód. SGA</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead className="text-center">Vínculos</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(v => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{v.nome}</p>
                        {v.cpf && <p className="text-[10px] text-muted-foreground font-mono">{v.cpf}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {v.email && <div className="text-muted-foreground truncate max-w-[180px]">{v.email}</div>}
                      {v.telefone && <div className="font-mono">{v.telefone}</div>}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{v.codigo_voluntario_sga || "—"}</TableCell>
                    <TableCell className="text-xs">{v.funcao || "—"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1" title="LuxSales · SGA · Vendas GIA">
                        <Badge variant="outline" className={`text-[9px] px-1 ${v.lux_collaborator_id ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-muted text-muted-foreground"}`}>
                          {v.lux_collaborator_id ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Circle className="h-2.5 w-2.5" />} Lux
                        </Badge>
                        <Badge variant="outline" className={`text-[9px] px-1 ${v.codigo_voluntario_sga ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                          {v.codigo_voluntario_sga ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Circle className="h-2.5 w-2.5" />} SGA
                        </Badge>
                        <Badge variant="outline" className={`text-[9px] px-1 ${v.gia_usuario_id ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                          {v.gia_usuario_id ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Circle className="h-2.5 w-2.5" />} Vendas
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {v.comissao_tipo === "percentual_adesao" && v.comissao_percentual != null && (
                        <span className="font-mono">{v.comissao_percentual}% adesão</span>
                      )}
                      {v.comissao_tipo === "valor_fixo" && v.comissao_valor_fixo != null && (
                        <span className="font-mono">R$ {Number(v.comissao_valor_fixo).toFixed(2)}</span>
                      )}
                      {!v.comissao_tipo && <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Switch checked={v.ativo} onCheckedChange={(ativo) => toggleAtivoMutation.mutate({ id: v.id, ativo })} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(v)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(v.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum voluntário encontrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Edit/Create */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Voluntário" : "Novo Voluntário"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Label className="text-xs">Nome Completo *</Label>
                <Input value={form.nome || ""} onChange={e => set("nome", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input type="email" value={form.email || ""} onChange={e => set("email", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">CPF</Label>
                <Input value={form.cpf || ""} onChange={e => set("cpf", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Telefone</Label>
                <Input value={form.telefone || ""} onChange={e => set("telefone", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">WhatsApp</Label>
                <Input value={form.whatsapp || ""} onChange={e => set("whatsapp", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Função</Label>
                <Select value={form.funcao || ""} onValueChange={v => set("funcao", v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultor">Consultor</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="diretor">Diretor</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="voluntario">Voluntário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Regional</Label>
                <Select value={form.regional_id || ""} onValueChange={v => set("regional_id", v || null)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {regionais.map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>{r.codigo_numerico ? `${r.codigo_numerico}. ` : ""}{r.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Cooperativa</Label>
                <Select value={form.cooperativa_id || ""} onValueChange={v => set("cooperativa_id", v || null)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {cooperativas.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Comissão */}
            <div className="pt-3 border-t space-y-3">
              <p className="text-sm font-semibold">Comissão</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tipo de Comissão</Label>
                  <Select value={form.comissao_tipo || ""} onValueChange={v => set("comissao_tipo", v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual_adesao">% sobre adesão</SelectItem>
                      <SelectItem value="valor_fixo">Valor fixo</SelectItem>
                      <SelectItem value="nenhum">Sem comissão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.comissao_tipo === "percentual_adesao" && (
                  <div>
                    <Label className="text-xs">Percentual (%)</Label>
                    <Input type="number" step="0.01" value={form.comissao_percentual || ""} onChange={e => set("comissao_percentual", Number(e.target.value))} />
                  </div>
                )}
                {form.comissao_tipo === "valor_fixo" && (
                  <div>
                    <Label className="text-xs">Valor Fixo (R$)</Label>
                    <Input type="number" step="0.01" value={form.comissao_valor_fixo || ""} onChange={e => set("comissao_valor_fixo", Number(e.target.value))} />
                  </div>
                )}
                <div>
                  <Label className="text-xs">% Repasse Adesão</Label>
                  <Input type="number" step="1" value={form.percentual_adesao || 100} onChange={e => set("percentual_adesao", Number(e.target.value))} />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Split: consultor fica com X%, associação fica com (100-X)%</p>
                </div>
              </div>
            </div>

            {/* Vínculos (read-only) */}
            {editId && (
              <div className="pt-3 border-t space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Vínculos Externos</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200">
                    <p className="font-medium text-blue-900">LuxSales ID</p>
                    <p className="font-mono text-[10px] text-blue-700 break-all">{form.lux_collaborator_id || "—"}</p>
                  </div>
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200">
                    <p className="font-medium text-amber-900">Código SGA</p>
                    <p className="font-mono text-amber-700">{form.codigo_voluntario_sga || "—"}</p>
                  </div>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded border border-emerald-200">
                    <p className="font-medium text-emerald-900">GIA Usuario (Vendas)</p>
                    <p className="font-mono text-[10px] text-emerald-700 break-all">{form.gia_usuario_id || "—"}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-3 border-t">
              <Switch checked={form.ativo ?? true} onCheckedChange={v => set("ativo", v)} />
              <Label className="text-sm">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editId ? "Salvar Alterações" : "Cadastrar Voluntário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Voluntário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Se houver negociações, veículos ou associados vinculados, a remoção falhará (desative ao invés de remover).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
