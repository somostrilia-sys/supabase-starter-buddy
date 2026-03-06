import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClipboardCheck, Search, Send, CheckCircle, XCircle, Clock, Eye, MessageCircle, Mail, Smartphone } from "lucide-react";

const vistorias = [
  { id: 1, associado: "João Silva", veiculo: "Fiat Toro 2023", placa: "BRA2E19", status: "aprovada" as const, data: "2025-07-01", consultor: "Maria Santos" },
  { id: 2, associado: "Pedro Oliveira", veiculo: "VW Gol 2020", placa: "ABC1D23", status: "pendente" as const, data: "2025-07-03", consultor: "Carlos Lima" },
  { id: 3, associado: "Ana Costa", veiculo: "Hyundai HB20 2022", placa: "DEF4G56", status: "em_andamento" as const, data: "2025-07-04", consultor: "Maria Santos" },
  { id: 4, associado: "Carlos Lima", veiculo: "Toyota Corolla 2024", placa: "GHI7J89", status: "aguardando_analise" as const, data: "2025-07-05", consultor: "Fernanda Alves" },
  { id: 5, associado: "Marcos Souza", veiculo: "Chevrolet Onix 2021", placa: "JKL0M12", status: "reprovada" as const, data: "2025-07-02", consultor: "João Pedro" },
  { id: 6, associado: "Fernanda Lima", veiculo: "Renault Kwid 2023", placa: "NOP3Q45", status: "pendente" as const, data: "2025-07-06", consultor: "Ana Costa" },
  { id: 7, associado: "Ricardo Alves", veiculo: "Honda Civic 2022", placa: "RST6U78", status: "aprovada" as const, data: "2025-06-28", consultor: "Carlos Lima" },
  { id: 8, associado: "Juliana Martins", veiculo: "Jeep Renegade 2023", placa: "VWX9Y01", status: "aguardando_analise" as const, data: "2025-07-05", consultor: "Maria Santos" },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
  em_andamento: { label: "Em andamento", className: "bg-blue-100 text-blue-800" },
  aguardando_analise: { label: "Aguardando análise", className: "bg-purple-100 text-purple-800" },
  aprovada: { label: "Aprovada", className: "bg-green-100 text-green-800" },
  reprovada: { label: "Reprovada", className: "bg-red-100 text-red-800" },
};

const kpis = [
  { label: "Total Vistorias", value: vistorias.length, icon: ClipboardCheck, color: "text-[hsl(212_55%_40%)]", bg: "bg-[hsl(210_40%_95%)]" },
  { label: "Aprovadas", value: vistorias.filter(v => v.status === "aprovada").length, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  { label: "Reprovadas", value: vistorias.filter(v => v.status === "reprovada").length, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
  { label: "Pendentes", value: vistorias.filter(v => v.status === "pendente").length, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
];

export default function VistoriasVendas() {
  const [busca, setBusca] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const filtered = vistorias.filter(v =>
    !busca || v.associado.toLowerCase().includes(busca.toLowerCase()) || v.placa.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(212_35%_18%)] flex items-center justify-center shadow-md">
            <ClipboardCheck className="h-5 w-5 text-[hsl(210_55%_70%)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Vistoria Veicular</h1>
            <p className="text-sm text-muted-foreground">Controle de vistorias e aprovações</p>
          </div>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white">
              <Send className="h-4 w-4" />Enviar Link de Vistoria
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Enviar Link de Vistoria</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium">Associado</Label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar associado" /></SelectTrigger>
                  <SelectContent>
                    {vistorias.map(v => <SelectItem key={v.id} value={v.associado}>{v.associado}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Veículo</Label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar veículo" /></SelectTrigger>
                  <SelectContent>
                    {vistorias.map(v => <SelectItem key={v.id} value={v.veiculo}>{v.veiculo} - {v.placa}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Enviar via</Label>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" className="flex-1 gap-1.5 text-xs"><MessageCircle className="h-4 w-4 text-green-600" />WhatsApp</Button>
                  <Button variant="outline" className="flex-1 gap-1.5 text-xs"><Mail className="h-4 w-4 text-blue-600" />Email</Button>
                  <Button variant="outline" className="flex-1 gap-1.5 text-xs"><Smartphone className="h-4 w-4 text-purple-600" />SMS</Button>
                </div>
              </div>
              <Button className="w-full bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white" onClick={() => setModalOpen(false)}>Enviar Link</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="border-[hsl(210_30%_88%)]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-lg font-bold text-foreground">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card className="border-[hsl(210_30%_88%)]">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 border-[hsl(210_30%_85%)]" placeholder="Buscar por associado ou placa..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-[hsl(210_30%_88%)] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[hsl(212_35%_18%)] via-[hsl(212_35%_28%)] to-[hsl(210_40%_40%)]" />
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_18%)] border-b-0">
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Associado</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Veículo</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Placa</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Data</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Consultor</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v, i) => (
                <TableRow key={v.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-[hsl(210_30%_97%)]'} hover:bg-[hsl(210_40%_94%)] transition-colors border-b border-[hsl(210_30%_90%)]`}>
                  <TableCell className="font-medium">{v.associado}</TableCell>
                  <TableCell className="text-sm">{v.veiculo}</TableCell>
                  <TableCell><span className="font-mono text-sm bg-[hsl(210_30%_95%)] px-2 py-0.5 rounded">{v.placa}</span></TableCell>
                  <TableCell><Badge className={statusConfig[v.status].className}>{statusConfig[v.status].label}</Badge></TableCell>
                  <TableCell className="text-sm font-mono">{v.data}</TableCell>
                  <TableCell className="text-sm">{v.consultor}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-7 px-2"><Eye className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 py-3 bg-[hsl(210_30%_97%)] border-t border-[hsl(210_30%_90%)]">
            <span className="text-xs text-muted-foreground">{filtered.length} vistoria(s)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
