import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CheckCircle2, Package } from "lucide-react";

interface Plano {
  id: string; nome: string; descricao: string; valorMensal: number; ativo: boolean;
  coberturas: string[]; carencia: number; multaCancelamento: number;
}

const todasCoberturas = [
  "Roubo e Furto","Colisão","Incêndio","Enchente/Alagamento","Terceiros","Vidros",
  "Guincho 24h","Carro Reserva","Assistência Residencial","Proteção de Acessórios",
  "Rastreamento","APP (Acidentes Pessoais)",
];

const mockPlanos: Plano[] = [
  { id: "p1", nome: "Básico", descricao: "Proteção essencial com as principais coberturas para seu veículo.", valorMensal: 89.90, ativo: true, coberturas: ["Roubo e Furto","Colisão","Guincho 24h"], carencia: 90, multaCancelamento: 5 },
  { id: "p2", nome: "Intermediário", descricao: "Proteção ampliada com coberturas adicionais e assistência.", valorMensal: 139.90, ativo: true, coberturas: ["Roubo e Furto","Colisão","Incêndio","Terceiros","Guincho 24h","Vidros"], carencia: 60, multaCancelamento: 3 },
  { id: "p3", nome: "Completo", descricao: "Proteção completa com todas as coberturas principais e assistência premium.", valorMensal: 189.90, ativo: true, coberturas: ["Roubo e Furto","Colisão","Incêndio","Enchente/Alagamento","Terceiros","Vidros","Guincho 24h","Carro Reserva","APP (Acidentes Pessoais)"], carencia: 45, multaCancelamento: 2 },
  { id: "p4", nome: "Premium", descricao: "O melhor plano de proteção com cobertura total e benefícios exclusivos.", valorMensal: 249.90, ativo: true, coberturas: todasCoberturas, carencia: 30, multaCancelamento: 0 },
];

export default function Produtos() {
  const [planos] = useState(mockPlanos);
  const [editing, setEditing] = useState<Plano | null>(null);

  const tierBorder: Record<string, string> = {
    "Básico": "border-border/50",
    "Intermediário": "border-sky-500/30",
    "Completo": "border-primary/30",
    "Premium": "border-amber-500/30",
  };
  const tierBg: Record<string, string> = {
    "Básico": "from-muted to-muted/50",
    "Intermediário": "from-sky-500/10 to-sky-500/5",
    "Completo": "from-primary/10 to-primary/5",
    "Premium": "from-amber-500/10 to-amber-500/5",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos / Planos</h1>
          <p className="text-sm text-muted-foreground">{planos.length} planos cadastrados</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Plano</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {planos.map(p => (
          <Card key={p.id} className={`border ${tierBorder[p.nome] || "border-border/50"} bg-gradient-to-b ${tierBg[p.nome] || ""} hover:shadow-lg transition-all cursor-pointer`} onClick={() => setEditing(p)}>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="text-sm font-bold">{p.nome}</span>
                </div>
                <Badge className={`text-[9px] border-0 ${p.ativo ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"}`}>{p.ativo ? "Ativo" : "Inativo"}</Badge>
              </div>
              <div>
                <span className="text-3xl font-bold">R$ {p.valorMensal.toFixed(2).replace(".",",")}</span>
                <span className="text-xs text-muted-foreground">/mês</span>
              </div>
              <p className="text-xs text-muted-foreground">{p.descricao}</p>
              <Separator />
              <div className="space-y-1.5">
                {p.coberturas.map(c => (
                  <div key={c} className="flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                <div>Carência: <span className="font-medium text-foreground">{p.carencia} dias</span></div>
                <div>Multa: <span className="font-medium text-foreground">{p.multaCancelamento}%</span></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          {editing && (
            <>
              <DialogHeader><DialogTitle>Editar Plano: {editing.nome}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Nome</Label><Input className="h-9 text-xs" defaultValue={editing.nome} /></div>
                  <div className="space-y-1"><Label className="text-xs">Valor Mensal (R$)</Label><Input type="number" className="h-9 text-xs" defaultValue={editing.valorMensal} /></div>
                </div>
                <div className="space-y-1"><Label className="text-xs">Descrição</Label><Textarea className="text-xs" defaultValue={editing.descricao} rows={2} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Carência (dias)</Label><Input type="number" className="h-9 text-xs" defaultValue={editing.carencia} /></div>
                  <div className="space-y-1"><Label className="text-xs">Multa Cancelamento (%)</Label><Input type="number" className="h-9 text-xs" defaultValue={editing.multaCancelamento} /></div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Coberturas</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {todasCoberturas.map(c => (
                      <div key={c} className="flex items-center gap-2 text-xs">
                        <Checkbox defaultChecked={editing.coberturas.includes(c)} />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button className="w-full" onClick={() => setEditing(null)}>Salvar Alterações</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
