import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 50;

export default function RelatorioAlteracoes() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [filtroEntidade, setFiltroEntidade] = useState("");
  const [filtroModulo, setFiltroModulo] = useState("");
  const [filtroAssociado, setFiltroAssociado] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["audit_log", page, dataInicio, dataFim, filtroEntidade, filtroModulo, filtroAssociado],
    queryFn: async () => {
      let query = (supabase as any)
        .from("audit_log")
        .select("*, associados(nome)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (dataInicio) query = query.gte("created_at", dataInicio + "T00:00:00");
      if (dataFim)    query = query.lte("created_at", dataFim + "T23:59:59");
      if (filtroEntidade.trim()) query = query.ilike("tabela", `%${filtroEntidade.trim()}%`);
      if (filtroModulo.trim())   query = query.ilike("origem_modulo", `%${filtroModulo.trim()}%`);
      if (filtroAssociado.trim()) query = query.eq("associado_id", filtroAssociado.trim());

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: (data || []) as any[], total: count ?? 0 };
    },
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleExport = () => {
    const csv = [
      "Data/Hora,Associado,Entidade,Campo,De,Para,Usuário,Módulo",
      ...rows.map((r: any) =>
        `"${formatDate(r.created_at)}","${r.associados?.nome ?? r.associado_id ?? "—"}","${r.tabela ?? r.entidade ?? "—"}","${r.campo_alterado ?? "—"}","${r.dados_anteriores?.valor ?? "—"}","${r.dados_novos?.valor ?? "—"}","${r.usuario_id ?? "—"}","${r.origem_modulo ?? "—"}"`
      ),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio_alteracoes.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  };

  function formatDate(iso: string) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("pt-BR");
    } catch {
      return iso;
    }
  }

  function campoColor(campo: string) {
    if (!campo) return "";
    if (campo.toLowerCase().includes("insert") || campo.toLowerCase().includes("adicion")) return "bg-emerald-500/10 text-emerald-600";
    if (campo.toLowerCase().includes("delet") || campo.toLowerCase().includes("remov")) return "bg-destructive/10 text-destructive";
    return "bg-primary/60/10 text-blue-600";
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Relatório de Alterações</h2>
        <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs">Data Início</Label>
              <Input type="date" value={dataInicio} onChange={e => { setDataInicio(e.target.value); setPage(0); }} />
            </div>
            <div>
              <Label className="text-xs">Data Fim</Label>
              <Input type="date" value={dataFim} onChange={e => { setDataFim(e.target.value); setPage(0); }} />
            </div>
            <div>
              <Label className="text-xs">Entidade/Tabela</Label>
              <Input placeholder="ex: associados" value={filtroEntidade} onChange={e => { setFiltroEntidade(e.target.value); setPage(0); }} />
            </div>
            <div>
              <Label className="text-xs">Módulo</Label>
              <Input placeholder="ex: financeiro" value={filtroModulo} onChange={e => { setFiltroModulo(e.target.value); setPage(0); }} />
            </div>
            <div>
              <Label className="text-xs">ID Associado</Label>
              <Input placeholder="UUID do associado" value={filtroAssociado} onChange={e => { setFiltroAssociado(e.target.value); setPage(0); }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {isLoading ? "Carregando..." : `${total} registro(s) encontrado(s)`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Data/Hora</TableHead>
                    <TableHead>Associado</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Campo</TableHead>
                    <TableHead>DE</TableHead>
                    <TableHead>PARA</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Módulo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-sm text-muted-foreground">
                        Nenhum registro encontrado
                      </td>
                    </tr>
                  ) : rows.map((r: any, i: number) => (
                    <TableRow key={r.id ?? i}>
                      <TableCell className="text-xs whitespace-nowrap">{formatDate(r.created_at)}</TableCell>
                      <TableCell className="text-sm font-medium max-w-[140px] truncate">
                        {r.associados?.nome ?? r.associado_id?.slice(0, 8) ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{r.tabela ?? r.entidade ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={campoColor(r.acao ?? r.campo_alterado ?? "")}>
                          {r.campo_alterado ?? r.acao ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                        {r.dados_anteriores?.valor != null
                          ? String(r.dados_anteriores.valor)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">
                        {r.dados_novos?.valor != null
                          ? String(r.dados_novos.valor)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {r.usuario_id ? r.usuario_id.slice(0, 8) + "…" : "—"}
                      </TableCell>
                      <TableCell className="text-xs">{r.origem_modulo ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-xs text-muted-foreground">
                Página {page + 1} de {totalPages} ({total} registros)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
