import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";

export default function ImportarLeads() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) throw new Error("Arquivo vazio ou sem dados");

      const headers = lines[0].split(/[,;\t]/).map(h => h.trim().toLowerCase().replace(/"/g, ""));
      const nameIdx = headers.findIndex(h => h.includes("nome"));
      const phoneIdx = headers.findIndex(h => h.includes("telefone") || h.includes("celular") || h.includes("phone"));
      const emailIdx = headers.findIndex(h => h.includes("email") || h.includes("e-mail"));
      const cpfIdx = headers.findIndex(h => h.includes("cpf") || h.includes("cnpj"));
      const cityIdx = headers.findIndex(h => h.includes("cidade") || h.includes("city"));
      const stateIdx = headers.findIndex(h => h.includes("estado") || h.includes("uf"));

      if (nameIdx === -1) throw new Error("Coluna 'nome' não encontrada no arquivo");

      let success = 0, errors = 0;
      const batch: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(/[,;\t]/).map(v => v.trim().replace(/"/g, ""));
        const nome = vals[nameIdx];
        if (!nome) { errors++; continue; }

        batch.push({
          nome,
          telefone: phoneIdx >= 0 ? vals[phoneIdx] || null : null,
          email: emailIdx >= 0 ? vals[emailIdx] || null : null,
          cpf_cnpj: cpfIdx >= 0 ? vals[cpfIdx] || null : null,
          cidade: cityIdx >= 0 ? vals[cityIdx] || null : null,
          estado: stateIdx >= 0 ? vals[stateIdx] || null : null,
          origem: "Importação CSV",
        });
      }

      // Insert in batches of 50
      for (let i = 0; i < batch.length; i += 50) {
        const chunk = batch.slice(i, i + 50);
        const { error } = await supabase.from("contatos").insert(chunk);
        if (error) errors += chunk.length;
        else success += chunk.length;
      }

      setResult({ success, errors });
      toast({ title: `Importação concluída: ${success} contatos importados` });
    } catch (err: any) {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
    } finally { setImporting(false); }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importar Leads</h1>
        <p className="text-muted-foreground text-sm">Importe contatos de arquivos CSV ou Excel</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Formato do arquivo</p>
            <p className="text-xs text-muted-foreground">O arquivo CSV deve conter cabeçalhos na primeira linha. Colunas reconhecidas:</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {["nome*", "telefone", "email", "cpf/cnpj", "cidade", "estado"].map(c => (
                <span key={c} className="text-[10px] px-2 py-0.5 bg-background rounded border font-mono">{c}</span>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">* obrigatório. Separadores aceitos: vírgula, ponto-e-vírgula ou tab.</p>
          </div>

          {/* Upload */}
          <div className="border-2 border-dashed rounded-xl p-8 text-center">
            <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <input type="file" accept=".csv,.txt,.xlsx,.xls" onChange={handleFileChange} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <p className="text-sm font-medium">{file ? file.name : "Clique para selecionar arquivo"}</p>
              <p className="text-xs text-muted-foreground mt-1">CSV, TXT ou Excel</p>
            </label>
          </div>

          {file && (
            <Button onClick={handleImport} disabled={importing} className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              {importing ? "Importando..." : `Importar ${file.name}`}
            </Button>
          )}

          {/* Result */}
          {result && (
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>{result.success} importados</span>
              </div>
              {result.errors > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span>{result.errors} erros</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
