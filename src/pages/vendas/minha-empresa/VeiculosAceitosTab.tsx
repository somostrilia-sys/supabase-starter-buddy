import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Car, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function VeiculosAceitosTab() {
  const [marcas, setMarcas] = useState<any[]>([]);
  const [marcaSelecionada, setMarcaSelecionada] = useState("");
  const [modelos, setModelos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroAceito, setFiltroAceito] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [buscaGlobal, setBuscaGlobal] = useState<any[]>([]);
  const [buscaGlobalLoading, setBuscaGlobalLoading] = useState(false);
  const [motivoModal, setMotivoModal] = useState<{ modeloId: string; nome: string } | null>(null);
  const [motivoTexto, setMotivoTexto] = useState("");

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

  // Busca global sem marca
  const buscarGlobal = useCallback(async (termo: string) => {
    if (termo.length < 2) { setBuscaGlobal([]); return; }
    setBuscaGlobalLoading(true);
    const { data } = await supabase.from("modelos_veiculo" as any)
      .select("*, marcas_veiculo:marca_id(nome)")
      .ilike("nome", `%${termo}%`)
      .limit(50)
      .order("nome");
    setBuscaGlobal(data || []);
    setBuscaGlobalLoading(false);
  }, []);

  // Debounce busca global
  useEffect(() => {
    if (!busca || marcaSelecionada) { setBuscaGlobal([]); return; }
    const t = setTimeout(() => buscarGlobal(busca), 300);
    return () => clearTimeout(t);
  }, [busca, marcaSelecionada, buscarGlobal]);

  const modelosFiltrados = busca
    ? modelos.filter(m => m.nome.toLowerCase().includes(busca.toLowerCase()) || m.cod_fipe?.includes(busca))
    : modelos;

  async function toggleAceito(modeloId: string, aceito: boolean, nome?: string) {
    if (!aceito) {
      // Pedir motivo ao desativar
      setMotivoModal({ modeloId, nome: nome || "" });
      return;
    }
    await supabase.from("modelos_veiculo" as any).update({ aceito, motivo_rejeicao: null } as any).eq("id", modeloId);
    setModelos(prev => prev.map(m => m.id === modeloId ? { ...m, aceito, motivo_rejeicao: null } : m));
    setBuscaGlobal(prev => prev.map(m => m.id === modeloId ? { ...m, aceito, motivo_rejeicao: null } : m));
    toast.success("Veículo aceito");
  }

  async function confirmarRejeicao() {
    if (!motivoModal) return;
    await supabase.from("modelos_veiculo" as any).update({ aceito: false, motivo_rejeicao: motivoTexto || null } as any).eq("id", motivoModal.modeloId);
    setModelos(prev => prev.map(m => m.id === motivoModal.modeloId ? { ...m, aceito: false, motivo_rejeicao: motivoTexto } : m));
    setBuscaGlobal(prev => prev.map(m => m.id === motivoModal.modeloId ? { ...m, aceito: false, motivo_rejeicao: motivoTexto } : m));
    toast.success("Veículo removido da aceitação");
    setMotivoModal(null);
    setMotivoTexto("");
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
                        <Switch checked={m.aceito} onCheckedChange={v => toggleAceito(m.id, v, m.nome)} />
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

      {/* Busca global sem marca */}
      {!marcaSelecionada && busca.length >= 2 && (
        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="h-4 w-4" />
              Resultados para "{busca}" — {buscaGlobal.length} modelos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {buscaGlobalLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Buscando...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Modelo</TableHead>
                      <TableHead className="text-xs">Marca</TableHead>
                      <TableHead className="text-xs">Cód. FIPE</TableHead>
                      <TableHead className="text-xs">Tipo</TableHead>
                      <TableHead className="text-xs text-center">Aceito</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buscaGlobal.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="text-xs">{m.nome}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{(m.marcas_veiculo as any)?.nome || "—"}</TableCell>
                        <TableCell className="text-xs font-mono">{m.cod_fipe}</TableCell>
                        <TableCell className="text-xs">{m.tipo_veiculo}</TableCell>
                        <TableCell className="text-center">
                          <Switch checked={m.aceito} onCheckedChange={v => toggleAceito(m.id, v, m.nome)} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {buscaGlobal.length === 0 && !buscaGlobalLoading && (
                      <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">Nenhum modelo encontrado</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!marcaSelecionada && busca.length < 2 && (
        <Card className="rounded-none">
          <CardContent className="py-12 text-center">
            <Car className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Selecione uma marca ou busque um modelo pelo nome</p>
            <p className="text-xs text-muted-foreground mt-1">{marcas.length} marcas cadastradas • {marcas.filter(m => m.ativa).length} ativas</p>
          </CardContent>
        </Card>
      )}

      {/* Modal de motivo de rejeição */}
      <Dialog open={!!motivoModal} onOpenChange={(o) => { if (!o) { setMotivoModal(null); setMotivoTexto(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Motivo da rejeição</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Retirar aceitação de: <strong>{motivoModal?.nome}</strong></p>
            <Input
              placeholder="Motivo da rejeição..."
              value={motivoTexto}
              onChange={e => setMotivoTexto(e.target.value)}
              className="rounded-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-none" onClick={() => { setMotivoModal(null); setMotivoTexto(""); }}>Cancelar</Button>
            <Button className="rounded-none bg-destructive hover:bg-destructive/90 text-white" onClick={confirmarRejeicao}>Confirmar Rejeição</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
