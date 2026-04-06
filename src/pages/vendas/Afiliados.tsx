import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UsersRound, Search, Plus, DollarSign, Users, TrendingUp, Copy, Pencil, Power,
  Link2, Send, ExternalLink, Trophy, Eye, ArrowUpRight, ChevronDown, ChevronUp,
  CheckCircle, Clock, Wallet, BarChart3, Star, Share2, CreditCard,
  Landmark, Phone, Mail, FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUsuario } from "@/hooks/useUsuario";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

/* ─── Types ─── */
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
  saldo_disponivel: number;
  ativo: boolean;
  token_acesso: string | null;
  banco: string | null;
  chave_pix: string | null;
  dia_recebimento: number | null;
  created_at: string;
}

interface Indicacao {
  id: string;
  afiliado_id: string;
  lead_nome: string | null;
  status: string;
  comissao_valor: number;
  pago: boolean;
  created_at: string;
}

interface Saque {
  id: string;
  afiliado_id: string;
  valor: number;
  status: string;
  created_at: string;
}

interface ConsultorInfo {
  id: string;
  nome: string;
  slug: string | null;
  cooperativa: string | null;
  unidade_id: string | null;
}

const BANCOS = [
  "001 - Banco do Brasil","033 - Santander","104 - Caixa Econômica","237 - Bradesco",
  "341 - Itaú","077 - Inter","260 - Nubank","756 - Sicoob","748 - Sicredi",
  "212 - Banco Original","336 - C6 Bank","290 - PagBank","380 - PicPay",
  "403 - Cora","323 - Mercado Pago","364 - Gerencianet/Efí","Outro",
];

const emptyForm = {
  nome: "", cpf: "", telefone: "", email: "", comissao_valor: "", dia_recebimento: "15",
};

const CHART_COLORS = ["#003572", "#2ecc71", "#e67e22", "#9b59b6", "#e74c3c", "#1abc9c", "#34495e", "#f39c12"];

const statusLabels: Record<string, { label: string; color: string }> = {
  novo: { label: "Novo", color: "bg-blue-100 text-blue-700" },
  em_andamento: { label: "Em Andamento", color: "bg-amber-100 text-amber-700" },
  concluido: { label: "Fechado", color: "bg-emerald-100 text-emerald-700" },
  perdido: { label: "Perdido", color: "bg-gray-100 text-gray-500" },
};

const saqueStatusLabels: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-amber-100 text-amber-700" },
  aprovado: { label: "Aprovado", color: "bg-blue-100 text-blue-700" },
  pago: { label: "Pago", color: "bg-emerald-100 text-emerald-700" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-600" },
};

export default function Afiliados() {
  const { usuario, isConsultor, isGestor, isDiretor, isAdmin, isCEO, canViewAllData } = useUsuario();
  const [busca, setBusca] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Afiliado | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [detalheAfiliado, setDetalheAfiliado] = useState<Afiliado | null>(null);
  const [detalheTab, setDetalheTab] = useState<"indicacoes" | "saques">("indicacoes");
  const [linkModal, setLinkModal] = useState<Afiliado | null>(null);
  const queryClient = useQueryClient();

  /* ─── Data Fetching ─── */
  const { data: consultores = [] } = useQuery<ConsultorInfo[]>({
    queryKey: ["consultores-afiliados"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("usuarios")
        .select("id, nome, slug, cooperativa, unidade_id")
        .eq("ativo", true)
        .order("nome");
      return data || [];
    },
  });

  const { data: allAfiliados = [], isLoading } = useQuery<Afiliado[]>({
    queryKey: ["afiliados"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("afiliados")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Afiliado[];
    },
  });

  const { data: allIndicacoes = [] } = useQuery<Indicacao[]>({
    queryKey: ["afiliado-indicacoes"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("afiliado_indicacoes")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: allSaques = [] } = useQuery<Saque[]>({
    queryKey: ["afiliado-saques"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("afiliado_saques")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  /* ─── Scope filtering by role ─── */
  const afiliados = useMemo(() => {
    if (canViewAllData) return allAfiliados;
    if (isGestor && usuario?.unidade_id) {
      const consultorIds = consultores
        .filter((c) => c.unidade_id === usuario.unidade_id)
        .map((c) => c.id);
      return allAfiliados.filter((a) => a.consultor_id && consultorIds.includes(a.consultor_id));
    }
    if (isConsultor && usuario?.id) {
      return allAfiliados.filter((a) => a.consultor_id === usuario.id);
    }
    return allAfiliados;
  }, [allAfiliados, usuario, isConsultor, isGestor, canViewAllData, consultores]);

  const filtered = afiliados.filter(
    (a) =>
      !busca ||
      a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (a.codigo ?? "").toLowerCase().includes(busca.toLowerCase()) ||
      (a.email ?? "").toLowerCase().includes(busca.toLowerCase())
  );

  /* ─── KPIs ─── */
  const totalAfiliados = afiliados.length;
  const totalAtivos = afiliados.filter((a) => a.ativo).length;
  const totalComissoes = afiliados.reduce((s, a) => s + Number(a.comissao_acumulada ?? 0), 0);
  const totalVendas = afiliados.reduce((s, a) => s + Number(a.vendas ?? 0), 0);
  const totalLeads = afiliados.reduce((s, a) => s + Number(a.leads ?? 0), 0);
  const saldoPendente = afiliados.reduce((s, a) => s + Number(a.saldo_disponivel ?? 0), 0);

  /* ─── Ranking (CEO/Diretor view) ─── */
  const ranking = useMemo(() => {
    return [...afiliados]
      .filter((a) => a.ativo)
      .sort((a, b) => (b.vendas || 0) - (a.vendas || 0))
      .slice(0, 10);
  }, [afiliados]);

  /* ─── Charts data ─── */
  const consultorChartData = useMemo(() => {
    const map = new Map<string, { nome: string; afiliados: number; vendas: number; comissoes: number }>();
    afiliados.forEach((a) => {
      const c = consultores.find((c) => c.id === a.consultor_id);
      const nome = c?.nome || "Sem Consultor";
      const curr = map.get(nome) || { nome, afiliados: 0, vendas: 0, comissoes: 0 };
      curr.afiliados += 1;
      curr.vendas += a.vendas || 0;
      curr.comissoes += Number(a.comissao_acumulada || 0);
      map.set(nome, curr);
    });
    return Array.from(map.values()).sort((a, b) => b.vendas - a.vendas).slice(0, 8);
  }, [afiliados, consultores]);

  const statusPieData = useMemo(() => {
    const afiliadoIds = new Set(afiliados.map((a) => a.id));
    const relevantIndicacoes = allIndicacoes.filter((i) => afiliadoIds.has(i.afiliado_id));
    const map: Record<string, number> = {};
    relevantIndicacoes.forEach((i) => {
      map[i.status] = (map[i.status] || 0) + 1;
    });
    return Object.entries(map).map(([status, count]) => ({
      name: statusLabels[status]?.label || status,
      value: count,
    }));
  }, [allIndicacoes, afiliados]);

  /* ─── CRUD ─── */
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
      dia_recebimento: String(a.dia_recebimento ?? 15),
    });
    setModalOpen(true);
  }

  async function salvar() {
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    const payload: Record<string, unknown> = {
      nome: form.nome.trim(),
      cpf: form.cpf.trim() || null,
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
      comissao_valor: parseFloat(form.comissao_valor) || 0,
      dia_recebimento: parseInt(form.dia_recebimento) || 15,
    };

    if (editando) {
      const { error } = await (supabase as any)
        .from("afiliados")
        .update(payload)
        .eq("id", editando.id);
      if (error) { toast.error("Erro: " + error.message); return; }
      toast.success("Afiliado atualizado");
    } else {
      payload.consultor_id = usuario?.id || null;
      const { error } = await (supabase as any).from("afiliados").insert(payload);
      if (error) { toast.error("Erro: " + error.message); return; }
      toast.success("Afiliado cadastrado com sucesso!");
    }
    queryClient.invalidateQueries({ queryKey: ["afiliados"] });
    setModalOpen(false);
    setEditando(null);
    setForm(emptyForm);
  }

  async function toggleAtivo(a: Afiliado) {
    const msg = a.ativo
      ? `Desativar "${a.nome}"? O portal e link de indicação dele pararão de funcionar.`
      : `Reativar "${a.nome}"?`;
    if (!window.confirm(msg)) return;
    const { error } = await (supabase as any)
      .from("afiliados")
      .update({ ativo: !a.ativo })
      .eq("id", a.id);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(a.ativo ? "Afiliado desativado" : "Afiliado ativado");
    queryClient.invalidateQueries({ queryKey: ["afiliados"] });
  }

  function copiarCodigo(text: string | null) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  }

  function getPortalLink(a: Afiliado) {
    return `${window.location.origin}/afiliado/${a.token_acesso}`;
  }

  function getReferralLink(a: Afiliado) {
    const c = consultores.find((c) => c.id === a.consultor_id);
    if (c?.slug) return `${window.location.origin}/c/${c.slug}?ref=${a.codigo}`;
    return `${window.location.origin}/cotacao?ref=${a.codigo}`;
  }

  function enviarLinkWhatsApp(a: Afiliado) {
    const portalUrl = getPortalLink(a);
    const refUrl = getReferralLink(a);
    const msg = encodeURIComponent(
      `Olá ${a.nome}! 🎉\n\nVocê foi cadastrado(a) como afiliado(a). Aqui estão seus links:\n\n` +
      `📋 *Seu Portal:*\n${portalUrl}\n\n` +
      `🔗 *Seu Link de Indicação:*\n${refUrl}\n\n` +
      `Compartilhe o link de indicação e acompanhe tudo pelo portal!`
    );
    const phone = (a.telefone || "").replace(/\D/g, "");
    window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
  }

  /* ─── Detalhes do afiliado ─── */
  const detalheIndicacoes = useMemo(() => {
    if (!detalheAfiliado) return [];
    return allIndicacoes.filter((i) => i.afiliado_id === detalheAfiliado.id);
  }, [detalheAfiliado, allIndicacoes]);

  const detalheSaques = useMemo(() => {
    if (!detalheAfiliado) return [];
    return allSaques.filter((s) => s.afiliado_id === detalheAfiliado.id);
  }, [detalheAfiliado, allSaques]);

  async function aprovarSaque(saqueId: string, valor: number, afNome: string) {
    if (!window.confirm(`Aprovar saque de R$ ${valor.toFixed(2)} de "${afNome}"?`)) return;
    const { error } = await (supabase as any)
      .from("afiliado_saques")
      .update({ status: "aprovado", aprovado_por: usuario?.id || null })
      .eq("id", saqueId);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Saque aprovado");
    queryClient.invalidateQueries({ queryKey: ["afiliado-saques"] });
  }

  async function pagarSaque(saqueId: string, valor: number, afNome: string) {
    if (!window.confirm(`Confirmar PAGAMENTO de R$ ${valor.toFixed(2)} para "${afNome}"? O saldo será debitado.`)) return;
    const { error } = await (supabase as any)
      .from("afiliado_saques")
      .update({ status: "pago", pago_em: new Date().toISOString() })
      .eq("id", saqueId);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Saque marcado como pago — saldo debitado automaticamente");
    queryClient.invalidateQueries({ queryKey: ["afiliado-saques"] });
    queryClient.invalidateQueries({ queryKey: ["afiliados"] });
  }

  function getConsultorNome(consultorId: string | null) {
    if (!consultorId) return "—";
    return consultores.find((c) => c.id === consultorId)?.nome || "—";
  }

  const kpis = [
    { label: "Total Afiliados", value: totalAfiliados, icon: UsersRound, color: "text-primary", bg: "bg-primary/8" },
    { label: "Ativos", value: totalAtivos, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Indicações", value: totalLeads, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Vendas Fechadas", value: totalVendas, icon: CheckCircle, color: "text-success", bg: "bg-success/8" },
    { label: "Comissões Pagas", value: `R$ ${totalComissoes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Saldo Pendente", value: `R$ ${saldoPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: Wallet, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md">
            <UsersRound className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Programa de Afiliados</h1>
            <p className="text-sm text-muted-foreground">
              {canViewAllData
                ? "Visão geral de todos os afiliados"
                : isGestor
                ? "Afiliados da sua unidade"
                : "Seus afiliados cadastrados"}
            </p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-white" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Novo Afiliado
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center shrink-0`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground truncate">{k.label}</p>
                <p className="text-lg font-bold text-foreground truncate">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="lista" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Lista</TabsTrigger>
          {(canViewAllData || isGestor) && (
            <TabsTrigger value="ranking" className="gap-1.5"><Trophy className="h-3.5 w-3.5" /> Ranking</TabsTrigger>
          )}
          {(canViewAllData || isGestor) && (
            <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Analytics</TabsTrigger>
          )}
          <TabsTrigger value="saques" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Saques</TabsTrigger>
        </TabsList>

        {/* ═══ TAB: LISTA ═══ */}
        <TabsContent value="lista" className="space-y-4">
          {/* Search */}
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9 border-border" placeholder="Buscar por nome, código ou email..." value={busca} onChange={(e) => setBusca(e.target.value)} />
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
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Contato</TableHead>
                      {canViewAllData && <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Consultor</TableHead>}
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Código</TableHead>
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Leads</TableHead>
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Vendas</TableHead>
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Comissão</TableHead>
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canViewAllData ? 9 : 8} className="text-center py-8 text-muted-foreground">
                          Nenhum afiliado encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((a, i) => (
                        <TableRow key={a.id} className={`${i % 2 === 0 ? "bg-card" : "bg-muted/30"} hover:bg-muted/40 transition-colors border-b-2 border-[#747474]`}>
                          <TableCell>
                            <button className="font-medium text-left hover:text-primary transition-colors" onClick={() => { setDetalheAfiliado(a); setDetalheTab("indicacoes"); }}>
                              {a.nome}
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-0.5">
                              {a.telefone && <p className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" />{a.telefone}</p>}
                              {a.email && <p className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{a.email}</p>}
                            </div>
                          </TableCell>
                          {canViewAllData && (
                            <TableCell className="text-sm text-muted-foreground">{getConsultorNome(a.consultor_id)}</TableCell>
                          )}
                          <TableCell>
                            <span
                              className="font-mono text-xs bg-muted/50 px-2 py-0.5 rounded cursor-pointer hover:bg-muted inline-flex items-center gap-1"
                              onClick={() => copiarCodigo(a.codigo)}
                              title="Copiar código"
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
                          <TableCell>
                            <div className="flex items-center justify-center gap-0.5">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLinkModal(a)} title="Links & Enviar">
                                <Send className="h-3.5 w-3.5 text-blue-600" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setDetalheAfiliado(a); setDetalheTab("indicacoes"); }} title="Detalhes">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
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
        </TabsContent>

        {/* ═══ TAB: RANKING ═══ */}
        <TabsContent value="ranking" className="space-y-4">
          <Card className="border-border">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" /> Ranking de Afiliados
              </h2>
              {ranking.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum afiliado ativo</p>
              ) : (
                <div className="space-y-2">
                  {ranking.map((a, i) => (
                    <div key={a.id} className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${i < 3 ? "bg-amber-50/50 border border-amber-100" : "bg-muted/20 border border-transparent"}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        i === 0 ? "bg-amber-400 text-white" :
                        i === 1 ? "bg-gray-300 text-gray-700" :
                        i === 2 ? "bg-amber-600 text-white" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{a.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {getConsultorNome(a.consultor_id)} · {a.leads || 0} leads
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-success">{a.vendas || 0} vendas</p>
                        <p className="text-xs text-muted-foreground">
                          R$ {Number(a.comissao_acumulada || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB: ANALYTICS ═══ */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Performance por Consultor */}
            <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-foreground mb-4">Vendas por Afiliados por Consultor</h3>
                {consultorChartData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Sem dados</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={consultorChartData} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={100} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, fontSize: 12 }}
                        formatter={(val: number) => [val, ""]}
                      />
                      <Bar dataKey="vendas" fill="#003572" radius={[0, 4, 4, 0]} name="Vendas" />
                      <Bar dataKey="afiliados" fill="#2ecc71" radius={[0, 4, 4, 0]} name="Afiliados" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Status das Indicações */}
            <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-foreground mb-4">Status das Indicações</h3>
                {statusPieData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Sem dados</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {statusPieData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ TAB: SAQUES ═══ */}
        <TabsContent value="saques" className="space-y-4">
          <Card className="border-border overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary border-b-0">
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Afiliado</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Valor</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Data</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                    {(canViewAllData || isGestor) && (
                      <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-center">Ações</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allSaques.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum saque solicitado
                      </TableCell>
                    </TableRow>
                  ) : (
                    allSaques.map((s, i) => {
                      const af = allAfiliados.find((a) => a.id === s.afiliado_id);
                      const st = saqueStatusLabels[s.status] || saqueStatusLabels.pendente;
                      return (
                        <TableRow key={s.id} className={`${i % 2 === 0 ? "bg-card" : "bg-muted/30"} hover:bg-muted/40 transition-colors border-b-2 border-[#747474]`}>
                          <TableCell className="font-medium">{af?.nome || "—"}</TableCell>
                          <TableCell className="font-semibold">R$ {Number(s.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(s.created_at).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell>
                            <Badge className={st.color}>{st.label}</Badge>
                          </TableCell>
                          {(canViewAllData || isGestor) && (
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                {s.status === "pendente" && (
                                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => aprovarSaque(s.id, Number(s.valor), af?.nome || "—")}>
                                    <CheckCircle className="h-3 w-3" /> Aprovar
                                  </Button>
                                )}
                                {s.status === "aprovado" && (
                                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-success border-success/30" onClick={() => pagarSaque(s.id, Number(s.valor), af?.nome || "—")}>
                                    <DollarSign className="h-3 w-3" /> Pagar
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══ MODAL: CRIAR/EDITAR ═══ */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Afiliado" : "Cadastrar Novo Afiliado"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium">Nome completo *</Label>
              <Input className="mt-1" placeholder="Nome do afiliado" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Email</Label>
                <Input className="mt-1" type="email" placeholder="email@exemplo.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs font-medium">Telefone</Label>
                <Input className="mt-1" placeholder="(00) 00000-0000" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">CPF</Label>
              <Input className="mt-1" placeholder="000.000.000-00" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Comissão por venda (R$)</Label>
                <Input className="mt-1" type="number" placeholder="150.00" min={0} step="0.01" value={form.comissao_valor} onChange={(e) => setForm({ ...form, comissao_valor: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs font-medium">Dia recebimento (mês)</Label>
                <Input className="mt-1" type="number" placeholder="15" min={1} max={31} value={form.dia_recebimento} onChange={(e) => setForm({ ...form, dia_recebimento: e.target.value })} />
              </div>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90 text-white" onClick={salvar}>
              {editando ? "Salvar Alterações" : "Cadastrar Afiliado"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL: LINKS & ENVIAR ═══ */}
      <Dialog open={!!linkModal} onOpenChange={() => setLinkModal(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Links de {linkModal?.nome}
            </DialogTitle>
          </DialogHeader>
          {linkModal && (
            <div className="space-y-4">
              {/* Portal Link */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Link do Portal (acesso do afiliado)</Label>
                <div className="mt-1 flex gap-2">
                  <Input readOnly value={getPortalLink(linkModal)} className="font-mono text-xs" />
                  <Button variant="outline" size="icon" className="shrink-0" onClick={() => copiarCodigo(getPortalLink(linkModal))}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Referral Link */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Link de Indicação (para o afiliado compartilhar)</Label>
                <div className="mt-1 flex gap-2">
                  <Input readOnly value={getReferralLink(linkModal)} className="font-mono text-xs" />
                  <Button variant="outline" size="icon" className="shrink-0" onClick={() => copiarCodigo(getReferralLink(linkModal))}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <Button
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white gap-2"
                  onClick={() => enviarLinkWhatsApp(linkModal)}
                  disabled={!linkModal.telefone}
                >
                  <Share2 className="h-4 w-4" />
                  Enviar Links via WhatsApp
                </Button>
                {!linkModal.telefone && (
                  <p className="text-xs text-destructive text-center">Afiliado não tem telefone cadastrado</p>
                )}
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => window.open(getPortalLink(linkModal), "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir Portal do Afiliado
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL: DETALHE DO AFILIADO ═══ */}
      <Dialog open={!!detalheAfiliado} onOpenChange={() => setDetalheAfiliado(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              {detalheAfiliado?.nome}
              {detalheAfiliado?.ativo ? (
                <Badge className="bg-success/10 text-success ml-2">Ativo</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-500 ml-2">Inativo</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {detalheAfiliado && (
            <div className="space-y-4">
              {/* Mini KPIs */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Leads", value: detalheAfiliado.leads || 0, color: "text-blue-600" },
                  { label: "Vendas", value: detalheAfiliado.vendas || 0, color: "text-success" },
                  { label: "Comissão", value: `R$ ${Number(detalheAfiliado.comissao_acumulada || 0).toFixed(2)}`, color: "text-purple-600" },
                  { label: "Saldo", value: `R$ ${Number(detalheAfiliado.saldo_disponivel || 0).toFixed(2)}`, color: "text-amber-600" },
                ].map((k) => (
                  <div key={k.label} className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">{k.label}</p>
                    <p className={`text-sm font-bold ${k.color}`}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm bg-muted/20 p-3 rounded-lg">
                <p><span className="text-muted-foreground">Código:</span> <span className="font-mono font-semibold">{detalheAfiliado.codigo}</span></p>
                <p><span className="text-muted-foreground">Comissão/venda:</span> <span className="font-semibold">R$ {Number(detalheAfiliado.comissao_valor || 0).toFixed(2)}</span></p>
                <p><span className="text-muted-foreground">Telefone:</span> {detalheAfiliado.telefone || "—"}</p>
                <p><span className="text-muted-foreground">Email:</span> {detalheAfiliado.email || "—"}</p>
                <p><span className="text-muted-foreground">Consultor:</span> {getConsultorNome(detalheAfiliado.consultor_id)}</p>
                <p><span className="text-muted-foreground">Dia pgto:</span> {detalheAfiliado.dia_recebimento || 15}</p>
                {detalheAfiliado.chave_pix && <p><span className="text-muted-foreground">PIX:</span> {detalheAfiliado.chave_pix}</p>}
                {detalheAfiliado.banco && <p><span className="text-muted-foreground">Banco:</span> {detalheAfiliado.banco}</p>}
              </div>

              {/* Sub Tabs */}
              <div className="flex gap-2 border-b">
                <button
                  onClick={() => setDetalheTab("indicacoes")}
                  className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${detalheTab === "indicacoes" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
                >
                  Indicações ({detalheIndicacoes.length})
                </button>
                <button
                  onClick={() => setDetalheTab("saques")}
                  className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${detalheTab === "saques" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
                >
                  Saques ({detalheSaques.length})
                </button>
              </div>

              {detalheTab === "indicacoes" && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {detalheIndicacoes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma indicação</p>
                  ) : (
                    detalheIndicacoes.map((ind) => {
                      const st = statusLabels[ind.status] || statusLabels.novo;
                      return (
                        <div key={ind.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{ind.lead_nome || "Sem nome"}</p>
                            <p className="text-xs text-muted-foreground">{new Date(ind.created_at).toLocaleDateString("pt-BR")}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {ind.status === "concluido" && (
                              <span className="text-xs font-semibold text-success">
                                R$ {Number(ind.comissao_valor || 0).toFixed(2)}
                                {ind.pago ? " ✓" : ""}
                              </span>
                            )}
                            <Badge className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {detalheTab === "saques" && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {detalheSaques.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum saque</p>
                  ) : (
                    detalheSaques.map((s) => {
                      const st = saqueStatusLabels[s.status] || saqueStatusLabels.pendente;
                      return (
                        <div key={s.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                          <div>
                            <p className="font-semibold text-sm">R$ {Number(s.valor).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString("pt-BR")}</p>
                          </div>
                          <Badge className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
