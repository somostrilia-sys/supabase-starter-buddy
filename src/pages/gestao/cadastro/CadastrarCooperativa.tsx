import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Building2, Pencil, Trash2, MapPin, Phone, Mail, Users } from "lucide-react";

interface Cooperativa {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  ie: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  responsavel: string;
  regionais: string;
  nAssociados: number;
  nVeiculos: number;
  ativa: boolean;
}

const mockCoops: Cooperativa[] = [
  { id: "c1", razaoSocial: "Cooperativa de Proteção Veicular São Paulo Ltda", nomeFantasia: "Cooperativa São Paulo", cnpj: "12.345.678/0001-90", ie: "123.456.789.110", endereco: "Av. Paulista, 1000 - 10º Andar", cidade: "São Paulo", estado: "SP", cep: "01310-100", telefone: "(11) 3456-7890", email: "contato@coopsp.com.br", responsavel: "Carlos Alberto", regionais: "Todas", nAssociados: 1250, nVeiculos: 1870, ativa: true },
  { id: "c2", razaoSocial: "Cooperativa de Proteção Veicular Rio de Janeiro Ltda", nomeFantasia: "Cooperativa Rio", cnpj: "23.456.789/0001-01", ie: "234.567.890.221", endereco: "Rua da Assembleia, 50 - 5º Andar", cidade: "Rio de Janeiro", estado: "RJ", cep: "20011-000", telefone: "(21) 2345-6789", email: "contato@cooprj.com.br", responsavel: "Maria Helena", regionais: "Todas", nAssociados: 980, nVeiculos: 1450, ativa: true },
  { id: "c3", razaoSocial: "Cooperativa de Proteção Veicular Minas Gerais Ltda", nomeFantasia: "Cooperativa Minas", cnpj: "34.567.890/0001-12", ie: "345.678.901.332", endereco: "Av. Afonso Pena, 500", cidade: "Belo Horizonte", estado: "MG", cep: "30130-001", telefone: "(31) 3456-7890", email: "contato@coopmg.com.br", responsavel: "José Roberto", regionais: "Regional Capital, Regional Interior", nAssociados: 750, nVeiculos: 1100, ativa: true },
  { id: "c4", razaoSocial: "Cooperativa de Proteção Veicular Sul Ltda", nomeFantasia: "Cooperativa Sul", cnpj: "45.678.901/0001-23", ie: "456.789.012.443", endereco: "Rua XV de Novembro, 200", cidade: "Curitiba", estado: "PR", cep: "80020-310", telefone: "(41) 3456-7890", email: "contato@coopsul.com.br", responsavel: "Ana Paula", regionais: "Todas", nAssociados: 620, nVeiculos: 890, ativa: true },
  { id: "c5", razaoSocial: "Cooperativa de Proteção Veicular Centro-Oeste Ltda", nomeFantasia: "Cooperativa Centro-Oeste", cnpj: "56.789.012/0001-34", ie: "567.890.123.554", endereco: "SBS Quadra 2, Bloco A", cidade: "Brasília", estado: "DF", cep: "70070-120", telefone: "(61) 3456-7890", email: "contato@coopco.com.br", responsavel: "Pedro Henrique", regionais: "Regional Capital", nAssociados: 430, nVeiculos: 650, ativa: false },
];

const emptyForm: Omit<Cooperativa, "id" | "nAssociados" | "nVeiculos"> = {
  razaoSocial: "", nomeFantasia: "", cnpj: "", ie: "", endereco: "", cidade: "", estado: "",
  cep: "", telefone: "", email: "", responsavel: "", regionais: "Todas", ativa: true,
};

const ufs = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

export default function CadastrarCooperativa() {
  const [coops, setCoops] = useState(mockCoops);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));

  const openNew = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (c: Cooperativa) => { setEditId(c.id); setForm(c); setModalOpen(true); };

  const handleSave = () => {
    if (!form.nomeFantasia || !form.cnpj) { toast.error("Preencha nome e CNPJ"); return; }
    if (editId) {
      setCoops(prev => prev.map(c => c.id === editId ? { ...c, ...form } : c));
      toast.success("Cooperativa atualizada!");
    } else {
      setCoops(prev => [...prev, { ...form, id: `c${Date.now()}`, nAssociados: 0, nVeiculos: 0 }]);
      toast.success("Cooperativa cadastrada!");
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => { setCoops(p => p.filter(c => c.id !== id)); toast.success("Cooperativa removida!"); };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Cooperativas</h2>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Nova Cooperativa</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coops.map(c => (
          <Card key={c.id} className={`${!c.ativa ? "opacity-60" : ""}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{c.nomeFantasia}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{c.cnpj}</p>
                  </div>
                </div>
                <Badge variant="outline" className={c.ativa ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}>
                  {c.ativa ? "Ativa" : "Inativa"}
                </Badge>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {c.cidade}/{c.estado}</div>
                <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {c.telefone}</div>
                <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {c.email}</div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="outline" className="gap-1"><Users className="h-3 w-3" /> {c.nAssociados} associados</Badge>
                <Badge variant="outline" className="gap-1">{c.nVeiculos} veículos</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(c)} className="gap-1.5"><Pencil className="h-3.5 w-3.5" /> Editar</Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar Cooperativa" : "Nova Cooperativa"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><Label>Razão Social</Label><Input value={form.razaoSocial} onChange={e => set("razaoSocial", e.target.value)} /></div>
              <div><Label>Nome Fantasia *</Label><Input value={form.nomeFantasia} onChange={e => set("nomeFantasia", e.target.value)} /></div>
              <div><Label>CNPJ *</Label><Input value={form.cnpj} onChange={e => set("cnpj", e.target.value)} placeholder="00.000.000/0000-00" /></div>
              <div><Label>Inscrição Estadual</Label><Input value={form.ie} onChange={e => set("ie", e.target.value)} /></div>
              <div><Label>Responsável</Label><Input value={form.responsavel} onChange={e => set("responsavel", e.target.value)} /></div>
              <div className="md:col-span-2"><Label>Endereço</Label><Input value={form.endereco} onChange={e => set("endereco", e.target.value)} /></div>
              <div><Label>Cidade</Label><Input value={form.cidade} onChange={e => set("cidade", e.target.value)} /></div>
              <div><Label>Estado</Label>
                <Select value={form.estado} onValueChange={v => set("estado", v)}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>{ufs.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>CEP</Label><Input value={form.cep} onChange={e => set("cep", e.target.value)} /></div>
              <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => set("telefone", e.target.value)} /></div>
              <div><Label>E-mail</Label><Input value={form.email} onChange={e => set("email", e.target.value)} /></div>
              <div><Label>Regionais</Label>
                <Select value={form.regionais} onValueChange={v => set("regionais", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas">Todas</SelectItem>
                    <SelectItem value="Regional Capital">Regional Capital</SelectItem>
                    <SelectItem value="Regional Interior">Regional Interior</SelectItem>
                    <SelectItem value="Regional Litoral">Regional Litoral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{editId ? "Salvar" : "Cadastrar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
