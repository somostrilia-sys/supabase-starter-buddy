import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Search, ArrowLeft, Loader2, FileText, QrCode, Copy, Download,
  DollarSign, CheckCircle2, Percent, Tag,
} from "lucide-react";

const fmtBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export default function BoletoAvulso({ onBack }: { onBack: () => void }) {
  const [placa, setPlaca] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [veiculo, setVeiculo] = useState<any>(null);
  const [aplicarDesconto15, setAplicarDesconto15] = useState(true);
  const [descontoTipo, setDescontoTipo] = useState<"percent" | "valor">("percent");
  const [descontoAdicional, setDescontoAdicional] = useState("");
  const [gerando, setGerando] = useState(false);
  const [boletoGerado, setBoletoGerado] = useState<any>(null);

  const buscar = async () => {
    if (!placa.trim()) return;
    setBuscando(true);
    setVeiculo(null);
    setBoletoGerado(null);
    try {
      // 1) veículo (sem embed para evitar ambiguidade de relacionamento)
      const { data: vdata, error: verr } = await supabase
        .from("veiculos")
        .select("*")
        .ilike("placa", `%${placa.replace(/[-\s]/g, "")}%`)
        .limit(1)
        .maybeSingle();
      if (verr) throw verr;
      if (!vdata) { toast.error("Placa não encontrada no cadastro."); return; }

      // 2) associado
      let associado: any = null;
      if ((vdata as any).associado_id) {
        const { data: adata } = await supabase
          .from("associados")
          .select("id, nome, cpf, regional_id, cooperativa_id")
          .eq("id", (vdata as any).associado_id)
          .maybeSingle();
        associado = adata;
      }

      // 3) contrato do veículo (filtro direto por FK, sem embed)
      const { data: cdata } = await (supabase as any)
        .from("contratos")
        .select("id, plano_id, valor_mensalidade, valor_mensal, status")
        .eq("veiculo_id", (vdata as any).id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // 4) plano
      let planoNome = "Sem plano";
      if (cdata?.plano_id) {
        const { data: pdata } = await supabase
          .from("planos").select("nome").eq("id", cdata.plano_id).maybeSingle();
        planoNome = (pdata as any)?.nome || "Sem plano";
      }

      // 5) Buscar faixa FIPE para taxa adm e rateio
      let taxaAdm = 0;
      let rateio = 0;
      if ((vdata as any).valor_fipe) {
        const { data: faixa } = await (supabase as any)
          .from("faixas_fipe")
          .select("taxa_adm, fator")
          .lte("fipe_inicial", (vdata as any).valor_fipe)
          .gte("fipe_final", (vdata as any).valor_fipe)
          .limit(1)
          .maybeSingle();
        if (faixa) {
          taxaAdm = faixa.taxa_adm || 0;
          rateio = ((vdata as any).valor_fipe * (faixa.fator || 0)) / 100;
        }
      }

      const valorProdutos = cdata?.valor_mensalidade ?? cdata?.valor_mensal ?? 0;

      setVeiculo({
        ...vdata,
        associados: associado,
        plano: planoNome,
        valorProdutos,
        taxaAdm,
        rateio,
        valorTotal: valorProdutos + taxaAdm + rateio,
        situacao: (vdata as any).status || "Ativo",
      });
    } catch (e: any) {
      toast.error(e.message || "Erro ao buscar veículo");
    } finally {
      setBuscando(false);
    }
  };

  const calcularValorFinal = () => {
    if (!veiculo) return 0;
    const valorBase = veiculo.valorTotal;
    const comDesconto = aplicarDesconto15 ? valorBase * 0.85 : valorBase;
    const adicional = parseFloat(descontoAdicional) || 0;
    if (descontoTipo === "percent") {
      return comDesconto * (1 - adicional / 100);
    }
    return Math.max(0, comDesconto - adicional);
  };

  const gerarBoleto = async () => {
    if (!veiculo) return;
    setGerando(true);
    try {
      const valorFinal = calcularValorFinal();
      const vencimento = new Date();
      vencimento.setDate(vencimento.getDate() + 10);

      const { data: boleto, error } = await supabase.from("boletos").insert({
        associado_id: veiculo.associados?.id || null,
        valor: valorFinal,
        vencimento: vencimento.toISOString().split("T")[0],
        status: "pendente",
        referencia: `Boleto Avulso - ${veiculo.placa}`,
        tipo: "avulso",
        associado_nome: veiculo.associados?.nome || "",
        cpf_associado: veiculo.associados?.cpf || "",
      } as any).select("id").single();

      if (error) throw error;

      setBoletoGerado({
        id: boleto.id,
        valor: valorFinal,
        vencimento: vencimento.toISOString().split("T")[0],
        linhaDigitavel: `23793.38128 60000.000${Date.now().toString().slice(-6)} ${Date.now().toString().slice(-5)}.316001 1 ${Math.floor(valorFinal * 100).toString().padStart(10, "0")}`,
        qrCode: `00020126580014br.gov.bcb.pix0136${veiculo.associados?.cpf || "00000000000"}5204000053039865802BR5913GIA OBJETIVO6009SAO PAULO62070503***6304`,
      });
      toast.success("Boleto avulso gerado com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar boleto");
    } finally {
      setGerando(false);
    }
  };

  const copiar = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  return (
    <div className="p-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-lg font-bold">Boleto Avulso</h2>
          <p className="text-xs text-muted-foreground">Gerar boleto individual por placa</p>
        </div>
      </div>

      {/* Busca por placa */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-xs">Placa do Veículo</Label>
              <Input
                value={placa}
                onChange={e => setPlaca(e.target.value.toUpperCase())}
                placeholder="ABC-1D23"
                onKeyDown={e => e.key === "Enter" && buscar()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={buscar} disabled={buscando} className="gap-1.5">
                {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados do veículo */}
      {veiculo && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" /> Dados do Veículo e Valores
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><Label className="text-xs text-muted-foreground">Placa</Label><p className="font-mono font-bold">{veiculo.placa}</p></div>
                <div><Label className="text-xs text-muted-foreground">Modelo</Label><p className="text-sm">{veiculo.modelo}</p></div>
                <div><Label className="text-xs text-muted-foreground">Associado</Label><p className="text-sm">{veiculo.associados?.nome || "—"}</p></div>
                <div><Label className="text-xs text-muted-foreground">Situação</Label><Badge variant="outline">{veiculo.situacao}</Badge></div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><Label className="text-xs text-muted-foreground">Plano</Label><p className="text-sm font-medium">{veiculo.plano}</p></div>
                <div><Label className="text-xs text-muted-foreground">Produtos</Label><p className="text-sm font-medium">{fmtBRL(veiculo.valorProdutos)}</p></div>
                <div><Label className="text-xs text-muted-foreground">Taxa Administrativa</Label><p className="text-sm font-medium">{fmtBRL(veiculo.taxaAdm)}</p></div>
                <div><Label className="text-xs text-muted-foreground">Rateio</Label><p className="text-sm font-medium">{fmtBRL(veiculo.rateio)}</p></div>
              </div>

              <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm font-semibold">Valor Total (sem desconto)</span>
                <span className="text-lg font-bold">{fmtBRL(veiculo.valorTotal)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Descontos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Percent className="h-4 w-4 text-primary" /> Descontos</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className={`flex items-center justify-between gap-3 rounded-lg p-3 border ${aplicarDesconto15 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-muted/30 border-border"}`}>
                <div className="flex items-center gap-2">
                  {aplicarDesconto15 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Tag className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm">
                    {aplicarDesconto15
                      ? <>Desconto de <strong>15%</strong> aplicado: {fmtBRL(veiculo.valorTotal * 0.15)}</>
                      : <>Desconto de 15% <strong>não aplicado</strong></>}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="switch-desconto-15" className="text-xs cursor-pointer">Aplicar 15%</Label>
                  <Switch
                    id="switch-desconto-15"
                    checked={aplicarDesconto15}
                    onCheckedChange={setAplicarDesconto15}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Tipo de Desconto Adicional</Label>
                  <Select value={descontoTipo} onValueChange={(v: any) => setDescontoTipo(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Porcentagem (%)</SelectItem>
                      <SelectItem value="valor">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Desconto Adicional (opcional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={descontoAdicional}
                    onChange={e => setDescontoAdicional(e.target.value)}
                    placeholder={descontoTipo === "percent" ? "Ex: 5" : "Ex: 50.00"}
                  />
                </div>
                <div className="flex items-end">
                  <div className="bg-primary/10 rounded-lg p-3 w-full text-center">
                    <p className="text-xs text-muted-foreground">Valor Final</p>
                    <p className="text-xl font-bold text-primary">{fmtBRL(calcularValorFinal())}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={gerarBoleto} disabled={gerando} className="gap-1.5" size="lg">
                  {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Gerar Boleto
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Resultado do boleto gerado */}
      {boletoGerado && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Boleto Gerado com Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><Label className="text-xs text-muted-foreground">Valor</Label><p className="text-lg font-bold">{fmtBRL(boletoGerado.valor)}</p></div>
              <div><Label className="text-xs text-muted-foreground">Vencimento</Label><p className="text-sm font-medium">{new Date(boletoGerado.vencimento + "T12:00:00").toLocaleDateString("pt-BR")}</p></div>
              <div><Label className="text-xs text-muted-foreground">ID</Label><p className="text-xs font-mono">{boletoGerado.id?.slice(0, 8)}</p></div>
            </div>

            <Separator />

            {/* Linha Digitável */}
            <div>
              <Label className="text-xs font-semibold">Linha Digitável</Label>
              <div className="flex gap-2 mt-1">
                <Input value={boletoGerado.linhaDigitavel} readOnly className="font-mono text-xs bg-muted/50" />
                <Button variant="outline" size="icon" onClick={() => copiar(boletoGerado.linhaDigitavel, "Linha digitável")}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* QR Code PIX */}
            <div>
              <Label className="text-xs font-semibold">QR Code PIX</Label>
              <div className="flex gap-2 mt-1">
                <Input value={boletoGerado.qrCode} readOnly className="font-mono text-xs bg-muted/50" />
                <Button variant="outline" size="icon" onClick={() => copiar(boletoGerado.qrCode, "QR Code PIX")}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Baixar PDF
              </Button>
              <Button variant="outline" className="gap-1.5">
                <QrCode className="h-3.5 w-3.5" /> Exibir QR Code
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
