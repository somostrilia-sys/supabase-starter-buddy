import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, MapPin, Pencil, Trash2, Building2, Users } from "lucide-react";

interface Regional {
  id: string;
  nome: string;
  cooperativa: string;
  responsavel: string;
  abrangencia: string;
  nAssociados: number;
  ativa: boolean;
}

const mockRegionais: Regional[] = [
  { id: "r1", nome: "Regional Capital SP", cooperativa: "Cooperativa São Paulo", responsavel: "Carlos Alberto", abrangencia: "São Paulo, Guarulhos, Osasco, São Bernardo, Santo André", nAssociados: 520, ativa: true },
  { id: "r2", nome: "Regional Interior SP", cooperativa: "Cooperativa São Paulo", responsavel: "Marcos Vinícius", abrangencia: "Campinas, Ribeirão Preto, São José dos Campos, Sorocaba", nAssociados: 380, ativa: true },
  { id: "r3", nome: "Regional Litoral SP", cooperativa: "Cooperativa São Paulo", responsavel: "Fernanda Beatriz", abrangencia: "Santos, São Vicente, Praia Grande, Guarujá", nAssociados: 200, ativa: true },
  { id: "r4", nome: "Regional Capital RJ", cooperativa: "Cooperativa Rio", responsavel: "Maria Helena", abrangencia: "Rio de Janeiro, Niterói, São Gonçalo, Duque de Caxias", nAssociados: 450, ativa: true },
  { id: "r5", nome: "Regional Baixada RJ", cooperativa: "Cooperativa Rio", responsavel: "Diego Fernando", abrangencia: "Nova Iguaçu, Belford Roxo, Mesquita, Nilópolis", nAssociados: 280, ativa: true },
  { id: "r6", nome: "Regional Capital MG", cooperativa: "Cooperativa Minas", responsavel: "José Roberto", abrangencia: "Belo Horizonte, Contagem, Betim, Ribeirão das Neves", nAssociados: 350, ativa: true },
  { id: "r7", nome: "Regional Triângulo MG", cooperativa: "Cooperativa Minas", responsavel: "Adriana Souza", abrangencia: "Uberlândia, Uberaba, Araguari", nAssociados: 180, ativa: false },
  { id: "r8", nome: "Regional Metropolitana PR", cooperativa: "Cooperativa Sul", responsavel: "Ana Paula", abrangencia: "Curitiba, São José dos Pinhais, Colombo, Araucária", nAssociados: 300, ativa: true },
];

const cooperativas = ["Cooperativa São Paulo", "Cooperativa Rio", "Cooperativa Minas", "Cooperativa Sul", "Cooperativa Centro-Oeste"];

const emptyForm = { nome: "", cooperativa: "", responsavel: "", abrangencia: "", ativa: true };

export default function CadastrarRegional() {
  const [regionais, setRegionais] = useState(mockRegionais);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));

  const openNew = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (r: Regional) => { setEditId(r.id); setForm(r); setModalOpen(true); };

  const handleSave = () => {
    if (!form.nome || !form.cooperativa) { toast.error("Preencha nome e cooperativa"); return; }
    if (editId) {
      setRegionais(p => p.map(r => r.id === editId ? { ...r, ...form } : r));
      toast.success("Regional atualizada!");
    } else {
      setRegionais(p => [...p, { ...form, id: `r${Date.now()}`, nAssociados: 0 }]);
      toast.success("Regional cadastrada!");
    }
    setModalOpen(false);
  };

  // Group by cooperativa
  const grouped = cooperativas.map(c => ({
    cooperativa: c,
    items: regionais.filter(r => r.cooperativa === c),
  })).filter(g => g.items.length > 0);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Regionais</h2>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Nova Regional</Button>
      </div>

      <div className="space-y-6">
        {grouped.map(g => (
          <div key={g.cooperativa}>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground">{g.cooperativa}</h3>
              <Badge variant="outline" className="text-[10px]">{g.items.length} regionais</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {g.items.map(r => (
                <Card key={r.id} className={!r.ativa ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-rose-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{r.nome}</h4>
                          <p className="text-xs text-muted-foreground">Resp: {r.responsavel}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={r.ativa ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}>
                        {r.ativa ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{r.abrangencia}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="gap-1 text-[10px]"><Users className="h-3 w-3" /> {r.nAssociados}</Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setRegionais(p => p.filter(x => x.id !== r.id)); toast.success("Removida!"); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Editar Regional" : "Nova Regional"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Ex: Regional Capital SP" /></div>
            <div><Label>Cooperativa *</Label>
              <Select value={form.cooperativa} onValueChange={v => set("cooperativa", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{cooperativas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Responsável</Label><Input value={form.responsavel} onChange={e => set("responsavel", e.target.value)} /></div>
            <div><Label>Abrangência (cidades)</Label><Input value={form.abrangencia} onChange={e => set("abrangencia", e.target.value)} placeholder="São Paulo, Guarulhos, Osasco..." /></div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
