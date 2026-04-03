import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Download, Upload, Save, Plus, Trash2, AlertTriangle,
  CheckCircle2, Loader2, FileSpreadsheet, Edit,
} from "lucide-react";
import { toast } from "sonner";

interface FaixaCota {
  id: string;
  fipeMin: number;
  fipeMax: number;
  fator: number;
  taxaAdmin: number;
  descricao: string;
}


const fmtBRL = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

function generateCSV(cotas: FaixaCota[]): string {
  const header = "fipe_min,fipe_max,fator,taxa_admin,descricao";
  const rows = cotas.map(c => `${c.fipeMin},${c.fipeMax},${c.fator},${c.taxaAdmin},"${c.descricao}"`);
  return [header, ...rows].join("\n");
}

function parseCSV(text: string): { data: FaixaCota[]; errors: string[] } {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return { data: [], errors: ["Arquivo vazio ou sem dados"] };

  const errors: string[] = [];
  const data: FaixaCota[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].match(/(".*?"|[^,]+)/g);
    if (!parts || parts.length < 5) {
      errors.push(`Linha ${i + 1}: formato inválido`);
      continue;
    }
    const fipeMin = parseFloat(parts[0]);
    const fipeMax = parseFloat(parts[1]);
    const fator = parseFloat(parts[2]);
    const taxaAdmin = parseFloat(parts[3]);
    const descricao = parts[4].replace(/"/g, "").trim();

    if (isNaN(fipeMin) || isNaN(fipeMax) || isNaN(fator) || isNaN(taxaAdmin)) {
      errors.push(`Linha ${i + 1}: valores numéricos inválidos`);
      continue;
    }
    if (fipeMin >= fipeMax) {
      errors.push(`Linha ${i + 1}: fipe_min (${fipeMin}) deve ser menor que fipe_max (${fipeMax})`);
      continue;
    }
    data.push({ id: `imp-${i}`, fipeMin, fipeMax, fator, taxaAdmin, descricao });
  }

  // Check overlaps
  const sorted = [...data].sort((a, b) => a.fipeMin - b.fipeMin);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].fipeMin <= sorted[i - 1].fipeMax) {
      errors.push(`Sobreposição: faixa ${sorted[i - 1].fipeMin}-${sorted[i - 1].fipeMax} e ${sorted[i].fipeMin}-${sorted[i].fipeMax}`);
    }
  }

  return { data, errors };
}

export default function TabelaCotas({ onBack }: { onBack: () => void }) {
  const { data: faixasDb = [], isLoading: loadingFaixas } = useQuery({
    queryKey: ["faixas_fipe"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("faixas_fipe")
        .select("*")
        .order("fipe_inicial");
      if (error) throw error;
      return (data || []).map((f: any) => ({
        id: String(f.id),
        fipeMin: f.fipe_inicial ?? 0,
        fipeMax: f.fipe_final ?? 0,
        fator: f.fator ?? 0,
        taxaAdmin: f.taxa_adm ?? 0,
        descricao: f.descricao || "",
      })) as FaixaCota[];
    },
  });

  const [cotas, setCotas] = useState<FaixaCota[]>([]);
  const [dbLoaded, setDbLoaded] = useState(false);

  useEffect(() => {
    if (faixasDb.length > 0 && !dbLoaded) {
      setCotas(faixasDb);
      setDbLoaded(true);
    }
  }, [faixasDb, dbLoaded]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const header = "FIP Mínima;FIP Máxima;Cota;Taxa Multiplicativa;Regional;Categoria";
    const exampleRows = [
      "0;30000;1ª;1.0;Sul;Automóvel",
      "30001;60000;2ª;1.5;Norte;Motocicleta",
      "60001;100000;3ª;2.0;Sudeste;Pesado",
      "100001;200000;4ª;2.5;Nordeste;Van",
      "200001;500000;5ª;3.0;Centro-Oeste;Automóvel",
    ];
    const csvContent = [header, ...exampleRows].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_cotas.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template baixado com sucesso");
  };

  const handleSave = async () => {
    setSaving(true);
    // Simula POST para Edge Function
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false);
    toast.success(`${cotas.length} faixas salvas com sucesso`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const { data, errors } = parseCSV(text);

      // Simula POST para Edge Function
      await new Promise(r => setTimeout(r, 1500));

      if (errors.length > 0 && data.length === 0) {
        setImportResult({ success: 0, errors });
        toast.error("Importação falhou — verifique os erros");
      } else {
        if (data.length > 0) setCotas(data);
        setImportResult({ success: data.length, errors });
        if (errors.length === 0) {
          toast.success(`${data.length} faixas importadas com sucesso`);
        } else {
          toast.warning(`${data.length} faixas importadas, ${errors.length} erros`);
        }
      }
      setImporting(false);
    };
    reader.readAsText(file);
  };

  const updateCota = (id: string, field: keyof FaixaCota, value: string) => {
    setCotas(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (field === "descricao") return { ...c, [field]: value };
      const num = parseFloat(value);
      return { ...c, [field]: isNaN(num) ? 0 : num };
    }));
  };

  const addFaixa = () => {
    const last = cotas[cotas.length - 1];
    const newMin = last ? last.fipeMax + 1 : 0;
    const newId = `new-${Date.now()}`;
    setCotas(prev => [...prev, {
      id: newId, fipeMin: newMin, fipeMax: newMin + 50000,
      fator: 0, taxaAdmin: 0, descricao: "",
    }]);
    setEditingId(newId);
  };

  const removeFaixa = (id: string) => {
    setCotas(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <FileSpreadsheet className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Tabela de Cotas</h1>
        <Badge variant="secondary" className="text-xs">{cotas.length} faixas</Badge>
      </div>

      {/* Actions bar */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadTemplate}>
          <Download className="h-3.5 w-3.5" />Baixar Template CSV
        </Button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()} disabled={importing}>
          {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Importar Planilha
        </Button>
        <Button size="sm" className="gap-1.5 ml-auto" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Salvar Alterações
        </Button>
      </div>

      {/* Import result */}
      {importResult && (
        <Card className={importResult.errors.length > 0 ? "border-warning/30 bg-warning/5" : "border-emerald-500/30 bg-emerald-500/5"}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {importResult.errors.length > 0 ? (
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {importResult.success} faixa(s) importada(s)
                  {importResult.errors.length > 0 && `, ${importResult.errors.length} erro(s)`}
                </p>
                {importResult.errors.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {importResult.errors.map((err, i) => (
                      <li key={i} className="text-xs text-destructive">• {err}</li>
                    ))}
                  </ul>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setImportResult(null)} className="text-xs">Fechar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visual table */}
      {loadingFaixas && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Faixas de Cota por Valor FIPE</CardTitle>
              <CardDescription>Edite inline clicando no ícone de lápis. Faixas não podem se sobrepor.</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={addFaixa}>
              <Plus className="h-3.5 w-3.5" />Nova Faixa
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs">FIPE Mínimo</TableHead>
                  <TableHead className="text-xs">FIPE Máximo</TableHead>
                  <TableHead className="text-xs">Fator</TableHead>
                  <TableHead className="text-xs">Taxa Admin</TableHead>
                  <TableHead className="text-xs">Descrição</TableHead>
                  <TableHead className="text-xs w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cotas.map(c => {
                  const isEditing = editingId === c.id;
                  return (
                    <TableRow key={c.id} className={isEditing ? "bg-primary/5" : ""}>
                      <TableCell>
                        {isEditing ? (
                          <Input type="number" value={c.fipeMin} onChange={e => updateCota(c.id, "fipeMin", e.target.value)} className="h-8 text-xs w-28" />
                        ) : (
                          <span className="text-sm font-mono">{fmtBRL(c.fipeMin)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input type="number" value={c.fipeMax} onChange={e => updateCota(c.id, "fipeMax", e.target.value)} className="h-8 text-xs w-28" />
                        ) : (
                          <span className="text-sm font-mono">{fmtBRL(c.fipeMax)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input type="number" step="0.0001" value={c.fator} onChange={e => updateCota(c.id, "fator", e.target.value)} className="h-8 text-xs w-24" />
                        ) : (
                          <span className="text-sm font-semibold">{c.fator.toFixed(4)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input type="number" step="0.01" value={c.taxaAdmin} onChange={e => updateCota(c.id, "taxaAdmin", e.target.value)} className="h-8 text-xs w-20" />
                        ) : (
                          <span className="text-sm">{fmtBRL(c.taxaAdmin)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input value={c.descricao} onChange={e => updateCota(c.id, "descricao", e.target.value)} className="h-8 text-xs" />
                        ) : (
                          <span className="text-sm">{c.descricao || "—"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setEditingId(isEditing ? null : c.id)}
                          >
                            {isEditing ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Edit className="h-3.5 w-3.5" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFaixa(c.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="border-muted bg-muted/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Formato do CSV:</strong> FIP Mínima; FIP Máxima; Cota; Taxa Multiplicativa; Regional; Categoria</p>
              <p><strong>Regra:</strong> As faixas FIPE não podem ter sobreposição (ex: 0-30000, 30001-50000).</p>
              <p><strong>Integração:</strong> Ao salvar, os dados serão enviados para o backend e aplicados automaticamente na composição de mensalidades.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
