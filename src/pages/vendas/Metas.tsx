import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Plus, Target, DollarSign, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Metas() {
  const { user } = useAuth();
  const [metas, setMetas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ periodo: "", meta_valor: "", meta_quantidade: "" });

  const load = useCallback(async () => {
    const { data } = await supabase.from("metas_vendedor").select("*").order("periodo", { ascending: false });
    if (data) setMetas(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Calculate realized from deals
    const { count: wonCount } = await supabase.from("deals").select("*", { count: "exact", head: true })
      .eq("status", "ganho").gte("updated_at", `${form.periodo}-01`).lt("updated_at", nextMonth(form.periodo));
    const { data: wonDeals } = await supabase.from("deals").select("valor")
      .eq("status", "ganho").gte("updated_at", `${form.periodo}-01`).lt("updated_at", nextMonth(form.periodo));
    const realizado_valor = wonDeals?.reduce((s, d) => s + Number(d.valor), 0) || 0;

    const { error } = await supabase.from("metas_vendedor").insert([{
      user_id: user?.id, periodo: form.periodo,
      meta_valor: parseFloat(form.meta_valor) || 0,
      meta_quantidade: parseInt(form.meta_quantidade) || 0,
      realizado_valor, realizado_quantidade: wonCount || 0,
    }]);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Meta definida!" }); setFormOpen(false); setForm({ periodo: "", meta_valor: "", meta_quantidade: "" }); load(); }
  }

  function nextMonth(ym: string) {
    const [y, m] = ym.split("-").map(Number);
    if (m === 12) return `${y + 1}-01`;
    return `${y}-${String(m + 1).padStart(2, "0")}`;
  }

  function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Metas de Vendas</h1>
          <p className="text-muted-foreground text-sm">Acompanhe suas metas mensais</p>
        </div>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Nova Meta</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Definir Meta</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5"><Label>Período (AAAA-MM) *</Label><Input type="month" value={form.periodo} onChange={(e) => setForm({ ...form, periodo: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Meta em R$</Label><Input type="number" step="0.01" value={form.meta_valor} onChange={(e) => setForm({ ...form, meta_valor: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Meta em quantidade</Label><Input type="number" value={form.meta_quantidade} onChange={(e) => setForm({ ...form, meta_quantidade: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button><Button type="submit">Salvar</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metas.map(m => {
          const pctValor = m.meta_valor > 0 ? Math.min(100, (m.realizado_valor / m.meta_valor) * 100) : 0;
          const pctQtd = m.meta_quantidade > 0 ? Math.min(100, (m.realizado_quantidade / m.meta_quantidade) * 100) : 0;
          return (
            <Card key={m.id} className="border-0 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <span className="font-bold text-sm">{m.periodo}</span>
                  </div>
                </div>
                {m.meta_valor > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Valor</span><span className="font-medium">{fmt(m.realizado_valor)} / {fmt(m.meta_valor)}</span></div>
                    <Progress value={pctValor} className="h-2" />
                    <p className="text-right text-xs font-medium text-primary">{pctValor.toFixed(0)}%</p>
                  </div>
                )}
                {m.meta_quantidade > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Quantidade</span><span className="font-medium">{m.realizado_quantidade} / {m.meta_quantidade}</span></div>
                    <Progress value={pctQtd} className="h-2" />
                    <p className="text-right text-xs font-medium text-primary">{pctQtd.toFixed(0)}%</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {metas.length === 0 && (
          <Card className="border-0 shadow-sm col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Target className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">Nenhuma meta definida</p>
              <p className="text-sm">Crie sua primeira meta mensal</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
