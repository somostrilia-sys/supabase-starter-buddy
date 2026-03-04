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
  Plus, GripVertical, Calendar, User, Search, LayoutGrid, List,
  Car, DollarSign, TrendingUp,
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

const columns: { key: DealStage; label: string; borderColor: string; bgClass: string; dotColor: string }[] = [
  { key: "prospeccao", label: "Prospecção", borderColor: "#3B82F6", bgClass: "bg-[#3B82F6]/[0.06]", dotColor: "bg-[#3B82F6]" },
  { key: "qualificacao", label: "Qualificação", borderColor: "#F59E0B", bgClass: "bg-[#F59E0B]/[0.06]", dotColor: "bg-[#F59E0B]" },
  { key: "proposta", label: "Proposta", borderColor: "#8B5CF6", bgClass: "bg-[#8B5CF6]/[0.06]", dotColor: "bg-[#8B5CF6]" },
  { key: "negociacao", label: "Negociação", borderColor: "#F97316", bgClass: "bg-[#F97316]/[0.06]", dotColor: "bg-[#F97316]" },
  { key: "fechamento", label: "Fechamento", borderColor: "#22C55E", bgClass: "bg-[#22C55E]/[0.06]", dotColor: "bg-[#22C55E]" },
];

const origens = ["Facebook", "Google", "Indicação", "Formulário", "Telefone", "WhatsApp", "Site", "Afiliado"];

const origemColors: Record<string, string> = {
  Facebook: "bg-[#2563EB] text-white",
  WhatsApp: "bg-[#16A34A] text-white",
  Telefone: "bg-[#4B5563] text-white",
  "Indicação": "bg-[#7C3AED] text-white",
  Google: "bg-[#DC2626] text-white",
  "Formulário": "bg-[#0891B2] text-white",
  Site: "bg-[#0D9488] text-white",
  Afiliado: "bg-[#D97706] text-white",
};

const emptyForm = {
  titulo: "", valor: "", stage: "prospeccao" as DealStage,
  contato_nome: "", contato_telefone: "", contato_email: "",
  origem: "", data_previsao: "", observacoes: "",
};

// Mock data
const mockDeals: Deal[] = [
  // Prospecção (5)
  { id: "m1", titulo: "Chevrolet Onix 2024", valor: 1200, stage: "prospeccao", status: "aberto", contato_nome: "Carlos Silva", contato_telefone: "(11) 99999-1111", contato_email: "carlos@email.com", origem: "Facebook", data_previsao: "2026-03-15", observacoes: "Placa: ABC1D23", posicao: 0, created_at: new Date(Date.now() - 2 * 3600000).toISOString(), updated_at: new Date().toISOString() },
  { id: "m2", titulo: "Hyundai HB20 2023", valor: 980, stage: "prospeccao", status: "aberto", contato_nome: "Maria Oliveira", contato_telefone: "(11) 99999-2222", contato_email: "maria@email.com", origem: "WhatsApp", data_previsao: "2026-03-20", observacoes: "Placa: DEF2G34", posicao: 1, created_at: new Date(Date.now() - 5 * 3600000).toISOString(), updated_at: new Date().toISOString() },
  { id: "m3", titulo: "VW Gol 2022", valor: 850, stage: "prospeccao", status: "aberto", contato_nome: "Pedro Santos", contato_telefone: "(11) 99999-3333", contato_email: "pedro@email.com", origem: "Telefone", data_previsao: "2026-03-18", observacoes: "Placa: GHI3J45", posicao: 2, created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date().toISOString() },
  { id: "m4", titulo: "Fiat Argo 2024", valor: 1100, stage: "prospeccao", status: "aberto", contato_nome: "Ana Costa", contato_telefone: "(11) 99999-4444", contato_email: "ana@email.com", origem: "Indicação", data_previsao: "2026-03-22", observacoes: "Placa: JKL4M56", posicao: 3, created_at: new Date(Date.now() - 2 * 86400000).toISOString(), updated_at: new Date().toISOString() },
  { id: "m5", titulo: "Renault Kwid 2023", valor: 750, stage: "prospeccao", status: "aberto", contato_nome: "João Lima", contato_telefone: "(11) 99999-5555", contato_email: "joao@email.com", origem: "Google", data_previsao: "2026-03-25", observacoes: "Placa: MNO5P67", posicao: 4, created_at: new Date(Date.now() - 3 * 86400000).toISOString(), updated_at: new Date().toISOString() },
  // Qualificação (3)
  { id: "m6", titulo: "Honda Civic 2024", valor: 2450, stage: "qualificacao", status: "aberto", contato_nome: "Roberto Souza", contato_telefone: "(11) 99999-6666", contato_email: "roberto@email.com", origem: "WhatsApp", data_previsao: "2026-03-12", observacoes: "Placa: QRS6T78", posicao: 0, created_at: new Date(Date.now() - 4 * 3600000).toISOString(), updated_at: new Date().toISOString() },
  { id: "m7", titulo: "Toyota Corolla 2023", valor: 2200, stage: "qualificacao", status: "aberto", contato_nome: "Fernanda Alves", contato_telefone: "(11) 99999-7777", contato_email: "fernanda@email.com", origem: "Facebook", data_previsao: "2026-03-14", observacoes: "Placa: UVW7X89", posicao: 1, created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date().toISOString() },
  { id: "m8", titulo: "VW T-Cross 2024", valor: 1800, stage: "qualificacao", status: "aberto", contato_nome: "Lucas Pereira", contato_telefone: "(11) 99999-8888", contato_email: "lucas@email.com", origem: "Indicação", data_previsao: "2026-03-16", observacoes: "Placa: YZA8B01", posicao: 2, created_at: new Date(Date.now() - 6 * 3600000).toISOString(), updated_at: new Date().toISOString() },
  // Proposta (3)
  { id: "m9", titulo: "Toyota Hilux 2024", valor: 3500, stage: "proposta", status: "aberto", contato_nome: "Marcos Ribeiro", contato_telefone: "(11) 99999-9999", contato_email: "marcos@email.com", origem: "Telefone", data_previsao: "2026-03-10", observacoes: "Placa: BCD9E12", posicao: 0, created_at: new Date(Date.now() - 3 * 3600000).toISOString(), updated_at: new Date().toISOString() },
  { id: "m10", titulo: "Toyota SW4 2023", valor: 4200, stage: "proposta", status: "aberto", contato_nome: "Juliana Mendes", contato_telefone: "(21) 99999-1010", contato_email: "juliana@email.com", origem: "WhatsApp", data_previsao: "2026-03-11", observacoes: "Placa: FGH0I23", posicao: 1, created_at: new Date(Date.now() - 2 * 86400000).toISOString(), updated_at: new Date().toISOString() },
  { id: "m11", titulo: "Chevrolet Tracker 2024", valor: 1950, stage: "proposta", status: "aberto", contato_nome: "Ricardo Barbosa", contato_telefone: "(21) 99999-1111", contato_email: "ricardo@email.com", origem: "Facebook", data_previsao: "2026-03-13", observacoes: "Placa: JKL1M34", posicao: 2, created_at: new Date(Date.now() - 7 * 3600000).toISOString(), updated_at: new Date().toISOString() },
  // Negociação (2)
  { id: "m12", titulo: "Jeep Compass 2024", valor: 3800, stage: "negociacao", status: "aberto", contato_nome: "Patricia Ferreira", contato_telefone: "(21) 99999-1212", contato_email: "patricia@email.com", origem: "Indicação", data_previsao: "2026-03-08", observacoes: "Placa: NOP2Q45", posicao: 0, created_at: new Date(Date.now() - 1 * 3600000).toISOString(), updated_at: new Date().toISOString() },
  { id: "m13", titulo: "Hyundai Tucson 2023", valor: 3200, stage: "negociacao", status: "aberto", contato_nome: "André Martins", contato_telefone: "(21) 99999-1313", contato_email: "andre@email.com", origem: "Google", data_previsao: "2026-03-09", observacoes: "Placa: RST3U56", posicao: 1, created_at: new Date(Date.now() - 10 * 3600000).toISOString(), updated_at: new Date().toISOString() },
  // Fechamento (4) — note: user listed 4 but we had 2 in Negociação above
  { id: "m14", titulo: "Hyundai Creta 2024", valor: 2800, stage: "fechamento", status: "aberto", contato_nome: "Camila Rocha", contato_telefone: "(31) 99999-1414", contato_email: "camila@email.com", origem: "WhatsApp", data_previsao: "2026-03-06", observacoes: "Placa: VWX4Y67", posicao: 0, created_at: new Date(Date.now() - 30 * 60000).toISOString(), updated_at: new Date().toISOString() },
  { id: "m15", titulo: "Honda HR-V 2023", valor: 2600, stage: "fechamento", status: "aberto", contato_nome: "Bruno Cardoso", contato_telefone: "(31) 99999-1515", contato_email: "bruno@email.com", origem: "Telefone", data_previsao: "2026-03-07", observacoes: "Placa: ZAB5C78", posicao: 1, created_at: new Date(Date.now() - 45 * 60000).toISOString(), updated_at: new Date().toISOString() },
  { id: "m16", titulo: "Nissan Kicks 2024", valor: 2100, stage: "fechamento", status: "aberto", contato_nome: "Tatiana Dias", contato_telefone: "(31) 99999-1616", contato_email: "tatiana@email.com", origem: "Facebook", data_previsao: "2026-03-05", observacoes: "Placa: DEF6G89", posicao: 2, created_at: new Date(Date.now() - 5 * 86400000).toISOString(), updated_at: new Date().toISOString() },
  { id: "m17", titulo: "Jeep Renegade 2023", valor: 1900, stage: "fechamento", status: "aberto", contato_nome: "Felipe Nunes", contato_telefone: "(31) 99999-1717", contato_email: "felipe@email.com", origem: "Indicação", data_previsao: "2026-03-04", observacoes: "Placa: HIJ7K01", posicao: 3, created_at: new Date(Date.now() - 4 * 86400000).toISOString(), updated_at: new Date().toISOString() },
];

const responsaveis = ["Maria Santos", "João Pedro", "Ana Costa"];

function getResponsavel(index: number) {
  return responsaveis[index % responsaveis.length];
}

function extractPlaca(obs: string | null): string | null {
  if (!obs) return null;
  const match = obs.match(/Placa:\s*([A-Z]{3}\d[A-Z]\d{2})/i);
  return match ? match[1] : null;
}

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
    // Merge real deals with mock, prioritizing real
    const realDeals = (data || []) as Deal[];
    const realIds = new Set(realDeals.map(d => d.id));
    const combined = [...realDeals, ...mockDeals.filter(m => !realIds.has(m.id))];
    setDeals(combined);
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
    // Only update in DB if it's a real deal (not mock)
    if (!draggedId.startsWith("m")) {
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
    const now = Date.now();
    const diff = now - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `há ${mins}min`;
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(diff / 86400000);
    if (days === 1) return "ontem";
    return `há ${days} dias`;
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline de Vendas</h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-[#22C55E]" />
              <span className="text-lg font-bold text-foreground">{filteredDeals.length} negociações</span>
            </div>
            <span className="text-muted-foreground">·</span>
            <span className="text-lg font-bold text-[#22C55E]">{fmt(totalValue)}</span>
            <span className="text-sm text-muted-foreground">em pipeline</span>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 min-h-[68vh]">
          {columns.map((col) => {
            const colDeals = filteredDeals.filter(d => d.stage === col.key);
            const colTotal = colDeals.reduce((s, d) => s + Number(d.valor), 0);
            const pct = totalValue > 0 ? (colTotal / totalValue) * 100 : 0;
            const isOver = dragOverStage === col.key;
            return (
              <div key={col.key}
                className={`flex flex-col rounded-xl overflow-hidden transition-all duration-200 ${isOver ? "ring-2 shadow-lg" : "shadow-sm"} ${col.bgClass}`}
                style={{
                  borderTop: `4px solid ${col.borderColor}`,
                  ...(isOver ? { ringColor: col.borderColor, boxShadow: `0 0 20px ${col.borderColor}33` } : {}),
                }}
                onDragOver={(e) => handleDragOver(e, col.key)} onDragLeave={handleDragLeave} onDrop={() => handleDrop(col.key)}
              >
                {/* Column header */}
                <div className="px-3 pt-3 pb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/80">{col.label}</span>
                    </div>
                    <span className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-background/60 text-foreground/70">{colDeals.length}</span>
                  </div>
                  <p className="text-[12px] font-semibold text-foreground/60 mb-2">{fmt(colTotal)}</p>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-background/40 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: col.borderColor }}
                    />
                  </div>
                  <p className="text-[9px] text-foreground/40 mt-0.5 text-right">{pct.toFixed(0)}% do total</p>
                </div>

                {/* Cards */}
                <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto max-h-[calc(68vh-100px)]">
                  {colDeals.map((deal, idx) => {
                    const placa = extractPlaca(deal.observacoes);
                    const resp = getResponsavel(idx);
                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        onClick={() => navigate(`/vendas/negociacao/${deal.id}`)}
                        className={`group relative bg-card rounded-lg border border-border/50 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-border ${draggedId === deal.id ? "opacity-40 scale-95" : ""}`}
                        style={{ borderLeft: `3px solid ${col.borderColor}` }}
                      >
                        <div className="p-3 space-y-2">
                          {/* Title + grip */}
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              <Car className="h-3.5 w-3.5 shrink-0" style={{ color: col.borderColor }} />
                              <p className="text-[13px] font-semibold leading-tight line-clamp-2">{deal.titulo}</p>
                            </div>
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/20 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>

                          {/* Valor */}
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5 text-[#22C55E]" />
                            <p className="text-sm font-bold text-[#22C55E]">{fmt(Number(deal.valor))}</p>
                          </div>

                          {/* Placa */}
                          {placa && (
                            <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground tracking-wider">
                              {placa}
                            </span>
                          )}

                          {/* Contato */}
                          {deal.contato_nome && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span className="text-[11px] truncate">{deal.contato_nome}</span>
                            </div>
                          )}

                          {/* Responsável */}
                          <div className="flex items-center gap-1.5 text-muted-foreground/70">
                            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-[8px] font-bold text-primary">{resp.charAt(0)}</span>
                            </div>
                            <span className="text-[10px]">{resp}</span>
                          </div>

                          {/* Tags */}
                          {dealTags[deal.id]?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {dealTags[deal.id].map(t => (
                                <span key={t.id} className="text-[9px] px-1.5 py-0 rounded-full text-white font-medium" style={{ backgroundColor: t.cor }}>{t.nome}</span>
                              ))}
                            </div>
                          )}

                          {/* Bottom row */}
                          <div className="flex items-center justify-between pt-1 border-t border-border/30">
                            <div className="flex items-center gap-2">
                              {deal.origem && (
                                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${origemColors[deal.origem] || "bg-muted text-muted-foreground"}`}>
                                  {deal.origem}
                                </span>
                              )}
                              {deal.data_previsao && (
                                <div className="flex items-center gap-0.5 text-muted-foreground/60">
                                  <Calendar className="h-2.5 w-2.5" />
                                  <span className="text-[9px]">{new Date(deal.data_previsao).toLocaleDateString("pt-BR")}</span>
                                </div>
                              )}
                            </div>
                            <span className="text-[9px] text-muted-foreground/50">{timeAgo(deal.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {colDeals.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/30 gap-2">
                      <Car className="h-6 w-6" />
                      <p className="text-xs">Arraste cards aqui</p>
                    </div>
                  )}
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
                    <td className="p-3 font-medium">
                      <div className="flex items-center gap-2">
                        <Car className="h-3.5 w-3.5 text-muted-foreground" />
                        {deal.titulo}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{deal.contato_nome || "—"}</td>
                    <td className="p-3 font-semibold text-[#22C55E]">{fmt(Number(deal.valor))}</td>
                    <td className="p-3">
                      <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${columns.find(c => c.key === deal.stage)?.borderColor}20`, color: columns.find(c => c.key === deal.stage)?.borderColor }}>
                        {columns.find(c => c.key === deal.stage)?.label}
                      </span>
                    </td>
                    <td className="p-3">
                      {deal.origem ? (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${origemColors[deal.origem] || "bg-muted text-muted-foreground"}`}>{deal.origem}</span>
                      ) : "—"}
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{timeAgo(deal.created_at)}</td>
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
