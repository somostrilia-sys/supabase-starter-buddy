import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PipelineDeal, mockActivities, planos } from "./mockData";
import {
  FileText, User, Car, ClipboardCheck, Send, Activity, CreditCard,
  Phone, Mail, MessageSquare, Video, Plus, Download, CheckCircle, XCircle,
  Clock, Image,
} from "lucide-react";

interface Props {
  deal: PipelineDeal;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const tiposAtividade = ["Ligação", "Visita", "Email", "WhatsApp", "Reunião"];
const tipoIcons: Record<string, React.ElementType> = { "Ligação": Phone, Email: Mail, WhatsApp: MessageSquare, Reunião: Video, Visita: User };

const mockPayments = [
  { tipo: "Boleto", valor: 289.9, status: "Pago", data: "28/02/2026", codigo: "23793.38128" },
  { tipo: "Cartão", valor: 289.9, status: "Pendente", data: "05/03/2026", codigo: "CARD-8821" },
];

const mockSGAHistory = [
  { campo: "Associado", status: "Enviado", data: "01/03/2026 14:30", erro: null },
  { campo: "Veículo", status: "Erro", data: "01/03/2026 14:31", erro: "Placa não encontrada" },
  { campo: "Financeiro", status: "Pendente", data: "—", erro: null },
];

export default function DealDetailModal({ deal, open, onOpenChange }: Props) {
  const [activeTab, setActiveTab] = useState("cotacao");
  const [cotacaoPronta, setCotacaoPronta] = useState(false);
  const [clienteAlteraPlano, setClienteAlteraPlano] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-3">
            <span>{deal.lead_nome}</span>
            <Badge variant="outline" className="text-xs">{deal.veiculo_modelo}</Badge>
            <Badge className="text-[10px] font-mono">{deal.veiculo_placa}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-3 justify-start flex-wrap h-auto gap-1 bg-transparent p-0">
            {[
              { v: "cotacao", l: "Cotação", i: FileText },
              { v: "associado", l: "Associado", i: User },
              { v: "veiculo", l: "Veículo", i: Car },
              { v: "vistoria", l: "Vistoria", i: ClipboardCheck },
              { v: "sga", l: "SGA", i: Send },
              { v: "atividades", l: "Atividades", i: Activity },
              { v: "pagamento", l: "Pagamento", i: CreditCard },
            ].map(t => (
              <TabsTrigger key={t.v} value={t.v} className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <t.i className="h-3.5 w-3.5" />{t.l}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="flex-1 px-6 py-4">
            {/* TAB 1 - Cotação */}
            <TabsContent value="cotacao" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Plano</Label>
                  <Select defaultValue={deal.plano}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{planos.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Valor FIPE</Label><Input defaultValue="R$ 85.000,00" /></div>
                <div className="space-y-1.5"><Label>Valor Protegido</Label><Input defaultValue="R$ 85.000,00" /></div>
                <div className="space-y-1.5"><Label>Cidade Circulação</Label><Input defaultValue="São Paulo - SP" /></div>
                <div className="space-y-1.5"><Label>Parcelas Adesão</Label><Input type="number" defaultValue={3} /></div>
                <div className="space-y-1.5"><Label>Desconto (%)</Label><Input type="number" defaultValue={0} /></div>
              </div>
              <div className="space-y-1.5"><Label>Opcionais/Implementos</Label>
                <div className="flex flex-wrap gap-2 text-xs">
                  {["Vidros", "Faróis", "Rodas Liga Leve", "Película", "Multimídia"].map(o => (
                    <label key={o} className="flex items-center gap-1.5 px-2 py-1 rounded border cursor-pointer hover:bg-muted">
                      <input type="checkbox" className="rounded" />{o}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5"><Label>Observação Interna</Label><Textarea rows={2} /></div>
              <div className="space-y-1.5"><Label>Observação Contrato</Label><Textarea rows={2} /></div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"><MessageSquare className="h-3.5 w-3.5 mr-1" />Enviar WhatsApp</Button>
                <Button size="sm" variant="outline"><Mail className="h-3.5 w-3.5 mr-1" />Enviar PDF Email</Button>
                <Button size="sm" variant="outline">Gerar Link</Button>
              </div>
              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2"><Switch checked={cotacaoPronta} onCheckedChange={setCotacaoPronta} /><span className="text-sm">Cotação Pronta / Comparativo</span></div>
                <div className="flex items-center gap-2"><Switch checked={clienteAlteraPlano} onCheckedChange={setClienteAlteraPlano} /><span className="text-sm">Cliente pode alterar plano</span></div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <span className="text-sm text-muted-foreground">Status Aceite:</span>
                <Badge variant="outline" className="text-amber-600 border-amber-300">Pendente</Badge>
              </div>
              <Button variant="outline"><Download className="h-3.5 w-3.5 mr-1" />Gerar Contrato PDF</Button>
            </TabsContent>

            {/* TAB 2 - Associado */}
            <TabsContent value="associado" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Nome</Label><Input defaultValue={deal.lead_nome} /></div>
                <div className="space-y-1.5"><Label>CPF/CNPJ</Label><Input defaultValue={deal.cpf_cnpj} /></div>
                <div className="space-y-1.5"><Label>RG</Label><Input defaultValue="12.345.678-9" /></div>
                <div className="space-y-1.5"><Label>Data Nascimento</Label><Input type="date" defaultValue="1990-05-15" /></div>
                <div className="space-y-1.5"><Label>Sexo</Label>
                  <Select defaultValue="M"><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="M">Masculino</SelectItem><SelectItem value="F">Feminino</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Celular/WhatsApp</Label><Input defaultValue={deal.telefone} /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input defaultValue={deal.email} /></div>
                <div className="space-y-1.5"><Label>CEP</Label><Input defaultValue="01310-100" /></div>
                <div className="col-span-2 space-y-1.5"><Label>Logradouro</Label><Input defaultValue="Av. Paulista" /></div>
                <div className="space-y-1.5"><Label>Número</Label><Input defaultValue="1000" /></div>
                <div className="space-y-1.5"><Label>Complemento</Label><Input defaultValue="Sala 301" /></div>
                <div className="space-y-1.5"><Label>Bairro</Label><Input defaultValue="Bela Vista" /></div>
                <div className="space-y-1.5"><Label>Cidade</Label><Input defaultValue="São Paulo" /></div>
                <div className="space-y-1.5"><Label>Estado</Label><Input defaultValue="SP" /></div>
                <div className="space-y-1.5"><Label>Data 1ª Habilitação</Label><Input type="date" defaultValue="2010-03-20" /></div>
              </div>
            </TabsContent>

            {/* TAB 3 - Veículo */}
            <TabsContent value="veiculo" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Placa</Label>
                  <div className="flex gap-2"><Input defaultValue={deal.veiculo_placa} /><Button size="sm" variant="outline">Buscar</Button></div>
                </div>
                <div className="space-y-1.5"><Label>Tipo Veículo</Label>
                  <Select defaultValue="auto"><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="auto">Automóvel</SelectItem><SelectItem value="moto">Motocicleta</SelectItem><SelectItem value="caminhao">Caminhão</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Ano Fab.</Label><Input defaultValue="2022" /></div>
                <div className="space-y-1.5"><Label>Ano Modelo</Label><Input defaultValue="2023" /></div>
                <div className="space-y-1.5"><Label>Marca</Label><Input defaultValue="Honda" /></div>
                <div className="space-y-1.5"><Label>Modelo</Label><Input defaultValue={deal.veiculo_modelo.split(" ")[1] || deal.veiculo_modelo} /></div>
                <div className="space-y-1.5"><Label>Versão</Label><Input defaultValue="EXL 2.0" /></div>
                <div className="space-y-1.5"><Label>Cor</Label><Input defaultValue="Prata" /></div>
                <div className="space-y-1.5"><Label>Combustível</Label><Input defaultValue="Flex" /></div>
                <div className="space-y-1.5"><Label>Chassi</Label>
                  <div className="flex gap-2"><Input defaultValue="9BWZZZ377VT004251" /><Badge variant="outline">Nacional</Badge></div>
                </div>
                <div className="space-y-1.5"><Label>Cód. FIPE</Label><Input defaultValue="015267-0" /></div>
                <div className="space-y-1.5"><Label>Valor FIPE</Label><Input defaultValue="R$ 85.000,00" /></div>
                <div className="space-y-1.5"><Label>Valor Protegido</Label><Input defaultValue="R$ 85.000,00" /></div>
              </div>
            </TabsContent>

            {/* TAB 4 - Vistoria */}
            <TabsContent value="vistoria" className="mt-0 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button size="sm"><ClipboardCheck className="h-3.5 w-3.5 mr-1" />Liberar Vistoria App Visto</Button>
                <Button size="sm" variant="outline">Vincular Vistoria Existente</Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Prazo Limite</Label>
                  <Select defaultValue="7"><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="3">3 dias</SelectItem><SelectItem value="7">7 dias</SelectItem><SelectItem value="15">15 dias</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Origem Lead</Label>
                  <Select defaultValue={deal.origem}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["WhatsApp", "Facebook", "Indicação", "Google", "Telefone"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Fotos da Vistoria</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center bg-muted/30">
                      <Image className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="h-3.5 w-3.5 mr-1" />Aprovar</Button>
                <Button size="sm" variant="destructive"><XCircle className="h-3.5 w-3.5 mr-1" />Reprovar</Button>
                <Button size="sm" variant="outline"><Download className="h-3.5 w-3.5 mr-1" />Download Laudo PDF</Button>
              </div>
            </TabsContent>

            {/* TAB 5 - SGA */}
            <TabsContent value="sga" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Regional SGA</Label>
                  <Select defaultValue={deal.regional}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["SP Capital", "Interior SP", "RJ", "MG"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Cooperativa SGA</Label>
                  <Select defaultValue={deal.cooperativa}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Coop Norte", "Coop Sul", "Coop Leste"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Conta Bancária</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent><SelectItem value="bb">Banco do Brasil - CC 12345-6</SelectItem><SelectItem value="itau">Itaú - CC 78901-2</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Vencimento Mensalidade</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger>
                    <SelectContent>{[5,10,15,20,25].map(d => <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Forma Pagamento</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent><SelectItem value="boleto">Boleto</SelectItem><SelectItem value="cartao">Cartão</SelectItem><SelectItem value="pix">PIX</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white"><Send className="h-3.5 w-3.5 mr-1" />Enviar para SGA</Button>
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs">Campo</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Data/Hora</TableHead><TableHead className="text-xs">Erro</TableHead><TableHead className="text-xs">Ação</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {mockSGAHistory.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{h.campo}</TableCell>
                      <TableCell><Badge variant={h.status === "Enviado" ? "default" : h.status === "Erro" ? "destructive" : "outline"} className="text-[10px]">{h.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{h.data}</TableCell>
                      <TableCell className="text-xs text-destructive">{h.erro || "—"}</TableCell>
                      <TableCell>{h.status === "Erro" && <Button size="sm" variant="ghost" className="text-xs h-7">Reenviar</Button>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* TAB 6 - Atividades */}
            <TabsContent value="atividades" className="mt-0 space-y-4">
              <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" />Nova Atividade</Button>
              <div className="space-y-3">
                {mockActivities.map(a => {
                  const Icon = tipoIcons[a.tipo] || Activity;
                  return (
                    <div key={a.id} className="flex gap-3 items-start">
                      <div className="mt-1 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 border-b pb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{a.tipo}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(a.data).toLocaleDateString("pt-BR")} {new Date(a.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="text-sm mt-1">{a.descricao}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">por {a.usuario}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* TAB 7 - Pagamento */}
            <TabsContent value="pagamento" className="mt-0 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button size="sm">Gerar Boleto</Button>
                <Button size="sm" variant="outline">Gerar Link Cartão</Button>
                <Button size="sm" variant="outline">Confirmar Pagamento Dinheiro</Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Vencimento Boleto</Label><Input type="date" /></div>
                <div className="space-y-1.5"><Label>Parcelas Cartão</Label><Input type="number" defaultValue={1} /></div>
                <div className="col-span-2 space-y-1.5"><Label>Código Pagamento</Label><Input /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"><MessageSquare className="h-3.5 w-3.5 mr-1" />Enviar Boleto WhatsApp</Button>
                <Button size="sm" variant="outline"><Mail className="h-3.5 w-3.5 mr-1" />Enviar Link Email</Button>
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs">Tipo</TableHead><TableHead className="text-xs">Valor</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Data</TableHead><TableHead className="text-xs">Código</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {mockPayments.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{p.tipo}</TableCell>
                      <TableCell className="text-sm font-medium">R$ {p.valor.toFixed(2).replace(".", ",")}</TableCell>
                      <TableCell><Badge variant={p.status === "Pago" ? "default" : "outline"} className={`text-[10px] ${p.status === "Pago" ? "bg-green-600" : ""}`}>{p.status}</Badge></TableCell>
                      <TableCell className="text-xs">{p.data}</TableCell>
                      <TableCell className="text-xs font-mono">{p.codigo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
