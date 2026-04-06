import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Car, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VeiculosAceitosTab() {
  const [marcas, setMarcas] = useState<any[]>([]);
  const [marcaSelecionada, setMarcaSelecionada] = useState("");
  const [modelos, setModelos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroAceito, setFiltroAceito] = useState("todos");
  const [loading, setLoading] = useState(true);
  // Busca global sem marca
  const [buscaGlobal, setBuscaGlobal] = useState<any[]>([]);
  const [buscaGlobalLoading, setBuscaGlobalLoading] = useState(false);
  // Dialog motivo rejeição
  const [rejeicaoDialog, setRejeicaoDialog] = useState<{ open: boolean; modeloId: string; modeloNome: string }>({ open: false, modeloId: "", modeloNome: "" });
  const [motivoRejeicao, setMotivoRejeicao] = useState("");

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

  // Busca global: quando tem texto e marca NÃO selecionada
  useEffect(() => {
    if (marcaSelecionada || busca.length < 2) { setBuscaGlobal([]); return; }
    const timer = setTimeout(async () => {
      setBuscaGlobalLoading(true);
      const { data } = await supabase.from("modelos_veiculo" as any)
        .select("*, marcas_veiculo(nome)")
        .ilike("nome", `%${busca}%`)
        .order("nome")
        .limit(50);
      setBuscaGlobal(data || []);
      setBuscaGlobalLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [busca, marcaSelecionada]);

  const modelosFiltrados = busca && marcaSelecionada
    ? modelos.filter(m => m.nome.toLowerCase().includes(busca.toLowerCase()) || m.cod_fipe?.includes(busca))
    : modelos;

  // Resultados a exibir: busca global ou filtrados por marca
  const resultados = !marcaSelecionada && busca.length >= 2 ? buscaGlobal : modelosFiltrados;
  const mostrandoBuscaGlobal = !marcaSelecionada && busca.length >= 2;

  async function toggleAceito(modeloId: string, aceito: boolean, modeloNome?: string) {
    if (!aceito) {
      // Pedir motivo ao retirar aceitação
      setRejeicaoDialog({ open: true, modeloId, modeloNome: modeloNome || "" });
      return;
    }
    await supabase.from("modelos_veiculo" as any).update({ aceito: true, motivo_rejeicao: null } as any).eq("id", modeloId);
    // Atualizar ambas as listas
    setModelos(prev => prev.map(m => m.id === modeloId ? { ...m, aceito: true, motivo_rejeicao: null } : m));
    setBuscaGlobal(prev => prev.map(m => m.id === modeloId ? { ...m, aceito: true, motivo_rejeicao: null } : m));
    toast.success("Veículo aceito");
  }

  async function confirmarRejeicao() {
    if (!motivoRejeicao.trim()) { toast.error("Informe o motivo"); return; }
    await supabase.from("modelos_veiculo" as any).update({ aceito: false, motivo_rejeicao: motivoRejeicao } as any).eq("id", rejeicaoDialog.modeloId);
    setModelos(prev => prev.map(m => m.id === rejeicaoDialog.modeloId ? { ...m, aceito: false, motivo_rejeicao: motivoRejeicao } : m));
    setBuscaGlobal(prev => prev.map(m => m.id === rejeicaoDialog.modeloId ? { ...m, aceito: false, motivo_rejeicao: motivoRejeicao } : m));
    toast.success("Veículo removido da aceitação");
    setRejeicaoDialog({ open: false, modeloId: "", modeloNome: "" });
    setMotivoRejeicao("");
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
        <Select value={marcaSelecionada} onValueChange={v => setMarcaSelecionada(v === "__clear__" ? "" : (v || ""))}>
          <SelectTrigger className="w-64 rounded-none"><SelectValue placeholder="Selecione uma marca (ou busque direto)" /></SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="__clear__">Todas as marcas</SelectItem>
            {marcas.map(m => (
              <SelectItem key={m.id} value={m.id}>
                <span className={m.ativa ? "" : "text-muted-foreground line-through"}>{m.nome}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar modelo ou cód. FIPE (funciona sem selecionar marca)..." value={busca} onChange={e => setBusca(e.target.value)} className="rounded-none" />
          {buscaGlobalLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
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

      {/* Resultados: busca global OU marca selecionada */}
      {(marcaSelecionada || mostrandoBuscaGlobal) && (
        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Car className="h-4 w-4" />
                {mostrandoBuscaGlobal
                  ? `Resultados para "${busca}" — ${resultados.length} modelos`
                  : `${marcas.find(m => m.id === marcaSelecionada)?.nome} — ${resultados.length} modelos`
                }
              </CardTitle>
              {marcaSelecionada && (
                <div className="flex gap-2">
                  <Badge className="bg-success/10 text-success rounded-none text-xs">{totalAceitos} aceitos</Badge>
                  <Badge className="bg-destructive/10 text-destructive rounded-none text-xs">{totalNaoAceitos} não aceitos</Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Modelo</TableHead>
                    {mostrandoBuscaGlobal && <TableHead className="text-xs">Marca</TableHead>}
                    <TableHead className="text-xs">Cód. FIPE</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Planos</TableHead>
                    <TableHead className="text-xs text-center">Aceito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultados.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs font-medium">{m.nome}</TableCell>
                      {mostrandoBuscaGlobal && <TableCell className="text-xs text-muted-foreground">{m.marcas_veiculo?.nome || "—"}</TableCell>}
                      <TableCell className="text-xs font-mono">{m.cod_fipe}</TableCell>
                      <TableCell className="text-xs">{m.tipo_veiculo}</TableCell>
                      <TableCell className="text-xs">{m.planos?.split(",").slice(0, 2).join(", ") || "—"}</TableCell>
                      <TableCell className="text-center">
                        <Switch checked={m.aceito} onCheckedChange={v => toggleAceito(m.id, v, m.nome)} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {resultados.length === 0 && !loading && !buscaGlobalLoading && (
                    <TableRow><TableCell colSpan={mostrandoBuscaGlobal ? 6 : 5} className="text-center text-xs text-muted-foreground py-8">Nenhum modelo encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!marcaSelecionada && !mostrandoBuscaGlobal && (
        <Card className="rounded-none">
          <CardContent className="py-12 text-center">
            <Car className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Selecione uma marca ou busque diretamente por modelo</p>
            <p className="text-xs text-muted-foreground mt-1">{marcas.length} marcas cadastradas • {marcas.filter(m => m.ativa).length} ativas</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog motivo rejeição */}
      <Dialog open={rejeicaoDialog.open} onOpenChange={o => { if (!o) { setRejeicaoDialog({ open: false, modeloId: "", modeloNome: "" }); setMotivoRejeicao(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remover aceitação — {rejeicaoDialog.modeloNome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-sm font-semibold text-gray-700 block">Motivo da rejeição</label>
            <Input
              className="rounded-none"
              placeholder="Ex: Modelo descontinuado, alta sinistralidade..."
              value={motivoRejeicao}
              onChange={e => setMotivoRejeicao(e.target.value)}
              onKeyDown={e => e.key === "Enter" && confirmarRejeicao()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-none" onClick={() => { setRejeicaoDialog({ open: false, modeloId: "", modeloNome: "" }); setMotivoRejeicao(""); }}>Cancelar</Button>
            <Button className="rounded-none bg-destructive hover:bg-destructive/90 text-white" onClick={confirmarRejeicao} disabled={!motivoRejeicao.trim()}>
              <XCircle className="h-3.5 w-3.5 mr-1" />Remover Aceitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
