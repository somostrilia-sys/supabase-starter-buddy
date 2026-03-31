import { useState, useEffect } from "react";
import { supabase, callEdge } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, CheckCircle, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface Props {
  negociacaoId: string;
  tipo: "cnh" | "crlv";
  onDadosExtraidos?: (dados: Record<string, any>) => void;
}

export default function DocumentoUpload({ negociacaoId, tipo, onDadosExtraidos }: Props) {
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processando, setProcessando] = useState(false);

  const label = tipo === "crlv" ? "CRLV" : "CNH";

  useEffect(() => { fetchDoc(); }, [negociacaoId, tipo]);

  async function fetchDoc() {
    const { data } = await supabase
      .from("documentos_ocr" as any)
      .select("*")
      .eq("negociacao_id", negociacaoId)
      .eq("tipo", tipo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setDoc(data);
    setLoading(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const path = `documentos/${negociacaoId}/${tipo}_${Date.now()}.${file.name.split(".").pop()}`;
    const { error: upErr } = await supabase.storage.from("documentos").upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) { toast.error(`Erro: ${upErr.message}`); setUploading(false); return; }

    const { data: newDoc } = await supabase
      .from("documentos_ocr" as any)
      .insert({ negociacao_id: negociacaoId, tipo, storage_path: path } as any)
      .select()
      .single();

    if (newDoc) {
      setDoc(newDoc);
      setUploading(false);
      setProcessando(true);
      const result = await callEdge("gia-ocr-documento", { documento_id: (newDoc as any).id });
      if (result.sucesso) {
        setDoc((prev: any) => ({ ...prev, dados_extraidos: result.dados_extraidos, confianca: (result.confianca || 0) * 100 }));
        onDadosExtraidos?.(result.dados_extraidos);
        toast.success(`${label} processado com sucesso!`);
      } else {
        toast.error(result.error || "Erro no OCR");
      }
      setProcessando(false);
    } else {
      setUploading(false);
    }
  }

  if (loading) return null;

  return (
    <Card className="rounded-none border-2 border-border">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#1A3A5C]" />
            <span className="text-sm font-semibold">{label}</span>
          </div>
          {doc?.dados_extraidos && (
            <Badge className="bg-success/10 text-success border-green-300 rounded-none text-[10px]">
              <CheckCircle className="h-3 w-3 mr-1" />
              OCR {doc.confianca ? `${Math.round(doc.confianca)}%` : "OK"}
            </Badge>
          )}
        </div>

        {!doc ? (
          <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded cursor-pointer hover:bg-muted/30 transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Envie o {label} para extração automática</span>
            <input type="file" accept="image/*,.pdf" onChange={handleUpload} disabled={uploading} className="hidden" />
            {uploading && <span className="text-xs text-primary">Enviando...</span>}
          </label>
        ) : processando ? (
          <div className="flex items-center gap-2 p-4 justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs text-primary">Extraindo dados com IA...</span>
          </div>
        ) : doc.dados_extraidos ? (
          <div className="space-y-2">
            <div className="bg-muted/30 rounded p-3 space-y-1">
              {Object.entries(doc.dados_extraidos).map(([key, value]) =>
                value ? (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ) : null
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="text-xs rounded-none h-7" onClick={() => { setProcessando(true); callEdge("gia-ocr-documento", { documento_id: doc.id }).then(r => { if (r.sucesso) { setDoc((p: any) => ({ ...p, dados_extraidos: r.dados_extraidos })); onDadosExtraidos?.(r.dados_extraidos); } setProcessando(false); }); }}>
                <RotateCcw className="h-3 w-3 mr-1" />Reprocessar
              </Button>
              <label className="inline-flex items-center gap-1 text-xs text-primary cursor-pointer hover:underline">
                Reenviar
                <input type="file" accept="image/*,.pdf" onChange={handleUpload} className="hidden" />
              </label>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Documento enviado, aguardando processamento.</p>
        )}
      </CardContent>
    </Card>
  );
}
