import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle2, XCircle, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export default function Conferencia({ onBack }: { onBack: () => void }) {
  const [busca, setBusca] = useState("");
  const [filtroCooperativa, setFiltroCooperativa] = useState("todas");
  const [filtroRegional, setFiltroRegional] = useState("todas");

  // Load cooperativas from Supabase
  const { data: cooperativas = [] } = useQuery({
    queryKey: ["conferencia_cooperativas"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cooperativas")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return (data || []) as { id: string; nome: string }[];
    },
  });

  // Load regionais from Supabase
  const { data: regionais = [] } = useQuery({
    queryKey: ["conferencia_regionais"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("regionais")
        .select("id, nome")
        .order("nome");
      if (error) throw error;
      return (data || []) as { id: string; nome: string }[];
    },
  });

  // Load participantes (ativos)
  const { data: participantes = [], isLoading: loadingPart } = useQuery({
    queryKey: ["conferencia_participantes", filtroCooperativa, filtroRegional, busca],
    queryFn: async () => {
      let query = (supabase as any)
        .from("associados")
        .select("id, nome, cpf, status, cooperativa_id, regional_id")
        .eq("status", "ativo")
        .order("nome")
        .limit(100);

      if (filtroCooperativa !== "todas") {
        query = query.eq("cooperativa_id", filtroCooperativa);
      }
      if (filtroRegional !== "todas") {
        query = query.eq("regional_id", filtroRegional);
      }
      if (busca.trim()) {
        query = query.ilike("nome", `%${busca.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Load nao-participantes (inativos)
  const { data: naoParticipantes = [], isLoading: loadingNaoPart } = useQuery({
    queryKey: ["conferencia_nao_participantes", filtroCooperativa, filtroRegional, busca],
    queryFn: async () => {
      let query = (supabase as any)
        .from("associados")
        .select("id, nome, cpf, status, cooperativa_id, regional_id")
        .in("status", ["inativo", "inativo_pendencia", "inadimplente"])
        .order("nome")
        .limit(100);

      if (filtroCooperativa !== "todas") {
        query = query.eq("cooperativa_id", filtroCooperativa);
      }
      if (filtroRegional !== "todas") {
        query = query.eq("regional_id", filtroRegional);
      }
      if (busca.trim()) {
        query = query.ilike("nome", `%${busca.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const loading = loadingPart || loadingNaoPart;

  // Map cooperativa_id to name for display
  const coopMap = Object.fromEntries(cooperativas.map(c => [c.id, c.nome]));
  const regMap = Object.fromEntries(regionais.map(r => [r.id, r.nome]));

  const handleAlterarStatus = (id: string, novoStatus: string) => {
    toast.success(`Status alterado para "${novoStatus}"`);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h2 className="text-xl font-bold">Conferencia de Fechamento</h2>
            <p className="text-sm text-muted-foreground">Conferir participantes e manutencao de boletos</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Carregando dados...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl font-bold">Conferencia de Fechamento</h2>
          <p className="text-sm text-muted-foreground">Conferir participantes e manutencao de boletos</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-4 gap-3">
        <div><Label className="text-xs">Buscar</Label><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Nome do associado..." value={busca} onChange={e => setBusca(e.target.value)} /></div></div>
        <div><Label className="text-xs">Cooperativa</Label>
          <Select value={filtroCooperativa} onValueChange={setFiltroCooperativa}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {cooperativas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Regional</Label>
          <Select value={filtroRegional} onValueChange={setFiltroRegional}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {regionais.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="participantes">
        <TabsList>
          <TabsTrigger value="participantes" className="gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Participantes ({participantes.length})</TabsTrigger>
          <TabsTrigger value="nao-participantes" className="gap-1"><XCircle className="h-3.5 w-3.5" />Nao Participantes ({naoParticipantes.length})</TabsTrigger>
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
                    <TableHead>Regional</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participantes.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum participante encontrado.</TableCell></TableRow>
                  ) : participantes.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell className="font-mono text-xs">{p.cpf}</TableCell>
                      <TableCell className="text-sm">{coopMap[p.cooperativa_id] || "—"}</TableCell>
                      <TableCell className="text-sm">{regMap[p.regional_id] || "—"}</TableCell>
                      <TableCell><Badge variant="default">{p.status}</Badge></TableCell>
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
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Cooperativa</TableHead>
                    <TableHead>Regional</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {naoParticipantes.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum nao-participante encontrado.</TableCell></TableRow>
                  ) : naoParticipantes.map(n => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium">{n.nome}</TableCell>
                      <TableCell className="font-mono text-xs">{n.cpf}</TableCell>
                      <TableCell className="text-sm">{coopMap[n.cooperativa_id] || "—"}</TableCell>
                      <TableCell className="text-sm">{regMap[n.regional_id] || "—"}</TableCell>
                      <TableCell><Badge variant="destructive">{n.status}</Badge></TableCell>
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
