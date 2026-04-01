import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, ChevronDown, ChevronRight } from "lucide-react";

interface ProdutoGia {
  id: string;
  nome: string;
  categoria: string | null;
  valor: number | null;
  descricao: string | null;
}

interface GrupoProduto {
  id: string;
  nome: string;
  descricao: string | null;
  produtos_ids: string[] | null;
  ativo: boolean;
  created_at: string;
}

export default function PlanosTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: planos, isLoading: loadingPlanos } = useQuery({
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

  const { data: produtos } = useQuery({
    queryKey: ["produtos_gia_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos_gia")
        .select("id, nome, categoria, valor, descricao")
        .order("nome");
      if (error) throw error;
      return (data || []) as ProdutoGia[];
    },
  });

  const produtosMap = new Map<string, ProdutoGia>();
  produtos?.forEach((p) => produtosMap.set(p.id, p));

  const getProdutosDoPlano = (ids: string[] | null): ProdutoGia[] => {
    if (!ids || !produtos) return [];
    return ids.map((id) => produtosMap.get(id)).filter(Boolean) as ProdutoGia[];
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
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
          Visualize os planos cadastrados e seus produtos vinculados
        </p>
      </div>

      {!planos || planos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum plano cadastrado na tabela grupos_produtos.
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
                  <TableHead>Descricao</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planos.map((plano) => {
                  const produtosDoPlano = getProdutosDoPlano(plano.produtos_ids);
                  const isExpanded = expandedId === plano.id;
                  return (
                    <>
                      <TableRow
                        key={plano.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleExpand(plano.id)}
                      >
                        <TableCell>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{plano.nome}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {plano.descricao || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={plano.ativo ? "default" : "secondary"}
                            className={
                              plano.ativo
                                ? "bg-emerald-500/10 text-emerald-600 border-success/20"
                                : ""
                            }
                          >
                            {plano.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {produtosDoPlano.length} produto{produtosDoPlano.length !== 1 ? "s" : ""}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(plano.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${plano.id}-detail`}>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            {produtosDoPlano.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                Nenhum produto vinculado a este plano.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-sm font-medium mb-2">Produtos vinculados:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {produtosDoPlano.map((prod) => (
                                    <div
                                      key={prod.id}
                                      className="flex items-center gap-2 p-2 rounded-md border bg-card"
                                    >
                                      <Package className="h-4 w-4 text-primary shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{prod.nome}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          {prod.categoria && <span>{prod.categoria}</span>}
                                          {prod.valor != null && (
                                            <span>
                                              R$ {prod.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
