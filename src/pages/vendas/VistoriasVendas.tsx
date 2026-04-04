import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ClipboardCheck, Search, CheckCircle, XCircle, Clock, Eye, Camera,
  Loader2, AlertCircle, X,
} from "lucide-react";

const statusConfig: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-warning/10 text-warning border-warning/30" },
  em_aprovacao: { label: "Em Aprovação", className: "bg-primary/8 text-primary border-blue-300" },
  aprovada: { label: "Aprovada", className: "bg-success/10 text-success border-green-300" },
  reprovada: { label: "Reprovada", className: "bg-destructive/8 text-destructive border-red-300" },
};

export default function VistoriasVendas() {
  const [busca, setBusca] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [fConsultor, setFConsultor] = useState("all");
  const [detalheVistoria, setDetalheVistoria] = useState<any>(null);
  const [fotosDetalhe, setFotosDetalhe] = useState<any[]>([]);
  const [loadingFotos, setLoadingFotos] = useState(false);

  const { data: vistorias = [], isLoading } = useQuery({
    queryKey: ["vistorias-vendas"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("vistorias")
        .select("*, negociacoes!inner(lead_nome, veiculo_modelo, veiculo_placa, consultor, cooperativa)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []).map((v: any) => ({
        id: v.id,
        associado: v.negociacoes?.lead_nome || "—",
        veiculo: v.modelo || v.negociacoes?.veiculo_modelo || "—",
        placa: v.placa || v.negociacoes?.veiculo_placa || "—",
        status: v.status || "pendente",
        data: v.created_at ? new Date(v.created_at).toLocaleDateString("pt-BR") : "—",
        consultor: v.negociacoes?.consultor || "—",
        cooperativa: v.negociacoes?.cooperativa || "—",
        tentativa: v.tentativa,
        token_publico: v.token_publico,
        ai_aprovada: v.ai_aprovada,
        ai_score: v.ai_score,
        ai_motivo_rejeicao: v.ai_motivo_rejeicao,
        fotos_enviadas: v.fotos_enviadas,
        negociacao_id: v.negociacao_id,
      }));
    },
    staleTime: 60000,
  });

  const consultores = useMemo(() => [...new Set(vistorias.map((v: any) => v.consultor).filter(Boolean))].sort(), [vistorias]);

  const filtered = useMemo(() => vistorias.filter((v: any) => {
    if (fStatus !== "all" && v.status !== fStatus) return false;
    if (fConsultor !== "all" && v.consultor !== fConsultor) return false;
    if (busca) {
      const q = busca.toLowerCase();
      if (!v.associado.toLowerCase().includes(q) && !v.placa.toLowerCase().includes(q) && !v.consultor.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [vistorias, busca, fStatus, fConsultor]);

  const kpis = useMemo(() => [
    { label: "Total Vistorias", value: vistorias.length, icon: ClipboardCheck, color: "text-primary", bg: "bg-primary/8" },
    { label: "Aprovadas", value: vistorias.filter((v: any) => v.status === "aprovada").length, icon: CheckCircle, color: "text-success", bg: "bg-success/8" },
    { label: "Reprovadas", value: vistorias.filter((v: any) => v.status === "reprovada").length, icon: XCircle, color: "text-destructive", bg: "bg-destructive/8" },
    { label: "Pendentes", value: vistorias.filter((v: any) => v.status === "pendente" || v.status === "em_aprovacao").length, icon: Clock, color: "text-warning", bg: "bg-warning/8" },
  ], [vistorias]);

  const abrirDetalhe = async (v: any) => {
    setDetalheVistoria(v);
    setLoadingFotos(true);
    setFotosDetalhe([]);
    const { data: fotos } = await (supabase as any).from("vistoria_fotos").select("id, tipo, storage_path, ai_aprovada, ai_analise").eq("vistoria_id", v.id).order("created_at");
    if (fotos) {
      const fotosComUrl = await Promise.all(fotos.map(async (f: any) => {
        const { data: signed } = await supabase.storage.from("vistoria-fotos").createSignedUrl(f.storage_path, 600);
        return { ...f, url: signed?.signedUrl || "" };
      }));
      setFotosDetalhe(fotosComUrl);
    }
    setLoadingFotos(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md">
          <ClipboardCheck className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Vistorias Realizadas</h1>
          <p className="text-sm text-muted-foreground">Controle e visualização de vistorias</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-lg font-bold">{isLoading ? "—" : k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar associado, placa ou consultor..." value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fConsultor} onValueChange={setFConsultor}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Consultor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {consultores.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {(fStatus !== "all" || fConsultor !== "all" || busca) && (
              <Button variant="ghost" size="sm" onClick={() => { setFStatus("all"); setFConsultor("all"); setBusca(""); }}>
                <X className="h-3.5 w-3.5 mr-1" />Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Carregando...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <ClipboardCheck className="h-8 w-8 opacity-40" />
              <span className="text-sm">Nenhuma vistoria encontrada.</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1A3A5C]">
                  {["Associado", "Veículo", "Placa", "Status", "Score IA", "Data", "Consultor", ""].map(h => (
                    <TableHead key={h} className="text-white/90 font-semibold text-xs uppercase">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v: any, i: number) => (
                  <TableRow key={v.id} className={i % 2 === 0 ? "" : "bg-muted/30"}>
                    <TableCell className="font-medium text-sm">{v.associado}</TableCell>
                    <TableCell className="text-sm">{v.veiculo}</TableCell>
                    <TableCell><span className="font-mono text-sm bg-muted/50 px-2 py-0.5 rounded">{v.placa}</span></TableCell>
                    <TableCell>
                      <Badge className={`rounded-none border ${statusConfig[v.status]?.className || "bg-muted"}`}>
                        {statusConfig[v.status]?.label || v.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {v.ai_score != null ? (
                        <span className={`text-sm font-semibold ${Number(v.ai_score) >= 70 ? "text-success" : Number(v.ai_score) >= 50 ? "text-warning" : "text-destructive"}`}>
                          {Math.round(Number(v.ai_score))}/100
                        </span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm font-mono">{v.data}</TableCell>
                    <TableCell className="text-sm">{v.consultor}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => abrirDetalhe(v)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {filtered.length > 0 && (
            <div className="px-4 py-3 bg-muted/30 border-t">
              <span className="text-xs text-muted-foreground">{filtered.length} vistoria(s)</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Detalhe */}
      <Dialog open={!!detalheVistoria} onOpenChange={(o) => { if (!o) setDetalheVistoria(null); }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          {detalheVistoria && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Vistoria — {detalheVistoria.associado}
                  <Badge className={`ml-2 rounded-none border ${statusConfig[detalheVistoria.status]?.className || ""}`}>
                    {statusConfig[detalheVistoria.status]?.label || detalheVistoria.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-xs text-muted-foreground">Veículo</span><p className="font-medium">{detalheVistoria.veiculo}</p></div>
                <div><span className="text-xs text-muted-foreground">Placa</span><p className="font-mono">{detalheVistoria.placa}</p></div>
                <div><span className="text-xs text-muted-foreground">Consultor</span><p>{detalheVistoria.consultor}</p></div>
                <div><span className="text-xs text-muted-foreground">Data</span><p className="font-mono">{detalheVistoria.data}</p></div>
                {detalheVistoria.ai_score != null && (
                  <div><span className="text-xs text-muted-foreground">Score IA</span><p className="font-bold">{Math.round(Number(detalheVistoria.ai_score))}/100</p></div>
                )}
                {detalheVistoria.tentativa && (
                  <div><span className="text-xs text-muted-foreground">Tentativa</span><p>{detalheVistoria.tentativa}ª</p></div>
                )}
              </div>

              {/* Motivo rejeição */}
              {detalheVistoria.ai_motivo_rejeicao && (
                <div className="p-3 rounded border border-destructive/30 bg-destructive/5">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-semibold text-destructive">Motivo da Reprovação</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{detalheVistoria.ai_motivo_rejeicao}</p>
                </div>
              )}

              {/* Fotos */}
              <div>
                <h3 className="text-sm font-bold text-[#1A3A5C] mb-2">Fotos ({fotosDetalhe.length})</h3>
                {loadingFotos ? (
                  <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Carregando fotos...</span>
                  </div>
                ) : fotosDetalhe.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma foto enviada</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {fotosDetalhe.map((f: any) => (
                      <div key={f.id} className="relative aspect-square rounded-lg overflow-hidden border-2 border-border">
                        <img src={f.url} alt={f.tipo} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[9px] text-center py-1">
                          {(f.tipo || "").replace(/_/g, " ")}
                        </div>
                        {f.ai_aprovada === true && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        )}
                        {f.ai_aprovada === false && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                            <XCircle className="h-3 w-3 text-white" />
                          </div>
                        )}
                        {f.ai_analise?.score != null && (
                          <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded">
                            {f.ai_analise.score}/100
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Análise IA por foto */}
              {fotosDetalhe.some((f: any) => f.ai_analise?.observacoes) && (
                <div>
                  <h3 className="text-sm font-bold text-[#1A3A5C] mb-2">Análise IA por Foto</h3>
                  <div className="space-y-1">
                    {fotosDetalhe.filter((f: any) => f.ai_analise?.observacoes).map((f: any) => (
                      <div key={f.id} className="flex items-start gap-2 text-xs p-2 rounded bg-muted/30">
                        {f.ai_aprovada ? <CheckCircle className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />}
                        <div>
                          <span className="font-semibold">{(f.tipo || "").replace(/_/g, " ")}</span>
                          {f.ai_analise?.score != null && <span className="text-muted-foreground ml-1">({f.ai_analise.score}/100)</span>}
                          <p className="text-muted-foreground">{f.ai_analise.observacoes}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
