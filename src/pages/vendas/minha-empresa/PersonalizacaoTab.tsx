import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Save } from "lucide-react";

const mockDescontos = [
  { id: 1, tipo: "Adesão", tipoDesconto: "Percentual", valorMaximo: "15%" },
  { id: 2, tipo: "Mensalidade", tipoDesconto: "Valor Fixo", valorMaximo: "R$ 30,00" },
  { id: 3, tipo: "Cota Participação", tipoDesconto: "Percentual", valorMaximo: "10%" },
];

export default function PersonalizacaoTab() {
  const [subTab, setSubTab] = useState("configuracoes");

  // Configurações
  const [validadeCotacao, setValidadeCotacao] = useState("30");
  const [prazoBoleto, setPrazoBoleto] = useState("5");
  const [maxParcelas, setMaxParcelas] = useState("12");
  const [habImplementos, setHabImplementos] = useState(false);
  const [integAppVisto, setIntegAppVisto] = useState(false);
  const [bloquearPlacaDup, setBloquearPlacaDup] = useState(true);
  const [esconderOpcionais, setEsconderOpcionais] = useState(false);
  const [envioLaudo, setEnvioLaudo] = useState(true);
  const [trocaTitularidade, setTrocaTitularidade] = useState(false);
  const [limiteVistoria, setLimiteVistoria] = useState("7");
  const [selecaoConta, setSelecaoConta] = useState(false);

  // Nomenclaturas
  const [termoAdesao, setTermoAdesao] = useState("Adesão");
  const [termoRastreador, setTermoRastreador] = useState("Rastreador");
  const [termoCotacao, setTermoCotacao] = useState("Cotação");
  const [textoCotacao, setTextoCotacao] = useState("Prezado(a), segue sua cotação de proteção veicular conforme solicitado.");
  const [textoConfirmacao, setTextoConfirmacao] = useState("Pagamento confirmado! Seu veículo está protegido.");
  const [textoComprovante, setTextoComprovante] = useState("Comprovante de pagamento realizado com sucesso.");
  const [textoWhatsApp, setTextoWhatsApp] = useState("Olá %{clientName}! Sua cotação para o %{vehicleModel} está pronta. Acesse: %{link}");

  // Descontos modal
  const [showDescontoModal, setShowDescontoModal] = useState(false);
  const [tipoDesconto, setTipoDesconto] = useState("");
  const [tipoDescontoRegra, setTipoDescontoRegra] = useState("");
  const [valorMaxDesconto, setValorMaxDesconto] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Personalização</h3>
        <p className="text-sm text-muted-foreground">Configure parâmetros, nomenclaturas e regras de desconto</p>
      </div>

      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
          <TabsTrigger value="nomenclaturas">Nomenclaturas</TabsTrigger>
          <TabsTrigger value="descontos">Descontos</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracoes" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><Label>Validade da Cotação (dias)</Label><Input type="number" value={validadeCotacao} onChange={e => setValidadeCotacao(e.target.value)} /></div>
                <div><Label>Prazo Vencimento Boleto (dias)</Label><Input type="number" value={prazoBoleto} onChange={e => setPrazoBoleto(e.target.value)} /></div>
                <div><Label>Máx. Parcelas Cartão</Label><Input type="number" value={maxParcelas} onChange={e => setMaxParcelas(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Habilitar Implementos na Cotação", value: habImplementos, set: setHabImplementos },
                  { label: "Integração App Visto", value: integAppVisto, set: setIntegAppVisto },
                  { label: "Bloquear Placa Duplicada", value: bloquearPlacaDup, set: setBloquearPlacaDup },
                  { label: "Esconder Valor Opcionais", value: esconderOpcionais, set: setEsconderOpcionais },
                  { label: "Envio Automático Laudo Vistoria", value: envioLaudo, set: setEnvioLaudo },
                  { label: "Troca Titularidade Cotação", value: trocaTitularidade, set: setTrocaTitularidade },
                  { label: "Seleção Conta Bancária no envio SGA", value: selecaoConta, set: setSelecaoConta },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border">
                    <Label className="cursor-pointer">{item.label}</Label>
                    <Switch checked={item.value} onCheckedChange={item.set} />
                  </div>
                ))}
              </div>
              <div className="w-48">
                <Label>Data Limite Vistoria (dias)</Label>
                <Input type="number" value={limiteVistoria} onChange={e => setLimiteVistoria(e.target.value)} />
              </div>
              <Button className="gap-2"><Save className="h-4 w-4" /> Salvar Configurações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nomenclaturas" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><Label>Termo para Adesão</Label><Input value={termoAdesao} onChange={e => setTermoAdesao(e.target.value)} placeholder="Ex: Adesão, Taxa de Entrada" /></div>
                <div><Label>Termo para Rastreador</Label><Input value={termoRastreador} onChange={e => setTermoRastreador(e.target.value)} placeholder="Ex: Rastreador, Dispositivo" /></div>
                <div><Label>Termo para Cotação</Label><Input value={termoCotacao} onChange={e => setTermoCotacao(e.target.value)} placeholder="Ex: Cotação, Proposta" /></div>
              </div>
              <div><Label>Texto Cotação</Label><Textarea value={textoCotacao} onChange={e => setTextoCotacao(e.target.value)} rows={3} /></div>
              <div><Label>Texto Confirmação Pagamento</Label><Textarea value={textoConfirmacao} onChange={e => setTextoConfirmacao(e.target.value)} rows={3} /></div>
              <div><Label>Texto Comprovante Pagamento</Label><Textarea value={textoComprovante} onChange={e => setTextoComprovante(e.target.value)} rows={3} /></div>
              <div>
                <Label>Texto WhatsApp</Label>
                <Textarea value={textoWhatsApp} onChange={e => setTextoWhatsApp(e.target.value)} rows={3} />
                <p className="text-xs text-muted-foreground mt-1">Tags disponíveis: %&#123;clientName&#125;, %&#123;vehicleModel&#125;, %&#123;link&#125;</p>
              </div>
              <Button className="gap-2"><Save className="h-4 w-4" /> Salvar Nomenclaturas</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="descontos" className="mt-4">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setTipoDesconto(""); setTipoDescontoRegra(""); setValorMaxDesconto(""); setShowDescontoModal(true); }} className="gap-2">
                <Plus className="h-4 w-4" /> Nova Regra
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Tipo Desconto</TableHead>
                      <TableHead>Valor Máximo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockDescontos.map(d => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.tipo}</TableCell>
                        <TableCell><Badge variant="outline">{d.tipoDesconto}</Badge></TableCell>
                        <TableCell>{d.valorMaximo}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showDescontoModal} onOpenChange={setShowDescontoModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Regra de Desconto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={tipoDesconto} onValueChange={setTipoDesconto}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Adesão">Adesão</SelectItem>
                  <SelectItem value="Mensalidade">Mensalidade</SelectItem>
                  <SelectItem value="Cota Participação">Cota Participação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo Desconto</Label>
              <Select value={tipoDescontoRegra} onValueChange={setTipoDescontoRegra}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Percentual">Percentual</SelectItem>
                  <SelectItem value="Valor Fixo">Valor Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valor Máximo</Label><Input value={valorMaxDesconto} onChange={e => setValorMaxDesconto(e.target.value)} placeholder="Ex: 15% ou R$ 50,00" /></div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDescontoModal(false)}>Cancelar</Button>
              <Button onClick={() => setShowDescontoModal(false)}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
