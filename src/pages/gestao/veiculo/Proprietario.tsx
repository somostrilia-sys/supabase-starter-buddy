import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { User, Plus, Search, Trash2, Edit, Save, Eraser } from "lucide-react";

const ufs = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

const maskCpf = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
};
const maskTel = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
};
const maskCep = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length <= 5 ? d : `${d.slice(0,5)}-${d.slice(5)}`;
};
const calcIdade = (dt: string) => {
  if (!dt) return "";
  const b = new Date(dt); const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--;
  return String(age);
};

const statusColor = (s: string) => s === "Ativo" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

const emptyForm = {
  situacao: "Ativo", nome: "", cpf: "", rg: "", dataExpRg: "", orgaoExp: "",
  dataNasc: "", sexo: "", profissao: "", estadoCivil: "",
  telefone: "", telComercial: "", celular: "", email: "",
  cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
};

const mockProprietarios = [
  { id: 1, situacao: "Ativo", nome: "Carlos Alberto Silva", cpf: "111.222.333-44", rg: "12.345.678-9", dataExpRg: "2015-03-10", orgaoExp: "SSP/SP", dataNasc: "1985-03-15", sexo: "Masculino", profissao: "Engenheiro", estadoCivil: "Casado", telefone: "(11) 3456-7890", telComercial: "(11) 2345-6789", celular: "(11) 99876-5432", email: "carlos@email.com", cep: "01001-000", logradouro: "Praça da Sé", numero: "100", complemento: "Sala 5", bairro: "Sé", cidade: "São Paulo", estado: "SP" },
  { id: 2, situacao: "Ativo", nome: "Maria Aparecida Santos", cpf: "222.333.444-55", rg: "23.456.789-0", dataExpRg: "2018-07-20", orgaoExp: "SSP/SP", dataNasc: "1990-07-22", sexo: "Feminino", profissao: "Advogada", estadoCivil: "Solteiro", telefone: "(19) 3456-7890", telComercial: "", celular: "(19) 98765-4321", email: "maria@email.com", cep: "13010-001", logradouro: "Rua Barão de Jaguara", numero: "450", complemento: "", bairro: "Centro", cidade: "Campinas", estado: "SP" },
  { id: 3, situacao: "Ativo", nome: "José Roberto Oliveira", cpf: "333.444.555-66", rg: "34.567.890-1", dataExpRg: "2012-11-05", orgaoExp: "DETRAN/RJ", dataNasc: "1978-11-10", sexo: "Masculino", profissao: "Motorista", estadoCivil: "Casado", telefone: "(21) 3456-7890", telComercial: "(21) 2345-6789", celular: "(21) 97654-3210", email: "jose@email.com", cep: "20040-020", logradouro: "Av. Rio Branco", numero: "156", complemento: "Andar 8", bairro: "Centro", cidade: "Rio de Janeiro", estado: "RJ" },
  { id: 4, situacao: "Inativo", nome: "Ana Paula Ferreira", cpf: "444.555.666-77", rg: "45.678.901-2", dataExpRg: "2020-01-15", orgaoExp: "SSP/MG", dataNasc: "1995-01-30", sexo: "Feminino", profissao: "Professora", estadoCivil: "União Estável", telefone: "(31) 3456-7890", telComercial: "", celular: "(31) 96543-2109", email: "ana@email.com", cep: "30130-000", logradouro: "Av. Afonso Pena", numero: "1500", complemento: "", bairro: "Centro", cidade: "Belo Horizonte", estado: "MG" },
  { id: 5, situacao: "Ativo", nome: "Francisco das Chagas Lima", cpf: "555.666.777-88", rg: "56.789.012-3", dataExpRg: "2016-06-10", orgaoExp: "SSP/PR", dataNasc: "1972-06-18", sexo: "Masculino", profissao: "Comerciante", estadoCivil: "Divorciado", telefone: "(41) 3456-7890", telComercial: "(41) 2345-6789", celular: "(41) 95432-1098", email: "francisco@email.com", cep: "80010-000", logradouro: "Rua XV de Novembro", numero: "700", complemento: "Loja 3", bairro: "Centro", cidade: "Curitiba", estado: "PR" },
];

export default function Proprietario() {
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [showList, setShowList] = useState(false);
  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));
  const idade = calcIdade(form.dataNasc);

  const buscarCep = () => {
    if (form.cep.replace(/\D/g, "").length >= 8) {
      set("logradouro", "Rua das Flores"); set("bairro", "Jardim"); set("cidade", "São Paulo"); set("estado", "SP");
      toast.success("CEP encontrado!");
    }
  };

  const salvar = () => {
    if (!form.nome || !form.cpf) { toast.error("Preencha nome e CPF."); return; }
    toast.success(editing ? "Proprietário atualizado!" : "Proprietário salvo com sucesso!");
    setEditing(null);
  };

  const editarItem = (p: typeof mockProprietarios[0]) => {
    setForm({ ...p });
    setEditing(p.id);
    setShowList(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2"><User className="h-5 w-5" /> Proprietário</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowList(!showList)} className="gap-1"><Search className="h-3.5 w-3.5" /> {showList ? "Fechar Lista" : "Pesquisar"}</Button>
        </div>
      </div>

      {showList && (
        <Card>
          <CardContent className="p-4">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Nome</TableHead><TableHead>CPF</TableHead><TableHead>Cidade</TableHead><TableHead>Celular</TableHead><TableHead>Situação</TableHead><TableHead className="w-20">Ações</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {mockProprietarios.map(p => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => editarItem(p)}>
                    <TableCell className="text-sm font-medium">{p.nome}</TableCell>
                    <TableCell className="text-sm">{p.cpf}</TableCell>
                    <TableCell className="text-sm">{p.cidade}/{p.estado}</TableCell>
                    <TableCell className="text-sm">{p.celular}</TableCell>
                    <TableCell><Badge className={statusColor(p.situacao)}>{p.situacao}</Badge></TableCell>
                    <TableCell className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Dados do Proprietário {editing ? `(Editando #${editing})` : ""}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Situação</Label>
              <Select value={form.situacao} onValueChange={v => set("situacao", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2"><Label className="text-xs">Nome *</Label><Input value={form.nome} onChange={e => set("nome", e.target.value)} /></div>
            <div><Label className="text-xs">CPF *</Label><Input value={form.cpf} onChange={e => set("cpf", maskCpf(e.target.value))} placeholder="000.000.000-00" /></div>
            <div><Label className="text-xs">RG</Label><Input value={form.rg} onChange={e => set("rg", e.target.value)} /></div>
            <div><Label className="text-xs">Data Expedição</Label><Input type="date" value={form.dataExpRg} onChange={e => set("dataExpRg", e.target.value)} /></div>
            <div><Label className="text-xs">Órgão Expedidor</Label><Input value={form.orgaoExp} onChange={e => set("orgaoExp", e.target.value)} /></div>
            <div><Label className="text-xs">Data Nascimento</Label><Input type="date" value={form.dataNasc} onChange={e => set("dataNasc", e.target.value)} /></div>
            <div><Label className="text-xs">Idade</Label><Input value={idade} disabled className="bg-muted" /></div>
            <div>
              <Label className="text-xs">Sexo</Label>
              <Select value={form.sexo} onValueChange={v => set("sexo", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Feminino">Feminino</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Profissão</Label>
              <Select value={form.profissao} onValueChange={v => set("profissao", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{["Engenheiro", "Advogado", "Motorista", "Professor", "Comerciante", "Médico", "Outro"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Estado Civil</Label>
              <Select value={form.estadoCivil} onValueChange={v => set("estadoCivil", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{["Solteiro", "Casado", "Divorciado", "Viúvo", "União Estável"].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Contato</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label className="text-xs">Tel. Residencial</Label><Input value={form.telefone} onChange={e => set("telefone", maskTel(e.target.value))} /></div>
            <div><Label className="text-xs">Tel. Comercial</Label><Input value={form.telComercial} onChange={e => set("telComercial", maskTel(e.target.value))} /></div>
            <div><Label className="text-xs">Celular</Label><Input value={form.celular} onChange={e => set("celular", maskTel(e.target.value))} /></div>
            <div><Label className="text-xs">E-mail</Label><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Endereço</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex gap-1 items-end">
              <div className="flex-1"><Label className="text-xs">CEP</Label><Input value={form.cep} onChange={e => set("cep", maskCep(e.target.value))} placeholder="00000-000" /></div>
              <Button variant="outline" size="sm" className="h-10" onClick={buscarCep}><Search className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="md:col-span-2"><Label className="text-xs">Logradouro</Label><Input value={form.logradouro} onChange={e => set("logradouro", e.target.value)} /></div>
            <div><Label className="text-xs">Nº</Label><Input value={form.numero} onChange={e => set("numero", e.target.value)} /></div>
            <div><Label className="text-xs">Complemento</Label><Input value={form.complemento} onChange={e => set("complemento", e.target.value)} /></div>
            <div><Label className="text-xs">Bairro</Label><Input value={form.bairro} onChange={e => set("bairro", e.target.value)} /></div>
            <div><Label className="text-xs">Cidade</Label><Input value={form.cidade} onChange={e => set("cidade", e.target.value)} /></div>
            <div>
              <Label className="text-xs">Estado</Label>
              <Select value={form.estado} onValueChange={v => set("estado", v)}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>{ufs.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={salvar} className="gap-1"><Save className="h-4 w-4" /> Salvar</Button>
        <Button variant="outline" className="gap-1" onClick={() => { setForm(emptyForm); setEditing(null); }}><Plus className="h-4 w-4" /> Novo</Button>
        <Button variant="outline" className="gap-1" onClick={() => setShowList(true)}><Search className="h-4 w-4" /> Pesquisar</Button>
        {editing && <Button variant="destructive" className="gap-1" onClick={() => { toast.success("Proprietário excluído!"); setForm(emptyForm); setEditing(null); }}><Trash2 className="h-4 w-4" /> Excluir</Button>}
      </div>
    </div>
  );
}
