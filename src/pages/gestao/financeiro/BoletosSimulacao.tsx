import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, FileText, XCircle, Eye, Loader2 } from "lucide-react";
// Mock data removed - boletos table does not exist yet
const mockBoletos: { id: string; associado: string; cpf: string; cooperativa: string; regional: string; valor: number; vencimento: string; status: string; referencia: string }[] = [];
const cooperativas: string[] = [];
const regionais: string[] = [];
type StatusBoleto = "gerado" | "enviado" | "pago" | "vencido" | "cancelado";
const statusColors: Record<StatusBoleto, string> = {
  gerado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  enviado: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  pago: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  vencido: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  cancelado: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function BoletosSimulacao({ onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient();
  const { data: mensalidades } = useQuery({
    queryKey: ["mensalidades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensalidades")
        .select("*, associados(nome, cpf)")
        .order("data_vencimento", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const marcarPago = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mensalidades")
        .update({ status: "pago", data_pagamento: new Date().toISOString().split("T")[0] })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mensalidades"] });
      toast.success("Mensalidade marcada como paga!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const [filtroCooperativa, setFiltroCooperativa] = useState("todas");
  const [filtroRegional, setFiltroRegional] = useState("todas");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroRef, setFiltroRef] = useState("");
  const [showSimulacao, setShowSimulacao] = useState(false);
  const [showCancelar, setShowCancelar] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [gerando, setGerando] = useState(false);
  const [progresso, setProgresso] = useState(0);

  const filtered = mockBoletos.filter(b => {
    if (filtroCooperativa !== "todas" && b.cooperativa !== filtroCooperativa) return false;
    if (filtroRegional !== "todas" && b.regional !== filtroRegional) return false;
    if (filtroStatus !== "todos" && b.status !== filtroStatus) return false;
    if (filtroRef && !b.referencia.includes(filtroRef)) return false;
    return true;
  });

  const totalValor = filtered.reduce((s, b) => s + b.valor, 0);

  const handleGerarLote = () => {
    setGerando(true);
    setProgresso(0);
    const interval = setInterval(() => {
      setProgresso(p => {
        if (p >= 100) { clearInterval(interval); setGerando(false); toast.success("Lote de boletos gerado com sucesso!"); return 100; }
        return p + 12;
      });
    }, 200);
  };

  const handleCancelar = () => {
    if (!justificativa.trim()) { toast.error("Informe a justificativa"); return; }
    toast.success("Lote cancelado com sucesso");
    setShowCancelar(false);
    setJustificativa("");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl font-bold">Boletos / Fechamento</h2>
          <p className="text-sm text-muted-foreground">Simulação, geração e gestão de lotes de boletos</p>
        </div>
      </div>

      {/* Real mensalidades from Supabase */}
      {mensalidades && mensalidades.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Mensalidades — Dados Reais</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Associado</TableHead>
                  <TableHead className="text-xs">Vencimento</TableHead>
                  <TableHead className="text-xs">Valor</TableHead>
                  <TableHead className="text-xs">Referência</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mensalidades.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">
                      <div>{(m.associados as any)?.nome || "-"}</div>
                      <span className="text-muted-foreground font-mono text-[10px]">{(m.associados as any)?.cpf || ""}</span>
                    </TableCell>
                    <TableCell className="text-xs">{new Date(m.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-xs font-medium">R$ {m.valor.toFixed(2).replace(".", ",")}</TableCell>
                    <TableCell className="text-xs">{m.referencia || "-"}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${
                        m.status === "pago" ? "bg-success/10 text-success" :
                        m.status === "atrasado" ? "bg-destructive/8 text-destructive" :
                        m.status === "cancelado" ? "bg-gray-100 text-gray-800" :
                        "bg-warning/10 text-warning"
                      }`}>{m.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {(m.status === "pendente" || m.status === "atrasado") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => marcarPago.mutate(m.id)}
                          disabled={marcarPago.isPending}
                        >
                          {marcarPago.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Marcar Pago"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Ações rápidas */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setShowSimulacao(true)}>
          <CardContent className="p-4 flex items-center gap-3">
            <Eye className="h-5 w-5 text-primary" />
            <div><p className="font-semibold text-sm">Simular Lote</p><p className="text-xs text-muted-foreground">Preview antes de gerar</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={handleGerarLote}>
          <CardContent className="p-4 flex items-center gap-3">
            <Play className="h-5 w-5 text-success" />
            <div><p className="font-semibold text-sm">Gerar Lote</p><p className="text-xs text-muted-foreground">Geração em massa</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => toast.success("Simulação de fechamento gerada")}>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <div><p className="font-semibold text-sm">Simular Fechamento</p><p className="text-xs text-muted-foreground">Projeção mensal</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setShowCancelar(true)}>
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-destructive" />
            <div><p className="font-semibold text-sm">Cancelar Lote</p><p className="text-xs text-muted-foreground">Reverter com justificativa</p></div>
          </CardContent>
        </Card>
      </div>

      {gerando && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm font-medium">Gerando boletos...</span></div>
            <Progress value={progresso} className="h-2" />
            <p className="text-xs text-muted-foreground">{Math.min(progresso, 100)}% concluído</p>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Filtros</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div><Label className="text-xs">Cooperativa</Label>
              <Select value={filtroCooperativa} onValueChange={setFiltroCooperativa}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todas">Todas</SelectItem>{cooperativas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Regional</Label>
              <Select value={filtroRegional} onValueChange={setFiltroRegional}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todas">Todas</SelectItem>{regionais.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="gerado">Gerado</SelectItem><SelectItem value="enviado">Enviado</SelectItem><SelectItem value="pago">Pago</SelectItem><SelectItem value="vencido">Vencido</SelectItem><SelectItem value="cancelado">Cancelado</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Referência</Label><Input placeholder="Ex: 07/2025" value={filtroRef} onChange={e => setFiltroRef(e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{filtered.length}</p><p className="text-xs text-muted-foreground">Boletos</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-success">R$ {totalValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p><p className="text-xs text-muted-foreground">Valor total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-success">{filtered.filter(b => b.status === "pago").length}</p><p className="text-xs text-muted-foreground">Pagos</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{filtered.filter(b => b.status === "vencido").length}</p><p className="text-xs text-muted-foreground">Vencidos</p></CardContent></Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Associado</TableHead>
                <TableHead>Cooperativa</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.id}</TableCell>
                  <TableCell className="font-medium">{b.associado}</TableCell>
                  <TableCell>{b.cooperativa}</TableCell>
                  <TableCell>{b.referencia}</TableCell>
                  <TableCell className="text-right">R$ {b.valor.toFixed(2)}</TableCell>
                  <TableCell>{new Date(b.vencimento).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell><Badge className={statusColors[b.status as StatusBoleto]}>{b.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Simulação */}
      <Dialog open={showSimulacao} onOpenChange={setShowSimulacao}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Simulação de Lote — 07/2025</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total de associados:</span><span className="font-bold">847</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Valor médio:</span><span className="font-bold">R$ 234,15</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Valor total projetado:</span><span className="font-bold text-success">R$ 198.342,50</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Descontos programados:</span><span className="font-bold">R$ 3.420,00</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Rateios incluídos:</span><span className="font-bold">R$ 12.580,00</span></div>
            <div className="flex justify-between border-t-2 border-[#747474] pt-2"><span className="font-semibold">Valor líquido:</span><span className="font-bold text-lg">R$ 207.502,50</span></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSimulacao(false)}>Fechar</Button>
            <Button onClick={() => { setShowSimulacao(false); handleGerarLote(); }}>Confirmar e Gerar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Cancelar */}
      <Dialog open={showCancelar} onOpenChange={setShowCancelar}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancelar Lote de Fechamento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Esta ação irá reverter todos os boletos do lote selecionado. Informe a justificativa:</p>
            <Textarea placeholder="Motivo do cancelamento..." value={justificativa} onChange={e => setJustificativa(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelar(false)}>Voltar</Button>
            <Button variant="destructive" onClick={handleCancelar}>Confirmar Cancelamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
