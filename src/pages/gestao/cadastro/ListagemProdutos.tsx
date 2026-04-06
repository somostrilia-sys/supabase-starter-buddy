import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CLASSIFICACOES = [
  "TODAS", "CARRO RESERVA", "PROTEÇÃO TERCEIROS", "ASSISTÊNCIA 24HRS",
  "PRODUTO ADICIONAL VEICULO", "PRODUTO ADICIONAL ASSOCIADO",
  "TAXA ADMINISTRATIVA", "VIDROS", "RASTREADOR", "OUTROS", "NAO INFORMADO",
];

const TIPOS_VEICULO = [
  "TODOS", "AUTOMOVEL", "UTILITARIOS", "MOTOCICLETA", "PESADOS", "VANS E PESADOS P.P",
];

const fmt = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ListagemProdutos() {
  const [filtros, setFiltros] = useState({
    nome: "", fornecedor: "TODOS", classificacao: "TODAS",
    tipo_veiculo: "TODOS", regional: "TODAS", cooperativa: "TODAS", status: "ATIVO",
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ["forn-list"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("fornecedores").select("id, nome").eq("ativo", true).order("nome");
      return data || [];
    },
  });

  const { data: regionais = [] } = useQuery({
    queryKey: ["reg-list"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("regionais").select("id, nome, codigo_numerico").eq("ativo", true).order("codigo_numerico");
      return data || [];
    },
  });

  const { data: cooperativas = [] } = useQuery({
    queryKey: ["coop-list"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("cooperativas").select("id, nome").order("nome");
      return data || [];
    },
  });

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["listagem-produtos", filtros],
    queryFn: async () => {
      let q = (supabase as any).from("produtos_gia").select(`
        *,
        fornecedor:fornecedor_id(id, nome),
        produto_regras(regional_id, regionais(id, nome)),
        produto_cooperativas(cooperativa_id, cooperativas(id, nome))
      `);

      if (filtros.nome) q = q.ilike("nome", `%${filtros.nome}%`);
      if (filtros.fornecedor !== "TODOS") q = q.eq("fornecedor_id", filtros.fornecedor);
      if (filtros.classificacao !== "TODAS") q = q.eq("classificacao", filtros.classificacao);
      if (filtros.tipo_veiculo !== "TODOS") q = q.in("tipo", [filtros.tipo_veiculo, "TODOS"]);
      if (filtros.status === "ATIVO") q = q.eq("ativo", true);
      if (filtros.status === "INATIVO") q = q.eq("ativo", false);

      const { data, error } = await q.order("nome").limit(500);
      if (error) throw error;

      let rows = data || [];

      // Client-side filter por regional / cooperativa (vínculos N:N)
      if (filtros.regional !== "TODAS") {
        rows = rows.filter((p: any) =>
          (p.produto_regras || []).some((r: any) => r.regional_id === filtros.regional)
        );
      }
      if (filtros.cooperativa !== "TODAS") {
        rows = rows.filter((p: any) =>
          (p.produto_cooperativas || []).some((c: any) => c.cooperativa_id === filtros.cooperativa)
        );
      }

      return rows;
    },
  });

  const total = produtos.length;
  const totalAtivo = useMemo(() => produtos.filter((p: any) => p.ativo).length, [produtos]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Package className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-bold">Listagem Geral de Produtos</h2>
          <p className="text-xs text-muted-foreground">{total} produtos · {totalAtivo} ativos</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Nome</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={filtros.nome} onChange={e => setFiltros({ ...filtros, nome: e.target.value })} className="pl-9 h-9" placeholder="Buscar..." />
            </div>
          </div>
          <div>
            <Label className="text-xs">Fornecedor</Label>
            <Select value={filtros.fornecedor} onValueChange={v => setFiltros({ ...filtros, fornecedor: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                {fornecedores.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Classificação</Label>
            <Select value={filtros.classificacao} onValueChange={v => setFiltros({ ...filtros, classificacao: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CLASSIFICACOES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tipo Veículo</Label>
            <Select value={filtros.tipo_veiculo} onValueChange={v => setFiltros({ ...filtros, tipo_veiculo: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS_VEICULO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Regional</Label>
            <Select value={filtros.regional} onValueChange={v => setFiltros({ ...filtros, regional: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas</SelectItem>
                {regionais.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.codigo_numerico ? `${r.codigo_numerico}. ` : ""}{r.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Cooperativa</Label>
            <Select value={filtros.cooperativa} onValueChange={v => setFiltros({ ...filtros, cooperativa: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas</SelectItem>
                {cooperativas.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={filtros.status} onValueChange={v => setFiltros({ ...filtros, status: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="ATIVO">Ativo</SelectItem>
                <SelectItem value="INATIVO">Inativo</SelectItem>
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
                  <TableHead>Cód. SGA</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Classificação</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Regionais</TableHead>
                  <TableHead>Cooperativas</TableHead>
                  <TableHead>Obrig.</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs font-mono text-muted-foreground">{p.codigo_sga || "—"}</TableCell>
                    <TableCell className="text-sm font-medium max-w-[220px] truncate">{p.nome}</TableCell>
                    <TableCell className="text-xs">{p.fornecedor?.nome || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{p.classificacao || "—"}</Badge></TableCell>
                    <TableCell className="text-xs">{p.tipo || "TODOS"}</TableCell>
                    <TableCell className="text-sm font-mono text-right">{fmt(Number(p.valor || p.valor_base || 0))}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-0.5 max-w-[120px]">
                        {(p.produto_regras || []).slice(0, 2).map((r: any, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[9px] px-1">{r.regionais?.nome?.split(" ")[0]}</Badge>
                        ))}
                        {(p.produto_regras || []).length > 2 && (
                          <Badge variant="secondary" className="text-[9px] px-1">+{(p.produto_regras || []).length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] text-muted-foreground">{(p.produto_cooperativas || []).length}</span>
                    </TableCell>
                    <TableCell>
                      {p.obrigatorio ? <Badge className="bg-amber-500/10 text-amber-700 text-[10px]">Sim</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={p.ativo ? "bg-emerald-500/10 text-emerald-600 text-[10px]" : "bg-muted text-muted-foreground text-[10px]"}>
                        {p.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {produtos.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Nenhum produto encontrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
