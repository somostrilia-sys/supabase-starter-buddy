import { useState, useMemo, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight, Search, Loader2 } from "lucide-react";

interface TabelaPrecoRow {
  id: string;
  tabela_id: string;
  plano: string;
  cota: number;
  valor_menor: number;
  valor_maior: number;
  taxa_administrativa: number;
  adesao: number;
  rastreador: string;
  instalacao: number;
  tipo_franquia: string;
  valor_franquia: number;
  regional: string;
  tipo_veiculo: string;
  plano_normalizado: string;
  regional_normalizado: string;
}

interface TabelaAgrupada {
  regional: string;
  tipo_veiculo: string;
  planos: string[];
  faixas: number;
  rows: TabelaPrecoRow[];
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function TabelasPrecosTab() {
  const [search, setSearch] = useState("");
  const [filterRegional, setFilterRegional] = useState<string>("all");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const { data: rows, isLoading, error } = useQuery<TabelaPrecoRow[]>({
    queryKey: ["tabela_precos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tabela_precos")
        .select("*")
        .order("regional")
        .order("tipo_veiculo")
        .order("plano")
        .order("valor_menor");
      if (error) throw error;
      return (data ?? []) as TabelaPrecoRow[];
    },
  });

  const grouped = useMemo<TabelaAgrupada[]>(() => {
    if (!rows) return [];
    const map = new Map<string, TabelaPrecoRow[]>();
    for (const r of rows) {
      const key = `${r.regional}||${r.tipo_veiculo}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries()).map(([key, items]) => {
      const planos = [...new Set(items.map((i) => i.plano))];
      const faixas = new Set(items.map((i) => `${i.valor_menor}-${i.valor_maior}`)).size;
      return {
        regional: items[0].regional,
        tipo_veiculo: items[0].tipo_veiculo,
        planos,
        faixas,
        rows: items,
      };
    });
  }, [rows]);

  const regionais = useMemo(() => [...new Set(grouped.map((g) => g.regional))].sort(), [grouped]);
  const tiposVeiculo = useMemo(() => [...new Set(grouped.map((g) => g.tipo_veiculo))].sort(), [grouped]);

  const filtered = useMemo(() => {
    return grouped.filter((g) => {
      if (filterRegional !== "all" && g.regional !== filterRegional) return false;
      if (filterTipo !== "all" && g.tipo_veiculo !== filterTipo) return false;
      if (search) {
        const s = search.toLowerCase();
        const match =
          g.regional.toLowerCase().includes(s) ||
          g.tipo_veiculo.toLowerCase().includes(s) ||
          g.planos.some((p) => p.toLowerCase().includes(s));
        if (!match) return false;
      }
      return true;
    });
  }, [grouped, filterRegional, filterTipo, search]);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Carregando tabelas de precos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-destructive">
        Erro ao carregar tabelas: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Tabelas de Precos</h3>
        <p className="text-sm text-muted-foreground">
          {rows?.length ?? 0} registros em {grouped.length} combinacoes regional/veiculo
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar regional, tipo ou plano..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-[#747474]"
          />
        </div>
        <Select value={filterRegional} onValueChange={setFilterRegional}>
          <SelectTrigger className="w-[220px] border-[#747474]">
            <SelectValue placeholder="Regional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as regionais</SelectItem>
            {regionais.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[260px] border-[#747474]">
            <SelectValue placeholder="Tipo Veiculo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {tiposVeiculo.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-[#747474]">
                <TableHead className="w-10"></TableHead>
                <TableHead>Regional</TableHead>
                <TableHead>Tipo Veiculo</TableHead>
                <TableHead>Planos</TableHead>
                <TableHead className="text-center">Faixas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Nenhuma tabela encontrada
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((g) => {
                const key = `${g.regional}||${g.tipo_veiculo}`;
                const isExpanded = expandedKeys.has(key);

                // Group detail rows by plano
                const byPlano = new Map<string, TabelaPrecoRow[]>();
                for (const r of g.rows) {
                  if (!byPlano.has(r.plano)) byPlano.set(r.plano, []);
                  byPlano.get(r.plano)!.push(r);
                }

                return (
                  <Fragment key={key}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50 border-b border-[#747474]/30"
                      onClick={() => toggleExpand(key)}
                    >
                      <TableCell>
                        {isExpanded
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell className="font-medium">{g.regional}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-[#747474]">
                          {g.tipo_veiculo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {g.planos.map((p) => (
                            <Badge key={p} variant="secondary" className="text-xs">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono">{g.faixas}</TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={5} className="p-0 bg-muted/30">
                          <div className="p-4 space-y-4">
                            {Array.from(byPlano.entries()).map(([plano, items]) => (
                              <div key={plano}>
                                <h4 className="text-sm font-semibold mb-2 text-foreground">{plano}</h4>
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="border-b border-[#747474]/50">
                                        <TableHead className="text-xs">Faixa FIPE</TableHead>
                                        <TableHead className="text-xs">Cota</TableHead>
                                        <TableHead className="text-xs">Taxa Adm.</TableHead>
                                        <TableHead className="text-xs">Adesao</TableHead>
                                        <TableHead className="text-xs">Rastreador</TableHead>
                                        <TableHead className="text-xs">Instalacao</TableHead>
                                        <TableHead className="text-xs">Franquia</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {items.map((row) => (
                                        <TableRow key={row.id} className="border-b border-[#747474]/20">
                                          <TableCell className="text-xs font-mono whitespace-nowrap">
                                            {formatCurrency(row.valor_menor)} — {formatCurrency(row.valor_maior)}
                                          </TableCell>
                                          <TableCell className="text-xs">{formatCurrency(row.cota)}</TableCell>
                                          <TableCell className="text-xs">{formatCurrency(row.taxa_administrativa)}</TableCell>
                                          <TableCell className="text-xs">{formatCurrency(row.adesao)}</TableCell>
                                          <TableCell className="text-xs">{row.rastreador || "—"}</TableCell>
                                          <TableCell className="text-xs">{formatCurrency(row.instalacao)}</TableCell>
                                          <TableCell className="text-xs">
                                            {row.tipo_franquia ? `${row.tipo_franquia} ${formatCurrency(row.valor_franquia)}` : "—"}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            ))}
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
    </div>
  );
}
