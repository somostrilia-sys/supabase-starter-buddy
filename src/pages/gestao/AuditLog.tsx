import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUsuario } from "@/hooks/useUsuario";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ScrollText } from "lucide-react";

interface AuditRow {
  id: string;
  usuario_id: string | null;
  usuario_nome: string | null;
  acao: string;
  entidade: string;
  entidade_id: string | null;
  dados_antes: any;
  dados_depois: any;
  ip: string | null;
  created_at: string;
}

const PAGE_SIZE = 50;

export default function AuditLog() {
  const navigate = useNavigate();
  const { isCEO, isDiretor, loading: userLoading } = useUsuario();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [filterUsuario, setFilterUsuario] = useState<string>("__all__");
  const [filterAcao, setFilterAcao] = useState<string>("__all__");
  const [filterDe, setFilterDe] = useState("");
  const [filterAte, setFilterAte] = useState("");

  // Distinct values for selects
  const [usuarios, setUsuarios] = useState<string[]>([]);
  const [acoes, setAcoes] = useState<string[]>([]);

  useEffect(() => {
    if (!userLoading && !isCEO && !isDiretor) {
      navigate("/");
    }
  }, [userLoading, isCEO, isDiretor, navigate]);

  // Load distinct filter values once
  useEffect(() => {
    (async () => {
      const { data: uData } = await (supabase as any)
        .from("audit_log")
        .select("usuario_nome")
        .not("usuario_nome", "is", null)
        .order("usuario_nome");
      if (uData) {
        const unique = [...new Set(uData.map((r: any) => r.usuario_nome as string))].filter(Boolean);
        setUsuarios(unique);
      }

      const { data: aData } = await (supabase as any)
        .from("audit_log")
        .select("acao")
        .order("acao");
      if (aData) {
        const unique = [...new Set(aData.map((r: any) => r.acao as string))].filter(Boolean);
        setAcoes(unique);
      }
    })();
  }, []);

  // Load data
  useEffect(() => {
    if (userLoading) return;
    if (!isCEO && !isDiretor) return;

    (async () => {
      setLoading(true);
      let query = (supabase as any)
        .from("audit_log")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filterUsuario !== "__all__") {
        query = query.eq("usuario_nome", filterUsuario);
      }
      if (filterAcao !== "__all__") {
        query = query.eq("acao", filterAcao);
      }
      if (filterDe) {
        query = query.gte("created_at", filterDe + "T00:00:00");
      }
      if (filterAte) {
        query = query.lte("created_at", filterAte + "T23:59:59");
      }

      const { data, count } = await query;
      setRows(data || []);
      setTotal(count || 0);
      setLoading(false);
    })();
  }, [page, filterUsuario, filterAcao, filterDe, filterAte, userLoading, isCEO, isDiretor]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [filterUsuario, filterAcao, filterDe, filterAte]);

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isCEO && !isDiretor) return null;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" });
  };

  const acaoBadgeColor = (acao: string) => {
    if (acao.includes("criar") || acao.includes("insert") || acao.includes("novo")) return "bg-green-600/20 text-green-400 border-green-600/30";
    if (acao.includes("editar") || acao.includes("update") || acao.includes("alterar")) return "bg-yellow-600/20 text-yellow-400 border-yellow-600/30";
    if (acao.includes("excluir") || acao.includes("delete") || acao.includes("remover")) return "bg-red-600/20 text-red-400 border-red-600/30";
    return "bg-[#1A3A5C]/20 text-[#1A3A5C] border-[#1A3A5C]/30";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <ScrollText className="h-6 w-6 text-[#1A3A5C]" />
        <h1 className="text-2xl font-bold text-[#1A3A5C]">Auditoria</h1>
        <Badge variant="outline" className="rounded-none border-[#1A3A5C]/30 text-[#1A3A5C]">
          {total} registros
        </Badge>
      </div>

      {/* Filters */}
      <Card className="rounded-none border-[#1A3A5C]/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-[#1A3A5C]">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Usuario</label>
              <Select value={filterUsuario} onValueChange={setFilterUsuario}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="__all__">Todos</SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Acao</label>
              <Select value={filterAcao} onValueChange={setFilterAcao}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="__all__">Todas</SelectItem>
                  {acoes.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">De</label>
              <Input
                type="date"
                value={filterDe}
                onChange={(e) => setFilterDe(e.target.value)}
                className="rounded-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ate</label>
              <Input
                type="date"
                value={filterAte}
                onChange={(e) => setFilterAte(e.target.value)}
                className="rounded-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-none border-[#1A3A5C]/20">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1A3A5C]/5">
                <TableHead className="text-[#1A3A5C] font-semibold">Data/Hora</TableHead>
                <TableHead className="text-[#1A3A5C] font-semibold">Usuario</TableHead>
                <TableHead className="text-[#1A3A5C] font-semibold">Acao</TableHead>
                <TableHead className="text-[#1A3A5C] font-semibold">Entidade</TableHead>
                <TableHead className="text-[#1A3A5C] font-semibold">ID</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <>
                    <TableRow
                      key={row.id}
                      className="cursor-pointer hover:bg-[#1A3A5C]/5 transition-colors"
                      onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                    >
                      <TableCell className="text-xs font-mono whitespace-nowrap">
                        {formatDate(row.created_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.usuario_nome || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`rounded-none text-xs ${acaoBadgeColor(row.acao.toLowerCase())}`}>
                          {row.acao}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{row.entidade}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground max-w-[120px] truncate">
                        {row.entidade_id || "-"}
                      </TableCell>
                      <TableCell>
                        {expandedId === row.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedId === row.id && (
                      <TableRow key={`${row.id}-detail`}>
                        <TableCell colSpan={6} className="bg-[#1A3A5C]/5 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-[#1A3A5C] mb-1">Dados Antes</p>
                              <pre className="text-xs bg-background p-3 overflow-auto max-h-64 border border-[#1A3A5C]/10 rounded-none">
                                {row.dados_antes ? JSON.stringify(row.dados_antes, null, 2) : "—"}
                              </pre>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#1A3A5C] mb-1">Dados Depois</p>
                              <pre className="text-xs bg-background p-3 overflow-auto max-h-64 border border-[#1A3A5C]/10 rounded-none">
                                {row.dados_depois ? JSON.stringify(row.dados_depois, null, 2) : "—"}
                              </pre>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {page + 1} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-none"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-none"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Proxima <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
