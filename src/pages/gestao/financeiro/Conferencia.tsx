import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle2, XCircle, Search } from "lucide-react";
import { cooperativas, regionais } from "./mockFinanceiro";
import { toast } from "sonner";

const participantes = [
  { id: 1, nome: "Carlos Eduardo Silva", cpf: "123.456.789-00", cooperativa: "Central SP", valor: 189.90, status: "pago" },
  { id: 2, nome: "Maria Fernanda Oliveira", cpf: "987.654.321-00", cooperativa: "Central SP", valor: 245.50, status: "pendente" },
  { id: 3, nome: "Fernanda Rodrigues", cpf: "789.123.456-00", cooperativa: "Oeste PR", valor: 198.30, status: "pago" },
  { id: 4, nome: "Ricardo Almeida", cpf: "147.258.369-00", cooperativa: "Central SP", valor: 342.10, status: "pendente" },
  { id: 5, nome: "José Roberto Santos", cpf: "456.789.123-00", cooperativa: "Norte MG", valor: 312.00, status: "pago" },
];

const naoParticipantes = [
  { id: 1, nome: "Pedro Henrique Lima", cpf: "654.321.987-00", cooperativa: "Norte MG", motivo: "Cancelado" },
  { id: 2, nome: "Luisa Mendes", cpf: "963.852.741-00", cooperativa: "Central RJ", motivo: "Suspenso" },
  { id: 3, nome: "Roberto Nascimento", cpf: "741.852.963-00", cooperativa: "Sul RS", motivo: "Inadimplente" },
];

export default function Conferencia({ onBack }: { onBack: () => void }) {
  const [busca, setBusca] = useState("");
  const [filtroCooperativa, setFiltroCooperativa] = useState("todas");

  const filteredP = participantes.filter(p => {
    if (filtroCooperativa !== "todas" && p.cooperativa !== filtroCooperativa) return false;
    if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const handleAlterarStatus = (id: number, novoStatus: string) => {
    toast.success(`Status do boleto alterado para "${novoStatus}"`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl font-bold">Conferência de Fechamento</h2>
          <p className="text-sm text-muted-foreground">Conferir participantes e manutenção de boletos</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div><Label className="text-xs">Buscar</Label><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Nome do associado..." value={busca} onChange={e => setBusca(e.target.value)} /></div></div>
        <div><Label className="text-xs">Cooperativa</Label>
          <Select value={filtroCooperativa} onValueChange={setFiltroCooperativa}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todas">Todas</SelectItem>{cooperativas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="participantes">
        <TabsList>
          <TabsTrigger value="participantes" className="gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Participantes ({filteredP.length})</TabsTrigger>
          <TabsTrigger value="nao-participantes" className="gap-1"><XCircle className="h-3.5 w-3.5" />Não Participantes ({naoParticipantes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="participantes">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Cooperativa</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredP.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell className="font-mono text-xs">{p.cpf}</TableCell>
                      <TableCell>{p.cooperativa}</TableCell>
                      <TableCell className="text-right">R$ {p.valor.toFixed(2)}</TableCell>
                      <TableCell><Badge variant={p.status === "pago" ? "default" : "secondary"}>{p.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAlterarStatus(p.id, "pago")}>Pago</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAlterarStatus(p.id, "cancelado")}>Cancelar</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAlterarStatus(p.id, "renegociado")}>Renegociar</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nao-participantes">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Nome</TableHead><TableHead>CPF</TableHead><TableHead>Cooperativa</TableHead><TableHead>Motivo</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {naoParticipantes.map(n => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium">{n.nome}</TableCell>
                      <TableCell className="font-mono text-xs">{n.cpf}</TableCell>
                      <TableCell>{n.cooperativa}</TableCell>
                      <TableCell><Badge variant="destructive">{n.motivo}</Badge></TableCell>
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
