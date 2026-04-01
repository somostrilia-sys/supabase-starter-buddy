import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Settings, Percent, DollarSign, Save, Pencil, Info,
  Users, TrendingUp, Loader2,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ConsultorComissao {
  id: string;
  nome: string;
  comissao_pct: number | null;
  status: string;
  cooperativa: string | null;
  funcao: string | null;
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function fetchConsultores(): Promise<ConsultorComissao[]> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome, comissao_pct, status, cooperativa, funcao")
    .eq("status", "ativo")
    .order("nome", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ConsultorComissao[];
}

export default function ConfigComissoes() {
  const queryClient = useQueryClient();
  const { data: consultores = [], isLoading } = useQuery({
    queryKey: ["consultores-comissoes"],
    queryFn: fetchConsultores,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ConsultorComissao | null>(null);
  const [editValor, setEditValor] = useState("");
  const [saving, setSaving] = useState(false);

  // KPIs
  const totalConsultores = consultores.length;
  const comComissao = consultores.filter(c => c.comissao_pct != null && c.comissao_pct > 0);
  const mediaComissao = comComissao.length > 0
    ? comComissao.reduce((s, c) => s + (c.comissao_pct ?? 0), 0) / comComissao.length
    : 0;
  const maiorComissao = comComissao.length > 0
    ? Math.max(...comComissao.map(c => c.comissao_pct ?? 0))
    : 0;
  const semComissao = consultores.filter(c => c.comissao_pct == null || c.comissao_pct === 0).length;

  function openEdit(c: ConsultorComissao) {
    setEditing(c);
    setEditValor(c.comissao_pct != null ? c.comissao_pct.toString() : "");
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editing) return;
    const valor = editValor.trim() === "" ? null : parseFloat(editValor);
    if (valor !== null && (isNaN(valor) || valor < 0 || valor > 100)) {
      toast({ title: "Valor inválido", description: "Informe um percentual entre 0 e 100", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("usuarios")
      .update({ comissao_pct: valor } as any)
      .eq("id", editing.id);

    setSaving(false);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: `Comissão de ${editing.nome} atualizada para ${valor != null ? valor + "%" : "sem comissão"}` });
    setEditOpen(false);
    queryClient.invalidateQueries({ queryKey: ["consultores-comissoes"] });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações de Comissão</h1>
        <p className="text-sm text-muted-foreground">Defina as regras de split de pagamento e comissões por consultor</p>
      </div>

      <Alert className="border-blue-200 bg-primary/50 dark:bg-blue-950/20 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-xs text-primary dark:text-blue-400">
          Quando um pagamento de adesão é confirmado via gateway, o sistema executa automaticamente o split: parte vai para a conta da associação e parte vai para a conta bancária do consultor.
        </AlertDescription>
      </Alert>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="border-t-2 border-t-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/8 dark:bg-blue-900/40 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{totalConsultores}</p>
                <p className="text-[10px] text-muted-foreground">Consultores Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-2 border-t-violet-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <Percent className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{mediaComissao.toFixed(1)}%</p>
                <p className="text-[10px] text-muted-foreground">Média Comissão</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-2 border-t-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 dark:bg-emerald-900/40 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{maiorComissao}%</p>
                <p className="text-[10px] text-muted-foreground">Maior Comissão</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-2 border-t-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 dark:bg-amber-900/40 flex items-center justify-center">
                <Settings className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xl font-bold">{semComissao}</p>
                <p className="text-[10px] text-muted-foreground">Sem Comissão Definida</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Consultores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />Comissões por Consultor
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Consultor</TableHead>
                <TableHead className="text-xs">Função</TableHead>
                <TableHead className="text-xs">Unidade</TableHead>
                <TableHead className="text-xs">Comissão (%)</TableHead>
                <TableHead className="text-xs">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consultores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum consultor ativo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                consultores.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-sm">{c.nome}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.funcao || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.cooperativa || "—"}</TableCell>
                    <TableCell>
                      {c.comissao_pct != null && c.comissao_pct > 0 ? (
                        <Badge variant="outline" className="text-[10px]">
                          <Percent className="h-2.5 w-2.5 mr-0.5" />{c.comissao_pct}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Não definida</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" />Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar Comissão — {editing?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Percentual de Comissão</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={editValor}
                  onChange={e => setEditValor(e.target.value)}
                  placeholder="Ex: 15"
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
            </div>
            <Separator />
            <div className="p-3 rounded-lg bg-muted/50 space-y-1">
              <p className="text-xs font-medium">Simulação de Split</p>
              <p className="text-[11px] text-muted-foreground">
                Para uma adesão de <strong>R$ 799,00</strong>:
              </p>
              <div className="flex justify-between text-xs mt-1">
                <span>Comissão Consultor:</span>
                <span className="font-bold text-success">
                  {fmt(799 * (parseFloat(editValor || "0") / 100))}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Líquido Associação:</span>
                <span className="font-bold">
                  {fmt(799 - 799 * (parseFloat(editValor || "0") / 100))}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button onClick={saveEdit} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
