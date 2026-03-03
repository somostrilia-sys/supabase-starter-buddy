import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, CheckCircle } from "lucide-react";

const emptyForm = {
  associado_id: "", valor: "", data_vencimento: "",
  referencia: "", status: "pendente", observacoes: "",
};

export default function Financeiro() {
  const [mensalidades, setMensalidades] = useState<any[]>([]);
  const [associados, setAssociados] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); loadAssociados(); }, []);

  async function load() {
    const { data } = await supabase
      .from("mensalidades")
      .select("*, associados(nome)")
      .order("data_vencimento", { ascending: false });
    if (data) setMensalidades(data);
  }

  async function loadAssociados() {
    const { data } = await supabase.from("associados").select("id, nome").eq("status", "ativo").order("nome");
    if (data) setAssociados(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("mensalidades").insert([{
        associado_id: form.associado_id,
        valor: parseFloat(form.valor),
        data_vencimento: form.data_vencimento,
        referencia: form.referencia || null,
        status: form.status as "pendente" | "pago" | "atrasado" | "cancelado",
        observacoes: form.observacoes || null,
      }]);
      if (error) throw error;
      toast({ title: "Mensalidade registrada!" });
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function markPaid(id: string) {
    const { error } = await supabase.from("mensalidades").update({
      status: "pago",
      data_pagamento: new Date().toISOString().split("T")[0],
    }).eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Pagamento confirmado!" }); load(); }
  }

  const statusColor: Record<string, string> = {
    pendente: "bg-warning/15 text-warning border-0",
    pago: "bg-success/15 text-success border-0",
    atrasado: "bg-destructive/15 text-destructive border-0",
    cancelado: "bg-muted text-muted-foreground border-0",
  };

  const filtered = mensalidades.filter((m) => {
    const matchSearch = (m.associados as any)?.nome?.toLowerCase().includes(search.toLowerCase()) || m.referencia?.includes(search);
    const matchStatus = statusFilter === "todos" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPendente = mensalidades.filter(m => m.status === "pendente").reduce((s, m) => s + Number(m.valor), 0);
  const totalPago = mensalidades.filter(m => m.status === "pago").reduce((s, m) => s + Number(m.valor), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground text-sm">
            Pendente: R$ {totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} · Recebido: R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nova Mensalidade</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Mensalidade</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Associado *</Label>
                <Select value={form.associado_id} onValueChange={(v) => setForm({ ...form, associado_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {associados.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Valor *</Label><Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} required /></div>
                <div className="space-y-1.5"><Label>Vencimento *</Label><Input type="date" value={form.data_vencimento} onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })} required /></div>
              </div>
              <div className="space-y-1.5"><Label>Referência</Label><Input placeholder="Ex: 03/2026" value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} /></div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
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
              <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Associado</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{(m.associados as any)?.nome}</TableCell>
                  <TableCell>{m.referencia}</TableCell>
                  <TableCell>R$ {Number(m.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>{new Date(m.data_vencimento).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell><Badge className={statusColor[m.status] || ""} variant="outline">{m.status}</Badge></TableCell>
                  <TableCell>
                    {m.status === "pendente" && (
                      <Button variant="ghost" size="icon" onClick={() => markPaid(m.id)} title="Confirmar pagamento">
                        <CheckCircle className="h-4 w-4 text-success" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma mensalidade encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
