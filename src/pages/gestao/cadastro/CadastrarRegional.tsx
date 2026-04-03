import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, MapPin, Pencil, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Regional {
  id: string;
  nome: string;
  estado: string;
  ativo: boolean;
}

const emptyForm = { nome: "", estado: "", ativo: true };

const ufs = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

export default function CadastrarRegional() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: regionais = [], isLoading } = useQuery({
    queryKey: ["regionais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regionais")
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data || []) as Regional[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof emptyForm & { id?: string }) => {
      const row = { nome: payload.nome, estado: payload.estado, ativo: payload.ativo };
      if (payload.id) {
        const { error } = await supabase.from("regionais").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("regionais").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regionais"] });
      toast.success(editId ? "Regional atualizada!" : "Regional cadastrada!");
      setModalOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check for linked records before deleting
      const { count: assocCount } = await supabase
        .from("associados")
        .select("id", { count: "exact", head: true })
        .eq("regional_id", id);

      const { count: veicCount } = await supabase
        .from("veiculos")
        .select("id", { count: "exact", head: true })
        .eq("regional_id", id);

      if ((assocCount || 0) > 0 || (veicCount || 0) > 0) {
        // Soft delete - deactivate instead
        toast.error(`Não é possível excluir. Existem ${assocCount || 0} associados e ${veicCount || 0} veículos vinculados a esta regional. Desativando...`);
        const { error } = await supabase
          .from("regionais")
          .update({ ativo: false })
          .eq("id", id);
        if (error) throw error;
        return "deactivated";
      }

      // No linked records, safe to hard delete
      const { error } = await supabase.from("regionais").delete().eq("id", id);
      if (error) throw error;
      return "deleted";
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["regionais"] });
      if (result === "deactivated") {
        toast.success("Regional desativada com sucesso");
      } else {
        toast.success("Regional removida!");
      }
    },
    onError: (e: any) => toast.error(e.message || "Erro ao excluir regional"),
  });

  const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));

  const openNew = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (r: Regional) => {
    setEditId(r.id);
    setForm({ nome: r.nome, estado: r.estado, ativo: r.ativo });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.nome) { toast.error("Preencha o nome"); return; }
    saveMutation.mutate(editId ? { ...form, id: editId } : form);
  };

  // Group by estado
  const grouped = regionais.reduce<Record<string, Regional[]>>((acc, r) => {
    const key = r.estado || "Sem estado";
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Regionais</h2>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Nova Regional</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : regionais.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma regional cadastrada.</p>
            <Button onClick={openNew} variant="outline" className="mt-4 gap-2"><Plus className="h-4 w-4" /> Cadastrar primeira regional</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([estado, items]) => (
            <div key={estado}>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground">{estado}</h3>
                <Badge variant="outline" className="text-[10px]">{items.length} regionais</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map(r => (
                  <Card key={r.id} className={!r.ativo ? "opacity-60" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-rose-500" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">{r.nome}</h4>
                          </div>
                        </div>
                        <Badge variant="outline" className={r.ativo ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}>
                          {r.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-end">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Editar Regional" : "Nova Regional"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Ex: Regional Capital SP" /></div>
            <div><Label>Estado</Label>
              <Select value={form.estado} onValueChange={v => set("estado", v)}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>{ufs.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
