import { useState } from "react";
import { ArrowLeft, Table2, Info, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface PlanoComposicao {
  grupo_id: string;
  grupo_nome: string;
  grupo_ativo: boolean;
  qtd_produtos: number;
  qtd_obrigatorios: number;
  valor_total_produtos: number;
  valor_obrigatorios: number;
}

interface ProdutoItem {
  id: string;
  nome: string;
  valor: number;
  classificacao: string | null;
  obrigatorio: boolean;
}

function fmt(v: number) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface Props { onBack: () => void; }

export default function TabelaPlanos({ onBack }: Props) {
  const [regional, setRegional] = useState("todas");
  const [tipoVeiculo, setTipoVeiculo] = useState("todos");
  const [detalheGrupoId, setDetalheGrupoId] = useState<string | null>(null);

  // Composição dinâmica (view v_plano_composicao)
  const { data: planos = [], isLoading } = useQuery({
    queryKey: ["v-plano-composicao"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("v_plano_composicao")
        .select("*")
        .eq("grupo_ativo", true)
        .order("grupo_nome");
      if (error) throw error;
      return (data || []) as PlanoComposicao[];
    },
  });

  const { data: regionais = [] } = useQuery({
    queryKey: ["regionais-tp"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("regionais").select("id, nome, codigo_numerico").eq("ativo", true).order("codigo_numerico");
      return data || [];
    },
  });

  // Detalhe dinâmico — produtos do grupo selecionado
  const { data: produtosDetalhe = [] } = useQuery({
    queryKey: ["detalhe-grupo", detalheGrupoId],
    enabled: !!detalheGrupoId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("grupo_produto_itens")
        .select(`
          obrigatorio,
          produtos_gia(id, nome, valor, valor_base, classificacao)
        `)
        .eq("grupo_id", detalheGrupoId);
      return (data || [])
        .map((x: any) => ({
          id: x.produtos_gia?.id,
          nome: x.produtos_gia?.nome,
          valor: Number(x.produtos_gia?.valor || x.produtos_gia?.valor_base || 0),
          classificacao: x.produtos_gia?.classificacao,
          obrigatorio: x.obrigatorio || false,
        }))
        .filter((p: any) => p.id) as ProdutoItem[];
    },
  });

  const planoSelecionado = planos.find(p => p.grupo_id === detalheGrupoId);
  const totalMensalDetalhe = produtosDetalhe.reduce((s, p) => s + p.valor, 0);

  return (
    <div className="p-6 lg:px-8 flex flex-col min-h-[calc(100vh-7.5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Financeiro
        </Button>
        <span className="text-muted-foreground">/</span>
        <Table2 className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Tabela de Planos</h1>
      </div>

      {/* Info — explica que os valores são dinâmicos */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg flex items-start gap-2 text-xs">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-900 dark:text-blue-200">Valores dinâmicos por composição de produtos</p>
          <p className="text-blue-700 dark:text-blue-300 mt-0.5">
            O valor final do plano para cada veículo é calculado como: <strong>Σ produtos selecionados + Taxa Admin (cota FIP) + Rateio</strong>.
            Os valores exibidos abaixo são a <strong>soma dos produtos vinculados a cada grupo</strong> (sem taxa admin/rateio).
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-5">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1.5 min-w-[200px]">
              <span className="text-xs font-medium text-muted-foreground">Regional</span>
              <Select value={regional} onValueChange={setRegional}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {regionais.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.codigo_numerico ? `${r.codigo_numerico}. ` : ""}{r.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <span className="text-xs font-medium text-muted-foreground">Tipo de Veículo</span>
              <Select value={tipoVeiculo} onValueChange={setTipoVeiculo}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="AUTOMOVEL">Automóvel</SelectItem>
                  <SelectItem value="UTILITARIOS">Utilitários</SelectItem>
                  <SelectItem value="MOTOCICLETA">Motocicleta</SelectItem>
                  <SelectItem value="PESADOS">Pesados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Planos com composição dinâmica */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Carregando composição...</span>
        </div>
      ) : planos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum grupo de produtos ativo. Cadastre grupos em Cadastro → Grupo de Cadastros.
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plano / Grupo</TableHead>
                  <TableHead className="text-right">Produtos</TableHead>
                  <TableHead className="text-right">Obrigatórios</TableHead>
                  <TableHead className="text-right">Soma Produtos</TableHead>
                  <TableHead className="text-right">Apenas Obrigatórios</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planos.map((p) => (
                  <TableRow
                    key={p.grupo_id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setDetalheGrupoId(p.grupo_id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium">{p.grupo_nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <Badge variant="outline">{p.qtd_produtos}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {p.qtd_obrigatorios > 0 ? (
                        <Badge className="bg-amber-500/10 text-amber-700 text-[10px]">{p.qtd_obrigatorios}</Badge>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-primary">{fmt(p.valor_total_produtos)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(p.valor_obrigatorios)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="h-7 text-xs">Ver composição</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Detalhes com produtos reais */}
      <Dialog open={!!detalheGrupoId} onOpenChange={(open) => !open && setDetalheGrupoId(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-primary" />
              {planoSelecionado?.grupo_nome || "Plano"} — Composição
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between p-3 bg-muted rounded-lg text-sm">
              <span className="text-muted-foreground">{produtosDetalhe.length} produtos vinculados</span>
              <span className="font-bold font-mono text-primary">{fmt(totalMensalDetalhe)}/mês</span>
            </div>

            <div>
              <p className="text-xs font-semibold mb-2 text-muted-foreground">PRODUTOS DO PLANO</p>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-medium">Nome</th>
                      <th className="text-left px-3 py-2 text-xs font-medium">Classificação</th>
                      <th className="text-center px-3 py-2 text-xs font-medium">Tipo</th>
                      <th className="text-right px-3 py-2 text-xs font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosDetalhe.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-4 text-muted-foreground text-xs">Nenhum produto vinculado</td></tr>
                    ) : produtosDetalhe.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="px-3 py-2 text-sm">{p.nome}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{p.classificacao || "—"}</td>
                        <td className="px-3 py-2 text-center">
                          {p.obrigatorio ? (
                            <Badge className="bg-amber-500/10 text-amber-700 text-[10px]">Obrigatório</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Opcional</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-sm">{fmt(p.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded text-xs text-amber-800 dark:text-amber-200">
              <strong>Nota:</strong> o valor final cobrado por veículo inclui ainda Taxa Administrativa (cota FIP) + Rateio,
              que são calculados dinamicamente pela categoria e valor FIPE.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
