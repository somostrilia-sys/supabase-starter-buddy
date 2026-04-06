import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle, Image, FileText, Lock, Shield, Car, User, MapPin, DollarSign } from "lucide-react";

// Senhas dos diretores
const SENHAS_DIRETORES: Record<string, string> = {
  "Lissandra Donato": "LD@obj2026",
  "Carlos alberto": "CA@obj2026",
  "Rafael Gelinske da Silva": "RG@obj2026",
  "Thainá": "TH@obj2026",
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ExcecaoAprovacao() {
  const { token } = useParams<{ token: string }>();
  const [excecao, setExcecao] = useState<any>(null);
  const [neg, setNeg] = useState<any>(null);
  const [cotacao, setCotacao] = useState<any>(null);
  const [fotos, setFotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth
  const [autenticado, setAutenticado] = useState(false);
  const [diretorNome, setDiretorNome] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaErro, setSenhaErro] = useState("");

  // Ações
  const [comentario, setComentario] = useState("");
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  // Buscar dados auxiliares da negociação
  const carregarDadosNegociacao = (negId: string) => {
    (supabase as any).from("negociacoes").select("*").eq("id", negId).maybeSingle()
      .then(({ data: n }: any) => {
        if (n) setNeg(n);
        (supabase as any).from("cotacoes").select("*").eq("negociacao_id", negId).order("created_at", { ascending: false }).limit(1).maybeSingle()
          .then(({ data: c }: any) => { if (c) setCotacao(c); });
        if (n?.vistoria_id) {
          (supabase as any).from("vistoria_fotos").select("*").eq("vistoria_id", n.vistoria_id).order("created_at")
            .then(({ data: f }: any) => {
              if (f) setFotos(f.map((foto: any) => {
                const { data: u } = supabase.storage.from("vistoria-fotos").getPublicUrl(foto.storage_path);
                return { ...foto, url: u.publicUrl };
              }));
            });
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!token) return;
    // 1. Buscar exceção por token_aprovacao ou negociacao_id
    (supabase as any).from("excecoes_aprovacao").select("*")
      .or(`token_aprovacao.eq.${token},negociacao_id.eq.${token}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error: err }: any) => {
        if (data) {
          setExcecao(data);
          if (data.status !== "pendente") { setResultado(data.status); }
          carregarDadosNegociacao(data.negociacao_id);
        } else {
          // 2. Sem exceção — tentar como negociacao_id direto (link genérico)
          (supabase as any).from("negociacoes").select("id").eq("id", token).maybeSingle()
            .then(({ data: negCheck }: any) => {
              if (negCheck) {
                // Criar exceção genérica para este link funcionar
                setExcecao({ id: null, negociacao_id: token, tipo: "outro", motivo: "Liberação solicitada via link", status: "pendente", created_at: new Date().toISOString() });
                carregarDadosNegociacao(token);
              } else {
                setError("Exceção não encontrada ou link inválido.");
                setLoading(false);
              }
            });
        }
      });
  }, [token]);

  const handleLogin = () => {
    setSenhaErro("");
    const senhaCorreta = SENHAS_DIRETORES[diretorNome];
    if (!senhaCorreta) { setSenhaErro("Selecione um diretor."); return; }
    if (senha !== senhaCorreta) { setSenhaErro("Senha incorreta."); return; }
    setAutenticado(true);
  };

  const handleAcao = async (acao: "aprovado" | "rejeitado") => {
    if (!excecao) return;
    setProcessando(true);

    if (excecao.id) {
      // Exceção existente — atualizar
      await (supabase as any).from("excecoes_aprovacao").update({
        status: acao, diretor_nome: diretorNome, comentario: comentario || null, resolvido_em: new Date().toISOString(),
      }).eq("id", excecao.id);
    } else {
      // Exceção criada via link genérico — inserir no banco
      await (supabase as any).from("excecoes_aprovacao").insert({
        negociacao_id: excecao.negociacao_id, tipo: excecao.tipo, motivo: excecao.motivo,
        status: acao, diretor_nome: diretorNome, comentario: comentario || null, resolvido_em: new Date().toISOString(),
        token_aprovacao: token,
      });
    }

    if (acao === "aprovado" && excecao.negociacao_id) {
      const updateNeg: any = {
        excecao_pendente: false,
        updated_at: new Date().toISOString(),
        desconto_aprovado_por: diretorNome,
      };
      // Se é exceção de desconto, aplicar o desconto na negociação
      if (excecao.desconto_solicitado > 0) {
        updateNeg.desconto_percentual = excecao.desconto_solicitado;
        updateNeg.desconto_ia_aprovado = true;
        updateNeg.desconto_ia_analise = { aprovado_por_diretor: diretorNome, desconto: excecao.desconto_solicitado, data: new Date().toISOString() };
      }
      await (supabase as any).from("negociacoes").update(updateNeg).eq("id", excecao.negociacao_id);
      await (supabase as any).from("pipeline_transicoes").insert({
        negociacao_id: excecao.negociacao_id, stage_anterior: "excecao_pendente", stage_novo: "em_negociacao",
        motivo: `Exceção "${excecao.tipo}" aprovada por ${diretorNome}${excecao.desconto_solicitado > 0 ? ` — desconto ${excecao.desconto_solicitado}% aplicado` : ""}`, automatica: false,
      });

      // Auto-aceitar modelo quando diretor aprova exceção de veículo bloqueado
      if (excecao.tipo === "veiculo_bloqueado" && neg?.veiculo_modelo) {
        const modeloNome = (neg.veiculo_modelo || "").split(" ")[0]; // primeira palavra do modelo
        if (modeloNome) {
          await (supabase as any).from("modelos_veiculo")
            .update({ aceito: true, motivo_rejeicao: null })
            .ilike("nome", `%${modeloNome}%`);
        }
      }
    }
    setResultado(acao);
    setProcessando(false);
  };

  // Loading
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A3A5C]">
      <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Erro
  if (error || !excecao) return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A3A5C] px-4">
      <div className="bg-white rounded-xl p-8 text-center max-w-md">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold mb-2">Exceção não encontrada</h2>
        <p className="text-sm text-gray-600">{error || "Verifique o link e tente novamente."}</p>
      </div>
    </div>
  );

  // Já resolvida
  if (resultado) return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A3A5C] px-4">
      <div className="bg-white rounded-xl p-8 text-center max-w-md">
        {resultado === "aprovado" ? <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" /> : <XCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />}
        <h2 className="text-xl font-bold mb-2">Exceção {resultado === "aprovado" ? "Aprovada" : "Rejeitada"}</h2>
        <p className="text-sm text-gray-600">
          {excecao.diretor_nome ? `Por ${excecao.diretor_nome}` : diretorNome ? `Por ${diretorNome}` : ""}
          {excecao.resolvido_em ? ` em ${new Date(excecao.resolvido_em).toLocaleString("pt-BR")}` : ""}
        </p>
        {(excecao.comentario || comentario) && <p className="text-sm text-gray-500 mt-2 italic">"{excecao.comentario || comentario}"</p>}
      </div>
    </div>
  );

  // Login do diretor
  if (!autenticado) return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A3A5C] px-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full space-y-5">
        <div className="text-center">
          <Shield className="w-12 h-12 text-[#1A3A5C] mx-auto mb-2" />
          <h2 className="text-lg font-bold text-[#1A3A5C]">Aprovação de Exceção</h2>
          <p className="text-sm text-gray-600">Identifique-se para acessar</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Diretor</label>
            <select className="w-full border rounded-lg px-3 py-2.5 text-sm" value={diretorNome} onChange={e => setDiretorNome(e.target.value)}>
              <option value="">Selecione seu nome</option>
              {Object.keys(SENHAS_DIRETORES).map(nome => <option key={nome} value={nome}>{nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="password" className="w-full border rounded-lg px-3 py-2.5 pl-10 text-sm" placeholder="Digite sua senha" value={senha} onChange={e => setSenha(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
          </div>
          {senhaErro && <p className="text-sm text-red-500">{senhaErro}</p>}
          <button onClick={handleLogin} disabled={!diretorNome || !senha} className="w-full py-3 rounded-lg font-bold text-white bg-[#1A3A5C] hover:bg-[#15304D] disabled:bg-gray-300">Acessar</button>
        </div>
      </div>
    </div>
  );

  // Página principal — diretor autenticado
  const tipoLabels: Record<string, string> = {
    desconto_extra: "Desconto Extra (>15%)",
    vistoria_rejeitada: "Vistoria Reprovada pela IA",
    veiculo_bloqueado: "Veículo sem Aceitação",
    vencimento_especial: "Vencimento Especial",
    cobertura_inexistente: "Cobertura Inexistente",
    outro: "Outro Motivo",
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#1A3A5C] text-white py-5 px-4 text-center">
        <Shield className="w-8 h-8 mx-auto mb-1" />
        <h1 className="text-lg font-bold">Aprovação de Exceção</h1>
        <p className="text-sm text-white/70">Olá, {diretorNome}</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Tipo e motivo */}
        <Card className="rounded-none border-2 border-amber-300">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Badge className="rounded-none bg-amber-100 text-amber-700 text-sm px-3 py-1">{tipoLabels[excecao.tipo] || excecao.tipo}</Badge>
              <span className="text-xs text-gray-500">{new Date(excecao.created_at).toLocaleString("pt-BR")}</span>
            </div>
            {excecao.desconto_solicitado > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3">
                <p className="text-sm text-amber-800">Desconto solicitado: <strong>{excecao.desconto_solicitado}%</strong></p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 mb-1">Justificativa do consultor:</p>
              <p className="text-sm bg-gray-50 rounded p-3">{excecao.motivo || "Não informada"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Dados completos da negociação */}
        {neg && (
          <Card className="rounded-none border-2">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#1A3A5C] flex items-center gap-2"><User className="w-4 h-4" />Dados da Negociação</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-xs text-gray-500">Cliente</span><p className="font-medium">{neg.lead_nome}</p></div>
                <div><span className="text-xs text-gray-500">CPF/CNPJ</span><p className="font-mono text-xs">{neg.cpf_cnpj || "—"}</p></div>
                <div><span className="text-xs text-gray-500">Telefone</span><p>{neg.telefone || "—"}</p></div>
                <div><span className="text-xs text-gray-500">Email</span><p className="text-xs">{neg.email || "—"}</p></div>
                <div><span className="text-xs text-gray-500">Consultor</span><p>{neg.consultor || "—"}</p></div>
                <div><span className="text-xs text-gray-500">Cooperativa</span><p>{neg.cooperativa || "—"}</p></div>
              </div>

              <h3 className="text-sm font-bold text-[#1A3A5C] flex items-center gap-2 pt-2"><Car className="w-4 h-4" />Veículo</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-xs text-gray-500">Modelo</span><p className="font-medium">{neg.veiculo_modelo || "—"}</p></div>
                <div><span className="text-xs text-gray-500">Placa</span><p className="font-mono">{neg.veiculo_placa || "—"}</p></div>
                <div><span className="text-xs text-gray-500">Plano</span><p>{neg.plano || "—"}</p></div>
                <div><span className="text-xs text-gray-500">Stage</span><p>{neg.stage || "—"}</p></div>
                {neg.cidade_circulacao && <div><span className="text-xs text-gray-500">Cidade</span><p>{neg.cidade_circulacao}/{neg.estado_circulacao}</p></div>}
                {neg.valor_plano > 0 && <div><span className="text-xs text-gray-500">Valor FIPE</span><p className="font-semibold">{fmt(neg.valor_plano)}</p></div>}
              </div>

              {/* Proposta concorrente */}
              {neg.proposta_concorrente_url && (
                <div className="pt-2">
                  <h3 className="text-sm font-bold text-[#1A3A5C] flex items-center gap-2"><FileText className="w-4 h-4" />Proposta Concorrente</h3>
                  {neg.proposta_concorrente_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img src={neg.proposta_concorrente_url} alt="Proposta concorrente" className="w-full max-h-60 object-contain border rounded mt-2" />
                  ) : (
                    <a href={neg.proposta_concorrente_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">{neg.proposta_concorrente_url}</a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cotação */}
        {cotacao?.todos_planos && Array.isArray(cotacao.todos_planos) && cotacao.todos_planos.length > 0 && (
          <Card className="rounded-none border-2">
            <CardContent className="p-5 space-y-2">
              <h3 className="text-sm font-bold text-[#1A3A5C] flex items-center gap-2"><DollarSign className="w-4 h-4" />Cotação</h3>
              <div className="space-y-1">
                {cotacao.todos_planos.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm bg-gray-50 rounded px-3 py-1.5">
                    <span>{p.nome}</span>
                    <span className="font-semibold">{fmt(p.valor_mensal || 0)}/mês | Adesão: {fmt(p.adesao || 400)}</span>
                  </div>
                ))}
              </div>
              {cotacao.regional_precos && <p className="text-xs text-gray-500">Regional: {cotacao.regional_precos}</p>}
            </CardContent>
          </Card>
        )}

        {/* Fotos da vistoria */}
        {fotos.length > 0 && (
          <Card className="rounded-none border-2">
            <CardContent className="p-5 space-y-2">
              <h3 className="text-sm font-bold text-[#1A3A5C] flex items-center gap-2"><Image className="w-4 h-4" />Fotos da Vistoria ({fotos.length})</h3>
              <div className="grid grid-cols-3 gap-2">
                {fotos.map((foto: any) => (
                  <div key={foto.id} className="relative">
                    <img src={foto.url} alt={foto.tipo} className="w-full h-24 object-cover border rounded" loading="lazy" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5">{(foto.tipo || "").replace(/_/g, " ")}</div>
                    {foto.ai_aprovada === false && <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"><XCircle className="w-3 h-3 text-white" /></div>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Evidências */}
        {excecao.evidencia_urls?.length > 0 && (
          <Card className="rounded-none border-2">
            <CardContent className="p-5 space-y-2">
              <h3 className="text-sm font-bold text-[#1A3A5C] flex items-center gap-2"><FileText className="w-4 h-4" />Evidências</h3>
              {excecao.evidencia_urls.map((url: string, i: number) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline block">Evidência {i + 1}</a>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Comentário + Ações */}
        <Card className="rounded-none border-2 border-[#1A3A5C]">
          <CardContent className="p-5 space-y-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Comentário (opcional)</label>
              <textarea className="w-full border rounded px-3 py-2 text-sm" rows={2} placeholder="Observação sobre sua decisão..." value={comentario} onChange={e => setComentario(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleAcao("aprovado")} disabled={processando} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />{processando ? "..." : "Aprovar"}
              </button>
              <button onClick={() => handleAcao("rejeitado")} disabled={processando} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <XCircle className="w-5 h-5" />{processando ? "..." : "Rejeitar"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
