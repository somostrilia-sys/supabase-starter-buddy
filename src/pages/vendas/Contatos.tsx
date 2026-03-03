import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Phone, Mail, User, MapPin, Edit, Trash2 } from "lucide-react";

const emptyForm = { nome: "", cpf_cnpj: "", email: "", telefone: "", telefone2: "", cidade: "", estado: "", origem: "", observacoes: "" };

export default function Contatos() {
  const [contatos, setContatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("contatos").select("*").order("created_at", { ascending: false });
    if (data) setContatos(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from("contatos").update(form).eq("id", editing);
        if (error) throw error;
        toast({ title: "Contato atualizado!" });
      } else {
        const { error } = await supabase.from("contatos").insert([form]);
        if (error) throw error;
        toast({ title: "Contato criado!" });
      }
      closeForm(); load();
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  }

  function closeForm() { setFormOpen(false); setEditing(null); setForm(emptyForm); }

  function openEdit(c: any) {
    setEditing(c.id);
    setForm({ nome: c.nome, cpf_cnpj: c.cpf_cnpj || "", email: c.email || "", telefone: c.telefone || "", telefone2: c.telefone2 || "", cidade: c.cidade || "", estado: c.estado || "", origem: c.origem || "", observacoes: c.observacoes || "" });
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir contato?")) return;
    await supabase.from("contatos").delete().eq("id", id);
    toast({ title: "Excluído" }); load();
  }

  const filtered = contatos.filter(c =>
    !search || c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.telefone?.includes(search) || c.cpf_cnpj?.includes(search)
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contatos</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} contatos cadastrados</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-56" />
          </div>
          <Dialog open={formOpen} onOpenChange={(o) => { if (!o) closeForm(); else setFormOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo Contato</Button></DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? "Editar Contato" : "Novo Contato"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>CPF/CNPJ</Label><Input value={form.cpf_cnpj} onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Telefone 2</Label><Input value={form.telefone2} onChange={(e) => setForm({ ...form, telefone2: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Estado</Label><Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} /></div>
                </div>
                <div className="space-y-1.5"><Label>Origem</Label><Input value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} placeholder="Facebook, indicação..." /></div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeForm}>Cancelar</Button>
                  <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/30">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Nome</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">CPF/CNPJ</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Telefone</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">E-mail</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Cidade/UF</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Origem</th>
              <th className="p-3"></th>
            </tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b hover:bg-muted/20">
                  <td className="p-3 font-medium">{c.nome}</td>
                  <td className="p-3 text-muted-foreground font-mono text-xs">{c.cpf_cnpj || "—"}</td>
                  <td className="p-3 text-muted-foreground">{c.telefone || "—"}</td>
                  <td className="p-3 text-muted-foreground">{c.email || "—"}</td>
                  <td className="p-3 text-muted-foreground">{[c.cidade, c.estado].filter(Boolean).join("/") || "—"}</td>
                  <td className="p-3">{c.origem ? <Badge variant="outline" className="text-[10px]">{c.origem}</Badge> : "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Nenhum contato encontrado</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
