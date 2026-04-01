import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { callEdgePublic } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle, Image, FileText } from "lucide-react";

export default function ExcecaoAprovacao() {
  const { token } = useParams<{ token: string }>();
  const [excecao, setExcecao] = useState<any>(null);
  const [fotos, setFotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [resolvida, setResolvida] = useState(false);
  const [resultadoAcao, setResultadoAcao] = useState<string | null>(null);
  const [comentario, setComentario] = useState("");

  useEffect(() => {
    fetchExcecao();
  }, [token]);

  async function fetchExcecao() {
    try {
      const data = await callEdgePublic("gia-excecao-link", { method: "GET", params: { token: token! } });
      if (data.error) throw new Error(data.error);
      setExcecao(data.excecao);
      setFotos(data.fotos || []);
      if (data.excecao.status !== "pendente") {
        setResolvida(true);
        setResultadoAcao(data.excecao.status === "aprovada" ? "aprovada" : "rejeitada");
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleAcao(acao: "aprovar" | "rejeitar") {
    setProcessando(true);
    try {
      const data = await callEdgePublic("gia-excecao-link", {
        method: "POST",
        params: { token: token! },
        body: { acao, comentario: comentario || undefined },
      });
      if (data.sucesso) {
        setResolvida(true);
        setResultadoAcao(acao === "aprovar" ? "aprovada" : "rejeitada");
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
    setProcessando(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (error || !excecao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Exceção não encontrada</h1>
          <p className="text-gray-500">{error || "Link inválido ou expirado."}</p>
        </div>
      </div>
    );
  }

  const neg = excecao.negociacoes;
  const tipoLabels: Record<string, string> = {
    desconto_extra: "Desconto Extra",
    sem_vistoria: "Sem Vistoria",
    vistoria_rejeitada: "Vistoria Rejeitada",
    veiculo_bloqueado: "Veículo Bloqueado",
    vencimento_especial: "Vencimento Especial",
    cobertura_inexistente: "Cobertura Inexistente",
    outro: "Outro",
  };

  if (resolvida) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="bg-[#1A3A5C] text-white py-8 px-4 text-center">
          <h1 className="text-2xl font-bold">Aprovação de Exceção</h1>
          <p className="text-amber-200 text-sm mt-1">GIA Objetivo</p>
        </div>
        <div className="max-w-md mx-auto px-4 py-8">
          <Card className="rounded-none border-2 text-center p-8" style={{ borderColor: resultadoAcao === "aprovada" ? "#16a34a" : "#dc2626" }}>
            {resultadoAcao === "aprovada" ? (
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            ) : (
              <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            )}
            <h2 className={`text-xl font-bold ${resultadoAcao === "aprovada" ? "text-green-800" : "text-red-800"}`}>
              Exceção {resultadoAcao}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              A negociação de <strong>{neg?.nome || neg?.lead_nome}</strong> foi {resultadoAcao === "aprovada" ? "desbloqueada" : "mantida"}.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="bg-[#1A3A5C] text-white py-8 px-4 text-center">
        <h1 className="text-2xl font-bold">Aprovação de Exceção</h1>
        <p className="text-amber-200 text-sm mt-1">GIA Objetivo</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Tipo e data */}
        <Card className="rounded-none border-2 border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Badge className="rounded-none bg-amber-100 text-amber-700 text-sm px-3 py-1">
                {tipoLabels[excecao.tipo] || excecao.tipo}
              </Badge>
              <span className="text-xs text-gray-500">
                {new Date(excecao.created_at).toLocaleString("pt-BR")}
              </span>
            </div>

            <h3 className="font-bold text-gray-800 mb-2">Motivo</h3>
            <p className="text-sm text-gray-600 mb-4">{excecao.motivo}</p>

            <h3 className="font-bold text-gray-800 mb-2">Negociação</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Cliente:</span> {neg?.nome || neg?.lead_nome}</div>
              <div><span className="text-gray-500">Veículo:</span> {neg?.veiculo_interesse || neg?.veiculo_modelo || "—"}</div>
              <div><span className="text-gray-500">Plano:</span> {neg?.plano_interesse || neg?.plano || "—"}</div>
              <div><span className="text-gray-500">Stage:</span> {neg?.stage}</div>
              {(neg?.desconto_percentual > 0) && (
                <div><span className="text-gray-500">Desconto atual:</span> {neg.desconto_percentual}%</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Desconto solicitado */}
        {excecao.desconto_solicitado && (
          <Card className="rounded-none border-2 border-amber-300">
            <CardContent className="p-6">
              <h3 className="font-bold text-gray-800 mb-2">Desconto Solicitado</h3>
              <div className="text-3xl font-bold text-amber-700">{excecao.desconto_solicitado}%</div>
            </CardContent>
          </Card>
        )}

        {/* Fotos da vistoria */}
        {fotos.length > 0 && (
          <Card className="rounded-none border-2 border-border">
            <CardContent className="p-6">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Image className="h-4 w-4" />Fotos da Vistoria
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {fotos.map((foto: any, idx: number) => (
                  <div key={idx} className="relative">
                    <img src={foto.url} alt={foto.tipo} className="w-full h-24 object-cover rounded-none border" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-1 py-0.5">
                      {foto.tipo}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Evidências */}
        {excecao.evidencia_urls?.length > 0 && (
          <Card className="rounded-none border-2 border-border">
            <CardContent className="p-6">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />Evidências
              </h3>
              <ul className="space-y-1">
                {excecao.evidencia_urls.map((url: string, i: number) => (
                  <li key={i}>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      Evidência {i + 1}
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Comentário */}
        <Card className="rounded-none border-2 border-border">
          <CardContent className="p-6">
            <h3 className="font-bold text-gray-800 mb-2">Comentário (opcional)</h3>
            <textarea
              className="w-full border rounded-none px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400"
              rows={2}
              placeholder="Adicione um comentário sobre sua decisão..."
              value={comentario}
              onChange={e => setComentario(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={() => handleAcao("aprovar")}
            disabled={processando}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-none transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle className="h-5 w-5" />
            {processando ? "Processando..." : "Aprovar"}
          </button>
          <button
            onClick={() => handleAcao("rejeitar")}
            disabled={processando}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-none transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <XCircle className="h-5 w-5" />
            {processando ? "Processando..." : "Rejeitar"}
          </button>
        </div>
      </div>
    </div>
  );
}
