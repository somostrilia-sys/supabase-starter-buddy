import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CLASSIFICACOES = [
  "CARRO RESERVA", "PROTEÇÃO TERCEIROS", "ASSISTÊNCIA 24HRS",
  "PRODUTO ADICIONAL VEICULO", "PRODUTO ADICIONAL ASSOCIADO",
  "TAXA ADMINISTRATIVA", "VIDROS", "RASTREADOR", "OUTROS", "NAO INFORMADO",
];

const TIPOS_VEICULO = [
  "TODOS", "AUTOMOVEL", "UTILITARIOS", "MOTOCICLETA", "PESADOS", "VANS E PESADOS P.P",
];

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  codigo_sga?: string;
  valor: number;
  valor_base?: number;
  tipo?: string;
  classificacao?: string;
  objeto_contrato?: string;
  obrigatorio: boolean;
  ativo: boolean;
  fornecedor_id?: string;
}

const emptyForm = {
  nome: "", descricao: "", codigo_sga: "", valor: 0,
  tipo: "TODOS", classificacao: "OUTROS", objeto_contrato: "",
  obrigatorio: false, ativo: true, fornecedor_id: "",
};

export default function ProdutoVeiculo() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [regionaisSelecionadas, setRegionaisSelecionadas] = useState<string[]>([]);
  const [cooperativasSelecionadas, setCooperativasSelecionadas] = useState<string[]>([]);
  const [gruposSelecionados, setGruposSelecionados] = useState<string[]>([]);

  const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));

  // Queries
  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["gestao-produtos-gia"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("produtos_gia")
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data || []) as Produto[];
    },
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("fornecedores").select("id, nome").eq("ativo", true).order("nome");
      return data || [];
    },
  });

  const { data: regionais = [] } = useQuery({
    queryKey: ["regionais-prod"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("regionais").select("id, nome, codigo_numerico").eq("ativo", true).order("codigo_numerico");
      return data || [];
    },
  });

  const { data: cooperativas = [] } = useQuery({
    queryKey: ["cooperativas-prod"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("cooperativas").select("id, nome").order("nome");
      return data || [];
    },
  });

  const { data: grupos = [] } = useQuery({
    queryKey: ["grupos-prod"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("grupos_produtos").select("id, nome").eq("ativo", true).order("nome");
      return data || [];
    },
  });

  // Carrega vínculos ao editar
  async function loadVinculos(produtoId: string) {
    const [r, c, g] = await Promise.all([
      (supabase as any).from("produto_regras").select("regional_id").eq("produto_id", produtoId).eq("ativo", true),
      (supabase as any).from("produto_cooperativas").select("cooperativa_id").eq("produto_id", produtoId),
      (supabase as any).from("grupo_produto_itens").select("grupo_id").eq("produto_id", produtoId),
    ]);
    setRegionaisSelecionadas((r.data || []).map((x: any) => x.regional_id).filter(Boolean));
    setCooperativasSelecionadas((c.data || []).map((x: any) => x.cooperativa_id).filter(Boolean));
    setGruposSelecionados((g.data || []).map((x: any) => x.grupo_id).filter(Boolean));
  }

  const openNew = () => {
    setEditId(null); setForm(emptyForm);
    setRegionaisSelecionadas([]); setCooperativasSelecionadas([]); setGruposSelecionados([]);
    setModalOpen(true);
  };

  const openEdit = async (p: Produto) => {
    setEditId(p.id);
    setForm({
      nome: p.nome || "",
      descricao: p.descricao || "",
      codigo_sga: p.codigo_sga || "",
      valor: Number(p.valor || p.valor_base || 0),
      tipo: p.tipo || "TODOS",
      classificacao: p.classificacao || "OUTROS",
      objeto_contrato: p.objeto_contrato || "",
      obrigatorio: p.obrigatorio || false,
      ativo: p.ativo !== false,
      fornecedor_id: p.fornecedor_id || "",
    });
    await loadVinculos(p.id);
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.nome) throw new Error("Nome obrigatório");
      if (regionaisSelecionadas.length === 0) throw new Error("Selecione ao menos uma regional");

      const payload = {
        nome: form.nome,
        descricao: form.descricao || null,
        codigo_sga: form.codigo_sga || null,
        valor: form.valor,
        valor_base: form.valor,
        tipo: form.tipo,
        classificacao: form.classificacao,
        objeto_contrato: form.objeto_contrato || null,
        obrigatorio: form.obrigatorio,
        ativo: form.ativo,
        fornecedor_id: form.fornecedor_id || null,
        updated_at: new Date().toISOString(),
      };

      let produtoId = editId;
      if (editId) {
        const { error } = await (supabase as any).from("produtos_gia").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { data, error } = await (supabase as any).from("produtos_gia").insert(payload).select("id").single();
        if (error) throw error;
        produtoId = data.id;
      }

      // Replace strategy para vínculos
      if (editId) {
        await (supabase as any).from("produto_regras").delete().eq("produto_id", produtoId);
        await (supabase as any).from("produto_cooperativas").delete().eq("produto_id", produtoId);
        await (supabase as any).from("grupo_produto_itens").delete().eq("produto_id", produtoId);
      }

      if (regionaisSelecionadas.length > 0) {
        await (supabase as any).from("produto_regras").insert(
          regionaisSelecionadas.map(rid => ({ produto_id: produtoId, regional_id: rid, ativo: true }))
        );
      }
      if (cooperativasSelecionadas.length > 0) {
        await (supabase as any).from("produto_cooperativas").insert(
          cooperativasSelecionadas.map(cid => ({ produto_id: produtoId, cooperativa_id: cid }))
        );
      }
      if (gruposSelecionados.length > 0) {
        await (supabase as any).from("grupo_produto_itens").insert(
          gruposSelecionados.map(gid => ({ grupo_id: gid, produto_id: produtoId, obrigatorio: form.obrigatorio }))
        );
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gestao-produtos-gia"] });
      toast.success(editId ? "Produto atualizado!" : "Produto cadastrado!");
      setModalOpen(false);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar"),
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await (supabase as any).from("produtos_gia").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gestao-produtos-gia"] });
      toast.success("Status atualizado");
    },
  });

  const filtered = produtos.filter((p: Produto) =>
    !search ||
    p.nome?.toLowerCase().includes(search.toLowerCase()) ||
    p.classificacao?.toLowerCase().includes(search.toLowerCase()) ||
    p.codigo_sga?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleArr = (arr: string[], setArr: (a: string[]) => void, id: string) => {
    setArr(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold">Produtos</h2>
          <p className="text-xs text-muted-foreground">Catálogo unificado com vínculos por regional, cooperativa e plano</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Produto</Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, classificação ou código" className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>COD.</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Classificação</TableHead>
                  <TableHead>Tipo Veículo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Obrig.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p: Produto) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs font-mono text-muted-foreground">{p.codigo_sga || "—"}</TableCell>
                    <TableCell className="text-sm font-medium max-w-[280px] truncate">{p.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{p.classificacao || "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{p.tipo || "TODOS"}</TableCell>
                    <TableCell className="text-sm font-mono text-right">
                      {Number(p.valor || p.valor_base || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                    <TableCell>
                      {p.obrigatorio ? <Badge className="bg-amber-500/10 text-amber-700 text-[10px]">Sim</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Switch checked={p.ativo !== false} onCheckedChange={v => toggleAtivoMutation.mutate({ id: p.id, ativo: v })} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum produto encontrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Nome do Produto *</Label>
                <Input value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Ex: RASTREADOR" />
              </div>

              <div>
                <Label>COD.</Label>
                <Input value={form.codigo_sga} onChange={e => set("codigo_sga", e.target.value)} placeholder="Ex: 54" />
              </div>

              <div>
                <Label>Valor Mensal *</Label>
                <Input type="number" step="0.01" value={form.valor} onChange={e => set("valor", Number(e.target.value))} />
              </div>

              <div>
                <Label>Fornecedor</Label>
                <Select value={form.fornecedor_id || undefined} onValueChange={v => set("fornecedor_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Classificação *</Label>
                <Select value={form.classificacao} onValueChange={v => set("classificacao", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLASSIFICACOES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo de Veículo *</Label>
                <Select value={form.tipo} onValueChange={v => set("tipo", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_VEICULO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label>Objeto do Contrato (descrição)</Label>
                <Textarea value={form.objeto_contrato} onChange={e => set("objeto_contrato", e.target.value)}
                  placeholder="Descrição usada no boleto e contrato" rows={2} />
              </div>
            </div>

            {/* Vínculos */}
            <div className="border-t pt-4 space-y-4">
              <div>
                <Label className="text-sm font-semibold">Regionais * (mín. 1)</Label>
                <div className="mt-2 max-h-32 overflow-y-auto border rounded p-2 space-y-1">
                  {regionais.map((r: any) => (
                    <label key={r.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/30 px-1 rounded">
                      <Checkbox checked={regionaisSelecionadas.includes(r.id)}
                        onCheckedChange={() => toggleArr(regionaisSelecionadas, setRegionaisSelecionadas, r.id)} />
                      <span>{r.codigo_numerico ? `${r.codigo_numerico}. ` : ""}{r.nome}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{regionaisSelecionadas.length} selecionadas</p>
              </div>

              <div>
                <Label className="text-sm font-semibold">Cooperativas (opcional)</Label>
                <div className="mt-2 max-h-32 overflow-y-auto border rounded p-2 space-y-1">
                  {cooperativas.map((c: any) => (
                    <label key={c.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/30 px-1 rounded">
                      <Checkbox checked={cooperativasSelecionadas.includes(c.id)}
                        onCheckedChange={() => toggleArr(cooperativasSelecionadas, setCooperativasSelecionadas, c.id)} />
                      <span>{c.nome}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{cooperativasSelecionadas.length} selecionadas</p>
              </div>

              <div>
                <Label className="text-sm font-semibold">Grupos / Planos (opcional)</Label>
                <div className="mt-2 max-h-32 overflow-y-auto border rounded p-2 space-y-1">
                  {grupos.map((g: any) => (
                    <label key={g.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/30 px-1 rounded">
                      <Checkbox checked={gruposSelecionados.includes(g.id)}
                        onCheckedChange={() => toggleArr(gruposSelecionados, setGruposSelecionados, g.id)} />
                      <span>{g.nome}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{gruposSelecionados.length} selecionados</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Switch checked={form.obrigatorio} onCheckedChange={v => set("obrigatorio", v)} />
                <Label className="text-xs">Obrigatório (auto-vincula ao plano)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.ativo} onCheckedChange={v => set("ativo", v)} />
                <Label className="text-xs">Ativo</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editId ? "Salvar Alterações" : "Cadastrar Produto"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
