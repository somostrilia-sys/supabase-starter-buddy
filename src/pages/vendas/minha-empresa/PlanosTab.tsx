import { useState, useMemo, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Package, ChevronDown, ChevronRight, Plus, Edit, Trash2, ShieldCheck, Gift, ListChecks, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ProdutoGia {
  id: string;
  nome: string;
  classificacao: string | null;
  tipo: string | null;
  valor: number | null;
  descricao: string | null;
}

interface GrupoProdutoItem {
  id: string;
  grupo_id: string;
  produto_id: string;
  obrigatorio: boolean;
  produto?: ProdutoGia;
}

interface GrupoProduto {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
}

interface CoberturaPlano {
  id: string;
  plano: string;
  cobertura: string;
  tipo: string | null;
  inclusa: boolean | null;
  valor: string | null;
  ordem: number | null;
  detalhe: string | null;
}

const CATEGORIAS_SERVICO = [
  { value: "cobertura", label: "Cobertura" },
  { value: "benefício", label: "Benefício" },
  { value: "assistência", label: "Assistência" },
  { value: "opcional", label: "Opcional" },
] as const;

function categoriaToBadge(tipo: string | null): { label: string; color: string; icon: typeof ShieldCheck } {
  if (!tipo) return { label: "Outro", color: "bg-muted text-muted-foreground", icon: Package };
  const t = tipo.toLowerCase();
  if (t === "cobertura") return { label: "Cobertura", color: "bg-blue-500/10 text-blue-600", icon: ShieldCheck };
  if (t === "benefício") return { label: "Benefício", color: "bg-emerald-500/10 text-emerald-600", icon: Gift };
  if (t === "assistência") return { label: "Assistência", color: "bg-purple-500/10 text-purple-600", icon: ListChecks };
  if (t === "opcional") return { label: "Opcional", color: "bg-amber-500/10 text-amber-600", icon: Package };
  return { label: tipo, color: "bg-muted text-muted-foreground", icon: Package };
}

// Mapeamento de classificação para tipo de serviço
function getTipoServico(classificacao: string | null): { label: string; color: string; icon: typeof ShieldCheck } {
  if (!classificacao) return { label: "Outro", color: "bg-muted text-muted-foreground", icon: Package };
  const c = classificacao.toUpperCase();
  if (c.includes("PROTECAO TERCEIROS") || c.includes("VIDROS")) {
    return { label: "Cobertura", color: "bg-blue-500/10 text-blue-600", icon: ShieldCheck };
  }
  if (c.includes("ASSISTENCIA") || c.includes("CARRO RESERVA")) {
    return { label: "Benefício", color: "bg-emerald-500/10 text-emerald-600", icon: Gift };
  }
  if (c.includes("PRODUTO ADICIONAL") || c.includes("RASTREADOR") || c.includes("TAXA")) {
    return { label: "Serviço", color: "bg-amber-500/10 text-amber-600", icon: ListChecks };
  }
  return { label: "Outro", color: "bg-muted text-muted-foreground", icon: Package };
}

export default function PlanosTab() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPlano, setEditingPlano] = useState<GrupoProduto | null>(null);
  const [formNome, setFormNome] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formAtivo, setFormAtivo] = useState(true);
  const [addProdutoModalOpen, setAddProdutoModalOpen] = useState(false);
  const [produtoSearch, setProdutoSearch] = useState("");

  // Feature 1: Criar novo serviço
  const [modalMode, setModalMode] = useState<"vincular" | "criar">("vincular");
  const [novoNome, setNovoNome] = useState("");
  const [novoCategoria, setNovoCategoria] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novoObrigatorio, setNovoObrigatorio] = useState(false);

  // Feature 2: Vincular a múltiplos planos
  const [planosMultiSelect, setPlanosMultiSelect] = useState<string[]>([]);

  // ── Queries ──
  const { data: planos = [], isLoading: loadingPlanos } = useQuery({
    queryKey: ["grupos_produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grupos_produtos")
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data || []) as GrupoProduto[];
    },
  });

  const { data: todosItens = [] } = useQuery({
    queryKey: ["grupo_produto_itens_all"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("grupo_produto_itens")
        .select("id, grupo_id, produto_id, obrigatorio, produtos_gia(id, nome, classificacao, tipo, valor, descricao)")
        .order("created_at");
      if (error) throw error;
      return (data || []).map((item: any) => ({
        id: item.id,
        grupo_id: item.grupo_id,
        produto_id: item.produto_id,
        obrigatorio: item.obrigatorio,
        produto: item.produtos_gia,
      })) as GrupoProdutoItem[];
    },
  });

  const { data: todosProdutos = [] } = useQuery({
    queryKey: ["produtos_gia_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos_gia")
        .select("id, nome, classificacao, tipo, valor, descricao")
        .order("nome");
      if (error) throw error;
      return (data || []) as ProdutoGia[];
    },
  });

  // Feature 3: coberturas_plano para ler/editar tipo real
  const { data: todasCoberturas = [] } = useQuery({
    queryKey: ["coberturas_plano_all"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("coberturas_plano")
        .select("*");
      if (error) throw error;
      return (data || []) as CoberturaPlano[];
    },
  });

  // Mapa de coberturas: chave = `plano|cobertura` (lowercase) → CoberturaPlano
  const coberturaMap = useMemo(() => {
    const map = new Map<string, CoberturaPlano>();
    todasCoberturas.forEach((c) => {
      const key = `${(c.plano || "").toLowerCase()}|${(c.cobertura || "").toLowerCase()}`;
      map.set(key, c);
    });
    return map;
  }, [todasCoberturas]);

  // Itens agrupados por plano
  const itensByPlano = useMemo(() => {
    const map = new Map<string, GrupoProdutoItem[]>();
    todosItens.forEach((item) => {
      if (!map.has(item.grupo_id)) map.set(item.grupo_id, []);
      map.get(item.grupo_id)!.push(item);
    });
    return map;
  }, [todosItens]);

  // Produtos disponíveis para adicionar ao plano expandido
  const produtosDisponiveis = useMemo(() => {
    if (!expandedId) return [];
    const idsNoPlano = new Set((itensByPlano.get(expandedId) || []).map((i) => i.produto_id));
    let available = todosProdutos.filter((p) => !idsNoPlano.has(p.id));
    if (produtoSearch.trim()) {
      const s = produtoSearch.toLowerCase();
      available = available.filter((p) =>
        p.nome.toLowerCase().includes(s) ||
        (p.classificacao && p.classificacao.toLowerCase().includes(s))
      );
    }
    return available;
  }, [expandedId, itensByPlano, todosProdutos, produtoSearch]);

  // ── Mutations ──
  const updatePlanoMutation = useMutation({
    mutationFn: async (payload: { id: string; nome: string; descricao: string | null; ativo: boolean }) => {
      const { error } = await supabase
        .from("grupos_produtos")
        .update({ nome: payload.nome, descricao: payload.descricao, ativo: payload.ativo })
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupos_produtos"] });
      toast.success("Plano atualizado!");
      setEditModalOpen(false);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao atualizar plano"),
  });

  const addItemMutation = useMutation({
    mutationFn: async (payload: { grupo_id: string; produto_id: string }) => {
      const { error } = await (supabase as any)
        .from("grupo_produto_itens")
        .insert({ grupo_id: payload.grupo_id, produto_id: payload.produto_id, obrigatorio: false });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupo_produto_itens_all"] });
      toast.success("Produto adicionado ao plano!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao adicionar produto"),
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await (supabase as any)
        .from("grupo_produto_itens")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupo_produto_itens_all"] });
      toast.success("Produto removido do plano!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao remover produto"),
  });

  const toggleObrigatorioMutation = useMutation({
    mutationFn: async ({ id, obrigatorio }: { id: string; obrigatorio: boolean }) => {
      const { error } = await (supabase as any)
        .from("grupo_produto_itens")
        .update({ obrigatorio })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupo_produto_itens_all"] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao alterar"),
  });

  // Feature 1: Criar novo serviço (insere em produtos_gia + coberturas_plano + grupo_produto_itens)
  const criarServicoMutation = useMutation({
    mutationFn: async (payload: {
      nome: string;
      categoria: string;
      valor: number | null;
      obrigatorio: boolean;
      grupoIds: string[];
      planoNomes: string[];
    }) => {
      // 1. Check if produto already exists
      const { data: existing } = await supabase
        .from("produtos_gia")
        .select("id")
        .ilike("nome", payload.nome)
        .limit(1);

      let produtoId: string;
      if (existing && existing.length > 0) {
        produtoId = existing[0].id;
      } else {
        const { data: newProd, error: errProd } = await supabase
          .from("produtos_gia")
          .insert({ nome: payload.nome, classificacao: payload.categoria.toUpperCase(), valor: payload.valor })
          .select("id")
          .single();
        if (errProd) throw errProd;
        produtoId = newProd.id;
      }

      // 2. Insert coberturas_plano for each plan
      for (const planoNome of payload.planoNomes) {
        await (supabase as any)
          .from("coberturas_plano")
          .insert({
            plano: planoNome,
            cobertura: payload.nome,
            tipo: payload.categoria.toLowerCase(),
            inclusa: payload.obrigatorio,
            valor: payload.valor ? `R$ ${payload.valor.toFixed(2)}` : null,
          });
      }

      // 3. Insert grupo_produto_itens for each grupo
      for (const grupoId of payload.grupoIds) {
        // Check if already linked
        const { data: existLink } = await (supabase as any)
          .from("grupo_produto_itens")
          .select("id")
          .eq("grupo_id", grupoId)
          .eq("produto_id", produtoId)
          .limit(1);
        if (!existLink || existLink.length === 0) {
          const { error: errLink } = await (supabase as any)
            .from("grupo_produto_itens")
            .insert({ grupo_id: grupoId, produto_id: produtoId, obrigatorio: payload.obrigatorio });
          if (errLink) throw errLink;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupo_produto_itens_all"] });
      queryClient.invalidateQueries({ queryKey: ["produtos_gia_all"] });
      queryClient.invalidateQueries({ queryKey: ["coberturas_plano_all"] });
      toast.success("Serviço criado e vinculado!");
      setAddProdutoModalOpen(false);
      resetCriarForm();
    },
    onError: (e: any) => toast.error(e.message || "Erro ao criar serviço"),
  });

  // Feature 2: Vincular produto existente a múltiplos planos
  const vincularMultiplosMutation = useMutation({
    mutationFn: async (payload: { produtoId: string; produtoNome: string; grupoIds: string[]; planoNomes: string[] }) => {
      for (let i = 0; i < payload.grupoIds.length; i++) {
        const grupoId = payload.grupoIds[i];
        const planoNome = payload.planoNomes[i];
        // grupo_produto_itens
        const { data: existLink } = await (supabase as any)
          .from("grupo_produto_itens")
          .select("id")
          .eq("grupo_id", grupoId)
          .eq("produto_id", payload.produtoId)
          .limit(1);
        if (!existLink || existLink.length === 0) {
          const { error } = await (supabase as any)
            .from("grupo_produto_itens")
            .insert({ grupo_id: grupoId, produto_id: payload.produtoId, obrigatorio: false });
          if (error) throw error;
        }
        // coberturas_plano
        const { data: existCob } = await (supabase as any)
          .from("coberturas_plano")
          .select("id")
          .eq("plano", planoNome)
          .ilike("cobertura", payload.produtoNome)
          .limit(1);
        if (!existCob || existCob.length === 0) {
          await (supabase as any)
            .from("coberturas_plano")
            .insert({ plano: planoNome, cobertura: payload.produtoNome, tipo: "opcional", inclusa: false });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupo_produto_itens_all"] });
      queryClient.invalidateQueries({ queryKey: ["coberturas_plano_all"] });
      toast.success("Serviço vinculado aos planos selecionados!");
      setPlanosMultiSelect([]);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao vincular"),
  });

  // Feature 3: Editar categoria/tipo de um serviço na coberturas_plano
  const updateCategoriaMutation = useMutation({
    mutationFn: async (payload: { coberturaId: string; novoTipo: string }) => {
      const { error } = await (supabase as any)
        .from("coberturas_plano")
        .update({ tipo: payload.novoTipo })
        .eq("id", payload.coberturaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coberturas_plano_all"] });
      toast.success("Categoria atualizada!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao atualizar categoria"),
  });

  // ── Helpers ──
  const resetCriarForm = () => {
    setNovoNome("");
    setNovoCategoria("");
    setNovoValor("");
    setNovoObrigatorio(false);
    setModalMode("vincular");
    setPlanosMultiSelect([]);
  };

  const handleCriarServico = () => {
    if (!novoNome.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!novoCategoria) { toast.error("Categoria é obrigatória"); return; }
    // Determine which plans to link to
    const grupoIds: string[] = [];
    const planoNomes: string[] = [];
    if (planosMultiSelect.length > 0) {
      planosMultiSelect.forEach((pid) => {
        const p = planos.find((pl) => pl.id === pid);
        if (p) { grupoIds.push(p.id); planoNomes.push(p.nome); }
      });
    } else if (expandedId) {
      const p = planos.find((pl) => pl.id === expandedId);
      if (p) { grupoIds.push(p.id); planoNomes.push(p.nome); }
    }
    if (grupoIds.length === 0) { toast.error("Selecione ao menos um plano"); return; }
    criarServicoMutation.mutate({
      nome: novoNome.trim(),
      categoria: novoCategoria,
      valor: novoValor ? parseFloat(novoValor) : null,
      obrigatorio: novoObrigatorio,
      grupoIds,
      planoNomes,
    });
  };

  const handleVincularMultiplos = (produtoId: string, produtoNome: string) => {
    if (planosMultiSelect.length === 0) {
      // Single plan (current expanded)
      if (expandedId) addItemMutation.mutate({ grupo_id: expandedId, produto_id: produtoId });
      return;
    }
    const grupoIds: string[] = [];
    const planoNomes: string[] = [];
    planosMultiSelect.forEach((pid) => {
      const p = planos.find((pl) => pl.id === pid);
      if (p) { grupoIds.push(p.id); planoNomes.push(p.nome); }
    });
    if (grupoIds.length === 0) return;
    vincularMultiplosMutation.mutate({ produtoId, produtoNome, grupoIds, planoNomes });
  };

  // Lookup cobertura for an item in a specific plan
  const getCoberturaForItem = (planoNome: string, produtoNome: string | undefined): CoberturaPlano | undefined => {
    if (!produtoNome) return undefined;
    return coberturaMap.get(`${planoNome.toLowerCase()}|${produtoNome.toLowerCase()}`);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setProdutoSearch("");
  };

  const openEditPlano = (plano: GrupoProduto) => {
    setEditingPlano(plano);
    setFormNome(plano.nome);
    setFormDescricao(plano.descricao || "");
    setFormAtivo(plano.ativo);
    setEditModalOpen(true);
  };

  const handleSavePlano = () => {
    if (!editingPlano || !formNome.trim()) { toast.error("Nome é obrigatório"); return; }
    updatePlanoMutation.mutate({
      id: editingPlano.id,
      nome: formNome.trim(),
      descricao: formDescricao.trim() || null,
      ativo: formAtivo,
    });
  };

  // Agrupar itens por classificação
  const groupByClassificacao = (itens: GrupoProdutoItem[]) => {
    const map = new Map<string, GrupoProdutoItem[]>();
    itens.forEach((item) => {
      const cat = item.produto?.classificacao || "OUTROS";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    });
    return map;
  };

  if (loadingPlanos) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando planos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Planos (Grupos de Produtos)</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie os planos e seus serviços incluídos. O vínculo com tabela de preços é automático via grupo de produtos.
        </p>
      </div>

      {planos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum plano cadastrado.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Serviços</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planos.map((plano) => {
                  const itens = itensByPlano.get(plano.id) || [];
                  const isExpanded = expandedId === plano.id;
                  const byClass = groupByClassificacao(itens);

                  return (
                    <Fragment key={plano.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleExpand(plano.id)}
                      >
                        <TableCell>
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </TableCell>
                        <TableCell className="font-medium">{plano.nome}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {plano.descricao || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={plano.ativo ? "default" : "secondary"}
                            className={plano.ativo ? "bg-emerald-500/10 text-emerald-600 border-success/20" : ""}
                          >
                            {plano.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {Array.from(byClass.entries()).map(([cls]) => {
                              const tipo = getTipoServico(cls);
                              return (
                                <Badge key={cls} variant="outline" className={`text-[10px] ${tipo.color}`}>
                                  {tipo.label}
                                </Badge>
                              );
                            })}
                            <Badge variant="outline" className="text-[10px]">
                              {itens.length} itens
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditPlano(plano)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow key={`${plano.id}-detail`}>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            <div className="space-y-4">
                              {/* Serviços agrupados por classificação */}
                              {itens.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nenhum serviço vinculado a este plano.</p>
                              ) : (
                                Array.from(byClass.entries()).map(([cls, items]) => {
                                  const tipo = getTipoServico(cls);
                                  const Icon = tipo.icon;
                                  return (
                                    <div key={cls} className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" />
                                        <span className="text-sm font-medium">{cls}</span>
                                        <Badge className={`text-[10px] ${tipo.color} border-0`}>{tipo.label}</Badge>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 ml-6">
                                        {items.map((item) => {
                                          const cob = getCoberturaForItem(plano.nome, item.produto?.nome);
                                          const currentTipo = cob?.tipo || null;
                                          const tipoBadge = currentTipo ? categoriaToBadge(currentTipo) : getTipoServico(item.produto?.classificacao || null);
                                          return (
                                            <div
                                              key={item.id}
                                              className="flex items-center justify-between p-2 rounded-md border bg-card"
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <Package className="h-4 w-4 text-primary shrink-0" />
                                                <div className="min-w-0">
                                                  <p className="text-sm font-medium truncate">{item.produto?.nome || "—"}</p>
                                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    {item.obrigatorio && (
                                                      <Badge variant="outline" className="text-[9px] px-1 py-0">Obrigatório</Badge>
                                                    )}
                                                    {item.produto?.valor != null && item.produto.valor > 0 && (
                                                      <span>R$ {item.produto.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                                    )}
                                                  </div>
                                                  {/* Feature 3: Editar categoria */}
                                                  {cob ? (
                                                    <Select
                                                      value={currentTipo || ""}
                                                      onValueChange={(v) => updateCategoriaMutation.mutate({ coberturaId: cob.id, novoTipo: v })}
                                                    >
                                                      <SelectTrigger className="h-6 text-[10px] w-[120px] mt-1 border-dashed">
                                                        <SelectValue placeholder="Categoria" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        {CATEGORIAS_SERVICO.map((cat) => (
                                                          <SelectItem key={cat.value} value={cat.value} className="text-xs">
                                                            {cat.label}
                                                          </SelectItem>
                                                        ))}
                                                      </SelectContent>
                                                    </Select>
                                                  ) : (
                                                    <Badge className={`text-[9px] mt-1 ${tipoBadge.color} border-0`}>{tipoBadge.label}</Badge>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-1 shrink-0">
                                                <Switch
                                                  checked={item.obrigatorio}
                                                  onCheckedChange={(v) => toggleObrigatorioMutation.mutate({ id: item.id, obrigatorio: v })}
                                                  className="scale-75"
                                                />
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-7 w-7 text-destructive"
                                                  onClick={() => removeItemMutation.mutate(item.id)}
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })
                              )}

                              {/* Adicionar produto */}
                              <div className="border-t pt-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => { setAddProdutoModalOpen(true); setProdutoSearch(""); resetCriarForm(); }}
                                >
                                  <Plus className="h-3.5 w-3.5" /> Adicionar Serviço
                                </Button>
                              </div>
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
      )}

      {/* Modal Editar Plano */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={formNome} onChange={(e) => setFormNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={formDescricao} onChange={(e) => setFormDescricao(e.target.value)} placeholder="Descrição do plano" />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label>Ativo</Label>
              <Switch checked={formAtivo} onCheckedChange={setFormAtivo} />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSavePlano} disabled={updatePlanoMutation.isPending}>
                {updatePlanoMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Adicionar Produto (Features 1 + 2) */}
      <Dialog open={addProdutoModalOpen} onOpenChange={(open) => { setAddProdutoModalOpen(open); if (!open) resetCriarForm(); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Serviço ao Plano</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Toggle: Vincular existente vs Criar novo */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={modalMode === "vincular" ? "default" : "outline"}
                onClick={() => setModalMode("vincular")}
                className="gap-1"
              >
                <Search className="h-3.5 w-3.5" /> Vincular Existente
              </Button>
              <Button
                size="sm"
                variant={modalMode === "criar" ? "default" : "outline"}
                onClick={() => setModalMode("criar")}
                className="gap-1"
              >
                <Sparkles className="h-3.5 w-3.5" /> Criar Novo Serviço
              </Button>
            </div>

            {/* Feature 2: Multi-select de planos */}
            <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
              <Label className="text-xs font-medium">Vincular a Múltiplos Planos (opcional)</Label>
              <p className="text-[10px] text-muted-foreground">Se nenhum for selecionado, vincula apenas ao plano atual.</p>
              <div className="grid grid-cols-2 gap-1 max-h-[100px] overflow-y-auto">
                {planos.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer p-1 rounded hover:bg-muted">
                    <Checkbox
                      checked={planosMultiSelect.includes(p.id)}
                      onCheckedChange={(checked) => {
                        setPlanosMultiSelect((prev) =>
                          checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)
                        );
                      }}
                    />
                    <span className="truncate">{p.nome}</span>
                  </label>
                ))}
              </div>
            </div>

            {modalMode === "criar" ? (
              /* Feature 1: Criar novo serviço */
              <div className="space-y-3 p-3 border rounded-lg">
                <div className="space-y-2">
                  <Label className="text-xs">Nome *</Label>
                  <Input
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Nome do serviço"
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Categoria *</Label>
                  <Select value={novoCategoria} onValueChange={setNovoCategoria}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_SERVICO.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Valor mensal (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={novoValor}
                    onChange={(e) => setNovoValor(e.target.value)}
                    placeholder="Opcional"
                    className="h-9"
                  />
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <Label className="text-xs">Obrigatório</Label>
                  <Switch checked={novoObrigatorio} onCheckedChange={setNovoObrigatorio} className="scale-90" />
                </div>
                <Button
                  className="w-full gap-1"
                  size="sm"
                  onClick={handleCriarServico}
                  disabled={criarServicoMutation.isPending}
                >
                  {criarServicoMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Sparkles className="h-3.5 w-3.5" /> Criar e Vincular
                </Button>
              </div>
            ) : (
              /* Vincular existente (original) */
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto por nome ou classificação..."
                    value={produtoSearch}
                    onChange={(e) => setProdutoSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="border rounded-md max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Produto</TableHead>
                        <TableHead className="text-xs">Classificação</TableHead>
                        <TableHead className="text-xs">Tipo</TableHead>
                        <TableHead className="text-xs w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtosDisponiveis.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">
                            {produtoSearch ? "Nenhum produto encontrado" : "Todos os produtos já estão no plano"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        produtosDisponiveis.slice(0, 30).map((p) => {
                          const tipo = getTipoServico(p.classificacao);
                          return (
                            <TableRow key={p.id}>
                              <TableCell className="text-xs font-medium">{p.nome}</TableCell>
                              <TableCell className="text-[10px] text-muted-foreground">{p.classificacao || "—"}</TableCell>
                              <TableCell>
                                <Badge className={`text-[9px] ${tipo.color} border-0`}>{tipo.label}</Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  disabled={addItemMutation.isPending || vincularMultiplosMutation.isPending}
                                  onClick={() => handleVincularMultiplos(p.id, p.nome)}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
