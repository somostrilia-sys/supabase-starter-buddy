import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_META = 20;

interface MetaRow {
  nome: string;
  cooperativa: string;
  meta: number;
  realizado: number;
  pct: number;
}

function MetaTable({ items }: { items: MetaRow[] }) {
  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">Nenhum consultor nesta categoria.</div>
    );
  }
  return (
    <Table>
      <TableHeader><TableRow>
        <TableHead className="text-xs">Consultor</TableHead>
        <TableHead className="text-xs">Cooperativa</TableHead>
        <TableHead className="text-xs text-right">Meta</TableHead>
        <TableHead className="text-xs text-right">Realizado</TableHead>
        <TableHead className="text-xs text-right">%</TableHead>
        <TableHead className="text-xs w-32">Progresso</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {items.map(m => (
          <TableRow key={m.nome}>
            <TableCell className="font-medium text-sm">{m.nome}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{m.cooperativa || "—"}</TableCell>
            <TableCell className="text-right text-sm">{m.meta}</TableCell>
            <TableCell className="text-right text-sm font-bold">{m.realizado}</TableCell>
            <TableCell className="text-right text-sm">{m.pct.toFixed(1)}%</TableCell>
            <TableCell><Progress value={Math.min(m.pct, 100)} className="h-2" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function ResumoMetasTab({ filters }: { filters?: { cooperativa: string; consultor: string; dateStart?: Date; dateEnd?: Date } } = {}) {
  const [subTab, setSubTab] = useState("bateram");
  const [coop, setCoop] = useState("all");

  const { data: usuarios, isLoading: loadingU } = useQuery({
    queryKey: ["metas-usuarios", filters?.cooperativa, filters?.consultor, filters?.dateStart?.toISOString(), filters?.dateEnd?.toISOString()],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("usuarios")
        .select("id, nome, cooperativa, grupo_permissao, status");
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { data: negociacoes, isLoading: loadingN } = useQuery({
    queryKey: ["metas-negociacoes-concluidas"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("negociacoes")
        .select("id, consultor, stage")
        .eq("stage", "concluido");
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const isLoading = loadingU || loadingN;

  const cooperativas = useMemo(() => {
    if (!usuarios) return [];
    const unique = [...new Set((usuarios as any[]).map((u: any) => u.cooperativa).filter(Boolean))] as string[];
    return unique.sort();
  }, [usuarios]);

  const metasData: MetaRow[] = useMemo(() => {
    if (!usuarios || !negociacoes) return [];

    const consultores = (usuarios as any[]).filter((u: any) => u.grupo_permissao === "consultor" && u.status === "ativo");

    // Count concluido per consultor
    const vendasMap: Record<string, number> = {};
    (negociacoes as any[]).forEach((n: any) => {
      if (n.consultor) {
        vendasMap[n.consultor] = (vendasMap[n.consultor] || 0) + 1;
      }
    });

    return consultores
      .filter((u: any) => coop === "all" || u.cooperativa === coop)
      .map((u: any) => {
        const realizado = vendasMap[u.nome] || 0;
        const meta = DEFAULT_META;
        return {
          nome: u.nome,
          cooperativa: u.cooperativa || "",
          meta,
          realizado,
          pct: meta > 0 ? (realizado / meta) * 100 : 0,
        };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [usuarios, negociacoes, coop]);

  const bateram = metasData.filter(m => m.meta > 0 && m.pct >= 100);
  const naoBateram = metasData.filter(m => m.meta > 0 && m.pct < 100);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando metas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={coop} onValueChange={setCoop}>
          <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="Cooperativa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Cooperativas</SelectItem>
            {cooperativas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">Meta padrão: {DEFAULT_META} vendas/mês</span>
      </div>

      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList>
          <TabsTrigger value="bateram" className="text-xs gap-1">
            <span className="w-2 h-2 rounded-full bg-success/80" />Bateram a Meta ({bateram.length})
          </TabsTrigger>
          <TabsTrigger value="nao_bateram" className="text-xs gap-1">
            <span className="w-2 h-2 rounded-full bg-destructive/80" />Não Bateram ({naoBateram.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="bateram"><Card><CardContent className="p-0"><MetaTable items={bateram} /></CardContent></Card></TabsContent>
        <TabsContent value="nao_bateram"><Card><CardContent className="p-0"><MetaTable items={naoBateram} /></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
