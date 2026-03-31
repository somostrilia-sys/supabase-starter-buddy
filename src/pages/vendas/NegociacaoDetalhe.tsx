import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, Car, DollarSign, User, Phone, Mail, MapPin, Calendar,
  Clock, MessageSquare, CheckCircle2, XCircle, AlertCircle, MoreVertical,
  Edit, Trash2, Printer, Send, Copy, ExternalLink, Upload, FileText,
  Image, Camera, Eye, Plus, Check, PenLine, Paperclip,
} from "lucide-react";

// ──────────── Mock Data ────────────

const mockDeal = {
  id: "m6",
  codigo: "NEG-2026-0042",
  titulo: "Honda Civic 2024",
  contato: {
    nome: "João Silva",
    cpf: "123.456.789-00",
    rg: "12.345.678-9",
    cnh: "04512345678",
    nascimento: "1990-05-15",
    sexo: "Masculino",
    celular: "(11) 99999-8888",
    celular2: "(11) 98888-7777",
    telResidencial: "(11) 3333-4444",
    telComercial: "(11) 4444-5555",
    email: "joao.silva@email.com",
    cep: "01310-100",
    endereco: "Av. Paulista",
    numero: "1000",
    complemento: "Apto 501",
    bairro: "Bela Vista",
    estado: "SP",
    cidade: "São Paulo",
  },
  veiculo: {
    tipo: "Automóvel",
    placa: "ABC1D23",
    chassi: "9BWZZZ377VT004251",
    renavam: "01234567890",
    marca: "Honda",
    modelo: "Civic EXL",
    anoFab: 2024,
    anoMod: 2024,
    codigoFipe: "014009-0",
    valorFipe: 125000,
    valorProtegido: 118750,
    depreciacao: 5,
    diaVencimento: 10,
    cor: "Prata",
    cambio: "Automático",
    combustivel: "Flex",
    km: 12500,
    motor: "2.0 VTEC",
    estadoCirculacao: "SP",
    cidadeCirculacao: "São Paulo",
    veiculoTrabalho: false,
  },
  stage: "qualificacao",
  status: "aberto",
  valor: 2450,
  origem: "WhatsApp",
  responsavel: "Maria Santos",
  afiliado: { nome: "Carlos Afiliado", comissao: 245 },
  cooperativa: "Cooperativa Central SP",
  tags: [
    { id: "t1", nome: "Prioritário", cor: "#EF4444" },
    { id: "t2", nome: "Renovação", cor: "#3B82F6" },
  ],
  etapasContratacao: { concluidas: 4, total: 7 },
  createdAt: "2026-02-28T14:30:00Z",
  updatedAt: "2026-03-04T09:15:00Z",
};

const mockActivities = [
  { id: "a1", tipo: "Ligar", descricao: "Ligação para apresentar planos de proteção. Cliente demonstrou interesse no plano Premium.", responsavel: "Maria Santos", data: "2026-03-04T09:00:00Z", status: "concluida" },
  { id: "a2", tipo: "WhatsApp", descricao: "Enviado PDF com tabela de preços e coberturas.", responsavel: "Maria Santos", data: "2026-03-03T16:30:00Z", status: "concluida" },
  { id: "a3", tipo: "Email", descricao: "Enviar proposta formal por e-mail com condições especiais.", responsavel: "João Pedro", data: "2026-03-05T10:00:00Z", status: "pendente" },
  { id: "a4", tipo: "Reunião", descricao: "Reunião presencial para fechar contrato. Levar documentação.", responsavel: "Maria Santos", data: "2026-03-02T14:00:00Z", status: "concluida" },
  { id: "a5", tipo: "Visita", descricao: "Visita para vistoria do veículo no endereço do cliente.", responsavel: "Ana Costa", data: "2026-03-01T09:00:00Z", status: "atrasada" },
];

const mockNotes = [
  { id: "n1", texto: "Cliente prefere contato por WhatsApp após 18h.", data: "2026-03-03T18:00:00Z", autor: "Maria Santos" },
  { id: "n2", texto: "Possibilidade de indicar mais 2 amigos para proteção.", data: "2026-03-02T10:00:00Z", autor: "João Pedro" },
];

const mockPropostas = [
  { id: "p1", codigo: "PROP-2026-0089", titulo: "Proteção Premium Honda Civic", status: "Enviada", valor: 189.90, adesao: 350, plano: "Premium", coberturas: ["Roubo/Furto", "Colisão", "Incêndio", "Alagamento", "Guincho 24h", "Carro Reserva 7 dias"], criadaEm: "2026-03-03T14:00:00Z" },
  { id: "p2", codigo: "PROP-2026-0088", titulo: "Proteção Básica Honda Civic", status: "Recusada", valor: 129.90, adesao: 200, plano: "Básico", coberturas: ["Roubo/Furto", "Colisão", "Guincho 24h"], criadaEm: "2026-03-01T10:00:00Z" },
];

const mockVistoria = {
  codigo: "VIST-2026-0033",
  status: "Agendada",
  inspetor: "Carlos Vistoriador",
  tipo: "Presencial",
  dataAgendada: "2026-03-06T09:00:00Z",
  local: "Av. Paulista, 1000 - São Paulo/SP",
  link: "https://vistoria.gia.com.br/v/abc123",
  historico: [
    { data: "2026-03-04T09:00:00Z", descricao: "Vistoria agendada" },
    { data: "2026-03-03T15:00:00Z", descricao: "Link de vistoria gerado" },
  ],
  acessorios: { estepe: true, macaco: true, triangulo: true, chaveRoda: true, extintor: false, tapetes: true },
};

const stageConfig: Record<string, { label: string; color: string; bg: string }> = {
  prospeccao: { label: "Prospecção", color: "#3B82F6", bg: "bg-[#3B82F6]/20" },
  qualificacao: { label: "Qualificação", color: "#F59E0B", bg: "bg-[#F59E0B]/20" },
  proposta: { label: "Proposta", color: "#8B5CF6", bg: "bg-[#8B5CF6]/20" },
  negociacao: { label: "Negociação", color: "#F97316", bg: "bg-[#F97316]/20" },
  fechamento: { label: "Fechamento", color: "#22C55E", bg: "bg-[#22C55E]/20" },
};

const origemOptions = ["Site", "Facebook", "Instagram", "Indicação", "WhatsApp", "Telefone"];
const ufs = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString("pt-BR"); }
function fmtDateTime(d: string) { return new Date(d).toLocaleString("pt-BR"); }

export default function NegociacaoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stage, setStage] = useState(mockDeal.stage);
  const [origem, setOrigem] = useState(mockDeal.origem);
  const [responsavel, setResponsavel] = useState(mockDeal.responsavel);
  const deal = mockDeal;

  const sc = stageConfig[stage];

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/vendas/pipeline")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">{deal.codigo}</span>
              <Badge style={{ backgroundColor: sc.color }} className="text-[10px] text-white border-0">
                {sc.label}
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight mt-0.5">
              {deal.contato.nome} · {deal.titulo}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Car className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{deal.veiculo.placa}</span>
              <span className="text-muted-foreground">·</span>
              <DollarSign className="h-3.5 w-3.5 text-[#22C55E]" />
              <span className="text-sm font-bold text-[#22C55E]">{fmt(deal.valor)}/mês</span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4 mr-1" /> Ações
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem><Edit className="h-4 w-4 mr-2" /> Editar</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Excluir</DropdownMenuItem>
            <DropdownMenuItem><Printer className="h-4 w-4 mr-2" /> Imprimir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* MAIN LAYOUT: Tabs + Sidebar */}
      <div className="flex gap-4">
        {/* LEFT: Tabs */}
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="atividades" className="w-full">
            <TabsList className="w-full justify-start gap-0.5">
              <TabsTrigger value="atividades" className="text-xs gap-1"><MessageSquare className="h-3.5 w-3.5" /> Atividades</TabsTrigger>
              <TabsTrigger value="contato" className="text-xs gap-1"><User className="h-3.5 w-3.5" /> Contato</TabsTrigger>
              <TabsTrigger value="cotacoes" className="text-xs gap-1"><DollarSign className="h-3.5 w-3.5" /> Cotações</TabsTrigger>
              <TabsTrigger value="vistoria" className="text-xs gap-1"><Camera className="h-3.5 w-3.5" /> Vistoria</TabsTrigger>
              <TabsTrigger value="proposta" className="text-xs gap-1"><FileText className="h-3.5 w-3.5" /> Proposta</TabsTrigger>
              <TabsTrigger value="assinatura" className="text-xs gap-1"><PenLine className="h-3.5 w-3.5" /> Assinatura</TabsTrigger>
            </TabsList>

            {/* ──── ABA 1: ATIVIDADES ──── */}
            <TabsContent value="atividades" className="space-y-4 mt-4">
              <Card className="border border-border/50">
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Nova Atividade</p>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Tipo</Label>
                      <Select defaultValue="Ligar">
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Ligar","Email","WhatsApp","Reunião","Visita"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Data/Hora</Label>
                      <Input type="datetime-local" className="h-9 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Responsável</Label>
                      <Select defaultValue="Maria Santos">
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Maria Santos","João Pedro","Ana Costa"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button size="sm" className="w-full h-9"><Plus className="h-3.5 w-3.5 mr-1" /> Salvar</Button>
                    </div>
                  </div>
                  <Textarea placeholder="Descrição da atividade..." rows={2} className="text-xs" />
                </CardContent>
              </Card>

              {/* Sub-tabs */}
              <Tabs defaultValue="atividades-lista">
                <TabsList className="gap-4">
                  <TabsTrigger value="atividades-lista" className="text-xs">Atividades</TabsTrigger>
                  <TabsTrigger value="anotacoes" className="text-xs">Anotações</TabsTrigger>
                  <TabsTrigger value="anexos" className="text-xs">Anexos</TabsTrigger>
                </TabsList>

                <TabsContent value="atividades-lista" className="mt-3 space-y-2">
                  {mockActivities.map(act => (
                    <div key={act.id} className="flex gap-3 p-3 rounded-lg border border-border/40 bg-card hover:bg-muted/30 transition-colors">
                      <div className="mt-0.5">
                        {act.status === "concluida" && <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />}
                        {act.status === "pendente" && <Clock className="h-4 w-4 text-[#F59E0B]" />}
                        {act.status === "atrasada" && <XCircle className="h-4 w-4 text-destructive" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold">{act.tipo}</span>
                          <Badge variant="outline" className="text-[9px] h-4">{act.responsavel}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{act.descricao}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{fmtDateTime(act.data)}</p>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="anotacoes" className="mt-3 space-y-3">
                  <div className="flex gap-2">
                    <Textarea placeholder="Adicionar anotação..." rows={2} className="text-xs" />
                    <Button size="sm" className="shrink-0 self-end"><Send className="h-3.5 w-3.5" /></Button>
                  </div>
                  {mockNotes.map(n => (
                    <div key={n.id} className="p-3 rounded-lg bg-muted/40 border border-border/30">
                      <p className="text-xs">{n.texto}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{n.autor} · {fmtDateTime(n.data)}</p>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="anexos" className="mt-3 space-y-3">
                  <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-xs text-muted-foreground">Arraste arquivos ou clique para enviar</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { nome: "CNH_JoaoSilva.pdf", tamanho: "1.2 MB", data: "04/03/2026" },
                      { nome: "Comprovante_Residencia.pdf", tamanho: "850 KB", data: "03/03/2026" },
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-border/30 bg-card">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{f.nome}</p>
                          <p className="text-[10px] text-muted-foreground">{f.tamanho} · {f.data}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* ──── ABA 2: CONTATO ──── */}
            <TabsContent value="contato" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Dados Pessoais */}
                <Card className="border border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Dados Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {([
                      ["Nome", deal.contato.nome],
                      ["CPF", deal.contato.cpf],
                      ["RG", deal.contato.rg],
                      ["CNH", deal.contato.cnh],
                      ["Nascimento", fmtDate(deal.contato.nascimento)],
                      ["Sexo", deal.contato.sexo],
                    ] as [string, string][]).map(([l, v]) => (
                      <div key={l} className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">{l}</Label>
                        <Input defaultValue={v} className="h-8 text-xs" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Contato */}
                <Card className="border border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> Contato</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Celular</Label>
                      <div className="flex gap-2">
                        <Input defaultValue={deal.contato.celular} className="h-8 text-xs flex-1" />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-[#25D366]">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {([
                      ["Celular 2", deal.contato.celular2],
                      ["Tel. Residencial", deal.contato.telResidencial],
                      ["Tel. Comercial", deal.contato.telComercial],
                      ["E-mail", deal.contato.email],
                    ] as [string, string][]).map(([l, v]) => (
                      <div key={l} className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">{l}</Label>
                        <Input defaultValue={v} className="h-8 text-xs" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Endereço */}
                <Card className="border border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Endereço</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">CEP</Label>
                      <Input defaultValue={deal.contato.cep} className="h-8 text-xs" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Endereço</Label>
                        <Input defaultValue={deal.contato.endereco} className="h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Nº</Label>
                        <Input defaultValue={deal.contato.numero} className="h-8 text-xs" />
                      </div>
                    </div>
                    {([
                      ["Complemento", deal.contato.complemento],
                      ["Bairro", deal.contato.bairro],
                    ] as [string, string][]).map(([l, v]) => (
                      <div key={l} className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">{l}</Label>
                        <Input defaultValue={v} className="h-8 text-xs" />
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Estado</Label>
                        <Select defaultValue={deal.contato.estado}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{ufs.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Cidade</Label>
                        <Input defaultValue={deal.contato.cidade} className="h-8 text-xs" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex justify-end">
                <Button><Check className="h-4 w-4 mr-1" /> Salvar Contato</Button>
              </div>
            </TabsContent>

            {/* ──── ABA 3: COTAÇÕES ──── */}
            <TabsContent value="cotacoes" className="space-y-4 mt-4">
              <Card className="border border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">Cotação do Veículo</CardTitle>
                      <Badge variant="outline" className="text-[10px]">COT-2026-0055</Badge>
                    </div>
                    <Badge className="bg-[#F59E0B]/20 text-[#F59E0B] border-0 text-[10px]">Em análise</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {([
                      ["Tipo", deal.veiculo.tipo],
                      ["Placa", deal.veiculo.placa],
                      ["Chassi", deal.veiculo.chassi],
                      ["Renavam", deal.veiculo.renavam],
                      ["Marca", deal.veiculo.marca],
                      ["Modelo", deal.veiculo.modelo],
                      ["Ano Fab.", String(deal.veiculo.anoFab)],
                      ["Ano Mod.", String(deal.veiculo.anoMod)],
                      ["Cód. FIPE", deal.veiculo.codigoFipe],
                      ["Valor FIPE", fmt(deal.veiculo.valorFipe)],
                      ["Valor Protegido", fmt(deal.veiculo.valorProtegido)],
                      ["Depreciação", deal.veiculo.depreciacao + "%"],
                      ["Dia Vencimento", String(deal.veiculo.diaVencimento)],
                      ["Cor", deal.veiculo.cor],
                      ["Câmbio", deal.veiculo.cambio],
                      ["Combustível", deal.veiculo.combustivel],
                      ["KM", deal.veiculo.km.toLocaleString("pt-BR")],
                      ["Nº Motor", deal.veiculo.motor],
                      ["Estado Circ.", deal.veiculo.estadoCirculacao],
                      ["Cidade Circ.", deal.veiculo.cidadeCirculacao],
                    ] as [string, string][]).map(([l, v]) => (
                      <div key={l} className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">{l}</Label>
                        <Input defaultValue={v} className="h-8 text-xs" />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="vt" defaultChecked={deal.veiculo.veiculoTrabalho} />
                    <Label htmlFor="vt" className="text-xs">Veículo de trabalho</Label>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Obs. para o Cliente</Label>
                      <Textarea rows={2} className="text-xs" placeholder="Observações visíveis ao cliente..." />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Obs. Internas</Label>
                      <Textarea rows={2} className="text-xs" placeholder="Anotações internas..." />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button><Check className="h-4 w-4 mr-1" /> Salvar Cotação</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ──── ABA 4: VISTORIA ──── */}
            <TabsContent value="vistoria" className="space-y-4 mt-4">
              <Card className="border border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">Vistoria</CardTitle>
                      <Badge variant="outline" className="text-[10px]">{mockVistoria.codigo}</Badge>
                    </div>
                    <Badge className="bg-[#3B82F6]/20 text-[#3B82F6] border-0 text-[10px]">{mockVistoria.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div><p className="text-[10px] uppercase text-muted-foreground">Inspetor</p><p className="text-xs font-medium">{mockVistoria.inspetor}</p></div>
                    <div><p className="text-[10px] uppercase text-muted-foreground">Tipo</p><p className="text-xs font-medium">{mockVistoria.tipo}</p></div>
                    <div><p className="text-[10px] uppercase text-muted-foreground">Data Agendada</p><p className="text-xs font-medium">{fmtDateTime(mockVistoria.dataAgendada)}</p></div>
                    <div><p className="text-[10px] uppercase text-muted-foreground">Local</p><p className="text-xs font-medium">{mockVistoria.local}</p></div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40">
                    <ExternalLink className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs text-primary truncate flex-1">{mockVistoria.link}</span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs"><Copy className="h-3 w-3 mr-1" /> Copiar</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-[#25D366]"><MessageSquare className="h-3 w-3 mr-1" /> WhatsApp</Button>
                  </div>

                  <Separator />
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Histórico</p>
                  {mockVistoria.historico.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{fmtDateTime(h.data)}</span>
                      <span>{h.descricao}</span>
                    </div>
                  ))}

                  <Separator />
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Fotos da Vistoria</p>
                  <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="aspect-square rounded-lg bg-muted/60 border border-dashed border-border/50 flex items-center justify-center">
                        <Image className="h-6 w-6 text-muted-foreground/30" />
                      </div>
                    ))}
                  </div>

                  <Separator />
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Checklist de Acessórios</p>
                  <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                    {(Object.entries(mockVistoria.acessorios) as [string, boolean][]).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2">
                        <Checkbox defaultChecked={v} id={`ac-${k}`} />
                        <Label htmlFor={`ac-${k}`} className="text-xs capitalize">{k.replace(/([A-Z])/g, ' $1')}</Label>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">Observações</Label>
                    <Textarea rows={2} className="text-xs" placeholder="Observações da vistoria..." />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ──── ABA 5: PROPOSTA ──── */}
            <TabsContent value="proposta" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{mockPropostas.length} proposta(s)</p>
                <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Criar Proposta</Button>
              </div>

              {mockPropostas.map(p => {
                const statusColors: Record<string, string> = {
                  Rascunho: "bg-muted text-muted-foreground",
                  Enviada: "bg-[#3B82F6]/20 text-[#3B82F6]",
                  Aceita: "bg-[#22C55E]/20 text-[#22C55E]",
                  Recusada: "bg-destructive/20 text-destructive",
                };
                return (
                  <Card key={p.id} className="border border-border/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{p.codigo}</span>
                          <Badge className={`text-[10px] border-0 ${statusColors[p.status]}`}>{p.status}</Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{fmtDate(p.criadaEm)}</span>
                      </div>
                      <p className="text-sm font-semibold">{p.titulo}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">Plano <strong>{p.plano}</strong></span>
                        <span className="text-sm">Mensalidade: <strong className="text-[#22C55E]">{fmt(p.valor)}</strong></span>
                        <span className="text-sm">Adesão: <strong>{fmt(p.adesao)}</strong></span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {p.coberturas.map(c => (
                          <div key={c} className="flex items-center gap-1 text-xs">
                            <Check className="h-3 w-3 text-[#22C55E]" />
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                      <Separator />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline"><Eye className="h-3.5 w-3.5 mr-1" /> Preview</Button>
                        <Button size="sm" variant="outline"><Mail className="h-3.5 w-3.5 mr-1" /> Reenviar Email</Button>
                        <Button size="sm" variant="outline" className="text-[#25D366]"><MessageSquare className="h-3.5 w-3.5 mr-1" /> WhatsApp</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            {/* ──── ABA 6: ASSINATURA DIGITAL ──── */}
            <TabsContent value="assinatura" className="space-y-4 mt-4">
              <Card className="border border-border/50">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Tipo de Documento</Label>
                      <Select defaultValue="adesao">
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="adesao">Termo de Adesão</SelectItem>
                          <SelectItem value="contrato">Contrato</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="self-end"><Send className="h-4 w-4 mr-1" /> Enviar para Assinatura</Button>
                  </div>

                  <Separator />

                  <p className="text-xs font-semibold uppercase text-muted-foreground">Documentos</p>
                  {[
                    { doc: "Termo de Adesão", status: "Assinado", data: "03/03/2026" },
                    { doc: "Contrato de Proteção Veicular", status: "Pendente", data: "04/03/2026" },
                  ].map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs font-medium">{d.doc}</p>
                          <p className="text-[10px] text-muted-foreground">Enviado em {d.data}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] border-0 ${d.status === "Assinado" ? "bg-[#22C55E]/20 text-[#22C55E]" : "bg-[#F59E0B]/20 text-[#F59E0B]"}`}>
                          {d.status}
                        </Badge>
                        <Button size="sm" variant="ghost"><Eye className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ))}

                  <Separator />
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Dados do Associado</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-muted-foreground">Nome:</span> <strong>{deal.contato.nome}</strong></div>
                    <div><span className="text-muted-foreground">CPF:</span> <strong>{deal.contato.cpf}</strong></div>
                    <div><span className="text-muted-foreground">Email:</span> <strong>{deal.contato.email}</strong></div>
                    <div><span className="text-muted-foreground">Veículo:</span> <strong>{deal.titulo} - {deal.veiculo.placa}</strong></div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="hidden lg:block w-80 shrink-0 space-y-4">
          {/* Status */}
          <Card className="border border-border/50">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase text-muted-foreground">Status / Etapa</Label>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger className="h-9 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sc.color }} />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(stageConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
                          {v.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-[10px] uppercase text-muted-foreground">Responsável</Label>
                <Select value={responsavel} onValueChange={setResponsavel}>
                  <SelectTrigger className="h-9 text-xs">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">{responsavel.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {["Maria Santos","João Pedro","Ana Costa"].map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Afiliado</Label>
                <p className="text-xs font-medium">{deal.afiliado.nome}</p>
                <p className="text-[10px] text-[#22C55E]">Comissão: {fmt(deal.afiliado.comissao)}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-[10px] uppercase text-muted-foreground">Contratação Online</Label>
                <Progress value={(deal.etapasContratacao.concluidas / deal.etapasContratacao.total) * 100} className="h-2" />
                <p className="text-[10px] text-muted-foreground">{deal.etapasContratacao.concluidas}/{deal.etapasContratacao.total} etapas concluídas</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-[10px] uppercase text-muted-foreground">Cooperativa</Label>
                <Select defaultValue="central-sp">
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="central-sp">Cooperativa Central SP</SelectItem>
                    <SelectItem value="central-rj">Cooperativa Central RJ</SelectItem>
                    <SelectItem value="central-mg">Cooperativa Central MG</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-[10px] uppercase text-muted-foreground">Origem do Lead</Label>
                <Select value={origem} onValueChange={setOrigem}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {origemOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-[10px] uppercase text-muted-foreground">Tags</Label>
                <div className="flex flex-wrap gap-1">
                  {deal.tags.map(t => (
                    <span key={t.id} className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: t.cor }}>
                      {t.nome}
                    </span>
                  ))}
                  <Button variant="ghost" size="sm" className="h-5 text-[10px] px-2"><Plus className="h-3 w-3 mr-0.5" /> Tag</Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-1 text-[10px] text-muted-foreground">
                <div className="flex justify-between"><span>Criado em</span><span>{fmtDateTime(deal.createdAt)}</span></div>
                <div className="flex justify-between"><span>Atualizado em</span><span>{fmtDateTime(deal.updatedAt)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
