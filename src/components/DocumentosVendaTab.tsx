import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Image, Camera, PenTool, DollarSign, Loader2, ExternalLink, Download, Eye } from "lucide-react";

interface Props {
  negociacaoId: string;
}

export default function DocumentosVendaTab({ negociacaoId }: Props) {
  // Documentos OCR (CNH, CRLV)
  const { data: docsOcr, isLoading: loadingDocs } = useQuery({
    queryKey: ["docs-venda-ocr", negociacaoId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("documentos_ocr")
        .select("*")
        .eq("negociacao_id", negociacaoId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Vistorias + fotos
  const { data: vistorias, isLoading: loadingVist } = useQuery({
    queryKey: ["docs-venda-vistoria", negociacaoId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("vistorias")
        .select("*, vistoria_fotos(*)")
        .eq("negociacao_id", negociacaoId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Contratos
  const { data: contratos, isLoading: loadingCont } = useQuery({
    queryKey: ["docs-venda-contratos", negociacaoId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("contratos")
        .select("*")
        .eq("negociacao_id", negociacaoId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Cotações
  const { data: cotacoes, isLoading: loadingCot } = useQuery({
    queryKey: ["docs-venda-cotacoes", negociacaoId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("cotacoes")
        .select("*")
        .eq("negociacao_id", negociacaoId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const loading = loadingDocs || loadingVist || loadingCont || loadingCot;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando documentos da venda...</span>
      </div>
    );
  }

  const hasData = (docsOcr?.length || 0) + (vistorias?.length || 0) + (contratos?.length || 0) + (cotacoes?.length || 0) > 0;

  if (!hasData) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Nenhum documento da venda encontrado.</p>
        <p className="text-xs mt-1">Os documentos aparecerão aqui quando a negociação de origem tiver CNH, CRLV, vistoria ou contrato.</p>
      </div>
    );
  }

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";

  return (
    <div className="space-y-4">
      {/* Documentos OCR */}
      {docsOcr && docsOcr.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">Documentos OCR</span>
              <Badge variant="outline" className="text-xs">{docsOcr.length}</Badge>
            </div>
            <div className="space-y-2">
              {docsOcr.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/30 rounded border">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.tipo === "cnh" ? "CNH" : "CRLV"}</p>
                      <p className="text-xs text-muted-foreground">Enviado em {fmtDate(doc.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.confianca && (
                      <Badge className={`text-xs ${doc.confianca >= 50 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        OCR {Math.round(doc.confianca)}%
                      </Badge>
                    )}
                    {doc.dados_extraidos && (
                      <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {doc.tipo === "cnh" ? doc.dados_extraidos.nome : doc.dados_extraidos.placa}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vistorias */}
      {vistorias && vistorias.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">Vistoria</span>
            </div>
            {vistorias.map((v: any) => (
              <div key={v.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge className={v.status === "aprovada" ? "bg-green-100 text-green-700" : v.status === "reprovada" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>
                    {v.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Token: {v.token_publico}</span>
                  <span className="text-xs text-muted-foreground">{fmtDate(v.created_at)}</span>
                  {v.ai_score && <Badge variant="outline" className="text-xs">Score IA: {v.ai_score}/100</Badge>}
                </div>
                {/* Fotos */}
                {v.vistoria_fotos && v.vistoria_fotos.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {v.vistoria_fotos.map((foto: any) => {
                      const { data: urlData } = supabase.storage.from("vistorias").getPublicUrl(foto.storage_path);
                      return (
                        <div key={foto.id} className="aspect-square rounded overflow-hidden border bg-muted/30 relative group">
                          <img src={urlData.publicUrl} alt={foto.tipo} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5">
                            {(foto.tipo || "").replace(/_/g, " ")}
                          </div>
                          {foto.ai_aprovada === false && (
                            <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full" title="IA rejeitou" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Contratos */}
      {contratos && contratos.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <PenTool className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">Contratos</span>
              <Badge variant="outline" className="text-xs">{contratos.length}</Badge>
            </div>
            <div className="space-y-2">
              {contratos.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-muted/30 rounded border">
                  <div>
                    <p className="text-sm font-medium">{c.numero}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.status} • R$ {Number(c.valor_mensal || 0).toFixed(2)}/mês • {fmtDate(c.data_inicio)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={c.status === "ativo" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}>
                      {c.status}
                    </Badge>
                    {c.link_consultor && (
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => window.open(c.link_consultor, "_blank")}>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cotações */}
      {cotacoes && cotacoes.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">Cotações</span>
              <Badge variant="outline" className="text-xs">{cotacoes.length}</Badge>
            </div>
            <div className="space-y-2">
              {cotacoes.map((cot: any) => (
                <div key={cot.id} className="p-3 bg-muted/30 rounded border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Plano: {cot.plano_selecionado || "Não selecionado"}</p>
                    <span className="text-xs text-muted-foreground">{fmtDate(cot.created_at)}</span>
                  </div>
                  {cot.todos_planos && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(cot.todos_planos as any[]).map((p: any, i: number) => (
                        <Badge key={i} variant={p.nome === cot.plano_selecionado ? "default" : "outline"} className="text-xs">
                          {p.nome}: R$ {Number(p.valor_mensal || 0).toFixed(0)}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {cot.desconto_aplicado > 0 && (
                    <p className="text-xs text-green-600 mt-1">Desconto: {cot.desconto_aplicado}%</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
