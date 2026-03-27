import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProdutosElegiveis(categoriaId?: string, regionalId?: string, planoId?: string) {
  return useQuery({
    queryKey: ["produtos_elegiveis", categoriaId, regionalId, planoId],
    enabled: !!categoriaId && !!regionalId && !!planoId,
    queryFn: async () => {
      // Buscar produtos do plano que têm regra para esta categoria+regional
      const { data } = await supabase
        .from("plano_produtos")
        .select("produto_id, produtos_gia!inner(id, nome, valor_base, tipo, ativo, produto_regras!inner(categoria_id, regional_id, ativo))")
        .eq("plano_id", planoId!)
        .eq("produtos_gia.ativo", true)
        .eq("produtos_gia.produto_regras.categoria_id", categoriaId!)
        .eq("produtos_gia.produto_regras.regional_id", regionalId!)
        .eq("produtos_gia.produto_regras.ativo", true);
      return data || [];
    }
  });
}

export function useProdutosPorCategoria(categoriaId?: string) {
  return useQuery({
    queryKey: ["produtos_gia_por_categoria", categoriaId],
    enabled: !!categoriaId,
    queryFn: async () => {
      const { data } = await supabase
        .from("produto_regras")
        .select("produto_id, produtos_gia(id, nome, valor_base, tipo)")
        .eq("categoria_id", categoriaId!)
        .eq("ativo", true);
      return (data || [])
        .map((r: any) => r.produtos_gia)
        .filter(Boolean) as { id: string; nome: string; valor_base: number; tipo: string }[];
    }
  });
}

export function useCategoriaVeiculo(nomeCategoria?: string) {
  return useQuery({
    queryKey: ["categoria_veiculo", nomeCategoria],
    enabled: !!nomeCategoria,
    queryFn: async () => {
      const { data } = await supabase
        .from("categorias_veiculo")
        .select("id, nome")
        .eq("nome", nomeCategoria!)
        .maybeSingle();
      return data as { id: string; nome: string } | null;
    }
  });
}
