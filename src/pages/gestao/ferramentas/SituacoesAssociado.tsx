import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MemberStatus {
  id: string;
  codigo: number;
  descricao: string;
  modulo: string;
  participa_fechamento: boolean;
  participa_rateio: boolean;
  ativo: boolean;
}

const emptyForm = { descricao: "", modulo: "Associado", participa_fechamento: false, participa_rateio: false, ativo: true };

export default function SituacoesAssociado({ onBack }: { onBack: () => void }) {
  const [rows, setRows] = useState<MemberStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("member_statuses" as any)
      .select("*")
      .order("codigo", { ascending: true });
    if (error) { toast.error("Erro ao carregar situações"); console.error(error); }
    else setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, []);

  const openNew = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (r: MemberStatus) => {
    setEditId(r.id);
    setForm({ descricao: r.descricao, modulo: r.modulo, participa_fechamento: r.participa_fechamento, participa_rateio: r.participa_rateio, ativo: r.ativo });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.descricao.trim()) { toast.error("Descrição é obrigatória"); return; }
    const payload = { descricao: form.descricao.trim(), modulo: form.modulo, participa_fechamento: form.participa_fechamento, participa_rateio: form.participa_rateio, ativo: form.ativo, updated_at: new Date().toISOString() };

    if (editId) {
      const { error } = await supabase.from("member_statuses" as any).update(payload).eq("id", editId);
      if (error) { toast.error("Erro ao atualizar"); console.error(error); return; }
      toast.success("Situação atualizada");
    } else {
      const { error } = await supabase.from("member_statuses" as any).insert(payload);
      if (error) { toast.error("Erro ao criar"); console.error(error); return; }
      toast.success("Situação criada");
    }
    setOpen(false);
    fetchRows();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir esta situação?")) return;
    const { error } = await supabase.from("member_statuses" as any).delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); console.error(error); return; }
    toast.success("Situação excluída");
    fetchRows();
  };

  return (
    <div className="p-6 lg:px-8">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 mb-4 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <Settings2 className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Situações do Associado</h1>
          <span className="text-sm text-muted-foreground ml-1">— Gerenciar situações cadastrais</span>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5">
          <Plus className="h-4 w-4" /> Nova Situação
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#1A3A5C]">
              {["Código", "Descrição", "Módulo", "Participa Fechamento", "Participa Rateio", "Situação", "Ações"].map(h => (
                <TableHead key={h} className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma situação cadastrada</TableCell></TableRow>
            ) : rows.map((r, i) => (
              <TableRow key={r.id} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                <TableCell className="font-mono text-xs">{r.codigo}</TableCell>
                <TableCell className="font-medium">{r.descricao}</TableCell>
                <TableCell>{r.modulo}</TableCell>
                <TableCell>
                  <Badge variant={r.participa_fechamento ? "default" : "secondary"} className="text-[11px]">
                    {r.participa_fechamento ? "Sim" : "Não"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={r.participa_rateio ? "default" : "secondary"} className="text-[11px]">
                    {r.participa_rateio ? "Sim" : "Não"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`text-[11px] ${r.ativo ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}>
                    {r.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Situação" : "Nova Situação"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Descrição *</Label>
              <Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Ativo, Pendente…" />
            </div>
            <div>
              <Label>Módulo</Label>
              <Select value={form.modulo} onValueChange={v => setForm(f => ({ ...f, modulo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Associado">Associado</SelectItem>
                  <SelectItem value="Veículo">Veículo</SelectItem>
                  <SelectItem value="Ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Participa Fechamento</Label>
              <Switch checked={form.participa_fechamento} onCheckedChange={v => setForm(f => ({ ...f, participa_fechamento: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Participa Rateio</Label>
              <Switch checked={form.participa_rateio} onCheckedChange={v => setForm(f => ({ ...f, participa_rateio: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Situação</Label>
              <Switch checked={form.ativo} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} />
              <Badge className={`ml-2 text-[11px] ${form.ativo ? "bg-emerald-600" : "bg-red-600"}`}>{form.ativo ? "Ativo" : "Inativo"}</Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editId ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
