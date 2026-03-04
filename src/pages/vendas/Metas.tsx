import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Target, TrendingUp, AlertCircle, Plus, Percent } from "lucide-react";

const vendedores = [
  { nome: "Maria Santos", meta: 30, atual: 26, cor: "#3B82F6" },
  { nome: "João Pedro", meta: 25, atual: 18, cor: "#F59E0B" },
  { nome: "Ana Costa", meta: 20, atual: 20, cor: "#22C55E" },
  { nome: "Carlos Lima", meta: 28, atual: 10, cor: "#EF4444" },
  { nome: "Fernanda Alves", meta: 22, atual: 17, cor: "#8B5CF6" },
];

const evolucao = [
  { mes: "Out", meta: 120, realizado: 98 },
  { mes: "Nov", meta: 125, realizado: 115 },
  { mes: "Dez", meta: 110, realizado: 108 },
  { mes: "Jan", meta: 130, realizado: 122 },
  { mes: "Fev", meta: 125, realizado: 119 },
  { mes: "Mar", meta: 125, realizado: 91 },
];

const totalMeta = vendedores.reduce((s, v) => s + v.meta, 0);
const totalAtual = vendedores.reduce((s, v) => s + v.atual, 0);
const taxa = totalMeta > 0 ? (totalAtual / totalMeta) * 100 : 0;

export default function Metas() {
  const [modalOpen, setModalOpen] = useState(false);
  const [periodo, setPeriodo] = useState("mar-2026");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Metas de Vendas</h1>
          <p className="text-sm text-muted-foreground">Acompanhamento mensal de performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mar-2026">Março 2026</SelectItem>
              <SelectItem value="fev-2026">Fevereiro 2026</SelectItem>
              <SelectItem value="jan-2026">Janeiro 2026</SelectItem>
              <SelectItem value="q1-2026">1º Trimestre</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Meta</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Nova Meta</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1"><Label className="text-xs">Vendedor</Label>
                  <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{vendedores.map(v => <SelectItem key={v.nome} value={v.nome}>{v.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-xs">Tipo</Label>
                  <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendas">Vendas</SelectItem>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="contatos">Contatos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-xs">Período</Label>
                  <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mês</SelectItem>
                      <SelectItem value="trimestral">Trimestre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-xs">Valor da Meta</Label><Input type="number" className="h-9 text-xs" placeholder="0" /></div>
                <Button className="w-full" onClick={() => setModalOpen(false)}>Criar Meta</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/10"><Target className="h-4 w-4 text-primary" /></div>
              <span className="text-[10px] uppercase text-muted-foreground font-medium">Meta do Mês</span>
            </div>
            <p className="text-2xl font-bold">{totalMeta}</p>
            <p className="text-xs text-muted-foreground">vendas</p>
          </CardContent>
        </Card>
        <Card className="border border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-[#22C55E]/10"><TrendingUp className="h-4 w-4 text-[#22C55E]" /></div>
              <span className="text-[10px] uppercase text-muted-foreground font-medium">Atingido</span>
            </div>
            <p className="text-2xl font-bold text-[#22C55E]">{totalAtual}</p>
            <p className="text-xs text-muted-foreground">vendas</p>
          </CardContent>
        </Card>
        <Card className="border border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-destructive/10"><AlertCircle className="h-4 w-4 text-destructive" /></div>
              <span className="text-[10px] uppercase text-muted-foreground font-medium">Faltam</span>
            </div>
            <p className="text-2xl font-bold">{totalMeta - totalAtual}</p>
            <p className="text-xs text-muted-foreground">vendas</p>
          </CardContent>
        </Card>
        <Card className="border border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-[#F59E0B]/10"><Percent className="h-4 w-4 text-[#F59E0B]" /></div>
              <span className="text-[10px] uppercase text-muted-foreground font-medium">Taxa</span>
            </div>
            <p className="text-2xl font-bold">{taxa.toFixed(1)}%</p>
            <Progress value={taxa} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Metas por Vendedor</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/30">
                <th className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase">Vendedor</th>
                <th className="text-center p-3 text-[10px] font-medium text-muted-foreground uppercase">Meta</th>
                <th className="text-center p-3 text-[10px] font-medium text-muted-foreground uppercase">Atual</th>
                <th className="text-center p-3 text-[10px] font-medium text-muted-foreground uppercase">%</th>
                <th className="p-3 text-[10px] font-medium text-muted-foreground uppercase">Progresso</th>
              </tr></thead>
              <tbody>
                {vendedores.map(v => {
                  const pct = v.meta > 0 ? (v.atual / v.meta) * 100 : 0;
                  const barColor = pct >= 80 ? "#22C55E" : pct >= 50 ? "#F59E0B" : "#EF4444";
                  return (
                    <tr key={v.nome} className="border-b border-border/30">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px]" style={{backgroundColor: v.cor + "30", color: v.cor}}>{v.nome.split(" ").map(n=>n[0]).join("").slice(0,2)}</AvatarFallback></Avatar>
                          <span className="text-xs font-medium">{v.nome}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center text-xs">{v.meta}</td>
                      <td className="p-3 text-center text-xs font-semibold">{v.atual}</td>
                      <td className="p-3 text-center">
                        <Badge className="text-[10px] border-0" style={{backgroundColor: barColor + "20", color: barColor}}>{pct.toFixed(0)}%</Badge>
                      </td>
                      <td className="p-3 w-32">
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{width: `${Math.min(pct,100)}%`, backgroundColor: barColor}} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="border border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Evolução Mensal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={evolucao}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{fontSize: 11}} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{fontSize: 11}} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12}} />
                <Legend wrapperStyle={{fontSize: 11}} />
                <Bar dataKey="meta" fill="hsl(var(--muted-foreground))" name="Meta" radius={[4,4,0,0]} />
                <Bar dataKey="realizado" fill="hsl(var(--primary))" name="Realizado" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
