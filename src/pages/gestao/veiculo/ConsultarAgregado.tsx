import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Car, Plus, Search, Trash2, X, Save, ArrowLeft, Upload,
  DollarSign, FileText, Settings, Users, MapPin, Package,
  Printer, Clock, Eye, History, RefreshCw, LayoutGrid, FolderOpen,
} from "lucide-react";

const SelectWithAdd = ({ label, value, onValueChange, options, placeholder, required }: {
  label: string; value: string; onValueChange: (v: string) => void;
  options: string[]; placeholder?: string; required?: boolean;
}) => {
  const [items, setItems] = useState(options);
  const [adding, setAdding] = useState(false);
  const [newVal, setNewVal] = useState("");
  return (
    <div>
      <Label className="text-xs">{label}{required && " *"}</Label>
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

const ufs = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

const mockAgregados = [
  {
    id: "agr-1", placa: "DEF-4G56", chassi: "9BWZZZ377VT004251", renavam: "12345678901",
    modelo: "Onix Plus 1.0 Turbo", montadora: "Chevrolet", anoFab: "2024", anoMod: "2025",
    cor: "Prata", tipo: "Automóvel", categoria: "Passeio", cota: "Cota B", situacao: "Ativo",
    valorAgregado: "85000", participacao: "10", valorAdesao: "350,00", valorRepasse: "150,00",
    dataContrato: "2025-03-01", classificacao: "Agregado", idExterno: "AGR-2025-001",
    associadoNome: "Carlos Alberto Silva", associadoCpf: "111.222.333-00", associadoMatricula: "assoc-1",
    veiculoPrincipalPlaca: "ABC-1D23", veiculoPrincipalMarca: "Chevrolet", veiculoPrincipalModelo: "Tracker Premier 1.2T",
    regional: "Regional Capital", cooperativa: "Cooperativa São Paulo", voluntario: "João Voluntário",
    cobranca: "Boleto", cobrarRateio: true, cobrarTaxaAdm: false, vlrFixoBoleto: "25,00",
    credito: "0,00", pontos: "0",
    cep: "01001-000", logradouro: "Praça da Sé", numero: "100", complemento: "Sala 5",
    bairro: "Sé", cidade: "São Paulo", estado: "SP",
  },
  {
    id: "agr-2", placa: "GHI-7J89", chassi: "9BR53ZZZ1PT123456", renavam: "98765432101",
    modelo: "HB20 1.6 Comfort", montadora: "Hyundai", anoFab: "2023", anoMod: "2024",
    cor: "Branco", tipo: "Automóvel", categoria: "Passeio", cota: "Cota A", situacao: "Ativo",
    valorAgregado: "72000", participacao: "15", valorAdesao: "300,00", valorRepasse: "120,00",
    dataContrato: "2024-11-15", classificacao: "Agregado", idExterno: "AGR-2024-012",
    associadoNome: "Maria Aparecida Santos", associadoCpf: "222.333.444-11", associadoMatricula: "assoc-2",
    veiculoPrincipalPlaca: "JKL-2M34", veiculoPrincipalMarca: "Hyundai", veiculoPrincipalModelo: "Creta Ultimate 2.0",
    regional: "Regional Interior", cooperativa: "Cooperativa São Paulo", voluntario: "Maria Voluntária",
    cobranca: "Carnê", cobrarRateio: false, cobrarTaxaAdm: true, vlrFixoBoleto: "20,00",
    credito: "50,00", pontos: "5",
    cep: "13010-001", logradouro: "Rua Barão de Jaguara", numero: "450", complemento: "",
    bairro: "Centro", cidade: "Campinas", estado: "SP",
  },
  {
    id: "agr-3", placa: "MNO-5P67", chassi: "9BR53ZZZ1PT789012", renavam: "55566677701",
    modelo: "Argo Drive 1.3", montadora: "Fiat", anoFab: "2022", anoMod: "2023",
    cor: "Vermelho", tipo: "Automóvel", categoria: "Trabalho", cota: "Cota C", situacao: "Inativo",
    valorAgregado: "65000", participacao: "12", valorAdesao: "280,00", valorRepasse: "100,00",
    dataContrato: "2023-06-20", classificacao: "Substituto", idExterno: "AGR-2023-045",
    associadoNome: "José Roberto Oliveira", associadoCpf: "333.444.555-22", associadoMatricula: "assoc-3",
    veiculoPrincipalPlaca: "QRS-8T90", veiculoPrincipalMarca: "Fiat", veiculoPrincipalModelo: "Strada Freedom 1.3",
    regional: "Regional Metropolitana", cooperativa: "Cooperativa Rio", voluntario: "Pedro Auxiliar",
    cobranca: "Boleto", cobrarRateio: true, cobrarTaxaAdm: false, vlrFixoBoleto: "22,00",
    credito: "0,00", pontos: "3",
    cep: "20040-020", logradouro: "Av. Rio Branco", numero: "156", complemento: "Andar 8",
    bairro: "Centro", cidade: "Rio de Janeiro", estado: "RJ",
  },
];

const mockVistorias = [
  { id: "v1", data: "2025-01-15", tipo: "Admissão", resultado: "Aprovada", inspetor: "João Ferreira", obs: "Veículo em ótimo estado." },
  { id: "v2", data: "2025-06-10", tipo: "Periódica", resultado: "Aprovada", inspetor: "André Costa", obs: "Sem irregularidades." },
  { id: "v3", data: "2024-08-22", tipo: "Transferência", resultado: "Pendente", inspetor: "Luciana Almeida", obs: "Aguardando documentação complementar." },
];

const mockObservacoes = [
  { data: "2025-03-01 14:30", descricao: "Agregado cadastrado no sistema", usuario: "admin@gia.com" },
  { data: "2025-03-05 09:15", descricao: "Documentação CRLV anexada", usuario: "operador@gia.com" },
  { data: "2025-03-10 11:00", descricao: "Vistoria de adesão agendada", usuario: "vistoriador@gia.com" },
  { data: "2025-03-15 16:45", descricao: "Vistoria realizada e aprovada", usuario: "vistoriador@gia.com" },
  { data: "2025-03-20 08:30", descricao: "Primeira cobrança emitida", usuario: "financeiro@gia.com" },
];

const mockFinanceiro = [
  { ref: "03/2025", venc: "15/03/2025", valor: "350,00", desconto: "0,00", juros: "0,00", total: "350,00", situacao: "Pago" },
  { ref: "04/2025", venc: "15/04/2025", valor: "45,00", desconto: "0,00", juros: "0,00", total: "45,00", situacao: "Pago" },
  { ref: "05/2025", venc: "15/05/2025", valor: "45,00", desconto: "5,00", juros: "0,00", total: "40,00", situacao: "Pago" },
  { ref: "06/2025", venc: "15/06/2025", valor: "45,00", desconto: "0,00", juros: "0,00", total: "45,00", situacao: "Pendente" },
  { ref: "07/2025", venc: "15/07/2025", valor: "45,00", desconto: "0,00", juros: "0,00", total: "45,00", situacao: "Pendente" },
  { ref: "08/2025", venc: "15/08/2025", valor: "45,00", desconto: "0,00", juros: "2,50", total: "47,50", situacao: "Atrasado" },
  { ref: "09/2025", venc: "15/09/2025", valor: "45,00", desconto: "0,00", juros: "0,00", total: "45,00", situacao: "Pendente" },
  { ref: "10/2025", venc: "15/10/2025", valor: "45,00", desconto: "0,00", juros: "0,00", total: "45,00", situacao: "Pendente" },
];

const produtosRegional = [
  { id: "1", nome: "Proteção Roubo/Furto", grupo: "Proteção" },
  { id: "2", nome: "Proteção Colisão", grupo: "Proteção" },
  { id: "3", nome: "Assistência 24h", grupo: "Assistência" },
  { id: "4", nome: "Guincho 200km", grupo: "Assistência" },
  { id: "5", nome: "Vidros", grupo: "Proteção" },
];

const statusColor = (s: string) => {
  switch (s) {
    case "Ativo": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "Inativo": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "Pendente": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "Pago": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "Atrasado": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "Aprovada": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "Reprovada": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default: return "bg-muted text-muted-foreground";
  }
};

export default function ConsultarAgregado() {
  const [searchPlaca, setSearchPlaca] = useState("");
  const [selected, setSelected] = useState<typeof mockAgregados[0] | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [novaObs, setNovaObs] = useState("");
  const [observacoes, setObservacoes] = useState(mockObservacoes);
  const [produtosVinculados, setProdutosVinculados] = useState([
    { nome: "Proteção Roubo/Furto", valor: "45,00" },
    { nome: "Assistência 24h", valor: "30,00" },
  ]);
  const [selectedProdutos, setSelectedProdutos] = useState(["1", "3"]);
  const [documentos, setDocumentos] = useState([
    { nome: "crlv_agregado.pdf", tipo: "CRLV", data: "01/03/2025" },
    { nome: "vistoria_adesao.jpg", tipo: "Vistoria de Adesão", data: "15/03/2025" },
  ]);

  const buscar = () => {
    const found = mockAgregados.find(a => a.placa.toLowerCase().replace("-", "").includes(searchPlaca.toLowerCase().replace("-", "")));
    if (found) { setSelected(found); setForm({ ...found }); toast.success("Agregado encontrado!"); }
    else toast.error("Agregado não encontrado.");
  };

  const set = (f: string, v: any) => setForm((p: any) => ({ ...p, [f]: v }));
  const totalProdutos = produtosVinculados.reduce((s, p) => s + parseFloat(p.valor.replace(",", ".") || "0"), 0);

  const salvar = () => { toast.success("Alterações salvas com sucesso!"); };

  const addObs = () => {
    if (!novaObs.trim()) return;
    setObservacoes(o => [{ data: new Date().toLocaleString("pt-BR"), descricao: novaObs, usuario: "admin@gia.com" }, ...o]);
    setNovaObs("");
    toast.success("Observação adicionada!");
  };

  if (!selected) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-lg font-bold flex items-center gap-2"><Search className="h-5 w-5" /> Consultar / Alterar Agregado</h2>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-xs">Placa do Agregado</Label>
                <Input value={searchPlaca} onChange={e => setSearchPlaca(e.target.value)} placeholder="DEF-4G56" onKeyDown={e => e.key === "Enter" && buscar()} />
              </div>
              <div className="flex items-end">
                <Button onClick={buscar} className="gap-1"><Search className="h-4 w-4" /> Pesquisar</Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Agregados disponíveis para teste:</p>
              {mockAgregados.map(a => (
                <button key={a.id} className="block hover:text-primary transition-colors" onClick={() => { setSearchPlaca(a.placa); }}>
                  • {a.placa} — {a.modelo} ({a.associadoNome})
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2"><Car className="h-5 w-5" /> Editar Agregado — {selected.placa}</h2>
        <Button variant="outline" size="sm" onClick={() => setSelected(null)} className="gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Voltar à busca</Button>
      </div>

      <Accordion type="multiple" defaultValue={["dados-assoc", "dados-agreg", "financeiro-info", "produtos"]} className="space-y-2">
        {/* Dados Associado/Veículo */}
        <AccordionItem value="dados-assoc" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Dados do Associado / Veículo Principal</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <Card className="border-primary/20">
              <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs">Associado</span><p className="font-medium">{selected.associadoNome}</p></div>
                <div><span className="text-muted-foreground text-xs">CPF</span><p className="font-medium">{selected.associadoCpf}</p></div>
                <div><span className="text-muted-foreground text-xs">Matrícula</span><p className="font-medium">{selected.associadoMatricula}</p></div>
                <div><span className="text-muted-foreground text-xs">Veíc. Principal</span><p className="font-medium font-mono">{selected.veiculoPrincipalPlaca}</p></div>
                <div><span className="text-muted-foreground text-xs">Marca</span><p className="font-medium">{selected.veiculoPrincipalMarca}</p></div>
                <div><span className="text-muted-foreground text-xs">Modelo</span><p className="font-medium">{selected.veiculoPrincipalModelo}</p></div>
                <div><span className="text-muted-foreground text-xs">Regional</span><p className="font-medium">{selected.regional}</p></div>
                <div><span className="text-muted-foreground text-xs">Cooperativa</span><p className="font-medium">{selected.cooperativa}</p></div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Cooperativa/Voluntário */}
        <AccordionItem value="coop-vol" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Cooperativa / Voluntário</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectWithAdd label="Cooperativa" value={form.cooperativa || ""} onValueChange={v => set("cooperativa", v)} options={["Cooperativa São Paulo", "Cooperativa Rio", "Cooperativa Minas", "Cooperativa Sul"]} />
              <SelectWithAdd label="Voluntário" value={form.voluntario || ""} onValueChange={v => set("voluntario", v)} options={["João Voluntário", "Maria Voluntária", "Pedro Auxiliar"]} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Dados do Agregado */}
        <AccordionItem value="dados-agreg" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Car className="h-4 w-4 text-primary" /> Dados do Agregado</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SelectWithAdd label="Classificação" value={form.classificacao || ""} onValueChange={v => set("classificacao", v)} options={["Agregado", "Substituto", "Reserva"]} />
              <div><Label className="text-xs">Id Externo</Label><Input value={form.idExterno || ""} onChange={e => set("idExterno", e.target.value)} /></div>
              <div><Label className="text-xs">Data/Hora</Label><Input value={new Date().toLocaleString("pt-BR")} disabled className="bg-muted" /></div>
              <div>
                <Label className="text-xs">Situação</Label>
                <Select value={form.situacao || ""} onValueChange={v => set("situacao", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem><SelectItem value="Pendente">Pendente</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Data Contrato</Label><Input type="date" value={form.dataContrato || ""} onChange={e => set("dataContrato", e.target.value)} /></div>
              <div><Label className="text-xs">Modelo</Label><Input value={form.modelo || ""} onChange={e => set("modelo", e.target.value)} /></div>
              <SelectWithAdd label="Montadora" value={form.montadora || ""} onValueChange={v => set("montadora", v)} options={["Chevrolet", "Fiat", "Volkswagen", "Ford", "Hyundai", "Toyota", "Honda"]} />
              <div>
                <Label className="text-xs">Ano Fab</Label>
                <Select value={form.anoFab || ""} onValueChange={v => set("anoFab", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Array.from({ length: 10 }, (_, i) => String(2025 - i)).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Ano Modelo</Label>
                <Select value={form.anoMod || ""} onValueChange={v => set("anoMod", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Array.from({ length: 10 }, (_, i) => String(2026 - i)).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Placa</Label><Input value={form.placa || ""} onChange={e => set("placa", e.target.value.toUpperCase())} /></div>
              <div><Label className="text-xs">Valor Agregado (R$)</Label><Input value={form.valorAgregado || ""} onChange={e => set("valorAgregado", e.target.value)} /></div>
              <SelectWithAdd label="Cor" value={form.cor || ""} onValueChange={v => set("cor", v)} options={["Branco", "Prata", "Preto", "Cinza", "Vermelho", "Azul"]} />
              <SelectWithAdd label="Cota" value={form.cota || ""} onValueChange={v => set("cota", v)} options={["Cota A", "Cota B", "Cota C", "Cota D"]} />
              <div><Label className="text-xs">Chassi</Label><Input value={form.chassi || ""} onChange={e => set("chassi", e.target.value.toUpperCase())} maxLength={17} /></div>
              <div><Label className="text-xs">Renavam</Label><Input value={form.renavam || ""} onChange={e => set("renavam", e.target.value)} /></div>
              <div><Label className="text-xs">Participação (%)</Label><Input value={form.participacao || ""} onChange={e => set("participacao", e.target.value)} /></div>
              <div><Label className="text-xs">Valor Adesão (R$)</Label><Input value={form.valorAdesao || ""} onChange={e => set("valorAdesao", e.target.value)} /></div>
              <div><Label className="text-xs">Valor Repasse (R$)</Label><Input value={form.valorRepasse || ""} onChange={e => set("valorRepasse", e.target.value)} /></div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Dados Adicionais */}
        <AccordionItem value="dados-adic" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> Dados Adicionais Veículo</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <p className="text-sm text-muted-foreground italic">Campos adicionais — Em breve</p>
          </AccordionContent>
        </AccordionItem>

        {/* Informações Financeiras */}
        <AccordionItem value="financeiro-info" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Informações Financeiras</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Cobrança</Label>
                <Select value={form.cobranca || ""} onValueChange={v => set("cobranca", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Boleto">Boleto</SelectItem><SelectItem value="Carnê">Carnê</SelectItem><SelectItem value="Débito Automático">Débito Automático</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-5"><Switch checked={form.cobrarRateio || false} onCheckedChange={v => set("cobrarRateio", v)} /><Label className="text-xs">Cobrar Rateio</Label></div>
              <div className="flex items-center gap-3 pt-5"><Switch checked={form.cobrarTaxaAdm || false} onCheckedChange={v => set("cobrarTaxaAdm", v)} /><Label className="text-xs">Cobrar Taxa Adm.</Label></div>
              <div><Label className="text-xs">Vlr. Fixo Boleto (R$)</Label><Input value={form.vlrFixoBoleto || ""} onChange={e => set("vlrFixoBoleto", e.target.value)} /></div>
              <div><Label className="text-xs">Crédito (R$)</Label><Input value={form.credito || ""} onChange={e => set("credito", e.target.value)} /></div>
              <div><Label className="text-xs">Pontos</Label><Input value={form.pontos || ""} onChange={e => set("pontos", e.target.value)} /></div>
              <div>
                <Label className="text-xs">Mês Referente</Label>
                <Select onValueChange={() => {}}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Mês Final Carnê</Label>
                <Select onValueChange={() => {}}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Endereço Correspondência */}
        <AccordionItem value="endereco" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Endereço de Correspondência</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex gap-1 items-end">
                <div className="flex-1"><Label className="text-xs">CEP</Label><Input value={form.cep || ""} onChange={e => set("cep", e.target.value)} placeholder="00000-000" /></div>
                <Button variant="outline" size="sm" className="h-10" onClick={() => toast.info("CEP consultado!")}><Search className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="md:col-span-2"><Label className="text-xs">Logradouro</Label><Input value={form.logradouro || ""} onChange={e => set("logradouro", e.target.value)} /></div>
              <div><Label className="text-xs">Nº</Label><Input value={form.numero || ""} onChange={e => set("numero", e.target.value)} /></div>
              <div><Label className="text-xs">Complemento</Label><Input value={form.complemento || ""} onChange={e => set("complemento", e.target.value)} /></div>
              <div><Label className="text-xs">Bairro</Label><Input value={form.bairro || ""} onChange={e => set("bairro", e.target.value)} /></div>
              <div><Label className="text-xs">Cidade</Label><Input value={form.cidade || ""} onChange={e => set("cidade", e.target.value)} /></div>
              <div>
                <Label className="text-xs">Estado</Label>
                <Select value={form.estado || ""} onValueChange={v => set("estado", v)}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>{ufs.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Produtos Agregado */}
        <AccordionItem value="produtos" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Produtos Agregado</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <div>
              <p className="text-xs font-medium mb-2">Produtos da Regional</p>
              <Table>
                <TableHeader><TableRow><TableHead className="w-10"></TableHead><TableHead>Produto</TableHead><TableHead>Grupo</TableHead></TableRow></TableHeader>
                <TableBody>
                  {produtosRegional.map(p => (
                    <TableRow key={p.id}>
                      <TableCell><Checkbox checked={selectedProdutos.includes(p.id)} onCheckedChange={() => {
                        if (selectedProdutos.includes(p.id)) {
                          setSelectedProdutos(s => s.filter(x => x !== p.id));
                          setProdutosVinculados(pv => pv.filter(x => x.nome !== p.nome));
                        } else {
                          setSelectedProdutos(s => [...s, p.id]);
                          setProdutosVinculados(pv => [...pv, { nome: p.nome, valor: "45,00" }]);
                        }
                      }} /></TableCell>
                      <TableCell className="text-sm">{p.nome}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{p.grupo}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {produtosVinculados.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2">Produtos Vinculados</p>
                <Table>
                  <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Valor (R$)</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {produtosVinculados.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{p.nome}</TableCell>
                        <TableCell><Input value={p.valor} onChange={e => { const nv = [...produtosVinculados]; nv[i].valor = e.target.value; setProdutosVinculados(nv); }} className="h-8 w-24 text-xs" /></TableCell>
                        <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setProdutosVinculados(pv => pv.filter((_, j) => j !== i)); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                      </TableRow>
                    ))}
                    <TableRow><TableCell className="font-semibold text-sm">TOTAL</TableCell><TableCell className="font-semibold text-sm">R$ {totalProdutos.toFixed(2).replace(".", ",")}</TableCell><TableCell></TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Produto Adicional */}
        <AccordionItem value="prod-adic" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Produto Adicional</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><Label className="text-xs">Descrição</Label><Input placeholder="Descrição do produto" /></div>
              <div><Label className="text-xs">Valor (R$)</Label><Input placeholder="0,00" /></div>
              <div>
                <Label className="text-xs">Período</Label>
                <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="Mensal">Mensal</SelectItem><SelectItem value="Anual">Anual</SelectItem><SelectItem value="Único">Único</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Classificação</Label>
                <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="Adicional">Adicional</SelectItem><SelectItem value="Opcional">Opcional</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Implemento */}
        <AccordionItem value="implemento" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> Implemento</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <Textarea placeholder="Descreva os implementos..." rows={3} />
          </AccordionContent>
        </AccordionItem>

        {/* Histórico Vistorias */}
        <AccordionItem value="vistorias" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Histórico de Vistorias</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              {mockVistorias.map((v, i) => (
                <div key={v.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${v.resultado === "Aprovada" ? "bg-emerald-500" : v.resultado === "Reprovada" ? "bg-red-500" : "bg-amber-500"}`} />
                    {i < mockVistorias.length - 1 && <div className="w-px h-full bg-border" />}
                  </div>
                  <Card className="flex-1 mb-0">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{v.tipo}</span>
                        <Badge className={statusColor(v.resultado)}>{v.resultado}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{v.data} • Inspetor: {v.inspetor}</p>
                      <p className="text-xs mt-1">{v.obs}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Fotos/Documentos */}
        <AccordionItem value="docs" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Fotos / Documentos</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label className="text-xs">Tipo Imagem</Label>
                <Input value="Vistoria de Adesão" disabled className="bg-muted" />
              </div>
              <Button variant="outline" size="sm" className="gap-1"><Upload className="h-3.5 w-3.5" /> Upload</Button>
            </div>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => {
              setDocumentos(d => [...d, { nome: `foto_${d.length + 1}.jpg`, tipo: "Vistoria de Adesão", data: new Date().toLocaleDateString("pt-BR") }]);
              toast.success("Arquivo adicionado!");
            }}>
              <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Clique ou arraste arquivos</p>
            </div>
            {documentos.length > 0 && (
              <div className="space-y-1">
                {documentos.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded border text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="flex-1">{d.nome}</span>
                    <Badge variant="outline" className="text-xs">{d.tipo}</Badge>
                    <span className="text-xs text-muted-foreground">{d.data}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDocumentos(docs => docs.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Regional */}
        <AccordionItem value="regional" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Regional</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <Input value={selected.regional} disabled className="bg-muted w-64" />
          </AccordionContent>
        </AccordionItem>

        {/* Observações */}
        <AccordionItem value="observacoes" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><History className="h-4 w-4 text-primary" /> Observações Finais</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-3">
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Usuário</TableHead></TableRow></TableHeader>
              <TableBody>
                {observacoes.map((o, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs whitespace-nowrap">{o.data}</TableCell>
                    <TableCell className="text-sm">{o.descricao}</TableCell>
                    <TableCell className="text-xs">{o.usuario}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex gap-2">
              <Textarea value={novaObs} onChange={e => setNovaObs(e.target.value)} placeholder="Nova observação..." rows={2} className="flex-1" />
              <Button onClick={addObs} className="self-end gap-1"><Plus className="h-4 w-4" /> Adicionar</Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Opções Financeiro */}
        <AccordionItem value="opcoes-fin" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> Opções Financeiro</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">Ordenação</Button>
              <Button variant="outline" size="sm">Agrupar</Button>
              <Button variant="outline" size="sm">Sinc. Mensagem</Button>
              <Button variant="outline" size="sm"><LayoutGrid className="h-3.5 w-3.5 mr-1" /> Layout</Button>
              <Button variant="outline" size="sm"><FolderOpen className="h-3.5 w-3.5 mr-1" /> Abrir Carnê em Lote</Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Financeiro */}
        <AccordionItem value="financeiro" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Financeiro</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referência</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Juros</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="w-10">Man.</TableHead>
                    <TableHead className="w-10">Hist.</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockFinanceiro.map((f, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{f.ref}</TableCell>
                      <TableCell className="text-sm">{f.venc}</TableCell>
                      <TableCell className="text-sm">R$ {f.valor}</TableCell>
                      <TableCell className="text-sm">R$ {f.desconto}</TableCell>
                      <TableCell className="text-sm">R$ {f.juros}</TableCell>
                      <TableCell className="text-sm font-medium">R$ {f.total}</TableCell>
                      <TableCell><Badge className={statusColor(f.situacao)}>{f.situacao}</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Settings className="h-3.5 w-3.5" /></Button></TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Clock className="h-3.5 w-3.5" /></Button></TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Printer className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Footer */}
      <div className="sticky bottom-0 bg-background border-t py-3 flex justify-end gap-3 -mx-6 px-6">
        <Button variant="outline" onClick={() => setSelected(null)} className="gap-1"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
        <Button onClick={salvar} className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"><Save className="h-4 w-4" /> Salvar</Button>
      </div>
    </div>
  );
}
