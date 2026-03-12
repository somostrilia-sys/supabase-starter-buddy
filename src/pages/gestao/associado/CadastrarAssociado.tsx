import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  User, MapPin, Phone, Mail, KeyRound, Landmark,
  FileText, Car, DollarSign, Gauge, Package, Radio, ClipboardCheck,
  Upload, Shield, CreditCard, Plus, Search, Trash2, Copy, X, Eraser,
} from "lucide-react";

const ufs = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

const maskCpfCnpj = (v: string) => {
  const d = v.replace(/\D/g, "");
  if (d.length <= 11) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
    return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`;
  }
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12,14)}`;
};

const maskCep = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0,5)}-${d.slice(5)}`;
};

const maskTelFixo = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
};

const maskCel = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
};

const maskPlaca = (v: string) => {
  const u = v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  if (u.length <= 3) return u;
  if (u.length <= 7) return `${u.slice(0,3)}-${u.slice(3)}`;
  return u;
};

const calcIdade = (dn: string) => {
  if (!dn) return "";
  const h = new Date();
  const n = new Date(dn);
  let a = h.getFullYear() - n.getFullYear();
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) a--;
  return `${a} anos`;
};

const now = () => {
  const d = new Date();
  return `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
};

interface Implemento { item: string; descricao: string; valor: string; }
interface Documento { nome: string; tipo: string; data: string; }

const SITUACOES = [
  { value: "Pendente", db: "pendente" },
  { value: "Pendente de Revistoria", db: "pendente_revistoria" },
  { value: "Ativo", db: "ativo" },
  { value: "Inativo", db: "inativo" },
  { value: "Inativo com Pendência", db: "inativo_pendencia" },
] as const;

const initialForm = {
  idExterno: "", situacao: "Ativo", classificacao: "", nome: "", dataHora: now(),
  dataContrato: "", dataValidade: "", dataNasc: "", sexo: "", cpfCnpj: "", rg: "",
  dataExpRg: "", orgaoExp: "", profissao: "", cnh: "", categoriaCnh: "",
  dataVencCnh: "", data1aHab: "",
  cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
  telResidencial: "", telComercial: "", celular: "", celularAux: "",
  operadora: "", operadoraAux: "",
  email: "", emailAux: "", contato: "",
  acessoArea: "", login: "", senha: "", regional: "", cooperativa: "",
  consultorResp: "", indicacao: "", nomeIndicacao: "",
  banco: "", agencia: "", contaCorrente: "", diaVencimento: "", isencao: "",
  observacoes: "",
  motivoInativacao: "",
  placa: "", chassi: "", renavam: "", codigoFipe: "", tipoVeiculo: "",
  marca: "", modelo: "", anoFab: "", anoModelo: "", cor: "",
  combustivel: "", portas: "", cambio: "", potencia: "", cilindradas: "",
  valorFipe: "", valorDeclarado: "", valorMensalidade: "", valorAdesao: "",
  valorCota: "", valorRastreador: "",
  tipoUtilizacao: "", kmMedio: "", pernoite: "", cepPernoite: "",
  blindado: "", kitGas: "", adaptadoPcd: "",
  rastreadorObrig: false, empresaRastreadora: "", tipoRastreador: "",
  statusRastreador: "Pendente",
  tipoVistoria: "", statusVistoria: "Agendada", obsVistoria: "",
  planoSelecionado: "",
  formaPagamento: "",
};

const mockPreenchido1 = {
  ...initialForm,
  idExterno: "EXT-00142",
  nome: "Carlos Alberto Silva",
  dataNasc: "1985-03-15",
  sexo: "M",
  cpfCnpj: "342.876.541-09",
  rg: "28.456.789-3",
  dataExpRg: "2015-06-20",
  orgaoExp: "SSP/SP",
  profissao: "Engenheiro",
  cnh: "04512367890",
  categoriaCnh: "B",
  dataVencCnh: "2028-03-15",
  data1aHab: "2003-08-10",
  cep: "01310-100",
  logradouro: "Av. Paulista",
  numero: "1578",
  complemento: "Apto 42",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  estado: "SP",
  celular: "(11) 99845-3210",
  telResidencial: "(11) 3254-8790",
  email: "carlos.silva@email.com",
  regional: "Regional Capital",
  cooperativa: "Cooperativa São Paulo",
  consultorResp: "Ana Beatriz",
  banco: "Bradesco",
  agencia: "1234",
  contaCorrente: "56789-0",
  diaVencimento: "10",
  placa: "BRA-2E19",
  chassi: "9BWZZZ377VT004251",
  renavam: "01234567890",
  codigoFipe: "004399-0",
  tipoVeiculo: "Automovel",
  marca: "Volkswagen",
  modelo: "T-Cross 200 TSI",
  anoFab: "2023",
  anoModelo: "2024",
  cor: "Branco",
  combustivel: "Flex",
  portas: "4",
  cambio: "Automatico",
  valorFipe: "119.500,00",
  valorDeclarado: "115.000,00",
  valorMensalidade: "189,90",
  valorAdesao: "350,00",
  valorCota: "2.500,00",
  tipoUtilizacao: "Passeio",
  kmMedio: "1200",
  pernoite: "Garagem",
  planoSelecionado: "Completo",
  formaPagamento: "Boleto",
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
      <Label>{label}</Label>
      <div className="flex gap-1">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="flex-1"><SelectValue placeholder={placeholder || "Selecione"} /></SelectTrigger>
          <SelectContent>
            {items.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {adding && (
        <div className="flex gap-1 mt-1">
          <Input value={newVal} onChange={e => setNewVal(e.target.value)} placeholder="Novo valor" className="h-8 text-xs" />
          <Button size="sm" className="h-8 text-xs" onClick={() => {
            if (newVal.trim()) { setItems(p => [...p, newVal.trim()]); onValueChange(newVal.trim()); }
            setAdding(false); setNewVal("");
          }}>OK</Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setAdding(false); setNewVal(""); }}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

const coberturasMock = [
  { cobertura: "Roubo / Furto", limite: "100% FIPE", franquia: "Sem franquia" },
  { cobertura: "Colisão", limite: "100% FIPE", franquia: "R$ 2.500,00" },
  { cobertura: "Incêndio", limite: "100% FIPE", franquia: "Sem franquia" },
  { cobertura: "Fenômenos Naturais", limite: "70% FIPE", franquia: "R$ 1.500,00" },
  { cobertura: "Terceiros", limite: "R$ 50.000,00", franquia: "R$ 1.000,00" },
];

export default function CadastrarAssociado() {
  const [form, setForm] = useState(initialForm);
  const [implementos, setImplementos] = useState<Implemento[]>([
    { item: "Som Automotivo", descricao: "Pioneer AVH-Z9290TV", valor: "2.800,00" },
    { item: "Rodas Liga Leve", descricao: "Aro 18 TSW", valor: "4.200,00" },
    { item: "Película", descricao: "Insulfilm G20 completo", valor: "650,00" },
  ]);
  const [documentos, setDocumentos] = useState<Documento[]>([
    { nome: "CNH_Carlos_Silva.pdf", tipo: "CNH", data: "05/03/2026" },
    { nome: "CRLV_BRA2E19.pdf", tipo: "CRLV", data: "05/03/2026" },
  ]);

  const set = (f: string, v: string | boolean) => setForm(p => ({ ...p, [f]: v }));

  const buscarCep = () => {
    if (form.cep.replace(/\D/g, "").length !== 8) return toast.error("CEP inválido");
    set("logradouro", "Av. Paulista");
    set("bairro", "Bela Vista");
    set("cidade", "São Paulo");
    set("estado", "SP");
    toast.success("Endereço encontrado!");
  };

  const consultarPlaca = () => {
    if (!form.placa) return toast.error("Informe a placa");
    set("marca", "Volkswagen"); set("modelo", "T-Cross 200 TSI");
    set("anoFab", "2023"); set("anoModelo", "2024"); set("cor", "Branco");
    set("combustivel", "Flex"); set("valorFipe", "119.500,00");
    toast.success("Veículo encontrado!");
  };

  const decodificarVin = () => {
    if (form.chassi.length !== 17) return toast.error("Chassi deve ter 17 caracteres");
    toast.success("VIN decodificado com sucesso!");
  };

  const buscarFipe = () => {
    set("valorFipe", "119.500,00");
    toast.success("Valor FIPE atualizado!");
  };

  const [saving, setSaving] = useState(false);

  const needsMotivo = form.situacao === "Inativo" || form.situacao === "Inativo com Pendência";

  const handleSalvar = async () => {
    if (!form.nome.trim()) return toast.error("Nome é obrigatório");
    if (!form.cpfCnpj.trim()) return toast.error("CPF/CNPJ é obrigatório");
    if (!form.dataNasc) return toast.error("Data de nascimento é obrigatória");
    if (needsMotivo && !form.motivoInativacao.trim()) return toast.error("Motivo da inativação é obrigatório");

    const cpfLimpo = form.cpfCnpj.replace(/\D/g, "");
    setSaving(true);

    try {
      const { data: existing } = await supabase
        .from("associados")
        .select("id")
        .eq("cpf", cpfLimpo)
        .maybeSingle();

      if (existing) {
        toast.error("CPF já cadastrado!", { description: "Já existe um associado com este CPF no sistema." });
        setSaving(false);
        return;
      }

      const statusMap = SITUACOES.find(s => s.value === form.situacao);
      const dbStatus = statusMap?.db || "pendente";

      const obsLines = [form.observacoes];
      if (needsMotivo && form.motivoInativacao) {
        obsLines.push(`Motivo da inativação: ${form.motivoInativacao}`);
      }

      const { error } = await supabase.from("associados").insert({
        nome: form.nome.trim(),
        cpf: cpfLimpo,
        rg: form.rg || null,
        data_nascimento: form.dataNasc || null,
        cep: form.cep?.replace(/\D/g, "") || null,
        endereco: [form.logradouro, form.numero, form.complemento, form.bairro].filter(Boolean).join(", ") || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        telefone: form.celular || form.telResidencial || null,
        email: form.email || null,
        observacoes: obsLines.filter(Boolean).join("\n") || null,
        status: dbStatus as any,
        data_adesao: form.dataContrato || new Date().toISOString().split("T")[0],
      });

      if (error) throw error;

      toast.success("Associado cadastrado com sucesso!", { description: `${form.nome} - ${form.cpfCnpj}` });
      handleLimpar();
    } catch (err: any) {
      console.error("Erro ao salvar associado:", err);
      toast.error("Erro ao salvar", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleLimpar = () => { setForm({ ...initialForm, dataHora: now() }); toast.info("Formulário limpo"); };
  const carregarMock = () => { setForm(mockPreenchido1); toast.info("Dados de exemplo carregados"); };

  const addImplemento = () => setImplementos(p => [...p, { item: "", descricao: "", valor: "" }]);
  const removeImplemento = (i: number) => setImplementos(p => p.filter((_, idx) => idx !== i));
  const setImpl = (i: number, f: keyof Implemento, v: string) =>
    setImplementos(p => p.map((it, idx) => idx === i ? { ...it, [f]: v } : it));

  const removeDoc = (i: number) => setDocumentos(p => p.filter((_, idx) => idx !== i));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold">Cadastrar Novo Associado / Veículo</h2>
          <p className="text-sm text-muted-foreground">Preencha todas as seções necessárias</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={carregarMock} className="gap-1.5 text-xs">
            <Copy className="h-3.5 w-3.5" /> Carregar Exemplo
          </Button>
          <Button variant="outline" size="sm" onClick={handleLimpar} className="gap-1.5 text-xs">
            <Eraser className="h-3.5 w-3.5" /> Limpar Formulário
          </Button>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={["dados-associado", "endereco", "veiculo"]} className="space-y-3">

        {/* SEÇÃO 1 - Dados do Associado */}
        <AccordionItem value="dados-associado" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
            <div className="flex items-center gap-2"><User className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">1. Dados do Associado</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div><Label>Id Externo</Label><Input value={form.idExterno} onChange={e => set("idExterno", e.target.value)} placeholder="Ex: EXT-00142" /></div>
              <div>
                <Label>Situação *</Label>
                <Select value={form.situacao} onValueChange={v => { set("situacao", v); if (v !== "Inativo" && v !== "Inativo com Pendência") set("motivoInativacao", ""); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {SITUACOES.map(s => <SelectItem key={s.value} value={s.value}>{s.value}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <SelectWithAdd label="Classificação" value={form.classificacao} onValueChange={v => set("classificacao", v)} options={["Pessoa Física", "Pessoa Jurídica", "Isento"]} />
              {needsMotivo && (
                <div className="lg:col-span-3">
                  <Label>Motivo da Inativação *</Label>
                  <Textarea value={form.motivoInativacao} onChange={e => set("motivoInativacao", e.target.value)} rows={2} placeholder="Informe o motivo da inativação do associado..." />
                </div>
              )}
              <div className="lg:col-span-2"><Label>Nome *</Label><Input value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Nome completo" /></div>
              <div><Label>Data/Hora</Label><Input value={form.dataHora} readOnly className="bg-muted/50" /></div>
              <div><Label>Data Contrato</Label><Input type="date" value={form.dataContrato} onChange={e => set("dataContrato", e.target.value)} /></div>
              <div><Label>Data Validade</Label><Input type="date" value={form.dataValidade} onChange={e => set("dataValidade", e.target.value)} /></div>
              <div>
                <Label>Data Nasc * {form.dataNasc && <span className="text-xs text-muted-foreground ml-1">({calcIdade(form.dataNasc)})</span>}</Label>
                <Input type="date" value={form.dataNasc} onChange={e => set("dataNasc", e.target.value)} />
              </div>
              <div>
                <Label>Sexo</Label>
                <Select value={form.sexo} onValueChange={v => set("sexo", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="M">Masculino</SelectItem><SelectItem value="F">Feminino</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>CPF/CNPJ *</Label><Input value={form.cpfCnpj} onChange={e => set("cpfCnpj", maskCpfCnpj(e.target.value))} placeholder="000.000.000-00" /></div>
              <div><Label>RG</Label><Input value={form.rg} onChange={e => set("rg", e.target.value)} /></div>
              <div><Label>Data Exp. RG</Label><Input type="date" value={form.dataExpRg} onChange={e => set("dataExpRg", e.target.value)} /></div>
              <div><Label>Órgão Exp.</Label><Input value={form.orgaoExp} onChange={e => set("orgaoExp", e.target.value)} placeholder="SSP/UF" /></div>
              <SelectWithAdd label="Profissão" value={form.profissao} onValueChange={v => set("profissao", v)} options={["Engenheiro", "Médico", "Advogado", "Professor", "Comerciante", "Autônomo", "Funcionário Público"]} />
              <div><Label>CNH</Label><Input value={form.cnh} onChange={e => set("cnh", e.target.value)} placeholder="Número da CNH" /></div>
              <div>
                <Label>Categoria CNH</Label>
                <Select value={form.categoriaCnh} onValueChange={v => set("categoriaCnh", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{["A","B","C","D","E","AB","AC","AD","AE"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Data Venc. CNH</Label><Input type="date" value={form.dataVencCnh} onChange={e => set("dataVencCnh", e.target.value)} /></div>
              <div><Label>Data 1ª Habilitação</Label><Input type="date" value={form.data1aHab} onChange={e => set("data1aHab", e.target.value)} /></div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 2 - Endereço */}
        <AccordionItem value="endereco" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">2. Endereço</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div>
                <Label>CEP</Label>
                <div className="flex gap-1">
                  <Input value={form.cep} onChange={e => set("cep", maskCep(e.target.value))} placeholder="00000-000" />
                  <Button type="button" variant="outline" size="sm" onClick={buscarCep}>Buscar</Button>
                </div>
              </div>
              <div className="lg:col-span-2"><Label>Logradouro *</Label><Input value={form.logradouro} onChange={e => set("logradouro", e.target.value)} placeholder="Rua, Avenida..." /></div>
              <div><Label>Nº *</Label><Input value={form.numero} onChange={e => set("numero", e.target.value)} /></div>
              <div><Label>Complemento</Label><Input value={form.complemento} onChange={e => set("complemento", e.target.value)} /></div>
              <div><Label>Bairro *</Label><Input value={form.bairro} onChange={e => set("bairro", e.target.value)} /></div>
              <div><Label>Cidade *</Label><Input value={form.cidade} onChange={e => set("cidade", e.target.value)} /></div>
              <div>
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={v => set("estado", v)}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>{ufs.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 3 - Telefones (sem campos de rádio) */}
        <AccordionItem value="telefones" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">3. Telefones</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div><Label>Tel. Residencial</Label><Input value={form.telResidencial} onChange={e => set("telResidencial", maskTelFixo(e.target.value))} placeholder="(XX) XXXX-XXXX" /></div>
              <div><Label>Tel. Comercial</Label><Input value={form.telComercial} onChange={e => set("telComercial", maskTelFixo(e.target.value))} placeholder="(XX) XXXX-XXXX" /></div>
              <div><Label>Celular *</Label><Input value={form.celular} onChange={e => set("celular", maskCel(e.target.value))} placeholder="(XX) 9XXXX-XXXX" /></div>
              <div><Label>Celular Aux</Label><Input value={form.celularAux} onChange={e => set("celularAux", maskCel(e.target.value))} placeholder="(XX) 9XXXX-XXXX" /></div>
              <SelectWithAdd label="Operadora" value={form.operadora} onValueChange={v => set("operadora", v)} options={["Vivo","Claro","Tim","Oi"]} />
              <SelectWithAdd label="Operadora Aux" value={form.operadoraAux} onValueChange={v => set("operadoraAux", v)} options={["Vivo","Claro","Tim","Oi"]} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 4 - Emails e Contatos */}
        <AccordionItem value="emails" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">4. Emails e Contatos</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
              <div><Label>Email Aux</Label><Input type="email" value={form.emailAux} onChange={e => set("emailAux", e.target.value)} /></div>
              <div><Label>Contato</Label><Input value={form.contato} onChange={e => set("contato", e.target.value)} placeholder="Nome da pessoa de contato" /></div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 5 - Acesso e Categorização */}
        <AccordionItem value="acesso" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
            <div className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">5. Acesso e Categorização</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div>
                <Label>Acesso Área do Associado</Label>
                <Select value={form.acessoArea} onValueChange={v => set("acessoArea", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="Sim">Sim</SelectItem><SelectItem value="Nao">Não</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Login</Label><Input value={form.login} onChange={e => set("login", e.target.value)} /></div>
              <div><Label>Senha</Label><Input type="password" value={form.senha} onChange={e => set("senha", e.target.value)} /></div>
              <SelectWithAdd label="Regional" value={form.regional} onValueChange={v => set("regional", v)} options={["Regional Capital","Regional Interior","Regional Litoral","Regional Metropolitana"]} />
              <SelectWithAdd label="Cooperativa" value={form.cooperativa} onValueChange={v => set("cooperativa", v)} options={["Cooperativa São Paulo","Cooperativa Rio","Cooperativa Minas","Cooperativa Sul"]} />
              <div>
                <Label>Consultor Responsável</Label>
                <Select value={form.consultorResp} onValueChange={v => set("consultorResp", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{["Ana Beatriz","Ricardo Souza","Camila Oliveira","Pedro Lima"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Indicação</Label>
                <Select value={form.indicacao} onValueChange={v => set("indicacao", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="Sim">Sim</SelectItem><SelectItem value="Nao">Não</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Nome Indicação</Label><Input value={form.nomeIndicacao} onChange={e => set("nomeIndicacao", e.target.value)} /></div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 6 - Informações Financeiras */}
        <AccordionItem value="financeiras" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
            <div className="flex items-center gap-2"><Landmark className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">6. Informações Financeiras</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <SelectWithAdd label="Banco" value={form.banco} onValueChange={v => set("banco", v)} options={["Bradesco","Itaú","Banco do Brasil","Caixa","Santander","Nubank","Inter"]} />
              <div><Label>Agência</Label><Input value={form.agencia} onChange={e => set("agencia", e.target.value)} /></div>
              <div><Label>Conta Corrente</Label><Input value={form.contaCorrente} onChange={e => set("contaCorrente", e.target.value)} /></div>
              <div>
                <Label>Dia Vencimento</Label>
                <Select value={form.diaVencimento} onValueChange={v => set("diaVencimento", v)}>
                  <SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger>
                  <SelectContent>{Array.from({ length: 31 }, (_, i) => i + 1).map(d => <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Isenção</Label>
                <Select value={form.isencao} onValueChange={v => set("isencao", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="Sim">Sim</SelectItem><SelectItem value="Nao">Não</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 7 - Dados Complementares */}
        <AccordionItem value="complementares" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
            <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">7. Dados Complementares</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="pt-2">
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={e => set("observacoes", e.target.value)} rows={4} placeholder="Observações gerais sobre o associado..." />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 8 - Dados do Veículo (sem Proprietário e Condutor) */}
        <AccordionItem value="veiculo" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
            <div className="flex items-center gap-2"><Car className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">8. Dados do Veículo</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div>
                <Label>Placa *</Label>
                <div className="flex gap-1">
                  <Input value={form.placa} onChange={e => set("placa", maskPlaca(e.target.value))} placeholder="ABC-1234" />
                  <Button type="button" variant="outline" size="sm" onClick={consultarPlaca}><Search className="h-3.5 w-3.5 mr-1" />Consultar</Button>
                </div>
              </div>
              <div>
                <Label>Chassi</Label>
                <div className="flex gap-1">
                  <Input value={form.chassi} onChange={e => set("chassi", e.target.value.toUpperCase().slice(0, 17))} placeholder="17 caracteres" maxLength={17} />
                  <Button type="button" variant="outline" size="sm" onClick={decodificarVin}>VIN</Button>
                </div>
              </div>
              <div><Label>Renavam</Label><Input value={form.renavam} onChange={e => set("renavam", e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="11 dígitos" /></div>
              <div>
                <Label>Código FIPE</Label>
                <div className="flex gap-1">
                  <Input value={form.codigoFipe} onChange={e => set("codigoFipe", e.target.value)} placeholder="000000-0" />
                  <Button type="button" variant="outline" size="sm" onClick={buscarFipe}>FIPE</Button>
                </div>
              </div>
              <div>
                <Label>Tipo Veículo</Label>
                <Select value={form.tipoVeiculo} onValueChange={v => set("tipoVeiculo", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{["Automóvel","Motocicleta","Caminhão","Van","Ônibus"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Marca</Label>
                <Select value={form.marca} onValueChange={v => set("marca", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{["Chevrolet","Fiat","Ford","Honda","Hyundai","Jeep","Nissan","Renault","Toyota","Volkswagen"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Modelo</Label>
                <Select value={form.modelo} onValueChange={v => set("modelo", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{["Onix","HB20","Civic","Corolla","T-Cross 200 TSI","Compass","Tracker","Creta","Kicks","Argo","Polo"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ano Fabricação</Label>
                <Select value={form.anoFab} onValueChange={v => set("anoFab", v)}>
                  <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                  <SelectContent>{Array.from({ length: 15 }, (_, i) => String(2025 - i)).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ano Modelo</Label>
                <Select value={form.anoModelo} onValueChange={v => set("anoModelo", v)}>
                  <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                  <SelectContent>{Array.from({ length: 15 }, (_, i) => String(2026 - i)).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <SelectWithAdd label="Cor" value={form.cor} onValueChange={v => set("cor", v)} options={["Branco","Prata","Preto","Cinza","Vermelho","Azul","Marrom"]} />
              <div>
                <Label>Combustível</Label>
                <Select value={form.combustivel} onValueChange={v => set("combustivel", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{["Flex","Gasolina","Etanol","Diesel","Elétrico","Híbrido"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Portas</Label>
                <Select value={form.portas} onValueChange={v => set("portas", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="2">2</SelectItem><SelectItem value="4">4</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Câmbio</Label>
                <Select value={form.cambio} onValueChange={v => set("cambio", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{["Manual","Automático","CVT"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Potência</Label><Input value={form.potencia} onChange={e => set("potencia", e.target.value)} placeholder="Ex: 116cv" /></div>
              <div><Label>Cilindradas</Label><Input value={form.cilindradas} onChange={e => set("cilindradas", e.target.value)} placeholder="Ex: 999cc" /></div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 9 - Valores do Veículo */}
        <AccordionItem value="valores-veiculo" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
            <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">9. Valores do Veículo</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div><Label>Valor FIPE (R$)</Label><Input value={form.valorFipe} readOnly className="bg-muted/50" placeholder="Auto via integração" /></div>
              <div><Label>Valor Declarado (R$)</Label><Input value={form.valorDeclarado} onChange={e => set("valorDeclarado", e.target.value)} placeholder="0,00" /></div>
              <div><Label>Valor Mensalidade (R$)</Label><Input value={form.valorMensalidade} onChange={e => set("valorMensalidade", e.target.value)} placeholder="0,00" /></div>
              <div><Label>Valor Adesão (R$)</Label><Input value={form.valorAdesao} onChange={e => set("valorAdesao", e.target.value)} placeholder="0,00" /></div>
              <div><Label>Valor Cota Participação (R$)</Label><Input value={form.valorCota} onChange={e => set("valorCota", e.target.value)} placeholder="0,00" /></div>
              <div><Label>Valor Rastreador (R$)</Label><Input value={form.valorRastreador} onChange={e => set("valorRastreador", e.target.value)} placeholder="0,00" /></div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 10 - Utilização */}
        <AccordionItem value="utilizacao" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
            <div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">10. Utilização</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div>
                <Label>Tipo de Utilização</Label>
                <Select value={form.tipoUtilizacao} onValueChange={v => set("tipoUtilizacao", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Uber">Uber</SelectItem>
                    <SelectItem value="Taxi">Táxi</SelectItem>
                    <SelectItem value="Passeio">Passeio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>KM Médio Mensal</Label><Input type="number" value={form.kmMedio} onChange={e => set("kmMedio", e.target.value)} placeholder="Ex: 1200" /></div>
              <div>
                <Label>Pernoite</Label>
                <Select value={form.pernoite} onValueChange={v => set("pernoite", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{["Garagem","Rua","Estacionamento"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>CEP Pernoite</Label><Input value={form.cepPernoite} onChange={e => set("cepPernoite", maskCep(e.target.value))} placeholder="00000-000" /></div>
              <div>
                <Label>Blindado</Label>
                <Select value={form.blindado} onValueChange={v => set("blindado", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="Sim">Sim</SelectItem><SelectItem value="Nao">Não</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kit Gás</Label>
                <Select value={form.kitGas} onValueChange={v => set("kitGas", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="Sim">Sim</SelectItem><SelectItem value="Nao">Não</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Adaptado PCD</Label>
                <Select value={form.adaptadoPcd} onValueChange={v => set("adaptadoPcd", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="Sim">Sim</SelectItem><SelectItem value="Nao">Não</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 11 - Implementos / Acessórios */}
        <AccordionItem value="implementos" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
            <div className="flex items-center gap-2"><Package className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">11. Implementos / Acessórios</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor (R$)</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {implementos.map((imp, i) => (
                  <TableRow key={i}>
                    <TableCell><Input value={imp.item} onChange={e => setImpl(i, "item", e.target.value)} className="h-8 text-xs" /></TableCell>
                    <TableCell><Input value={imp.descricao} onChange={e => setImpl(i, "descricao", e.target.value)} className="h-8 text-xs" /></TableCell>
                    <TableCell><Input value={imp.valor} onChange={e => setImpl(i, "valor", e.target.value)} className="h-8 text-xs" /></TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeImplemento(i)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button variant="outline" size="sm" onClick={addImplemento} className="mt-2 gap-1.5"><Plus className="h-3.5 w-3.5" />Adicionar Implemento</Button>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 12 - Rastreador */}
        <AccordionItem value="rastreador" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
            <div className="flex items-center gap-2"><Radio className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">12. Rastreador</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-3">
                <Switch checked={form.rastreadorObrig as boolean} onCheckedChange={v => set("rastreadorObrig", v)} />
                <Label>Rastreador Obrigatório</Label>
              </div>
              <SelectWithAdd label="Empresa Rastreadora" value={form.empresaRastreadora} onValueChange={v => set("empresaRastreadora", v)} options={["Empresa Própria","LoJack","Ituran","Tracker","Volpato","Positron"]} />
              <div>
                <Label>Tipo Rastreador</Label>
                <Select value={form.tipoRastreador} onValueChange={v => set("tipoRastreador", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{["GPS","OBD","Portátil","Hardwired"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.statusRastreador} onValueChange={v => set("statusRastreador", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Instalado">Instalado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 13 - Vistoria */}
        <AccordionItem value="vistoria" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
            <div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">13. Vistoria</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div>
                <Label>Tipo Vistoria</Label>
                <Select value={form.tipoVistoria} onValueChange={v => set("tipoVistoria", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="App">App</SelectItem>
                    <SelectItem value="Presencial">Presencial</SelectItem>
                    <SelectItem value="Dispensada">Dispensada</SelectItem>
                    <SelectItem value="Link">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status Vistoria</Label>
                <div className="pt-1">
                  <Badge variant={
                    form.statusVistoria === "Aprovada" ? "default" :
                    form.statusVistoria === "Reprovada" ? "destructive" : "secondary"
                  }>{form.statusVistoria}</Badge>
                </div>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <Label>Observações Vistoria</Label>
                <Textarea value={form.obsVistoria} onChange={e => set("obsVistoria", e.target.value)} rows={2} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 14 - Documentos */}
        <AccordionItem value="documentos" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
            <div className="flex items-center gap-2"><Upload className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">14. Documentos</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <div className="border-2 border-dashed rounded-lg p-6 text-center mb-4 hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Arraste arquivos aqui ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground mt-1">CNH, CRLV, Comprovante de Residência, Fotos do Veículo</p>
            </div>
            {documentos.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentos.map((doc, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">{doc.nome}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{doc.tipo}</Badge></TableCell>
                      <TableCell className="text-xs">{doc.data}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeDoc(i)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 15 - Coberturas e Plano */}
        <AccordionItem value="coberturas" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
            <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">15. Coberturas e Plano</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <div className="max-w-xs mb-4">
              <Label>Plano</Label>
              <Select value={form.planoSelecionado} onValueChange={v => set("planoSelecionado", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
                <SelectContent>{["Básico","Intermediário","Completo","Premium","Executivo"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {form.planoSelecionado && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cobertura</TableHead>
                    <TableHead>Limite</TableHead>
                    <TableHead>Franquia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coberturasMock.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">{c.cobertura}</TableCell>
                      <TableCell className="text-sm">{c.limite}</TableCell>
                      <TableCell className="text-sm">{c.franquia}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* SEÇÃO 16 - Forma de Pagamento */}
        <AccordionItem value="pagamento" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
            <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">16. Forma de Pagamento</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <Label>Tipo</Label>
                <Select value={form.formaPagamento} onValueChange={v => set("formaPagamento", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{["Boleto","Cartão","Débito Automático","PIX"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {form.formaPagamento === "Cartão" && (
                <>
                  <div><Label>Número do Cartão</Label><Input placeholder="0000 0000 0000 0000" /></div>
                  <div><Label>Validade</Label><Input placeholder="MM/AA" /></div>
                  <div><Label>Nome no Cartão</Label><Input placeholder="Como impresso no cartão" /></div>
                </>
              )}
              {form.formaPagamento === "Débito Automático" && (
                <>
                  <div><Label>Banco</Label><Input placeholder="Banco para débito" /></div>
                  <div><Label>Agência</Label><Input placeholder="Agência" /></div>
                  <div><Label>Conta</Label><Input placeholder="Conta corrente" /></div>
                </>
              )}
              {form.formaPagamento === "PIX" && (
                <div><Label>Chave PIX</Label><Input placeholder="CPF, email, telefone ou chave aleatória" /></div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>

      {/* Rodapé fixo */}
      <div className="sticky bottom-0 bg-background border-t py-4 mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={handleLimpar}>Cancelar</Button>
        <Button onClick={handleSalvar} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {saving ? "Salvando..." : "Salvar Cadastro"}
        </Button>
      </div>
    </div>
  );
}
