import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClipboardCheck, Search, Send, CheckCircle, XCircle, Clock, Eye, MessageCircle, Mail, Smartphone, Loader2 } from "lucide-react";

const statusConfig: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-warning/10 text-warning" },
  em_andamento: { label: "Em andamento", className: "bg-primary/8 text-primary" },
  aguardando_analise: { label: "Aguardando análise", className: "bg-accent/8 text-accent" },
  aprovada: { label: "Aprovada", className: "bg-success/10 text-success" },
  reprovada: { label: "Reprovada", className: "bg-destructive/8 text-destructive" },
};

function mapStatus(status: string): string {
  if (status === "em_aprovacao") return "em_andamento";
  return status;
}

async function fetchVistorias() {
  const { data, error } = await (supabase as any)
    .from("vistorias")
    .select("*, negociacoes!inner(lead_nome, veiculo_modelo, veiculo_placa, consultor)")
    .order("created_at", { ascending: false });

  if (error) {
    toast.error("Erro ao carregar vistorias: " + error.message);
    throw error;
  }

  return (data || []).map((v: any) => ({
    id: v.id,
    associado: v.negociacoes?.lead_nome || "—",
    veiculo: v.modelo || v.negociacoes?.veiculo_modelo || "—",
    placa: v.placa || v.negociacoes?.veiculo_placa || "—",
    status: mapStatus(v.status || "pendente"),
    data: v.created_at ? new Date(v.created_at).toLocaleDateString("pt-BR") : "—",
    consultor: v.negociacoes?.consultor || "—",
    tentativa: v.tentativa,
    token_publico: v.token_publico,
  }));
}

export default function VistoriasVendas() {
  const [busca, setBusca] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { data: vistorias = [], isLoading, isError } = useQuery({
    queryKey: ["vistorias-vendas"],
    queryFn: fetchVistorias,
  });

  const filtered = useMemo(
    () =>
      vistorias.filter(
        (v: any) =>
          !busca ||
          v.associado.toLowerCase().includes(busca.toLowerCase()) ||
          v.placa.toLowerCase().includes(busca.toLowerCase())
      ),
    [vistorias, busca]
  );

  const kpis = useMemo(
    () => [
      { label: "Total Vistorias", value: vistorias.length, icon: ClipboardCheck, color: "text-primary", bg: "bg-primary/8" },
      { label: "Aprovadas", value: vistorias.filter((v: any) => v.status === "aprovada").length, icon: CheckCircle, color: "text-success", bg: "bg-success/8" },
      { label: "Reprovadas", value: vistorias.filter((v: any) => v.status === "reprovada").length, icon: XCircle, color: "text-destructive", bg: "bg-destructive/8" },
      { label: "Pendentes", value: vistorias.filter((v: any) => v.status === "pendente").length, icon: Clock, color: "text-warning", bg: "bg-warning/8" },
    ],
    [vistorias]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md">
            <ClipboardCheck className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Vistoria Veicular</h1>
            <p className="text-sm text-muted-foreground">Controle de vistorias e aprovações</p>
          </div>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-white">
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
                    {vistorias.map((v: any) => <SelectItem key={v.id} value={v.associado}>{v.associado}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Veículo</Label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar veículo" /></SelectTrigger>
                  <SelectContent>
                    {vistorias.map((v: any) => <SelectItem key={v.id} value={v.veiculo}>{v.veiculo} - {v.placa}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Enviar via</Label>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" className="flex-1 gap-1.5 text-xs"><MessageCircle className="h-4 w-4 text-success" />WhatsApp</Button>
                  <Button variant="outline" className="flex-1 gap-1.5 text-xs"><Mail className="h-4 w-4 text-blue-600" />Email</Button>
                </div>
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90 text-white" onClick={() => setModalOpen(false)}>Enviar Link</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-lg font-bold text-foreground">{isLoading ? "—" : k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 border-border" placeholder="Buscar por associado ou placa..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Carregando vistorias...</span>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center py-16 text-destructive">
              <span className="text-sm">Erro ao carregar vistorias. Tente novamente.</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <ClipboardCheck className="h-8 w-8 opacity-40" />
              <span className="text-sm">{busca ? "Nenhuma vistoria encontrada para esta busca." : "Nenhuma vistoria cadastrada."}</span>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary border-b-0">
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Associado</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Veículo</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Placa</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Data</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Consultor</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((v: any, i: number) => (
                    <TableRow key={v.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'} hover:bg-muted/40 transition-colors border-b-2 border-[#747474]`}>
                      <TableCell className="font-medium">{v.associado}</TableCell>
                      <TableCell className="text-sm">{v.veiculo}</TableCell>
                      <TableCell><span className="font-mono text-sm bg-muted/50 px-2 py-0.5 rounded">{v.placa}</span></TableCell>
                      <TableCell>
                        <Badge className={statusConfig[v.status]?.className || "bg-muted text-muted-foreground"}>
                          {statusConfig[v.status]?.label || v.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-mono">{v.data}</TableCell>
                      <TableCell className="text-sm">{v.consultor}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7 px-2"><Eye className="h-3.5 w-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="px-4 py-3 bg-muted/30 border-t-2 border-[#747474]">
                <span className="text-xs text-muted-foreground">{filtered.length} vistoria(s)</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
