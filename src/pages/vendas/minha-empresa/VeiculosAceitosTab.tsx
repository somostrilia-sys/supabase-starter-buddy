import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, Car, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function VeiculosAceitosTab() {
  const [marcas, setMarcas] = useState<any[]>([]);
  const [marcaSelecionada, setMarcaSelecionada] = useState("");
  const [modelos, setModelos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroAceito, setFiltroAceito] = useState("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("marcas_veiculo" as any).select("id, nome, ativa").order("nome")
      .then(({ data }) => { setMarcas(data || []); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!marcaSelecionada) { setModelos([]); return; }
    setLoading(true);
    let q = supabase.from("modelos_veiculo" as any).select("*").eq("marca_id", marcaSelecionada).order("nome");
    if (filtroAceito === "aceitos") q = q.eq("aceito", true);
    if (filtroAceito === "nao_aceitos") q = q.eq("aceito", false);
    q.then(({ data }) => { setModelos(data || []); setLoading(false); });
  }, [marcaSelecionada, filtroAceito]);

  const modelosFiltrados = busca
    ? modelos.filter(m => m.nome.toLowerCase().includes(busca.toLowerCase()) || m.cod_fipe?.includes(busca))
    : modelos;

  async function toggleAceito(modeloId: string, aceito: boolean) {
    await supabase.from("modelos_veiculo" as any).update({ aceito } as any).eq("id", modeloId);
    setModelos(prev => prev.map(m => m.id === modeloId ? { ...m, aceito } : m));
    toast.success(aceito ? "Veículo aceito" : "Veículo removido da aceitação");
  }

  const totalAceitos = modelos.filter(m => m.aceito).length;
  const totalNaoAceitos = modelos.filter(m => !m.aceito).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Veículos Aceitos</h3>
          <p className="text-xs text-muted-foreground">Gerencie marcas e modelos aceitos para proteção</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1"><CheckCircle className="h-3 w-3 text-success" />{marcas.filter(m => m.ativa).length} marcas ativas</Badge>
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={marcaSelecionada} onValueChange={v => setMarcaSelecionada(v || "")}>
          <SelectTrigger className="w-64 rounded-none"><SelectValue placeholder="Selecione uma marca" /></SelectTrigger>
          <SelectContent className="max-h-60">
            {marcas.map(m => (
              <SelectItem key={m.id} value={m.id}>
                <span className={m.ativa ? "" : "text-muted-foreground line-through"}>{m.nome}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar modelo ou cód. FIPE..." value={busca} onChange={e => setBusca(e.target.value)} className="rounded-none" />
        </div>

        <Select value={filtroAceito} onValueChange={v => setFiltroAceito(v || "todos")}>
          <SelectTrigger className="w-40 rounded-none"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="aceitos">Aceitos</SelectItem>
            <SelectItem value="nao_aceitos">Não aceitos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {marcaSelecionada && (
        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Car className="h-4 w-4" />
                {marcas.find(m => m.id === marcaSelecionada)?.nome} — {modelosFiltrados.length} modelos
              </CardTitle>
              <div className="flex gap-2">
                <Badge className="bg-success/10 text-success rounded-none text-xs">{totalAceitos} aceitos</Badge>
                <Badge className="bg-destructive/10 text-destructive rounded-none text-xs">{totalNaoAceitos} não aceitos</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Modelo</TableHead>
                    <TableHead className="text-xs">Cód. FIPE</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Planos</TableHead>
                    <TableHead className="text-xs text-center">Aceito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modelosFiltrados.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs">{m.nome}</TableCell>
                      <TableCell className="text-xs font-mono">{m.cod_fipe}</TableCell>
                      <TableCell className="text-xs">{m.tipo_veiculo}</TableCell>
                      <TableCell className="text-xs">{m.planos?.split(",").slice(0, 2).join(", ") || "—"}</TableCell>
                      <TableCell className="text-center">
                        <Switch checked={m.aceito} onCheckedChange={v => toggleAceito(m.id, v)} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {modelosFiltrados.length === 0 && !loading && (
                    <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">Nenhum modelo encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!marcaSelecionada && (
        <Card className="rounded-none">
          <CardContent className="py-12 text-center">
            <Car className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Selecione uma marca para gerenciar os modelos aceitos</p>
            <p className="text-xs text-muted-foreground mt-1">{marcas.length} marcas cadastradas • {marcas.filter(m => m.ativa).length} ativas</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
