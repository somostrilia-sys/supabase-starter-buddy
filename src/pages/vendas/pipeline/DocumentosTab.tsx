import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase, callEdge } from "@/integrations/supabase/client";
import { FileText, Upload, RefreshCw, Loader2 } from "lucide-react";

interface OcrDoc {
  id: string;
  tipo: string;
  storage_path: string;
  dados_extraidos: Record<string, any> | null;
  confianca: number | null;
}

interface Props {
  negociacaoId: string;
  onCnhExtraida?: (dados: Record<string, any>) => void;
  onCrlvExtraida?: (dados: Record<string, any>) => void;
}

const LABELS_CNH: Record<string, string> = {
  nome: "Nome",
  cpf: "Cpf",
  data_nascimento: "Data Nascimento",
  numero_registro: "Nº Registro",
  categoria: "Categoria",
  validade: "Validade",
  primeira_habilitacao: "1ª Habilitação",
  local_emissao: "Local Emissao",
  rg: "RG",
  orgao_emissor: "Órgão Emissor",
  uf: "UF",
  filiacao_pai: "Pai",
  filiacao_mae: "Mãe",
  sexo: "Sexo",
};

const LABELS_CRLV: Record<string, string> = {
  placa: "Placa",
  renavam: "Renavam",
  chassi: "Chassi",
  marca_modelo: "Marca/Modelo",
  ano_fabricacao: "Ano Fab.",
  ano_modelo: "Ano Modelo",
  cor: "Cor",
  combustivel: "Combustível",
  municipio: "Município",
  uf: "UF",
  nome_proprietario: "Proprietário",
  cpf_cnpj_proprietario: "CPF/CNPJ Proprietário",
  categoria: "Categoria",
  especie: "Espécie",
  tipo: "Tipo",
  potencia: "Potência",
  cilindrada: "Cilindrada",
  capacidade_passageiros: "Passageiros",
};

export default function DocumentosTab({ negociacaoId, onCnhExtraida, onCrlvExtraida }: Props) {
  const [cnh, setCnh] = useState<OcrDoc | null>(null);
  const [crlv, setCrlv] = useState<OcrDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingCnh, setUploadingCnh] = useState(false);
  const [uploadingCrlv, setUploadingCrlv] = useState(false);
  const [processandoCnh, setProcessandoCnh] = useState(false);
  const [processandoCrlv, setProcessandoCrlv] = useState(false);

  useEffect(() => {
    fetchDocumentos();
  }, [negociacaoId]);

  async function fetchDocumentos() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("documentos_ocr")
        .select("*")
        .eq("negociacao_id", negociacaoId)
        .order("created_at", { ascending: false });

      if (error) { console.error("Erro ao buscar documentos:", error); }
      if (data) {
        const cnhDoc = data.find((d: any) => d.tipo === "cnh") || null;
        const crlvDoc = data.find((d: any) => d.tipo === "crlv") || null;
        setCnh(cnhDoc);
        setCrlv(crlvDoc);
        if (cnhDoc?.dados_extraidos && Object.keys(cnhDoc.dados_extraidos).length > 0) onCnhExtraida?.(cnhDoc.dados_extraidos);
        if (crlvDoc?.dados_extraidos && Object.keys(crlvDoc.dados_extraidos).length > 0) onCrlvExtraida?.(crlvDoc.dados_extraidos);
      }
    } catch (err) { console.error("Erro fetchDocumentos:", err); }
    setLoading(false);
  }

  async function handleUpload(tipo: "cnh" | "crlv", file: File) {
    const setUploading = tipo === "cnh" ? setUploadingCnh : setUploadingCrlv;
    const setProcessando = tipo === "cnh" ? setProcessandoCnh : setProcessandoCrlv;
    const setDoc = tipo === "cnh" ? setCnh : setCrlv;
    const onExtraida = tipo === "cnh" ? onCnhExtraida : onCrlvExtraida;

    setUploading(true);
    const ext = file.name.split(".").pop() || "pdf";
    const path = `documentos/${negociacaoId}/${tipo}_${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("documentos")
      .upload(path, file, { contentType: file.type, upsert: true });

    if (uploadErr) {
      toast.error(`Erro ao enviar: ${uploadErr.message}`);
      setUploading(false);
      return;
    }

    const { data: doc, error: insertErr } = await supabase
      .from("documentos_ocr")
      .insert({ negociacao_id: negociacaoId, tipo, storage_path: path })
      .select()
      .single();

    if (insertErr) {
      toast.error(`Erro: ${insertErr.message}`);
      setUploading(false);
      return;
    }

    setDoc(doc as any);
    setUploading(false);

    // Processar OCR automaticamente (com retry)
    setProcessando(true);
    let tentativas = 0;
    const MAX_TENTATIVAS = 2;
    while (tentativas < MAX_TENTATIVAS) {
      tentativas++;
      try {
        const result = await callEdge("gia-ocr-documento", { documento_id: doc.id });
        if (result.sucesso && result.dados_extraidos && Object.keys(result.dados_extraidos).length > 0) {
          const updated = { ...doc, dados_extraidos: result.dados_extraidos, confianca: Math.round(result.confianca * 100) };
          setDoc(updated as any);
          onExtraida?.(result.dados_extraidos);
          toast.success(`Dados ${tipo === "cnh" ? "do associado" : "do veículo"} preenchidos automaticamente`);
          break;
        } else if (tentativas < MAX_TENTATIVAS) {
          // Retry silencioso
          await new Promise(r => setTimeout(r, 1000));
          continue;
        } else {
          toast.error(`Não foi possível ler o documento. Tente outra foto com melhor qualidade.`);
        }
      } catch (err: any) {
        if (tentativas < MAX_TENTATIVAS) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        toast.error(`Erro ao processar. Tente reenviar com foto mais nítida.`);
      }
    }
    setProcessando(false);
  }

  async function handleReprocessar(tipo: "cnh" | "crlv") {
    const doc = tipo === "cnh" ? cnh : crlv;
    if (!doc) return;
    const setProcessando = tipo === "cnh" ? setProcessandoCnh : setProcessandoCrlv;
    const setDoc = tipo === "cnh" ? setCnh : setCrlv;
    const onExtraida = tipo === "cnh" ? onCnhExtraida : onCrlvExtraida;

    setProcessando(true);
    try {
      const result = await callEdge("gia-ocr-documento", { documento_id: doc.id });
      if (result.sucesso) {
        setDoc((prev: any) => ({ ...prev, dados_extraidos: result.dados_extraidos, confianca: Math.round(result.confianca * 100) }));
        onExtraida?.(result.dados_extraidos);
        toast.success(`Dados ${tipo === "cnh" ? "do associado" : "do veículo"} preenchidos automaticamente`);
      } else {
        toast.error(`Erro no OCR: ${result.error}`);
      }
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
    setProcessando(false);
  }

  function renderDocCard(
    tipo: "cnh" | "crlv",
    doc: OcrDoc | null,
    uploading: boolean,
    processando: boolean,
  ) {
    const label = tipo === "cnh" ? "CNH" : "CRLV";
    const labels = tipo === "cnh" ? LABELS_CNH : LABELS_CRLV;

    return (
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">{label}</span>
          </div>
          {doc?.dados_extraidos && (
            <Badge
              variant="outline"
              className={`text-xs ${
                (doc.confianca || 0) >= 50
                  ? "border-green-500 text-green-600 bg-green-50"
                  : "border-amber-500 text-amber-600 bg-amber-50"
              }`}
            >
              OCR {doc.confianca ? `${Math.round(doc.confianca)}%` : "OK"}
            </Badge>
          )}
        </div>

        {!doc ? (
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <Upload className="h-6 w-6 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">
                {uploading ? "Enviando..." : `Envie o ${label} para extração automática`}
              </p>
            </div>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(tipo, file);
                e.target.value = "";
              }}
              disabled={uploading}
            />
          </label>
        ) : (
          <div className="space-y-3">
            {processando ? (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-xs text-blue-600">Extraindo dados com IA...</span>
              </div>
            ) : doc.dados_extraidos ? (
              <div className="space-y-1.5">
                {Object.entries(doc.dados_extraidos).map(([key, value]) =>
                  value ? (
                    <div key={key} className="flex justify-between text-xs py-0.5">
                      <span className="text-muted-foreground">{labels[key] || key.replace(/_/g, " ")}</span>
                      <span className="font-medium text-right max-w-[60%] truncate">{String(value)}</span>
                    </div>
                  ) : null,
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Documento enviado, aguardando processamento.</p>
            )}

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7 gap-1"
                onClick={() => handleReprocessar(tipo)}
                disabled={processando}
              >
                <RefreshCw className="h-3 w-3" />
                Reprocessar
              </Button>
              <label className="inline-flex items-center gap-1 text-xs text-blue-600 cursor-pointer hover:underline">
                Reenviar
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(tipo, file);
                    e.target.value = "";
                  }}
                  disabled={uploading || processando}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Anexe CNH e CRLV para preenchimento automático dos dados do associado e veículo.
      </p>
      {renderDocCard("cnh", cnh, uploadingCnh, processandoCnh)}
      {renderDocCard("crlv", crlv, uploadingCrlv, processandoCrlv)}
    </div>
  );
}
