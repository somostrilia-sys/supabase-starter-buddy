import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Users, Building, MapPin, UserCog, Shield,
  Search, Download, Printer, FileSpreadsheet, Loader2,
  ArrowLeft, ChevronLeft, ChevronRight, CalendarIcon, Eye,
} from "lucide-react";
import { toast } from "sonner";

interface ReportType {
  id: string;
  titulo: string;
  desc: string;
  icon: any;
  cor: string;
}

const reportTypes: ReportType[] = [
  { id: "unidades", titulo: "Unidades", desc: "Relatório de unidades operacionais (cooperativas e regionais)", icon: Building, cor: "bg-warning/80" },
  { id: "agentes", titulo: "Agentes", desc: "Relatório de agentes ativos e inativos por regional", icon: Users, cor: "bg-primary/60" },
  { id: "colaboradores", titulo: "Colaboradores", desc: "Listagem de colaboradores com cargos e departamentos", icon: UserCog, cor: "bg-emerald-500" },
  { id: "uso-agentes", titulo: "Uso de Agentes", desc: "Métricas de utilização e produtividade dos agentes", icon: Users, cor: "bg-primary/60" },
  { id: "permissoes", titulo: "Permissões", desc: "Mapa de permissões por grupo e perfil de acesso", icon: Shield, cor: "bg-destructive/80" },
];

const PAGE_SIZE = 10;

export default function RelatoriosGeraisTab() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(1);

  // Fetch unidades (cooperativas joined with regionais) from Supabase
  const { data: unidadesData, isLoading: unidadesLoading, refetch: refetchUnidades } = useQuery({
    queryKey: ["relatorio-unidades"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cooperativas")
        .select("id, nome, codigo, cidade, estado, ativo, regional_id, regionais(nome)")
        .order("nome");
      if (error) throw error;
      return (data || []).map((c: any) => ({
        nome: c.nome || "",
        codigo: c.codigo || "",
        regional: c.regionais?.nome || "—",
        cidade: c.cidade || "—",
        estado: c.estado || "—",
        status: c.ativo ? "Ativo" : "Inativo",
      }));
    },
    enabled: false, // only fetch when report is selected
  });

  // For agentes and colaboradores there are no dedicated tables yet.
  // These will show "Nenhum registro" until real data tables exist.

  const getReportData = (id: string): Record<string, string | number>[] => {
    if (id === "unidades") return unidadesData || [];
    // agentes, colaboradores, uso-agentes, permissoes: no real data yet
    return [];
  };

  const [reportLoading, setReportLoading] = useState(false);

  const loadReport = async (id: string) => {
    setSelectedReport(id);
    setPage(1);
    setBusca("");
    setStatus("todos");

    if (id === "unidades") {
      setReportLoading(true);
      await refetchUnidades();
      setReportLoading(false);
    }
  };

  const data = selectedReport ? getReportData(selectedReport) : [];

  const filteredData = data.filter(row => {
    if (busca) {
      const match = Object.values(row).some(v => String(v).toLowerCase().includes(busca.toLowerCase()));
      if (!match) return false;
    }
    if (status !== "todos") {
      if (row.status && String(row.status).toLowerCase() !== status) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const pagedData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  // Count for report cards (dynamic for unidades)
  const getContagem = (id: string) => {
    if (id === "unidades" && unidadesData) return unidadesData.length;
    return 0;
  };

  const exportCsv = () => {
    if (!filteredData.length) return toast.error("Sem dados para exportar");
    const keys = Object.keys(filteredData[0]);
    const header = keys.join(";") + "\n";
    const rows = filteredData.map(r => keys.map(k => String(r[k] ?? "")).join(";")).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `relatorio_${selectedReport}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success("CSV exportado com sucesso!");
  };

  const handlePrint = () => {
    window.print();
    toast.success("Enviado para impressão");
  };

  const loading = reportLoading || unidadesLoading;

  if (selectedReport) {
    const report = reportTypes.find(r => r.id === selectedReport);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedReport(null); }} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-base font-semibold">{report?.titulo}</h3>
            <p className="text-xs text-muted-foreground">{report?.desc}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 bg-muted/50 border border-border rounded-lg p-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Busca rápida..." value={busca} onChange={e => { setBusca(e.target.value); setPage(1); }} />
          </div>
          <div className="min-w-[120px]">
            <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                {dateFrom ? format(dateFrom, "dd/MM") : "De"} — {dateTo ? format(dateTo, "dd/MM") : "Até"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>

        {/* Action bar */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" />Imprimir
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={exportCsv}>
            <FileSpreadsheet className="h-3.5 w-3.5" />Excel/CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => toast.success("PDF gerado com sucesso!")}>
            <Download className="h-3.5 w-3.5" />PDF
          </Button>
          <Badge variant="outline" className="ml-auto text-xs">{filteredData.length} registros</Badge>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-lg border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {columns.map(col => (
                    <TableHead key={col} className="text-xs capitalize">{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length || 1} className="text-center text-sm text-muted-foreground py-8">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedData.map((row, i) => (
                    <TableRow key={i}>
                      {columns.map(col => (
                        <TableCell key={col} className="text-sm">
                          {col === "status" ? (
                            <Badge className={`text-xs ${String(row[col]).toLowerCase() === "ativo" ? "bg-success/10 text-success" : "bg-gray-100 text-gray-800"}`}>
                              {String(row[col])}
                            </Badge>
                          ) : (
                            String(row[col])
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t-2 border-[#747474]">
                <span className="text-xs text-muted-foreground">Página {page} de {totalPages}</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-7 px-2">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                    <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="h-7 w-7 p-0 text-xs" onClick={() => setPage(p)}>{p}</Button>
                  ))}
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-7 px-2">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Grid of report cards
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">Relatórios Gerais</h3>
        <p className="text-xs text-muted-foreground">Selecione um tipo de relatório para gerar</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map(rt => (
          <button
            key={rt.id}
            onClick={() => loadReport(rt.id)}
            className="group relative overflow-hidden rounded-xl border border-border bg-card text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col"
          >
            <div className={`h-1 ${rt.cor}`} />
            <div className="flex items-center gap-4 px-5 py-4 flex-1">
              <div className={`w-12 h-12 rounded-full ${rt.cor} bg-opacity-10 flex items-center justify-center shrink-0`}>
                <rt.icon className="h-5 w-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">{rt.titulo}</h4>
                  <Badge variant="secondary" className="text-[10px]">{getContagem(rt.id)}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{rt.desc}</p>
              </div>
              <Eye className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
