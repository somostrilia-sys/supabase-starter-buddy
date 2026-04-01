import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, ArrowRight, X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

// Fields in negociacoes that we can map to
const NEGOCIACAO_FIELDS = [
  { value: "__ignore__", label: "-- Ignorar --" },
  { value: "lead_nome", label: "Nome do Lead" },
  { value: "telefone", label: "Telefone" },
  { value: "email", label: "Email" },
  { value: "veiculo_placa", label: "Placa" },
  { value: "veiculo_modelo", label: "Modelo Veiculo" },
  { value: "consultor", label: "Consultor" },
  { value: "origem", label: "Origem" },
  { value: "observacoes", label: "Observacoes" },
  { value: "valor_plano", label: "Valor Plano" },
];

interface ImportRecord {
  fileName: string;
  count: number;
  date: Date;
}

export default function ImportarLeads() {
  const [step, setStep] = useState<"upload" | "mapping" | "importing" | "done">("upload");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [importHistory, setImportHistory] = useState<ImportRecord[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep("upload");
    setProgress(0);
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
  };

  const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return { headers: [], rows: [] };
    const parseLine = (line: string) => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; continue; }
        if ((ch === "," || ch === ";") && !inQuotes) { result.push(current.trim()); current = ""; continue; }
        current += ch;
      }
      result.push(current.trim());
      return result;
    };
    const h = parseLine(lines[0]);
    const r = lines.slice(1).map(parseLine);
    return { headers: h, rows: r };
  };

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    const isXlsx = file.name.match(/\.xlsx?$/i);

    try {
      if (isXlsx) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        if (jsonData.length === 0) { toast.error("Arquivo vazio"); return; }
        setHeaders(jsonData[0].map(String));
        setRows(jsonData.slice(1).map(r => r.map(String)));
      } else {
        const text = await file.text();
        const { headers: h, rows: r } = parseCSV(text);
        if (h.length === 0) { toast.error("Arquivo vazio"); return; }
        setHeaders(h);
        setRows(r);
      }

      // Auto-map: try to guess column mapping
      setStep("mapping");
    } catch (err) {
      toast.error("Erro ao ler arquivo");
      console.error(err);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const updateMapping = (colIndex: number, field: string) => {
    setMapping(prev => ({ ...prev, [colIndex]: field }));
  };

  // Auto-guess mapping based on header names
  const autoGuess = () => {
    const guessMap: Record<string, string> = {};
    const lower = headers.map(h => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    lower.forEach((h, i) => {
      if (h.includes("nome") || h.includes("name")) guessMap[i] = "lead_nome";
      else if (h.includes("telefone") || h.includes("phone") || h.includes("tel") || h.includes("celular")) guessMap[i] = "telefone";
      else if (h.includes("email") || h.includes("e-mail")) guessMap[i] = "email";
      else if (h.includes("placa")) guessMap[i] = "veiculo_placa";
      else if (h.includes("modelo") || h.includes("veiculo") || h.includes("vehicle")) guessMap[i] = "veiculo_modelo";
      else if (h.includes("consultor") || h.includes("vendedor") || h.includes("responsavel")) guessMap[i] = "consultor";
      else if (h.includes("origem") || h.includes("source")) guessMap[i] = "origem";
      else if (h.includes("obs")) guessMap[i] = "observacoes";
      else if (h.includes("valor")) guessMap[i] = "valor_plano";
    });
    setMapping(guessMap);
  };

  // Validate row: at least lead_nome
  const mappedFields = Object.values(mapping).filter(v => v !== "__ignore__");
  const hasNome = mappedFields.includes("lead_nome");
  const hasContact = mappedFields.includes("telefone") || mappedFields.includes("email");
  const canImport = hasNome && hasContact && rows.length > 0;

  const validRows = rows.filter(row => {
    const nomeIdx = Object.entries(mapping).find(([, v]) => v === "lead_nome")?.[0];
    if (nomeIdx === undefined) return false;
    return row[Number(nomeIdx)]?.trim();
  });

  const doImport = async () => {
    setStep("importing");
    setProgress(0);

    const records = validRows.map(row => {
      const obj: Record<string, any> = { stage: "novo_lead", origem: "Importacao CSV" };
      Object.entries(mapping).forEach(([colIdx, field]) => {
        if (field === "__ignore__") return;
        const val = row[Number(colIdx)]?.trim();
        if (!val) return;
        if (field === "valor_plano") {
          obj[field] = parseFloat(val.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
        } else {
          obj[field] = val;
        }
      });
      return obj;
    });

    if (records.length === 0) {
      toast.error("Nenhum registro valido para importar");
      setStep("mapping");
      return;
    }

    // Insert in batches of 25
    const batchSize = 25;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error } = await (supabase as any).from("negociacoes").insert(batch);
      if (error) {
        console.error("Import batch error:", error);
        errors += batch.length;
      } else {
        imported += batch.length;
      }
      setProgress(Math.round(((i + batch.length) / records.length) * 100));
    }

    setImportedCount(imported);
    if (errors > 0) {
      toast.warning(`${imported} importados, ${errors} com erro`);
    } else {
      toast.success(`${imported} leads importados com sucesso`);
    }

    setImportHistory(prev => [...prev, { fileName, count: imported, date: new Date() }]);
    setStep("done");
  };

  if (step === "upload") {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Importar Leads</h1>
          <p className="text-sm text-muted-foreground">Importe contatos via arquivo CSV ou Excel</p>
        </div>
        <Card className="border border-border/50">
          <CardContent className="p-0">
            <div
              className="border-2 border-dashed border-border/50 rounded-xl m-4 p-16 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleInputChange}
              />
              <Upload className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-1">Arraste seu arquivo CSV ou Excel aqui</h3>
              <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar</p>
              <Badge variant="outline" className="text-xs">Formatos aceitos: .csv, .xlsx, .xls</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-2">Dicas para importacao</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>A primeira linha deve conter os nomes das colunas</li>
              <li>Campos obrigatorios: Nome e pelo menos Telefone ou Email</li>
              <li>Telefones no formato (XX) XXXXX-XXXX</li>
              <li>Os leads serao criados na etapa "Novo Lead" do pipeline</li>
            </ul>
          </CardContent>
        </Card>

        {importHistory.length > 0 && (
          <Card className="border border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Importacoes desta sessao</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {importHistory.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    <span>{h.fileName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[10px]">{h.count} leads</Badge>
                    <span className="text-muted-foreground">{h.date.toLocaleTimeString("pt-BR")}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (step === "mapping") {
    const previewRows = rows.slice(0, 10);
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mapeamento de Colunas</h1>
            <p className="text-sm text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4 inline mr-1" />{fileName} -- {rows.length} linhas
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={resetState}><X className="h-4 w-4 mr-1" />Cancelar</Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="border border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-[#22C55E]" />
              <div><p className="text-2xl font-bold text-[#22C55E]">{validRows.length}</p><p className="text-xs text-muted-foreground">Validos</p></div>
            </CardContent>
          </Card>
          <Card className="border border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-8 w-8 text-destructive" />
              <div><p className="text-2xl font-bold text-destructive">{rows.length - validRows.length}</p><p className="text-xs text-muted-foreground">Sem nome</p></div>
            </CardContent>
          </Card>
          <Card className="border border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <div><p className="text-2xl font-bold text-primary">{headers.length}</p><p className="text-xs text-muted-foreground">Colunas</p></div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Mapeamento</CardTitle>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={autoGuess}>Auto-detectar</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {headers.map((col, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] w-32 justify-center shrink-0 truncate" title={col}>{col}</Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <Select value={mapping[i] || "__ignore__"} onValueChange={v => updateMapping(i, v)}>
                    <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{NEGOCIACAO_FIELDS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {!hasNome && <p className="text-xs text-destructive mt-3">Mapeie pelo menos a coluna "Nome do Lead"</p>}
            {hasNome && !hasContact && <p className="text-xs text-warning mt-3">Recomendado: mapeie Telefone ou Email</p>}
          </CardContent>
        </Card>

        <Card className="border border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Preview (primeiras {Math.min(10, previewRows.length)} linhas)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b-2 border-[#747474] bg-muted/30">
                  <th className="p-2 text-left text-[10px] uppercase text-muted-foreground">#</th>
                  {headers.map((h, i) => (
                    <th key={i} className="p-2 text-left text-[10px] uppercase text-muted-foreground">
                      {h}
                      {mapping[i] && mapping[i] !== "__ignore__" && (
                        <Badge className="ml-1 text-[8px] bg-primary/15 text-primary">{NEGOCIACAO_FIELDS.find(f => f.value === mapping[i])?.label}</Badge>
                      )}
                    </th>
                  ))}
                </tr></thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      {headers.map((_, ci) => (
                        <td key={ci} className={`p-2 ${!row[ci]?.trim() ? "text-muted-foreground italic" : ""}`}>
                          {row[ci]?.trim() || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={resetState}>Voltar</Button>
          <Button onClick={doImport} disabled={!canImport} className="px-8">
            Importar {validRows.length} leads <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  if (step === "importing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <h2 className="text-xl font-bold">Importando leads...</h2>
        <div className="w-64">
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-muted-foreground text-center mt-1">{progress}%</p>
        </div>
      </div>
    );
  }

  // done
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <CheckCircle2 className="h-16 w-16 text-[#22C55E]" />
      <h2 className="text-xl font-bold">Importacao Concluida!</h2>
      <p className="text-sm text-muted-foreground">{importedCount} leads importados com sucesso</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={resetState}>Nova Importacao</Button>
        <Button onClick={() => window.location.href = "/vendas/pipeline"}>Ver no Pipeline</Button>
      </div>
    </div>
  );
}
