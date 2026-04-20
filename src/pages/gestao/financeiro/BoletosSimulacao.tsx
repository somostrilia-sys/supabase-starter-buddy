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
import { ArrowLeft, Play, FileText, XCircle, Eye, Loader2, Search, Download, Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type StatusBoleto = "baixado" | "aberto" | "vencido" | "cancelado";
const statusColors: Record<StatusBoleto, string> = {
  aberto: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  baixado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  vencido: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  cancelado: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

type BoletoRow = {
  id: string;
  nosso_numero: string | null;
  associado_nome: string | null;
  cpf_associado: string | null;
  valor: number;
  vencimento: string;
  status: string;
  data_pagamento: string | null;
  created_at: string;
  pdf_url: string | null;
  link_boleto: string | null;
  linha_digitavel: string | null;
  pix_copia_cola: string | null;
  provider: string | null;
};

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} copiado`)).catch(() => toast.error("Falha ao copiar"));
}

export default function BoletosSimulacao({ onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient();
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [showSimulacao, setShowSimulacao] = useState(false);
  const [showCancelar, setShowCancelar] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [gerando, setGerando] = useState(false);
  const [progresso, setProgresso] = useState(0);

  const { data: boletos = [], isLoading } = useQuery({
    queryKey: ["boletos_lista", filtroStatus, busca, dataInicio, dataFim],
    queryFn: async () => {
      let query = (supabase as any)
        .from("boletos")
        .select("id, nosso_numero, associado_nome, cpf_associado, valor, vencimento, status, data_pagamento, created_at, pdf_url, link_boleto, linha_digitavel, pix_copia_cola, provider")
        .order("vencimento", { ascending: false })
        .limit(200);

      if (filtroStatus !== "todos") {
        query = query.eq("status", filtroStatus);
      }
      if (busca.trim()) {
        query = query.ilike("associado_nome", `%${busca.trim()}%`);
      }
      if (dataInicio) {
        query = query.gte("vencimento", dataInicio);
      }
      if (dataFim) {
        query = query.lte("vencimento", dataFim);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as BoletoRow[];
    },
  });

  // Summary KPIs from loaded data
  const { data: resumo = { total: 0, valorTotal: 0, baixados: 0, vencidos: 0, abertos: 0 } } = useQuery({
    queryKey: ["boletos_resumo"],
    queryFn: async () => {
      const [baixadosRes, vencidosRes, abertosRes, totalRes] = await Promise.all([
        (supabase as any).from("boletos").select("id", { count: "exact", head: true }).eq("status", "baixado"),
        (supabase as any).from("boletos").select("id", { count: "exact", head: true }).eq("status", "vencido"),
        (supabase as any).from("boletos").select("id", { count: "exact", head: true }).eq("status", "aberto"),
        (supabase as any).from("boletos").select("id", { count: "exact", head: true }),
      ]);
      // Get total value of all boletos
      const { data: valorData } = await (supabase as any).from("boletos").select("valor");
      const valorTotal = (valorData || []).reduce((s: number, b: { valor: number }) => s + (b.valor ?? 0), 0);
      return {
        total: totalRes.count ?? 0,
        valorTotal,
        baixados: baixadosRes.count ?? 0,
        vencidos: vencidosRes.count ?? 0,
        abertos: abertosRes.count ?? 0,
      };
    },
  });

  const marcarPago = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("boletos")
        .update({ status: "baixado", data_pagamento: new Date().toISOString().split("T")[0] })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boletos_lista"] });
      queryClient.invalidateQueries({ queryKey: ["boletos_resumo"] });
      toast.success("Boleto marcado como pago!");
    },
    onError: (e: any) => toast.error(e.message),
  });

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
          <p className="text-sm text-muted-foreground">Simulacao, geracao e gestao de lotes de boletos</p>
        </div>
      </div>

      {/* Acoes rapidas */}
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
            <div><p className="font-semibold text-sm">Gerar Lote</p><p className="text-xs text-muted-foreground">Geracao em massa</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => toast.success("Simulacao de fechamento gerada")}>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <div><p className="font-semibold text-sm">Simular Fechamento</p><p className="text-xs text-muted-foreground">Projecao mensal</p></div>
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
            <p className="text-xs text-muted-foreground">{Math.min(progresso, 100)}% concluido</p>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Filtros</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Buscar Associado</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Nome do associado..." value={busca} onChange={e => setBusca(e.target.value)} />
              </div>
            </div>
            <div><Label className="text-xs">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="baixado">Baixado (Pago)</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Vencimento De</Label><Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} /></div>
            <div><Label className="text-xs">Vencimento Ate</Label><Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{resumo.total.toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Total Boletos</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-success">R$ {resumo.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p><p className="text-xs text-muted-foreground">Valor total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-success">{resumo.baixados.toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Baixados</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{resumo.vencidos.toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Vencidos</p></CardContent></Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Carregando boletos...</span>
            </div>
          ) : boletos.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">Nenhum boleto encontrado com os filtros selecionados.</div>
          ) : (
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Nosso Numero</TableHead>
                  <TableHead>Associado</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Boleto</TableHead>
                  <TableHead>Acao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boletos.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.nosso_numero || "—"}</TableCell>
                    <TableCell className="font-medium text-sm">{b.associado_nome || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{b.cpf_associado || "—"}</TableCell>
                    <TableCell className="text-right text-sm">R$ {(b.valor ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-xs">{b.vencimento ? new Date(b.vencimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell className="text-xs">{b.data_pagamento ? new Date(b.data_pagamento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${statusColors[b.status as StatusBoleto] || "bg-gray-100 text-gray-800"}`}>
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {b.provider || "sga"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {(b.pdf_url || b.link_boleto) ? (
                          <Button asChild size="icon" variant="outline" className="h-7 w-7" title="Baixar PDF">
                            <a href={(b.pdf_url || b.link_boleto) as string} target="_blank" rel="noreferrer">
                              <Download className="h-3 w-3" />
                            </a>
                          </Button>
                        ) : null}
                        {b.linha_digitavel ? (
                          <Button size="icon" variant="outline" className="h-7 w-7" title="Copiar linha digitável" onClick={() => copy(b.linha_digitavel!, "Linha digitável")}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        ) : null}
                        {b.pix_copia_cola ? (
                          <Button size="icon" variant="outline" className="h-7 w-7" title="Copiar PIX" onClick={() => copy(b.pix_copia_cola!, "PIX")}>
                            <QrCode className="h-3 w-3" />
                          </Button>
                        ) : null}
                        {!b.pdf_url && !b.link_boleto && !b.linha_digitavel && !b.pix_copia_cola ? (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(b.status === "aberto" || b.status === "vencido") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => marcarPago.mutate(b.id)}
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
          )}
        </CardContent>
      </Card>

      {/* Dialog Simulacao */}
      <Dialog open={showSimulacao} onOpenChange={setShowSimulacao}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Simulacao de Lote</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total de boletos:</span><span className="font-bold">{resumo.total.toLocaleString("pt-BR")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Boletos abertos:</span><span className="font-bold">{resumo.abertos.toLocaleString("pt-BR")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Boletos vencidos:</span><span className="font-bold text-destructive">{resumo.vencidos.toLocaleString("pt-BR")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Boletos baixados:</span><span className="font-bold text-success">{resumo.baixados.toLocaleString("pt-BR")}</span></div>
            <div className="flex justify-between border-t-2 border-[#747474] pt-2"><span className="font-semibold">Valor total:</span><span className="font-bold text-lg">R$ {resumo.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
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
            <p className="text-sm text-muted-foreground">Esta acao ira reverter todos os boletos do lote selecionado. Informe a justificativa:</p>
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
