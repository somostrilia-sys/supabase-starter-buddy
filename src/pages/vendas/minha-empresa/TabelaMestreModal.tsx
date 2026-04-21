import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Loader2, Save, Search, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  tabelaId: string;
  tabelaLabel?: string;
}

const ANOS_OPCOES = ["A partir de", "1981+", "1986+", "1990+", "1996+", "2000+", "2005+", "2010+", "2015+", "2020+"];

export default function TabelaMestreModal({ open, onClose, tabelaId, tabelaLabel }: Props) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("dados");
  const [marcaAtivaId, setMarcaAtivaId] = useState<string>("");
  const [buscaModelo, setBuscaModelo] = useState("");

  // Marcas com contagem de modelos + ano mínimo vigente na tabela
  const { data: marcas, isLoading: loadingMarcas } = useQuery({
    queryKey: ["tm-marcas", tabelaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marcas_veiculo" as any)
        .select("id, nome, tipo_veiculo, ativa")
        .eq("ativa", true)
        .order("nome");
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: open,
  });

  // Liberações existentes para esta tabela
  const { data: liberacoes } = useQuery({
    queryKey: ["tm-liberacoes", tabelaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tabela_mestre_modelos" as any)
        .select("*")
        .eq("tabela_id", tabelaId);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: open,
  });

  // Modelos da marca ativa
  const { data: modelos, isLoading: loadingModelos } = useQuery({
    queryKey: ["tm-modelos", marcaAtivaId],
    queryFn: async () => {
      if (!marcaAtivaId) return [];
      const { data, error } = await supabase
        .from("modelos_veiculo" as any)
        .select("id, nome, cod_fipe, tipo_veiculo")
        .eq("marca_id", marcaAtivaId)
        .eq("aceito", true)
        .order("nome");
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: open && !!marcaAtivaId,
  });

  // Mapa de liberados (modelo_id → row) e ano_minimo por marca
  const liberadosSet = useMemo(() => {
    const s = new Set<string>();
    (liberacoes || []).forEach((l: any) => { if (l.modelo_id && l.liberado) s.add(l.modelo_id); });
    return s;
  }, [liberacoes]);

  const anoMinPorMarca = useMemo(() => {
    const m: Record<string, string> = {};
    (liberacoes || []).forEach((l: any) => {
      if (l.marca_id && l.ano_minimo) m[l.marca_id] = `${l.ano_minimo}+`;
    });
    return m;
  }, [liberacoes]);

  const [anoLocalPorMarca, setAnoLocalPorMarca] = useState<Record<string, string>>({});
  useEffect(() => {
    if (Object.keys(anoMinPorMarca).length > 0) setAnoLocalPorMarca(anoMinPorMarca);
  }, [anoMinPorMarca]);

  const contagemPorMarca = useMemo(() => {
    const c: Record<string, number> = {};
    (liberacoes || []).forEach((l: any) => {
      if (l.marca_id && l.modelo_id && l.liberado) {
        c[l.marca_id] = (c[l.marca_id] || 0) + 1;
      }
    });
    return c;
  }, [liberacoes]);

  const modelosFiltrados = useMemo(() => {
    if (!modelos) return [];
    if (!buscaModelo) return modelos;
    const q = buscaModelo.toLowerCase();
    return modelos.filter(m =>
      (m.nome || "").toLowerCase().includes(q) ||
      (m.cod_fipe || "").toLowerCase().includes(q)
    );
  }, [modelos, buscaModelo]);

  const marcaAtivaObj = marcas?.find(m => m.id === marcaAtivaId);
  const totalMarcaAtiva = (modelos || []).length;
  const selecionadosMarcaAtiva = (modelos || []).filter(m => liberadosSet.has(m.id)).length;
  const todosSelecionados = totalMarcaAtiva > 0 && selecionadosMarcaAtiva === totalMarcaAtiva;

  async function toggleModelo(modeloId: string, liberar: boolean) {
    if (!marcaAtivaId) return;
    if (liberar) {
      const anoStr = anoLocalPorMarca[marcaAtivaId] || anoMinPorMarca[marcaAtivaId];
      const anoNum = anoStr ? parseInt(anoStr.replace("+", "")) || null : null;
      const { error } = await supabase.from("tabela_mestre_modelos" as any).upsert({
        tabela_id: tabelaId,
        marca_id: marcaAtivaId,
        modelo_id: modeloId,
        ano_minimo: anoNum,
        liberado: true,
      }, { onConflict: "tabela_id,modelo_id" });
      if (error) { toast.error(`Erro: ${error.message}`); return; }
    } else {
      const { error } = await supabase
        .from("tabela_mestre_modelos" as any)
        .delete()
        .eq("tabela_id", tabelaId)
        .eq("modelo_id", modeloId);
      if (error) { toast.error(`Erro: ${error.message}`); return; }
    }
    queryClient.invalidateQueries({ queryKey: ["tm-liberacoes", tabelaId] });
  }

  async function selecionarTodos(checked: boolean) {
    if (!marcaAtivaId || !modelos) return;
    if (checked) {
      const anoStr = anoLocalPorMarca[marcaAtivaId] || anoMinPorMarca[marcaAtivaId];
      const anoNum = anoStr ? parseInt(anoStr.replace("+", "")) || null : null;
      const rows = modelos.map((m: any) => ({
        tabela_id: tabelaId,
        marca_id: marcaAtivaId,
        modelo_id: m.id,
        ano_minimo: anoNum,
        liberado: true,
      }));
      const { error } = await supabase.from("tabela_mestre_modelos" as any).upsert(rows, { onConflict: "tabela_id,modelo_id" });
      if (error) { toast.error(`Erro: ${error.message}`); return; }
      toast.success(`${rows.length} modelos liberados`);
    } else {
      const { error } = await supabase
        .from("tabela_mestre_modelos" as any)
        .delete()
        .eq("tabela_id", tabelaId)
        .eq("marca_id", marcaAtivaId);
      if (error) { toast.error(`Erro: ${error.message}`); return; }
      toast.success("Liberações removidas desta marca");
    }
    queryClient.invalidateQueries({ queryKey: ["tm-liberacoes", tabelaId] });
  }

  async function setAnoMinimoMarca(marcaId: string, anoStr: string) {
    setAnoLocalPorMarca(prev => ({ ...prev, [marcaId]: anoStr }));
    const anoNum = anoStr === "A partir de" ? null : parseInt(anoStr.replace("+", "")) || null;
    // Atualizar ano_minimo em todos registros dessa marca nesta tabela
    await supabase.from("tabela_mestre_modelos" as any)
      .update({ ano_minimo: anoNum })
      .eq("tabela_id", tabelaId)
      .eq("marca_id", marcaId);
    queryClient.invalidateQueries({ queryKey: ["tm-liberacoes", tabelaId] });
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Tabela Mestre — {tabelaLabel || tabelaId}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-5 mx-1 mt-1 shrink-0">
            <TabsTrigger value="dados">1. Dados Gerais</TabsTrigger>
            <TabsTrigger value="marcas">2. Marcas</TabsTrigger>
            <TabsTrigger value="veiculos">3. Veículos (ano)</TabsTrigger>
            <TabsTrigger value="cotas">4. Tabela (cotas)</TabsTrigger>
            <TabsTrigger value="precos">5. Preços dos Planos</TabsTrigger>
          </TabsList>

          {/* Aba 1 — Dados Gerais (placeholder) */}
          <TabsContent value="dados" className="flex-1 overflow-y-auto p-4">
            <p className="text-sm text-muted-foreground">Dados gerais da tabela (nome, descrição, regional, tipo) — em construção.</p>
          </TabsContent>

          {/* Aba 2 — Marcas */}
          <TabsContent value="marcas" className="flex-1 overflow-y-auto p-4 space-y-3">
            <p className="text-sm text-muted-foreground">Marcas disponíveis para esta tabela ({marcas?.length || 0} marcas cadastradas).</p>
          </TabsContent>

          {/* Aba 3 — Veículos (ano): NÚCLEO DA ERRATA 2 */}
          <TabsContent value="veiculos" className="flex-1 overflow-hidden p-0">
            <div className="grid grid-cols-[320px_1fr] h-full">
              {/* COL ESQUERDA — MARCAS */}
              <div className="border-r bg-muted/20 overflow-y-auto">
                <div className="sticky top-0 bg-muted/40 px-3 py-2 border-b">
                  <p className="text-xs font-semibold">Categoria</p>
                  <Select defaultValue="selecione">
                    <SelectTrigger className="h-7 text-xs rounded-none mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="selecione">Selecione</SelectItem>
                      <SelectItem value="leves">Leves</SelectItem>
                      <SelectItem value="pesados">Pesados</SelectItem>
                      <SelectItem value="motos">Motos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {loadingMarcas ? (
                  <div className="flex items-center justify-center p-6"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : (marcas || []).length === 0 ? (
                  <div className="p-4 text-xs text-muted-foreground">Nenhuma marca cadastrada. Sincronize via consulta-fipe.</div>
                ) : (
                  <ul className="divide-y">
                    {(marcas || []).map((m: any) => {
                      const count = contagemPorMarca[m.id] || 0;
                      const ano = anoLocalPorMarca[m.id] || anoMinPorMarca[m.id] || "A partir de";
                      const ativa = m.id === marcaAtivaId;
                      return (
                        <li
                          key={m.id}
                          className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted ${ativa ? "bg-blue-50" : ""}`}
                          onClick={() => setMarcaAtivaId(m.id)}
                        >
                          <ChevronRight className={`h-3 w-3 transition-transform ${ativa ? "rotate-90" : ""}`} />
                          <span className={`text-sm flex-1 ${count > 0 ? "text-blue-600 font-semibold" : ""}`}>
                            {m.nome}
                          </span>
                          <span className="text-xs text-muted-foreground">({count})</span>
                          <Select value={ano} onValueChange={(v) => { setAnoMinimoMarca(m.id, v); }}>
                            <SelectTrigger className="h-6 w-20 text-[10px] rounded-none" onClick={e => e.stopPropagation()}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ANOS_OPCOES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* COL DIREITA — MODELOS DA MARCA ATIVA */}
              <div className="overflow-y-auto p-4">
                {!marcaAtivaId ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-sm gap-2">
                    <ChevronRight className="h-8 w-8 opacity-50" />
                    Clique em uma marca à esquerda para ver os modelos.
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <Checkbox
                        checked={todosSelecionados}
                        onCheckedChange={(v) => selecionarTodos(!!v)}
                      />
                      <Label className="text-sm font-semibold">Selecionar todos</Label>
                      <div className="ml-auto flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar modelo ou cód. FIPE..."
                          className="h-8 w-64 rounded-none"
                          value={buscaModelo}
                          onChange={e => setBuscaModelo(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="border rounded p-3 bg-card">
                      <div className="flex items-center gap-2 mb-3">
                        <Checkbox
                          checked={todosSelecionados}
                          onCheckedChange={(v) => selecionarTodos(!!v)}
                        />
                        <span className="text-sm font-bold">{marcaAtivaObj?.nome}</span>
                        <Badge variant="outline" className="text-xs">{selecionadosMarcaAtiva}/{totalMarcaAtiva}</Badge>
                      </div>

                      {loadingModelos ? (
                        <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
                      ) : modelosFiltrados.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">
                          Nenhum modelo cadastrado para esta marca. Rode a sincronização FIPE.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {modelosFiltrados.map((m: any) => {
                            const checked = liberadosSet.has(m.id);
                            return (
                              <label
                                key={m.id}
                                className={`flex items-start gap-2 p-2 rounded border cursor-pointer hover:bg-muted/40 ${checked ? "border-primary bg-primary/5" : "border-border"}`}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(v) => toggleModelo(m.id, !!v)}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 text-xs">
                                  <div className="font-medium">{m.nome}</div>
                                  {m.cod_fipe && (
                                    <div className="text-muted-foreground text-[10px] mt-0.5">
                                      Cód. FIPE: {m.cod_fipe}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    className="text-primary text-[10px] hover:underline mt-0.5"
                                    onClick={(e) => { e.preventDefault(); toast.info(`Ver tabelas para ${m.nome}`); }}
                                  >
                                    Ver tabelas
                                  </button>
                                </div>
                                {checked && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Aba 4 — Tabela (cotas) */}
          <TabsContent value="cotas" className="flex-1 overflow-y-auto p-4">
            <p className="text-sm text-muted-foreground">Cotas por faixa FIPE (integração com tabela_precos existente).</p>
          </TabsContent>

          {/* Aba 5 — Preços dos Planos */}
          <TabsContent value="precos" className="flex-1 overflow-y-auto p-4">
            <p className="text-sm text-muted-foreground">Preços dos planos.</p>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 p-3 border-t">
          <Button variant="outline" className="rounded-none" onClick={onClose}>Cancelar</Button>
          <Button className="rounded-none bg-[#1A3A5C] hover:bg-[#15304D] text-white" onClick={() => { toast.success("Alterações salvas"); onClose(); }}>
            <Save className="h-3.5 w-3.5 mr-1" />Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
