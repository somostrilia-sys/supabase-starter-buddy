import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  UserPlus, Search, Link2, Settings, Plus, X, Eraser, Trash2, Edit, Save,
} from "lucide-react";

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
  if (!dt || typeof dt !== "string") return "—";
  const b = new Date(dt);
  // Valida data: rejeita Invalid Date, epochs muito antigos e datas futuras
  if (isNaN(b.getTime()) || b.getFullYear() < 1900 || b > new Date()) return "—";
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--;
  if (age < 0 || age > 120) return "—";
  return `${age} anos`;
};

const SelectWithAdd = ({ label, value, onValueChange, options, placeholder }: {
  label: string; value: string; onValueChange: (v: string) => void;
  options: string[]; placeholder?: string;
}) => {
  const [items, setItems] = useState(options);
  const [adding, setAdding] = useState(false);
  const [newVal, setNewVal] = useState("");
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-1">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="flex-1"><SelectValue placeholder={placeholder || "Selecione"} /></SelectTrigger>
          <SelectContent>{items.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
        <Button type="button" variant="outline" size="icon" className="shrink-0 h-10 w-10" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" /></Button>
      </div>
      {adding && (
        <div className="flex gap-1 mt-1">
          <Input value={newVal} onChange={e => setNewVal(e.target.value)} placeholder="Novo valor" className="h-8 text-xs" />
          <Button size="sm" className="h-8 text-xs" onClick={() => { if (newVal.trim()) { setItems(p => [...p, newVal.trim()]); onValueChange(newVal.trim()); } setAdding(false); setNewVal(""); }}>OK</Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setAdding(false); setNewVal(""); }}><X className="h-3 w-3" /></Button>
        </div>
      )}
    </div>
  );
};

type CondutorRow = { id: string | number; nome: string; cpf: string; rg: string; cnh: string; categCnh: string; dataNasc: string; celular: string; cidade: string; estado: string; situacao: string; classificacao: string; placa: string; associado: string };
type VinculoRow = { id: string | number; condutor: string; associado: string; placa: string; data: string };

const defaultClassificacoes = [
  { id: 1, descricao: "Principal", situacao: "Ativo", padrao: true },
  { id: 2, descricao: "Agregado", situacao: "Ativo", padrao: false },
  { id: 3, descricao: "Eventual", situacao: "Ativo", padrao: false },
  { id: 4, descricao: "Temporário", situacao: "Inativo", padrao: false },
];

const allColumns = [
  "Condutor","Data Nasc.","Logradouro","Cidade","Tel. Celular","Placa","Evento","CNH","CPF",
  "Número","Estado","Data Cadastro","Situação","Veículo Associado","Usuário","Data Venc. CNH",
  "RG","Complemento","Tel. Comercial","Hora Cadastro","Data Inativação","Idade","CEP","Bairro",
  "Tel. Associado","Classificação Condutor",
];

// statusColor replaced by StatusBadge component

// ===================== TAB 1: CADASTRAR =====================
function TabCadastrar() {
  const [acao, setAcao] = useState("novo");
  const [form, setForm] = useState({ situacao: "Ativo", classificacao: "", cpf: "", nome: "", rg: "", cnh: "", categCnh: "", data1Cnh: "", dataVencCnh: "", dataNasc: "", telefone: "", telComercial: "", celular: "", cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", associadoBusca: "" });
  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));
  const idade = calcIdade(form.dataNasc);

  const buscarCep = () => {
    if (form.cep.replace(/\D/g, "").length >= 8) {
      set("logradouro", "Rua das Palmeiras"); set("bairro", "Centro"); set("cidade", "São Paulo"); set("estado", "SP");
      toast.success("CEP encontrado!");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Ação</CardTitle></CardHeader>
        <CardContent>
          <RadioGroup value={acao} onValueChange={setAcao} className="flex gap-6">
            <div className="flex items-center gap-2"><RadioGroupItem value="novo" id="novo" /><Label htmlFor="novo" className="text-sm">Novo condutor</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="associado" id="associado" /><Label htmlFor="associado" className="text-sm">Associado condutor</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="existente" id="existente" /><Label htmlFor="existente" className="text-sm">Condutor existente</Label></div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Dados</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Situação</Label>
              <Select value={form.situacao} onValueChange={v => set("situacao", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem></SelectContent>
              </Select>
            </div>
            <SelectWithAdd label="Classificação" value={form.classificacao} onValueChange={v => set("classificacao", v)} options={["Principal", "Agregado", "Eventual", "Temporário"]} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Informações Pessoais</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label className="text-xs">CPF *</Label><Input value={form.cpf} onChange={e => set("cpf", maskCpf(e.target.value))} placeholder="000.000.000-00" /></div>
            <div className="md:col-span-2"><Label className="text-xs">Nome *</Label><Input value={form.nome} onChange={e => set("nome", e.target.value)} /></div>
            <div><Label className="text-xs">RG</Label><Input value={form.rg} onChange={e => set("rg", e.target.value)} /></div>
            <div><Label className="text-xs">CNH</Label><Input value={form.cnh} onChange={e => set("cnh", e.target.value)} /></div>
            <div>
              <Label className="text-xs">Categoria CNH</Label>
              <Select value={form.categCnh} onValueChange={v => set("categCnh", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{["A","B","AB","C","D","E"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Data 1ª CNH</Label><Input type="date" value={form.data1Cnh} onChange={e => set("data1Cnh", e.target.value)} /></div>
            <div><Label className="text-xs">Data Venc. CNH</Label><Input type="date" value={form.dataVencCnh} onChange={e => set("dataVencCnh", e.target.value)} /></div>
            <div><Label className="text-xs">Data Nascimento</Label><Input type="date" value={form.dataNasc} onChange={e => set("dataNasc", e.target.value)} /></div>
            <div><Label className="text-xs">Idade</Label><Input value={idade} disabled className="bg-muted" /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Contato</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div><Label className="text-xs">Telefone</Label><Input value={form.telefone} onChange={e => set("telefone", maskTel(e.target.value))} placeholder="(11) 1234-5678" /></div>
            <div><Label className="text-xs">Tel. Comercial</Label><Input value={form.telComercial} onChange={e => set("telComercial", maskTel(e.target.value))} /></div>
            <div><Label className="text-xs">Celular</Label><Input value={form.celular} onChange={e => set("celular", maskTel(e.target.value))} placeholder="(11) 91234-5678" /></div>
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

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Vincular Condutor</CardTitle></CardHeader>
        <CardContent>
          <div><Label className="text-xs">Nome do Associado</Label><Input value={form.associadoBusca} onChange={e => set("associadoBusca", e.target.value)} placeholder="Buscar associado..." /></div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button className="gap-1" onClick={() => toast.success("Condutor salvo com sucesso!")}><Save className="h-4 w-4" /> Salvar</Button>
        <Button variant="outline" className="gap-1" onClick={() => setForm({ situacao: "Ativo", classificacao: "", cpf: "", nome: "", rg: "", cnh: "", categCnh: "", data1Cnh: "", dataVencCnh: "", dataNasc: "", telefone: "", telComercial: "", celular: "", cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", associadoBusca: "" })}><Eraser className="h-4 w-4" /> Limpar</Button>
      </div>
    </div>
  );
}

// ===================== TAB 2: CONSULTAR =====================
function TabConsultar() {
  const [results, setResults] = useState<CondutorRow[]>([]);
  const [editing, setEditing] = useState<CondutorRow | null>(null);
  const [selectedCols, setSelectedCols] = useState<string[]>(["Condutor", "CPF", "CNH", "Cidade", "Tel. Celular", "Placa", "Situação", "Classificação Condutor"]);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const pesquisar = async () => {
    const { data } = await supabase.from("associados").select("*, veiculos(placa)").order("nome").limit(50);
    const mapped: CondutorRow[] = (data ?? []).map((a: any) => ({
      id: a.id, nome: a.nome ?? "", cpf: a.cpf ?? "", rg: a.rg ?? "",
      cnh: "", categCnh: "", dataNasc: a.data_nascimento ?? "",
      celular: a.telefone ?? "", cidade: a.cidade ?? "", estado: a.estado ?? "",
      situacao: a.status === "ativo" ? "Ativo" : "Inativo",
      classificacao: "Principal", placa: a.veiculos?.[0]?.placa ?? "",
      associado: a.nome ?? "",
    }));
    setResults(mapped); setPage(1);
    toast.success(`${mapped.length} condutores encontrados`);
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => setEditing(null)} className="gap-1"><X className="h-3.5 w-3.5" /> Voltar à lista</Button>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Editar Condutor — {editing.nome}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><Label className="text-xs">Nome</Label><Input defaultValue={editing.nome} /></div>
              <div><Label className="text-xs">CPF</Label><Input defaultValue={editing.cpf} /></div>
              <div><Label className="text-xs">RG</Label><Input defaultValue={editing.rg} /></div>
              <div><Label className="text-xs">CNH</Label><Input defaultValue={editing.cnh} /></div>
              <div><Label className="text-xs">Categoria CNH</Label><Input defaultValue={editing.categCnh} /></div>
              <div><Label className="text-xs">Data Nasc.</Label><Input type="date" defaultValue={editing.dataNasc} /></div>
              <div><Label className="text-xs">Celular</Label><Input defaultValue={editing.celular} /></div>
              <div><Label className="text-xs">Cidade</Label><Input defaultValue={editing.cidade} /></div>
              <div><Label className="text-xs">Estado</Label><Input defaultValue={editing.estado} /></div>
              <div>
                <Label className="text-xs">Situação</Label>
                <Select defaultValue={editing.situacao}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <Button className="mt-4 gap-1" onClick={() => { toast.success("Condutor atualizado!"); setEditing(null); }}><Save className="h-4 w-4" /> Salvar Alterações</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["filtros"]} className="space-y-2">
        <AccordionItem value="filtros" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">Filtros de Busca</AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><Label className="text-xs">Condutor</Label><Input placeholder="Nome" /></div>
              <div><Label className="text-xs">CPF</Label><Input placeholder="000.000.000-00" /></div>
              <div><Label className="text-xs">Tel. Residencial</Label><Input /></div>
              <div><Label className="text-xs">Celular</Label><Input /></div>
              <div><Label className="text-xs">Data Cadastro Inicial</Label><Input type="date" /></div>
              <div><Label className="text-xs">Data Cadastro Final</Label><Input type="date" /></div>
              <div><Label className="text-xs">Bairro</Label><Input /></div>
              <div><Label className="text-xs">Cidade</Label><Input /></div>
              <div><Label className="text-xs">Estado</Label>
                <Select><SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>{ufs.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Associado</Label><Input placeholder="Nome associado" /></div>
              <div><Label className="text-xs">Placa</Label><Input placeholder="ABC-1D23" /></div>
              <div className="flex items-center gap-4 pt-5">
                <div className="flex items-center gap-2"><Checkbox defaultChecked /><Label className="text-xs">Ativo</Label></div>
                <div className="flex items-center gap-2"><Checkbox /><Label className="text-xs">Inativo</Label></div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="colunas" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">Dados Visualizados ({selectedCols.length} de {allColumns.length})</AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {allColumns.map(col => (
                <div key={col} className="flex items-center gap-2">
                  <Checkbox checked={selectedCols.includes(col)} onCheckedChange={c => setSelectedCols(p => c ? [...p, col] : p.filter(x => x !== col))} />
                  <Label className="text-xs">{col}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="ordenacao" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">Ordenação</AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><Label className="text-xs">Título do Relatório</Label><Input placeholder="Relatório de Condutores" /></div>
              <div><Label className="text-xs">Primeira Ordenação</Label>
                <Select><SelectTrigger><SelectValue placeholder="Campo" /></SelectTrigger>
                  <SelectContent>{["Condutor", "CPF", "Data Cadastro", "Cidade"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Direção</Label>
                <Select defaultValue="asc"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="asc">Crescente</SelectItem><SelectItem value="desc">Decrescente</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-2 gap-1"><Plus className="h-3.5 w-3.5" /> Adicionar Ordenação</Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button onClick={pesquisar} className="gap-1"><Search className="h-4 w-4" /> Pesquisar</Button>

      {results.length > 0 && (
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {selectedCols.includes("Condutor") && <TableHead>Condutor</TableHead>}
                {selectedCols.includes("CPF") && <TableHead>CPF</TableHead>}
                {selectedCols.includes("CNH") && <TableHead>CNH</TableHead>}
                {selectedCols.includes("Cidade") && <TableHead>Cidade</TableHead>}
                {selectedCols.includes("Tel. Celular") && <TableHead>Celular</TableHead>}
                {selectedCols.includes("Placa") && <TableHead>Placa</TableHead>}
                {selectedCols.includes("Situação") && <TableHead>Situação</TableHead>}
                {selectedCols.includes("Classificação Condutor") && <TableHead>Classificação</TableHead>}
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.slice((page - 1) * perPage, page * perPage).map(c => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setEditing(c)}>
                  {selectedCols.includes("Condutor") && <TableCell className="text-sm font-medium">{c.nome}</TableCell>}
                  {selectedCols.includes("CPF") && <TableCell className="text-sm">{c.cpf}</TableCell>}
                  {selectedCols.includes("CNH") && <TableCell className="text-sm">{c.cnh}</TableCell>}
                  {selectedCols.includes("Cidade") && <TableCell className="text-sm">{c.cidade}</TableCell>}
                  {selectedCols.includes("Tel. Celular") && <TableCell className="text-sm">{c.celular}</TableCell>}
                  {selectedCols.includes("Placa") && <TableCell className="text-sm font-mono">{c.placa}</TableCell>}
                  {selectedCols.includes("Situação") && <TableCell><StatusBadge status={c.situacao} /></TableCell>}
                  {selectedCols.includes("Classificação Condutor") && <TableCell className="text-sm">{c.classificacao}</TableCell>}
                  <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ===================== TAB 3: VINCULAR =====================
function TabVincular() {
  const [condutor, setCondutor] = useState("");
  const [associado, setAssociado] = useState("");
  const [placa, setPlaca] = useState("");
  const [vinculos, setVinculos] = useState<VinculoRow[]>([]);

  useEffect(() => {
    supabase.from("associados").select("nome, cpf, veiculos(placa)").eq("status", "ativo").order("nome").limit(30)
      .then(({ data }) => {
        const mapped: VinculoRow[] = (data ?? []).filter((a: any) => a.veiculos?.length).map((a: any, i: number) => ({
          id: a.cpf || i, condutor: a.nome, associado: a.nome,
          placa: a.veiculos?.[0]?.placa ?? "", data: "",
        }));
        setVinculos(mapped);
      });
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label className="text-xs">Nome do Condutor</Label><Input value={condutor} onChange={e => setCondutor(e.target.value)} placeholder="Buscar condutor..." /></div>
            <div><Label className="text-xs">Associado</Label><Input value={associado} onChange={e => setAssociado(e.target.value)} placeholder="Nome do associado" /></div>
            <div><Label className="text-xs">Placa</Label><Input value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} placeholder="ABC-1D23" /></div>
          </div>
          <Button className="gap-1" onClick={() => { if (condutor && placa) { toast.success("Condutor vinculado!"); setCondutor(""); setAssociado(""); setPlaca(""); } else toast.error("Preencha condutor e placa."); }}><Link2 className="h-4 w-4" /> Vincular</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Vínculos Existentes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Condutor</TableHead><TableHead>Associado</TableHead><TableHead>Placa</TableHead><TableHead>Data</TableHead><TableHead className="w-10"></TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {vinculos.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">Dados do associado vinculado ao veículo</TableCell></TableRow>
              ) : vinculos.map(v => (
                <TableRow key={String(v.id)}>
                  <TableCell className="text-sm">{v.condutor}</TableCell>
                  <TableCell className="text-sm">{v.associado}</TableCell>
                  <TableCell className="text-sm font-mono">{v.placa}</TableCell>
                  <TableCell className="text-sm">{v.data || "—"}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ===================== TAB 4: CLASSIFICAÇÃO =====================
function TabClassificacao() {
  const [items, setItems] = useState(defaultClassificacoes);
  const [newDesc, setNewDesc] = useState("");
  const [newSit, setNewSit] = useState("Ativo");
  const [newPadrao, setNewPadrao] = useState(false);

  const add = () => {
    if (!newDesc.trim()) return;
    setItems(p => [...p, { id: p.length + 1, descricao: newDesc, situacao: newSit, padrao: newPadrao }]);
    setNewDesc(""); setNewSit("Ativo"); setNewPadrao(false);
    toast.success("Classificação adicionada!");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Nova Classificação</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <div><Label className="text-xs">Descrição</Label><Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Nome da classificação" /></div>
            <div>
              <Label className="text-xs">Situação</Label>
              <Select value={newSit} onValueChange={setNewSit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-3"><Switch checked={newPadrao} onCheckedChange={setNewPadrao} /><Label className="text-xs">Padrão</Label></div>
            <Button onClick={add} className="gap-1"><Plus className="h-4 w-4" /> Nova Classificação</Button>
          </div>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow><TableHead>Descrição</TableHead><TableHead>Situação</TableHead><TableHead>Padrão</TableHead><TableHead className="w-20">Ações</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {items.map(it => (
            <TableRow key={it.id}>
              <TableCell className="text-sm font-medium">{it.descricao}</TableCell>
              <TableCell><StatusBadge status={it.situacao} /></TableCell>
              <TableCell>{it.padrao ? <Badge variant="outline">Sim</Badge> : <span className="text-xs text-muted-foreground">Não</span>}</TableCell>
              <TableCell className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setItems(p => p.filter(x => x.id !== it.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ===================== MAIN =====================
export default function Condutor() {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><UserPlus className="h-5 w-5" /> Condutor</h2>
      <Tabs defaultValue="cadastrar">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cadastrar" className="text-xs">Cadastrar</TabsTrigger>
          <TabsTrigger value="consultar" className="text-xs">Consultar/Alterar</TabsTrigger>
          <TabsTrigger value="vincular" className="text-xs">Vincular</TabsTrigger>
          <TabsTrigger value="classificacao" className="text-xs">Classificação</TabsTrigger>
        </TabsList>
        <TabsContent value="cadastrar" className="mt-4"><TabCadastrar /></TabsContent>
        <TabsContent value="consultar" className="mt-4"><TabConsultar /></TabsContent>
        <TabsContent value="vincular" className="mt-4"><TabVincular /></TabsContent>
        <TabsContent value="classificacao" className="mt-4"><TabClassificacao /></TabsContent>
      </Tabs>
    </div>
  );
}
