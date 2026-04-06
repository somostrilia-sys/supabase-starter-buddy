import { useState } from "react";
import { callEdge } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShieldAlert, BrainCircuit, Loader2, CheckCircle, AlertTriangle, Send, RotateCcw } from "lucide-react";
import ExcecaoButton from "./ExcecaoButton";

interface Props {
  negociacaoId: string;
  consultorId?: string;
  onSuccess?: (result: any) => void;
}

const MOTIVOS_LIBERACAO = [
  { value: "desconto", label: "Desconto" },
  { value: "vencimento", label: "Data de Vencimento" },
  { value: "vistoria_negada", label: "Vistoria Negada" },
  { value: "veiculo_bloqueado", label: "Veículo Não Aceito" },
];

interface AnaliseResult {
  aprovado: boolean;
  detalhes: Record<string, any>;
  score_risco: number;
  justificativa: string;
  parcial?: boolean;
  itens_aprovados?: string[];
  itens_negados?: string[];
}

export default function PedirLiberacaoButton({ negociacaoId, consultorId, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [descontoPercentual, setDescontoPercentual] = useState("");
  const [diaSolicitado, setDiaSolicitado] = useState("");
  const [propostaConcorrenteUrl, setPropostaConcorrenteUrl] = useState("");
  const [analisando, setAnalisando] = useState(false);
  const [analiseResult, setAnaliseResult] = useState<AnaliseResult | null>(null);
  const [etapa, setEtapa] = useState<"formulario" | "analisando" | "resultado">("formulario");

  function reset() {
    setMotivo("");
    setJustificativa("");
    setDescontoPercentual("");
    setDiaSolicitado("");
    setPropostaConcorrenteUrl("");
    setAnaliseResult(null);
    setEtapa("formulario");
    setAnalisando(false);
  }

  async function handleAnalisar() {
    if (!motivo) {
      toast.error("Selecione o motivo da liberação.");
      return;
    }
    if (!justificativa.trim()) {
      toast.error("Descreva a justificativa.");
      return;
    }

    setEtapa("analisando");
    setAnalisando(true);

    const pedidos: any = {};
    if (motivo === "desconto") {
      pedidos.desconto = {
        percentual: parseFloat(descontoPercentual) || 0,
        proposta_concorrente_url: propostaConcorrenteUrl || undefined,
      };
    }
    if (motivo === "vencimento") {
      pedidos.vencimento = { dia_solicitado: parseInt(diaSolicitado) || 0 };
    }
    if (motivo === "vistoria_negada") {
      pedidos.vistoria = { reanalisar: true };
    }
    if (motivo === "veiculo_bloqueado") {
      pedidos.veiculo = { liberar: true };
    }

    try {
      const res = await callEdge("gia-analise-liberacao", {
        negociacao_id: negociacaoId,
        consultor_id: consultorId,
        pedidos,
        justificativa,
      });

      if (res.sucesso) {
        setAnaliseResult({
          aprovado: res.aprovado,
          detalhes: res.detalhes || {},
          score_risco: res.score_risco || 0,
          justificativa: res.justificativa || "",
          parcial: res.parcial,
          itens_aprovados: res.itens_aprovados,
          itens_negados: res.itens_negados,
        });
        setEtapa("resultado");

        if (res.aprovado) {
          toast.success("Liberação aprovada pela IA!");
          onSuccess?.(res);
        }
      } else {
        toast.error(res.error || "Erro na análise");
        setEtapa("formulario");
      }
    } catch (err: any) {
      toast.error("Erro ao consultar IA: " + (err?.message || ""));
      setEtapa("formulario");
    } finally {
      setAnalisando(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        className="rounded-none bg-[#1A3A5C] hover:bg-[#15304D] text-white"
        onClick={() => { reset(); setOpen(true); }}
      >
        <ShieldAlert className="h-3.5 w-3.5 mr-1" />Pedir Liberação
      </Button>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Pedir Liberação
            </DialogTitle>
          </DialogHeader>

          {/* ETAPA 1: Formulário */}
          {etapa === "formulario" && (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Qual motivo da liberação?</label>
                <Select value={motivo} onValueChange={setMotivo}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOTIVOS_LIBERACAO.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Campos condicionais por motivo */}
              {motivo === "desconto" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Percentual solicitado (%)</label>
                    <Input
                      className="rounded-none"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Ex: 12"
                      value={descontoPercentual}
                      onChange={e => setDescontoPercentual(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">URL proposta concorrente (opcional)</label>
                    <Input
                      className="rounded-none"
                      type="url"
                      placeholder="https://..."
                      value={propostaConcorrenteUrl}
                      onChange={e => setPropostaConcorrenteUrl(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {motivo === "vencimento" && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Dia de vencimento solicitado</label>
                  <Input
                    className="rounded-none"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ex: 15"
                    value={diaSolicitado}
                    onChange={e => setDiaSolicitado(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Justificativa</label>
                <textarea
                  className="w-full border rounded-none px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A3A5C] focus:border-[#1A3A5C]"
                  rows={3}
                  placeholder="Descreva o motivo da solicitação..."
                  value={justificativa}
                  onChange={e => setJustificativa(e.target.value)}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-none p-3 text-xs text-blue-700">
                <p className="font-semibold mb-1">Como funciona:</p>
                <ul className="space-y-0.5">
                  <li>1. IA analisa automaticamente o pedido</li>
                  <li>2. Se aprovado pela IA, aplica direto (sem precisar de diretor)</li>
                  <li>3. Se negado, você pode escalar para um diretor</li>
                </ul>
              </div>
            </div>
          )}

          {/* ETAPA 2: Loading / Analisando */}
          {etapa === "analisando" && (
            <div className="py-12 text-center space-y-4">
              <div className="relative mx-auto w-16 h-16">
                <Loader2 className="h-16 w-16 animate-spin text-[#1A3A5C]" />
                <BrainCircuit className="h-8 w-8 text-[#1A3A5C] absolute top-4 left-4" />
              </div>
              <p className="text-sm font-semibold text-gray-700">IA analisando...</p>
              <p className="text-xs text-gray-500">Verificando desconto, vencimento, vistoria e histórico do consultor</p>
            </div>
          )}

          {/* ETAPA 3: Resultado */}
          {etapa === "resultado" && analiseResult && (
            <div className="space-y-4 py-2">
              {/* Card resultado principal */}
              <div className={`p-4 border-2 rounded-none ${
                analiseResult.aprovado
                  ? "border-green-400 bg-green-50"
                  : analiseResult.parcial
                  ? "border-amber-400 bg-amber-50"
                  : "border-red-400 bg-red-50"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {analiseResult.aprovado ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  )}
                  <span className={`text-lg font-bold ${
                    analiseResult.aprovado ? "text-green-700" : analiseResult.parcial ? "text-amber-700" : "text-red-700"
                  }`}>
                    {analiseResult.aprovado
                      ? "Aprovado pela IA"
                      : analiseResult.parcial
                      ? "Aprovação Parcial"
                      : "Não Aprovado pela IA"
                    }
                  </span>
                </div>
                <p className="text-sm text-gray-700">{analiseResult.justificativa}</p>

                {/* Score de risco */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Score de risco:</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        analiseResult.score_risco <= 30 ? "bg-green-500" :
                        analiseResult.score_risco <= 60 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${analiseResult.score_risco}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold">{analiseResult.score_risco}/100</span>
                </div>
              </div>

              {/* Itens aprovados/negados */}
              {analiseResult.itens_aprovados && analiseResult.itens_aprovados.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-green-700">Aprovados:</span>
                  <div className="flex flex-wrap gap-1">
                    {analiseResult.itens_aprovados.map((item, i) => (
                      <Badge key={i} className="rounded-none bg-green-100 text-green-700 text-xs">{item}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {analiseResult.itens_negados && analiseResult.itens_negados.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-red-700">Negados:</span>
                  <div className="flex flex-wrap gap-1">
                    {analiseResult.itens_negados.map((item, i) => (
                      <Badge key={i} className="rounded-none bg-red-100 text-red-700 text-xs">{item}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Ações pós-resultado */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none"
                  onClick={handleAnalisar}
                  disabled={analisando}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />Reanalisar
                </Button>

                {!analiseResult.aprovado && (
                  <ExcecaoButton
                    negociacaoId={negociacaoId}
                    tipoDefault={motivo === "desconto" ? "desconto_extra" : motivo === "vencimento" ? "vencimento_especial" : "vistoria_rejeitada"}
                    descontoSolicitado={motivo === "desconto" ? parseFloat(descontoPercentual) : undefined}
                    label="Pedir Liberação ao Diretor"
                    onSuccess={(res) => {
                      onSuccess?.(res);
                      setOpen(false);
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {etapa === "formulario" && (
            <DialogFooter>
              <Button variant="outline" className="rounded-none" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button
                onClick={handleAnalisar}
                disabled={analisando || !motivo || !justificativa.trim()}
                className="rounded-none bg-[#1A3A5C] hover:bg-[#15304D] text-white"
              >
                <BrainCircuit className="h-3.5 w-3.5 mr-1" />
                Analisar com IA
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
