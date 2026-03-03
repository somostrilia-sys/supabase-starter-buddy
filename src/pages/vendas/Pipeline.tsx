import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, GripVertical, MoreHorizontal } from "lucide-react";

type PipelineStage = "prospeccao" | "qualificacao" | "proposta" | "negociacao" | "fechamento";

interface Deal {
  id: string;
  nome: string;
  valor: number;
  contato: string;
  stage: PipelineStage;
  created_at: string;
}

const columns: { key: PipelineStage; label: string; color: string }[] = [
  { key: "prospeccao", label: "Prospecção", color: "bg-muted-foreground/20" },
  { key: "qualificacao", label: "Qualificação", color: "bg-primary/20" },
  { key: "proposta", label: "Proposta", color: "bg-warning/20" },
  { key: "negociacao", label: "Negociação", color: "bg-accent/20" },
  { key: "fechamento", label: "Fechamento", color: "bg-success/20" },
];

const emptyDeal = { nome: "", valor: "", contato: "", stage: "prospeccao" as PipelineStage };

export default function Pipeline() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyDeal);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  function addDeal(e: React.FormEvent) {
    e.preventDefault();
    const newDeal: Deal = {
      id: crypto.randomUUID(),
      nome: form.nome,
      valor: parseFloat(form.valor) || 0,
      contato: form.contato,
      stage: form.stage,
      created_at: new Date().toISOString(),
    };
    setDeals([...deals, newDeal]);
    setForm(emptyDeal);
    setOpen(false);
  }

  function handleDragStart(id: string) {
    setDraggedId(id);
  }

  function handleDrop(stage: PipelineStage) {
    if (!draggedId) return;
    setDeals(deals.map((d) => (d.id === draggedId ? { ...d, stage } : d)));
    setDraggedId(null);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline de Vendas</h1>
          <p className="text-muted-foreground text-sm">
            {deals.length} negócios · R$ {deals.reduce((s, d) => s + d.valor, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} total
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Novo Negócio</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Negócio</DialogTitle></DialogHeader>
            <form onSubmit={addDeal} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nome do negócio *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Valor</Label>
                  <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Etapa</Label>
                  <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as PipelineStage })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {columns.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Contato</Label>
                <Input value={form.contato} onChange={(e) => setForm({ ...form, contato: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit">Adicionar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-h-[60vh]">
        {columns.map((col) => {
          const colDeals = deals.filter((d) => d.stage === col.key);
          const colTotal = colDeals.reduce((s, d) => s + d.valor, 0);
          return (
            <div
              key={col.key}
              className="flex flex-col rounded-xl bg-muted/40 border border-border/50"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(col.key)}
            >
              <div className="p-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-foreground/70">{col.label}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-0 bg-muted">
                    {colDeals.length}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  R$ {colTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {colDeals.map((deal) => (
                  <Card
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal.id)}
                    className="border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-3 space-y-1.5">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium leading-tight">{deal.nome}</p>
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                      </div>
                      {deal.contato && (
                        <p className="text-xs text-muted-foreground">{deal.contato}</p>
                      )}
                      <p className="text-xs font-semibold text-primary">
                        R$ {deal.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {colDeals.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50">
                    Arraste cards aqui
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
