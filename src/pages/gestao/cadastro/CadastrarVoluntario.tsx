import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, UserCog, Pencil, Trash2, Search, Shield, Phone, Mail } from "lucide-react";

interface Voluntario {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  perfil: "Administrador" | "Operador" | "Vendedor" | "Inspetor" | "Financeiro";
  cooperativa: string;
  status: "Ativo" | "Inativo";
  dataCadastro: string;
}

// No voluntarios table exists yet - local state only
const initialVoluntarios: Voluntario[] = [];

const perfis = ["Administrador", "Operador", "Vendedor", "Inspetor", "Financeiro"];
const cooperativas = ["Cooperativa São Paulo", "Cooperativa Rio", "Cooperativa Minas", "Cooperativa Sul", "Cooperativa Centro-Oeste"];

const perfilColor: Record<string, string> = {
  Administrador: "bg-destructive/10 text-destructive border-destructive/20",
  Operador: "bg-primary/10 text-blue-600 border-blue-200",
  Vendedor: "bg-emerald-500/10 text-emerald-600 border-success/20",
  Inspetor: "bg-warning/8 text-warning border-warning/25",
  Financeiro: "bg-primary/10 text-purple-600 border-purple-200",
};

const emptyForm: { nome: string; cpf: string; email: string; telefone: string; perfil: Voluntario["perfil"]; cooperativa: string } = { nome: "", cpf: "", email: "", telefone: "", perfil: "Operador", cooperativa: "" };

export default function CadastrarVoluntario() {
  const [voluntarios, setVoluntarios] = useState(initialVoluntarios);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));

  const filtered = voluntarios.filter(v =>
    !search || v.nome.toLowerCase().includes(search.toLowerCase()) || v.cpf.includes(search) || v.email.toLowerCase().includes(search.toLowerCase())
  );

  const maskCpf = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
    return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
  };

  const openNew = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (v: Voluntario) => { setEditId(v.id); setForm(v); setModalOpen(true); };

  const handleSave = () => {
    if (!form.nome || !form.cpf || !form.email) { toast.error("Preencha os campos obrigatórios"); return; }
    toast.info("Funcionalidade em desenvolvimento");
    setModalOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Voluntários / Usuários</h2>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Voluntário</Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, CPF ou e-mail" className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Cooperativa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(v => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium text-sm">{v.nome}</TableCell>
                  <TableCell className="text-sm font-mono">{v.cpf}</TableCell>
                  <TableCell className="text-sm">{v.email}</TableCell>
                  <TableCell className="text-sm">{v.telefone}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={perfilColor[v.perfil]}>{v.perfil}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{v.cooperativa}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={v.status === "Ativo" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}>
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(v)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setVoluntarios(p => p.filter(x => x.id !== v.id)); toast.success("Removido!"); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Editar Voluntário" : "Novo Voluntário"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome Completo *</Label><Input value={form.nome} onChange={e => set("nome", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>CPF *</Label><Input value={form.cpf} onChange={e => set("cpf", maskCpf(e.target.value))} placeholder="000.000.000-00" /></div>
              <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(11) 99999-9999" /></div>
            </div>
            <div><Label>E-mail *</Label><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Perfil de Acesso</Label>
                <Select value={form.perfil} onValueChange={v => set("perfil", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{perfis.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Cooperativa</Label>
                <Select value={form.cooperativa} onValueChange={v => set("cooperativa", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{cooperativas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-3 rounded-md bg-primary/5 border border-blue-200/50 text-xs text-blue-600">
              <Shield className="h-3.5 w-3.5 inline mr-1" />
              Ao cadastrar, um usuário será criado automaticamente e sincronizado com o módulo de Vendas.
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
