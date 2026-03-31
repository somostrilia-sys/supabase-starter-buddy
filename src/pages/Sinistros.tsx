import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Search, Plus, AlertTriangle, Car, FileText, DollarSign, Clock,
  Upload, CheckCircle2, ChevronLeft, ChevronRight, Download, Loader2, ShieldOff,
} from "lucide-react";

type SinistroStatus = "aberto" | "em_analise" | "aprovado" | "negado" | "finalizado";
type SinistroTipo = "roubo" | "furto" | "colisao" | "incendio" | "alagamento" | "outros";

const statusMap: Record<SinistroStatus, { label: string; class: string }> = {
  aberto:     { label: "Aberto",      class: "bg-sky-500/15 text-sky-400 border-0" },
  em_analise: { label: "Em Análise",  class: "bg-warning/10 text-warning border-0" },
  aprovado:   { label: "Aprovado",    class: "bg-emerald-500/15 text-emerald-400 border-0" },
  negado:     { label: "Negado",      class: "bg-destructive/15 text-destructive border-0" },
  finalizado: { label: "Finalizado",  class: "bg-primary/15 text-primary border-0" },
};

const tipoLabels: Record<SinistroTipo, string> = {
  roubo:     "Roubo",
  furto:     "Furto",
  colisao:   "Colisão",
  incendio:  "Incêndio",
  alagamento:"Alagamento",
  outros:    "Outros",
};

const STATUS_OPTIONS: SinistroStatus[] = ["aberto", "em_analise", "aprovado", "negado", "finalizado"];
const totalAssociadosAtivos = 450;

type SinistroRow = {
  id: string;
  associado_id: string;
  veiculo_id: string | null;
  tipo: SinistroTipo;
  status: SinistroStatus;
  data_ocorrencia: string;
  descricao: string;
  local_ocorrencia: string | null;
  boletim_ocorrencia: string | null;
  valor_estimado: number | null;
  valor_aprovado: number | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  associados?: { nome: string } | null;
  veiculos?: { placa: string; marca: string; modelo: string } | null;
};

export default function Sinistros() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SinistroRow | null>(null);
  const [detailTab, setDetailTab] = useState("dados");
  const [page, setPage] = useState(0);
  const perPage = 10;
  const [newStatus, setNewStatus] = useState<SinistroStatus>("aberto");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch sinistros with joins
  const { data: sinistros = [], isLoading } = useQuery({
    queryKey: ["sinistros"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("sinistros")
        .select("*, associados(nome), veiculos(placa, marca, modelo)")
        .order("created_at", { ascending: false }) as any);
      if (error) throw error;
      return (data || []) as SinistroRow[];
    },
  });

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ id, status, dadosAntigos }: { id: string; status: SinistroStatus; dadosAntigos: SinistroStatus }) => {
      setUpdatingStatus(true);
      const { error } = await supabase
        .from("sinistros")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      if (user?.id) {
        await supabase.from("audit_log").insert({
          usuario_id: user.id,
          acao: "UPDATE_SINISTRO_STATUS",
          tabela: "sinistros",
          registro_id: id,
          dados_anteriores: { status: dadosAntigos } as any,
          dados_novos: { status } as any,
        });
      }
    },
    onSuccess: () => {
      toast.success("Status atualizado!");
      queryClient.invalidateQueries({ queryKey: ["sinistros"] });
      setSelected(null);
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
    onSettled: () => setUpdatingStatus(false),
  });

  const totalEstimado = sinistros.reduce((s, e) => s + (e.valor_estimado ?? 0), 0);
  const totalAprovado  = sinistros.reduce((s, e) => s + (e.valor_aprovado  ?? 0), 0);

  const filtered = useMemo(() => {
    if (!search) return sinistros;
    const s = search.toLowerCase();
    return sinistros.filter(e =>
      e.id.toLowerCase().includes(s) ||
      (e.associados?.nome?.toLowerCase() ?? "").includes(s) ||
      (e.veiculos?.placa?.toLowerCase() ?? "").includes(s)
    );
  }, [sinistros, search]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice(page * perPage, (page + 1) * perPage);

  function getStatus(s: string) {
    return statusMap[s as SinistroStatus] ?? { label: s, class: "bg-muted text-muted-foreground border-0" };
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Eventos / Sinistros</h1>
          <p className="text-sm text-muted-foreground">
            {sinistros.length} eventos · R$ {totalAprovado.toLocaleString("pt-BR")} aprovados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border border-border/50"><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-sky-500/10"><AlertTriangle className="h-4 w-4 text-sky-400" /></div>
            <span className="text-[10px] uppercase text-muted-foreground font-medium">Total Eventos</span>
          </div>
          <p className="text-2xl font-bold">{sinistros.length}</p>
        </CardContent></Card>

        <Card className="border border-border/50"><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-warning/8"><Clock className="h-4 w-4 text-warning" /></div>
            <span className="text-[10px] uppercase text-muted-foreground font-medium">Em Aberto</span>
          </div>
          <p className="text-2xl font-bold">
            {sinistros.filter(e => ["aberto", "em_analise"].includes(e.status)).length}
          </p>
        </CardContent></Card>

        <Card className="border border-border/50"><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-destructive/10"><DollarSign className="h-4 w-4 text-destructive" /></div>
            <span className="text-[10px] uppercase text-muted-foreground font-medium">Valor Estimado</span>
          </div>
          <p className="text-xl font-bold font-mono">R$ {totalEstimado.toLocaleString("pt-BR")}</p>
        </CardContent></Card>

        <Card className="border border-border/50"><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-emerald-500/10"><CheckCircle2 className="h-4 w-4 text-emerald-400" /></div>
            <span className="text-[10px] uppercase text-muted-foreground font-medium">Valor Aprovado</span>
          </div>
          <p className="text-xl font-bold font-mono text-emerald-400">R$ {totalAprovado.toLocaleString("pt-BR")}</p>
        </CardContent></Card>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por associado ou placa..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          className="pl-9"
        />
      </div>

      <Card className="border border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#747474] bg-muted/30">
                    {["Tipo", "Associado", "Veículo", "Data", "Status", "Estimado", "Aprovado"].map(h => (
                      <th key={h} className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                          <div className="p-4 rounded-full bg-muted/40">
                            <ShieldOff className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              {search ? "Nenhum sinistro encontrado" : "Nenhum evento registrado"}
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                              {search
                                ? "Tente buscar por outro associado ou placa."
                                : "Quando ocorrerem sinistros, eles aparecerão aqui."}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : pageData.map(e => (
                    <tr
                      key={e.id}
                      className="border-b-2 border-[#747474] hover:bg-muted/20 cursor-pointer transition-colors"
                      onClick={() => { setSelected(e); setDetailTab("dados"); setNewStatus(e.status); }}
                    >
                      <td className="p-3">
                        <Badge variant="outline" className="text-[9px]">{tipoLabels[e.tipo] ?? e.tipo}</Badge>
                      </td>
                      <td className="p-3 text-xs font-medium">{e.associados?.nome ?? "—"}</td>
                      <td className="p-3 text-xs">
                        {e.veiculos ? (
                          <><Badge variant="secondary" className="font-mono text-[9px]">{e.veiculos.placa}</Badge>{" "}
                          <span className="text-muted-foreground">{e.veiculos.marca} {e.veiculos.modelo}</span></>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(e.data_ocorrencia).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-3">
                        <Badge className={`text-[9px] ${getStatus(e.status).class}`}>{getStatus(e.status).label}</Badge>
                      </td>
                      <td className="p-3 text-xs font-mono">
                        {e.valor_estimado != null ? `R$ ${e.valor_estimado.toLocaleString("pt-BR")}` : "—"}
                      </td>
                      <td className="p-3 text-xs font-mono text-emerald-400">
                        {e.valor_aprovado != null && e.valor_aprovado > 0 ? `R$ ${e.valor_aprovado.toLocaleString("pt-BR")}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {filtered.length === 0 ? "0" : `${page * perPage + 1}–${Math.min((page + 1) * perPage, filtered.length)}`} de {filtered.length}
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <SheetContent className="w-[520px] overflow-y-auto">
          {selected && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{tipoLabels[selected.tipo] ?? selected.tipo}</h3>
                  <p className="text-xs font-mono text-muted-foreground">{selected.id.slice(0, 8)}…</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-[9px] ${getStatus(selected.status).class}`}>
                      {getStatus(selected.status).label}
                    </Badge>
                  </div>
                </div>
              </div>
              <Separator />

              <Tabs value={detailTab} onValueChange={setDetailTab}>
                <TabsList className="w-full flex-wrap h-auto gap-1">
                  {[
                    ["dados", "Dados"],
                    ["veiculo", "Veículo"],
                    ["docs", "Documentos"],
                    ["rateio", "Rateio"],
                    ["status", "Status"],
                  ].map(([k, l]) => (
                    <TabsTrigger key={k} value={k} className="text-[10px] flex-1">{l}</TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="dados" className="space-y-3 mt-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Tipo:</span> {tipoLabels[selected.tipo] ?? selected.tipo}</div>
                    <div><span className="text-muted-foreground">Data:</span> {new Date(selected.data_ocorrencia).toLocaleDateString("pt-BR")}</div>
                    {selected.local_ocorrencia && (
                      <div className="col-span-2"><span className="text-muted-foreground">Local:</span> {selected.local_ocorrencia}</div>
                    )}
                    <div className="col-span-2"><span className="text-muted-foreground">Descrição:</span> {selected.descricao}</div>
                    {selected.boletim_ocorrencia && (
                      <div className="col-span-2"><span className="text-muted-foreground">B.O.:</span> <span className="font-mono">{selected.boletim_ocorrencia}</span></div>
                    )}
                    <div><span className="text-muted-foreground">Associado:</span> {selected.associados?.nome ?? "—"}</div>
                    {selected.observacoes && (
                      <div className="col-span-2"><span className="text-muted-foreground">Obs.:</span> {selected.observacoes}</div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="veiculo" className="space-y-3 mt-3">
                  {selected.veiculos ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card">
                      <Car className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm font-bold">{selected.veiculos.marca} {selected.veiculos.modelo}</p>
                        <Badge variant="secondary" className="font-mono text-[10px]">{selected.veiculos.placa}</Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nenhum veículo vinculado</p>
                  )}
                </TabsContent>

                <TabsContent value="docs" className="space-y-3 mt-3">
                  <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Arraste documentos aqui</p>
                  </div>
                </TabsContent>

                <TabsContent value="rateio" className="space-y-3 mt-3">
                  {selected.valor_estimado != null ? (
                    <Card className="border border-primary/30 bg-primary/5">
                      <CardContent className="p-4 space-y-3">
                        <p className="text-xs font-semibold text-primary">Cálculo de Rateio</p>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Valor do Evento:</span>
                            <span className="font-mono font-bold">R$ {selected.valor_estimado.toLocaleString("pt-BR")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Participação Mínima (10%):</span>
                            <span className="font-mono">R$ {(selected.valor_estimado * 0.1).toLocaleString("pt-BR")}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Valor a Ratear:</span>
                            <span className="font-mono font-bold">R$ {(selected.valor_estimado * 0.9).toLocaleString("pt-BR")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Associados Ativos:</span>
                            <span>{totalAssociadosAtivos}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-sm">
                            <span className="font-semibold text-primary">Valor por Associado:</span>
                            <span className="font-mono font-bold text-primary">
                              R$ {((selected.valor_estimado * 0.9) / totalAssociadosAtivos).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <p className="text-xs text-muted-foreground">Valor estimado não informado</p>
                  )}
                </TabsContent>

                <TabsContent value="status" className="space-y-3 mt-3">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Atualizar Status</p>
                    <Select value={newStatus} onValueChange={v => setNewStatus(v as SinistroStatus)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(s => (
                          <SelectItem key={s} value={s}>{statusMap[s].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={updatingStatus || newStatus === selected.status}
                      onClick={() => updateStatus.mutate({ id: selected.id, status: newStatus, dadosAntigos: selected.status })}
                    >
                      {updatingStatus && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
                      Salvar Status
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                    <div>
                      <span className="text-muted-foreground">Valor Estimado:</span>{" "}
                      <span className="font-mono">
                        {selected.valor_estimado != null ? `R$ ${selected.valor_estimado.toLocaleString("pt-BR")}` : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valor Aprovado:</span>{" "}
                      <span className="font-mono text-emerald-400">
                        {selected.valor_aprovado != null && selected.valor_aprovado > 0
                          ? `R$ ${selected.valor_aprovado.toLocaleString("pt-BR")}` : "—"}
                      </span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
