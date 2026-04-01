import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UsersRound, Search, Plus, DollarSign, Users, TrendingUp, Copy, Pencil, Power } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Afiliado {
  id: string;
  consultor_id: string | null;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  codigo: string | null;
  comissao_valor: number;
  leads: number;
  vendas: number;
  comissao_acumulada: number;
  ativo: boolean;
  created_at: string;
}

const emptyForm = {
  nome: "",
  cpf: "",
  telefone: "",
  email: "",
  comissao_valor: "",
};

export default function Afiliados() {
  const [busca, setBusca] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Afiliado | null>(null);
  const [form, setForm] = useState(emptyForm);
  const queryClient = useQueryClient();

  const { data: afiliados = [], isLoading } = useQuery<Afiliado[]>({
    queryKey: ["afiliados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("afiliados")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Afiliado[];
    },
  });

  const filtered = afiliados.filter(
    (a) =>
      !busca ||
      a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (a.codigo ?? "").toLowerCase().includes(busca.toLowerCase())
  );

  const totalAfiliados = afiliados.length;
  const totalAtivos = afiliados.filter((a) => a.ativo).length;
  const totalComissoes = afiliados.reduce((s, a) => s + Number(a.comissao_acumulada ?? 0), 0);
  const totalVendas = afiliados.reduce((s, a) => s + Number(a.vendas ?? 0), 0);

  const kpis = [
    { label: "Total Afiliados", value: totalAfiliados, icon: UsersRound, color: "text-primary", bg: "bg-primary/8" },
    { label: "Ativos", value: totalAtivos, icon: Users, color: "text-blue-600", bg: "bg-primary/6" },
    { label: "Total Comissões", value: `R$ ${totalComissoes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-purple-600", bg: "bg-primary/6" },
    { label: "Total Vendas", value: totalVendas, icon: TrendingUp, color: "text-success", bg: "bg-success/8" },
  ];

  function openCreate() {
    setEditando(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(a: Afiliado) {
    setEditando(a);
    setForm({
      nome: a.nome,
      cpf: a.cpf ?? "",
      telefone: a.telefone ?? "",
      email: a.email ?? "",
      comissao_valor: String(a.comissao_valor ?? 0),
    });
    setModalOpen(true);
  }

  async function salvar() {
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    const payload = {
      nome: form.nome.trim(),
      cpf: form.cpf.trim() || null,
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
      comissao_valor: parseFloat(form.comissao_valor) || 0,
    };

    if (editando) {
      const { error } = await supabase
        .from("afiliados")
        .update(payload)
        .eq("id", editando.id);
      if (error) {
        toast.error("Erro ao atualizar: " + error.message);
        return;
      }
      toast.success("Afiliado atualizado");
    } else {
      const { error } = await supabase.from("afiliados").insert(payload);
      if (error) {
        toast.error("Erro ao cadastrar: " + error.message);
        return;
      }
      toast.success("Afiliado cadastrado");
    }

    queryClient.invalidateQueries({ queryKey: ["afiliados"] });
    setModalOpen(false);
    setEditando(null);
    setForm(emptyForm);
  }

  async function toggleAtivo(a: Afiliado) {
    const { error } = await supabase
      .from("afiliados")
      .update({ ativo: !a.ativo })
      .eq("id", a.id);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success(a.ativo ? "Afiliado desativado" : "Afiliado ativado");
    queryClient.invalidateQueries({ queryKey: ["afiliados"] });
  }

  function copiarCodigo(codigo: string | null) {
    if (!codigo) return;
    navigator.clipboard.writeText(codigo);
    toast.success("Código copiado: " + codigo);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md">
            <UsersRound className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Afiliados</h1>
            <p className="text-sm text-muted-foreground">Rede de afiliados, indicações e comissões</p>
          </div>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-white" onClick={openCreate}>
              <Plus className="h-4 w-4" />Novo Afiliado
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editando ? "Editar Afiliado" : "Cadastrar Novo Afiliado"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium">Nome completo *</Label>
                <Input className="mt-1" placeholder="Nome do afiliado" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs font-medium">Email</Label>
                <Input className="mt-1" type="email" placeholder="email@exemplo.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs font-medium">Telefone</Label>
                <Input className="mt-1" placeholder="(00) 00000-0000" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs font-medium">CPF</Label>
                <Input className="mt-1" placeholder="000.000.000-00" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs font-medium">Comissão por venda (R$)</Label>
                <Input className="mt-1" type="number" placeholder="150.00" min={0} step="0.01" value={form.comissao_valor} onChange={(e) => setForm({ ...form, comissao_valor: e.target.value })} />
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90 text-white" onClick={salvar}>
                {editando ? "Salvar Alterações" : "Cadastrar Afiliado"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-lg font-bold text-foreground">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 border-border" placeholder="Buscar por nome ou código..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary border-b-0">
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Nome</TableHead>
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Telefone</TableHead>
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Email</TableHead>
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Código</TableHead>
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Leads</TableHead>
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Vendas</TableHead>
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Comissão Acum.</TableHead>
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhum afiliado encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((a, i) => (
                    <TableRow key={a.id} className={`${i % 2 === 0 ? "bg-card" : "bg-muted/30"} hover:bg-muted/40 transition-colors border-b-2 border-[#747474]`}>
                      <TableCell className="font-medium">{a.nome}</TableCell>
                      <TableCell className="text-sm">{a.telefone ?? "-"}</TableCell>
                      <TableCell className="text-sm">{a.email ?? "-"}</TableCell>
                      <TableCell>
                        <span
                          className="font-mono text-xs bg-muted/50 px-2 py-0.5 rounded cursor-pointer hover:bg-muted inline-flex items-center gap-1"
                          onClick={() => copiarCodigo(a.codigo)}
                          title="Clique para copiar"
                        >
                          {a.codigo ?? "-"}
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{a.leads ?? 0}</TableCell>
                      <TableCell className="text-right font-semibold text-success">{a.vendas ?? 0}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        R$ {Number(a.comissao_acumulada ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge className={a.ativo ? "bg-success/10 text-success" : "bg-gray-100 text-gray-600"}>
                          {a.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)} title="Editar">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleAtivo(a)} title={a.ativo ? "Desativar" : "Ativar"}>
                            <Power className={`h-3.5 w-3.5 ${a.ativo ? "text-destructive" : "text-success"}`} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          <div className="px-4 py-3 bg-muted/30 border-t-2 border-[#747474]">
            <span className="text-xs text-muted-foreground">{filtered.length} afiliado(s)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
