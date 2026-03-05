import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft, Upload, Download, FileSpreadsheet, CheckCircle2, XCircle,
  AlertTriangle, RefreshCw, Clock, User, File, Filter
} from "lucide-react";

type RowStatus = "novo" | "atualizar" | "erro";
type Step = "upload" | "preview" | "resultado";

interface PreviewRow {
  linha: number;
  valorFipeInicial: string;
  valorFipeFinal: string;
  valorRateio: string;
  taxaAdm: string;
  cotaFator: string;
  tipoVeiculo: string;
  regional: string;
  situacao: string;
  status: RowStatus;
  erro?: string;
}

interface HistoricoItem {
  id: string;
  dataHora: string;
  usuario: string;
  arquivo: string;
  inseridos: number;
  atualizados: number;
  rejeitados: number;
  regionais: string;
  status: "sucesso" | "parcial" | "falha";
}

const mockPreview: PreviewRow[] = [
  { linha: 1, valorFipeInicial: "0,00", valorFipeFinal: "30.000,00", valorRateio: "89,90", taxaAdm: "29,90", cotaFator: "1.00", tipoVeiculo: "AUTOMOVEL", regional: "01", situacao: "Ativo", status: "novo" },
  { linha: 2, valorFipeInicial: "30.000,01", valorFipeFinal: "50.000,00", valorRateio: "119,90", taxaAdm: "34,90", cotaFator: "1.15", tipoVeiculo: "AUTOMOVEL", regional: "01", situacao: "Ativo", status: "novo" },
  { linha: 3, valorFipeInicial: "50.000,01", valorFipeFinal: "80.000,00", valorRateio: "159,90", taxaAdm: "39,90", cotaFator: "1.30", tipoVeiculo: "MOTOCICLETA", regional: "03", situacao: "Ativo", status: "atualizar" },
  { linha: 4, valorFipeInicial: "0,00", valorFipeFinal: "15.000,00", valorRateio: "59,90", taxaAdm: "19,90", cotaFator: "0.85", tipoVeiculo: "MOTOCICLETA", regional: "03", situacao: "Ativo", status: "atualizar" },
  { linha: 5, valorFipeInicial: "80.000,01", valorFipeFinal: "120.000,00", valorRateio: "219,90", taxaAdm: "49,90", cotaFator: "1.50", tipoVeiculo: "CAMINHAO", regional: "07", situacao: "Ativo", status: "novo" },
  { linha: 6, valorFipeInicial: "0,00", valorFipeFinal: "abc", valorRateio: "89,90", taxaAdm: "29,90", cotaFator: "1.00", tipoVeiculo: "UTILITARIO", regional: "05", situacao: "Ativo", status: "erro", erro: "Valor FIPE Final inválido: esperado formato numérico" },
  { linha: 7, valorFipeInicial: "120.000,01", valorFipeFinal: "200.000,00", valorRateio: "299,90", taxaAdm: "59,90", cotaFator: "1.80", tipoVeiculo: "ONIBUS", regional: "10", situacao: "Ativo", status: "atualizar" },
  { linha: 8, valorFipeInicial: "30.000,01", valorFipeFinal: "50.000,00", valorRateio: "-10,00", taxaAdm: "29,90", cotaFator: "1.10", tipoVeiculo: "AUTOMOVEL", regional: "02", situacao: "Ativo", status: "erro", erro: "Valor Rateio não pode ser negativo" },
];

const mockHistorico: HistoricoItem[] = [
  { id: "1", dataHora: "04/03/2026 14:32", usuario: "Carlos Silva", arquivo: "cotas_mar_2026.xlsx", inseridos: 42, atualizados: 18, rejeitados: 0, regionais: "01, 03, 05", status: "sucesso" },
  { id: "2", dataHora: "28/02/2026 09:15", usuario: "Ana Souza", arquivo: "ajuste_caminhoes.csv", inseridos: 0, atualizados: 25, rejeitados: 3, regionais: "07, 10", status: "parcial" },
  { id: "3", dataHora: "15/02/2026 16:48", usuario: "João Mendes", arquivo: "motos_regional3.xlsx", inseridos: 15, atualizados: 0, rejeitados: 0, regionais: "03", status: "sucesso" },
  { id: "4", dataHora: "10/02/2026 11:20", usuario: "Maria Oliveira", arquivo: "cotas_invalidas.csv", inseridos: 0, atualizados: 0, rejeitados: 30, regionais: "01-14", status: "falha" },
  { id: "5", dataHora: "01/02/2026 08:00", usuario: "Carlos Silva", arquivo: "cotas_fev_2026.xlsx", inseridos: 55, atualizados: 22, rejeitados: 1, regionais: "01, 02, 04, 06", status: "parcial" },
];

const statusBadge = (s: RowStatus) => {
  if (s === "novo") return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/15">Novo</Badge>;
  if (s === "atualizar") return <Badge className="bg-primary/15 text-primary border-primary/20 hover:bg-primary/15">Atualizar</Badge>;
  return <Badge variant="destructive">Erro</Badge>;
};

const histStatusBadge = (s: HistoricoItem["status"]) => {
  if (s === "sucesso") return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/15">Sucesso</Badge>;
  if (s === "parcial") return <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 hover:bg-amber-500/15">Parcial</Badge>;
  return <Badge variant="destructive">Falha</Badge>;
};

export default function AlteracaoCotaMassa({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [resultType, setResultType] = useState<"success" | "partial" | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const novos = mockPreview.filter(r => r.status === "novo").length;
  const atualizados = mockPreview.filter(r => r.status === "atualizar").length;
  const erros = mockPreview.filter(r => r.status === "erro").length;

  const filtered = filterStatus === "todos" ? mockPreview
    : filterStatus === "novos" ? mockPreview.filter(r => r.status === "novo")
    : filterStatus === "atualizacoes" ? mockPreview.filter(r => r.status === "atualizar")
    : mockPreview.filter(r => r.status === "erro");

  const handleFile = (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "csv") return;
    if (f.size > 5 * 1024 * 1024) return;
    setFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  const processFile = () => {
    setProcessing(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setProcessing(false);
          setStep("preview");
          return 100;
        }
        return prev + 12;
      });
    }, 200);
  };

  const confirmar = () => {
    setResultType(erros > 0 ? "partial" : "success");
    setStep("resultado");
  };

  const resetar = () => {
    setStep("upload");
    setFile(null);
    setProgress(0);
    setResultType(null);
    setFilterStatus("todos");
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Alteração de Cota em Massa</h1>
          <p className="text-sm text-muted-foreground">Importe planilhas para atualizar intervalos de cotas por regional e tipo de veículo</p>
        </div>
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload de Planilha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
            >
              <Upload className="h-12 w-12 text-muted-foreground/50" />
              {file ? (
                <div className="text-center">
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <>
                  <p className="font-medium text-muted-foreground">Arraste seu arquivo ou clique para selecionar</p>
                  <p className="text-xs text-muted-foreground">Formatos aceitos: .xlsx, .csv — Tamanho máximo: 5MB</p>
                </>
              )}
              <input ref={inputRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>

            {processing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Processando arquivo...</span>
                  <span className="font-medium">{Math.min(progress, 100)}%</span>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-2" />
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Baixar Modelo de Planilha
              </Button>
              <Button onClick={processFile} disabled={!file || processing} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${processing ? "animate-spin" : ""}`} />
                Processar Arquivo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Preview */}
      {step === "preview" && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockPreview.length}</p>
                  <p className="text-xs text-muted-foreground">Total de Linhas</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{novos}</p>
                  <p className="text-xs text-muted-foreground">Novos Registros</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{atualizados}</p>
                  <p className="text-xs text-muted-foreground">Atualizações</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{erros}</p>
                  <p className="text-xs text-muted-foreground">Erros</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter + Table */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base">Pré-visualização</CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="novos">Novos</SelectItem>
                    <SelectItem value="atualizacoes">Atualizações</SelectItem>
                    <SelectItem value="erros">Erros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Linha</TableHead>
                      <TableHead>FIPE Inicial</TableHead>
                      <TableHead>FIPE Final</TableHead>
                      <TableHead>Rateio</TableHead>
                      <TableHead>Taxa ADM</TableHead>
                      <TableHead>Cota (Fator)</TableHead>
                      <TableHead>Tipo Veículo</TableHead>
                      <TableHead>Regional</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(row => (
                      <TableRow key={row.linha} className={row.status === "erro" ? "bg-destructive/5" : ""}>
                        <TableCell className="font-mono text-sm">{row.linha}</TableCell>
                        <TableCell>{row.valorFipeInicial}</TableCell>
                        <TableCell>{row.valorFipeFinal}</TableCell>
                        <TableCell>{row.valorRateio}</TableCell>
                        <TableCell>{row.taxaAdm}</TableCell>
                        <TableCell>{row.cotaFator}</TableCell>
                        <TableCell className="text-xs">{row.tipoVeiculo}</TableCell>
                        <TableCell>{row.regional}</TableCell>
                        <TableCell>{row.situacao}</TableCell>
                        <TableCell className="text-center">
                          {row.erro ? (
                            <Tooltip>
                              <TooltipTrigger>{statusBadge(row.status)}</TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                <p className="text-xs">{row.erro}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : statusBadge(row.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button onClick={confirmar} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Confirmar Importação
            </Button>
            <Button variant="outline" onClick={resetar}>Cancelar</Button>
          </div>
        </>
      )}

      {/* Step: Resultado */}
      {step === "resultado" && (
        <Card className={resultType === "success" ? "border-emerald-300" : "border-amber-300"}>
          <CardContent className="p-6 flex items-start gap-4">
            {resultType === "success" ? (
              <CheckCircle2 className="h-10 w-10 text-emerald-600 shrink-0 mt-1" />
            ) : (
              <AlertTriangle className="h-10 w-10 text-amber-600 shrink-0 mt-1" />
            )}
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-lg">
                {resultType === "success" ? "Importação concluída" : "Importação parcial"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {resultType === "success"
                  ? `${novos + atualizados} registros processados com sucesso. ${novos} inseridos, ${atualizados} atualizados.`
                  : `${novos + atualizados} processados, ${erros} com erro. ${novos} inseridos, ${atualizados} atualizados.`}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Baixar Relatório
                </Button>
                <Button onClick={resetar} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Nova Importação
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Histórico de Importações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead className="text-center">Inseridos</TableHead>
                  <TableHead className="text-center">Atualizados</TableHead>
                  <TableHead className="text-center">Rejeitados</TableHead>
                  <TableHead>Regional(is)</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockHistorico.map(h => (
                  <TableRow key={h.id}>
                    <TableCell className="text-sm whitespace-nowrap">{h.dataHora}</TableCell>
                    <TableCell className="flex items-center gap-2 text-sm">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {h.usuario}
                    </TableCell>
                    <TableCell className="flex items-center gap-2 text-sm">
                      <File className="h-3.5 w-3.5 text-muted-foreground" />
                      {h.arquivo}
                    </TableCell>
                    <TableCell className="text-center font-medium text-emerald-600">{h.inseridos}</TableCell>
                    <TableCell className="text-center font-medium text-primary">{h.atualizados}</TableCell>
                    <TableCell className="text-center font-medium text-destructive">{h.rejeitados}</TableCell>
                    <TableCell className="text-sm">{h.regionais}</TableCell>
                    <TableCell className="text-center">{histStatusBadge(h.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
