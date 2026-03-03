import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, FileText, Trash2, Edit, Copy, ExternalLink } from "lucide-react";

export default function Formularios() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "", ativo: true });

  const load = useCallback(async () => {
    const { data } = await supabase.from("lead_forms").select("*").order("created_at", { ascending: false });
    if (data) setForms(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = { nome: form.nome, descricao: form.descricao || null, ativo: form.ativo };
      if (editing) {
        const { error } = await supabase.from("lead_forms").update(payload).eq("id", editing);
        if (error) throw error;
        toast({ title: "Formulário atualizado!" });
      } else {
        const { error } = await supabase.from("lead_forms").insert([{
          ...payload,
          campos: [
            { nome: "nome", tipo: "text", obrigatorio: true, label: "Nome completo" },
            { nome: "telefone", tipo: "tel", obrigatorio: true, label: "Telefone" },
            { nome: "email", tipo: "email", obrigatorio: false, label: "E-mail" },
            { nome: "veiculo", tipo: "text", obrigatorio: false, label: "Veículo" },
          ],
        }]);
        if (error) throw error;
        toast({ title: "Formulário criado!" });
      }
      setFormOpen(false); setEditing(null); setForm({ nome: "", descricao: "", ativo: true }); load();
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from("lead_forms").update({ ativo: !ativo }).eq("id", id);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir formulário?")) return;
    await supabase.from("lead_forms").delete().eq("id", id);
    toast({ title: "Excluído" }); load();
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Formulários de Captação</h1>
          <p className="text-muted-foreground text-sm">Crie formulários para capturar leads</p>
        </div>
        <Dialog open={formOpen} onOpenChange={(o) => { if (!o) { setFormOpen(false); setEditing(null); } else setFormOpen(true); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo Formulário</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo Formulário"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Descrição</Label><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button><Button type="submit">Salvar</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forms.map(f => (
          <Card key={f.id} className="border-0 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">{f.nome}</p>
                  {f.descricao && <p className="text-xs text-muted-foreground mt-0.5">{f.descricao}</p>}
                </div>
                <Badge variant={f.ativo ? "default" : "secondary"} className="text-[10px]">{f.ativo ? "Ativo" : "Inativo"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{(f.campos as any[])?.length || 0} campos</p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => toggleAtivo(f.id, f.ativo)}>
                  {f.ativo ? "Desativar" : "Ativar"}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(f.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {forms.length === 0 && (
          <Card className="border-0 shadow-sm col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">Nenhum formulário</p>
              <p className="text-sm">Crie formulários para captar leads automaticamente</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
