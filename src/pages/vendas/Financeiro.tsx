import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  DollarSign, CreditCard, Receipt, AlertTriangle, CalendarIcon,
  Eye, MoreVertical, ChevronDown, RotateCcw, Landmark, ArrowDownToLine,
  Search, Settings,
} from "lucide-react";
import { consultores } from "./pipeline/mockData";

// ========== TAB 1 - VENDAS ONLINE ==========
const day = 86400000;
const now = Date.now();
const statusPagColors: Record<string, string> = {
  Aprovado: "bg-success/80/15 text-green-700 border-green-300",
  Aguardando: "bg-warning/80/15 text-amber-700 border-amber-300",
  Expirado: "bg-muted text-muted-foreground",
  Estornado: "bg-destructive/80/15 text-red-700 border-red-300",
};
const formaColors: Record<string, string> = {
  "Cartão": "bg-primary/60/15 text-blue-700 border-blue-300",
  Boleto: "bg-warning/80/15 text-amber-700 border-amber-300",
  Dinheiro: "bg-success/80/15 text-green-700 border-green-300",
};

const mockVendas = [
  { id: "VND-001", lead: "João Pereira", placa: "ABC-1D23", valor: 289.9, forma: "Cartão", status: "Aprovado", data: "03/03/2026", codigo: "PAY-83721" },
  { id: "VND-002", lead: "Maria Santos", placa: "DEF-2G34", valor: 149.9, forma: "Boleto", status: "Aguardando", data: "04/03/2026", codigo: "BOL-44892" },
  { id: "VND-003", lead: "Carlos Oliveira", placa: "GHI-3J45", valor: 199.9, forma: "Cartão", status: "Aprovado", data: "02/03/2026", codigo: "PAY-72831" },
  { id: "VND-004", lead: "Ana Costa", placa: "JKL-4M56", valor: 389.9, forma: "Cartão", status: "Estornado", data: "28/02/2026", codigo: "PAY-61923" },
  { id: "VND-005", lead: "Roberto Lima", placa: "MNO-5P67", valor: 129.9, forma: "Dinheiro", status: "Aprovado", data: "01/03/2026", codigo: "DIN-55210" },
  { id: "VND-006", lead: "Fernanda Alves", placa: "QRS-6T78", valor: 289.9, forma: "Boleto", status: "Expirado", data: "20/02/2026", codigo: "BOL-33891" },
  { id: "VND-007", lead: "Pedro Souza", placa: "UVW-7X89", valor: 449.9, forma: "Cartão", status: "Aprovado", data: "05/03/2026", codigo: "PAY-92103" },
  { id: "VND-008", lead: "Juliana Mendes", placa: "YZA-8B01", valor: 199.9, forma: "Boleto", status: "Aguardando", data: "04/03/2026", codigo: "BOL-81234" },
  { id: "VND-009", lead: "Lucas Martins", placa: "BCD-9E12", valor: 149.9, forma: "Cartão", status: "Aprovado", data: "03/03/2026", codigo: "PAY-10293" },
  { id: "VND-010", lead: "Camila Rodrigues", placa: "FGH-0I23", valor: 289.9, forma: "Dinheiro", status: "Aprovado", data: "02/03/2026", codigo: "DIN-44120" },
];

const mockEstornos = mockVendas.filter(v => v.status === "Estornado");

// ========== TAB 2 - CONTA BANCARIA ==========
const mockExtrato = [
  { data: "05/03/2026", desc: "Adesão VND-007 - Pedro Souza", tipo: "Crédito", valor: 449.9, saldo: 12849.6 },
  { data: "04/03/2026", desc: "Adesão VND-002 - Maria Santos", tipo: "Crédito", valor: 149.9, saldo: 12399.7 },
  { data: "04/03/2026", desc: "Taxa administrativa", tipo: "Débito", valor: -15.0, saldo: 12249.8 },
  { data: "03/03/2026", desc: "Adesão VND-001 - João Pereira", tipo: "Crédito", valor: 289.9, saldo: 12264.8 },
  { data: "03/03/2026", desc: "Adesão VND-009 - Lucas Martins", tipo: "Crédito", valor: 149.9, saldo: 11974.9 },
  { data: "02/03/2026", desc: "Saque realizado", tipo: "Débito", valor: -5000.0, saldo: 11825.0 },
  { data: "02/03/2026", desc: "Adesão VND-003 - Carlos Oliveira", tipo: "Crédito", valor: 199.9, saldo: 16825.0 },
  { data: "01/03/2026", desc: "Adesão VND-005 - Roberto Lima", tipo: "Crédito", valor: 129.9, saldo: 16625.1 },
];

// ========== TAB 3 - COMISSOES ==========
const mockComissoes = [
  { consultor: "Ana Silva", negId: "VND-001", lead: "João Pereira", valorAdesao: 289.9, pctComissao: 10, valorComissao: 29.0, status: "Paga", dataPag: "05/03/2026" },
  { consultor: "Carlos Souza", negId: "VND-002", lead: "Maria Santos", valorAdesao: 149.9, pctComissao: 10, valorComissao: 15.0, status: "A Pagar", dataPag: null },
  { consultor: "Maria Lima", negId: "VND-003", lead: "Carlos Oliveira", valorAdesao: 199.9, pctComissao: 12, valorComissao: 24.0, status: "Paga", dataPag: "04/03/2026" },
  { consultor: "Ana Silva", negId: "VND-004", lead: "Ana Costa", valorAdesao: 389.9, pctComissao: 10, valorComissao: 39.0, status: "Cancelada", dataPag: null },
  { consultor: "Carlos Souza", negId: "VND-005", lead: "Roberto Lima", valorAdesao: 129.9, pctComissao: 10, valorComissao: 13.0, status: "Paga", dataPag: "03/03/2026" },
  { consultor: "Maria Lima", negId: "VND-006", lead: "Fernanda Alves", valorAdesao: 289.9, pctComissao: 12, valorComissao: 34.8, status: "A Pagar", dataPag: null },
  { consultor: "Ana Silva", negId: "VND-007", lead: "Pedro Souza", valorAdesao: 449.9, pctComissao: 10, valorComissao: 45.0, status: "A Pagar", dataPag: null },
  { consultor: "Carlos Souza", negId: "VND-008", lead: "Juliana Mendes", valorAdesao: 199.9, pctComissao: 10, valorComissao: 20.0, status: "Paga", dataPag: "04/03/2026" },
  { consultor: "Maria Lima", negId: "VND-009", lead: "Lucas Martins", valorAdesao: 149.9, pctComissao: 12, valorComissao: 18.0, status: "Paga", dataPag: "05/03/2026" },
  { consultor: "Ana Silva", negId: "VND-010", lead: "Camila Rodrigues", valorAdesao: 289.9, pctComissao: 10, valorComissao: 29.0, status: "Paga", dataPag: "03/03/2026" },
];

const comStatusColors: Record<string, string> = {
  Paga: "bg-success/80/15 text-green-700 border-green-300",
  "A Pagar": "bg-warning/80/15 text-amber-700 border-amber-300",
  Cancelada: "bg-destructive/80/15 text-red-700 border-red-300",
};

// ========== TAB 4 - FATURAS ==========
const mockFaturas = [
  { periodo: "Mar/2026", valor: 497.0, status: "Pendente", vencimento: "10/03/2026", pagamento: null },
  { periodo: "Fev/2026", valor: 497.0, status: "Paga", vencimento: "10/02/2026", pagamento: "08/02/2026" },
  { periodo: "Jan/2026", valor: 497.0, status: "Paga", vencimento: "10/01/2026", pagamento: "09/01/2026" },
  { periodo: "Dez/2025", valor: 497.0, status: "Paga", vencimento: "10/12/2025", pagamento: "10/12/2025" },
  { periodo: "Nov/2025", valor: 397.0, status: "Paga", vencimento: "10/11/2025", pagamento: "08/11/2025" },
  { periodo: "Out/2025", valor: 397.0, status: "Vencida", vencimento: "10/10/2025", pagamento: null },
];
const faturaStatusColors: Record<string, string> = {
  Paga: "bg-success/80/15 text-green-700 border-green-300",
  Pendente: "bg-warning/80/15 text-amber-700 border-amber-300",
  Vencida: "bg-destructive/80/15 text-red-700 border-red-300",
};

function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function Financeiro() {
  const [tab, setTab] = useState("vendas");
  const [estornoOpen, setEstornoOpen] = useState(false);
  const [contaModal, setContaModal] = useState(false);
  const [faturaModal, setFaturaModal] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const totalAdesoes = mockVendas.filter(v => v.status === "Aprovado").reduce((s, v) => s + v.valor, 0);
  const totalBoletos = mockVendas.filter(v => v.forma === "Boleto").length;
  const totalVencidos = mockVendas.filter(v => v.status === "Expirado").length;
  const totalEstornos = mockVendas.filter(v => v.status === "Estornado").length;

  const totalComPagas = mockComissoes.filter(c => c.status === "Paga").reduce((s, c) => s + c.valorComissao, 0);
  const totalComAPagar = mockComissoes.filter(c => c.status === "A Pagar").reduce((s, c) => s + c.valorComissao, 0);
  const mediaConsultor = (totalComPagas + totalComAPagar) / consultores.length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Gestão financeira de adesões, estornos e comissões</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
          <TabsTrigger value="vendas" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Vendas Online</TabsTrigger>
          <TabsTrigger value="conta" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Conta Bancária (IUGU)</TabsTrigger>
          <TabsTrigger value="comissoes" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Comissões</TabsTrigger>
          <TabsTrigger value="faturas" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Faturas Power CRM</TabsTrigger>
        </TabsList>

        {/* TAB 1 - VENDAS ONLINE */}
        <TabsContent value="vendas" className="space-y-4">
          <div className="flex flex-wrap gap-2 items-end">
            <Select defaultValue="associacao"><SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="associacao">Associação</SelectItem><SelectItem value="regional">Regional</SelectItem><SelectItem value="cooperativa">Cooperativa</SelectItem></SelectContent>
            </Select>
            <Select defaultValue="all"><SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tipo Pagamento</SelectItem><SelectItem value="cartao">Cartão</SelectItem><SelectItem value="boleto">Boleto</SelectItem><SelectItem value="dinheiro">Dinheiro</SelectItem></SelectContent>
            </Select>
            <Select defaultValue="all"><SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Status</SelectItem><SelectItem value="Aprovado">Aprovado</SelectItem><SelectItem value="Aguardando">Aguardando</SelectItem><SelectItem value="Expirado">Expirado</SelectItem><SelectItem value="Estornado">Estornado</SelectItem></SelectContent>
            </Select>
            <div className="relative"><Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" /><Input className="h-8 text-xs pl-7 w-44" placeholder="Placa ou ID..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-success/8 dark:bg-green-950/30 flex items-center justify-center"><DollarSign className="h-5 w-5 text-green-600" /></div><div><p className="text-xl font-bold">{fmt(totalAdesoes)}</p><p className="text-xs text-muted-foreground">Total Adesões</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/6 dark:bg-blue-950/30 flex items-center justify-center"><Receipt className="h-5 w-5 text-blue-600" /></div><div><p className="text-xl font-bold">{totalBoletos}</p><p className="text-xs text-muted-foreground">Boletos Gerados</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-warning/8 dark:bg-amber-950/30 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-amber-600" /></div><div><p className="text-xl font-bold">{totalVencidos}</p><p className="text-xs text-muted-foreground">Boletos Vencidos</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-destructive/8 dark:bg-red-950/30 flex items-center justify-center"><RotateCcw className="h-5 w-5 text-red-600" /></div><div><p className="text-xl font-bold">{totalEstornos}</p><p className="text-xs text-muted-foreground">Estornos</p></div></CardContent></Card>
          </div>

          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">ID</TableHead><TableHead className="text-xs">Lead</TableHead><TableHead className="text-xs">Placa</TableHead>
                <TableHead className="text-xs text-right">Valor</TableHead><TableHead className="text-xs">Forma</TableHead><TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Data</TableHead><TableHead className="text-xs">Código</TableHead><TableHead className="text-xs">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {mockVendas.filter(v => v.status !== "Estornado").map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="text-xs font-mono">{v.id}</TableCell>
                    <TableCell className="text-sm font-medium">{v.lead}</TableCell>
                    <TableCell className="text-xs font-mono">{v.placa}</TableCell>
                    <TableCell className="text-sm text-right font-medium">{fmt(v.valor)}</TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-[10px]", formaColors[v.forma])}>{v.forma}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-[10px]", statusPagColors[v.status])}>{v.status}</Badge></TableCell>
                    <TableCell className="text-xs">{v.data}</TableCell>
                    <TableCell className="text-xs font-mono">{v.codigo}</TableCell>
                    <TableCell>
                      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="h-3.5 w-3.5 mr-2" />Ver</DropdownMenuItem>
                          {v.status === "Aprovado" && <DropdownMenuItem onClick={() => { setEstornoOpen(true); }} className="text-destructive"><RotateCcw className="h-3.5 w-3.5 mr-2" />Solicitar Estorno</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>

          <Collapsible>
            <CollapsibleTrigger asChild><Button variant="outline" size="sm"><ChevronDown className="h-3.5 w-3.5 mr-1" />Estornos ({mockEstornos.length})</Button></CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead className="text-xs">ID</TableHead><TableHead className="text-xs">Lead</TableHead><TableHead className="text-xs">Placa</TableHead><TableHead className="text-xs text-right">Valor</TableHead><TableHead className="text-xs">Data</TableHead></TableRow></TableHeader>
                  <TableBody>{mockEstornos.map(v => (<TableRow key={v.id}><TableCell className="text-xs font-mono">{v.id}</TableCell><TableCell className="text-sm">{v.lead}</TableCell><TableCell className="text-xs font-mono">{v.placa}</TableCell><TableCell className="text-sm text-right">{fmt(v.valor)}</TableCell><TableCell className="text-xs">{v.data}</TableCell></TableRow>))}</TableBody>
                </Table>
              </CardContent></Card>
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>

        {/* TAB 2 - CONTA BANCARIA */}
        <TabsContent value="conta" className="space-y-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/6 dark:bg-blue-950/30 flex items-center justify-center"><Landmark className="h-6 w-6 text-blue-600" /></div>
                <div>
                  <p className="font-semibold">Banco do Brasil</p>
                  <p className="text-sm text-muted-foreground">Ag: 1234-5 | CC: 67890-1 | Conta Corrente</p>
                </div>
                <Badge className="bg-success/80/15 text-green-700 border-green-300 text-xs" variant="outline">Ativa</Badge>
              </div>
              <Button size="sm" variant="outline" onClick={() => setContaModal(true)}><Settings className="h-3.5 w-3.5 mr-1" />Configurar Conta</Button>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Extrato</h3>
            <Button size="sm" variant="outline"><ArrowDownToLine className="h-3.5 w-3.5 mr-1" />Solicitar Saque</Button>
          </div>

          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead className="text-xs">Data</TableHead><TableHead className="text-xs">Descrição</TableHead><TableHead className="text-xs">Tipo</TableHead><TableHead className="text-xs text-right">Valor</TableHead><TableHead className="text-xs text-right">Saldo</TableHead></TableRow></TableHeader>
              <TableBody>
                {mockExtrato.map((e, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{e.data}</TableCell>
                    <TableCell className="text-sm">{e.desc}</TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-[10px]", e.tipo === "Crédito" ? "text-green-700 border-green-300" : "text-red-700 border-red-300")}>{e.tipo}</Badge></TableCell>
                    <TableCell className={cn("text-sm text-right font-medium", e.valor > 0 ? "text-green-700" : "text-red-700")}>{fmt(e.valor)}</TableCell>
                    <TableCell className="text-sm text-right">{fmt(e.saldo)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* TAB 3 - COMISSOES */}
        <TabsContent value="comissoes" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-4 text-center"><p className="text-xl font-bold text-green-600">{fmt(totalComPagas)}</p><p className="text-xs text-muted-foreground">Total Comissões Pagas</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xl font-bold text-amber-600">{fmt(totalComAPagar)}</p><p className="text-xs text-muted-foreground">Comissões a Pagar</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xl font-bold">{fmt(mediaConsultor)}</p><p className="text-xs text-muted-foreground">Média por Consultor</p></CardContent></Card>
          </div>

          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Consultor</TableHead><TableHead className="text-xs">Neg. ID</TableHead><TableHead className="text-xs">Lead</TableHead>
                <TableHead className="text-xs text-right">Adesão</TableHead><TableHead className="text-xs text-right">%</TableHead><TableHead className="text-xs text-right">Comissão</TableHead>
                <TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Pagamento</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {mockComissoes.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm font-medium">{c.consultor}</TableCell>
                    <TableCell className="text-xs font-mono">{c.negId}</TableCell>
                    <TableCell className="text-sm">{c.lead}</TableCell>
                    <TableCell className="text-sm text-right">{fmt(c.valorAdesao)}</TableCell>
                    <TableCell className="text-sm text-right">{c.pctComissao}%</TableCell>
                    <TableCell className="text-sm text-right font-bold">{fmt(c.valorComissao)}</TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-[10px]", comStatusColors[c.status])}>{c.status}</Badge></TableCell>
                    <TableCell className="text-xs">{c.dataPag || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* TAB 4 - FATURAS */}
        <TabsContent value="faturas" className="space-y-4">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Período</TableHead><TableHead className="text-xs text-right">Valor</TableHead><TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Vencimento</TableHead><TableHead className="text-xs">Pagamento</TableHead><TableHead className="text-xs">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {mockFaturas.map(f => (
                  <TableRow key={f.periodo}>
                    <TableCell className="text-sm font-medium">{f.periodo}</TableCell>
                    <TableCell className="text-sm text-right font-bold">{fmt(f.valor)}</TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-[10px]", faturaStatusColors[f.status])}>{f.status}</Badge></TableCell>
                    <TableCell className="text-xs">{f.vencimento}</TableCell>
                    <TableCell className="text-xs">{f.pagamento || "—"}</TableCell>
                    <TableCell><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setFaturaModal(f.periodo)}><Eye className="h-3.5 w-3.5 mr-1" />Detalhes</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Estorno confirm */}
      <Dialog open={estornoOpen} onOpenChange={setEstornoOpen}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Confirmar Estorno</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Deseja realmente solicitar o estorno desta adesão? A ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setEstornoOpen(false)}>Cancelar</Button><Button variant="destructive" onClick={() => { setEstornoOpen(false); toast({ title: "Estorno solicitado" }); }}>Confirmar Estorno</Button></div>
        </DialogContent>
      </Dialog>

      {/* Conta modal */}
      <Dialog open={contaModal} onOpenChange={setContaModal}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Configurar Conta Bancária</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Banco</Label><Select defaultValue="bb"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bb">Banco do Brasil</SelectItem><SelectItem value="itau">Itaú</SelectItem><SelectItem value="bradesco">Bradesco</SelectItem><SelectItem value="caixa">Caixa</SelectItem><SelectItem value="santander">Santander</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Agência</Label><Input defaultValue="1234" /></div><div className="space-y-1.5"><Label>Dígito Ag.</Label><Input defaultValue="5" /></div></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Conta</Label><Input defaultValue="67890" /></div><div className="space-y-1.5"><Label>Dígito Conta</Label><Input defaultValue="1" /></div></div>
            <div className="space-y-1.5"><Label>Tipo Conta</Label><Select defaultValue="cc"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cc">Conta Corrente</SelectItem><SelectItem value="cp">Conta Poupança</SelectItem></SelectContent></Select></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setContaModal(false)}>Cancelar</Button><Button onClick={() => { setContaModal(false); toast({ title: "Conta atualizada" }); }}>Salvar</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fatura detail modal */}
      <Dialog open={!!faturaModal} onOpenChange={() => setFaturaModal(null)}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Fatura {faturaModal}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {[{ item: "Licença Power CRM", valor: 297 }, { item: "Módulo WhatsApp", valor: 100 }, { item: "Módulo Formulários", valor: 100 }].map(i => (
              <div key={i.item} className="flex items-center justify-between py-2 border-b"><span className="text-sm">{i.item}</span><span className="text-sm font-medium">{fmt(i.valor)}</span></div>
            ))}
            <div className="flex items-center justify-between pt-2"><span className="text-sm font-bold">Total</span><span className="text-lg font-bold">{fmt(497)}</span></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
