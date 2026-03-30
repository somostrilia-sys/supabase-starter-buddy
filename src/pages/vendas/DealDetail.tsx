import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, User, Phone, Mail, Calendar, Clock, MapPin,
  MessageSquare, Send, Edit, Trash2, FileText, Tag as TagIcon,
  Eye, Plus, CheckCircle, XCircle, DollarSign,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const stageLabels: Record<string, string> = {
  prospeccao: "Prospecção", qualificacao: "Qualificação",
  proposta: "Proposta", negociacao: "Negociação", fechamento: "Fechamento",
};

const stageColors: Record<string, string> = {
  prospeccao: "bg-muted-foreground", qualificacao: "bg-primary",
  proposta: "bg-warning", negociacao: "bg-accent", fechamento: "bg-success",
};

export default function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deal, setDeal] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [dealTagIds, setDealTagIds] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [propostas, setPropostas] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Proposta form
  const [propostaOpen, setPropostaOpen] = useState(false);
  const [propostaForm, setPropostaForm] = useState({ titulo: "", descricao: "", valor_total: "", validade: "" });

  const load = useCallback(async () => {
    if (!id) return;
    const [dealRes, actRes, tagsRes, allTagsRes, propRes] = await Promise.all([
      supabase.from("deals").select("*").eq("id", id).single(),
      supabase.from("deal_activities").select("*").eq("deal_id", id).order("created_at", { ascending: false }),
      supabase.from("deal_tags").select("tag_id, tag:tags(id, nome, cor)").eq("deal_id", id),
      supabase.from("tags").select("*").order("nome"),
      supabase.from("propostas").select("*").eq("deal_id", id).order("created_at", { ascending: false }),
    ]);
    if (dealRes.data) { setDeal(dealRes.data); setEditForm(dealRes.data); }
    if (actRes.data) setActivities(actRes.data);
    if (tagsRes.data) {
      setTags((tagsRes.data as any[]).map((t: any) => t.tag).filter(Boolean));
      setDealTagIds((tagsRes.data as any[]).map((t: any) => t.tag_id));
    }
    if (allTagsRes.data) setAllTags(allTagsRes.data);
    if (propRes.data) setPropostas(propRes.data);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function addNote() {
    if (!newNote.trim() || !id) return;
    await supabase.from("deal_activities").insert([{
      deal_id: id, tipo: "nota", descricao: newNote.trim(), user_id: user?.id || null,
    }]);
    setNewNote(""); load();
  }

  async function saveEdit() {
    if (!id) return;
    const { error } = await supabase.from("deals").update({
      titulo: editForm.titulo, valor: editForm.valor,
      contato_nome: editForm.contato_nome, contato_telefone: editForm.contato_telefone,
      contato_email: editForm.contato_email, origem: editForm.origem,
      data_previsao: editForm.data_previsao, observacoes: editForm.observacoes,
      stage: editForm.stage,
    }).eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Salvo!" }); setEditing(false); load(); }
  }

  async function markAs(status: "aberto" | "ganho" | "perdido") {
    if (!id) return;
    await supabase.from("deals").update({ status }).eq("id", id);
    toast({ title: status === "ganho" ? "🎉 Negócio ganho!" : "Negócio perdido" });
    navigate("/vendas/pipeline");
  }

  async function deleteDeal() {
    if (!id || !confirm("Excluir este negócio?")) return;
    await supabase.from("deals").delete().eq("id", id);
    toast({ title: "Excluído" }); navigate("/vendas/pipeline");
  }

  async function toggleTag(tagId: string) {
    if (!id) return;
    if (dealTagIds.includes(tagId)) {
      await supabase.from("deal_tags").delete().eq("deal_id", id).eq("tag_id", tagId);
    } else {
      await supabase.from("deal_tags").insert([{ deal_id: id, tag_id: tagId }]);
    }
    load();
  }

  async function createProposta(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    const { error } = await supabase.from("propostas").insert([{
      deal_id: id, titulo: propostaForm.titulo, descricao: propostaForm.descricao,
      valor_total: parseFloat(propostaForm.valor_total) || 0,
      validade: propostaForm.validade || null,
    }]);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Proposta criada!" }); setPropostaOpen(false); setPropostaForm({ titulo: "", descricao: "", valor_total: "", validade: "" }); load(); }
  }

  function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
  function timeAgo(date: string) {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (days === 0) return "hoje"; if (days === 1) return "ontem"; return `${days}d atrás`;
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!deal) return <div className="text-center py-16 text-muted-foreground">Negócio não encontrado</div>;

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/vendas/pipeline")}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{deal.titulo}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <div className={`w-2.5 h-2.5 rounded-full ${stageColors[deal.stage]}`} />
              <span className="text-sm text-muted-foreground">{stageLabels[deal.stage]}</span>
              <span className="text-lg font-bold text-primary">{fmt(Number(deal.valor))}</span>
              {deal.status !== "aberto" && (
                <Badge variant={deal.status === "ganho" ? "default" : "destructive"} className="text-xs">
                  {deal.status === "ganho" ? "Ganho" : "Perdido"}
                </Badge>
              )}
            </div>
            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((t: any) => (
                <span key={t.id} className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: t.cor }}>{t.nome}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {deal.status === "aberto" && (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>
                <Edit className="mr-1.5 h-3.5 w-3.5" /> Editar
              </Button>
              <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => markAs("ganho")}>
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Ganhou
              </Button>
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => markAs("perdido")}>
                <XCircle className="mr-1.5 h-3.5 w-3.5" /> Perdeu
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" className="text-destructive" onClick={deleteDeal}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 6 Tabs */}
      <Tabs defaultValue="atividades" className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 h-10">
          <TabsTrigger value="atividades" className="text-xs">Atividades</TabsTrigger>
          <TabsTrigger value="contato" className="text-xs">Contato</TabsTrigger>
          <TabsTrigger value="cotacao" className="text-xs">Cotação</TabsTrigger>
          <TabsTrigger value="vistoria" className="text-xs">Vistoria</TabsTrigger>
          <TabsTrigger value="proposta" className="text-xs">Proposta</TabsTrigger>
          <TabsTrigger value="tags" className="text-xs">Tags</TabsTrigger>
        </TabsList>

        {/* Tab 1: Atividades */}
        <TabsContent value="atividades" className="space-y-4">
          <Card className="border border-border shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Adicionar nota ou atividade..." value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNote(); } }} />
                <Button size="icon" variant="outline" onClick={addNote} disabled={!newNote.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {activities.map((act: any) => (
                  <div key={act.id} className="flex gap-3 text-sm border-b border-border/30 pb-3 last:border-0">
                    <div className="mt-0.5">
                      {act.tipo === "nota" ? <MessageSquare className="h-4 w-4 text-muted-foreground" /> : <Clock className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px]">{act.descricao}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(act.created_at).toLocaleString("pt-BR")} · {timeAgo(act.created_at)}</p>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Contato */}
        <TabsContent value="contato" className="space-y-4">
          <Card className="border border-border shadow-sm">
            <CardContent className="p-4">
              {editing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Nome</Label><Input value={editForm.contato_nome || ""} onChange={(e) => setEditForm({ ...editForm, contato_nome: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>Telefone</Label><Input value={editForm.contato_telefone || ""} onChange={(e) => setEditForm({ ...editForm, contato_telefone: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" value={editForm.contato_email || ""} onChange={(e) => setEditForm({ ...editForm, contato_email: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>Origem</Label><Input value={editForm.origem || ""} onChange={(e) => setEditForm({ ...editForm, origem: e.target.value })} /></div>
                  </div>
                  <div className="space-y-1.5"><Label>Observações</Label><Textarea value={editForm.observacoes || ""} onChange={(e) => setEditForm({ ...editForm, observacoes: e.target.value })} rows={3} /></div>
                  <div className="flex gap-2"><Button onClick={saveEdit}>Salvar</Button><Button variant="outline" onClick={() => { setEditing(false); setEditForm(deal); }}>Cancelar</Button></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {deal.contato_nome && <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">{deal.contato_nome}</span></div>}
                  {deal.contato_telefone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{deal.contato_telefone}</span></div>}
                  {deal.contato_email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{deal.contato_email}</span></div>}
                  {deal.data_previsao && <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Previsão: {new Date(deal.data_previsao).toLocaleDateString("pt-BR")}</span></div>}
                  {deal.origem && <div className="flex items-center gap-2"><TagIcon className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Origem: {deal.origem}</span></div>}
                  {deal.observacoes && <div className="bg-muted/50 rounded-lg p-3 mt-2"><p className="text-sm text-muted-foreground">{deal.observacoes}</p></div>}
                  {!deal.contato_nome && !deal.contato_telefone && !deal.contato_email && (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado de contato. Clique em Editar para adicionar.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Cotação */}
        <TabsContent value="cotacao" className="space-y-4">
          <Card className="border border-border shadow-sm">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-muted-foreground uppercase">Valor</p><p className="text-lg font-bold text-primary">{fmt(Number(deal.valor))}</p></div>
                  <div><p className="text-xs text-muted-foreground uppercase">Etapa</p>
                    {editing ? (
                      <Select value={editForm.stage} onValueChange={(v) => setEditForm({ ...editForm, stage: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(stageLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : <p className="text-sm font-medium">{stageLabels[deal.stage]}</p>}
                  </div>
                </div>
                {editing && (
                  <div className="space-y-1.5"><Label>Valor</Label><Input type="number" step="0.01" value={editForm.valor} onChange={(e) => setEditForm({ ...editForm, valor: e.target.value })} /><Button onClick={saveEdit} className="mt-2">Salvar</Button></div>
                )}
                <Separator />
                <p className="text-xs text-muted-foreground">Informações do veículo e cotação completa serão exibidas aqui quando integradas ao módulo de Gestão.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Vistoria */}
        <TabsContent value="vistoria" className="space-y-4">
          <Card className="border border-border shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Eye className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">Módulo de Vistoria</p>
              <p className="text-xs text-center mt-1 max-w-sm">Quando integrado, aqui será possível agendar, acompanhar e visualizar fotos da vistoria do veículo.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Proposta */}
        <TabsContent value="proposta" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-muted-foreground">{propostas.length} proposta(s)</p>
            <Dialog open={propostaOpen} onOpenChange={setPropostaOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" /> Criar Proposta</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova Proposta</DialogTitle></DialogHeader>
                <form onSubmit={createProposta} className="space-y-3">
                  <div className="space-y-1.5"><Label>Título *</Label><Input value={propostaForm.titulo} onChange={(e) => setPropostaForm({ ...propostaForm, titulo: e.target.value })} required /></div>
                  <div className="space-y-1.5"><Label>Descrição</Label><Textarea value={propostaForm.descricao} onChange={(e) => setPropostaForm({ ...propostaForm, descricao: e.target.value })} rows={3} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Valor Total</Label><Input type="number" step="0.01" value={propostaForm.valor_total} onChange={(e) => setPropostaForm({ ...propostaForm, valor_total: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>Validade</Label><Input type="date" value={propostaForm.validade} onChange={(e) => setPropostaForm({ ...propostaForm, validade: e.target.value })} /></div>
                  </div>
                  <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setPropostaOpen(false)}>Cancelar</Button><Button type="submit">Criar</Button></div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-3">
            {propostas.map((p: any) => (
              <Card key={p.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{p.titulo}</p>
                      {p.descricao && <p className="text-xs text-muted-foreground mt-1">{p.descricao}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{fmt(Number(p.valor_total))}</p>
                      <Badge variant="outline" className="text-[10px] mt-1">{p.status}</Badge>
                    </div>
                  </div>
                  {p.validade && <p className="text-[10px] text-muted-foreground mt-2">Válido até {new Date(p.validade).toLocaleDateString("pt-BR")}</p>}
                </CardContent>
              </Card>
            ))}
            {propostas.length === 0 && <Card className="border border-border shadow-sm"><CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground"><FileText className="h-8 w-8 mb-2 opacity-30" /><p className="text-xs">Nenhuma proposta criada</p></CardContent></Card>}
          </div>
        </TabsContent>

        {/* Tab 6: Tags */}
        <TabsContent value="tags" className="space-y-4">
          <Card className="border border-border shadow-sm">
            <CardContent className="p-4 space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase">Tags aplicadas</p>
              <div className="flex flex-wrap gap-2">
                {allTags.map((t: any) => {
                  const active = dealTagIds.includes(t.id);
                  return (
                    <button key={t.id} onClick={() => toggleTag(t.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${active ? "text-white border-transparent" : "text-foreground border-border hover:border-primary/30"}`}
                      style={active ? { backgroundColor: t.cor } : {}}>
                      {t.nome}
                    </button>
                  );
                })}
                {allTags.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tag cadastrada. Vá em Vendas → Tags para criar.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
