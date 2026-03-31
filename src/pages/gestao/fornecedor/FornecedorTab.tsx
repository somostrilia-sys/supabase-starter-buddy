import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Truck, Plus, Search, Download, RefreshCw, Clock, BarChart3,
  CheckCircle2, XCircle, AlertTriangle, FileText, Settings, Loader2,
  Building2, Car, Users, Activity, Calendar, ChevronRight, Pencil, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ── Types ──
interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string | null;
  contato: string | null;
  email: string | null;
  telefone: string | null;
  tipo: string | null;
  api_url: string | null;
  api_token: string | null;
  sync_config: Record<string, unknown> | null;
  sync_interval: string | null;
  last_sync_at: string | null;
  sync_status: string | null;
  ativo: boolean | null;
  updated_at: string | null;
}

interface SyncLogEntry {
  id: string;
  data: string;
  fornecedor: string;
  tipo: string;
  status: "sucesso" | "erro" | "pendente";
}

const tiposServico = ["Guincho", "Rastreador", "Vidros", "Oficina", "Assistência", "Peças", "Elétrica", "Funilaria"];

const statusColor: Record<string, string> = {
  ativo: "bg-success/10 text-success dark:bg-green-900 dark:text-green-300",
  inativo: "bg-destructive/8 text-destructive dark:bg-red-900 dark:text-red-300",
  sucesso: "bg-success/10 text-success dark:bg-green-900 dark:text-green-300",
  erro: "bg-destructive/8 text-destructive dark:bg-red-900 dark:text-red-300",
  pendente: "bg-warning/10 text-warning dark:bg-yellow-900 dark:text-yellow-300",
};

const emptyForm = { nome: "", cnpj: "", tipo: "Guincho", telefone: "", email: "", contato: "", observacoes: "" };

export default function FornecedorTab() {
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [showCadastro, setShowCadastro] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  // ── Fetch fornecedores ──
  const fetchFornecedores = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fornecedores_gia")
      .select("*")
      .order("nome");
    if (error) {
      toast.error("Erro ao carregar fornecedores: " + error.message);
    } else {
      setFornecedores((data as Fornecedor[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFornecedores();
  }, [fetchFornecedores]);

  // ── Derived sync log from fornecedores ──
  const logSync: SyncLogEntry[] = fornecedores
    .filter((f) => f.last_sync_at)
    .map((f) => ({
      id: f.id,
      data: f.last_sync_at ? new Date(f.last_sync_at).toLocaleString("pt-BR") : "-",
      fornecedor: f.nome,
      tipo: "Automático",
      status: (f.sync_status === "success" ? "sucesso" : f.sync_status === "error" ? "erro" : "pendente") as SyncLogEntry["status"],
    }))
    .sort((a, b) => b.data.localeCompare(a.data));

  // ── Filtering ──
  const filtered = fornecedores.filter((f) => {
    const status = f.ativo ? "ativo" : "inativo";
    if (filtroTipo !== "todos" && f.tipo !== filtroTipo) return false;
    if (filtroStatus !== "todos" && status !== filtroStatus) return false;
    if (busca && !f.nome.toLowerCase().includes(busca.toLowerCase()) && !(f.cnpj ?? "").includes(busca)) return false;
    return true;
  });

  const ativos = fornecedores.filter((f) => f.ativo).length;

  // ── Sync via Edge Function ──
  const handleSync = async () => {
    setSincronizando(true);
    setProgresso(10);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      setProgresso(30);
      const res = await fetch(`${supabaseUrl}/functions/v1/sync-fornecedores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({}),
      });
      setProgresso(70);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }
      setProgresso(100);
      toast.success("Sincronismo concluído");
      await fetchFornecedores();
    } catch (err: any) {
      toast.error("Erro no sincronismo: " + (err.message ?? "Erro desconhecido"));
    } finally {
      setSincronizando(false);
    }
  };

  // ── Save (Insert or Update) ──
  const handleSalvar = async () => {
    if (!form.nome || !form.cnpj) {
      toast.error("Nome e CNPJ obrigatórios");
      return;
    }
    setSaving(true);
    const payload = {
      nome: form.nome,
      cnpj: form.cnpj,
      tipo: form.tipo,
      telefone: form.telefone || null,
      email: form.email || null,
      contato: form.contato || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("fornecedores_gia")
        .update(payload)
        .eq("id", editingId);
      if (error) {
        toast.error("Erro ao atualizar: " + error.message);
      } else {
        toast.success("Fornecedor atualizado com sucesso");
        setShowCadastro(false);
        setForm(emptyForm);
        setEditingId(null);
        await fetchFornecedores();
      }
    } else {
      const { error } = await supabase
        .from("fornecedores_gia")
        .insert({ ...payload, ativo: true });
      if (error) {
        toast.error("Erro ao cadastrar: " + error.message);
      } else {
        toast.success("Fornecedor cadastrado com sucesso");
        setShowCadastro(false);
        setForm(emptyForm);
        await fetchFornecedores();
      }
    }
    setSaving(false);
  };

  // ── Edit ──
  const handleEdit = (f: Fornecedor) => {
    setEditingId(f.id);
    setForm({
      nome: f.nome,
      cnpj: f.cnpj ?? "",
      tipo: f.tipo ?? "Guincho",
      telefone: f.telefone ?? "",
      email: f.email ?? "",
      contato: f.contato ?? "",
      observacoes: "",
    });
    setShowCadastro(true);
  };

  // ── Delete ──
  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("fornecedores_gia")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Erro ao excluir: " + error.message);
    } else {
      toast.success("Fornecedor excluído");
      await fetchFornecedores();
    }
    setShowConfirmDelete(null);
  };

  // ── Export CSV ──
  const exportCsv = () => {
    const header = "ID;Nome;CNPJ;Tipo;Status;Telefone;Email\n";
    const rows = filtered
      .map((f) => `${f.id};${f.nome};${f.cnpj ?? ""};${f.tipo ?? ""};${f.ativo ? "ativo" : "inativo"};${f.telefone ?? ""};${f.email ?? ""}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "fornecedores.csv";
    a.click();
    toast.success("Relatório exportado");
  };

  return (
    <div className="p-6 lg:px-8 space-y-6">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md">
            <Truck className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Fornecedores</h2>
            <p className="text-sm text-muted-foreground">Cadastro, sincronismo e análises de fornecedores</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={sincronizando} className="gap-1.5">
            <RefreshCw className={`h-4 w-4 ${sincronizando ? "animate-spin" : ""}`} />Sincronizar
          </Button>
          <Button size="sm" onClick={() => { setEditingId(null); setForm(emptyForm); setShowCadastro(true); }} className="gap-1.5 bg-primary hover:bg-primary/90 text-white">
            <Plus className="h-4 w-4" />Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* ── PROGRESS BAR ── */}
      {sincronizando && (
        <Card className="border-border bg-muted/50">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-foreground" />
              <span className="text-sm font-medium text-foreground">Sincronizando fornecedores...</span>
            </div>
            <Progress value={progresso} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* ── LOADING STATE ── */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Carregando fornecedores...</span>
        </div>
      )}

      {/* ── TABS ── */}
      {!loading && (
        <Tabs defaultValue="listagem">
          <TabsList>
            <TabsTrigger value="listagem" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />Listagem
            </TabsTrigger>
            <TabsTrigger value="sincronismo" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />Sincronismo
            </TabsTrigger>
            <TabsTrigger value="log" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />Log
            </TabsTrigger>
            <TabsTrigger value="relatorio" className="gap-1.5">
              <Download className="h-3.5 w-3.5" />Relatório
            </TabsTrigger>
          </TabsList>

          {/* ── LISTAGEM ── */}
          <TabsContent value="listagem" className="space-y-4 mt-4">
            {/* Filtros */}
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="grid sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <Label className="text-xs font-medium text-foreground">Buscar</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9 border-border focus-visible:ring-ring" placeholder="Nome ou CNPJ..." value={busca} onChange={e => setBusca(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-foreground">Tipo de Serviço</Label>
                    <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                      <SelectTrigger className="mt-1 border-border"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="todos">Todos</SelectItem>{tiposServico.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-foreground">Status</Label>
                    <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                      <SelectTrigger className="mt-1 border-border"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5 border-border hover:bg-muted/50">
                    <Download className="h-4 w-4" />Exportar CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabela */}
            <Card className="border-border overflow-hidden">

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary border-b-0">
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Nome</TableHead>
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">CNPJ</TableHead>
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Tipo</TableHead>
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Contato</TableHead>
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Email</TableHead>
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhum fornecedor encontrado
                        </TableCell>
                      </TableRow>
                    )}
                    {filtered.map((f, i) => (
                      <TableRow key={f.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'} hover:bg-muted/40 transition-colors border-b-2 border-[#747474]`}>
                        <TableCell className="font-medium text-foreground">{f.nome}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{f.cnpj ?? "-"}</TableCell>
                        <TableCell><Badge variant="outline" className="border-primary/30 text-foreground bg-primary/8">{f.tipo ?? "-"}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{f.telefone ?? "-"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{f.email ?? "-"}</TableCell>
                        <TableCell><Badge className={statusColor[f.ativo ? "ativo" : "inativo"]}>{f.ativo ? "ativo" : "inativo"}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(f)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setShowConfirmDelete(f.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="px-4 py-3 bg-muted/30 border-t-2 border-[#747474] flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{filtered.length} fornecedor(es) encontrado(s)</span>
                  <span className="text-xs text-muted-foreground">Total geral: {fornecedores.length}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── SINCRONISMO ── */}
          <TabsContent value="sincronismo" className="space-y-5 mt-4">
            {/* Stat Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="border-border overflow-hidden">

                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md">
                    <Building2 className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{ativos}</p>
                    <p className="text-xs text-muted-foreground font-medium">Fornecedores ativos</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border overflow-hidden">

                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md">
                    <Activity className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{logSync.filter(l => l.status === "sucesso").length}</p>
                    <p className="text-xs text-muted-foreground font-medium">Últimos syncs com sucesso</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border overflow-hidden">

                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md">
                    <Users className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{fornecedores.length}</p>
                    <p className="text-xs text-muted-foreground font-medium">Total de fornecedores</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status de Sincronismo por Fornecedor */}
            <Card className="border-border overflow-hidden">

              <CardHeader className="pb-3 border-b-2 border-[#747474]">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-foreground" />
                  <CardTitle className="text-base text-primary">Status de Sincronismo por Fornecedor</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {fornecedores.filter(f => f.ativo).map(f => {
                  const syncOk = f.sync_status === "success";
                  return (
                    <div key={f.id} className="space-y-1.5 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-primary">{f.nome}</span>
                        <span className="text-muted-foreground font-medium">
                          {f.last_sync_at ? new Date(f.last_sync_at).toLocaleString("pt-BR") : "Nunca sincronizado"}
                          {" - "}
                          <Badge className={statusColor[syncOk ? "sucesso" : f.sync_status === "error" ? "erro" : "pendente"]}>
                            {syncOk ? "sucesso" : f.sync_status ?? "pendente"}
                          </Badge>
                        </span>
                      </div>
                      <Progress value={syncOk ? 100 : f.sync_status === "error" ? 30 : 0} className="h-2.5" />
                    </div>
                  );
                })}
                {fornecedores.filter(f => f.ativo).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum fornecedor ativo</p>
                )}
              </CardContent>
            </Card>

            {/* Tabela Vínculo */}
            <Card className="border-border overflow-hidden">

              <CardHeader className="pb-3 border-b-2 border-[#747474]">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-foreground" />
                  <CardTitle className="text-base text-primary">Fornecedores Ativos</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary border-b-0">
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Fornecedor</TableHead>
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Tipo</TableHead>
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Último Sync</TableHead>
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Intervalo</TableHead>
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Status Sync</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fornecedores.filter(f => f.ativo).map((f, i) => (
                      <TableRow key={f.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'} hover:bg-muted/40 transition-colors border-b-2 border-[#747474]`}>
                        <TableCell className="font-medium text-foreground">{f.nome}</TableCell>
                        <TableCell><Badge variant="outline" className="border-primary/30 text-foreground bg-primary/8">{f.tipo ?? "-"}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {f.last_sync_at ? new Date(f.last_sync_at).toLocaleString("pt-BR") : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{f.sync_interval ?? "-"}</TableCell>
                        <TableCell>
                          <Badge className={statusColor[f.sync_status === "success" ? "sucesso" : f.sync_status === "error" ? "erro" : "pendente"]}>
                            {f.sync_status === "success" ? "sucesso" : f.sync_status === "error" ? "erro" : f.sync_status ?? "pendente"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── LOG ── */}
          <TabsContent value="log" className="space-y-4 mt-4">
            <Card className="border-border overflow-hidden">

              <CardHeader className="pb-3 border-b-2 border-[#747474]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-foreground" />
                    <CardTitle className="text-base text-primary">Log de Sincronismo</CardTitle>
                  </div>
                  <Badge variant="outline" className="gap-1.5 border-primary/30 text-foreground bg-primary/8">
                    <Calendar className="h-3 w-3" />Baseado em last_sync_at
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary border-b-0">
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Data/Hora</TableHead>
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Fornecedor</TableHead>
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Tipo</TableHead>
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logSync.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Nenhum registro de sincronismo encontrado
                        </TableCell>
                      </TableRow>
                    )}
                    {logSync.map((l, i) => (
                      <TableRow key={l.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'} hover:bg-muted/40 transition-colors border-b-2 border-[#747474]`}>
                        <TableCell className="text-sm font-mono text-foreground">{l.data}</TableCell>
                        <TableCell className="font-medium text-foreground">{l.fornecedor}</TableCell>
                        <TableCell><Badge variant="outline" className="border-primary/30 text-foreground bg-primary/8">{l.tipo}</Badge></TableCell>
                        <TableCell><Badge className={statusColor[l.status]}>{l.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="px-4 py-3 bg-muted/30 border-t-2 border-[#747474] flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{logSync.length} execução(ões) registrada(s)</span>
                  <span className="text-xs font-medium text-foreground">
                    {logSync.filter(l => l.status === "sucesso").length} sucesso · {logSync.filter(l => l.status === "erro").length} erro · {logSync.filter(l => l.status === "pendente").length} pendente
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── RELATÓRIO ── */}
          <TabsContent value="relatorio" className="space-y-4 mt-4">
            <Card className="border-border overflow-hidden">

              <CardHeader className="border-b-2 border-[#747474]">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-foreground" />
                  <div>
                    <CardTitle className="text-base text-primary">Relatório de Fornecedores</CardTitle>
                    <CardDescription className="mt-0.5">Aplique os filtros e exporte os dados</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid sm:grid-cols-3 gap-4 mb-5">
                  <div>
                    <Label className="text-xs font-medium text-foreground">Tipo de Serviço</Label>
                    <Select defaultValue="todos">
                      <SelectTrigger className="mt-1 border-border"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="todos">Todos</SelectItem>{tiposServico.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-foreground">Status</Label>
                    <Select defaultValue="todos">
                      <SelectTrigger className="mt-1 border-border"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-foreground">Região</Label>
                    <Select defaultValue="todos">
                      <SelectTrigger className="mt-1 border-border"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="todos">Todas</SelectItem><SelectItem value="SP">SP</SelectItem><SelectItem value="RJ">RJ</SelectItem><SelectItem value="MG">MG</SelectItem><SelectItem value="PR">PR</SelectItem><SelectItem value="RS">RS</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t-2 border-[#747474]">
                  <Button onClick={exportCsv} className="gap-1.5 bg-primary hover:bg-primary/90 text-white">
                    <Download className="h-4 w-4" />Exportar Excel
                  </Button>
                  <span className="text-xs text-muted-foreground">Os filtros serão aplicados na exportação</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* ── DIALOG CADASTRO / EDIÇÃO ── */}
      <Dialog open={showCadastro} onOpenChange={(open) => { setShowCadastro(open); if (!open) { setEditingId(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                {editingId ? <Pencil className="h-4 w-4 text-accent" /> : <Plus className="h-4 w-4 text-accent" />}
              </div>
              <DialogTitle className="text-primary">{editingId ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="h-px bg-gradient-to-r from-primary  to-transparent" />
          <div className="grid gap-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-foreground">Nome *</Label>
                <Input className="mt-1 border-border" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs font-medium text-foreground">CNPJ *</Label>
                <Input className="mt-1 border-border" placeholder="00.000.000/0001-00" value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-foreground">Tipo de Serviço</Label>
                <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                  <SelectTrigger className="mt-1 border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{tiposServico.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-foreground">Telefone</Label>
                <Input className="mt-1 border-border" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-foreground">E-mail</Label>
              <Input className="mt-1 border-border" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs font-medium text-foreground">Contato</Label>
              <Input className="mt-1 border-border" value={form.contato} onChange={e => setForm({ ...form, contato: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs font-medium text-foreground">Observações</Label>
              <Textarea className="mt-1 border-border" value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="border-t-2 border-[#747474] pt-4">
            <Button variant="outline" onClick={() => setShowCadastro(false)} className="border-border">Cancelar</Button>
            <Button onClick={handleSalvar} disabled={saving} className="bg-primary hover:bg-primary/90 text-white">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? "Atualizar" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG CONFIRMAR EXCLUSÃO ── */}
      <Dialog open={!!showConfirmDelete} onOpenChange={() => setShowConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => showConfirmDelete && handleDelete(showConfirmDelete)}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
