import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Shield, MessageSquare, Phone, Send, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// No mock data - destinatarios should come from associados query when integrated
const mockDestinatarios: { id: string; nome: string; telefone: string; cpf: string; status: string }[] = [];

// No mock data - logs should come from a messaging/logs table when integrated
const mockLogs: { id: string; data: string; tipo: string; destinatario: string; status: string; msg: string }[] = [];

export default function Integracoes({ onBack }: { onBack: () => void }) {
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [mensagem, setMensagem] = useState("");

  const toggleSelecionado = (id: string) => {
    setSelecionados((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const handleEnviar = (tipo: string) => {
    if (selecionados.length === 0) { toast.error("Selecione ao menos um destinatário"); return; }
    if (!mensagem.trim()) { toast.error("Digite uma mensagem"); return; }
    toast.success(`${tipo} enviado para ${selecionados.length} destinatário(s)`);
    setSelecionados([]);
    setMensagem("");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl font-bold">Integrações</h2>
          <p className="text-sm text-muted-foreground">SPC/Serasa, SMS e WhatsApp</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><Shield className="h-5 w-5 text-warning" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold">SPC</p>
              <p className="text-xs text-muted-foreground">Consulta de crédito</p>
            </div>
            <Badge variant="outline" className="text-warning border-warning/30">Pendente</Badge>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><Shield className="h-5 w-5 text-warning" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Serasa</p>
              <p className="text-xs text-muted-foreground">Score e restrições</p>
            </div>
            <Badge variant="outline" className="text-warning border-warning/30">Pendente</Badge>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><MessageSquare className="h-5 w-5 text-success" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Mensageria</p>
              <p className="text-xs text-muted-foreground">SMS e WhatsApp</p>
            </div>
            <Badge variant="outline" className="text-success border-green-300">Ativo</Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="disparos">
        <TabsList>
          <TabsTrigger value="disparos">Disparar Mensagens</TabsTrigger>
          <TabsTrigger value="logs">Log de Disparos</TabsTrigger>
        </TabsList>

        <TabsContent value="disparos" className="space-y-4 mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">Mensagem</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Template</Label>
                <Select onValueChange={(v) => setMensagem(v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione um template ou escreva" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Prezado(a) associado(a), seu boleto referente ao mês vigente já está disponível. Acesse sua área do cliente para visualizar.">Boleto disponível</SelectItem>
                    <SelectItem value="Prezado(a) associado(a), sua vistoria foi agendada. Compareça no local indicado na data marcada.">Vistoria agendada</SelectItem>
                    <SelectItem value="Lembrete: seu boleto vence em 3 dias. Evite juros realizando o pagamento até a data de vencimento.">Lembrete de pagamento</SelectItem>
                    <SelectItem value="Bem-vindo(a) à nossa associação de proteção veicular! Qualquer dúvida, estamos à disposição.">Boas-vindas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={3} placeholder="Digite sua mensagem..." />
              <p className="text-xs text-muted-foreground">{mensagem.length}/160 caracteres</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Destinatários</CardTitle>
                <Badge variant="secondary">{selecionados.length} selecionados</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>CPF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDestinatarios.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">Nenhum destinatário disponível.</TableCell></TableRow>
                  ) : mockDestinatarios.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell><Checkbox checked={selecionados.includes(d.id)} onCheckedChange={() => toggleSelecionado(d.id)} /></TableCell>
                      <TableCell className="font-medium">{d.nome}</TableCell>
                      <TableCell className="font-mono text-xs">{d.telefone}</TableCell>
                      <TableCell className="font-mono text-xs">{d.cpf}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button onClick={() => handleEnviar("WhatsApp")} className="gap-1.5 bg-success hover:bg-success/90"><MessageSquare className="h-4 w-4" />Enviar WhatsApp</Button>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLogs.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">Nenhum registro de disparo encontrado.</TableCell></TableRow>
                  ) : mockLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs font-mono">{log.data}</TableCell>
                      <TableCell><Badge variant={log.tipo === "WhatsApp" ? "default" : "secondary"} className="text-xs">{log.tipo}</Badge></TableCell>
                      <TableCell>{log.destinatario}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{log.msg}</TableCell>
                      <TableCell>
                        {log.status === "Entregue" ? (
                          <span className="flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3 w-3" />{log.status}</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="h-3 w-3" />{log.status}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
