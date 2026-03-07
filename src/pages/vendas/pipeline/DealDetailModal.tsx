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
import AssociadoTab from "./AssociadoTab";
import CotacaoTab from "./CotacaoTab";
import VistoriaTab from "./VistoriaTab";
import AssinaturaTab from "./AssinaturaTab";
import FinanceiroNegociacaoTab from "./FinanceiroNegociacaoTab";
import {
  FileText, User, Car, ClipboardCheck, Send, Activity, PenTool, Wallet,
  Phone, Mail, MessageSquare, Video, Plus, Download, CheckCircle, XCircle,
  Clock, Image,
} from "lucide-react";

interface Props {
  deal: PipelineDeal;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const tipoIcons: Record<string, React.ElementType> = { "Ligação": Phone, Email: Mail, WhatsApp: MessageSquare, Reunião: Video, Visita: User };

const mockSGAHistory = [
  { campo: "Associado", status: "Enviado", data: "01/03/2026 14:30", erro: null },
  { campo: "Veículo", status: "Erro", data: "01/03/2026 14:31", erro: "Placa não encontrada" },
  { campo: "Financeiro", status: "Pendente", data: "—", erro: null },
];

export default function DealDetailModal({ deal, open, onOpenChange }: Props) {
  const [activeTab, setActiveTab] = useState("cotacao");

  const tabs = [
    { v: "cotacao", l: "Cotação", i: FileText },
    { v: "associado", l: "Associado", i: User },
    { v: "veiculo", l: "Veículo", i: Car },
    { v: "vistoria", l: "Vistoria", i: ClipboardCheck },
    { v: "assinatura", l: "Assinatura", i: PenTool },
    { v: "financeiro", l: "Financeiro", i: Wallet },
    { v: "sga", l: "SGA", i: Send },
    { v: "atividades", l: "Atividades", i: Activity },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] p-0 gap-0 overflow-hidden rounded-none">
        {/* Header com nome e código */}
        <DialogHeader className="px-6 pt-5 pb-3 border-b" style={{ backgroundColor: "#1A3A5C" }}>
          <DialogTitle className="flex items-center gap-3 text-white">
            <span className="font-['Source_Serif_4']">{deal.lead_nome}</span>
            <Badge variant="outline" className="text-[10px] font-mono border-white/30 text-white/80 rounded-none">{deal.codigo}</Badge>
            <Badge variant="outline" className="text-xs border-white/30 text-white/80 rounded-none">{deal.veiculo_modelo}</Badge>
            <Badge className="text-[10px] font-mono bg-white/15 text-white rounded-none">{deal.veiculo_placa}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-3 justify-start flex-wrap h-auto gap-1 bg-transparent p-0">
            {tabs.map(t => (
              <TabsTrigger key={t.v} value={t.v} className="text-xs gap-1.5 rounded-none data-[state=active]:bg-[#1A3A5C] data-[state=active]:text-white">
                <t.i className="h-3.5 w-3.5" />{t.l}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="flex-1 px-6 py-4">
            {/* TAB 1 - Cotação */}
            <TabsContent value="cotacao" className="mt-0">
              <CotacaoTab deal={deal} />
            </TabsContent>
            <TabsContent value="associado" className="mt-0">
              <AssociadoTab deal={deal} />
            </TabsContent>

            {/* TAB 3 - Veículo + planos + envio */}
            <TabsContent value="veiculo" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="font-['Source_Serif_4']">Placa</Label>
                  <div className="flex gap-2"><Input className="rounded-none font-['Source_Serif_4']" defaultValue={deal.veiculo_placa} /><Button size="sm" variant="outline" className="rounded-none">Buscar</Button></div>
                </div>
                <div className="space-y-1.5"><Label className="font-['Source_Serif_4']">Tipo Veículo</Label>
                  <Select defaultValue="auto"><SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="auto">Automóvel</SelectItem><SelectItem value="moto">Motocicleta</SelectItem><SelectItem value="caminhao">Caminhão</SelectItem></SelectContent>
                  </Select>
                </div>
                {[
                  ["Ano Fab.", "2022"], ["Ano Modelo", "2023"], ["Marca", "Honda"],
                  ["Modelo", deal.veiculo_modelo.split(" ")[1] || deal.veiculo_modelo],
                  ["Versão", "EXL 2.0"], ["Cor", "Prata"], ["Combustível", "Flex"],
                  ["Cód. FIPE", "015267-0"], ["Valor FIPE", "R$ 85.000,00"], ["Valor Protegido", "R$ 85.000,00"],
                ].map(([label, val]) => (
                  <div key={label} className="space-y-1.5">
                    <Label className="font-['Source_Serif_4']">{label}</Label>
                    <Input className="rounded-none font-['Source_Serif_4']" defaultValue={val} />
                  </div>
                ))}
                <div className="space-y-1.5"><Label className="font-['Source_Serif_4']">Chassi</Label>
                  <div className="flex gap-2"><Input className="rounded-none font-['Source_Serif_4']" defaultValue="9BWZZZ377VT004251" /><Badge variant="outline" className="rounded-none">Nacional</Badge></div>
                </div>
              </div>
              <div className="border-t pt-4 space-y-3">
                <h4 className="text-sm font-semibold font-['Source_Serif_4']">Envio para Sistemas</h4>
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-none bg-[#1A3A5C] hover:bg-[#15304D] text-white"><Send className="h-3.5 w-3.5 mr-1" />Enviar para SGA</Button>
                  <Button size="sm" variant="outline" className="rounded-none"><MessageSquare className="h-3.5 w-3.5 mr-1" />WhatsApp</Button>
                  <Button size="sm" variant="outline" className="rounded-none"><Mail className="h-3.5 w-3.5 mr-1" />E-mail</Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 4 - Vistoria */}
            <TabsContent value="vistoria" className="mt-0">
              <VistoriaTab deal={deal} />
            </TabsContent>

            {/* TAB 5 - Assinatura */}
            <TabsContent value="assinatura" className="mt-0">
              <AssinaturaTab deal={deal} />
            </TabsContent>

            {/* TAB 6 - Financeiro */}
            <TabsContent value="financeiro" className="mt-0">
              <FinanceiroNegociacaoTab deal={deal} />
            </TabsContent>

            {/* TAB 7 - SGA */}
            <TabsContent value="sga" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="font-['Source_Serif_4']">Regional SGA</Label>
                  <Select defaultValue={deal.regional}><SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                    <SelectContent>{["SP Capital", "Interior SP", "RJ", "MG"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="font-['Source_Serif_4']">Cooperativa SGA</Label>
                  <Select defaultValue={deal.cooperativa}><SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                    <SelectContent>{["Coop Norte", "Coop Sul", "Coop Leste"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="font-['Source_Serif_4']">Conta Bancária</Label>
                  <Select><SelectTrigger className="rounded-none"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent><SelectItem value="bb">Banco do Brasil - CC 12345-6</SelectItem><SelectItem value="itau">Itaú - CC 78901-2</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="font-['Source_Serif_4']">Vencimento Mensalidade</Label>
                  <Select><SelectTrigger className="rounded-none"><SelectValue placeholder="Dia" /></SelectTrigger>
                    <SelectContent>{[5,10,15,20,25].map(d => <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="font-['Source_Serif_4']">Forma Pagamento</Label>
                  <Select><SelectTrigger className="rounded-none"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent><SelectItem value="boleto">Boleto</SelectItem><SelectItem value="cartao">Cartão</SelectItem><SelectItem value="pix">PIX</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="rounded-none bg-[#1A3A5C] hover:bg-[#15304D] text-white"><Send className="h-3.5 w-3.5 mr-1" />Enviar para SGA</Button>
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs font-['Source_Serif_4']">Campo</TableHead>
                  <TableHead className="text-xs font-['Source_Serif_4']">Status</TableHead>
                  <TableHead className="text-xs font-['Source_Serif_4']">Data/Hora</TableHead>
                  <TableHead className="text-xs font-['Source_Serif_4']">Erro</TableHead>
                  <TableHead className="text-xs font-['Source_Serif_4']">Ação</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {mockSGAHistory.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm font-['Source_Serif_4']">{h.campo}</TableCell>
                      <TableCell><Badge variant={h.status === "Enviado" ? "default" : h.status === "Erro" ? "destructive" : "outline"} className="text-[10px] rounded-none">{h.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{h.data}</TableCell>
                      <TableCell className="text-xs text-destructive">{h.erro || "—"}</TableCell>
                      <TableCell>{h.status === "Erro" && <Button size="sm" variant="ghost" className="text-xs h-7 rounded-none">Reenviar</Button>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* TAB 6 - Atividades */}
            <TabsContent value="atividades" className="mt-0 space-y-4">
              <Button size="sm" className="rounded-none"><Plus className="h-3.5 w-3.5 mr-1" />Nova Atividade</Button>
              <div className="space-y-3">
                {mockActivities.map(a => {
                  const Icon = tipoIcons[a.tipo] || Activity;
                  return (
                    <div key={a.id} className="flex gap-3 items-start">
                      <div className="mt-1 w-8 h-8 bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 border-b pb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] rounded-none">{a.tipo}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(a.data).toLocaleDateString("pt-BR")} {new Date(a.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="text-sm mt-1 font-['Source_Serif_4']">{a.descricao}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">por {a.usuario}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
