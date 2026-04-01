import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Building2, Pencil, Trash2, MapPin, Phone, Mail, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Cooperativa {
  id: string;
  nome: string;
  codigo: string;
  regional_id: string | null;
  cidade: string;
  estado: string;
  ativo: boolean;
  codigo_sga: string | null;
  cpf_cnpj: string | null;
  email: string | null;
  telefone: string | null;
}

interface Regional {
  id: string;
  nome: string;
}

const emptyForm = {
  nome: "", codigo: "", regional_id: "", cidade: "", estado: "", ativo: true,
  codigo_sga: "", cpf_cnpj: "", email: "", telefone: "",
};

const ufs = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

export default function CadastrarCooperativa() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: coops = [], isLoading } = useQuery({
    queryKey: ["cooperativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cooperativas")
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data || []) as Cooperativa[];
    },
  });

  const { data: regionais = [] } = useQuery({
    queryKey: ["regionais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regionais")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return (data || []) as Regional[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof emptyForm & { id?: string }) => {
      const row = {
        nome: payload.nome,
        codigo: payload.codigo,
        regional_id: payload.regional_id || null,
        cidade: payload.cidade,
        estado: payload.estado,
        ativo: payload.ativo,
        codigo_sga: payload.codigo_sga || null,
        cpf_cnpj: payload.cpf_cnpj || null,
        email: payload.email || null,
        telefone: payload.telefone || null,
      };
      if (payload.id) {
        const { error } = await supabase.from("cooperativas").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cooperativas").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cooperativas"] });
      toast.success(editId ? "Cooperativa atualizada!" : "Cooperativa cadastrada!");
      setModalOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cooperativas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cooperativas"] });
      toast.success("Cooperativa removida!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));

  const openNew = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (c: Cooperativa) => {
    setEditId(c.id);
    setForm({ nome: c.nome, codigo: c.codigo, regional_id: c.regional_id || "", cidade: c.cidade, estado: c.estado, ativo: c.ativo, codigo_sga: c.codigo_sga || "", cpf_cnpj: c.cpf_cnpj || "", email: c.email || "", telefone: c.telefone || "" });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.nome || !form.codigo) { toast.error("Preencha nome e codigo"); return; }
    saveMutation.mutate(editId ? { ...form, id: editId } : form);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Cooperativas</h2>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Nova Cooperativa</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : coops.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma cooperativa cadastrada.</p>
            <Button onClick={openNew} variant="outline" className="mt-4 gap-2"><Plus className="h-4 w-4" /> Cadastrar primeira cooperativa</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coops.map(c => (
            <Card key={c.id} className={`${!c.ativo ? "opacity-60" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{c.nome}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{c.codigo}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={c.ativo ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}>
                    {c.ativo ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {c.cidade}/{c.estado}</div>
                  {c.codigo_sga && <div className="flex items-center gap-1.5"><Users className="h-3 w-3" /> SGA: {c.codigo_sga}</div>}
                  {c.cpf_cnpj && <div className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> {c.cpf_cnpj}</div>}
                  {c.telefone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {c.telefone}</div>}
                  {c.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {c.email}</div>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(c)} className="gap-1.5"><Pencil className="h-3.5 w-3.5" /> Editar</Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar Cooperativa" : "Nova Cooperativa"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><Label>Nome *</Label><Input value={form.nome} onChange={e => set("nome", e.target.value)} /></div>
              <div><Label>Codigo *</Label><Input value={form.codigo} onChange={e => set("codigo", e.target.value)} /></div>
              <div><Label>Regional</Label>
                <Select value={form.regional_id} onValueChange={v => set("regional_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {regionais.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Cidade</Label><Input value={form.cidade} onChange={e => set("cidade", e.target.value)} /></div>
              <div><Label>Estado</Label>
                <Select value={form.estado} onValueChange={v => set("estado", v)}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>{ufs.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Codigo SGA</Label><Input value={form.codigo_sga} onChange={e => set("codigo_sga", e.target.value)} /></div>
              <div><Label>CPF/CNPJ</Label><Input value={form.cpf_cnpj} onChange={e => set("cpf_cnpj", e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
              <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => set("telefone", e.target.value)} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editId ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
