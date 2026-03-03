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
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Plus, GripVertical, Calendar, User, Search, Filter, LayoutGrid, List,
  Tag as TagIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

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

interface DealTag {
  deal_id: string;
  tag: { id: string; nome: string; cor: string };
}

const columns: { key: DealStage; label: string; dotColor: string }[] = [
  { key: "prospeccao", label: "Prospecção", dotColor: "bg-muted-foreground" },
  { key: "qualificacao", label: "Qualificação", dotColor: "bg-primary" },
  { key: "proposta", label: "Proposta", dotColor: "bg-warning" },
  { key: "negociacao", label: "Negociação", dotColor: "bg-accent" },
  { key: "fechamento", label: "Fechamento", dotColor: "bg-success" },
];

const origens = ["Facebook", "Google", "Indicação", "Formulário", "Telefone", "WhatsApp", "Site", "Afiliado"];

const emptyForm = {
  titulo: "", valor: "", stage: "prospeccao" as DealStage,
  contato_nome: "", contato_telefone: "", contato_email: "",
  origem: "", data_previsao: "", observacoes: "",
};

export default function Pipeline() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [dealTags, setDealTags] = useState<Record<string, { id: string; nome: string; cor: string }[]>>({});

  const loadDeals = useCallback(async () => {
    const { data } = await supabase
      .from("deals").select("*").eq("status", "aberto")
      .order("posicao").order("created_at", { ascending: false });
    if (data) setDeals(data as Deal[]);
    setLoading(false);
  }, []);

  const loadDealTags = useCallback(async () => {
    const { data } = await supabase
      .from("deal_tags").select("deal_id, tag:tags(id, nome, cor)");
    if (data) {
      const map: Record<string, { id: string; nome: string; cor: string }[]> = {};
      (data as any[]).forEach((dt: any) => {
        if (!map[dt.deal_id]) map[dt.deal_id] = [];
        if (dt.tag) map[dt.deal_id].push(dt.tag);
      });
      setDealTags(map);
    }
  }, []);

  useEffect(() => { loadDeals(); loadDealTags(); }, [loadDeals, loadDealTags]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      titulo: form.titulo, valor: parseFloat(form.valor) || 0, stage: form.stage,
      contato_nome: form.contato_nome || null, contato_telefone: form.contato_telefone || null,
      contato_email: form.contato_email || null, origem: form.origem || null,
      data_previsao: form.data_previsao || null, observacoes: form.observacoes || null,
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
          ...payload, status: "aberto" as DealStatus, posicao: stageDeals.length,
        }]);
        if (error) throw error;
        toast({ title: "Negócio criado!" });
      }
      closeForm(); loadDeals();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally { setSaving(false); }
  }

  function closeForm() { setFormOpen(false); setEditing(null); setForm(emptyForm); }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id); e.dataTransfer.effectAllowed = "move";
  }
  function handleDragOver(e: React.DragEvent, stage: DealStage) {
    e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverStage(stage);
  }
  function handleDragLeave() { setDragOverStage(null); }

  async function handleDrop(stage: DealStage) {
    setDragOverStage(null);
    if (!draggedId) return;
    const deal = deals.find(d => d.id === draggedId);
    if (!deal || deal.stage === stage) { setDraggedId(null); return; }
    setDeals(prev => prev.map(d => d.id === draggedId ? { ...d, stage } : d));
    setDraggedId(null);
    const { error } = await supabase.from("deals").update({
      stage, posicao: deals.filter(d => d.stage === stage).length,
    }).eq("id", draggedId);
    if (error) { toast({ title: "Erro ao mover", variant: "destructive" }); loadDeals(); }
    else {
      await supabase.from("deal_activities").insert([{
        deal_id: draggedId, tipo: "mudanca_etapa",
        descricao: `Movido para ${columns.find(c => c.key === stage)?.label}`,
        user_id: user?.id || null,
      }]);
    }
  }

  const filteredDeals = deals.filter(d =>
    d.status === "aberto" && (
      !searchTerm ||
      d.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.contato_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.origem?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  const totalValue = filteredDeals.reduce((s, d) => s + Number(d.valor), 0);

  function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
  function timeAgo(date: string) {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (days === 0) return "hoje"; if (days === 1) return "ontem"; return `${days}d`;
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline de Vendas</h1>
          <p className="text-muted-foreground text-sm">
            {filteredDeals.length} negócios · {fmt(totalValue)} em pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar negócio..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-56" />
          </div>
          <div className="flex border rounded-lg overflow-hidden">
            <Button size="icon" variant={viewMode === "kanban" ? "default" : "ghost"} className="rounded-none h-9 w-9" onClick={() => setViewMode("kanban")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button size="icon" variant={viewMode === "list" ? "default" : "ghost"} className="rounded-none h-9 w-9" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={formOpen} onOpenChange={(o) => { if (!o) closeForm(); else setFormOpen(true); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Nova Negociação</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? "Editar" : "Nova Negociação"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Título *</Label>
                  <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Proteção Honda Civic - João" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Valor</Label><Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" /></div>
                  <div className="space-y-1.5"><Label>Etapa</Label>
                    <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as DealStage })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{columns.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
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
                  <div className="space-y-1.5"><Label>Origem</Label>
                    <Select value={form.origem} onValueChange={(v) => setForm({ ...form, origem: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{origens.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>Previsão fechamento</Label><Input type="date" value={form.data_previsao} onChange={(e) => setForm({ ...form, data_previsao: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} /></div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeForm}>Cancelar</Button>
                  <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {viewMode === "kanban" ? (
        /* Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 min-h-[65vh]">
          {columns.map((col) => {
            const colDeals = filteredDeals.filter(d => d.stage === col.key);
            const colTotal = colDeals.reduce((s, d) => s + Number(d.valor), 0);
            const isOver = dragOverStage === col.key;
            return (
              <div key={col.key}
                className={`flex flex-col rounded-xl transition-colors ${isOver ? "bg-primary/5 ring-2 ring-primary/20" : "bg-muted/30"}`}
                onDragOver={(e) => handleDragOver(e, col.key)} onDragLeave={handleDragLeave} onDrop={() => handleDrop(col.key)}
              >
                <div className="p-3 border-b border-border/40">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">{col.label}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-0 bg-background/80 font-mono">{colDeals.length}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">{fmt(colTotal)}</p>
                </div>
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(65vh-60px)]">
                  {colDeals.map((deal) => (
                    <Card key={deal.id} draggable onDragStart={(e) => handleDragStart(e, deal.id)}
                      onClick={() => navigate(`/vendas/negociacao/${deal.id}`)}
                      className={`border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all hover:border-primary/30 ${draggedId === deal.id ? "opacity-40 scale-95" : ""}`}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-[13px] font-medium leading-tight line-clamp-2">{deal.titulo}</p>
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 mt-0.5" />
                        </div>
                        <p className="text-sm font-bold text-primary">{fmt(Number(deal.valor))}</p>
                        {deal.contato_nome && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <User className="h-3 w-3" /><span className="text-[11px] truncate">{deal.contato_nome}</span>
                          </div>
                        )}
                        {/* Tags */}
                        {dealTags[deal.id]?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {dealTags[deal.id].map(t => (
                              <span key={t.id} className="text-[9px] px-1.5 py-0 rounded-full text-white font-medium" style={{ backgroundColor: t.cor }}>{t.nome}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          {deal.data_previsao && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" /><span className="text-[10px]">{new Date(deal.data_previsao).toLocaleDateString("pt-BR")}</span>
                            </div>
                          )}
                          <span className="text-[10px] text-muted-foreground/60">{timeAgo(deal.created_at)}</span>
                        </div>
                        {deal.origem && <Badge variant="outline" className="text-[9px] border-border/50 px-1.5 py-0">{deal.origem}</Badge>}
                      </CardContent>
                    </Card>
                  ))}
                  {colDeals.length === 0 && <div className="flex items-center justify-center h-24 text-muted-foreground/40"><p className="text-xs">Arraste cards aqui</p></div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/30">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Título</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Contato</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Valor</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Etapa</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Origem</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Criado</th>
              </tr></thead>
              <tbody>
                {filteredDeals.map(deal => (
                  <tr key={deal.id} className="border-b hover:bg-muted/20 cursor-pointer" onClick={() => navigate(`/vendas/negociacao/${deal.id}`)}>
                    <td className="p-3 font-medium">{deal.titulo}</td>
                    <td className="p-3 text-muted-foreground">{deal.contato_nome || "—"}</td>
                    <td className="p-3 font-semibold text-primary">{fmt(Number(deal.valor))}</td>
                    <td className="p-3"><Badge variant="outline" className="text-xs">{columns.find(c => c.key === deal.stage)?.label}</Badge></td>
                    <td className="p-3 text-muted-foreground">{deal.origem || "—"}</td>
                    <td className="p-3 text-muted-foreground text-xs">{new Date(deal.created_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
