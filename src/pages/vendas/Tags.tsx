import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Tag as TagIcon, Trash2, Edit } from "lucide-react";

const defaultColors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export default function Tags() {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", cor: "#3b82f6", grupo: "geral" });

  const load = useCallback(async () => {
    const { data } = await supabase.from("tags").select("*").order("grupo").order("nome");
    if (data) setTags(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        const { error } = await supabase.from("tags").update(form).eq("id", editing);
        if (error) throw error;
        toast({ title: "Tag atualizada!" });
      } else {
        const { error } = await supabase.from("tags").insert([form]);
        if (error) throw error;
        toast({ title: "Tag criada!" });
      }
      closeForm(); load();
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  }

  function closeForm() { setFormOpen(false); setEditing(null); setForm({ nome: "", cor: "#3b82f6", grupo: "geral" }); }

  function openEdit(t: any) {
    setEditing(t.id); setForm({ nome: t.nome, cor: t.cor, grupo: t.grupo || "geral" }); setFormOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir tag?")) return;
    await supabase.from("tags").delete().eq("id", id);
    toast({ title: "Excluída" }); load();
  }

  const groups = [...new Set(tags.map(t => t.grupo || "geral"))];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground text-sm">Organize e classifique suas negociações</p>
        </div>
        <Dialog open={formOpen} onOpenChange={(o) => { if (!o) closeForm(); else setFormOpen(true); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Nova Tag</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar Tag" : "Nova Tag"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Grupo</Label><Input value={form.grupo} onChange={(e) => setForm({ ...form, grupo: e.target.value })} placeholder="geral" /></div>
              <div className="space-y-1.5">
                <Label>Cor</Label>
                <div className="flex gap-2 flex-wrap">
                  {defaultColors.map(c => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, cor: c })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${form.cor === c ? "scale-110 border-foreground" : "border-transparent"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={closeForm}>Cancelar</Button><Button type="submit">Salvar</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {groups.map(g => (
        <div key={g} className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{g}</p>
          <div className="flex flex-wrap gap-2">
            {tags.filter(t => (t.grupo || "geral") === g).map(t => (
              <div key={t.id} className="flex items-center gap-1 group">
                <span className="text-xs px-3 py-1.5 rounded-full text-white font-medium" style={{ backgroundColor: t.cor }}>{t.nome}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => openEdit(t)}><Edit className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(t.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {tags.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <TagIcon className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhuma tag criada</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
