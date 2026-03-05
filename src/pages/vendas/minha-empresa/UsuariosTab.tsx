import { useState } from "react";
import { Plus, Edit, Trash2, Users, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Search } from "lucide-react";
import { toast } from "sonner";

interface Usuario {
  id: string;
  nome: string;
  nomeTratamento: string;
  cpfCnpj: string;
  email: string;
  funcao: string;
  telefoneComercial: string;
  celular: string;
  regional: string;
  cooperativa: string;
  grupoPermissoes: string;
  remuneracao: string;
  comissao: string;
  associacao: string;
  gerenteVinculado: string;
  status: "ativo" | "inativo";
}

const mockUsuarios: Usuario[] = [
  { id: "1", nome: "Carlos Silva", nomeTratamento: "Carlos", cpfCnpj: "123.456.789-00", email: "carlos@empresa.com", funcao: "Administrador", telefoneComercial: "(11) 3000-0001", celular: "(11) 99000-0001", regional: "São Paulo", cooperativa: "Cooperativa Central", grupoPermissoes: "Administrador", remuneracao: "8.500,00", comissao: "5", associacao: "2", gerenteVinculado: "", status: "ativo" },
  { id: "2", nome: "Ana Oliveira", nomeTratamento: "Ana", cpfCnpj: "987.654.321-00", email: "ana@empresa.com", funcao: "Gerente", telefoneComercial: "(11) 3000-0002", celular: "(11) 99000-0002", regional: "São Paulo", cooperativa: "Cooperativa Central", grupoPermissoes: "Gerente", remuneracao: "6.000,00", comissao: "8", associacao: "3", gerenteVinculado: "Carlos Silva", status: "ativo" },
  { id: "3", nome: "Pedro Santos", nomeTratamento: "Pedro", cpfCnpj: "111.222.333-44", email: "pedro@empresa.com", funcao: "Consultor", telefoneComercial: "(41) 3000-0003", celular: "(41) 99000-0003", regional: "Sul", cooperativa: "Cooperativa Sul", grupoPermissoes: "Consultor", remuneracao: "3.500,00", comissao: "12", associacao: "5", gerenteVinculado: "Ana Oliveira", status: "ativo" },
  { id: "4", nome: "Maria Costa", nomeTratamento: "Maria", cpfCnpj: "444.555.666-77", email: "maria@empresa.com", funcao: "Financeiro", telefoneComercial: "(11) 3000-0004", celular: "(11) 99000-0004", regional: "São Paulo", cooperativa: "Cooperativa Central", grupoPermissoes: "Consultor", remuneracao: "4.200,00", comissao: "0", associacao: "0", gerenteVinculado: "Carlos Silva", status: "inativo" },
  { id: "5", nome: "Lucas Ferreira", nomeTratamento: "Lucas", cpfCnpj: "777.888.999-00", email: "lucas@empresa.com", funcao: "Vistoriador", telefoneComercial: "(92) 3000-0005", celular: "(92) 99000-0005", regional: "Norte", cooperativa: "Cooperativa Norte", grupoPermissoes: "Vistoriador", remuneracao: "3.000,00", comissao: "3", associacao: "1", gerenteVinculado: "Ana Oliveira", status: "ativo" },
];

const emptyUsuario: Omit<Usuario, "id"> = {
  nome: "", nomeTratamento: "", cpfCnpj: "", email: "", funcao: "", telefoneComercial: "",
  celular: "", regional: "", cooperativa: "", grupoPermissoes: "", remuneracao: "",
  comissao: "", associacao: "", gerenteVinculado: "", status: "ativo",
};

const funcoes = ["Administrador", "Gerente", "Consultor", "Vistoriador", "Financeiro", "Operacional"];
const regionais = ["São Paulo", "Sul", "Norte", "Nordeste", "Centro-Oeste"];
const cooperativas = ["Cooperativa Central", "Cooperativa Sul", "Cooperativa Norte"];
const gruposPermissoes = ["Administrador", "Gerente", "Consultor", "Vistoriador"];
const gerentes = ["Carlos Silva", "Ana Oliveira"];

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function UsuariosTab() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(mockUsuarios);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Usuario, "id">>(emptyUsuario);

  const filtered = usuarios.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm({ ...emptyUsuario });
    setEditingId(null);
    setSheetOpen(true);
  };

  const openEdit = (u: Usuario) => {
    const { id, ...rest } = u;
    setForm(rest);
    setEditingId(id);
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!form.nome || !form.email) {
      toast.error("Preencha nome e e-mail");
      return;
    }
    if (editingId) {
      setUsuarios(prev => prev.map(u => u.id === editingId ? { ...form, id: editingId } : u));
      toast.success("Usuário atualizado");
    } else {
      setUsuarios(prev => [...prev, { ...form, id: String(Date.now()) }]);
      toast.success("Usuário criado");
    }
    setSheetOpen(false);
  };

  const handleDelete = (id: string) => {
    setUsuarios(prev => prev.filter(u => u.id !== id));
    toast.success("Usuário excluído");
  };

  const updateForm = (field: keyof Omit<Usuario, "id">, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Usuários
            </CardTitle>
            <CardDescription>Gerencie os usuários da empresa</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar usuário..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Button size="sm" className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Novo Usuário</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Cooperativa</TableHead>
                <TableHead>Grupo Permissões</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.funcao}</TableCell>
                  <TableCell>{u.cooperativa}</TableCell>
                  <TableCell><Badge variant="outline">{u.grupoPermissoes}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={u.status === "ativo" ? "default" : "secondary"}>{u.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(u.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? "Editar Usuário" : "Novo Usuário"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <FormField label="Nome completo">
              <Input value={form.nome} onChange={e => updateForm("nome", e.target.value)} placeholder="Nome completo" />
            </FormField>
            <FormField label="Nome de tratamento">
              <Input value={form.nomeTratamento} onChange={e => updateForm("nomeTratamento", e.target.value)} placeholder="Como deseja ser chamado" />
            </FormField>
            <FormField label="CPF/CNPJ">
              <Input value={form.cpfCnpj} onChange={e => updateForm("cpfCnpj", e.target.value)} placeholder="000.000.000-00" />
            </FormField>
            <FormField label="E-mail">
              <Input type="email" value={form.email} onChange={e => updateForm("email", e.target.value)} placeholder="email@empresa.com" />
            </FormField>
            <FormField label="Função">
              <Select value={form.funcao} onValueChange={v => updateForm("funcao", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{funcoes.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Telefone comercial">
                <Input value={form.telefoneComercial} onChange={e => updateForm("telefoneComercial", e.target.value)} placeholder="(00) 0000-0000" />
              </FormField>
              <FormField label="Celular / WhatsApp">
                <Input value={form.celular} onChange={e => updateForm("celular", e.target.value)} placeholder="(00) 00000-0000" />
              </FormField>
            </div>
            <FormField label="Regional">
              <Select value={form.regional} onValueChange={v => updateForm("regional", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{regionais.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Cooperativa">
              <Select value={form.cooperativa} onValueChange={v => updateForm("cooperativa", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{cooperativas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Grupo de permissões">
              <Select value={form.grupoPermissoes} onValueChange={v => updateForm("grupoPermissoes", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{gruposPermissoes.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Remuneração (R$)">
                <Input value={form.remuneracao} onChange={e => updateForm("remuneracao", e.target.value)} placeholder="0,00" />
              </FormField>
              <FormField label="Comissão (%)">
                <Input type="number" value={form.comissao} onChange={e => updateForm("comissao", e.target.value)} placeholder="0" />
              </FormField>
              <FormField label="Associação (%)">
                <Input type="number" value={form.associacao} onChange={e => updateForm("associacao", e.target.value)} placeholder="0" />
              </FormField>
            </div>
            <FormField label="Vincular gerente">
              <Select value={form.gerenteVinculado} onValueChange={v => updateForm("gerenteVinculado", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>{gerentes.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
          </div>
          <SheetFooter className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
