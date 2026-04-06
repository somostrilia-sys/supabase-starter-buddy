import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tag, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function GrupoTagsTab() {
  const { data: tags = [], isLoading: loadingTags } = useQuery({
    queryKey: ["relatorio-tags"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("tags").select("id, nome, cor").order("nome");
      return data || [];
    },
  });

  const { data: negTags = [], isLoading: loadingNegTags } = useQuery({
    queryKey: ["relatorio-neg-tags"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("negociacao_tags").select("tag_id, negociacao_id");
      return data || [];
    },
  });

  const { data: negsStage = [] } = useQuery({
    queryKey: ["relatorio-negs-stage-tags"],
    queryFn: async () => {
      const ids = negTags.map((nt: any) => nt.negociacao_id);
      if (ids.length === 0) return [];
      const { data } = await (supabase as any).from("negociacoes").select("id, stage").in("id", ids.slice(0, 500));
      return data || [];
    },
    enabled: negTags.length > 0,
  });

  const tagStats = useMemo(() => {
    const stageMap: Record<string, string> = {};
    negsStage.forEach((n: any) => { stageMap[n.id] = n.stage; });

    return tags.map((tag: any) => {
      const vinculados = negTags.filter((nt: any) => nt.tag_id === tag.id);
      const stages: Record<string, number> = {};
      vinculados.forEach((nt: any) => {
        const s = stageMap[nt.negociacao_id] || "desconhecido";
        stages[s] = (stages[s] || 0) + 1;
      });
      return { ...tag, total: vinculados.length, stages };
    }).sort((a: any, b: any) => b.total - a.total);
  }, [tags, negTags, negsStage]);

  const isLoading = loadingTags || loadingNegTags;

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2"><Tag className="h-5 w-5" /><span className="font-semibold">{tags.length} tags cadastradas</span></div>
      {tagStats.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma tag encontrada</CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <Table><TableHeader><TableRow className="bg-muted/60">
            <TableHead className="text-[10px] uppercase">Tag</TableHead>
            <TableHead className="text-[10px] uppercase text-center">Total</TableHead>
            <TableHead className="text-[10px] uppercase text-center">Novo Lead</TableHead>
            <TableHead className="text-[10px] uppercase text-center">Em Negociacao</TableHead>
            <TableHead className="text-[10px] uppercase text-center">Concluido</TableHead>
            <TableHead className="text-[10px] uppercase text-center">Perdido</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {tagStats.map((t: any) => (
              <TableRow key={t.id}>
                <TableCell><Badge style={{ backgroundColor: t.cor || "#6366f1", color: "#fff" }} className="text-xs">{t.nome}</Badge></TableCell>
                <TableCell className="text-center font-semibold">{t.total}</TableCell>
                <TableCell className="text-center text-xs">{t.stages.novo_lead || 0}</TableCell>
                <TableCell className="text-center text-xs">{t.stages.em_negociacao || 0}</TableCell>
                <TableCell className="text-center text-xs text-emerald-400 font-semibold">{t.stages.concluido || 0}</TableCell>
                <TableCell className="text-center text-xs text-red-400">{t.stages.perdido || 0}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </CardContent></Card>
      )}
    </div>
  );
}
