import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Link2, Copy, Plus, Upload, Target, Users, CalendarIcon,
  ChevronDown, ExternalLink, FileSpreadsheet, Settings,
} from "lucide-react";
import { consultores, cooperativas, regionais, stageColumns } from "./pipeline/mockData";

// ========== TAB 1 - POWERLINK ==========
const mockPowerlinks = [
  { consultor: "Ana Silva", link: "https://gia.com.br/pl/ana-silva", leads: 42, adesoes: 18, taxa: 42.9 },
  { consultor: "Carlos Souza", link: "https://gia.com.br/pl/carlos-souza", leads: 35, adesoes: 15, taxa: 42.9 },
  { consultor: "Maria Lima", link: "https://gia.com.br/pl/maria-lima", leads: 28, adesoes: 12, taxa: 42.9 },
  { consultor: "João Pedro", link: "https://gia.com.br/pl/joao-pedro", leads: 18, adesoes: 7, taxa: 38.9 },
  { consultor: "Fernanda Alves", link: "https://gia.com.br/pl/fernanda-alves", leads: 12, adesoes: 5, taxa: 41.7 },
];

// ========== TAB 2 - FORMULARIOS ==========
const mockFormularios = [
  { id: "f1", nome: "Cotação Rápida", desc: "Formulário simplificado para site principal", campos: 5, etapa: "Novo Lead", origem: "Site", status: "Ativo" },
  { id: "f2", nome: "Landing Page Verão", desc: "Campanha de verão 2026", campos: 7, etapa: "Novo Lead", origem: "Formulário", status: "Ativo" },
  { id: "f3", nome: "Indicação Afiliado", desc: "Formulário para parceiros indicarem leads", campos: 4, etapa: "Novo Lead", origem: "Afiliado", status: "Inativo" },
];

const camposForm = ["Nome", "Telefone", "Email", "Placa", "Modelo", "Cidade Circulação", "CPF"];

// ========== TAB 3 - IMPORTACAO ==========
const mockImportHist = [
  { data: "03/03/2026", arquivo: "leads_marco.xlsx", total: 45, distribuidoPara: "Ana Silva, Carlos Souza", status: "Concluída" },
  { data: "15/02/2026", arquivo: "campanha_verao.csv", total: 120, distribuidoPara: "Todos", status: "Concluída" },
  { data: "01/02/2026", arquivo: "reativacao.xlsx", total: 30, distribuidoPara: "Maria Lima", status: "Parcial" },
];

// ========== TAB 4 - METAS ==========
const mockMetas = [
  { id: "m1", nome: "Meta Março 2026", inicio: "01/03/2026", fim: "31/03/2026", alvo: 50, tipo: "Vendas", consultores: "Todos", progresso: 36 },
  { id: "m2", nome: "Captação Q1", inicio: "01/01/2026", fim: "31/03/2026", alvo: 200, tipo: "Leads", consultores: "Ana Silva, Carlos Souza", progresso: 72 },
  { id: "m3", nome: "Faturamento Março", inicio: "01/03/2026", fim: "31/03/2026", alvo: 50000, tipo: "Valor R$", consultores: "Todos", progresso: 45 },
  { id: "m4", nome: "Meta Frota", inicio: "01/02/2026", fim: "30/04/2026", alvo: 10, tipo: "Vendas", consultores: "Maria Lima", progresso: 60 },
];

// ========== TAB 5 - AFILIADOS ==========
const mockAfiliados = [
  { id: "af1", nome: "Marcos Ribeiro", email: "marcos.r@email.com", link: "https://gia.com.br/af/marcos", leads: 15, vendas: 6, etapa: "Ativo", recompensa: 540.0 },
  { id: "af2", nome: "Carla Fernandes", email: "carla.f@email.com", link: "https://gia.com.br/af/carla", leads: 22, vendas: 9, etapa: "Ativo", recompensa: 810.0 },
  { id: "af3", nome: "Bruno Tavares", email: "bruno.t@email.com", link: "https://gia.com.br/af/bruno", leads: 8, vendas: 3, etapa: "Ativo", recompensa: 270.0 },
  { id: "af4", nome: "Patricia Souza", email: "patricia.s@email.com", link: "https://gia.com.br/af/patricia", leads: 5, vendas: 1, etapa: "Inativo", recompensa: 90.0 },
  { id: "af5", nome: "Diego Almeida", email: "diego.a@email.com", link: "https://gia.com.br/af/diego", leads: 30, vendas: 12, etapa: "Ativo", recompensa: 1080.0 },
];

function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function FerramentasVendas() {
  const [tab, setTab] = useState("powerlink");
  const [formModal, setFormModal] = useState(false);
  const [metaModal, setMetaModal] = useState(false);
  const [afiliadoModal, setAfiliadoModal] = useState(false);
  const [afiliadoMetaModal, setAfiliadoMetaModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<string | null>(null);

  function copyLink(link: string) { navigator.clipboard.writeText(link); toast({ title: "Link copiado!" }); }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ferramentas</h1>
        <p className="text-sm text-muted-foreground">Captação de leads, automação e gestão de metas</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
          <TabsTrigger value="powerlink" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Powerlink</TabsTrigger>
          <TabsTrigger value="formularios" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Formulários Dinâmicos</TabsTrigger>
          <TabsTrigger value="importacao" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Importação de Lista</TabsTrigger>
          <TabsTrigger value="metas" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Metas</TabsTrigger>
          <TabsTrigger value="afiliados" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Afiliados</TabsTrigger>
        </TabsList>

        {/* TAB 1 - POWERLINK */}
        <TabsContent value="powerlink" className="space-y-4">
          <div className="flex justify-end"><Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" />Gerar Novo Powerlink</Button></div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Consultor</TableHead><TableHead className="text-xs">Link Personalizado</TableHead>
                <TableHead className="text-xs text-right">Leads</TableHead><TableHead className="text-xs text-right">Adesões</TableHead><TableHead className="text-xs text-right">Conversão</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {mockPowerlinks.map(p => (
                  <TableRow key={p.consultor}>
                    <TableCell className="font-medium text-sm">{p.consultor}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-primary truncate max-w-[200px]">{p.link}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyLink(p.link)}><Copy className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{p.leads}</TableCell>
                    <TableCell className="text-right font-bold">{p.adesoes}</TableCell>
                    <TableCell className="text-right">{p.taxa}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* TAB 2 - FORMULARIOS */}
        <TabsContent value="formularios" className="space-y-4">
          <div className="flex justify-end"><Button size="sm" onClick={() => setFormModal(true)}><Plus className="h-3.5 w-3.5 mr-1" />Novo Formulário</Button></div>
          <div className="grid gap-3">
            {mockFormularios.map(f => (
              <Card key={f.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{f.nome}</p>
                      <Badge variant="outline" className={cn("text-[10px]", f.status === "Ativo" ? "text-green-700 border-green-300" : "text-muted-foreground")}>{f.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px]">{f.campos} campos</Badge>
                      <Badge variant="outline" className="text-[10px]">Etapa: {f.etapa}</Badge>
                      <Badge variant="outline" className="text-[10px]">Origem: {f.origem}</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="outline"><Settings className="h-3.5 w-3.5 mr-1" />Editar</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3 - IMPORTACAO */}
        <TabsContent value="importacao" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); setUploadFile("leads_import.xlsx"); }}
                onClick={() => setUploadFile("leads_import.xlsx")}
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="font-medium">{uploadFile || "Arraste seu arquivo ou clique para selecionar"}</p>
                <p className="text-xs text-muted-foreground mt-1">Formatos aceitos: .xlsx, .csv</p>
              </div>
              {uploadFile && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium">Mapeamento de Campos</p>
                  <div className="grid grid-cols-3 gap-2">
                    {["Coluna A", "Coluna B", "Coluna C", "Coluna D", "Coluna E"].map(col => (
                      <div key={col} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16">{col}:</span>
                        <Select><SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Mapear para..." /></SelectTrigger>
                          <SelectContent>{["Nome", "Telefone", "Email", "Cidade", "Placa", "Ignorar"].map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Leads por consultor</Label><Input type="number" className="h-8 text-xs" defaultValue={10} /></div>
                    <div className="space-y-1"><Label className="text-xs">Modo Distribuição</Label>
                      <Select defaultValue="auto"><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="auto">Automática Igualitária</SelectItem><SelectItem value="manual">Manual</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2"><Button size="sm">Importar</Button><Button size="sm" variant="outline" onClick={() => setUploadFile(null)}>Cancelar</Button></div>
                </div>
              )}
            </CardContent>
          </Card>

          <h3 className="font-semibold text-sm">Histórico de Importações</h3>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead className="text-xs">Data</TableHead><TableHead className="text-xs">Arquivo</TableHead><TableHead className="text-xs text-right">Total Leads</TableHead><TableHead className="text-xs">Distribuídos Para</TableHead><TableHead className="text-xs">Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {mockImportHist.map((h, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{h.data}</TableCell>
                    <TableCell className="text-sm">{h.arquivo}</TableCell>
                    <TableCell className="text-right font-medium">{h.total}</TableCell>
                    <TableCell className="text-xs">{h.distribuidoPara}</TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-[10px]", h.status === "Concluída" ? "text-green-700 border-green-300" : "text-amber-700 border-amber-300")}>{h.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* TAB 4 - METAS */}
        <TabsContent value="metas" className="space-y-4">
          <div className="flex justify-end"><Button size="sm" onClick={() => setMetaModal(true)}><Plus className="h-3.5 w-3.5 mr-1" />Nova Meta</Button></div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Nome Meta</TableHead><TableHead className="text-xs">Período</TableHead><TableHead className="text-xs">Alvo</TableHead>
                <TableHead className="text-xs">Tipo</TableHead><TableHead className="text-xs">Consultores</TableHead><TableHead className="text-xs w-32">Progresso</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {mockMetas.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium text-sm">{m.nome}</TableCell>
                    <TableCell className="text-xs">{m.inicio} - {m.fim}</TableCell>
                    <TableCell className="font-bold text-sm">{m.tipo === "Valor R$" ? fmt(m.alvo) : m.alvo}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{m.tipo}</Badge></TableCell>
                    <TableCell className="text-xs">{m.consultores}</TableCell>
                    <TableCell><div className="flex items-center gap-2"><Progress value={m.progresso} className="h-2 flex-1" /><span className="text-xs font-medium">{m.progresso}%</span></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* TAB 5 - AFILIADOS */}
        <TabsContent value="afiliados" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setAfiliadoModal(true)}><Plus className="h-3.5 w-3.5 mr-1" />Novo Afiliado</Button>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Afiliado</TableHead><TableHead className="text-xs">Email</TableHead><TableHead className="text-xs">Link</TableHead>
                <TableHead className="text-xs text-right">Leads</TableHead><TableHead className="text-xs text-right">Vendas</TableHead><TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Recompensa</TableHead><TableHead className="text-xs">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {mockAfiliados.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-sm">{a.nome}</TableCell>
                    <TableCell className="text-xs">{a.email}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-primary truncate max-w-[150px]">{a.link}</span>
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => copyLink(a.link)}><Copy className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{a.leads}</TableCell>
                    <TableCell className="text-right font-bold">{a.vendas}</TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-[10px]", a.etapa === "Ativo" ? "text-green-700 border-green-300" : "text-muted-foreground")}>{a.etapa}</Badge></TableCell>
                    <TableCell className="text-right font-medium text-amber-600">{fmt(a.recompensa)}</TableCell>
                    <TableCell><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAfiliadoMetaModal(true)}><Target className="h-3.5 w-3.5 mr-1" />Meta</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Formulário Modal */}
      <Dialog open={formModal} onOpenChange={setFormModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Formulário</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Nome</Label><Input placeholder="Nome do formulário" /></div>
            <div className="space-y-1.5"><Label>Descrição</Label><Textarea rows={2} /></div>
            <div className="space-y-2">
              <Label>Campos</Label>
              {camposForm.map(c => (
                <div key={c} className="flex items-center justify-between py-1">
                  <label className="flex items-center gap-2 text-sm"><Checkbox defaultChecked />{c}</label>
                  <div className="flex items-center gap-1"><span className="text-[10px] text-muted-foreground">Obrigatório</span><Switch defaultChecked={c === "Nome" || c === "Telefone"} /></div>
                </div>
              ))}
            </div>
            <div className="space-y-1.5"><Label>URL Direcionamento (pós-envio)</Label><Input placeholder="https://..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Etapa Funil</Label><Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{stageColumns.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Origem Lead</Label><Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{["Site", "Formulário", "Afiliado", "Campanha"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Tabela Preços</Label><Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="padrao">Padrão</SelectItem><SelectItem value="promo">Promoção</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Cooperativa</Label><Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{cooperativas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="flex gap-2"><Button variant="outline">Gerar Código HTML</Button><Button variant="outline">Gerar Link Direto</Button></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setFormModal(false)}>Cancelar</Button><Button onClick={() => { setFormModal(false); toast({ title: "Formulário criado" }); }}>Salvar</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meta Modal */}
      <Dialog open={metaModal} onOpenChange={setMetaModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Meta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Nome</Label><Input placeholder="Nome da meta" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Início</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-muted-foreground"><CalendarIcon className="h-4 w-4 mr-2" />Selecione</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" className="p-3 pointer-events-auto" /></PopoverContent></Popover>
              </div>
              <div className="space-y-1.5"><Label>Fim</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-muted-foreground"><CalendarIcon className="h-4 w-4 mr-2" />Selecione</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" className="p-3 pointer-events-auto" /></PopoverContent></Popover>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Valor Alvo</Label><Input type="number" /></div>
              <div className="space-y-1.5"><Label>Tipo</Label><Select><SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="vendas">Vendas</SelectItem><SelectItem value="leads">Leads</SelectItem><SelectItem value="valor">Valor R$</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-1.5"><Label>Consultores</Label>
              <div className="flex flex-wrap gap-2">{consultores.map(c => <label key={c} className="flex items-center gap-1.5 text-sm"><Checkbox />{c}</label>)}</div>
            </div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setMetaModal(false)}>Cancelar</Button><Button onClick={() => { setMetaModal(false); toast({ title: "Meta criada" }); }}>Salvar</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Novo Afiliado Modal */}
      <Dialog open={afiliadoModal} onOpenChange={setAfiliadoModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Novo Afiliado</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Nome</Label><Input /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" /></div>
            <div className="space-y-1.5"><Label>Telefone</Label><Input /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setAfiliadoModal(false)}>Cancelar</Button><Button onClick={() => { setAfiliadoModal(false); toast({ title: "Afiliado criado" }); }}>Salvar</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meta Afiliado Modal */}
      <Dialog open={afiliadoMetaModal} onOpenChange={setAfiliadoMetaModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Configurar Meta Afiliado</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Valor Recompensa (R$)</Label><Input type="number" defaultValue={90} /></div>
            <div className="space-y-1.5"><Label>Tipo Meta</Label><Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="venda">Por Venda</SelectItem><SelectItem value="lead">Por Lead</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Início</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-muted-foreground"><CalendarIcon className="h-4 w-4 mr-2" />Data</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" className="p-3 pointer-events-auto" /></PopoverContent></Popover>
              </div>
              <div className="space-y-1.5"><Label>Fim</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-muted-foreground"><CalendarIcon className="h-4 w-4 mr-2" />Data</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" className="p-3 pointer-events-auto" /></PopoverContent></Popover>
              </div>
            </div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setAfiliadoMetaModal(false)}>Cancelar</Button><Button onClick={() => { setAfiliadoMetaModal(false); toast({ title: "Meta configurada" }); }}>Salvar</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
