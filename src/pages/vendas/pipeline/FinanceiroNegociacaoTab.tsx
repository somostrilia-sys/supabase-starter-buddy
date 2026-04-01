import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { PipelineDeal } from "./mockData";
import {
  CreditCard, QrCode, Receipt, Banknote, DollarSign,
  Link2, Download, Eye, Plus, FileText,
} from "lucide-react";

type PagamentoStatus = "pago" | "pendente" | "nao_pago";

const statusBadge: Record<PagamentoStatus, { label: string; cls: string }> = {
  pago: { label: "Pago", cls: "bg-success/10 text-success border-green-300" },
  pendente: { label: "Pendente", cls: "bg-warning/10 text-warning border-warning/30" },
  nao_pago: { label: "Não Pago", cls: "bg-destructive/8 text-destructive border-red-300" },
};

const formasPgto = [
  { id: "cartao", label: "Cartão", icon: CreditCard },
  { id: "pix", label: "PIX", icon: QrCode },
  { id: "boleto", label: "Boleto", icon: Receipt },
  { id: "dinheiro", label: "Dinheiro", icon: Banknote },
];

interface Fatura {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  status: PagamentoStatus;
  tipo: "adesao" | "mensalidade" | "recibo";
}

const mockFaturas: Fatura[] = [
  { id: "fat-1", data: "05/03/2026", descricao: "Taxa de Adesão — Parcela 1/3", valor: 266.33, status: "pago", tipo: "adesao" },
  { id: "fat-2", data: "05/04/2026", descricao: "Taxa de Adesão — Parcela 2/3", valor: 266.33, status: "pendente", tipo: "adesao" },
  { id: "fat-3", data: "05/05/2026", descricao: "Taxa de Adesão — Parcela 3/3", valor: 266.34, status: "nao_pago", tipo: "adesao" },
  { id: "fat-4", data: "10/03/2026", descricao: "Mensalidade — Plano Completo (Mar/2026)", valor: 189.90, status: "pago", tipo: "mensalidade" },
  { id: "fat-5", data: "10/04/2026", descricao: "Mensalidade — Plano Completo (Abr/2026)", valor: 189.90, status: "pendente", tipo: "mensalidade" },
  { id: "fat-6", data: "05/03/2026", descricao: "Recibo de Pagamento — Adesão + 1ª Mensalidade", valor: 456.23, status: "pago", tipo: "recibo" },
];

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface Props { deal: PipelineDeal; }

export default function FinanceiroNegociacaoTab({ deal }: Props) {
  const [formaPgto, setFormaPgto] = useState("pix");
  const [configEmpresa, setConfigEmpresa] = useState<any>(null);

  useEffect(() => {
    supabase.from("config_empresa" as any).select("*").limit(1).maybeSingle()
      .then(({ data }) => setConfigEmpresa(data));
  }, []);

  const valorPlano = 189.90;
  const taxaAdesao = 799.00;
  const totalPago = mockFaturas.filter(f => f.status === "pago").reduce((s, f) => s + f.valor, 0);
  const totalPendente = mockFaturas.filter(f => f.status !== "pago").reduce((s, f) => s + f.valor, 0);

  return (
    <div className="space-y-5">
      {/* Cards resumo */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Valor do Plano", valor: valorPlano, sub: "/mês", color: "#1A3A5C", icon: DollarSign },
          { label: "Taxa de Adesão", valor: taxaAdesao, sub: "3x", color: "#1A3A5C", icon: FileText },
          { label: "Total Pago", valor: totalPago, sub: "", color: "#16a34a", icon: CreditCard },
          { label: "Pendente", valor: totalPendente, sub: "", color: "#dc2626", icon: Receipt },
        ].map(c => (
          <Card key={c.label} className="rounded-none border-t-2" style={{ borderTopColor: c.color }}>
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <c.icon className="h-3.5 w-3.5" />{c.label}
              </div>
              <p className="text-xl font-bold" style={{ color: c.color }}>
                {fmt(c.valor)}{c.sub && <span className="text-xs font-normal text-muted-foreground ml-1">{c.sub}</span>}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Forma de pagamento */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-[#1A3A5C] border-b-2 border-[#747474] pb-1 w-full">FORMA DE PAGAMENTO</legend>
        <div className="flex gap-2">
          {formasPgto.map(f => {
            const selected = formaPgto === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFormaPgto(f.id)}
                className={`flex items-center gap-2 px-4 py-2.5 border-2 text-sm transition-all ${
                  selected ? "border-[#1A3A5C] bg-[#1A3A5C]/5 font-semibold" : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <f.icon className={`h-4 w-4 ${selected ? "text-[#1A3A5C]" : "text-muted-foreground"}`} />
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status geral:</span>
          <Badge className={`rounded-none border ${statusBadge.pendente.cls}`}>{statusBadge.pendente.label}</Badge>
        </div>

        {/* PIX da empresa */}
        {formaPgto === "pix" && (
          <Card className="rounded-none border-2 border-[#1A3A5C]/20 bg-[#1A3A5C]/3">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-[#1A3A5C]" />
                <span className="text-sm font-bold text-[#1A3A5C]">Pagamento via PIX</span>
              </div>

              {configEmpresa?.pix_qrcode_url && (
                <div className="flex justify-center py-2">
                  <img src={configEmpresa.pix_qrcode_url} alt="QR Code PIX" className="w-48 h-48 border" />
                </div>
              )}

              {!configEmpresa?.pix_qrcode_url && (
                <div className="flex justify-center py-4">
                  <div className="w-48 h-48 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground text-center px-4">QR Code não configurado.<br/>Configure em Minha Empresa.</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Chave PIX ({configEmpresa?.pix_tipo || "CNPJ"})</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-muted px-3 py-1.5 flex-1 select-all">{configEmpresa?.pix_chave || configEmpresa?.cnpj || "58.506.161/0001-31"}</code>
                    <Button size="sm" variant="outline" className="rounded-none text-xs" onClick={() => {
                      navigator.clipboard.writeText(configEmpresa?.pix_chave || configEmpresa?.cnpj || "58.506.161/0001-31");
                      toast.success("Chave PIX copiada!");
                    }}>Copiar</Button>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Favorecido</span>
                  <p className="text-sm font-medium">{configEmpresa?.pix_nome || configEmpresa?.nome || "Objetivo Auto Benefícios"}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" className="rounded-none text-xs flex-1" onClick={() => {
                  const texto = `PIX para ${configEmpresa?.pix_nome || "Objetivo Auto Benefícios"}\nChave: ${configEmpresa?.pix_chave || configEmpresa?.cnpj || "58.506.161/0001-31"}\nTipo: ${configEmpresa?.pix_tipo || "CNPJ"}`;
                  navigator.clipboard.writeText(texto);
                  toast.success("Dados PIX copiados para enviar ao cliente!");
                }}>
                  <Link2 className="h-3 w-3 mr-1" />Copiar dados p/ cliente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </fieldset>

      {/* Split de Pagamento */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-[#1A3A5C] border-b-2 border-[#747474] pb-1 w-full">SPLIT DE PAGAMENTO (COMISSÃO)</legend>
        <div className="p-4 rounded border bg-muted/30 space-y-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded bg-background border">
              <p className="text-[10px] text-muted-foreground uppercase">Valor Total Adesão</p>
              <p className="text-lg font-bold text-[#1A3A5C]">{fmt(taxaAdesao)}</p>
            </div>
            <div className="text-center p-3 rounded bg-emerald-50 dark:bg-emerald-950/20 border border-success/20 dark:border-emerald-800">
              <p className="text-[10px] text-muted-foreground uppercase">Comissão Consultor</p>
              <p className="text-lg font-bold text-success dark:text-emerald-400">{fmt(taxaAdesao * 0.15)}</p>
              <p className="text-[10px] text-emerald-600">15% — {deal.consultor}</p>
            </div>
            <div className="text-center p-3 rounded bg-background border">
              <p className="text-[10px] text-muted-foreground uppercase">Líquido Associação</p>
              <p className="text-lg font-bold text-[#1A3A5C]">{fmt(taxaAdesao * 0.85)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            Split automático via gateway — executado na confirmação do pagamento
          </div>
        </div>
      </fieldset>

      {/* Tabela de faturas */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-[#1A3A5C] border-b-2 border-[#747474] pb-1 w-full">FATURAS E RECIBOS</legend>
        <Table>
          <TableHeader>
            <TableRow>
              {["Data", "Descrição", "Valor", "Status", "Ação"].map(h => (
                <TableHead key={h} className="text-xs">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockFaturas.map(f => {
              const st = statusBadge[f.status];
              return (
                <TableRow key={f.id}>
                  <TableCell className="text-xs font-mono">{f.data}</TableCell>
                  <TableCell className="text-sm">{f.descricao}</TableCell>
                  <TableCell className="text-sm font-semibold">{fmt(f.valor)}</TableCell>
                  <TableCell><Badge className={`rounded-none border text-[10px] ${st.cls}`}>{st.label}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {f.status === "pago" && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toast.info("Baixando recibo...")}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {f.status !== "pago" && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toast.success("Link de pagamento copiado!")}>
                          <Link2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toast.info("Visualizando fatura...")}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </fieldset>

      {/* Ações */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="rounded-none bg-[#1A3A5C] hover:bg-[#15304D] text-white" onClick={() => toast.success("Boleto gerado com sucesso!")}>
          <Receipt className="h-3.5 w-3.5 mr-1" />Gerar Boleto
        </Button>
        <Button size="sm" variant="outline" className="rounded-none" onClick={() => toast.success("Link de pagamento gerado!")}>
          <Link2 className="h-3.5 w-3.5 mr-1" />Gerar Link de Pagamento
        </Button>
        <Button size="sm" variant="outline" className="rounded-none" onClick={() => toast.success("Recibo gerado!")}>
          <Download className="h-3.5 w-3.5 mr-1" />Gerar Recibo
        </Button>
        <Button size="sm" variant="outline" className="rounded-none" onClick={() => toast.info("Registrando pagamento manual...")}>
          <Plus className="h-3.5 w-3.5 mr-1" />Registrar Pagamento Manual
        </Button>
      </div>
    </div>
  );
}
