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

  // Rows de tabela_precos vinculados a esta tabela_id
  // Usado nas abas 4 (Tabela/cotas) e 5 (Preços dos Planos)
  const { data: precosRows } = useQuery({
    queryKey: ["tm-precos", tabelaId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("tabela_precos")
        .select("*")
        .eq("tabela_id", tabelaId)
        .order("valor_menor")
        .order("plano");
      if (error) return [];
      return data || [];
    },
    enabled: open,
  });

  const fmt = (v: number | null | undefined) =>
    v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Modelos da marca ativa — trazer TODOS (aceitos ou não) e diferenciar visualmente.
  // Antes filtrava .eq("aceito", true), escondendo ~1342 modelos e deixando várias marcas
  // com aparência de "sem dados" (Acura, ADLY, Alfa Romeo, etc).
  const { data: modelos, isLoading: loadingModelos } = useQuery({
    queryKey: ["tm-modelos", marcaAtivaId],
    queryFn: async () => {
      if (!marcaAtivaId) return [];
      const { data, error } = await supabase
        .from("modelos_veiculo" as any)
        .select("id, nome, cod_fipe, tipo_veiculo, aceito")
        .eq("marca_id", marcaAtivaId)
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
      <DialogContent className="max-w-5xl h-[92vh] max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-4 pb-2 shrink-0 border-b">
          <DialogTitle>Editar Tabela Mestre — {tabelaLabel || tabelaId}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 overflow-hidden flex flex-col min-h-0">
          <TabsList className="grid grid-cols-5 mx-1 mt-1 shrink-0">
            <TabsTrigger value="dados">1. Dados Gerais</TabsTrigger>
            <TabsTrigger value="marcas">2. Marcas</TabsTrigger>
            <TabsTrigger value="veiculos">3. Veículos (ano)</TabsTrigger>
            <TabsTrigger value="cotas">4. Tabela (cotas)</TabsTrigger>
            <TabsTrigger value="precos">5. Preços dos Planos</TabsTrigger>
          </TabsList>

          {/* Aba 1 — Dados Gerais (read-only, derivado de tabela_precos) */}
          <TabsContent value="dados" className="flex-1 overflow-y-auto p-4 space-y-4">
            {(() => {
              const primeiro = precosRows?.[0];
              const planosUnicos = [...new Set((precosRows || []).map((r: any) => r.plano))];
              const faixas = new Set((precosRows || []).map((r: any) => `${r.valor_menor}-${r.valor_maior}`)).size;
              return (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Identificador</Label>
                      <p className="text-sm font-mono">{tabelaId}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Label</Label>
                      <p className="text-sm">{tabelaLabel || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Regional</Label>
                      <p className="text-sm">{primeiro?.regional || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Tipo Veículo</Label>
                      <p className="text-sm">{primeiro?.tipo_veiculo || "—"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <Label className="text-xs text-muted-foreground">Total de rows</Label>
                      <p className="text-lg font-semibold">{precosRows?.length || 0}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Planos distintos</Label>
                      <p className="text-lg font-semibold">{planosUnicos.length}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Faixas FIPE</Label>
                      <p className="text-lg font-semibold">{faixas}</p>
                    </div>
                  </div>
                  {planosUnicos.length > 0 && (
                    <div className="pt-4 border-t">
                      <Label className="text-xs text-muted-foreground">Planos vinculados</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {planosUnicos.map(p => <Badge key={p as string} variant="secondary" className="text-xs">{p as string}</Badge>)}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground pt-4 border-t">
                    Tabela derivada dos registros em <code>tabela_precos</code> com <code>tabela_id = {tabelaId}</code>.
                    Edição de metadados não está disponível nesta versão — as liberações de modelos são feitas na aba 3.
                  </p>
                </>
              );
            })()}
          </TabsContent>

          {/* Aba 2 — Marcas (lista com contador de modelos liberados nesta tabela) */}
          <TabsContent value="marcas" className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{marcas?.length || 0} marcas cadastradas</p>
              <Badge variant="outline" className="text-xs">
                {Object.values(contagemPorMarca).reduce((a, b) => a + b, 0)} modelos liberados
              </Badge>
            </div>
            {loadingMarcas ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="h-4 w-4 animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(marcas || []).map((m: any) => {
                  const count = contagemPorMarca[m.id] || 0;
                  return (
                    <div key={m.id} className={`flex items-center gap-2 p-2 rounded border ${count > 0 ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                      <CheckCircle2 className={`h-3.5 w-3.5 ${count > 0 ? "text-primary" : "text-muted-foreground/30"}`} />
                      <span className="text-xs font-medium flex-1 truncate">{m.nome}</span>
                      <Badge variant="outline" className="text-[10px]">{count}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground pt-3 border-t">
              Para liberar/desvincular modelos por marca, use a aba <strong>3. Veículos (ano)</strong>.
            </p>
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
                            <SelectTrigger className="h-6 w-28 text-[10px] rounded-none" onClick={e => e.stopPropagation()}>
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
                          {buscaModelo
                            ? `Nenhum modelo de ${marcaAtivaObj?.nome} corresponde a "${buscaModelo}".`
                            : `Nenhum modelo cadastrado para ${marcaAtivaObj?.nome}. Rode a sincronização FIPE.`}
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {modelosFiltrados.map((m: any) => {
                            const checked = liberadosSet.has(m.id);
                            const naoAceito = m.aceito === false;
                            return (
                              <label
                                key={m.id}
                                title={naoAceito ? "Modelo marcado como não aceito em modelos_veiculo" : ""}
                                className={`flex items-start gap-2 p-2 rounded border cursor-pointer hover:bg-muted/40 ${checked ? "border-primary bg-primary/5" : naoAceito ? "border-amber-300 bg-amber-50/50" : "border-border"}`}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(v) => toggleModelo(m.id, !!v)}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 text-xs">
                                  <div className={`font-medium ${naoAceito ? "text-amber-700" : ""}`}>
                                    {m.nome}
                                    {naoAceito && <span className="ml-1 text-[9px] bg-amber-200 text-amber-900 px-1 rounded">não aceito</span>}
                                  </div>
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

          {/* Aba 4 — Tabela (cotas) — faixas FIPE com Adesão/Franquia/Rastreador (SEM preço base) */}
          <TabsContent value="cotas" className="flex-1 overflow-y-auto p-4">
            {!precosRows || precosRows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhuma faixa FIPE cadastrada para esta tabela.</p>
            ) : (() => {
              // Dedup por faixa (valor_menor-valor_maior) — mostra 1 linha por intervalo
              const faixas = new Map<string, any>();
              for (const r of precosRows) {
                const key = `${r.valor_menor}-${r.valor_maior}`;
                if (!faixas.has(key)) faixas.set(key, r);
              }
              const ordenadas = Array.from(faixas.entries())
                .sort(([a], [b]) => Number(a.split("-")[0]) - Number(b.split("-")[0]));
              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-xs text-muted-foreground">
                        <th className="text-left py-2 px-2">Intervalo FIPE</th>
                        <th className="text-center py-2 px-2">Adesão</th>
                        <th className="text-center py-2 px-2">Franquia</th>
                        <th className="text-center py-2 px-2">Rastreador</th>
                        <th className="text-center py-2 px-2">Instalação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordenadas.map(([key, r]) => (
                        <tr key={key} className="border-b">
                          <td className="py-2 px-2 font-mono text-xs whitespace-nowrap">{fmt(r.valor_menor)} — {fmt(r.valor_maior)}</td>
                          <td className="py-2 px-2 text-xs text-center">{fmt(r.adesao)}</td>
                          <td className="py-2 px-2 text-xs text-center whitespace-nowrap">
                            {r.tipo_franquia ? `${r.tipo_franquia} ${fmt(r.valor_franquia)}` : "—"}
                          </td>
                          <td className="py-2 px-2 text-xs text-center">{r.rastreador || "—"}</td>
                          <td className="py-2 px-2 text-xs text-center">{fmt(r.instalacao)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-muted-foreground mt-3">
                    {ordenadas.length} intervalos FIPE. Mensalidades por plano disponíveis na aba <strong>5. Preços dos Planos</strong>.
                  </p>
                </div>
              );
            })()}
          </TabsContent>

          {/* Aba 5 — Preços dos Planos (pivot estilo Power CRM Tab 5) */}
          <TabsContent value="precos" className="flex-1 overflow-y-auto p-4">
            {!precosRows || precosRows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhum preço cadastrado para esta tabela.</p>
            ) : (() => {
              const planosUnicos = [...new Set(precosRows.map((r: any) => r.plano))].sort();
              const faixasMap = new Map<string, Record<string, any>>();
              for (const r of precosRows) {
                const key = `${r.valor_menor}-${r.valor_maior}`;
                if (!faixasMap.has(key)) faixasMap.set(key, {});
                faixasMap.get(key)![r.plano] = r;
              }
              const ordenadas = Array.from(faixasMap.entries())
                .sort(([a], [b]) => Number(a.split("-")[0]) - Number(b.split("-")[0]));
              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-xs text-muted-foreground">
                        <th className="text-left py-2 px-2">Intervalo FIPE</th>
                        {planosUnicos.map(p => <th key={p as string} className="text-center py-2 px-2 whitespace-nowrap">{p as string}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {ordenadas.map(([key, rowsPorPlano]) => {
                        const anyRow = Object.values(rowsPorPlano)[0];
                        return (
                          <tr key={key} className="border-b">
                            <td className="py-2 px-2 font-mono text-xs whitespace-nowrap">{fmt(anyRow.valor_menor)} — {fmt(anyRow.valor_maior)}</td>
                            {planosUnicos.map(p => {
                              const r = rowsPorPlano[p as string];
                              return (
                                <td key={p as string} className="py-2 px-2 text-xs text-center whitespace-nowrap">
                                  {r ? <span className="font-semibold text-primary">{fmt(r.cota)}</span> : <span className="text-muted-foreground">—</span>}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="text-xs text-muted-foreground mt-3">
                    Valores de cota mensal por plano e faixa FIPE. {ordenadas.length} intervalos × {planosUnicos.length} planos = {precosRows.length} cotas.
                  </p>
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 p-3 border-t shrink-0 bg-background">
          <Button variant="outline" className="rounded-none" onClick={onClose}>Cancelar</Button>
          <Button className="rounded-none bg-[#1A3A5C] hover:bg-[#15304D] text-white" onClick={() => { toast.success("Alterações salvas"); onClose(); }}>
            <Save className="h-3.5 w-3.5 mr-1" />Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
