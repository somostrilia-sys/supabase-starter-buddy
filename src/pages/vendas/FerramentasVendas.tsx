import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Link2, Copy, Target, Users, Loader2, Info, FileText,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ── Types ──

interface PowerlinkRow {
  consultor: string;
  slug: string;
  leads: number;
  adesoes: number;
  taxa: number;
}

interface MetaConsultor {
  consultor: string;
  total: number;
  concluidos: number;
  emAndamento: number;
  perdidos: number;
  taxaConversao: number;
}

// ── Helpers ──

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ── Data fetching ──

async function fetchPowerlinks(): Promise<PowerlinkRow[]> {
  // Fetch active consultores with slug
  const { data: usuarios, error: userError } = await supabase
    .from("usuarios")
    .select("id, nome, slug")
    .eq("status", "ativo")
    .not("slug", "is", null);

  if (userError) throw userError;
  if (!usuarios || usuarios.length === 0) return [];

  const nomes = usuarios.map((u: any) => u.nome);

  // Fetch negociacoes for these consultores
  const { data: negs, error: negError } = await supabase
    .from("negociacoes")
    .select("consultor, stage")
    .in("consultor", nomes);

  if (negError) throw negError;

  const leadsMap: Record<string, number> = {};
  const adesoesMap: Record<string, number> = {};

  for (const neg of negs || []) {
    const name = neg.consultor as string;
    leadsMap[name] = (leadsMap[name] || 0) + 1;
    if (neg.stage === "concluido") {
      adesoesMap[name] = (adesoesMap[name] || 0) + 1;
    }
  }

  return usuarios.map((u: any) => {
    const leads = leadsMap[u.nome] || 0;
    const adesoes = adesoesMap[u.nome] || 0;
    const taxa = leads > 0 ? Math.round((adesoes / leads) * 1000) / 10 : 0;
    return {
      consultor: u.nome,
      slug: u.slug,
      leads,
      adesoes,
      taxa,
    };
  });
}

async function fetchMetasRapidas(): Promise<MetaConsultor[]> {
  const { data, error } = await supabase
    .from("negociacoes")
    .select("consultor, stage");

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const map: Record<string, { total: number; concluidos: number; emAndamento: number; perdidos: number }> = {};

  for (const row of data) {
    const nome = (row.consultor as string) || "Sem consultor";
    if (!map[nome]) map[nome] = { total: 0, concluidos: 0, emAndamento: 0, perdidos: 0 };
    map[nome].total += 1;
    if (row.stage === "concluido") {
      map[nome].concluidos += 1;
    } else if (row.stage === "perdido") {
      map[nome].perdidos += 1;
    } else {
      map[nome].emAndamento += 1;
    }
  }

  return Object.entries(map)
    .map(([consultor, stats]) => ({
      consultor,
      ...stats,
      taxaConversao: stats.total > 0 ? Math.round((stats.concluidos / stats.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.concluidos - a.concluidos);
}

// ── Component ──

export default function FerramentasVendas() {
  const [tab, setTab] = useState("powerlink");

  const { data: powerlinks = [], isLoading: loadingPL } = useQuery({
    queryKey: ["ferramentas-powerlinks"],
    queryFn: fetchPowerlinks,
  });

  const { data: metas = [], isLoading: loadingMetas } = useQuery({
    queryKey: ["ferramentas-metas-rapidas"],
    queryFn: fetchMetasRapidas,
  });

  const baseUrl = window.location.origin + "/c/";

  function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    toast({ title: "Link copiado!" });
  }

  // Metas aggregates
  const metaTotals = useMemo(() => {
    const t = { total: 0, concluidos: 0, emAndamento: 0, perdidos: 0 };
    for (const m of metas) {
      t.total += m.total;
      t.concluidos += m.concluidos;
      t.emAndamento += m.emAndamento;
      t.perdidos += m.perdidos;
    }
    return t;
  }, [metas]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ferramentas</h1>
        <p className="text-sm text-muted-foreground">Captação de leads, automação e gestão de metas</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap gap-1">
          <TabsTrigger value="powerlink" className="text-xs">Powerlinks</TabsTrigger>
          <TabsTrigger value="formularios" className="text-xs">Formulários</TabsTrigger>
          <TabsTrigger value="metas" className="text-xs">Metas Rápidas</TabsTrigger>
        </TabsList>

        {/* TAB 1 - POWERLINKS */}
        <TabsContent value="powerlink" className="space-y-4">
          {loadingPL ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : powerlinks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Link2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum consultor com slug configurado.</p>
                <p className="text-xs mt-1">Configure o slug dos consultores na aba Minha Empresa &gt; Usuários.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Consultor</TableHead>
                      <TableHead className="text-xs">Link Personalizado</TableHead>
                      <TableHead className="text-xs text-right">Leads</TableHead>
                      <TableHead className="text-xs text-right">Adesões</TableHead>
                      <TableHead className="text-xs text-right">Conversão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {powerlinks.map(p => (
                      <TableRow key={p.slug}>
                        <TableCell className="font-medium text-sm">{p.consultor}</TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-primary truncate max-w-[200px]">{baseUrl}{p.slug}</span>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyLink(baseUrl + p.slug)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{p.leads}</TableCell>
                        <TableCell className="text-right font-bold">{p.adesoes}</TableCell>
                        <TableCell className="text-right">{p.taxa}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 2 - FORMULARIOS */}
        <TabsContent value="formularios" className="space-y-4">
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">Em desenvolvimento</p>
              <p className="text-xs text-muted-foreground mt-1">
                O módulo de formulários dinâmicos será implementado em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3 - METAS RAPIDAS */}
        <TabsContent value="metas" className="space-y-4">
          {loadingMetas ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="border-t-2 border-t-blue-500">
                  <CardContent className="p-4">
                    <p className="text-xl font-bold">{metaTotals.total}</p>
                    <p className="text-[10px] text-muted-foreground">Total Negociações</p>
                  </CardContent>
                </Card>
                <Card className="border-t-2 border-t-emerald-500">
                  <CardContent className="p-4">
                    <p className="text-xl font-bold text-emerald-600">{metaTotals.concluidos}</p>
                    <p className="text-[10px] text-muted-foreground">Concluídas</p>
                  </CardContent>
                </Card>
                <Card className="border-t-2 border-t-amber-500">
                  <CardContent className="p-4">
                    <p className="text-xl font-bold text-amber-600">{metaTotals.emAndamento}</p>
                    <p className="text-[10px] text-muted-foreground">Em Andamento</p>
                  </CardContent>
                </Card>
                <Card className="border-t-2 border-t-red-500">
                  <CardContent className="p-4">
                    <p className="text-xl font-bold text-red-600">{metaTotals.perdidos}</p>
                    <p className="text-[10px] text-muted-foreground">Perdidas</p>
                  </CardContent>
                </Card>
              </div>

              {metas.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Nenhuma negociação encontrada.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Consultor</TableHead>
                          <TableHead className="text-xs text-right">Total</TableHead>
                          <TableHead className="text-xs text-right">Concluídas</TableHead>
                          <TableHead className="text-xs text-right">Em Andamento</TableHead>
                          <TableHead className="text-xs text-right">Perdidas</TableHead>
                          <TableHead className="text-xs w-36">Conversão</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metas.map(m => (
                          <TableRow key={m.consultor}>
                            <TableCell className="font-medium text-sm">{m.consultor}</TableCell>
                            <TableCell className="text-right">{m.total}</TableCell>
                            <TableCell className="text-right font-bold text-emerald-600">{m.concluidos}</TableCell>
                            <TableCell className="text-right text-amber-600">{m.emAndamento}</TableCell>
                            <TableCell className="text-right text-red-600">{m.perdidos}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={m.taxaConversao} className="h-2 flex-1" />
                                <span className="text-xs font-medium w-10 text-right">{m.taxaConversao}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
