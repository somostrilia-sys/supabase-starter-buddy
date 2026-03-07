import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, FileSpreadsheet, FileText, Search, Users, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const mockConsultores = ["Carlos Silva", "Ana Souza", "Roberto Lima", "Fernanda Costa", "Lucas Oliveira", "Mariana Santos"];

interface ComissaoResumo {
  consultor: string;
  qtdVendas: number;
  totalAdesoes: number;
  pctComissaoMedia: number;
  totalComissoes: number;
  status: "pago" | "pendente" | "processando";
}

const mockData: ComissaoResumo[] = [
  { consultor: "Carlos Silva", qtdVendas: 12, totalAdesoes: 18600, pctComissaoMedia: 8, totalComissoes: 1488, status: "pago" },
  { consultor: "Ana Souza", qtdVendas: 15, totalAdesoes: 23250, pctComissaoMedia: 10, totalComissoes: 2325, status: "pago" },
  { consultor: "Roberto Lima", qtdVendas: 8, totalAdesoes: 12400, pctComissaoMedia: 7, totalComissoes: 868, status: "pendente" },
  { consultor: "Fernanda Costa", qtdVendas: 18, totalAdesoes: 27900, pctComissaoMedia: 9, totalComissoes: 2511, status: "pago" },
  { consultor: "Lucas Oliveira", qtdVendas: 6, totalAdesoes: 9300, pctComissaoMedia: 8, totalComissoes: 744, status: "processando" },
  { consultor: "Mariana Santos", qtdVendas: 10, totalAdesoes: 15500, pctComissaoMedia: 10, totalComissoes: 1550, status: "pendente" },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusConfig: Record<string, { label: string; className: string }> = {
  pago: { label: "Pago", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  pendente: { label: "Pendente", className: "bg-amber-100 text-amber-700 border-amber-200" },
  processando: { label: "Em Processamento", className: "bg-blue-100 text-blue-700 border-blue-200" },
};

export default function ExtratoComissoesTab() {
  const [dateStart, setDateStart] = useState<Date | undefined>();
  const [dateEnd, setDateEnd] = useState<Date | undefined>();
  const [consultor, setConsultor] = useState("all");
  const [status, setStatus] = useState("all");
  const [generated, setGenerated] = useState(false);

  const filtered = useMemo(() => {
    if (!generated) return [];
    return mockData.filter(c => {
      if (consultor !== "all" && c.consultor !== consultor) return false;
      if (status !== "all" && c.status !== status) return false;
      return true;
    });
  }, [generated, consultor, status]);

  const totals = useMemo(() => ({
    qtdVendas: filtered.reduce((s, c) => s + c.qtdVendas, 0),
    totalAdesoes: filtered.reduce((s, c) => s + c.totalAdesoes, 0),
    totalComissoes: filtered.reduce((s, c) => s + c.totalComissoes, 0),
    pctMedia: filtered.length ? filtered.reduce((s, c) => s + c.pctComissaoMedia, 0) / filtered.length : 0,
  }), [filtered]);

  const consultoresAtivos = new Set(filtered.map(c => c.consultor)).size;
  const ticketMedio = filtered.length ? totals.totalComissoes / filtered.length : 0;

  const handleGerar = () => {
    if (!dateStart || !dateEnd) {
      toast.error("Selecione o período completo (início e fim).");
      return;
    }
    setGenerated(true);
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Período Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-9 w-full text-xs justify-start", !dateStart && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />{dateStart ? format(dateStart, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateStart} onSelect={setDateStart} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Período Fim *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-9 w-full text-xs justify-start", !dateEnd && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />{dateEnd ? format(dateEnd, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateEnd} onSelect={setDateEnd} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Consultor</Label>
              <Select value={consultor} onValueChange={v => { setConsultor(v); setGenerated(false); }}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {mockConsultores.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={v => { setStatus(v); setGenerated(false); }}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="processando">Em Processamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="h-9 gap-1.5" onClick={handleGerar}>
              <Search className="h-3.5 w-3.5" />Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      {generated && filtered.length > 0 && (
        <>
          {/* Cards resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total de Comissões</p>
                  <p className="text-lg font-bold">{fmt(totals.totalComissoes)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Consultores Ativos</p>
                  <p className="text-lg font-bold">{consultoresAtivos}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ticket Médio Comissão</p>
                  <p className="text-lg font-bold">{fmt(ticketMedio)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela */}
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 pb-2">
                <p className="text-sm font-semibold">Extrato de Comissões</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => toast.success("Exportação Excel iniciada")}>
                    <FileSpreadsheet className="h-3.5 w-3.5" />Exportar Excel (.xlsx)
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => toast.success("Exportação PDF iniciada")}>
                    <FileText className="h-3.5 w-3.5" />Exportar PDF
                  </Button>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Consultor</TableHead>
                    <TableHead className="text-center">Qtd Vendas</TableHead>
                    <TableHead className="text-right">Total Adesões (R$)</TableHead>
                    <TableHead className="text-center">% Comissão Média</TableHead>
                    <TableHead className="text-right">Total Comissões (R$)</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => {
                    const st = statusConfig[c.status];
                    return (
                      <TableRow key={c.consultor}>
                        <TableCell className="font-medium">{c.consultor}</TableCell>
                        <TableCell className="text-center">{c.qtdVendas}</TableCell>
                        <TableCell className="text-right">{fmt(c.totalAdesoes)}</TableCell>
                        <TableCell className="text-center">{c.pctComissaoMedia}%</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(c.totalComissoes)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={st.className}>{st.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-center">{totals.qtdVendas}</TableCell>
                    <TableCell className="text-right">{fmt(totals.totalAdesoes)}</TableCell>
                    <TableCell className="text-center">{totals.pctMedia.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{fmt(totals.totalComissoes)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {generated && filtered.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Nenhum registro encontrado para os filtros selecionados.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
