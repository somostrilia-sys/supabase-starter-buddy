import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TrendingUp, Search, Download, Plus, DollarSign, Clock, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

type ContaStatus = "pendente" | "recebido" | "atrasado";

type ContaReceber = {
  id: string;
  descricao: string;
  cliente: string;
  categoria: string;
  data_vencimento: string;
  data_recebimento: string | null;
  valor: number;
  status: ContaStatus;
  observacoes: string | null;
  created_at: string;
};

const statusColor: Record<ContaStatus, string> = {
  pendente:  "bg-yellow-100 text-yellow-800",
  recebido:  "bg-green-100 text-green-800",
  atrasado:  "bg-red-100 text-red-800",
};

const statusLabel: Record<ContaStatus, string> = {
  pendente: "Pendente",
  recebido: "Recebido",
  atrasado: "Atrasado",
};

const categorias = ["Mensalidade", "Adesão", "Vistoria", "Evento", "Repasse", "Outros"];

const emptyForm = {
  descricao: "",
  cliente: "",
  categoria: "Outros",
  data_vencimento: "",
  valor: "",
  observacoes: "",
};

export default function ContasReceberTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [salvando, setSalvando] = useState(false);
  const [marcandoId, setMarcandoId] = useState<string | null>(null);

  const { data: contas = [], isLoading } = useQuery({
    queryKey: ["contas_receber"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("contas_receber")
        .select("*")
        .order("data_vencimento", { ascending: false })
        .limit(300) as any);
      if (error) throw error;
      return (data || []) as ContaReceber[];
    },
  });

  const inserirConta = useMutation({
    mutationFn: async () => {
      setSalvando(true);
      const { error } = await (supabase.from("contas_receber").insert({
        descricao: form.descricao,
        cliente: form.cliente,
        categoria: form.categoria,
        data_vencimento: form.data_vencimento,
        valor: parseFloat(form.valor.replace(",", ".")),
        observacoes: form.observacoes || null,
        status: "pendente",
      }) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conta a receber criada!");
      queryClient.invalidateQueries({ queryKey: ["contas_receber"] });
      setModalOpen(false);
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
    onSettled: () => setSalvando(false),
  });

  const marcarRecebido = useMutation({
    mutationFn: async (id: string) => {
      setMarcandoId(id);
      const hoje = new Date().toISOString().slice(0, 10);
      const { error } = await (supabase
        .from("contas_receber")
        .update({ status: "recebido", data_recebimento: hoje, updated_at: new Date().toISOString() })
        .eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conta marcada como recebida!");
      queryClient.invalidateQueries({ queryKey: ["contas_receber"] });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
    onSettled: () => setMarcandoId(null),
  });

  const agora = new Date();
  const filtered = contas.filter(c => {
    if (filtroStatus !== "todos" && c.status !== filtroStatus) return false;
    if (filtroPeriodo !== "todos") {
      const [ano, mes] = filtroPeriodo.split("-");
      const d = c.data_vencimento.slice(0, 7);
      if (d !== `${ano}-${mes}`) return false;
    }
    if (busca) {
      const s = busca.toLowerCase();
      if (!c.descricao.toLowerCase().includes(s) && !c.cliente.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
  const totalReceber  = contas.filter(c => c.status !== "recebido").reduce((s, c) => s + c.valor, 0);
  const totalRecebido = contas.filter(c => c.status === "recebido" && c.data_vencimento.startsWith(mesAtual)).reduce((s, c) => s + c.valor, 0);
  const totalPendente = contas.filter(c => c.status === "pendente").reduce((s, c) => s + c.valor, 0);
  const totalAtrasado = contas.filter(c => c.status === "atrasado").reduce((s, c) => s + c.valor, 0);

  const periodos = Array.from(new Set(contas.map(c => c.data_vencimento.slice(0, 7)))).sort().reverse();

  const fmtValor = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(212_35%_18%)] flex items-center justify-center shadow-md">
            <TrendingUp className="h-5 w-5 text-[hsl(210_55%_70%)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Contas a Receber</h1>
            <p className="text-sm text-muted-foreground">Receitas e recebimentos programados</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />Nova Conta a Receber
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total a Receber",   value: fmtValor(totalReceber),  icon: DollarSign,   color: "text-blue-600",   bg: "bg-blue-50" },
          { label: "Recebido no Mês",   value: fmtValor(totalRecebido), icon: CheckCircle,  color: "text-green-600",  bg: "bg-green-50" },
          { label: "Pendente",          value: fmtValor(totalPendente), icon: Clock,        color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Em Atraso",         value: fmtValor(totalAtrasado), icon: AlertTriangle,color: "text-red-600",    bg: "bg-red-50" },
        ].map(c => (
          <Card key={c.label} className="border-[hsl(210_30%_88%)]">
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

      <Card className="border-[hsl(210_30%_88%)]">
        <CardContent className="p-4">
          <div className="grid sm:grid-cols-4 gap-3 items-end">
            <div>
              <Label className="text-xs font-medium text-[hsl(212_35%_25%)]">Buscar</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9 border-[hsl(210_30%_85%)]" placeholder="Descrição ou cliente..." value={busca} onChange={e => setBusca(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-[hsl(212_35%_25%)]">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="mt-1 border-[hsl(210_30%_85%)]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="recebido">Recebido</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-[hsl(212_35%_25%)]">Período</Label>
              <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
                <SelectTrigger className="mt-1 border-[hsl(210_30%_85%)]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {periodos.map(p => (
                    <SelectItem key={p} value={p.replace("-", "-")}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 border-[hsl(210_30%_85%)] w-fit">
              <Download className="h-4 w-4" />Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[hsl(210_30%_88%)] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[hsl(212_35%_18%)] via-[hsl(212_35%_28%)] to-[hsl(210_40%_40%)]" />
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_18%)] border-b-0">
                  <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Descrição</TableHead>
                  <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Cliente</TableHead>
                  <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Categoria</TableHead>
                  <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Vencimento</TableHead>
                  <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Valor</TableHead>
                  <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Ação</TableHead>
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
                  <TableRow key={c.id} className={`${i % 2 === 0 ? "bg-card" : "bg-[hsl(210_30%_97%)]"} hover:bg-[hsl(210_40%_94%)] transition-colors border-b border-[hsl(210_30%_90%)]`}>
                    <TableCell className="font-medium text-sm">{c.descricao}</TableCell>
                    <TableCell className="text-sm">{c.cliente}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-[hsl(210_35%_70%)] text-[hsl(212_35%_30%)] bg-[hsl(210_40%_95%)]">{c.categoria}</Badge>
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {new Date(c.data_vencimento + "T12:00:00").toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">{fmtValor(c.valor)}</TableCell>
                    <TableCell>
                      <Badge className={statusColor[c.status] ?? "bg-gray-100 text-gray-800"}>
                        {statusLabel[c.status] ?? c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.status !== "recebido" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50"
                          disabled={marcandoId === c.id}
                          onClick={() => marcarRecebido.mutate(c.id)}
                        >
                          {marcandoId === c.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <CheckCircle className="h-3 w-3" />
                          }
                          Marcar Recebido
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="px-4 py-3 bg-[hsl(210_30%_97%)] border-t border-[hsl(210_30%_90%)]">
            <span className="text-xs text-muted-foreground">{filtered.length} conta(s)</span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Conta a Receber</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-medium">Descrição *</Label>
              <Input className="mt-1" placeholder="Ex: Mensalidade Janeiro - João" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs font-medium">Cliente *</Label>
              <Input className="mt-1" placeholder="Nome do cliente" value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} />
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
              className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white"
              disabled={salvando || !form.descricao || !form.cliente || !form.data_vencimento || !form.valor}
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
