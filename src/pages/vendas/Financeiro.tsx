import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  DollarSign, Receipt, AlertTriangle, ChevronDown, RotateCcw,
  Search, Loader2, TrendingUp, Calendar,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUsuario } from "@/hooks/useUsuario";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

async function fetchConcluidos(scope?: { consultor?: string; cooperativas?: string[] }) {
  let q = (supabase as any)
    .from("negociacoes")
    .select("id, codigo, lead_nome, cpf_cnpj, telefone, email, veiculo_modelo, veiculo_placa, plano, valor_plano, stage, consultor, cooperativa, origem, created_at, venda_concluida_em")
    .eq("stage", "concluido")
    .order("venda_concluida_em", { ascending: false });
  if (scope?.consultor) q = q.eq("consultor", scope.consultor);
  if (scope?.cooperativas && scope.cooperativas.length > 0) q = q.in("cooperativa", scope.cooperativas);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as Array<{
    id: string;
    codigo: string;
    lead_nome: string;
    cpf_cnpj: string;
    telefone: string;
    email: string;
    veiculo_modelo: string;
    veiculo_placa: string;
    plano: string;
    valor_plano: number;
    stage: string;
    consultor: string;
    cooperativa: string;
    origem: string;
    created_at: string;
    venda_concluida_em: string | null;
  }>;
}

export default function Financeiro() {
  const { usuario, isConsultor, isGestor, canViewAllData, cooperativas: minhasCoops } = useUsuario();
  const [tab, setTab] = useState("vendas");
  const [search, setSearch] = useState("");
  const [filterConsultor, setFilterConsultor] = useState("all");
  const [filterCooperativa, setFilterCooperativa] = useState("all");

  const scope = useMemo(() => {
    if (canViewAllData) return undefined;
    if (isGestor && minhasCoops.length > 0) return { cooperativas: minhasCoops };
    if (isConsultor && usuario?.nome) return { consultor: usuario.nome };
    return undefined;
  }, [canViewAllData, isConsultor, isGestor, usuario?.nome, minhasCoops]);

  const { data: concluidos = [], isLoading } = useQuery({
    queryKey: ["financeiro-concluidos", scope?.consultor, scope?.cooperativas?.join(",")],
    queryFn: () => fetchConcluidos(scope),
  });

  // Derived data
  const totalFaturamento = useMemo(
    () => concluidos.reduce((s, v) => s + (v.valor_plano || 0), 0),
    [concluidos]
  );

  const totalVendas = concluidos.length;

  const consultoresUnicos = useMemo(
    () => [...new Set(concluidos.map((c) => c.consultor).filter(Boolean))],
    [concluidos]
  );

  const cooperativasUnicas = useMemo(
    () => [...new Set(concluidos.map((c) => c.cooperativa).filter(Boolean))],
    [concluidos]
  );

  const ticketMedio = totalVendas > 0 ? totalFaturamento / totalVendas : 0;

  // Chart data: group by month
  const chartData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of concluidos) {
      const d = v.venda_concluida_em ? new Date(v.venda_concluida_em) : new Date(v.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + (v.valor_plano || 0);
    }
    const sorted = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    return sorted.map(([key, valor]) => {
      const [y, m] = key.split("-");
      return { mes: `${MONTH_LABELS[parseInt(m) - 1]}/${y.slice(2)}`, valor };
    });
  }, [concluidos]);

  // Fetch comissao_pct per consultor
  const { data: usuariosComissao = [] } = useQuery({
    queryKey: ["usuarios-comissao-pct"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("usuarios").select("nome, comissao_pct").eq("ativo", true);
      return (data || []) as { nome: string; comissao_pct: number | null }[];
    },
  });

  const comissoesPorConsultor = useMemo(() => {
    const pctMap: Record<string, number> = {};
    usuariosComissao.forEach((u: any) => { pctMap[u.nome] = Number(u.comissao_pct) || 10; });

    const map: Record<string, { total: number; count: number; pct: number }> = {};
    for (const v of concluidos) {
      const c = v.consultor || "Sem consultor";
      if (!map[c]) map[c] = { total: 0, count: 0, pct: pctMap[c] || 10 };
      map[c].total += v.valor_plano || 0;
      map[c].count += 1;
    }
    return Object.entries(map).map(([consultor, data]) => ({
      consultor,
      totalVendido: data.total,
      qtdVendas: data.count,
      pct: data.pct,
      comissao10: data.total * (data.pct / 100),
    }));
  }, [concluidos, usuariosComissao]);

  const totalComissoes = comissoesPorConsultor.reduce((s, c) => s + c.comissao10, 0);

  // Filter list
  const filtered = useMemo(() => {
    let list = concluidos;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.lead_nome?.toLowerCase().includes(s) ||
          v.codigo?.toLowerCase().includes(s) ||
          v.veiculo_placa?.toLowerCase().includes(s)
      );
    }
    if (filterConsultor !== "all") list = list.filter((v) => v.consultor === filterConsultor);
    if (filterCooperativa !== "all") list = list.filter((v) => v.cooperativa === filterCooperativa);
    return list;
  }, [concluidos, search, filterConsultor, filterCooperativa]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Carregando dados financeiros...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-sm text-muted-foreground">
          Faturamento real de vendas concluidas ({totalVendas} vendas)
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="vendas" className="text-xs">Faturamento</TabsTrigger>
          <TabsTrigger value="lista" className="text-xs">Vendas Recentes</TabsTrigger>
          <TabsTrigger value="comissoes" className="text-xs">Comissoes</TabsTrigger>
        </TabsList>

        {/* TAB 1 - FATURAMENTO */}
        <TabsContent value="vendas" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/8 dark:bg-green-950/30 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xl font-bold">{fmt(totalFaturamento)}</p>
                  <p className="text-xs text-muted-foreground">Faturamento Total</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/6 dark:bg-blue-950/30 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{totalVendas}</p>
                  <p className="text-xs text-muted-foreground">Vendas Concluidas</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/8 dark:bg-amber-950/30 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xl font-bold">{fmt(ticketMedio)}</p>
                  <p className="text-xs text-muted-foreground">Ticket Medio</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/8 dark:bg-red-950/30 flex items-center justify-center">
                  <RotateCcw className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xl font-bold">{fmt(totalComissoes)}</p>
                  <p className="text-xs text-muted-foreground">Total Comissoes</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3">Faturamento por Mes</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="valor" fill="#22C55E" radius={[4, 4, 0, 0]} name="Faturamento" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {chartData.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                Nenhuma venda concluida para exibir no grafico.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 2 - VENDAS RECENTES */}
        <TabsContent value="lista" className="space-y-4">
          <div className="flex flex-wrap gap-2 items-end">
            <Select value={filterConsultor} onValueChange={setFilterConsultor}>
              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Consultor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Consultores</SelectItem>
                {consultoresUnicos.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCooperativa} onValueChange={setFilterCooperativa}>
              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Cooperativa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Cooperativas</SelectItem>
                {cooperativasUnicas.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="h-8 text-xs pl-7 w-44"
                placeholder="Nome, placa ou codigo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Codigo</TableHead>
                    <TableHead className="text-xs">Lead</TableHead>
                    <TableHead className="text-xs">Veiculo</TableHead>
                    <TableHead className="text-xs">Plano</TableHead>
                    <TableHead className="text-xs text-right">Valor</TableHead>
                    <TableHead className="text-xs">Consultor</TableHead>
                    <TableHead className="text-xs">Cooperativa</TableHead>
                    <TableHead className="text-xs">Data Venda</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                        Nenhuma venda concluida encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="text-xs font-mono">{v.codigo || v.id}</TableCell>
                      <TableCell className="text-sm font-medium">{v.lead_nome}</TableCell>
                      <TableCell className="text-xs">
                        <div>{v.veiculo_modelo}</div>
                        <span className="font-mono text-muted-foreground">{v.veiculo_placa}</span>
                      </TableCell>
                      <TableCell className="text-xs">{v.plano}</TableCell>
                      <TableCell className="text-sm text-right font-medium">{fmt(v.valor_plano || 0)}</TableCell>
                      <TableCell className="text-xs">{v.consultor || "—"}</TableCell>
                      <TableCell className="text-xs">{v.cooperativa || "—"}</TableCell>
                      <TableCell className="text-xs">
                        {v.venda_concluida_em
                          ? new Date(v.venda_concluida_em).toLocaleDateString("pt-BR")
                          : new Date(v.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3 - COMISSOES */}
        <TabsContent value="comissoes" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xl font-bold text-success">{fmt(totalFaturamento)}</p>
                <p className="text-xs text-muted-foreground">Total Vendido</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xl font-bold text-warning">{fmt(totalComissoes)}</p>
                <p className="text-xs text-muted-foreground">Total Comissoes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xl font-bold">
                  {consultoresUnicos.length > 0
                    ? fmt(totalComissoes / consultoresUnicos.length)
                    : fmt(0)}
                </p>
                <p className="text-xs text-muted-foreground">Media por Consultor</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Consultor</TableHead>
                    <TableHead className="text-xs text-right">Qtd Vendas</TableHead>
                    <TableHead className="text-xs text-right">Total Vendido</TableHead>
                    <TableHead className="text-xs text-right">Comissao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comissoesPorConsultor.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                        Nenhuma comissao disponivel.
                      </TableCell>
                    </TableRow>
                  )}
                  {comissoesPorConsultor.map((c) => (
                    <TableRow key={c.consultor}>
                      <TableCell className="text-sm font-medium">{c.consultor}</TableCell>
                      <TableCell className="text-sm text-right">{c.qtdVendas}</TableCell>
                      <TableCell className="text-sm text-right">{fmt(c.totalVendido)}</TableCell>
                      <TableCell className="text-sm text-right font-bold">{fmt(c.comissao10)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
