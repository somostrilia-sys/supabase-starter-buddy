import { useState } from "react";
import { callEdge } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertTriangle, Send, Copy } from "lucide-react";

interface Props {
  negociacaoId: string;
  tipoDefault?: string;
  descontoSolicitado?: number;
  label?: string;
  onSuccess?: (result: any) => void;
}

const TIPOS_EXCECAO = [
  { value: "vistoria_rejeitada", label: "Vistoria Reprovada pela IA" },
  { value: "desconto_extra", label: "Desconto Extra (>15%)" },
  { value: "veiculo_bloqueado", label: "Veículo sem Aceitação (só diretor libera)" },
  { value: "vencimento_especial", label: "Vencimento Especial" },
  { value: "cobertura_inexistente", label: "Cobertura Inexistente" },
  { value: "outro", label: "Outro Motivo" },
];

export default function ExcecaoButton({
  negociacaoId,
  tipoDefault,
  descontoSolicitado,
  label = "Peça a um Diretor",
  onSuccess,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState(tipoDefault || "");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  async function handleEnviar() {
    if (!tipo || !motivo.trim()) {
      toast.error("Preencha o tipo e o motivo.");
      return;
    }
    setEnviando(true);
    const result = await callEdge("gia-solicitar-excecao", {
      negociacao_id: negociacaoId,
      tipo,
      motivo,
      desconto_solicitado: descontoSolicitado || null,
    });
    if (result.sucesso) {
      setResultado(result);
      toast.success(`Exceção enviada! SMS para ${result.sms_enviados} diretor(es).`);
      onSuccess?.(result);
    } else {
      toast.error(result.error || "Erro ao solicitar exceção");
    }
    setEnviando(false);
  }

  if (resultado) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <Button variant="outline" size="sm" className="rounded-none border-amber-400 text-amber-700" onClick={() => setOpen(true)}>
          <AlertTriangle className="h-3.5 w-3.5 mr-1" />{label}
        </Button>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6 space-y-3">
            <div className="text-4xl">📩</div>
            <h3 className="text-lg font-bold text-amber-800">Exceção Solicitada!</h3>
            <p className="text-sm text-gray-600">
              SMS enviado para {resultado.sms_enviados} diretor(es):
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {resultado.diretores_notificados?.map((nome: string, i: number) => (
                <Badge key={i} className="rounded-none bg-amber-100 text-amber-700 text-xs">{nome}</Badge>
              ))}
            </div>
            <p className="text-xs text-gray-500">O card ficará bloqueado até um diretor aprovar ou rejeitar.</p>
            <Button onClick={() => setOpen(false)} size="sm" className="rounded-none">Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" className="rounded-none border-amber-400 text-amber-700" onClick={() => setOpen(true)}>
        <AlertTriangle className="h-3.5 w-3.5 mr-1" />{label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Exceção ao Diretor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Tipo de Exceção</label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_EXCECAO.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Motivo / Justificativa</label>
              <textarea
                className="w-full border rounded-none px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                rows={3}
                placeholder="Descreva o motivo da solicitação..."
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
              />
            </div>
            {descontoSolicitado && (
              <div className="bg-amber-50 border border-amber-200 rounded-none p-2 text-xs text-amber-700">
                Desconto solicitado: <strong>{descontoSolicitado}%</strong>
              </div>
            )}
            <div className="bg-gray-50 rounded-none p-3 text-xs text-gray-600">
              <p className="font-semibold mb-1">O que acontece:</p>
              <ul className="space-y-0.5">
                <li>1. SMS enviado para Lissandra, Carlos Alberto e Rafael</li>
                <li>2. Diretor recebe link para aprovar/rejeitar</li>
                <li>3. Card fica bloqueado até decisão</li>
                <li>4. Se aprovado, ação aplicada automaticamente</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-none" onClick={() => setOpen(false)} disabled={enviando}>Cancelar</Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-none border-gray-300"
              onClick={() => {
                const link = `${window.location.origin}/excecao/${negociacaoId}`;
                navigator.clipboard.writeText(link);
                toast.success("Link copiado!");
              }}
            >
              <Copy className="h-3.5 w-3.5 mr-1" />Copiar Link
            </Button>
            <Button
              onClick={handleEnviar}
              disabled={enviando || !tipo || !motivo.trim()}
              className="rounded-none bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              {enviando ? "Enviando SMS..." : "Enviar para Diretores"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
