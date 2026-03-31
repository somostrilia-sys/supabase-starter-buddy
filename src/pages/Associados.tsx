import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Search, Filter, Download, Plus, ChevronLeft, ChevronRight, Phone, Mail,
  MapPin, Car, CreditCard, User, MessageSquare, ExternalLink, Shield,
  ArrowRight, Check, Loader2, DatabaseZap,
} from "lucide-react";

const SGA_URL = "https://yrjiegtqfngdliwclpzo.supabase.co/functions/v1/gia-associado-buscar";
const SGA_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyamllZ3RxZm5nZGxpd2NscHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTY3MzMsImV4cCI6MjA5MDI5MjczM30.yZWSOqQwWhG_OcF-uNLvvy_ZwRYd2OC_Jjr5R_9Gucw";

interface SgaResult {
  nome?: string;
  cpf?: string;
  veiculo?: string;
  situacao?: string;
  valorFipe?: string | number;
  [key: string]: unknown;
}

const ufs = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const statusMap: Record<string, { label: string; class: string }> = {
  ativo: { label: "Ativo", class: "bg-emerald-500/15 text-emerald-400 border-0" },
  inativo: { label: "Inativo", class: "bg-muted text-muted-foreground border-0" },
  suspenso: { label: "Suspenso", class: "bg-warning/10 text-warning border-0" },
  cancelado: { label: "Cancelado", class: "bg-destructive/15 text-destructive border-0" },
};

const planos = ["Básico", "Intermediário", "Completo", "Premium"];

interface Associado {
  id: string; codigo: string; nome: string; cpf: string; rg: string; nascimento: string; sexo: string;
  estadoCivil: string; telefone: string; email: string; cidade: string; estado: string; cep: string;
  endereco: string; bairro: string; plano: string; status: string; dataAdesao: string; diaVencimento: number;
  veiculos: number; inadimplente: boolean;
}

function gerarCPF(i: number) {
  const n = String(11122233344 + i * 11111111).slice(0, 11);
  return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6,9)}-${n.slice(9,11)}`;
}

const nomes = [
  "Carlos Alberto Silva","Maria de Fátima Souza","José Roberto Santos","Ana Paula Oliveira","Francisco das Chagas Lima",
  "Antônia Maria Ferreira","João Batista Costa","Rita de Cássia Pereira","Pedro Henrique Almeida","Lúcia Helena Ribeiro",
  "Paulo César Cardoso","Sandra Regina Martins","Marcos Aurélio Dias","Rosângela Aparecida Nunes","Sebastião Carlos Barbosa",
  "Teresa Cristina Gomes","Raimundo Nonato Araújo","Cláudia Maria Teixeira","Antônio Carlos Monteiro","Márcia Regina Castro",
  "Luiz Fernando Correia","Sônia Maria Pinto","Fernando José Nascimento","Aparecida de Lourdes Mendes","Manoel Messias Rocha",
  "Eliane Cristina Moreira","Roberto Carlos Vieira","Adriana Silva Campos","Wellington da Silva Borges","Patrícia Andrade Lopes",
];

const cidades = [
  ["São Paulo","SP"],["Rio de Janeiro","RJ"],["Belo Horizonte","MG"],["Campinas","SP"],["Guarulhos","SP"],
  ["Niterói","RJ"],["Uberlândia","MG"],["Santos","SP"],["São Bernardo","SP"],["Juiz de Fora","MG"],
  ["Osasco","SP"],["Volta Redonda","RJ"],["Ribeirão Preto","SP"],["Petrópolis","RJ"],["Contagem","MG"],
  ["Sorocaba","SP"],["Duque de Caxias","RJ"],["Uberaba","MG"],["Jundiaí","SP"],["Nova Iguaçu","RJ"],
  ["Bauru","SP"],["Campos","RJ"],["Betim","MG"],["Piracicaba","SP"],["Macaé","RJ"],
  ["Franca","SP"],["Angra dos Reis","RJ"],["Governador Valadares","MG"],["Limeira","SP"],["Resende","RJ"],
];

const now = Date.now();
const day = 86400000;

const mockAssociados: Associado[] = nomes.map((nome, i) => ({
  id: `a${i}`, codigo: `ASS-${String(1000 + i).padStart(5, "0")}`, nome, cpf: gerarCPF(i),
  rg: `${30 + i}.${100+i}.${200+i}-${i}`, nascimento: `${1965 + (i % 35)}-${String((i%12)+1).padStart(2,"0")}-${String((i%28)+1).padStart(2,"0")}`,
  sexo: i % 3 === 0 ? "Feminino" : "Masculino", estadoCivil: ["Solteiro","Casado","Divorciado","Viúvo"][i%4],
  telefone: `(${11 + (i%21)}) 9${String(8000+i*37).slice(0,4)}-${String(1000+i*53).slice(0,4)}`,
  email: nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").split(" ").slice(0,2).join(".") + "@email.com",
  cidade: cidades[i][0], estado: cidades[i][1], cep: `${String(1000+i*10).slice(0,5)}-${String(100+i).slice(0,3)}`,
  endereco: `Rua ${["das Flores","dos Pinheiros","São José","XV de Novembro","Santos Dumont"][i%5]}, ${100+i*3}`,
  bairro: ["Centro","Jardim América","Vila Nova","Boa Vista","Santa Cruz"][i%5],
  plano: planos[i % 4], status: i < 20 ? "ativo" : i < 24 ? "inativo" : i < 27 ? "suspenso" : "cancelado",
  dataAdesao: new Date(now - (i * 30 + 10) * day).toISOString().slice(0, 10),
  diaVencimento: [5, 10, 15, 20, 25][i % 5], veiculos: (i % 3) + 1,
  inadimplente: i % 7 === 0,
}));

const pagamentos = [
  { ref: "Mar/2026", valor: 139.90, status: "pago", data: "05/03/2026" },
  { ref: "Fev/2026", valor: 139.90, status: "pago", data: "05/02/2026" },
  { ref: "Jan/2026", valor: 139.90, status: "pago", data: "07/01/2026" },
  { ref: "Dez/2025", valor: 139.90, status: "atrasado", data: "—" },
  { ref: "Nov/2025", valor: 139.90, status: "pago", data: "05/11/2025" },
  { ref: "Out/2025", valor: 139.90, status: "pago", data: "06/10/2025" },
];

export default function Associados() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("todos");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [selected, setSelected] = useState<Associado | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);

  // SGA search state
  const [sgaOpen, setSgaOpen] = useState(false);
  const [sgaTerm, setSgaTerm] = useState("");
  const [sgaLoading, setSgaLoading] = useState(false);
  const [sgaResult, setSgaResult] = useState<SgaResult | null>(null);
  const [sgaError, setSgaError] = useState<string | null>(null);

  async function handleSgaBuscar() {
    if (!sgaTerm.trim()) return;
    setSgaLoading(true);
    setSgaResult(null);
    setSgaError(null);
    try {
      const res = await fetch(SGA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SGA_ANON_KEY}`,
          "apikey": SGA_ANON_KEY,
        },
        body: JSON.stringify({ term: sgaTerm.trim() }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro ${res.status}: ${text}`);
      }
      const json = await res.json();
      setSgaResult(json);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setSgaError(msg);
      toast.error("Erro ao buscar no SGA: " + msg);
    } finally {
      setSgaLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let list = mockAssociados;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c => c.nome.toLowerCase().includes(s) || c.cpf.includes(s) || c.codigo.toLowerCase().includes(s));
    }
    if (tab === "ativos") list = list.filter(c => c.status === "ativo");
    if (tab === "inativos") list = list.filter(c => c.status !== "ativo");
    if (tab === "inadimplentes") list = list.filter(c => c.inadimplente);
    if (tab === "novos") list = list.filter(c => (now - new Date(c.dataAdesao).getTime()) < 30 * day);
    return list;
  }, [search, tab]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice(page * perPage, (page + 1) * perPage);

  const stepLabels = ["Dados Pessoais", "Contato", "Endereço", "Plano"];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Associados</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} associados · {mockAssociados.filter(a=>a.status==="ativo").length} ativos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> CSV</Button>

          {/* Buscar no SGA */}
          <Dialog open={sgaOpen} onOpenChange={o => { setSgaOpen(o); if (!o) { setSgaTerm(""); setSgaResult(null); setSgaError(null); } }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-sky-500/40 text-sky-400 hover:bg-sky-500/10">
                <DatabaseZap className="h-4 w-4 mr-1" /> Buscar no SGA
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><DatabaseZap className="h-4 w-4 text-sky-400" /> Buscar no SGA</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <p className="text-xs text-muted-foreground">Informe CPF, placa ou telefone para consultar no SGA.</p>
                <div className="flex gap-2">
                  <Input
                    className="h-9 text-xs flex-1"
                    placeholder="CPF, placa ou telefone..."
                    value={sgaTerm}
                    onChange={e => setSgaTerm(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSgaBuscar()}
                  />
                  <Button size="sm" onClick={handleSgaBuscar} disabled={sgaLoading || !sgaTerm.trim()}>
                    {sgaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                {sgaError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                    {sgaError}
                  </div>
                )}

                {sgaResult && !sgaError && (
                  <div className="p-3 rounded-lg border border-border/50 bg-card space-y-2">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Resultado SGA</p>
                    {sgaResult.nome && (
                      <div className="flex items-center gap-2 text-xs">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{String(sgaResult.nome)}</span>
                      </div>
                    )}
                    {sgaResult.cpf && (
                      <div className="flex items-center gap-2 text-xs">
                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-mono">{String(sgaResult.cpf)}</span>
                      </div>
                    )}
                    {sgaResult.veiculo && (
                      <div className="flex items-center gap-2 text-xs">
                        <Car className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{String(sgaResult.veiculo)}</span>
                      </div>
                    )}
                    {sgaResult.situacao && (
                      <div className="flex items-center gap-2 text-xs">
                        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                        <Badge className="text-[9px] bg-emerald-500/15 text-emerald-400 border-0">{String(sgaResult.situacao)}</Badge>
                      </div>
                    )}
                    {sgaResult.valorFipe != null && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">FIPE:</span>
                        <span className="font-mono text-emerald-400">
                          {typeof sgaResult.valorFipe === "number"
                            ? `R$ ${sgaResult.valorFipe.toLocaleString("pt-BR")}`
                            : String(sgaResult.valorFipe)}
                        </span>
                      </div>
                    )}
                    {/* fallback: show all keys if standard fields are missing */}
                    {!sgaResult.nome && !sgaResult.cpf && !sgaResult.veiculo && (
                      <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap break-all">
                        {JSON.stringify(sgaResult, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                {sgaLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-sky-400" />
                    <span className="ml-2 text-xs text-muted-foreground">Consultando SGA...</span>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={modalOpen} onOpenChange={o => { setModalOpen(o); if (!o) setStep(1); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Associado</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Novo Associado</DialogTitle></DialogHeader>
              <div className="flex items-center gap-2 mb-4">
                {stepLabels.map((l, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step > i + 1 ? "bg-emerald-500/20 text-emerald-400" : step === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {step > i + 1 ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <span className="text-[10px] hidden sm:inline text-muted-foreground">{l}</span>
                    {i < 3 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                  </div>
                ))}
              </div>
              {step === 1 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 col-span-2"><Label className="text-xs">Nome Completo *</Label><Input className="h-9 text-xs" placeholder="Nome completo" /></div>
                    <div className="space-y-1"><Label className="text-xs">CPF *</Label><Input className="h-9 text-xs" placeholder="000.000.000-00" /></div>
                    <div className="space-y-1"><Label className="text-xs">RG</Label><Input className="h-9 text-xs" placeholder="00.000.000-0" /></div>
                    <div className="space-y-1"><Label className="text-xs">Data Nascimento</Label><Input type="date" className="h-9 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-xs">Sexo</Label>
                      <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent><SelectItem value="M">Masculino</SelectItem><SelectItem value="F">Feminino</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label className="text-xs">Estado Civil</Label>
                      <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{["Solteiro","Casado","Divorciado","Viúvo"].map(e=><SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-xs">Celular *</Label><Input className="h-9 text-xs" placeholder="(11) 99999-9999" /></div>
                  <div className="space-y-1"><Label className="text-xs">Email</Label><Input className="h-9 text-xs" placeholder="email@exemplo.com" /></div>
                  <div className="space-y-1"><Label className="text-xs">Telefone Comercial</Label><Input className="h-9 text-xs" placeholder="(11) 3333-3333" /></div>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1"><Label className="text-xs">CEP</Label><Input className="h-9 text-xs" placeholder="00000-000" /></div>
                    <div className="space-y-1 col-span-2"><Label className="text-xs">Endereço</Label><Input className="h-9 text-xs" placeholder="Rua, número" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Bairro</Label><Input className="h-9 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-xs">Estado</Label>
                      <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="UF" /></SelectTrigger>
                        <SelectContent>{ufs.map(u=><SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label className="text-xs">Cidade</Label><Input className="h-9 text-xs" /></div>
                  </div>
                </div>
              )}
              {step === 4 && (
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-xs">Cooperativa</Label>
                    <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent><SelectItem value="sp">Cooperativa Central SP</SelectItem><SelectItem value="rj">Cooperativa Central RJ</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Regional</Label>
                    <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent><SelectItem value="capital">Capital</SelectItem><SelectItem value="interior">Interior</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Plano</Label>
                    <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{planos.map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Dia de Vencimento</Label>
                    <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{[5,10,15,20,25].map(d=><SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div className="flex justify-between mt-4">
                <Button variant="outline" disabled={step === 1} onClick={() => setStep(s => s - 1)}>Voltar</Button>
                {step < 4 ? (
                  <Button onClick={() => setStep(s => s + 1)}>Próximo <ArrowRight className="h-4 w-4 ml-1" /></Button>
                ) : (
                  <Button onClick={() => { setModalOpen(false); setStep(1); }}>Cadastrar Associado</Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={tab} onValueChange={v => { setTab(v); setPage(0); }}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="todos" className="text-xs">Todos ({mockAssociados.length})</TabsTrigger>
          <TabsTrigger value="ativos" className="text-xs">Ativos</TabsTrigger>
          <TabsTrigger value="inativos" className="text-xs">Inativos</TabsTrigger>
          <TabsTrigger value="inadimplentes" className="text-xs">Inadimplentes</TabsTrigger>
          <TabsTrigger value="novos" className="text-xs">Novos (30d)</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, CPF ou código..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild><Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button></SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1"><Label className="text-xs">Status</Label>
                <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>{Object.entries(statusMap).map(([k,v])=><SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Plano</Label>
                <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>{planos.map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Período Adesão</Label>
                <div className="grid grid-cols-2 gap-2"><Input type="date" className="text-xs h-9" /><Input type="date" className="text-xs h-9" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Inadimplente</Label>
                <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="sim">Sim</SelectItem><SelectItem value="nao">Não</SelectItem></SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => setFilterOpen(false)}>Aplicar</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="border border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/30">
                {["Código","Nome","CPF","Status","Telefone","Cidade/UF","Plano","Adesão","Venc.","Veíc."].map(h => (
                  <th key={h} className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {pageData.map(a => (
                  <tr key={a.id} className="border-b border-border/30 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setSelected(a)}>
                    <td className="p-3 text-xs font-mono text-primary">{a.codigo}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px] bg-primary/20 text-primary">{a.nome.split(" ").map(n=>n[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
                        <div>
                          <span className="text-xs font-medium">{a.nome}</span>
                          {a.inadimplente && <Badge className="ml-2 text-[8px] bg-destructive/15 text-destructive border-0">INADIMPLENTE</Badge>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-xs font-mono text-muted-foreground">{a.cpf}</td>
                    <td className="p-3"><Badge className={`text-[9px] ${statusMap[a.status].class}`}>{statusMap[a.status].label}</Badge></td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        {a.telefone}
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-400 cursor-pointer" />
                      </div>
                    </td>
                    <td className="p-3 text-xs">{a.cidade}/{a.estado}</td>
                    <td className="p-3"><Badge variant="outline" className="text-[9px]">{a.plano}</Badge></td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(a.dataAdesao).toLocaleDateString("pt-BR")}</td>
                    <td className="p-3 text-xs text-center">{a.diaVencimento}</td>
                    <td className="p-3"><Badge variant="secondary" className="text-[9px]">{a.veiculos}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Por página:</span>
          <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(0); }}>
            <SelectTrigger className="h-8 w-20 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{page*perPage+1}-{Math.min((page+1)*perPage, filtered.length)} de {filtered.length}</span>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(p=>p-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages-1} onClick={() => setPage(p=>p+1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <SheetContent className="w-[420px] overflow-y-auto">
          {selected && (
            <div className="space-y-4 mt-4">
              <div className="flex flex-col items-center text-center gap-2">
                <Avatar className="h-16 w-16"><AvatarFallback className="text-lg bg-primary text-primary-foreground">{selected.nome.split(" ").map(n=>n[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
                <h3 className="font-bold text-lg">{selected.nome}</h3>
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px] font-mono">{selected.codigo}</Badge>
                  <Badge className={`text-[10px] ${statusMap[selected.status].class}`}>{statusMap[selected.status].label}</Badge>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 flex items-center gap-1"><User className="h-3 w-3" /> Dados Pessoais</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">CPF:</span> <span className="font-mono">{selected.cpf}</span></div>
                  <div><span className="text-muted-foreground">RG:</span> {selected.rg}</div>
                  <div><span className="text-muted-foreground">Nascimento:</span> {new Date(selected.nascimento).toLocaleDateString("pt-BR")}</div>
                  <div><span className="text-muted-foreground">Sexo:</span> {selected.sexo}</div>
                  <div><span className="text-muted-foreground">Estado Civil:</span> {selected.estadoCivil}</div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Phone className="h-3 w-3" /> Contato</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{selected.telefone}<MessageSquare className="h-3.5 w-3.5 text-emerald-400 ml-auto cursor-pointer" /></div>
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{selected.email}</div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 flex items-center gap-1"><MapPin className="h-3 w-3" /> Endereço</p>
                <p className="text-xs">{selected.endereco} - {selected.bairro}</p>
                <p className="text-xs text-muted-foreground">{selected.cidade}/{selected.estado} - CEP {selected.cep}</p>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Shield className="h-3 w-3" /> Plano & Adesão</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Plano:</span> <Badge variant="outline" className="text-[9px]">{selected.plano}</Badge></div>
                  <div><span className="text-muted-foreground">Adesão:</span> {new Date(selected.dataAdesao).toLocaleDateString("pt-BR")}</div>
                  <div><span className="text-muted-foreground">Vencimento:</span> Dia {selected.diaVencimento}</div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Car className="h-3 w-3" /> Veículos ({selected.veiculos})</p>
                {Array.from({length: selected.veiculos}).map((_,i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-border/40 bg-card text-xs mb-1.5">
                    <div>
                      <p className="font-medium">{["Honda Civic 2024","VW Gol 2022","Fiat Argo 2023"][i%3]}</p>
                      <Badge variant="secondary" className="text-[8px] font-mono mt-0.5">{["ABC1D23","XYZ9K88","JKL4M56"][i%3]}</Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px]"><ExternalLink className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
              <Separator />
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 flex items-center gap-1"><CreditCard className="h-3 w-3" /> Últimos Pagamentos</p>
                <div className="space-y-1">
                  {pagamentos.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded">
                      <span>{p.ref}</span>
                      <span className="font-mono">R$ {p.valor.toFixed(2)}</span>
                      <Badge className={`text-[8px] border-0 ${p.status === "pago" ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"}`}>{p.status}</Badge>
                      <span className="text-muted-foreground">{p.data}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
