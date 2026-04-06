import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Settings, Percent, DollarSign, Save, Pencil, Plus, Trash2,
  Users, TrendingUp, Loader2, Trophy, Calculator, Calendar,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, callEdge } from "@/integrations/supabase/client";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ConfigComissoes() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("pessoas");

  // ── TAB 1: Pessoas ──
  const { data: consultores = [], isLoading } = useQuery({
    queryKey: ["comissoes-pessoas"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("usuarios")
        .select("id, nome, comissao_pct, comissao_tipo, comissao_percentual, comissao_valor_fixo, salario_fixo, comissao_depende_boleto, cooperativa, funcao, contexto_ia")
        .eq("ativo", true).order("nome");
      return data || [];
    },
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [editPct, setEditPct] = useState("");
  const [editFixo, setEditFixo] = useState("");
  const [editSalario, setEditSalario] = useState("");
  const [editDepBoleto, setEditDepBoleto] = useState(true);
  const [editTipo, setEditTipo] = useState("percentual");

  function openEdit(c: any) {
    setEditing(c);
    setEditTipo(c.comissao_tipo || "percentual");
    setEditPct(String(c.comissao_percentual || c.comissao_pct || ""));
    setEditFixo(String(c.comissao_valor_fixo || ""));
    setEditSalario(String(c.salario_fixo || "0"));
    setEditDepBoleto(c.comissao_depende_boleto !== false);
    setEditOpen(true);
  }

  const savePessoa = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await (supabase as any).from("usuarios").update({
        comissao_tipo: editTipo,
        comissao_pct: editTipo === "percentual" ? parseFloat(editPct) || 0 : null,
        comissao_percentual: editTipo === "percentual" ? parseFloat(editPct) || 0 : null,
        comissao_valor_fixo: editTipo === "fixo" ? parseFloat(editFixo) || 0 : null,
        salario_fixo: parseFloat(editSalario) || 0,
        comissao_depende_boleto: editDepBoleto,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: `Comissao de ${editing?.nome} atualizada` });
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["comissoes-pessoas"] });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  // ── TAB 2: Faixas de Bonus ──
  const { data: faixas = [] } = useQuery({
    queryKey: ["faixas-bonus"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("faixas_bonus").select("*").eq("ativo", true).order("tipo").order("faixa_min");
      return data || [];
    },
  });

  const [faixaOpen, setFaixaOpen] = useState(false);
  const [fxTipo, setFxTipo] = useState<"consultor" | "gestor">("consultor");
  const [fxMin, setFxMin] = useState("");
  const [fxMax, setFxMax] = useState("");
  const [fxValor, setFxValor] = useState("");
  const [fxDesc, setFxDesc] = useState("");

  const saveFaixa = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("faixas_bonus").insert({
        tipo: fxTipo,
        faixa_min: parseInt(fxMin) || 0,
        faixa_max: fxMax ? parseInt(fxMax) : null,
        bonus_valor: parseFloat(fxValor) || 0,
        descricao: fxDesc || `${fxMin}-${fxMax || "+"} contratos`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Faixa criada" });
      setFaixaOpen(false);
      setFxMin(""); setFxMax(""); setFxValor(""); setFxDesc("");
      queryClient.invalidateQueries({ queryKey: ["faixas-bonus"] });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteFaixa = useMutation({
    mutationFn: async (id: string) => {
      await (supabase as any).from("faixas_bonus").update({ ativo: false }).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faixas-bonus"] });
      toast({ title: "Faixa removida" });
    },
  });

  // ── TAB 3: Fechamento Mensal ──
  const now = new Date();
  const [fmAno, setFmAno] = useState(now.getFullYear());
  const [fmMes, setFmMes] = useState(now.getMonth() + 1);
  const [calculando, setCalculando] = useState(false);
  const [resultadoBonus, setResultadoBonus] = useState<any>(null);

  const { data: bonusPeriodo = [] } = useQuery({
    queryKey: ["bonus-periodo", fmAno, fmMes],
    queryFn: async () => {
      const { data } = await (supabase as any).from("bonus_periodo")
        .select("*, usuario:usuarios(nome)")
        .eq("ano", fmAno).eq("mes", fmMes).order("valor_bonus", { ascending: false });
      return data || [];
    },
  });

  async function calcularBonus() {
    setCalculando(true);
    try {
      const res = await callEdge("gia-calcular-bonus-mensal", { ano: fmAno, mes: fmMes });
      setResultadoBonus(res);
      queryClient.invalidateQueries({ queryKey: ["bonus-periodo"] });
      toast({ title: `${res.bonus_calculados || 0} bonus calculados` });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setCalculando(false);
  }

  const aprovarBonus = useMutation({
    mutationFn: async (id: string) => {
      await (supabase as any).from("bonus_periodo").update({ status: "aprovado" }).eq("id", id);
      // Also update comissoes_consultor
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bonus-periodo"] });
      toast({ title: "Bonus aprovado" });
    },
  });

  const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const faixasConsultor = faixas.filter((f: any) => f.tipo === "consultor");
  const faixasGestor = faixas.filter((f: any) => f.tipo === "gestor");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestao de Comissoes</h1>
        <p className="text-sm text-muted-foreground">Comissoes, salarios, faixas de bonus e fechamento mensal</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="pessoas" className="gap-1.5"><Users className="h-3.5 w-3.5" />Pessoas</TabsTrigger>
          <TabsTrigger value="faixas" className="gap-1.5"><Trophy className="h-3.5 w-3.5" />Faixas Bonus</TabsTrigger>
          <TabsTrigger value="fechamento" className="gap-1.5"><Calendar className="h-3.5 w-3.5" />Fechamento</TabsTrigger>
        </TabsList>

        {/* ═══ TAB PESSOAS ═══ */}
        <TabsContent value="pessoas" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60">
                    <TableHead className="text-[10px] uppercase">Colaborador</TableHead>
                    <TableHead className="text-[10px] uppercase">Funcao</TableHead>
                    <TableHead className="text-[10px] uppercase text-center">Salario Fixo</TableHead>
                    <TableHead className="text-[10px] uppercase text-center">Comissao</TableHead>
                    <TableHead className="text-[10px] uppercase text-center">Dep. Boleto</TableHead>
                    <TableHead className="text-[10px] uppercase">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consultores.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-sm">{c.nome}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.funcao || "—"}</TableCell>
                      <TableCell className="text-center text-sm">{c.salario_fixo ? fmt(Number(c.salario_fixo)) : "—"}</TableCell>
                      <TableCell className="text-center">
                        {c.comissao_tipo === "fixo" ? (
                          <Badge variant="outline" className="text-[10px]">{fmt(Number(c.comissao_valor_fixo || 0))}/venda</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">{c.comissao_pct || c.comissao_percentual || 0}%</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={c.comissao_depende_boleto !== false ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}>
                          {c.comissao_depende_boleto !== false ? "Sim" : "Nao"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB FAIXAS BONUS ═══ */}
        <TabsContent value="faixas" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Defina faixas de bonus por quantidade de contratos</p>
            <Button size="sm" onClick={() => setFaixaOpen(true)}><Plus className="h-4 w-4 mr-1" />Nova Faixa</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Consultor */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Faixas Consultor</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {faixasConsultor.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhuma faixa definida</p>
                ) : faixasConsultor.map((f: any) => (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <div>
                      <p className="text-sm font-medium">{f.descricao || `${f.faixa_min}-${f.faixa_max || "+"}`}</p>
                      <p className="text-xs text-muted-foreground">{f.faixa_min} a {f.faixa_max || "+"} contratos</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-500/10 text-emerald-400">{fmt(Number(f.bonus_valor))}</Badge>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => deleteFaixa.mutate(f.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Gestor */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4" />Faixas Gestor (Unidade)</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {faixasGestor.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhuma faixa definida</p>
                ) : faixasGestor.map((f: any) => (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <div>
                      <p className="text-sm font-medium">{f.descricao || `${f.faixa_min}-${f.faixa_max || "+"}`}</p>
                      <p className="text-xs text-muted-foreground">{f.faixa_min} a {f.faixa_max || "+"} contratos da unidade</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-500/10 text-emerald-400">{fmt(Number(f.bonus_valor))}</Badge>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => deleteFaixa.mutate(f.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ TAB FECHAMENTO ═══ */}
        <TabsContent value="fechamento" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <Select value={String(fmMes)} onValueChange={v => setFmMes(parseInt(v))}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MESES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(fmAno)} onValueChange={v => setFmAno(parseInt(v))}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2025, 2026, 2027].map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={calcularBonus} disabled={calculando}>
              {calculando ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Calculator className="h-4 w-4 mr-1" />}
              Calcular Bonus
            </Button>
          </div>

          {bonusPeriodo.length > 0 ? (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60">
                      <TableHead className="text-[10px] uppercase">Colaborador</TableHead>
                      <TableHead className="text-[10px] uppercase">Tipo</TableHead>
                      <TableHead className="text-[10px] uppercase text-center">Contratos</TableHead>
                      <TableHead className="text-[10px] uppercase text-right">Faturamento</TableHead>
                      <TableHead className="text-[10px] uppercase text-right">Bonus</TableHead>
                      <TableHead className="text-[10px] uppercase text-center">Status</TableHead>
                      <TableHead className="text-[10px] uppercase">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bonusPeriodo.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium text-sm">{b.usuario?.nome || "—"}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{b.tipo}</Badge></TableCell>
                        <TableCell className="text-center font-semibold">{b.contratos_realizados}</TableCell>
                        <TableCell className="text-right text-sm">{fmt(Number(b.faturamento_realizado))}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-400">{fmt(Number(b.valor_bonus))}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={b.status === "pago" ? "bg-emerald-500/10 text-emerald-400" : b.status === "aprovado" ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"}>
                            {b.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {b.status === "calculado" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => aprovarBonus.mutate(b.id)}>Aprovar</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Calculator className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum bonus calculado para {MESES[fmMes - 1]} {fmAno}</p>
                <p className="text-xs mt-1">Clique em "Calcular Bonus" para processar</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ EDIT PESSOA DIALOG ═══ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar — {editing?.nome}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Salario Fixo (R$)</Label>
              <Input type="number" value={editSalario} onChange={e => setEditSalario(e.target.value)} className="mt-1" />
            </div>
            <Separator />
            <div>
              <Label className="text-xs">Tipo de Comissao</Label>
              <Select value={editTipo} onValueChange={setEditTipo}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentual">Percentual (%)</SelectItem>
                  <SelectItem value="fixo">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editTipo === "percentual" ? (
              <div>
                <Label className="text-xs">Percentual (%)</Label>
                <Input type="number" min={0} max={100} step={0.5} value={editPct} onChange={e => setEditPct(e.target.value)} className="mt-1" />
              </div>
            ) : (
              <div>
                <Label className="text-xs">Valor Fixo por Venda (R$)</Label>
                <Input type="number" value={editFixo} onChange={e => setEditFixo(e.target.value)} className="mt-1" />
              </div>
            )}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
              <div>
                <p className="text-sm font-medium">Depende do 1o Boleto</p>
                <p className="text-[10px] text-muted-foreground">Comissao so e liberada apos pagamento do 1o boleto</p>
              </div>
              <Switch checked={editDepBoleto} onCheckedChange={setEditDepBoleto} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button onClick={() => savePessoa.mutate()} disabled={savePessoa.isPending}>
                {savePessoa.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ NOVA FAIXA DIALOG ═══ */}
      <Dialog open={faixaOpen} onOpenChange={setFaixaOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Faixa de Bonus</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={fxTipo} onValueChange={(v: any) => setFxTipo(v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultor">Consultor (individual)</SelectItem>
                  <SelectItem value="gestor">Gestor (unidade coletiva)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Min Contratos</Label>
                <Input type="number" value={fxMin} onChange={e => setFxMin(e.target.value)} className="mt-1" placeholder="5" />
              </div>
              <div>
                <Label className="text-xs">Max Contratos (vazio = sem teto)</Label>
                <Input type="number" value={fxMax} onChange={e => setFxMax(e.target.value)} className="mt-1" placeholder="9" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Valor do Bonus (R$)</Label>
              <Input type="number" value={fxValor} onChange={e => setFxValor(e.target.value)} className="mt-1" placeholder="200" />
            </div>
            <div>
              <Label className="text-xs">Descricao</Label>
              <Input value={fxDesc} onChange={e => setFxDesc(e.target.value)} className="mt-1" placeholder="Ex: Bronze - 5 a 9 contratos" />
            </div>
            <Button className="w-full" onClick={() => saveFaixa.mutate()} disabled={saveFaixa.isPending}>
              {saveFaixa.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Criar Faixa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
