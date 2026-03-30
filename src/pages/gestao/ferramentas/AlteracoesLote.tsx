import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Upload, Trash2, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const mockPreview = [
  { cpf: "123.456.789-00", nome: "Carlos Silva", placa: "BRA2E19", produto: "Rastreador", acao: "Adicionar" },
  { cpf: "987.654.321-00", nome: "Maria Santos", placa: "RIO3A45", produto: "Rastreador", acao: "Adicionar" },
  { cpf: "456.789.123-00", nome: "João Oliveira", placa: "SPO1B23", produto: "Rastreador", acao: "Adicionar" },
  { cpf: "321.654.987-00", nome: "Ana Costa", placa: "MNA4C67", produto: "Rastreador", acao: "Adicionar" },
  { cpf: "654.321.789-00", nome: "Pedro Lima", placa: "GOI5D89", produto: "Rastreador", acao: "Adicionar" },
];

export default function AlteracoesLote({ onBack }: { onBack: () => void }) {
  const [operacao, setOperacao] = useState("adicionar");
  const [produtoOrigem, setProdutoOrigem] = useState("");
  const [produtoDestino, setProdutoDestino] = useState("");
  const [regional, setRegional] = useState("todas");
  const [cooperativa, setCooperativa] = useState("todas");
  const [step, setStep] = useState<"config" | "preview" | "processing" | "done">("config");
  const [progress, setProgress] = useState(0);

  const handleProcess = () => {
    setStep("processing");
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setStep("done");
          toast.success("Processamento concluído com sucesso!");
          return 100;
        }
        return p + 20;
      });
    }, 400);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl font-bold">Alterações em Lote</h2>
          <p className="text-sm text-muted-foreground">Aplicar, remover ou substituir produtos em massa</p>
        </div>
      </div>

      {step === "config" && (
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">Tipo de Operação</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {[
                  { id: "adicionar", label: "Adicionar Produto", icon: Upload },
                  { id: "remover", label: "Remover Produto", icon: Trash2 },
                  { id: "substituir", label: "Substituir Produto", icon: RefreshCw },
                ].map((op) => (
                  <Button key={op.id} variant={operacao === op.id ? "default" : "outline"} size="sm" onClick={() => setOperacao(op.id)} className="gap-1.5">
                    <op.icon className="h-3.5 w-3.5" />{op.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">Filtros</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Regional</Label>
                <Select value={regional} onValueChange={setRegional}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="sudeste">Sudeste</SelectItem>
                    <SelectItem value="sul">Sul</SelectItem>
                    <SelectItem value="nordeste">Nordeste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cooperativa</Label>
                <Select value={cooperativa} onValueChange={setCooperativa}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="central-sp">Central SP</SelectItem>
                    <SelectItem value="litoral-rj">Litoral RJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">Produtos</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{operacao === "substituir" ? "Produto a Remover" : "Produto"}</Label>
                <Select value={produtoOrigem} onValueChange={setProdutoOrigem}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rastreador">Rastreador</SelectItem>
                    <SelectItem value="assistencia">Assistência 24h</SelectItem>
                    <SelectItem value="carro-reserva">Carro Reserva</SelectItem>
                    <SelectItem value="vidros">Vidros</SelectItem>
                    <SelectItem value="terceiros">Proteção a Terceiros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {operacao === "substituir" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Produto Substituto</Label>
                  <Select value={produtoDestino} onValueChange={setProdutoDestino}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rastreador">Rastreador</SelectItem>
                      <SelectItem value="assistencia">Assistência 24h</SelectItem>
                      <SelectItem value="carro-reserva">Carro Reserva</SelectItem>
                      <SelectItem value="vidros">Vidros</SelectItem>
                      <SelectItem value="terceiros">Proteção a Terceiros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">Importar CSV (opcional)</CardTitle></CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                <Upload className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Arraste um CSV ou clique para selecionar</p>
                <p className="text-xs mt-1">Formato: CPF, Placa (opcional)</p>
                <Input type="file" accept=".csv" className="mt-3 max-w-xs mx-auto" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => setStep("preview")} disabled={!produtoOrigem}>Pré-visualizar Alterações</Button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Resumo das Alterações</CardTitle>
                <Badge variant="secondary">{mockPreview.length} registros</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">Operação:</span>
                  <Badge>{operacao === "adicionar" ? "Adicionar" : operacao === "remover" ? "Remover" : "Substituir"}</Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">Produto:</span>
                  <Badge variant="outline">{produtoOrigem}</Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">Regional:</span>
                  <span>{regional === "todas" ? "Todas" : regional}</span>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CPF</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPreview.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{r.cpf}</TableCell>
                      <TableCell>{r.nome}</TableCell>
                      <TableCell className="font-mono">{r.placa}</TableCell>
                      <TableCell>{r.produto}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{r.acao}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("config")}>Voltar</Button>
            <Button onClick={handleProcess} className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />Confirmar e Processar
            </Button>
          </div>
        </div>
      )}

      {step === "processing" && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 flex flex-col items-center gap-4">
            <RefreshCw className="h-10 w-10 text-primary animate-spin" />
            <p className="font-semibold">Processando alterações...</p>
            <div className="w-full max-w-md space-y-2">
              <Progress value={progress} className="h-3" />
              <p className="text-xs text-center text-muted-foreground">{progress}% concluído</p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "done" && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <p className="font-semibold text-lg">Processamento Concluído!</p>
            <p className="text-sm text-muted-foreground">{mockPreview.length} registros alterados com sucesso</p>
            <Button variant="outline" onClick={() => { setStep("config"); setProdutoOrigem(""); }}>Nova Operação</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
