import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TrendingDown, Search, Download, Plus, DollarSign, Clock, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

type ContaStatus = "pendente" | "pago" | "atrasado";

type ContaPagar = {
  id: string;
  descricao: string;
  fornecedor: string;
  categoria: string;
  data_vencimento: string;
  data_pagamento: string | null;
  valor: number;
  status: ContaStatus;
  observacoes: string | null;
  created_at: string;
};

const statusColor: Record<ContaStatus, string> = {
  pendente: "bg-warning/10 text-warning",
  pago:     "bg-success/10 text-success",
  atrasado: "bg-destructive/8 text-destructive",
};

const statusLabel: Record<ContaStatus, string> = {
  pendente: "Pendente",
  pago:     "Pago",
  atrasado: "Atrasado",
};

const categorias = ["Operacional", "Fornecedores", "RH", "Tecnologia", "Serviços", "Administrativo", "Outros"];

const emptyForm = {
  descricao: "",
  fornecedor: "",
  categoria: "Operacional",
  data_vencimento: "",
  valor: "",
  observacoes: "",
};

export default function ContasPagarTab() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [salvando, setSalvando] = useState(false);
  const [marcandoId, setMarcandoId] = useState<string | null>(null);

  const { data: contas = [], isLoading } = useQuery({
    queryKey: ["contas_pagar"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("contas_pagar")
        .select("*")
        .order("data_vencimento", { ascending: false })
        .limit(300) as any);
      if (error) throw error;
      return (data || []) as ContaPagar[];
    },
  });

  const inserirConta = useMutation({
    mutationFn: async () => {
      setSalvando(true);
      const { error } = await (supabase.from("contas_pagar").insert({
        descricao: form.descricao,
        fornecedor: form.fornecedor,
        categoria: form.categoria,
        data_vencimento: form.data_vencimento,
        valor: parseFloat(form.valor.replace(",", ".")),
        observacoes: form.observacoes || null,
        status: "pendente",
      }) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conta a pagar criada!");
      queryClient.invalidateQueries({ queryKey: ["contas_pagar"] });
      setModalOpen(false);
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
    onSettled: () => setSalvando(false),
  });

  const marcarPago = useMutation({
    mutationFn: async (id: string) => {
      setMarcandoId(id);
      const hoje = new Date().toISOString().slice(0, 10);
      const { error } = await (supabase
        .from("contas_pagar")
        .update({ status: "pago", data_pagamento: hoje, updated_at: new Date().toISOString() })
        .eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conta marcada como paga!");
      queryClient.invalidateQueries({ queryKey: ["contas_pagar"] });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
    onSettled: () => setMarcandoId(null),
  });

  const agora = new Date();
  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;

  const filtered = contas.filter(c => {
    if (filtroStatus !== "todos" && c.status !== filtroStatus) return false;
    if (filtroPeriodo !== "todos") {
      if (c.data_vencimento.slice(0, 7) !== filtroPeriodo) return false;
    }
    if (busca) {
      const s = busca.toLowerCase();
      if (!c.descricao.toLowerCase().includes(s) && !c.fornecedor.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const totalPagar    = contas.filter(c => c.status !== "pago").reduce((s, c) => s + c.valor, 0);
  const totalPago     = contas.filter(c => c.status === "pago" && c.data_vencimento.startsWith(mesAtual)).reduce((s, c) => s + c.valor, 0);
  const totalPendente = contas.filter(c => c.status === "pendente").reduce((s, c) => s + c.valor, 0);
  const totalAtrasado = contas.filter(c => c.status === "atrasado").reduce((s, c) => s + c.valor, 0);

  const periodos = Array.from(new Set(contas.map(c => c.data_vencimento.slice(0, 7)))).sort().reverse();

  const fmtValor = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md">
            <TrendingDown className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Contas a Pagar</h1>
            <p className="text-sm text-muted-foreground">Obrigações financeiras e pagamentos programados</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-white" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />Nova Despesa
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total a Pagar", value: fmtValor(totalPagar),    icon: DollarSign,    color: "text-destructive",    bg: "bg-destructive/8" },
          { label: "Pago no Mês",   value: fmtValor(totalPago),     icon: CheckCircle,   color: "text-success",  bg: "bg-success/8" },
          { label: "Pendente",      value: fmtValor(totalPendente), icon: Clock,         color: "text-warning", bg: "bg-warning/8" },
          { label: "Em Atraso",     value: fmtValor(totalAtrasado), icon: AlertTriangle, color: "text-destructive",    bg: "bg-destructive/8" },
        ].map(c => (
          <Card key={c.label} className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-lg font-bold text-foreground">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border">
        <CardContent className="p-4">
          <div className="grid sm:grid-cols-4 gap-3 items-end">
            <div>
              <Label className="text-xs font-medium text-foreground">Buscar</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9 border-border" placeholder="Descrição ou fornecedor..." value={busca} onChange={e => setBusca(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-foreground">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="mt-1 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-foreground">Período</Label>
              <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
                <SelectTrigger className="mt-1 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {periodos.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 border-border w-fit">
              <Download className="h-4 w-4" />Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border overflow-hidden">
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary border-b-0">
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Descrição</TableHead>
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Fornecedor</TableHead>
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Categoria</TableHead>
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Vencimento</TableHead>
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Valor</TableHead>
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                      Nenhuma conta encontrada
                    </TableCell>
                  </TableRow>
                ) : filtered.map((c, i) => (
                  <TableRow key={c.id} className={`${i % 2 === 0 ? "bg-card" : "bg-muted/30"} hover:bg-muted/40 transition-colors border-b border-border/60`}>
                    <TableCell className="font-medium text-sm">{c.descricao}</TableCell>
                    <TableCell className="text-sm">{c.fornecedor}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary/30 text-foreground bg-primary/8">{c.categoria}</Badge>
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {new Date(c.data_vencimento + "T12:00:00").toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-destructive">{fmtValor(c.valor)}</TableCell>
                    <TableCell>
                      <Badge className={statusColor[c.status] ?? "bg-gray-100 text-gray-800"}>
                        {statusLabel[c.status] ?? c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.status !== "pago" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 text-success border-green-300 hover:bg-success/8"
                          disabled={marcandoId === c.id}
                          onClick={() => marcarPago.mutate(c.id)}
                        >
                          {marcandoId === c.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <CheckCircle className="h-3 w-3" />
                          }
                          Marcar Pago
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="px-4 py-3 bg-muted/30 border-t border-border/60">
            <span className="text-xs text-muted-foreground">{filtered.length} conta(s)</span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Conta a Pagar</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-medium">Descrição *</Label>
              <Input className="mt-1" placeholder="Ex: Aluguel sede" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs font-medium">Fornecedor *</Label>
              <Input className="mt-1" placeholder="Nome do fornecedor" value={form.fornecedor} onChange={e => setForm(f => ({ ...f, fornecedor: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Categoria</Label>
                <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Vencimento *</Label>
                <Input type="date" className="mt-1" value={form.data_vencimento} onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Valor (R$) *</Label>
              <Input className="mt-1" placeholder="0,00" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs font-medium">Observações</Label>
              <Input className="mt-1" placeholder="Opcional..." value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-white"
              disabled={salvando || !form.descricao || !form.fornecedor || !form.data_vencimento || !form.valor}
              onClick={() => inserirConta.mutate()}
            >
              {salvando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
