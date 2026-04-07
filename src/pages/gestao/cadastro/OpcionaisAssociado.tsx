import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Opcional {
  id: string;
  nome: string;
  categoria: string;
  ativo: boolean;
}

// No specific table exists yet - local state only
const initialOpcionais: Opcional[] = [];

const categorias = ["Seguros", "Saúde", "Digital", "Benefícios"];

export default function OpcionaisAssociado() {
  const [opcionais, setOpcionais] = useState<Opcional[]>(initialOpcionais);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", categoria: "Seguros" });

  const toggle = (id: string) => {
    setOpcionais(prev => prev.map(o => o.id === id ? { ...o, ativo: !o.ativo } : o));
    toast.success("Status atualizado!");
  };

  const openNew = () => { setEditId(null); setForm({ nome: "", categoria: "Seguros" }); setModalOpen(true); };
  const openEdit = (o: Opcional) => { setEditId(o.id); setForm({ nome: o.nome, categoria: o.categoria }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.nome) { toast.error("Informe o nome"); return; }
    if (editId) {
      setOpcionais(prev => prev.map(o => o.id === editId ? { ...o, nome: form.nome, categoria: form.categoria } : o));
      toast.success("Serviço atualizado!");
    } else {
      setOpcionais(prev => [...prev, { id: `oa${Date.now()}`, nome: form.nome, categoria: form.categoria, ativo: true }]);
      toast.success("Serviço cadastrado!");
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setOpcionais(prev => prev.filter(o => o.id !== id));
    toast.success("Serviço removido!");
  };

  const grouped = categorias.map(cat => ({
    categoria: cat,
    items: opcionais.filter(o => o.categoria === cat),
  })).filter(g => g.items.length > 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Serviços do Associado</h2>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Serviço</Button>
      </div>

      <div className="space-y-4">
        {grouped.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado. Clique em "Novo Serviço" para adicionar.</p>
            </CardContent>
          </Card>
        )}
        {grouped.map(g => (
          <Card key={g.categoria}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {g.categoria}
                <Badge variant="outline" className="ml-auto">{g.items.filter(i => i.ativo).length}/{g.items.length} ativos</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {g.items.map(o => (
                <div key={o.id} className="flex items-center gap-3 p-2 rounded-md border hover:bg-muted/30 transition-colors">
                  <Checkbox checked={o.ativo} onCheckedChange={() => toggle(o.id)} />
                  <span className={`text-sm flex-1 ${!o.ativo ? "text-muted-foreground line-through" : "font-medium"}`}>{o.nome}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(o)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(o.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Editar Serviço" : "Novo Serviço"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Nome do serviço" />
            </div>
            <div>
              <Label>Categoria</Label>
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
