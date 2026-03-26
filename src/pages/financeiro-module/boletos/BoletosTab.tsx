import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { registrarAuditoria } from "@/lib/auditoria";
import { invalidarTudo } from "@/lib/syncService";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Receipt, Search, Download, CheckCircle, Loader2, Plus } from "lucide-react";

type MensalidadeStatus = "pendente" | "pago" | "atrasado" | "cancelado";

const statusColor: Record<MensalidadeStatus, string> = {
  pendente:  "bg-yellow-100 text-yellow-800",
  pago:      "bg-green-100 text-green-800",
  atrasado:  "bg-red-100 text-red-800",
  cancelado: "bg-gray-100 text-gray-800",
};

const statusLabel: Record<MensalidadeStatus, string> = {
  pendente:  "Pendente",
  pago:      "Pago",
  atrasado:  "Vencido",
  cancelado: "Cancelado",
};

type MensalidadeRow = {
  id: string;
  associado_id: string;
  data_vencimento: string;
  data_pagamento: string | null;
  valor: number;
  status: MensalidadeStatus;
  referencia: string | null;
  observacoes: string | null;
  created_at: string;
  associados?: { nome: string; cpf: string } | null;
};

type AssociadoSearch = {
  id: string;
  nome: string;
  cpf: string;
  veiculos?: { placa: string; modelo: string }[];
  contratos?: { id: string; valor_mensalidade: number }[];
};

export default function BoletosTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [pagandoId, setPagandoId] = useState<string | null>(null);

  // Modal Boleto Avulso
  const [modalAvulso, setModalAvulso] = useState(false);
  const [buscaAssociado, setBuscaAssociado] = useState("");
  const [assocSelecionado, setAssocSelecionado] = useState<AssociadoSearch | null>(null);
  const [valorAvulso, setValorAvulso] = useState("");
  const [descricaoAvulso, setDescricaoAvulso] = useState("");
  const [vencimentoAvulso, setVencimentoAvulso] = useState("");
  const [taxaAdmin, setTaxaAdmin] = useState(false);
  const [valorTaxa, setValorTaxa] = useState("");
  const [produtosAdicionais, setProdutosAdicionais] = useState("");
  const [gerandoAvulso, setGerandoAvulso] = useState(false);

  // Fetch mensalidades with associado data
  const { data: mensalidades = [], isLoading } = useQuery({
    queryKey: ["mensalidades"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("mensalidades")
        .select("*, associados(nome, cpf)")
        .order("data_vencimento", { ascending: false })
        .limit(200) as any);
      if (error) throw error;
      return (data || []) as MensalidadeRow[];
    },
  });

  // Fetch sinistros abertos/em_analise to identify frozen associados
  const { data: sinistrosAbertos = [] } = useQuery({
    queryKey: ["sinistros_congelados"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("sinistros")
        .select("associado_id")
        .in("status", ["aberto", "em_analise"]) as any);
      if (error) throw error;
      return (data || []) as { associado_id: string }[];
    },
  });
  const congeladosSet = new Set(sinistrosAbertos.map((s: { associado_id: string }) => s.associado_id));

  // Search associados for modal (ILIKE, min 3 chars)
  const { data: associadosBusca = [], isFetching: buscandoAssoc } = useQuery({
    queryKey: ["assoc_busca_avulso", buscaAssociado],
    enabled: buscaAssociado.length >= 3 && !assocSelecionado,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("associados")
        .select("id, nome, cpf, veiculos(placa, modelo), contratos(id, valor_mensalidade)")
        .ilike("nome", `%${buscaAssociado}%`)
        .limit(10);
      if (error) throw error;
      return (data || []) as AssociadoSearch[];
    },
  });

  // Mark as paid mutation
  const marcarPago = useMutation({
    mutationFn: async (id: string) => {
      setPagandoId(id);
      const hoje = new Date().toISOString().slice(0, 10);
      const { error } = await supabase
        .from("mensalidades")
        .update({ status: "pago", data_pagamento: hoje, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      if (user?.id) {
        await supabase.from("audit_log").insert({
          usuario_id: user.id,
          acao: "MARCAR_PAGO_MENSALIDADE",
          tabela: "mensalidades",
          registro_id: id,
          dados_novos: { status: "pago", data_pagamento: hoje } as any,
        });
      }
    },
    onSuccess: () => {
      toast.success("Mensalidade marcada como paga!");
      invalidarTudo(queryClient);
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
    onSettled: () => setPagandoId(null),
  });

  const selecionarAssociado = (a: AssociadoSearch) => {
    setAssocSelecionado(a);
    const valorContrato = a.contratos?.[0]?.valor_mensalidade;
    if (valorContrato) setValorAvulso(String(valorContrato));
    setBuscaAssociado(a.nome);
  };

  const handleGerarAvulso = async () => {
    if (!assocSelecionado) { toast.error("Selecione um associado."); return; }
    if (!valorAvulso || isNaN(Number(valorAvulso))) { toast.error("Informe um valor válido."); return; }
    if (!vencimentoAvulso) { toast.error("Informe a data de vencimento."); return; }
    setGerandoAvulso(true);
    try {
      const valor = Number(valorAvulso) + (taxaAdmin && valorTaxa ? Number(valorTaxa) : 0);
      const obs = [descricaoAvulso, produtosAdicionais ? `Produtos: ${produtosAdicionais}` : ""].filter(Boolean).join(" | ");
      const { data: inserted, error } = await (supabase as any)
        .from("mensalidades")
        .insert({
          associado_id: assocSelecionado.id,
          valor,
          data_vencimento: vencimentoAvulso,
          status: "pendente",
          referencia: "Boleto Avulso",
          observacoes: obs || null,
          tipo: "avulso",
        })
        .select()
        .single();
      if (error) throw error;
      await registrarAuditoria(supabase, {
        entidade: "mensalidades",
        entidade_id: inserted?.id ?? "unknown",
        associado_id: assocSelecionado.id,
        campo_alterado: "tipo",
        valor_antigo: null,
        valor_novo: "avulso",
        origem_modulo: "financeiro_boletos",
      });
      invalidarTudo(queryClient);
      toast.success("Boleto avulso gerado com sucesso!");
      setModalAvulso(false);
      setAssocSelecionado(null);
      setBuscaAssociado("");
      setValorAvulso("");
      setDescricaoAvulso("");
      setVencimentoAvulso("");
      setTaxaAdmin(false);
      setValorTaxa("");
      setProdutosAdicionais("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar boleto avulso");
    } finally {
      setGerandoAvulso(false);
    }
  };

  const filtered = mensalidades.filter(b => {
    if (filtroStatus !== "todos" && b.status !== filtroStatus) return false;
    if (busca) {
      const s = busca.toLowerCase();
      const nome = b.associados?.nome?.toLowerCase() ?? "";
      const cpf  = b.associados?.cpf ?? "";
      if (!nome.includes(s) && !cpf.includes(s)) return false;
    }
    return true;
  });

  const totalPendente  = filtered.filter(b => b.status === "pendente").reduce((s, b) => s + b.valor, 0);
  const totalPago      = filtered.filter(b => b.status === "pago").reduce((s, b) => s + b.valor, 0);
  const totalVencido   = filtered.filter(b => b.status === "atrasado").reduce((s, b) => s + b.valor, 0);

  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(212_35%_18%)] flex items-center justify-center shadow-md">
            <Receipt className="h-5 w-5 text-[hsl(210_55%_70%)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Boletos / Mensalidades</h1>
            <p className="text-sm text-muted-foreground">Controle de mensalidades dos associados</p>
          </div>
        </div>
        <Button
          onClick={() => setModalAvulso(true)}
          className="gap-2 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white"
        >
          <Plus className="h-4 w-4" /> Gerar Boleto Avulso
        </Button>
      </div>

      {/* Modal Boleto Avulso */}
      <Dialog open={modalAvulso} onOpenChange={setModalAvulso}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerar Boleto Avulso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium">Associado</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Digite ao menos 3 letras..."
                  value={buscaAssociado}
                  onChange={e => { setBuscaAssociado(e.target.value); setAssocSelecionado(null); setValorAvulso(""); }}
                />
              </div>
              {buscaAssociado.length >= 3 && !assocSelecionado && (
                <div className="border rounded-md mt-1 max-h-40 overflow-y-auto shadow-sm bg-white z-10">
                  {buscandoAssoc ? (
                    <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin" /></div>
                  ) : associadosBusca.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">Nenhum associado encontrado</p>
                  ) : associadosBusca.map(a => (
                    <button
                      key={a.id}
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b last:border-0"
                      onClick={() => selecionarAssociado(a)}
                    >
                      <span className="font-medium">{a.nome}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{a.cpf}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {assocSelecionado && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-md text-xs">
                <div>
                  <p className="text-muted-foreground">Veículo</p>
                  <p className="font-medium">{assocSelecionado.veiculos?.[0] ? `${assocSelecionado.veiculos[0].placa} — ${assocSelecionado.veiculos[0].modelo}` : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contrato</p>
                  <p className="font-medium">{assocSelecionado.contratos?.[0]?.id?.slice(0, 8) ?? "—"}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Valor (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={valorAvulso}
                  onChange={e => setValorAvulso(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Vencimento</Label>
                <Input
                  type="date"
                  value={vencimentoAvulso}
                  onChange={e => setVencimentoAvulso(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Descrição</Label>
              <Input placeholder="Ex: Serviço adicional" value={descricaoAvulso} onChange={e => setDescricaoAvulso(e.target.value)} />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="taxa-admin"
                checked={taxaAdmin}
                onChange={e => setTaxaAdmin(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="taxa-admin" className="text-xs cursor-pointer">Incluir taxa administrativa</Label>
              {taxaAdmin && (
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="R$ 0,00"
                  className="w-28 h-7 text-xs"
                  value={valorTaxa}
                  onChange={e => setValorTaxa(e.target.value)}
                />
              )}
            </div>

            <div>
              <Label className="text-xs font-medium">Produtos / Serviços Adicionais</Label>
              <Textarea
                placeholder="Liste os produtos ou serviços adicionais..."
                rows={2}
                value={produtosAdicionais}
                onChange={e => setProdutosAdicionais(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAvulso(false)}>Cancelar</Button>
            <Button onClick={handleGerarAvulso} disabled={gerandoAvulso} className="gap-1.5">
              {gerandoAvulso && <Loader2 className="h-4 w-4 animate-spin" />}
              Gerar Boleto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Em Aberto</p>
          <p className="text-lg font-bold text-yellow-600">R$ {totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
        <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Pago</p>
          <p className="text-lg font-bold text-green-600">R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
        <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Vencido</p>
          <p className="text-lg font-bold text-red-600">R$ {totalVencido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
      </div>

      <Card className="border-[hsl(210_30%_88%)]">
        <CardContent className="p-4">
          <div className="grid sm:grid-cols-3 gap-3 items-end">
            <div>
              <Label className="text-xs font-medium text-[hsl(212_35%_25%)]">Buscar</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 border-[hsl(210_30%_85%)]"
                  placeholder="Associado ou CPF..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-[hsl(212_35%_25%)]">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="mt-1 border-[hsl(210_30%_85%)]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="atrasado">Vencido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 border-[hsl(210_30%_85%)]">
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
                  <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Associado</TableHead>
                  <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">CPF</TableHead>
                  <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Referência</TableHead>
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
                      Nenhuma mensalidade encontrada
                    </TableCell>
                  </TableRow>
                ) : filtered.map((b, i) => (
                  <TableRow
                    key={b.id}
                    className={`${i % 2 === 0 ? 'bg-card' : 'bg-[hsl(210_30%_97%)]'} hover:bg-[hsl(210_40%_94%)] transition-colors border-b border-[hsl(210_30%_90%)]`}
                  >
                    <TableCell className="font-medium text-sm">{b.associados?.nome ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{b.associados?.cpf ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{b.referencia ?? "—"}</TableCell>
                    <TableCell className="text-sm font-mono">
                      {new Date(b.data_vencimento + "T12:00:00").toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {b.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColor[b.status] ?? "bg-gray-100 text-gray-800"}>
                        {statusLabel[b.status] ?? b.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {b.status !== "pago" && b.status !== "cancelado" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50"
                          disabled={pagandoId === b.id}
                          onClick={() => marcarPago.mutate(b.id)}
                        >
                          {pagandoId === b.id
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
          <div className="px-4 py-3 bg-[hsl(210_30%_97%)] border-t border-[hsl(210_30%_90%)]">
            <span className="text-xs text-muted-foreground">{filtered.length} mensalidade(s)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
