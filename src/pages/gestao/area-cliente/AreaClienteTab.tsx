import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  FileText, Search, Plus, Globe, MessageSquare, Shield, Code,
  ExternalLink, Clock, Eye, Send,
} from "lucide-react";
import { toast } from "sonner";

// ── Mock ──
const mockBoletos2via = [
  { id: "BOL-001", associado: "Carlos Eduardo Silva", cpf: "123.456.789-00", valor: 189.90, vencimento: "2025-07-10", status: "gerado" },
  { id: "BOL-002", associado: "Maria Fernanda Oliveira", cpf: "987.654.321-00", valor: 245.50, vencimento: "2025-07-10", status: "gerado" },
  { id: "BOL-003", associado: "José Roberto Santos", cpf: "456.789.123-00", valor: 312.00, vencimento: "2025-07-10", status: "gerado" },
];

const mockChamados = [
  { id: "CH-001", tipo: "Sinistro", assunto: "Colisão traseira — solicito orientação", associado: "Carlos Eduardo Silva", data: "2025-07-05 14:30", status: "aberto" as const, mensagens: [
    { autor: "Carlos Eduardo Silva", data: "2025-07-05 14:30", texto: "Sofri uma colisão traseira hoje às 13h na Av. Paulista. O outro motorista fugiu. Como devo proceder?" },
    { autor: "Atendimento", data: "2025-07-05 15:00", texto: "Olá Carlos, lamentamos o ocorrido. Por favor, registre um B.O. e nos envie as fotos do veículo. Vamos abrir um evento de sinistro para você." },
  ] },
  { id: "CH-002", tipo: "Financeiro", assunto: "2ª via de boleto — mês de junho", associado: "Ana Paula Costa", data: "2025-07-03 09:15", status: "resolvido" as const, mensagens: [
    { autor: "Ana Paula Costa", data: "2025-07-03 09:15", texto: "Preciso da 2ª via do boleto de junho, não recebi por e-mail." },
    { autor: "Atendimento", data: "2025-07-03 10:00", texto: "Enviamos a 2ª via para seu e-mail cadastrado. Qualquer dúvida, estamos à disposição." },
  ] },
  { id: "CH-003", tipo: "Cadastro", assunto: "Atualização de endereço", associado: "Fernanda Rodrigues", data: "2025-07-07 11:45", status: "em_andamento" as const, mensagens: [
    { autor: "Fernanda Rodrigues", data: "2025-07-07 11:45", texto: "Mudei de endereço e preciso atualizar meu cadastro. Novo endereço: Rua XV de Novembro, 1500 - Curitiba/PR" },
  ] },
  { id: "CH-004", tipo: "Vistoria", assunto: "Reagendamento de vistoria", associado: "Ricardo Almeida", data: "2025-07-08 08:00", status: "aberto" as const, mensagens: [
    { autor: "Ricardo Almeida", data: "2025-07-08 08:00", texto: "Preciso reagendar minha vistoria que estava marcada para 10/07. Consigo fazer no dia 15/07?" },
  ] },
];

const statusChamado: Record<string, string> = {
  aberto: "bg-primary/8 text-primary dark:bg-blue-900 dark:text-blue-300",
  em_andamento: "bg-warning/10 text-warning dark:bg-yellow-900 dark:text-yellow-300",
  resolvido: "bg-success/10 text-success dark:bg-green-900 dark:text-green-300",
};

const apiEndpoints = [
  { method: "GET", path: "/api/v1/associados", desc: "Listar associados com paginação e filtros" },
  { method: "GET", path: "/api/v1/associados/{id}", desc: "Obter dados de um associado específico" },
  { method: "POST", path: "/api/v1/associados", desc: "Cadastrar novo associado" },
  { method: "PUT", path: "/api/v1/associados/{id}", desc: "Atualizar dados do associado" },
  { method: "GET", path: "/api/v1/veiculos", desc: "Listar veículos" },
  { method: "GET", path: "/api/v1/boletos/{cpf}", desc: "Consultar boletos por CPF" },
  { method: "POST", path: "/api/v1/boletos/segunda-via", desc: "Gerar 2ª via de boleto" },
  { method: "POST", path: "/api/v1/chamados", desc: "Abrir chamado" },
  { method: "GET", path: "/api/v1/chamados/{id}", desc: "Consultar chamado por ID" },
  { method: "POST", path: "/api/v1/eventos", desc: "Registrar evento/sinistro" },
];

const methodColor: Record<string, string> = {
  GET: "bg-success/10 text-success dark:bg-green-900 dark:text-green-300",
  POST: "bg-primary/8 text-primary dark:bg-blue-900 dark:text-blue-300",
  PUT: "bg-warning/10 text-warning dark:bg-yellow-900 dark:text-yellow-300",
  DELETE: "bg-destructive/8 text-destructive dark:bg-red-900 dark:text-red-300",
};

export default function AreaClienteTab() {
  const [buscaBoleto, setBuscaBoleto] = useState("");
  const [showChamado, setShowChamado] = useState<typeof mockChamados[0] | null>(null);
  const [showNovoChamado, setShowNovoChamado] = useState(false);
  const [novoChamado, setNovoChamado] = useState({ tipo: "Sinistro", assunto: "", descricao: "" });
  const [resposta, setResposta] = useState("");

  const filteredBoletos = mockBoletos2via.filter(b =>
    !buscaBoleto || b.cpf.includes(buscaBoleto) || b.associado.toLowerCase().includes(buscaBoleto.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div><h2 className="text-xl font-bold">Área do Cliente</h2><p className="text-sm text-muted-foreground">Portal do associado, chamados, integrações e documentação de API</p></div>

      <Tabs defaultValue="boletos">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="boletos" className="gap-1"><FileText className="h-3.5 w-3.5" />2ª Via Boleto</TabsTrigger>
          <TabsTrigger value="integracao" className="gap-1"><Globe className="h-3.5 w-3.5" />Integração Site</TabsTrigger>
          <TabsTrigger value="chamados" className="gap-1"><MessageSquare className="h-3.5 w-3.5" />Chamados</TabsTrigger>
          <TabsTrigger value="api" className="gap-1"><Code className="h-3.5 w-3.5" />Documentação API</TabsTrigger>
          <TabsTrigger value="seguranca" className="gap-1"><Shield className="h-3.5 w-3.5" />Políticas</TabsTrigger>
        </TabsList>

        {/* ── 2ª VIA ── */}
        <TabsContent value="boletos" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Buscar Boleto para 2ª Via</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="CPF ou nome do associado..." value={buscaBoleto} onChange={e => setBuscaBoleto(e.target.value)} /></div>
                <Button variant="outline">Buscar</Button>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Associado</TableHead><TableHead>CPF</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Vencimento</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredBoletos.map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono text-xs">{b.id}</TableCell>
                      <TableCell className="font-medium">{b.associado}</TableCell>
                      <TableCell className="font-mono text-xs">{b.cpf}</TableCell>
                      <TableCell className="text-right">R$ {b.valor.toFixed(2)}</TableCell>
                      <TableCell>{new Date(b.vencimento).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell><Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success(`2ª via do boleto ${b.id} gerada e enviada`)}><FileText className="h-3 w-3" />Gerar 2ª Via</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── INTEGRAÇÃO SITE ── */}
        <TabsContent value="integracao" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" />Integração com Site da Associação</CardTitle><CardDescription>Configure a URL e API key para integrar o portal do associado ao site institucional</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div><Label className="text-xs">URL do Site</Label><Input defaultValue="https://www.minhaassociacao.com.br" /></div>
              <div><Label className="text-xs">API Key</Label><Input defaultValue="sk_live_abc123...xyz789" type="password" /></div>
              <div><Label className="text-xs">Webhook URL (callback)</Label><Input defaultValue="https://www.minhaassociacao.com.br/api/webhook" /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => toast.success("Configuração salva")}>Salvar</Button>
                <Button size="sm" variant="outline" onClick={() => toast.success("Conexão testada com sucesso")}><ExternalLink className="h-4 w-4" />Testar Conexão</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CHAMADOS ── */}
        <TabsContent value="chamados" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="grid grid-cols-3 gap-3 flex-1 mr-4">
              <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold">{mockChamados.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
              <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-blue-600">{mockChamados.filter(c => c.status === "aberto").length}</p><p className="text-xs text-muted-foreground">Abertos</p></CardContent></Card>
              <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-success">{mockChamados.filter(c => c.status === "resolvido").length}</p><p className="text-xs text-muted-foreground">Resolvidos</p></CardContent></Card>
            </div>
            <Button size="sm" onClick={() => setShowNovoChamado(true)}><Plus className="h-4 w-4" />Novo Chamado</Button>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Tipo</TableHead><TableHead>Assunto</TableHead><TableHead>Associado</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {mockChamados.map(c => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => setShowChamado(c)}>
                    <TableCell className="font-mono text-xs">{c.id}</TableCell>
                    <TableCell><Badge variant="outline">{c.tipo}</Badge></TableCell>
                    <TableCell className="font-medium">{c.assunto}</TableCell>
                    <TableCell>{c.associado}</TableCell>
                    <TableCell className="text-sm">{c.data}</TableCell>
                    <TableCell><Badge className={statusChamado[c.status]}>{c.status.replace("_", " ")}</Badge></TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* ── API ── */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Code className="h-4 w-4" />Documentação de API</CardTitle><CardDescription>Endpoints disponíveis para associações que contratam o sistema GIA</CardDescription></CardHeader>
            <CardContent>
              <div className="p-3 bg-muted rounded-lg mb-4 font-mono text-sm">
                <p className="text-muted-foreground">Base URL:</p>
                <p className="font-semibold">https://api.gia.com.br/v1</p>
                <p className="text-muted-foreground mt-2">Autenticação:</p>
                <p>Authorization: Bearer {"<API_KEY>"}</p>
              </div>
              <div className="space-y-2">
                {apiEndpoints.map((ep, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <Badge className={`font-mono text-xs w-14 justify-center ${methodColor[ep.method]}`}>{ep.method}</Badge>
                    <code className="text-sm font-mono flex-1">{ep.path}</code>
                    <span className="text-xs text-muted-foreground">{ep.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── POLÍTICAS ── */}
        <TabsContent value="seguranca" className="space-y-4">
          <Accordion type="multiple" defaultValue={["termos"]}>
            <AccordionItem value="termos">
              <AccordionTrigger><div className="flex items-center gap-2"><Shield className="h-4 w-4" />Termos de Uso</div></AccordionTrigger>
              <AccordionContent>
                <Textarea className="min-h-[200px] font-mono text-sm" defaultValue={`TERMOS DE USO — SISTEMA GIA\n\n1. ACEITAÇÃO\nAo acessar e utilizar o sistema GIA, o usuário concorda integralmente com estes Termos de Uso.\n\n2. FINALIDADE\nO sistema GIA destina-se à gestão integrada de associações de proteção veicular.\n\n3. RESPONSABILIDADES DO USUÁRIO\n- Manter suas credenciais em sigilo;\n- Utilizar o sistema de forma ética e legal;\n- Reportar quaisquer vulnerabilidades encontradas.\n\n4. PROPRIEDADE INTELECTUAL\nTodo o conteúdo, código e funcionalidades são de propriedade exclusiva do GIA.\n\n5. LIMITAÇÃO DE RESPONSABILIDADE\nO GIA não se responsabiliza por danos indiretos ou lucros cessantes.\n\nÚltima atualização: 01/07/2025`} />
                <Button size="sm" className="mt-2" onClick={() => toast.success("Termos de uso salvos")}>Salvar Alterações</Button>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="privacidade">
              <AccordionTrigger><div className="flex items-center gap-2"><Shield className="h-4 w-4" />Política de Privacidade</div></AccordionTrigger>
              <AccordionContent>
                <Textarea className="min-h-[200px] font-mono text-sm" defaultValue={`POLÍTICA DE PRIVACIDADE — SISTEMA GIA\n\n1. COLETA DE DADOS\nColetamos dados pessoais necessários para a prestação dos serviços: nome, CPF, endereço, telefone, e-mail e dados do veículo.\n\n2. FINALIDADE\nOs dados são utilizados exclusivamente para gestão da associação, cobrança e comunicação.\n\n3. COMPARTILHAMENTO\nOs dados podem ser compartilhados com fornecedores parceiros (rastreadores, guinchos) mediante consentimento.\n\n4. SEGURANÇA\nUtilizamos criptografia, autenticação multifator e backups regulares.\n\n5. DIREITOS DO TITULAR\nO titular pode solicitar acesso, correção ou exclusão de seus dados a qualquer momento.\n\n6. LGPD\nEsta política está em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018).\n\nÚltima atualização: 01/07/2025`} />
                <Button size="sm" className="mt-2" onClick={() => toast.success("Política de privacidade salva")}>Salvar Alterações</Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>

      {/* Chamado Detalhe */}
      <Dialog open={!!showChamado} onOpenChange={() => setShowChamado(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Chamado {showChamado?.id}</DialogTitle></DialogHeader>
          {showChamado && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tipo:</span><Badge variant="outline">{showChamado.tipo}</Badge></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status:</span><Badge className={statusChamado[showChamado.status]}>{showChamado.status.replace("_", " ")}</Badge></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Associado:</span><span className="font-medium">{showChamado.associado}</span></div>
              <div className="border-t-2 border-[#747474] pt-3 space-y-3">
                <p className="font-semibold text-sm">Mensagens</p>
                {showChamado.mensagens.map((m, i) => (
                  <div key={i} className={`p-3 rounded-lg text-sm ${m.autor === "Atendimento" ? "bg-primary/5 border-l-2 border-primary" : "bg-muted"}`}>
                    <div className="flex justify-between mb-1"><span className="font-medium text-xs">{m.autor}</span><span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{m.data}</span></div>
                    <p>{m.texto}</p>
                  </div>
                ))}
              </div>
              <div className="border-t-2 border-[#747474] pt-3 space-y-2">
                <Label className="text-xs">Responder</Label>
                <Textarea placeholder="Digite sua resposta..." value={resposta} onChange={e => setResposta(e.target.value)} />
                <Button size="sm" onClick={() => { toast.success("Resposta enviada"); setResposta(""); }}><Send className="h-4 w-4" />Enviar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Novo Chamado */}
      <Dialog open={showNovoChamado} onOpenChange={setShowNovoChamado}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Chamado</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Tipo</Label>
              <Select value={novoChamado.tipo} onValueChange={v => setNovoChamado({ ...novoChamado, tipo: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Sinistro">Sinistro</SelectItem><SelectItem value="Financeiro">Financeiro</SelectItem><SelectItem value="Cadastro">Cadastro</SelectItem><SelectItem value="Vistoria">Vistoria</SelectItem><SelectItem value="Outro">Outro</SelectItem></SelectContent></Select>
            </div>
            <div><Label className="text-xs">Assunto</Label><Input value={novoChamado.assunto} onChange={e => setNovoChamado({ ...novoChamado, assunto: e.target.value })} /></div>
            <div><Label className="text-xs">Descrição</Label><Textarea value={novoChamado.descricao} onChange={e => setNovoChamado({ ...novoChamado, descricao: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNovoChamado(false)}>Cancelar</Button><Button onClick={() => { toast.success("Chamado aberto com sucesso"); setShowNovoChamado(false); }}>Abrir Chamado</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
