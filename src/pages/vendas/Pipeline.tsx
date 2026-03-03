import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Plus, GripVertical, Phone, Mail, Calendar, Clock,
  MessageSquare, Edit, Trash2, X, User, DollarSign, Send,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type DealStage = "prospeccao" | "qualificacao" | "proposta" | "negociacao" | "fechamento";
type DealStatus = "aberto" | "ganho" | "perdido";

interface Deal {
  id: string;
  titulo: string;
  valor: number;
  stage: DealStage;
  status: DealStatus;
  contato_nome: string | null;
  contato_telefone: string | null;
  contato_email: string | null;
  origem: string | null;
  data_previsao: string | null;
  observacoes: string | null;
  posicao: number;
  created_at: string;
  updated_at: string;
}

interface DealActivity {
  id: string;
  deal_id: string;
  tipo: string;
  descricao: string;
  created_at: string;
}

const columns: { key: DealStage; label: string; dotColor: string }[] = [
  { key: "prospeccao", label: "Prospecção", dotColor: "bg-muted-foreground" },
  { key: "qualificacao", label: "Qualificação", dotColor: "bg-primary" },
  { key: "proposta", label: "Proposta", dotColor: "bg-warning" },
  { key: "negociacao", label: "Negociação", dotColor: "bg-accent" },
  { key: "fechamento", label: "Fechamento", dotColor: "bg-success" },
];

const emptyForm = {
  titulo: "",
  valor: "",
  stage: "prospeccao" as DealStage,
  contato_nome: "",
  contato_telefone: "",
  contato_email: "",
  origem: "",
  data_previsao: "",
  observacoes: "",
};

export default function Pipeline() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);

  // Detail sheet
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [activities, setActivities] = useState<DealActivity[]>([]);
  const [newNote, setNewNote] = useState("");

  const loadDeals = useCallback(async () => {
    const { data } = await supabase
      .from("deals")
      .select("*")
      .eq("status", "aberto")
      .order("posicao")
      .order("created_at", { ascending: false });
    if (data) setDeals(data as Deal[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadDeals(); }, [loadDeals]);

  async function loadActivities(dealId: string) {
    const { data } = await supabase
      .from("deal_activities")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false });
    if (data) setActivities(data as DealActivity[]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      titulo: form.titulo,
      valor: parseFloat(form.valor) || 0,
      stage: form.stage,
      contato_nome: form.contato_nome || null,
      contato_telefone: form.contato_telefone || null,
      contato_email: form.contato_email || null,
      origem: form.origem || null,
      data_previsao: form.data_previsao || null,
      observacoes: form.observacoes || null,
      responsavel_id: user?.id || null,
    };

    try {
      if (editing) {
        const { error } = await supabase.from("deals").update(payload).eq("id", editing);
        if (error) throw error;
        toast({ title: "Negócio atualizado!" });
      } else {
        const stageDeals = deals.filter(d => d.stage === form.stage);
        const { error } = await supabase.from("deals").insert([{
          ...payload,
          status: "aberto" as DealStatus,
          posicao: stageDeals.length,
        }]);
        if (error) throw error;

        // Log activity
        toast({ title: "Negócio criado!" });
      }
      closeForm();
      loadDeals();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  function openEdit(deal: Deal) {
    setEditing(deal.id);
    setForm({
      titulo: deal.titulo,
      valor: deal.valor.toString(),
      stage: deal.stage,
      contato_nome: deal.contato_nome || "",
      contato_telefone: deal.contato_telefone || "",
      contato_email: deal.contato_email || "",
      origem: deal.origem || "",
      data_previsao: deal.data_previsao || "",
      observacoes: deal.observacoes || "",
    });
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este negócio?")) return;
    await supabase.from("deals").delete().eq("id", id);
    setSelectedDeal(null);
    loadDeals();
    toast({ title: "Negócio excluído" });
  }

  async function markAs(id: string, status: DealStatus) {
    await supabase.from("deals").update({ status }).eq("id", id);
    setSelectedDeal(null);
    loadDeals();
    toast({ title: status === "ganho" ? "🎉 Negócio ganho!" : "Negócio perdido" });
  }

  // Drag & Drop
  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, stage: DealStage) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  }

  function handleDragLeave() {
    setDragOverStage(null);
  }

  async function handleDrop(stage: DealStage) {
    setDragOverStage(null);
    if (!draggedId) return;
    const deal = deals.find(d => d.id === draggedId);
    if (!deal || deal.stage === stage) { setDraggedId(null); return; }

    // Optimistic update
    setDeals(prev => prev.map(d => d.id === draggedId ? { ...d, stage } : d));
    setDraggedId(null);

    const { error } = await supabase.from("deals").update({
      stage,
      posicao: deals.filter(d => d.stage === stage).length,
    }).eq("id", draggedId);

    if (error) {
      toast({ title: "Erro ao mover", variant: "destructive" });
      loadDeals();
    } else {
      // Log stage change
      await supabase.from("deal_activities").insert([{
        deal_id: draggedId,
        tipo: "mudanca_etapa",
        descricao: `Movido para ${columns.find(c => c.key === stage)?.label}`,
        user_id: user?.id || null,
      }]);
    }
  }

  async function openDetail(deal: Deal) {
    setSelectedDeal(deal);
    loadActivities(deal.id);
  }

  async function addNote() {
    if (!newNote.trim() || !selectedDeal) return;
    await supabase.from("deal_activities").insert([{
      deal_id: selectedDeal.id,
      tipo: "nota",
      descricao: newNote.trim(),
      user_id: user?.id || null,
    }]);
    setNewNote("");
    loadActivities(selectedDeal.id);
  }

  // Stats
  const openDeals = deals.filter(d => d.status === "aberto");
  const totalValue = openDeals.reduce((s, d) => s + Number(d.valor), 0);

  function formatCurrency(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "hoje";
    if (days === 1) return "ontem";
    return `${days}d atrás`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline de Vendas</h1>
          <p className="text-muted-foreground text-sm">
            {openDeals.length} negócios abertos · {formatCurrency(totalValue)} em pipeline
          </p>
        </div>
        <Dialog open={formOpen} onOpenChange={(o) => { if (!o) closeForm(); else setFormOpen(true); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Novo Negócio</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Negócio" : "Novo Negócio"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Título *</Label>
                <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Proteção Honda Civic - João Silva" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Valor</Label>
                  <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" />
                </div>
                <div className="space-y-1.5">
                  <Label>Etapa</Label>
                  <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as DealStage })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {columns.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contato</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Nome</Label><Input value={form.contato_nome} onChange={(e) => setForm({ ...form, contato_nome: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Telefone</Label><Input value={form.contato_telefone} onChange={(e) => setForm({ ...form, contato_telefone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" value={form.contato_email} onChange={(e) => setForm({ ...form, contato_email: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Origem</Label><Input value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} placeholder="Indicação, site..." /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Previsão fechamento</Label><Input type="date" value={form.data_previsao} onChange={(e) => setForm({ ...form, data_previsao: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} /></div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeForm}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 min-h-[65vh]">
        {columns.map((col) => {
          const colDeals = openDeals.filter((d) => d.stage === col.key);
          const colTotal = colDeals.reduce((s, d) => s + Number(d.valor), 0);
          const isOver = dragOverStage === col.key;

          return (
            <div
              key={col.key}
              className={`flex flex-col rounded-xl transition-colors ${
                isOver
                  ? "bg-primary/5 ring-2 ring-primary/20"
                  : "bg-muted/30"
              }`}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(col.key)}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-border/40">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">
                      {col.label}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-0 bg-background/80 font-mono">
                    {colDeals.length}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground font-medium">
                  {formatCurrency(colTotal)}
                </p>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(65vh-60px)]">
                {colDeals.map((deal) => (
                  <Card
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    onClick={() => openDetail(deal)}
                    className={`border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all hover:border-primary/30 ${
                      draggedId === deal.id ? "opacity-40 scale-95" : ""
                    }`}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-[13px] font-medium leading-tight line-clamp-2">{deal.titulo}</p>
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 mt-0.5" />
                      </div>

                      <p className="text-sm font-bold text-primary">
                        {formatCurrency(Number(deal.valor))}
                      </p>

                      {deal.contato_nome && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="text-[11px] truncate">{deal.contato_nome}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        {deal.data_previsao && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span className="text-[10px]">
                              {new Date(deal.data_previsao).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        )}
                        <span className="text-[10px] text-muted-foreground/60">
                          {timeAgo(deal.created_at)}
                        </span>
                      </div>

                      {deal.origem && (
                        <Badge variant="outline" className="text-[9px] border-border/50 px-1.5 py-0">
                          {deal.origem}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {colDeals.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-24 text-muted-foreground/40">
                    <p className="text-xs">Arraste cards aqui</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deal Detail Sheet */}
      <Sheet open={!!selectedDeal} onOpenChange={(o) => { if (!o) setSelectedDeal(null); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedDeal && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <SheetTitle className="text-lg leading-tight pr-4">{selectedDeal.titulo}</SheetTitle>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`border-0 ${columns.find(c => c.key === selectedDeal.stage)?.dotColor}/15 text-foreground text-xs`}>
                    {columns.find(c => c.key === selectedDeal.stage)?.label}
                  </Badge>
                  <span className="text-lg font-bold text-primary">{formatCurrency(Number(selectedDeal.valor))}</span>
                </div>
              </SheetHeader>

              <Separator />

              {/* Contact Info */}
              <div className="py-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contato</p>
                {selectedDeal.contato_nome && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {selectedDeal.contato_nome}
                  </div>
                )}
                {selectedDeal.contato_telefone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {selectedDeal.contato_telefone}
                  </div>
                )}
                {selectedDeal.contato_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {selectedDeal.contato_email}
                  </div>
                )}
                {selectedDeal.data_previsao && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Previsão: {new Date(selectedDeal.data_previsao).toLocaleDateString("pt-BR")}
                  </div>
                )}
                {selectedDeal.observacoes && (
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{selectedDeal.observacoes}</p>
                )}
              </div>

              <Separator />

              {/* Actions */}
              <div className="py-4 flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => openEdit(selectedDeal)}>
                  <Edit className="mr-1.5 h-3.5 w-3.5" /> Editar
                </Button>
                <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => markAs(selectedDeal.id, "ganho")}>
                  🎉 Ganhou
                </Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => markAs(selectedDeal.id, "perdido")}>
                  Perdeu
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(selectedDeal.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <Separator />

              {/* Activities / Notes */}
              <div className="py-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Atividades</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar nota..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNote(); } }}
                    className="text-sm"
                  />
                  <Button size="icon" variant="outline" onClick={addNote} disabled={!newNote.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {activities.map((act) => (
                    <div key={act.id} className="flex gap-2 text-sm">
                      <div className="mt-1">
                        {act.tipo === "nota" ? (
                          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px]">{act.descricao}</p>
                        <p className="text-[10px] text-muted-foreground">{timeAgo(act.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhuma atividade registrada</p>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
