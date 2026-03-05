import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Receipt, Search, Send } from "lucide-react";
import { mockCobrancas } from "./mockFinanceiro";
import { toast } from "sonner";

const statusCobranca: Record<string, string> = {
  em_dia: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  atrasado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  negativado: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  renegociado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
};

const enviosMock = [
  { id: 1, data: "2025-07-05 14:30", tipo: "E-mail", destinatario: "carlos@email.com", assunto: "Boleto 07/2025", status: "Entregue" },
  { id: 2, data: "2025-07-05 14:30", tipo: "E-mail", destinatario: "ana@email.com", assunto: "Boleto 07/2025", status: "Entregue" },
  { id: 3, data: "2025-07-04 09:00", tipo: "WhatsApp", destinatario: "(11) 98765-4321", assunto: "Lembrete de vencimento", status: "Lido" },
  { id: 4, data: "2025-07-03 11:15", tipo: "E-mail", destinatario: "pedro@email.com", assunto: "Boleto 06/2025 — 2ª via", status: "Falhou" },
];

export default function CobrancasRecibos({ onBack }: { onBack: () => void }) {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [showRecibo, setShowRecibo] = useState<typeof mockCobrancas[0] | null>(null);
  const [showEnviar, setShowEnviar] = useState(false);

  const filtered = mockCobrancas.filter(c => {
    if (filtroStatus !== "todos" && c.status !== filtroStatus) return false;
    if (busca && !c.associado.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl font-bold">Cobranças e Recibos</h2>
          <p className="text-sm text-muted-foreground">Gestão de cobranças, emissão de recibos e envio de boletos</p>
        </div>
      </div>

      <Tabs defaultValue="cobrancas">
        <TabsList>
          <TabsTrigger value="cobrancas">Cobranças</TabsTrigger>
          <TabsTrigger value="envios">Histórico de Envios</TabsTrigger>
        </TabsList>

        <TabsContent value="cobrancas" className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div><Label className="text-xs">Buscar</Label><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Nome..." value={busca} onChange={e => setBusca(e.target.value)} /></div></div>
            <div><Label className="text-xs">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="em_dia">Em dia</SelectItem><SelectItem value="atrasado">Atrasado</SelectItem><SelectItem value="negativado">Negativado</SelectItem><SelectItem value="renegociado">Renegociado</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-end"><Button className="gap-1" onClick={() => setShowEnviar(true)}><Mail className="h-4 w-4" />Enviar Boletos</Button></div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>ID</TableHead><TableHead>Associado</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead><TableHead>Ações</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.id}</TableCell>
                      <TableCell className="font-medium">{c.associado}</TableCell>
                      <TableCell className="text-sm">{c.tipo}</TableCell>
                      <TableCell className="text-right">R$ {c.valor.toFixed(2)}</TableCell>
                      <TableCell>{new Date(c.vencimento).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell><Badge className={statusCobranca[c.status]}>{c.status.replace("_", " ")}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowRecibo(c)}><Receipt className="h-3 w-3" />Recibo</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => toast.success(`Boleto enviado para ${c.associado}`)}><Send className="h-3 w-3" />Enviar</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="envios">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Data/Hora</TableHead><TableHead>Canal</TableHead><TableHead>Destinatário</TableHead><TableHead>Assunto</TableHead><TableHead>Status</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {enviosMock.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm">{e.data}</TableCell>
                      <TableCell><Badge variant="outline">{e.tipo}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{e.destinatario}</TableCell>
                      <TableCell>{e.assunto}</TableCell>
                      <TableCell><Badge className={e.status === "Falhou" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"}>{e.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recibo Dialog */}
      <Dialog open={!!showRecibo} onOpenChange={() => setShowRecibo(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Recibo de Pagamento</DialogTitle></DialogHeader>
          {showRecibo && (
            <div className="space-y-3 text-sm border rounded-lg p-4">
              <div className="text-center border-b pb-3">
                <p className="font-bold text-lg">RECIBO DE PAGAMENTO</p>
                <p className="text-muted-foreground text-xs">Associação de Proteção Veicular</p>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Associado:</span><span className="font-medium">{showRecibo.associado}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Referência:</span><span>{showRecibo.tipo}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Valor:</span><span className="font-bold text-green-600">R$ {showRecibo.valor.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Vencimento:</span><span>{new Date(showRecibo.vencimento).toLocaleDateString("pt-BR")}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Data emissão:</span><span>{new Date().toLocaleDateString("pt-BR")}</span></div>
              <div className="border-t pt-3 text-center text-xs text-muted-foreground">Documento gerado eletronicamente</div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setShowRecibo(null)}>Fechar</Button><Button onClick={() => { toast.success("Recibo emitido"); setShowRecibo(null); }}>Imprimir</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Envio em massa */}
      <Dialog open={showEnviar} onOpenChange={setShowEnviar}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enviar Boletos por E-mail</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">Selecione os filtros para envio em massa:</p>
            <div><Label className="text-xs">Template</Label>
              <Select defaultValue="padrao">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="padrao">Boleto Mensal — Padrão</SelectItem><SelectItem value="lembrete">Lembrete de Vencimento</SelectItem><SelectItem value="segunda_via">2ª Via de Boleto</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-between p-3 bg-muted rounded-lg"><span>Destinatários selecionados:</span><span className="font-bold">{filtered.length}</span></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowEnviar(false)}>Cancelar</Button><Button onClick={() => { toast.success(`${filtered.length} e-mails enviados`); setShowEnviar(false); }}>Enviar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
