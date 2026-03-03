import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";

const emptyForm = {
  associado_id: "", veiculo_id: "", tipo: "colisao" as string,
  data_ocorrencia: "", descricao: "", local_ocorrencia: "",
  boletim_ocorrencia: "", valor_estimado: "",
};

export default function Sinistros() {
  const [sinistros, setSinistros] = useState<any[]>([]);
  const [associados, setAssociados] = useState<any[]>([]);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); loadAssociados(); }, []);

  async function load() {
    const { data } = await supabase
      .from("sinistros")
      .select("*, associados(nome), veiculos(marca, modelo, placa)")
      .order("created_at", { ascending: false });
    if (data) setSinistros(data);
  }

  async function loadAssociados() {
    const { data } = await supabase.from("associados").select("id, nome").eq("status", "ativo").order("nome");
    if (data) setAssociados(data);
  }

  async function loadVeiculos(associadoId: string) {
    const { data } = await supabase.from("veiculos").select("id, marca, modelo, placa").eq("associado_id", associadoId);
    if (data) setVeiculos(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("sinistros").insert([{
        associado_id: form.associado_id,
        veiculo_id: form.veiculo_id || null,
        tipo: form.tipo as "roubo" | "furto" | "colisao" | "incendio" | "alagamento" | "outros",
        data_ocorrencia: form.data_ocorrencia,
        descricao: form.descricao,
        local_ocorrencia: form.local_ocorrencia || null,
        boletim_ocorrencia: form.boletim_ocorrencia || null,
        valor_estimado: form.valor_estimado ? parseFloat(form.valor_estimado) : null,
      }]);
      if (error) throw error;
      toast({ title: "Sinistro registrado!" });
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    const { error } = await supabase.from("sinistros").update({ status: newStatus as "aberto" | "em_analise" | "aprovado" | "negado" | "finalizado" }).eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Status atualizado!" }); load(); }
  }

  const statusColor: Record<string, string> = {
    aberto: "bg-primary/15 text-primary border-0",
    em_analise: "bg-warning/15 text-warning border-0",
    aprovado: "bg-success/15 text-success border-0",
    negado: "bg-destructive/15 text-destructive border-0",
    finalizado: "bg-muted text-muted-foreground border-0",
  };

  const tipoLabel: Record<string, string> = {
    roubo: "Roubo", furto: "Furto", colisao: "Colisão",
    incendio: "Incêndio", alagamento: "Alagamento", outros: "Outros",
  };

  const filtered = sinistros.filter((s) => {
    const matchSearch = (s.associados as any)?.nome?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "todos" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sinistros</h1>
          <p className="text-muted-foreground text-sm">{sinistros.length} registros</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setForm(emptyForm); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Novo Sinistro</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar Sinistro</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Associado *</Label>
                <Select value={form.associado_id} onValueChange={(v) => { setForm({ ...form, associado_id: v, veiculo_id: "" }); loadVeiculos(v); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {associados.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Veículo</Label>
                <Select value={form.veiculo_id} onValueChange={(v) => setForm({ ...form, veiculo_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {veiculos.map((v) => <SelectItem key={v.id} value={v.id}>{v.marca} {v.modelo} - {v.placa}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="roubo">Roubo</SelectItem>
                    <SelectItem value="furto">Furto</SelectItem>
                    <SelectItem value="colisao">Colisão</SelectItem>
                    <SelectItem value="incendio">Incêndio</SelectItem>
                    <SelectItem value="alagamento">Alagamento</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Data da Ocorrência *</Label><Input type="date" value={form.data_ocorrencia} onChange={(e) => setForm({ ...form, data_ocorrencia: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Local</Label><Input value={form.local_ocorrencia} onChange={(e) => setForm({ ...form, local_ocorrencia: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>B.O.</Label><Input value={form.boletim_ocorrencia} onChange={(e) => setForm({ ...form, boletim_ocorrencia: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Valor Estimado</Label><Input type="number" step="0.01" value={form.valor_estimado} onChange={(e) => setForm({ ...form, valor_estimado: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Descrição *</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required rows={3} /></div>
              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Registrar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por associado..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="negado">Negado</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Associado</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Alterar Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{(s.associados as any)?.nome}</TableCell>
                  <TableCell>{s.veiculos ? `${(s.veiculos as any).marca} ${(s.veiculos as any).modelo}` : "-"}</TableCell>
                  <TableCell>{tipoLabel[s.tipo] || s.tipo}</TableCell>
                  <TableCell className="hidden md:table-cell">{new Date(s.data_ocorrencia).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell><Badge className={statusColor[s.status] || ""} variant="outline">{s.status?.replace("_", " ")}</Badge></TableCell>
                  <TableCell>
                    <Select value={s.status} onValueChange={(v) => updateStatus(s.id, v)}>
                      <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aberto">Aberto</SelectItem>
                        <SelectItem value="em_analise">Em Análise</SelectItem>
                        <SelectItem value="aprovado">Aprovado</SelectItem>
                        <SelectItem value="negado">Negado</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum sinistro encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
