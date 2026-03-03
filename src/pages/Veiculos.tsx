import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2 } from "lucide-react";

const emptyForm = {
  associado_id: "", marca: "", modelo: "", ano: "",
  cor: "", placa: "", chassi: "", renavam: "", valor_fipe: "",
};

export default function Veiculos() {
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [associados, setAssociados] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); loadAssociados(); }, []);

  async function load() {
    const { data } = await supabase
      .from("veiculos")
      .select("*, associados(nome)")
      .order("marca");
    if (data) setVeiculos(data);
  }

  async function loadAssociados() {
    const { data } = await supabase.from("associados").select("id, nome").eq("status", "ativo").order("nome");
    if (data) setAssociados(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...form,
      ano: form.ano ? parseInt(form.ano) : null,
      valor_fipe: form.valor_fipe ? parseFloat(form.valor_fipe) : null,
    };

    try {
      if (editing) {
        const { error } = await supabase.from("veiculos").update(payload).eq("id", editing);
        if (error) throw error;
        toast({ title: "Veículo atualizado!" });
      } else {
        const { error } = await supabase.from("veiculos").insert(payload);
        if (error) throw error;
        toast({ title: "Veículo cadastrado!" });
      }
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      load();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir este veículo?")) return;
    const { error } = await supabase.from("veiculos").delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Veículo excluído" }); load(); }
  }

  const filtered = veiculos.filter((v) =>
    v.placa?.toLowerCase().includes(search.toLowerCase()) ||
    v.modelo?.toLowerCase().includes(search.toLowerCase()) ||
    v.marca?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Veículos</h1>
          <p className="text-muted-foreground text-sm">{veiculos.length} registros</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Novo Veículo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Veículo" : "Novo Veículo"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Associado *</Label>
                <Select value={form.associado_id} onValueChange={(v) => setForm({ ...form, associado_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o associado" /></SelectTrigger>
                  <SelectContent>
                    {associados.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Marca *</Label><Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Modelo *</Label><Input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Ano</Label><Input type="number" value={form.ano} onChange={(e) => setForm({ ...form, ano: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Cor</Label><Input value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Placa *</Label><Input value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Chassi</Label><Input value={form.chassi} onChange={(e) => setForm({ ...form, chassi: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Renavam</Label><Input value={form.renavam} onChange={(e) => setForm({ ...form, renavam: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Valor FIPE</Label><Input type="number" step="0.01" value={form.valor_fipe} onChange={(e) => setForm({ ...form, valor_fipe: e.target.value })} /></div>
              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por placa, marca ou modelo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Associado</TableHead>
                <TableHead>Marca/Modelo</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead className="hidden md:table-cell">Cor</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{(v.associados as any)?.nome}</TableCell>
                  <TableCell className="font-medium">{v.marca} {v.modelo}</TableCell>
                  <TableCell>{v.ano}</TableCell>
                  <TableCell className="uppercase font-mono">{v.placa}</TableCell>
                  <TableCell className="hidden md:table-cell">{v.cor}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(v.id); setForm({ associado_id: v.associado_id, marca: v.marca, modelo: v.modelo, ano: v.ano?.toString() || "", cor: v.cor || "", placa: v.placa, chassi: v.chassi || "", renavam: v.renavam || "", valor_fipe: v.valor_fipe?.toString() || "" }); setOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum veículo encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
