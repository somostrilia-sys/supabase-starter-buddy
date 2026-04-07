import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield,
  ShieldCheck,
  ShieldPlus,
  CheckCircle,
  Phone,
  MessageSquare,
  Car,
  Clock,
  MapPin,
  Info,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const LOGO_URL =
  "https://objetivoauto.com.br/wp-content/uploads/2025/11/IMG_1299.png";
const WHATSAPP_NUMBER = "5511915395063";
const PHONE_0800 = "0800 111 3400";
const CNPJ = "58.506.161/0001-31";

function formatBRL(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

interface CoberturaObj {
  cobertura: string;
  tipo?: string;
  inclusa?: boolean;
  detalhe?: string;
  ordem?: number;
}

interface Plano {
  nome: string;
  preco_mensal?: number;
  valor_mensal?: number;
  valor_fipe?: number;
  coberturas?: (string | CoberturaObj)[];
  assistencias?: string[];
  franquia?: number | string;
  tipo_franquia?: string;
  valor_franquia?: number | string;
  adesao?: number;
  rastreador?: string;
  recomendado?: boolean;
  [key: string]: unknown;
}

// Descrições padrão das coberturas (fallback)
const coberturaDescFallback: Record<string, string> = {
  "colisão": "Cobertura para danos por colisão, capotamento ou tombamento",
  "colisao": "Cobertura para danos por colisão, capotamento ou tombamento",
  "incêndio": "Proteção contra incêndio, explosão e queda de raio",
  "incendio": "Proteção contra incêndio, explosão e queda de raio",
  "perda total": "Indenização integral quando reparo ultrapassa 75% do valor FIPE",
  "roubo": "Indenização de 100% da tabela FIPE em caso de roubo",
  "furto": "Indenização de 100% da tabela FIPE em caso de furto",
  "danos a terceiros": "Cobertura para danos materiais e corporais causados a terceiros",
  "terceiros": "Cobertura para danos materiais e corporais causados a terceiros",
  "vidros": "Cobertura para para-brisas, vidros laterais e traseiro",
  "retrovisor": "Cobertura para retrovisores danificados",
  "danos da natureza": "Cobertura para enchentes, granizo, queda de árvore",
  "carro reserva": "Veículo reserva por até 15 dias em caso de sinistro",
  "assistência 24h": "Socorro mecânico e guincho 24h, 7 dias por semana",
  "assistencia 24h": "Socorro mecânico e guincho 24h, 7 dias por semana",
  "guincho": "Serviço de guincho ilimitado em território nacional",
  "reboque": "Serviço de reboque/guincho ilimitado em território nacional",
  "chaveiro": "Serviço de chaveiro para abertura do veículo",
  "recarga de bateria": "Recarga ou troca de bateria no local",
  "auxílio combustível": "Envio de combustível em caso de pane seca",
  "troca de pneus": "Troca de pneu furado pelo estepe do veículo",
  "hospedagem": "Diárias de hotel em caso de sinistro fora do domicílio",
  "clube": "Acesso ao clube de benefícios e descontos exclusivos",
};

function getCoberturaDesc(nome: string, detalheOriginal?: string): string {
  if (detalheOriginal) return detalheOriginal;
  const lower = nome.toLowerCase();
  for (const [key, desc] of Object.entries(coberturaDescFallback)) {
    if (lower.includes(key)) return desc;
  }
  return "";
}

// Descrições padrão das assistências (fallback)
const assistenciaDescFallback: Record<string, string> = {
  "guincho": "Serviço de guincho ilimitado em território nacional",
  "reboque": "Serviço de reboque/guincho ilimitado em território nacional",
  "chaveiro": "Serviço de chaveiro para abertura do veículo",
  "recarga de bateria": "Recarga ou troca de bateria no local",
  "bateria": "Recarga ou troca de bateria no local",
  "auxílio combustível": "Envio de combustível em caso de pane seca",
  "combustível": "Envio de combustível em caso de pane seca",
  "combustivel": "Envio de combustível em caso de pane seca",
  "pane seca": "Envio de combustível em caso de pane seca",
  "troca de pneus": "Troca de pneu furado pelo estepe do veículo",
  "pneu": "Troca de pneu furado pelo estepe do veículo",
  "hospedagem": "Diárias de hotel em caso de sinistro fora do domicílio",
  "hotel": "Diárias de hotel em caso de sinistro fora do domicílio",
  "táxi": "Transporte por táxi em caso de pane ou sinistro",
  "taxi": "Transporte por táxi em caso de pane ou sinistro",
  "transporte alternativo": "Transporte alternativo em caso de pane ou sinistro",
  "carro reserva": "Veículo reserva por até 15 dias em caso de sinistro",
  "assistência 24h": "Socorro mecânico e guincho 24h, 7 dias por semana",
  "assistencia 24h": "Socorro mecânico e guincho 24h, 7 dias por semana",
  "socorro": "Socorro mecânico no local 24h",
  "mecânico": "Socorro mecânico no local 24h",
  "mecanico": "Socorro mecânico no local 24h",
  "elétrico": "Assistência para pane elétrica no local",
  "eletrico": "Assistência para pane elétrica no local",
  "vidro": "Cobertura para para-brisas, vidros laterais e traseiro",
};

function getAssistenciaDesc(nome: string): string {
  const lower = nome.toLowerCase();
  for (const [key, desc] of Object.entries(assistenciaDescFallback)) {
    if (lower.includes(key)) return desc;
  }
  return "";
}

function parseCoberturas(raw: (string | CoberturaObj)[] | undefined): { nome: string; desc: string; tipo: string }[] {
  if (!raw || raw.length === 0) return [];
  return raw.map(c => {
    if (typeof c === "string") return { nome: c, desc: getCoberturaDesc(c), tipo: "cobertura" };
    return { nome: c.cobertura, desc: getCoberturaDesc(c.cobertura, c.detalhe), tipo: c.tipo || "cobertura" };
  });
}

function formatFranquia(plano: Plano): string | null {
  if (plano.tipo_franquia && plano.valor_franquia != null) {
    const val = plano.valor_franquia;
    if (plano.tipo_franquia === "%" || plano.tipo_franquia === "% FIPE") return `${val}% da tabela FIPE`;
    if (plano.tipo_franquia === "R$") return `${formatBRL(Number(val))} fixo`;
    return `${plano.tipo_franquia} ${val}`;
  }
  if (plano.franquia != null && plano.franquia !== "" && plano.franquia !== 0) {
    if (typeof plano.franquia === "string") return plano.franquia;
    if (typeof plano.franquia === "number") return plano.franquia > 1 ? formatBRL(plano.franquia) : `${plano.franquia * 100}% da tabela FIPE`;
  }
  return null;
}

interface Negociacao {
  lead_nome?: string;
  veiculo_modelo?: string;
  veiculo_placa?: string;
  telefone?: string;
  email?: string;
  consultor?: string;
  cooperativa?: string;
  [key: string]: unknown;
}

interface Cotacao {
  id: string;
  negociacao_id?: string;
  todos_planos?: Plano[];
  desconto_aplicado?: number;
  created_at?: string;
  [key: string]: unknown;
}

const planIcons: Record<number, React.ReactNode> = {
  0: <Shield className="w-8 h-8 text-[#7ed6f1]" />,
  1: <ShieldCheck className="w-8 h-8 text-[#003572]" />,
  2: <ShieldPlus className="w-8 h-8 text-[#002b5e]" />,
};

export default function CotacaoPublica() {
  const { id } = useParams<{ id: string }>();
  const [cotacao, setCotacao] = useState<Cotacao | null>(null);
  const [negociacao, setNegociacao] = useState<Negociacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: cotData, error: cotErr } = await supabase
          .from("cotacoes" as any)
          .select("*")
          .eq("id", id)
          .single();
        if (cotErr || !cotData) {
          setError("Cotação não encontrada.");
          setLoading(false);
          return;
        }
        const cot = cotData as unknown as Cotacao;
        setCotacao(cot);

        if (cot.negociacao_id) {
          const { data: negData, error: negError } = await supabase
            .from("negociacoes" as any)
            .select("*")
            .eq("id", cot.negociacao_id)
            .single();
          if (negError || !negData) {
            setError("Cotação não encontrada ou expirada.");
            setLoading(false);
            return;
          }
          setNegociacao(negData as unknown as Negociacao);
        }
      } catch {
        setError("Erro ao carregar cotação.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const planos: Plano[] = Array.isArray(cotacao?.todos_planos)
    ? (cotacao.todos_planos as Plano[])
    : [];

  const clientName = negociacao?.lead_nome || "Cliente";
  const veiculo = negociacao?.veiculo_modelo || "—";
  const placa = negociacao?.veiculo_placa || "—";
  const consultor = negociacao?.consultor || "Consultor";
  const fipeValue = planos[0]?.valor_fipe;

  const cheapestPrice = Math.min(
    ...planos.map((p) => p.preco_mensal ?? p.valor_mensal ?? Infinity)
  );

  const whatsappCTA = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Olá, tenho interesse na cotação ${id} para meu veículo ${placa}`
  )}`;
  const whatsappConsultor = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Olá ${consultor}, gostaria de falar sobre a cotação ${id}`
  )}`;

  // Collect all unique coberturas and assistencias across plans
  const allCoberturasRaw = planos.flatMap((p) => parseCoberturas(p.coberturas));
  const seenCob = new Set<string>();
  const allCoberturas = allCoberturasRaw.filter(c => {
    if (seenCob.has(c.nome)) return false;
    seenCob.add(c.nome);
    return true;
  });
  const allAssistenciasRaw = Array.from(
    new Set(planos.flatMap((p) => p.assistencias ?? []))
  );
  const allAssistencias = allAssistenciasRaw.map(a => ({ nome: a, desc: getAssistenciaDesc(a) }));

  const validadeDias = 15 - daysSince(cotacao?.created_at);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#002b5e] to-[#003572]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#7ed6f1] border-t-transparent rounded-full animate-spin" />
          <p className="text-white font-sans text-lg">Carregando cotação...</p>
        </div>
      </div>
    );
  }

  if (error || !cotacao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#002b5e] to-[#003572]">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-[#7ed6f1] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#002b5e] mb-2">
              Cotação não encontrada
            </h2>
            <p className="text-gray-600">
              {error || "Verifique o link e tente novamente."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-[#002b5e] text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <img
            src={LOGO_URL}
            alt="Objetivo Auto"
            className="h-10 sm:h-12 object-contain"
          />
          <a
            href={`tel:${PHONE_0800.replace(/\s/g, "")}`}
            className="flex items-center gap-2 text-sm sm:text-base font-semibold hover:text-[#7ed6f1] transition-colors"
          >
            <Phone className="w-4 h-4" />
            {PHONE_0800}
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#002b5e] via-[#003572] to-[#004a9e] text-white py-10 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2">
            Olá {clientName}!
          </h1>
          <p className="text-lg sm:text-xl text-[#7ed6f1] mb-8">
            Preparamos uma cotação especial para o seu veículo:
          </p>

          {/* Vehicle Card */}
          <Card className="max-w-lg mx-auto bg-white/10 border-white/20 backdrop-blur-sm text-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-[#7ed6f1]/20 p-3 rounded-full">
                <Car className="w-8 h-8 text-[#7ed6f1]" />
              </div>
              <div className="text-left">
                <p className="text-lg sm:text-xl font-bold">{veiculo}</p>
                <p className="text-sm text-white/80">
                  Placa: <span className="font-semibold">{placa}</span>
                  {fipeValue != null && (
                    <>
                      {" "}
                      | FIPE: <span className="font-semibold">{formatBRL(fipeValue)}</span>
                    </>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Plans */}
      {planos.length > 0 && (
        <section className="py-10 sm:py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#002b5e] text-center mb-8">
              Planos Disponíveis
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {planos.map((plano, idx) => {
                const price = plano.preco_mensal ?? plano.valor_mensal ?? 0;
                const isRecommended =
                  plano.recomendado || price === cheapestPrice;
                return (
                  <Card
                    key={idx}
                    className={`relative overflow-hidden transition-all hover:shadow-xl ${
                      isRecommended
                        ? "border-2 border-[#7ed6f1] shadow-lg ring-2 ring-[#7ed6f1]/30"
                        : "border border-gray-200"
                    }`}
                  >
                    {isRecommended && (
                      <div className="absolute top-0 right-0">
                        <Badge className="bg-[#7ed6f1] text-[#002b5e] font-bold rounded-none rounded-bl-lg px-3 py-1">
                          Recomendado
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="text-center pb-2 pt-6">
                      {planIcons[idx] || planIcons[0]}
                      <h3 className="text-xl font-bold text-[#002b5e] mt-3">
                        {plano.nome}
                      </h3>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-4">
                        <span className="text-3xl font-extrabold text-[#003572]">
                          {formatBRL(price)}
                        </span>
                        <span className="text-gray-500 text-sm">/mês</span>
                      </div>

                      {/* Franquia */}
                      {(() => {
                        const franquiaStr = formatFranquia(plano);
                        return franquiaStr ? (
                          <div className="flex items-center justify-center gap-1.5 mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            <p className="text-sm text-amber-800 font-medium">
                              Participação: {franquiaStr}
                            </p>
                          </div>
                        ) : null;
                      })()}

                      {/* Adesão e Rastreador */}
                      <div className="flex justify-center gap-4 mb-4 text-xs text-gray-500">
                        {plano.adesao != null && Number(plano.adesao) > 0 && (
                          <span>Adesão: <strong className="text-gray-700">{formatBRL(Number(plano.adesao))}</strong></span>
                        )}
                        {plano.rastreador && plano.rastreador !== "Não" && (
                          <span>Rastreador: <strong className="text-gray-700">Incluso</strong></span>
                        )}
                      </div>

                      {/* Coberturas com descrição detalhada */}
                      {(() => {
                        const cobs = parseCoberturas(plano.coberturas);
                        return cobs.length > 0 ? (
                          <div className="text-left mb-4">
                            <p className="text-xs font-semibold text-[#002b5e] uppercase tracking-wider mb-2">Coberturas</p>
                            <ul className="space-y-3">
                              {cobs.map((c, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">{c.nome}</p>
                                    {c.desc && (
                                      <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null;
                      })()}

                      {/* Assistências */}
                      {plano.assistencias && plano.assistencias.length > 0 && (
                        <div className="text-left">
                          <p className="text-xs font-semibold text-[#002b5e] uppercase tracking-wider mb-2">Assistências</p>
                          <ul className="space-y-2">
                            {plano.assistencias.map((a, i) => {
                              const desc = getAssistenciaDesc(a);
                              return (
                                <li
                                  key={i}
                                  className="flex items-start gap-2 text-sm text-gray-600"
                                >
                                  <CheckCircle className="w-4 h-4 text-[#7ed6f1] mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">{a}</p>
                                    {desc && (
                                      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Coberturas */}
      {allCoberturas.length > 0 && (
        <section className="py-10 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[#002b5e] text-center mb-6">
              Detalhes das Coberturas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allCoberturas.map((c, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-[#002b5e]/5 rounded-xl px-4 py-3"
                >
                  <ShieldCheck className="w-5 h-5 text-[#003572] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#002b5e]">{c.nome}</p>
                    {c.desc && (
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{c.desc}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Assistencias */}
      {allAssistencias.length > 0 && (
        <section className="py-10 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[#002b5e] text-center mb-6">
              Assistencias 24h
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allAssistencias.map((a, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-[#7ed6f1]/10 rounded-xl px-4 py-3"
                >
                  <CheckCircle className="w-5 h-5 text-[#7ed6f1] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#002b5e]">{a.nome}</p>
                    {a.desc && (
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{a.desc}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Consultor */}
      <section className="py-10 px-4 bg-white">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-[#002b5e] text-center mb-6">
            Seu Consultor
          </h2>
          <Card className="border-[#7ed6f1]/30">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
              <div className="bg-[#002b5e] text-white w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
                {consultor.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-lg font-bold text-[#002b5e]">{consultor}</p>
                {negociacao?.cooperativa && (
                  <p className="text-sm text-gray-500">
                    {negociacao.cooperativa}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  asChild
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <a href={whatsappConsultor} target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    WhatsApp
                  </a>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-[#002b5e] text-[#002b5e]"
                >
                  <a href={`tel:${PHONE_0800.replace(/\s/g, "")}`}>
                    <Phone className="w-4 h-4 mr-1" />
                    Ligar
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 px-4 bg-gradient-to-br from-[#002b5e] to-[#003572]">
        <div className="max-w-lg mx-auto text-center">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white text-lg font-bold py-6 px-10 rounded-xl shadow-2xl hover:shadow-green-500/30 transition-all"
          >
            <a href={whatsappCTA} target="_blank" rel="noopener noreferrer">
              <MessageSquare className="w-5 h-5 mr-2" />
              Quero Contratar
            </a>
          </Button>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-white/70 text-sm">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {validadeDias > 0
                ? `Válida por ${validadeDias} dias`
                : "Cotação expirada"}
            </span>
            <span>
              Gerada em {formatDate(cotacao.created_at)}
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#002b5e] text-white/70 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <img
            src={LOGO_URL}
            alt="Objetivo Auto"
            className="h-8 mx-auto opacity-70"
          />
          <p className="text-sm">
            CNPJ: {CNPJ}
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <a
              href={`tel:${PHONE_0800.replace(/\s/g, "")}`}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Phone className="w-3 h-3" />
              {PHONE_0800}
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              WhatsApp
            </a>
            <a
              href="https://objetivoauto.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <MapPin className="w-3 h-3" />
              objetivoauto.com.br
            </a>
          </div>
          <p className="text-xs text-white/40">
            Objetivo Proteção Veicular - Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}
