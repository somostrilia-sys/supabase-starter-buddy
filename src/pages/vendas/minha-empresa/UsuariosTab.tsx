import { useState, useMemo } from "react";
import { Plus, Edit, Trash2, Users, Search, Shield, ChevronDown, ChevronUp, Info, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// ── Types ──

interface ComissaoRegra {
  tipo: string; // "venda_nova" | "renovacao" | "indicacao"
  percentual: string;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  unidade: string;        // mapped from cooperativa
  cargo: string;          // mapped from funcao
  gestorResponsavel: string; // mapped from gerente
  grupoPermissao: string; // mapped from grupo_permissao
  comissoes: ComissaoRegra[];
  telefone: string;       // mapped from celular
  status: "ativo" | "inativo";
}

// ── Permission Groups (loaded from DB) ──

interface GrupoPermissaoDb {
  id: string;
  nome: string;
  descricao: string | null;
  permissoes: string[];
  ativo: boolean;
}

interface GrupoPermissao {
  id: string;
  label: string;
  descricao: string;
  badgeColor: string;
  permissoes: { key: string; label: string }[];
}

const BADGE_COLORS: Record<string, string> = {
  consultor: "bg-primary/8 text-primary",
  gestor: "bg-warning/10 text-warning",
  diretor: "bg-accent/8 text-accent",
  administrativo: "bg-success/10 text-success",
};

function dbToGrupo(g: GrupoPermissaoDb): GrupoPermissao {
  const idNorm = g.nome.toLowerCase();
  return {
    id: idNorm,
    label: g.nome,
    descricao: g.descricao || "Grupo personalizado",
    badgeColor: BADGE_COLORS[idNorm] || "bg-muted text-muted-foreground",
    permissoes: (Array.isArray(g.permissoes) ? g.permissoes : []).map((k) => ({ key: k, label: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) })),
  };
}

// ── Static Options ──

const unidades = ["Matriz São Paulo", "Filial Sul", "Filial Norte", "Filial Nordeste", "Filial Centro-Oeste"];
const cargos = ["Consultor", "Gestor", "Diretor", "Administrativo", "Vistoriador", "Financeiro"];

const emptyForm: Omit<Usuario, "id"> = {
  nome: "", email: "", cpf: "", unidade: "", cargo: "", gestorResponsavel: "",
  grupoPermissao: "", comissoes: [{ tipo: "venda_nova", percentual: "" }], telefone: "", status: "ativo",
};

const tiposComissao = [
  { value: "venda_nova", label: "Venda nova" },
  { value: "renovacao", label: "Renovação" },
  { value: "indicacao", label: "Indicação" },
];

// ── Helpers ──

function mapDbToUsuario(row: any): Usuario {
  return {
    id: row.id,
    nome: row.nome ?? "",
    email: row.email ?? "",
    cpf: row.cpf ?? "",
    unidade: row.cooperativa ?? "",
    cargo: row.funcao ?? "",
    gestorResponsavel: row.gerente ?? "",
    grupoPermissao: row.grupo_permissao ?? "",
    comissoes: row.comissao_pct
      ? [{ tipo: "venda_nova", percentual: String(row.comissao_pct) }]
      : [],
    telefone: row.celular ?? "",
    status: (row.status === "ativo" ? "ativo" : "inativo") as "ativo" | "inativo",
  };
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

// ── Data fetching ──

async function fetchUsuarios(): Promise<Usuario[]> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .order("nome", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapDbToUsuario);
}

// ── Component ──

export default function UsuariosTab() {
  const queryClient = useQueryClient();

  const { data: usuarios = [], isLoading, isError } = useQuery({
    queryKey: ["usuarios"],
    queryFn: fetchUsuarios,
  });

  // Buscar grupos de permissão do banco
  const { data: gruposPermissao = [] } = useQuery({
    queryKey: ["grupo_permissoes_usuarios"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("grupo_permissoes")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return (data || []).map((g: any) => dbToGrupo({
        ...g,
        permissoes: Array.isArray(g.permissoes) ? g.permissoes : JSON.parse(g.permissoes || "[]"),
      })) as GrupoPermissao[];
    },
  });

  const getGrupoConfig = (id: string) => gruposPermissao.find(g => g.id === id);

  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Usuario, "id">>(emptyForm);
  const [showPermissoes, setShowPermissoes] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = usuarios.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.cpf.includes(search)
  );

  const gestoresDisponiveis = usuarios.filter(u => u.status === "ativo" && u.id !== editingId);

  const openCreate = () => {
    setForm({ ...emptyForm, comissoes: [{ tipo: "venda_nova", percentual: "" }] });
    setEditingId(null);
    setShowPermissoes(false);
    setSheetOpen(true);
  };

  const openEdit = (u: Usuario) => {
    const { id, ...rest } = u;
    setForm({ ...rest, comissoes: rest.comissoes.length ? rest.comissoes : [{ tipo: "venda_nova", percentual: "" }] });
    setEditingId(id);
    setShowPermissoes(false);
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim() || !form.email.trim() || !form.cpf.trim()) {
      toast.error("Preencha Nome, E-mail e CPF");
      return;
    }
    if (!form.unidade) { toast.error("Selecione a Unidade"); return; }
    if (!form.cargo) { toast.error("Selecione o Cargo/Função"); return; }
    if (!form.grupoPermissao) { toast.error("Selecione o Grupo de Permissão"); return; }

    setSaving(true);

    // Build the main comissao_pct from first commission rule (if any)
    const mainComissao = form.comissoes.length > 0 && form.comissoes[0].percentual
      ? parseFloat(form.comissoes[0].percentual)
      : null;

    const payload = {
      nome: form.nome.trim(),
      email: form.email.trim(),
      cpf: form.cpf.trim(),
      celular: form.telefone.trim() || null,
      cooperativa: form.unidade,
      funcao: form.cargo,
      gerente: form.gestorResponsavel === "nenhum" ? null : (form.gestorResponsavel || null),
      grupo_permissao: form.grupoPermissao,
      comissao_pct: mainComissao,
      status: form.status,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("usuarios")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Usuário atualizado com sucesso");
      } else {
        const { error } = await supabase
          .from("usuarios")
          .insert(payload);
        if (error) throw error;
        toast.success("Usuário criado com sucesso");
      }
      await queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setSheetOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar usuário");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("usuarios")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(error.message ?? "Erro ao excluir usuário");
      return;
    }
    toast.success("Usuário excluído");
    await queryClient.invalidateQueries({ queryKey: ["usuarios"] });
  };

  const updateForm = (field: keyof Omit<Usuario, "id">, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addComissao = () => {
    setForm(prev => ({ ...prev, comissoes: [...prev.comissoes, { tipo: "venda_nova", percentual: "" }] }));
  };

  const removeComissao = (idx: number) => {
    setForm(prev => ({ ...prev, comissoes: prev.comissoes.filter((_, i) => i !== idx) }));
  };

  const updateComissao = (idx: number, field: keyof ComissaoRegra, value: string) => {
    setForm(prev => ({
      ...prev,
      comissoes: prev.comissoes.map((c, i) => i === idx ? { ...c, [field]: value } : c),
    }));
  };

  const grupoSelecionado = getGrupoConfig(form.grupoPermissao);

  return (
    <div className="space-y-4">
      {/* ── Permission Groups Overview ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 cursor-pointer" onClick={() => setShowPermissoes(!showPermissoes)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Grupos de Permissão</CardTitle>
            </div>
            {showPermissoes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        {showPermissoes && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {gruposPermissao.map(g => (
                <div key={g.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`${g.badgeColor} border-0`}>{g.label}</Badge>
                    <span className="text-xs text-muted-foreground">{g.descricao}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.permissoes.map(p => (
                      <span key={p.key} className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{p.label}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── Users Table ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Usuários
            </CardTitle>
            <CardDescription>Gerencie os usuários e permissões da empresa</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, e-mail ou CPF..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Button size="sm" className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Novo Usuário</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Carregando usuários...</span>
            </div>
          ) : isError ? (
            <div className="text-center text-destructive py-8">Erro ao carregar usuários. Tente novamente.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Permissão</TableHead>
                  <TableHead>Gestor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const gc = getGrupoConfig(u.grupoPermissao);
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nome}</TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell className="font-mono text-sm">{u.cpf}</TableCell>
                      <TableCell className="text-sm">{u.unidade}</TableCell>
                      <TableCell className="text-sm">{u.cargo}</TableCell>
                      <TableCell>
                        <Badge className={`border-0 ${gc?.badgeColor ?? "bg-muted"}`}>{gc?.label ?? u.grupoPermissao}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{u.gestorResponsavel || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={u.status === "ativo" ? "default" : "secondary"}>{u.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(u.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Create/Edit Sheet ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? "Editar Usuário" : "Novo Usuário"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados Pessoais</p>
            <FormField label="Nome Completo *">
              <Input value={form.nome} onChange={e => updateForm("nome", e.target.value)} placeholder="Nome completo do usuário" />
            </FormField>
            <FormField label="E-mail *">
              <Input type="email" value={form.email} onChange={e => updateForm("email", e.target.value)} placeholder="email@empresa.com" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="CPF *">
                <Input value={form.cpf} onChange={e => updateForm("cpf", e.target.value)} placeholder="000.000.000-00" />
              </FormField>
              <FormField label="Telefone">
                <Input value={form.telefone} onChange={e => updateForm("telefone", e.target.value)} placeholder="(00) 00000-0000" />
              </FormField>
            </div>

            <Separator />

            {/* Organization */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organização</p>
            <FormField label="Unidade *">
              <Select value={form.unidade} onValueChange={v => updateForm("unidade", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                <SelectContent>{unidades.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Cargo / Função *">
              <Select value={form.cargo} onValueChange={v => updateForm("cargo", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                <SelectContent>{cargos.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Gestor Responsável">
              <Select value={form.gestorResponsavel} onValueChange={v => updateForm("gestorResponsavel", v)}>
                <SelectTrigger><SelectValue placeholder="Quem está acima na hierarquia" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum (topo da hierarquia)</SelectItem>
                  {gestoresDisponiveis.map(g => <SelectItem key={g.id} value={g.nome}>{g.nome} — {g.cargo}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>

            <Separator />

            {/* Permissions */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permissões</p>
            <FormField label="Grupo de Permissão *">
              <Select value={form.grupoPermissao} onValueChange={v => updateForm("grupoPermissao", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o grupo" /></SelectTrigger>
                <SelectContent>
                  {gruposPermissao.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      <span className="flex items-center gap-2">
                        <span>{g.label}</span>
                        <span className="text-xs text-muted-foreground">— {g.descricao}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            {grupoSelecionado && (
              <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">Permissões do grupo {grupoSelecionado.label}:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {grupoSelecionado.permissoes.map(p => (
                    <span key={p.key} className="text-[10px] bg-background border px-2 py-0.5 rounded-full">{p.label}</span>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Commission */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comissionamento</p>
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addComissao}>
                <Plus className="h-3 w-3" /> Regra
              </Button>
            </div>
            {form.comissoes.map((c, idx) => (
              <div key={idx} className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-[10px] text-muted-foreground">Tipo</Label>
                  <Select value={c.tipo} onValueChange={v => updateComissao(idx, "tipo", v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{tiposComissao.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Label className="text-[10px] text-muted-foreground">% Comissão</Label>
                  <Input className="h-9" type="number" min="0" max="100" value={c.percentual} onChange={e => updateComissao(idx, "percentual", e.target.value)} placeholder="0" />
                </div>
                {form.comissoes.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeComissao(idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}

            <Separator />

            {/* Status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Status do usuário</p>
                <p className="text-xs text-muted-foreground">{form.status === "ativo" ? "Usuário ativo no sistema" : "Usuário desativado"}</p>
              </div>
              <Switch
                checked={form.status === "ativo"}
                onCheckedChange={v => updateForm("status", v ? "ativo" : "inativo")}
              />
            </div>
          </div>

          <SheetFooter className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? "Salvar Alterações" : "Criar Usuário"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
