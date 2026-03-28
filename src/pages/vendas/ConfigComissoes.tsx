import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Settings, Percent, DollarSign, Save, Pencil, Info,
  Users, TrendingUp, Landmark, ArrowRightLeft,
} from "lucide-react";

interface ComissaoConsultor {
  id: string;
  nome: string;
  tipo: "percentual" | "fixo";
  valor: number;
  ativo: boolean;
  totalPago: number;
  ultimoPagamento: string;
}

const mockComissoes: ComissaoConsultor[] = [
  { id: "c1", nome: "Ana Silva", tipo: "percentual", valor: 15, ativo: true, totalPago: 2340.00, ultimoPagamento: "05/03/2026" },
  { id: "c2", nome: "Carlos Souza", tipo: "percentual", valor: 12, ativo: true, totalPago: 1560.00, ultimoPagamento: "05/03/2026" },
  { id: "c3", nome: "Maria Lima", tipo: "fixo", valor: 120, ativo: true, totalPago: 960.00, ultimoPagamento: "28/02/2026" },
  { id: "c4", nome: "Lucas Ferreira", tipo: "percentual", valor: 10, ativo: false, totalPago: 450.00, ultimoPagamento: "15/01/2026" },
  { id: "c5", nome: "Juliana Costa", tipo: "percentual", valor: 15, ativo: true, totalPago: 1890.00, ultimoPagamento: "05/03/2026" },
  { id: "c6", nome: "Pedro Santos", tipo: "fixo", valor: 150, ativo: true, totalPago: 750.00, ultimoPagamento: "01/03/2026" },
];

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ConfigComissoes() {
  const [comissoes, setComissoes] = useState(mockComissoes);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ComissaoConsultor | null>(null);
  const [editTipo, setEditTipo] = useState<"percentual" | "fixo">("percentual");
  const [editValor, setEditValor] = useState("");
  const [comissaoPadrao, setComissaoPadrao] = useState("15");
  const [tipoPadrao, setTipoPadrao] = useState<"percentual" | "fixo">("percentual");

  const totalComissoesMes = comissoes.filter(c => c.ativo).reduce((s, c) => s + c.totalPago, 0);
  const consultoresAtivos = comissoes.filter(c => c.ativo).length;

  function openEdit(c: ComissaoConsultor) {
    setEditing(c);
    setEditTipo(c.tipo);
    setEditValor(c.valor.toString());
    setEditOpen(true);
  }

  function saveEdit() {
    if (!editing || !editValor) return;
    setComissoes(prev => prev.map(c =>
      c.id === editing.id ? { ...c, tipo: editTipo, valor: parseFloat(editValor) } : c
    ));
    setEditOpen(false);
    toast({ title: `Comissão de ${editing.nome} atualizada` });
  }

  function toggleAtivo(id: string) {
    setComissoes(prev => prev.map(c =>
      c.id === id ? { ...c, ativo: !c.ativo } : c
    ));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações de Comissão</h1>
        <p className="text-sm text-muted-foreground">Defina as regras de split de pagamento e comissões por consultor</p>
      </div>

      <Alert className="border-blue-200 bg-primary/6/50 dark:bg-blue-950/20 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-xs text-blue-700 dark:text-blue-400">
          Quando um pagamento de adesão é confirmado via gateway, o sistema executa automaticamente o split: parte vai para a conta da associação e parte vai para a conta bancária do consultor.
        </AlertDescription>
      </Alert>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="border-t-2 border-t-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{fmt(totalComissoesMes)}</p>
                <p className="text-[10px] text-muted-foreground">Comissões do Mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-2 border-t-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{consultoresAtivos}</p>
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
                <p className="text-xl font-bold">{comissaoPadrao}%</p>
                <p className="text-[10px] text-muted-foreground">Comissão Padrão</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-2 border-t-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <ArrowRightLeft className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold">12</p>
                <p className="text-[10px] text-muted-foreground">Splits Executados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comissão Padrão */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />Comissão Padrão para Novos Consultores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={tipoPadrao} onValueChange={v => setTipoPadrao(v as "percentual" | "fixo")}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentual">Percentual (%)</SelectItem>
                  <SelectItem value="fixo">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valor</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={comissaoPadrao}
                  onChange={e => setComissaoPadrao(e.target.value)}
                  className="w-32 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {tipoPadrao === "percentual" ? "%" : "R$"}
                </span>
              </div>
            </div>
            <Button size="sm" onClick={() => toast({ title: "Comissão padrão atualizada" })}>
              <Save className="h-3.5 w-3.5 mr-1" />Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

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
                <TableHead className="text-xs">Tipo</TableHead>
                <TableHead className="text-xs">Valor</TableHead>
                <TableHead className="text-xs">Total Pago (Mês)</TableHead>
                <TableHead className="text-xs">Último Pagamento</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comissoes.map(c => (
                <TableRow key={c.id} className={cn(!c.ativo && "opacity-50")}>
                  <TableCell className="font-medium text-sm">{c.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {c.tipo === "percentual" ? <><Percent className="h-2.5 w-2.5 mr-0.5" />Percentual</> : <><DollarSign className="h-2.5 w-2.5 mr-0.5" />Fixo</>}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-sm">
                    {c.tipo === "percentual" ? `${c.valor}%` : fmt(c.valor)}
                  </TableCell>
                  <TableCell className="text-sm">{fmt(c.totalPago)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.ultimoPagamento}</TableCell>
                  <TableCell>
                    <Switch checked={c.ativo} onCheckedChange={() => toggleAtivo(c.id)} />
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" />Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
              <Label className="text-xs">Tipo de Comissão</Label>
              <Select value={editTipo} onValueChange={v => setEditTipo(v as "percentual" | "fixo")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentual">Percentual (%)</SelectItem>
                  <SelectItem value="fixo">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valor</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={editValor}
                  onChange={e => setEditValor(e.target.value)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {editTipo === "percentual" ? "%" : "R$"}
                </span>
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
                <span className="font-bold text-emerald-700">
                  {editTipo === "percentual"
                    ? fmt(799 * (parseFloat(editValor || "0") / 100))
                    : fmt(parseFloat(editValor || "0"))
                  }
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Líquido Associação:</span>
                <span className="font-bold">
                  {editTipo === "percentual"
                    ? fmt(799 - 799 * (parseFloat(editValor || "0") / 100))
                    : fmt(799 - parseFloat(editValor || "0"))
                  }
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button onClick={saveEdit}><Save className="h-3.5 w-3.5 mr-1" />Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}