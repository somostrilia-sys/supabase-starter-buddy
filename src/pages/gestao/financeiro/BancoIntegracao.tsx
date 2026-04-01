import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Download, FileText, Wifi, WifiOff, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function BancoIntegracao({ onBack }: { onBack: () => void }) {
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [extratoMock, setExtratoMock] = useState<{data: string; descricao: string; tipo: string; valor: number}[]>([]);

  useEffect(() => {
    supabase.from("boletos").select("nosso_numero, associado_nome, valor, data_pagamento, status")
      .eq("status", "baixado").not("data_pagamento", "is", null)
      .order("data_pagamento", { ascending: false }).limit(20)
      .then(({ data }) => {
        if (data) setExtratoMock(data.map((b: any) => ({
          data: b.data_pagamento || "",
          descricao: `Pgto boleto ${b.nosso_numero} - ${b.associado_nome || ""}`,
          tipo: "credito",
          valor: b.valor || 0,
        })));
      });
  }, []);

  const handleGerarRemessa = () => {
    setProcessando(true);
    setProgresso(0);
    const interval = setInterval(() => {
      setProgresso(p => {
        if (p >= 100) { clearInterval(interval); setProcessando(false); toast.success("Remessa CNAB 240 gerada com sucesso — 847 registros"); return 100; }
        return p + 15;
      });
    }, 150);
  };

  const handleRetorno = () => {
    setProcessando(true);
    setProgresso(0);
    const interval = setInterval(() => {
      setProgresso(p => {
        if (p >= 100) { clearInterval(interval); setProcessando(false); toast.success("Retorno processado — 312 pagamentos confirmados"); return 100; }
        return p + 10;
      });
    }, 180);
  };

  const totalCreditos = extratoMock.filter(e => e.tipo === "credito").reduce((s, e) => s + e.valor, 0);
  const totalDebitos = extratoMock.filter(e => e.tipo === "debito").reduce((s, e) => s + e.valor, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl font-bold">Integração Bancária</h2>
          <p className="text-sm text-muted-foreground">Remessa, retorno e extrato de cobrança</p>
        </div>
      </div>

      {/* Status */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Wifi className="h-6 w-6 text-success" />
            <div>
              <p className="font-semibold text-sm">Banco do Brasil</p>
              <p className="text-xs text-muted-foreground">CNAB 240 · Conta 12345-6</p>
              <Badge className="mt-1 bg-success/10 text-success dark:bg-green-900 dark:text-green-300">Conectado</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <WifiOff className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm">Bradesco</p>
              <p className="text-xs text-muted-foreground">CNAB 400</p>
              <Badge variant="secondary" className="mt-1">Desconectado</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <WifiOff className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm">Itaú</p>
              <p className="text-xs text-muted-foreground">API v2</p>
              <Badge variant="secondary" className="mt-1">Desconectado</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4" />Gerar Remessa</CardTitle>
            <CardDescription>Gerar arquivo de remessa para envio ao banco</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={handleGerarRemessa} disabled={processando}>
              {processando ? <><Loader2 className="h-4 w-4 animate-spin" />Gerando...</> : "Gerar Remessa CNAB 240"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" />Processar Retorno</CardTitle>
            <CardDescription>Upload de arquivo de retorno bancário</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full" onClick={handleRetorno} disabled={processando}>
              {processando ? <><Loader2 className="h-4 w-4 animate-spin" />Processando...</> : "Upload Arquivo Retorno"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {processando && (
        <Card><CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Processando...</span></div>
          <Progress value={progresso} className="h-2" />
        </CardContent></Card>
      )}

      {/* Extrato */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Extrato de Cobrança</CardTitle>
          <div className="flex gap-4 text-sm mt-2">
            <span className="text-success font-semibold">Créditos: R$ {totalCreditos.toFixed(2)}</span>
            <span className="text-destructive font-semibold">Débitos: R$ {totalDebitos.toFixed(2)}</span>
            <span className="font-bold">Saldo: R$ {(totalCreditos - totalDebitos).toFixed(2)}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Valor</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {extratoMock.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">Conecte sua conta bancária para ver o extrato</TableCell></TableRow>
              ) : extratoMock.map((e, i) => (
                <TableRow key={i}>
                  <TableCell>{new Date(e.data).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>{e.descricao}</TableCell>
                  <TableCell><Badge className={e.tipo === "credito" ? "bg-success/10 text-success dark:bg-green-900 dark:text-green-300" : "bg-destructive/8 text-destructive dark:bg-red-900 dark:text-red-300"}>{e.tipo}</Badge></TableCell>
                  <TableCell className={`text-right font-mono ${e.tipo === "credito" ? "text-success" : "text-destructive"}`}>{e.tipo === "debito" ? "-" : "+"}R$ {e.valor.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
