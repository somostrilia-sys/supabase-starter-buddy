import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Landmark, Save, Info, CheckCircle, Clock, User, KeyRound,
  DollarSign, Search, FileSpreadsheet, FileText, CalendarIcon,
  ChevronLeft, ChevronRight, TrendingUp, History,
} from "lucide-react";

// ── Bank account constants & masks (kept from original) ──
const bancos = [
  "001 - Banco do Brasil", "033 - Santander", "104 - Caixa Econômica Federal",
  "237 - Bradesco", "341 - Itaú Unibanco", "260 - Nubank", "077 - Inter",
  "336 - C6 Bank", "756 - Sicoob", "748 - Sicredi", "212 - Original",
  "422 - Safra", "070 - BRB", "246 - ABC Brasil", "745 - Citibank",
  "399 - HSBC", "041 - Banrisul", "085 - Ailos", "403 - Cora",
  "290 - PagSeguro", "380 - PicPay", "323 - Mercado Pago",
];
const tiposConta = [
  { value: "corrente", label: "Conta Corrente" },
  { value: "poupanca", label: "Conta Poupança" },
  { value: "pj", label: "Pessoa Jurídica" },
];
function maskCpfCnpj(value: string): string {
  const d = value.replace(/\D/g, "");
  if (d.length <= 11) return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
function maskAgencia(v: string) { return v.replace(/\D/g, "").slice(0, 6); }
function maskConta(v: string) { return v.replace(/\D/g, "").slice(0, 12); }
function maskDigito(v: string) { return v.replace(/\D/g, "").slice(0, 2); }
function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

// ── Mock commission history ──
type ComissaoStatus = "pago" | "pendente" | "processando";

interface ComissaoRecord {
  id: string;
  data: string;
  associado: string;
  negociacao: string;
  valorAdesao: number;
  percentual: number;
  valorRecebido: number;
  status: ComissaoStatus;
}

const day = 86400000;
const now = Date.now();

const mockComissoes: ComissaoRecord[] = [
  { id: "cr1", data: new Date(now - 1 * day).toISOString().split("T")[0], associado: "João Pereira", negociacao: "NEG-2026-001", valorAdesao: 799.00, percentual: 15, valorRecebido: 119.85, status: "processando" },
  { id: "cr2", data: new Date(now - 3 * day).toISOString().split("T")[0], associado: "Maria Santos", negociacao: "NEG-2026-002", valorAdesao: 599.00, percentual: 15, valorRecebido: 89.85, status: "pago" },
  { id: "cr3", data: new Date(now - 5 * day).toISOString().split("T")[0], associado: "Carlos Oliveira", negociacao: "NEG-2026-003", valorAdesao: 799.00, percentual: 15, valorRecebido: 119.85, status: "pago" },
  { id: "cr4", data: new Date(now - 7 * day).toISOString().split("T")[0], associado: "Ana Costa", negociacao: "NEG-2026-004", valorAdesao: 999.00, percentual: 15, valorRecebido: 149.85, status: "pago" },
  { id: "cr5", data: new Date(now - 9 * day).toISOString().split("T")[0], associado: "Roberto Lima", negociacao: "NEG-2026-005", valorAdesao: 599.00, percentual: 15, valorRecebido: 89.85, status: "pendente" },
  { id: "cr6", data: new Date(now - 12 * day).toISOString().split("T")[0], associado: "Fernanda Alves", negociacao: "NEG-2026-006", valorAdesao: 799.00, percentual: 15, valorRecebido: 119.85, status: "pago" },
  { id: "cr7", data: new Date(now - 15 * day).toISOString().split("T")[0], associado: "Pedro Souza", negociacao: "NEG-2026-007", valorAdesao: 999.00, percentual: 15, valorRecebido: 149.85, status: "pago" },
  { id: "cr8", data: new Date(now - 18 * day).toISOString().split("T")[0], associado: "Juliana Mendes", negociacao: "NEG-2026-008", valorAdesao: 599.00, percentual: 15, valorRecebido: 89.85, status: "pago" },
  { id: "cr9", data: new Date(now - 22 * day).toISOString().split("T")[0], associado: "Marcos Silva", negociacao: "NEG-2026-009", valorAdesao: 799.00, percentual: 15, valorRecebido: 119.85, status: "pago" },
  { id: "cr10", data: new Date(now - 25 * day).toISOString().split("T")[0], associado: "Camila Rodrigues", negociacao: "NEG-2026-010", valorAdesao: 999.00, percentual: 15, valorRecebido: 149.85, status: "pago" },
  { id: "cr11", data: new Date(now - 28 * day).toISOString().split("T")[0], associado: "Lucas Ferreira", negociacao: "NEG-2026-011", valorAdesao: 599.00, percentual: 15, valorRecebido: 89.85, status: "pago" },
  { id: "cr12", data: new Date(now - 32 * day).toISOString().split("T")[0], associado: "Beatriz Nunes", negociacao: "NEG-2026-012", valorAdesao: 799.00, percentual: 15, valorRecebido: 119.85, status: "pago" },
  { id: "cr13", data: new Date(now - 35 * day).toISOString().split("T")[0], associado: "Gabriel Martins", negociacao: "NEG-2026-013", valorAdesao: 999.00, percentual: 15, valorRecebido: 149.85, status: "pendente" },
  { id: "cr14", data: new Date(now - 40 * day).toISOString().split("T")[0], associado: "Isabela Costa", negociacao: "NEG-2026-014", valorAdesao: 599.00, percentual: 15, valorRecebido: 89.85, status: "pago" },
  { id: "cr15", data: new Date(now - 45 * day).toISOString().split("T")[0], associado: "Rafael Almeida", negociacao: "NEG-2026-015", valorAdesao: 799.00, percentual: 15, valorRecebido: 119.85, status: "pago" },
];

const statusConfig: Record<ComissaoStatus, { label: string; cls: string }> = {
  pago: { label: "Pago", cls: "bg-success/80/15 text-green-700 border-green-300" },
  pendente: { label: "Pendente", cls: "bg-warning/80/15 text-amber-700 border-amber-300" },
  processando: { label: "Em Processamento", cls: "bg-primary/60/15 text-blue-700 border-blue-300" },
};

const PAGE_SIZE = 10;

export default function MinhaConta() {
  // Bank form state
  const [tipoConta, setTipoConta] = useState("");
  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");
  const [digito, setDigito] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [titular, setTitular] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [saved, setSaved] = useState(false);
  const [verificado, setVerificado] = useState(false);

  // Commission history state
  const [fStatus, setFStatus] = useState("all");
  const [fBusca, setFBusca] = useState("");
  const [fDateStart, setFDateStart] = useState<Date | undefined>();
  const [fDateEnd, setFDateEnd] = useState<Date | undefined>();
  const [page, setPage] = useState(1);

  function handleSave() {
    if (!tipoConta || !banco || !agencia || !conta || !digito || !cpfCnpj || !titular) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    const digits = cpfCnpj.replace(/\D/g, "");
    if (digits.length !== 11 && digits.length !== 14) {
      toast({ title: "CPF ou CNPJ inválido", variant: "destructive" });
      return;
    }
    setSaved(true);
    setVerificado(false);
    toast({ title: "Dados bancários salvos com sucesso!", description: "Pendente de verificação pela equipe financeira." });
    setTimeout(() => setVerificado(true), 3000);
  }

  // Filter commissions
  const filtered = useMemo(() => {
    return mockComissoes.filter(c => {
      if (fStatus !== "all" && c.status !== fStatus) return false;
      if (fBusca) {
        const q = fBusca.toLowerCase();
        if (!c.associado.toLowerCase().includes(q) && !c.negociacao.toLowerCase().includes(q)) return false;
      }
      if (fDateStart && c.data < format(fDateStart, "yyyy-MM-dd")) return false;
      if (fDateEnd && c.data > format(fDateEnd, "yyyy-MM-dd")) return false;
      return true;
    });
  }, [fStatus, fBusca, fDateStart, fDateEnd]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const mesAtual = new Date().toISOString().slice(0, 7);
  const totalRecebido = mockComissoes.filter(c => c.status === "pago").reduce((s, c) => s + c.valorRecebido, 0);
  const totalPendente = mockComissoes.filter(c => c.status === "pendente" || c.status === "processando").reduce((s, c) => s + c.valorRecebido, 0);
  const comissoesMes = mockComissoes.filter(c => c.data.startsWith(mesAtual) && c.status === "pago").reduce((s, c) => s + c.valorRecebido, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Minha Conta</h1>
        <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais e dados bancários</p>
      </div>

      {/* ═══════════ Conta Bancária ═══════════ */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                <Landmark className="h-5 w-5 text-primary" />
              </div>
              Dados Bancários
            </CardTitle>
            {saved && (
              <Badge variant="outline" className={cn("text-xs", verificado ? "bg-success/80/15 text-green-700 border-green-300" : "bg-warning/80/15 text-amber-700 border-amber-300")}>
                {verificado ? <><CheckCircle className="h-3 w-3 mr-1" />Conta verificada</> : <><Clock className="h-3 w-3 mr-1" />Pendente de verificação</>}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <Alert className="border-blue-200 bg-primary/6/50 dark:bg-blue-950/20 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-700 dark:text-blue-400">
              Seus dados bancários serão utilizados para recebimento de comissões. Certifique-se de que as informações estão corretas.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tipo de Conta <span className="text-destructive">*</span></Label>
              <Select value={tipoConta} onValueChange={setTipoConta}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>{tiposConta.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Banco <span className="text-destructive">*</span></Label>
              <Select value={banco} onValueChange={setBanco}>
                <SelectTrigger><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
                <SelectContent>{bancos.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Agência <span className="text-destructive">*</span></Label>
              <Input placeholder="0001" value={agencia} onChange={e => setAgencia(maskAgencia(e.target.value))} maxLength={6} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Número da Conta <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Input placeholder="12345678" value={conta} onChange={e => setConta(maskConta(e.target.value))} className="flex-1" maxLength={12} />
                <span className="flex items-center text-muted-foreground font-bold">-</span>
                <Input placeholder="0" value={digito} onChange={e => setDigito(maskDigito(e.target.value))} className="w-16 text-center" maxLength={2} />
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1"><User className="h-3 w-3" />CPF/CNPJ do Titular <span className="text-destructive">*</span></Label>
              <Input placeholder="000.000.000-00" value={cpfCnpj} onChange={e => setCpfCnpj(maskCpfCnpj(e.target.value))} maxLength={18} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nome do Titular <span className="text-destructive">*</span></Label>
              <Input placeholder="Nome completo do titular" value={titular} onChange={e => setTitular(e.target.value)} maxLength={100} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1"><KeyRound className="h-3 w-3" />Chave Pix <span className="text-muted-foreground text-[10px]">(opcional)</span></Label>
              <Input placeholder="CPF, e-mail, telefone ou chave aleatória" value={chavePix} onChange={e => setChavePix(e.target.value)} maxLength={100} />
              <p className="text-[10px] text-muted-foreground">Pode ser CPF/CNPJ, e-mail, telefone ou chave aleatória</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} className="min-w-[200px]"><Save className="h-4 w-4 mr-2" />Salvar Dados Bancários</Button>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════ Histórico de Recebimentos ═══════════ */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10">
              <History className="h-5 w-5 text-emerald-600" />
            </div>
            Histórico de Recebimentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="border-t-2 border-t-emerald-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{fmt(totalRecebido)}</p>
                    <p className="text-[10px] text-muted-foreground">Total Recebido</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-t-2 border-t-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{fmt(totalPendente)}</p>
                    <p className="text-[10px] text-muted-foreground">Pendente</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-t-2 border-t-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{fmt(comissoesMes)}</p>
                    <p className="text-[10px] text-muted-foreground">Comissões do Mês</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Período Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-8 w-[140px] text-xs justify-start", !fDateStart && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />{fDateStart ? format(fDateStart, "dd/MM/yyyy") : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={fDateStart} onSelect={setFDateStart} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Período Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-8 w-[140px] text-xs justify-start", !fDateEnd && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />{fDateEnd ? format(fDateEnd, "dd/MM/yyyy") : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={fDateEnd} onSelect={setFDateEnd} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={fStatus} onValueChange={v => { setFStatus(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="processando">Em Processamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label className="text-xs">Busca</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Nome do associado ou nº negociação"
                  value={fBusca}
                  onChange={e => { setFBusca(e.target.value); setPage(1); }}
                  className="h-8 text-xs pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => toast({ title: "Exportando Excel..." })}>
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />Excel
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => toast({ title: "Exportando PDF..." })}>
                <FileText className="h-3.5 w-3.5 mr-1" />PDF
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs">Associado</TableHead>
                  <TableHead className="text-xs">Negociação</TableHead>
                  <TableHead className="text-xs text-right">Valor Adesão</TableHead>
                  <TableHead className="text-xs text-center">% Comissão</TableHead>
                  <TableHead className="text-xs text-right">Valor Recebido</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      Nenhum registro encontrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : paginated.map(c => {
                  const st = statusConfig[c.status];
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-mono">{new Date(c.data + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-sm font-medium">{c.associado}</TableCell>
                      <TableCell><span className="text-xs text-primary cursor-pointer hover:underline">{c.negociacao}</span></TableCell>
                      <TableCell className="text-sm text-right">{fmt(c.valorAdesao)}</TableCell>
                      <TableCell className="text-sm text-center font-medium">{c.percentual}%</TableCell>
                      <TableCell className="text-sm text-right font-bold">{fmt(c.valorRecebido)}</TableCell>
                      <TableCell><Badge variant="outline" className={cn("text-[10px]", st.cls)}>{st.label}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Mostrando {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length} registros
            </p>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant={page === i + 1 ? "default" : "outline"}
                  className="h-7 w-7 p-0 text-xs"
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button size="icon" variant="outline" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}