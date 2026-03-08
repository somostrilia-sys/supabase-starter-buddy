import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search, Filter, Download, MessageSquare, Phone, Mail, User,
  ChevronLeft, ChevronRight, ExternalLink, Plus, Calendar, MapPin, AlertTriangle,
} from "lucide-react";

const ufs = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

interface Contato {
  id: string; nome: string; cpf: string; telefone: string; email: string;
  cidade: string; estado: string; dataCadastro: string; ultimaInteracao: string;
  nascimento: string; negociacoes: number; sexo: string;
}

function gerarCPF(i: number) {
  const n = String(11122233344 + i * 11111111).slice(0, 11);
  return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6,9)}-${n.slice(9,11)}`;
}

const nomes = [
  "Ana Beatriz Silva","Bruno Costa","Camila Oliveira","Daniel Santos","Elisa Ferreira",
  "Fernando Almeida","Gabriela Lima","Henrique Souza","Isabela Rocha","João Pedro Nunes",
  "Karla Mendes","Leonardo Barbosa","Mariana Dias","Nicolas Ribeiro","Patrícia Cardoso",
  "Rafael Martins","Sabrina Pereira","Thiago Araújo","Vanessa Castro","William Gomes",
  "Yasmin Teixeira","Arthur Correia","Bianca Pinto","Caio Monteiro","Débora Nascimento",
];

const cidades = [
  ["São Paulo","SP"],["Rio de Janeiro","RJ"],["Belo Horizonte","MG"],["Campinas","SP"],
  ["Guarulhos","SP"],["Niterói","RJ"],["Uberlândia","MG"],["Santos","SP"],
  ["São Bernardo","SP"],["Juiz de Fora","MG"],["Osasco","SP"],["Volta Redonda","RJ"],
  ["Ribeirão Preto","SP"],["Petrópolis","RJ"],["Contagem","MG"],["Sorocaba","SP"],
  ["Duque de Caxias","RJ"],["Uberaba","MG"],["Jundiaí","SP"],["Nova Iguaçu","RJ"],
  ["Bauru","SP"],["Campos","RJ"],["Betim","MG"],["Piracicaba","SP"],["Macaé","RJ"],
];

const now = Date.now();
const day = 86400000;

const mockContatos: Contato[] = [
  // 2 contatos sem nome para simular o problema
  { id: "csn1", nome: "", cpf: "000.000.000-01", telefone: "(11) 90000-0001", email: "", cidade: "São Paulo", estado: "SP", dataCadastro: new Date(now - 2 * day).toISOString(), ultimaInteracao: new Date(now - day).toISOString(), nascimento: "1990-01-01", negociacoes: 1, sexo: "M" },
  { id: "csn2", nome: "", cpf: "000.000.000-02", telefone: "(11) 90000-0002", email: "", cidade: "Rio de Janeiro", estado: "RJ", dataCadastro: new Date(now - 3 * day).toISOString(), ultimaInteracao: new Date(now - 2 * day).toISOString(), nascimento: "1985-06-15", negociacoes: 0, sexo: "F" },
  ...nomes.map((nome, i) => ({
    id: `c${i}`,
    nome,
    cpf: gerarCPF(i),
    telefone: `(11) 9${String(8000 + i * 37).slice(0,4)}-${String(1000 + i * 53).slice(0,4)}`,
    email: nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").split(" ").slice(0,2).join(".") + "@email.com",
    cidade: cidades[i][0],
    estado: cidades[i][1],
    dataCadastro: new Date(now - (i * 5 + 1) * day).toISOString(),
    ultimaInteracao: new Date(now - (i * 3) * day).toISOString(),
    nascimento: `${1980 + (i % 20)}-${String(((new Date().getMonth() + 1) % 12) + 1).padStart(2,"0")}-${String((i % 28) + 1).padStart(2,"0")}`,
    negociacoes: i % 5 === 0 ? 0 : (i % 3) + 1,
    sexo: i % 2 === 0 ? "F" : "M",
  })),
];

function timeAgo(d: string) {
  const diff = now - new Date(d).getTime();
  const days = Math.floor(diff / day);
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `${days}d atrás`;
  return `${Math.floor(days / 30)}m atrás`;
}

export default function Contatos() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("todos");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [selected, setSelected] = useState<Contato | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const contatosSemNome = mockContatos.filter(c => !c.nome.trim()).length;

  const filtered = useMemo(() => {
    let list = mockContatos;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c =>
        c.nome.toLowerCase().includes(s) || c.cpf.includes(s) ||
        c.telefone.includes(s) || c.email.toLowerCase().includes(s)
      );
    }
    if (tab === "novos") list = list.filter(c => (now - new Date(c.dataCadastro).getTime()) < 7 * day);
    if (tab === "antigos") list = list.filter(c => (now - new Date(c.ultimaInteracao).getTime()) > 90 * day);
    if (tab === "sem-dados") list = list.filter(c => !c.email || !c.telefone);
    if (tab === "aniversariantes") list = list.filter(c => parseInt(c.nascimento.split("-")[1]) === currentMonth);
    if (tab === "sem-nome") list = list.filter(c => !c.nome.trim());
    return list;
  }, [search, tab, currentMonth]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice(page * perPage, (page + 1) * perPage);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contatos</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} contatos encontrados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Exportar CSV</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Contato</Button>
        </div>
      </div>

      {contatosSemNome > 0 && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => { setTab("sem-nome"); setPage(0); }}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span><strong>{contatosSemNome} contato{contatosSemNome > 1 ? "s" : ""} sem nome</strong> identificado{contatosSemNome > 1 ? "s" : ""}. Clique para revisar.</span>
        </div>
      )}

      <Tabs value={tab} onValueChange={v => { setTab(v); setPage(0); }}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="todos" className="text-xs">Todos</TabsTrigger>
          <TabsTrigger value="novos" className="text-xs">Novos (7d)</TabsTrigger>
          <TabsTrigger value="antigos" className="text-xs">Antigos (+90d)</TabsTrigger>
          <TabsTrigger value="sem-dados" className="text-xs">Sem Dados</TabsTrigger>
          <TabsTrigger value="aniversariantes" className="text-xs">🎂 Aniversariantes</TabsTrigger>
          {contatosSemNome > 0 && <TabsTrigger value="sem-nome" className="text-xs text-amber-700">⚠️ Sem Nome ({contatosSemNome})</TabsTrigger>}
        </TabsList>
      </Tabs>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, CPF, telefone ou email..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1"><Label className="text-xs">Período de Cadastro</Label>
                <div className="grid grid-cols-2 gap-2"><Input type="date" className="text-xs h-9" /><Input type="date" className="text-xs h-9" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Estado</Label>
                <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>{ufs.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Cidade</Label><Input className="h-9 text-xs" placeholder="Digite a cidade..." /></div>
              <div className="space-y-1"><Label className="text-xs">Tem negociação ativa?</Label>
                <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="sim">Sim</SelectItem><SelectItem value="nao">Não</SelectItem></SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => setFilterOpen(false)}>Aplicar Filtros</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="border border-border/50">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead><tr className="border-b bg-muted/30">
              <th className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase">Nome</th>
              <th className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase">CPF</th>
              <th className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase">Telefone</th>
              <th className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase">Email</th>
              <th className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase">Cidade/UF</th>
              <th className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase">Cadastro</th>
              <th className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase">Últ. Interação</th>
              <th className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase">Negoc.</th>
            </tr></thead>
            <tbody>
              {pageData.map(c => (
                <tr key={c.id} className="border-b border-border/30 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setSelected(c)}>
                   <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px] bg-primary/20 text-primary">{c.nome ? c.nome.split(" ").map(n=>n[0]).slice(0,2).join("") : "?"}</AvatarFallback></Avatar>
                      <span className={`font-medium text-xs ${!c.nome.trim() ? "italic text-amber-600" : ""}`}>{c.nome.trim() || "Contato sem nome"}</span>
                    </div>
                  </td>
                  <td className="p-3 text-xs font-mono text-muted-foreground">{c.cpf}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{c.telefone}</span>
                      <MessageSquare className="h-3.5 w-3.5 text-[#25D366] cursor-pointer" />
                    </div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{c.email}</td>
                  <td className="p-3 text-xs">{c.cidade}/{c.estado}</td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(c.dataCadastro).toLocaleDateString("pt-BR")}</td>
                  <td className="p-3 text-xs text-muted-foreground">{timeAgo(c.ultimaInteracao)}</td>
                  <td className="p-3"><Badge variant={c.negociacoes > 0 ? "default" : "secondary"} className="text-[10px]">{c.negociacoes}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Por página:</span>
          <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(0); }}>
            <SelectTrigger className="h-8 w-20 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{page * perPage + 1}-{Math.min((page+1)*perPage, filtered.length)} de {filtered.length}</span>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(p => p-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(p => p+1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <SheetContent className="w-96">
          {selected && (
            <div className="space-y-4 mt-4">
              <div className="flex flex-col items-center text-center gap-2">
                <Avatar className="h-16 w-16"><AvatarFallback className="text-lg bg-primary text-primary-foreground">{selected.nome.split(" ").map(n=>n[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
                <h3 className="font-bold text-lg">{selected.nome}</h3>
                <p className="text-xs text-muted-foreground">{selected.cpf}</p>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{selected.telefone}<MessageSquare className="h-4 w-4 text-[#25D366] ml-auto cursor-pointer" /></div>
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{selected.email}</div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{selected.cidade}/{selected.estado}</div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />Cadastro: {new Date(selected.dataCadastro).toLocaleDateString("pt-BR")}</div>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Negociações ({selected.negociacoes})</p>
                {selected.negociacoes > 0 ? (
                  Array.from({length: selected.negociacoes}).map((_,i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-border/40 bg-card text-xs">
                      <div>
                        <p className="font-medium">Proteção Veicular #{i+1}</p>
                        <Badge className="text-[9px] mt-0.5 bg-[#F59E0B]/20 text-[#F59E0B] border-0">Em andamento</Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px]"><ExternalLink className="h-3 w-3 mr-1" /> Ver</Button>
                    </div>
                  ))
                ) : <p className="text-xs text-muted-foreground">Nenhuma negociação</p>}
              </div>
              <Button className="w-full" size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Negociação</Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
