import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield,
  ShieldCheck,
  ShieldPlus,
  CheckCircle,
  Phone,
  MessageSquare,
  QrCode,
  Copy,
  ChevronRight,
  Car,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const LOGO_URL =
  "https://objetivoauto.com.br/wp-content/uploads/2025/11/IMG_1299.png";
const PHONE_0800 = "0800 111 3400";

type ViewState = "compare" | "details" | "payment";

interface Plano {
  nome: string;
  valor_mensal?: number;
  adesao?: number;
  rastreador?: boolean | string;
  franquia?: string;
  valor_fipe?: number;
  coberturas?: string[];
  assistencias?: string[];
  [key: string]: unknown;
}

interface Negociacao {
  lead_nome?: string;
  veiculo_modelo?: string;
  veiculo_placa?: string;
  consultor?: string;
  telefone?: string;
  [key: string]: unknown;
}

interface Cotacao {
  id: string;
  negociacao_id?: string;
  todos_planos?: Plano[];
  [key: string]: unknown;
}

interface CoberturaPlano {
  plano_nome?: string;
  coberturas?: string[];
  assistencias?: string[];
  [key: string]: unknown;
}

interface ConfigEmpresa {
  pix_chave?: string;
  pix_tipo?: string;
  pix_nome?: string;
  pix_qrcode_url?: string;
  cnpj?: string;
  [key: string]: unknown;
}

function formatBRL(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const planIcons: Record<number, React.ReactNode> = {
  0: <Shield className="w-8 h-8 text-[#7ed6f1]" />,
  1: <ShieldCheck className="w-8 h-8 text-[#003572]" />,
  2: <ShieldPlus className="w-8 h-8 text-[#002b5e]" />,
};

export default function PlanoComparativo() {
  const { id } = useParams<{ id: string }>();
  const [cotacao, setCotacao] = useState<Cotacao | null>(null);
  const [negociacao, setNegociacao] = useState<Negociacao | null>(null);
  const [coberturasMap, setCoberturasMap] = useState<Record<string, CoberturaPlano>>({});
  const [configEmpresa, setConfigEmpresa] = useState<ConfigEmpresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>("compare");
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [pixCopied, setPixCopied] = useState(false);

  const detailsRef = useRef<HTMLDivElement>(null);
  const paymentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch cotacao
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

        // Fetch negociacao
        if (cot.negociacao_id) {
          const { data: negData } = await supabase
            .from("negociacoes" as any)
            .select("*")
            .eq("id", cot.negociacao_id)
            .single();
          if (negData) setNegociacao(negData as unknown as Negociacao);
        }

        // Fetch coberturas_plano for each plan name
        const planos = Array.isArray(cot.todos_planos) ? (cot.todos_planos as Plano[]) : [];
        if (planos.length > 0) {
          const nomes = planos.map((p) => p.nome).filter(Boolean);
          if (nomes.length > 0) {
            const { data: cobData } = await supabase
              .from("coberturas_plano" as any)
              .select("*")
              .in("plano_nome", nomes);
            if (cobData && Array.isArray(cobData)) {
              const map: Record<string, CoberturaPlano> = {};
              for (const item of cobData as unknown as CoberturaPlano[]) {
                if (item.plano_nome) map[item.plano_nome] = item;
              }
              setCoberturasMap(map);
            }
          }
        }

        // Fetch config_empresa
        const { data: cfgData } = await supabase
          .from("config_empresa" as any)
          .select("*")
          .limit(1)
          .single();
        if (cfgData) setConfigEmpresa(cfgData as unknown as ConfigEmpresa);
      } catch {
        setError("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const planos: Plano[] = Array.isArray(cotacao?.todos_planos)
    ? (cotacao!.todos_planos as Plano[])
    : [];

  const clientName = negociacao?.lead_nome || "Cliente";
  const veiculo = negociacao?.veiculo_modelo || "—";
  const placa = negociacao?.veiculo_placa || "—";
  const consultor = negociacao?.consultor || "Consultor";
  const consultorPhone = negociacao?.telefone || "";
  const fipeValue = planos[0]?.valor_fipe;

  const whatsappConsultor = consultorPhone
    ? `https://wa.me/${consultorPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Olá ${consultor}, segue o comprovante de pagamento da adesão - Cotação ${id}`
      )}`
    : "#";

  function handleSelectPlan(idx: number) {
    setSelectedPlan(idx);
    setView("details");
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  function handleProceedToPayment() {
    setView("payment");
    setTimeout(() => {
      paymentRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  async function handleCopyPix() {
    if (!configEmpresa?.pix_chave) return;
    try {
      await navigator.clipboard.writeText(configEmpresa.pix_chave);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = configEmpresa.pix_chave;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);
    }
  }

  function getCoberturas(plano: Plano): string[] {
    // Prefer coberturas_plano table data, fallback to plano inline data
    const fromTable = coberturasMap[plano.nome];
    if (fromTable?.coberturas && fromTable.coberturas.length > 0) {
      return fromTable.coberturas;
    }
    return plano.coberturas ?? [];
  }

  function getAssistencias(plano: Plano): string[] {
    const fromTable = coberturasMap[plano.nome];
    if (fromTable?.assistencias && fromTable.assistencias.length > 0) {
      return fromTable.assistencias;
    }
    return plano.assistencias ?? [];
  }

  function isRastreadorSim(plano: Plano): boolean {
    if (typeof plano.rastreador === "boolean") return plano.rastreador;
    if (typeof plano.rastreador === "string") {
      return plano.rastreador.toLowerCase() === "sim" || plano.rastreador.toLowerCase() === "true";
    }
    return false;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#002b5e] to-[#003572]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#7ed6f1] border-t-transparent rounded-full animate-spin" />
          <p className="text-white font-sans text-lg">Carregando planos...</p>
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

  const chosen = selectedPlan !== null ? planos[selectedPlan] : null;

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

      {/* ============ SECTION 1: Vehicle + Plans Comparison ============ */}
      <section className="bg-gradient-to-br from-[#002b5e] via-[#003572] to-[#004a9e] text-white py-10 sm:py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Olá {clientName}, compare os planos para seu {veiculo}
          </h1>

          {/* Vehicle Card */}
          <Card className="max-w-lg mx-auto mt-6 bg-white/10 border-white/20 backdrop-blur-sm text-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="bg-[#7ed6f1]/20 p-3 rounded-full">
                <Car className="w-8 h-8 text-[#7ed6f1]" />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold">{veiculo}</p>
                <p className="text-sm text-white/80">
                  Placa: <span className="font-semibold">{placa}</span>
                  {fipeValue != null && (
                    <>
                      {" "}| FIPE: <span className="font-semibold">{formatBRL(fipeValue)}</span>
                    </>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Plan Cards */}
      {planos.length > 0 && (
        <section className="py-10 sm:py-14 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#002b5e] text-center mb-8">
              Planos Disponíveis
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {planos.map((plano, idx) => {
                const price = plano.valor_mensal ?? 0;
                const coberturas = getCoberturas(plano);
                const assistencias = getAssistencias(plano);
                const isSelected = selectedPlan === idx;
                return (
                  <Card
                    key={idx}
                    className={`relative overflow-hidden transition-all hover:shadow-xl cursor-pointer ${
                      isSelected
                        ? "border-2 border-[#2ecc71] shadow-lg ring-2 ring-[#2ecc71]/30"
                        : "border border-gray-200"
                    }`}
                    onClick={() => handleSelectPlan(idx)}
                  >
                    {isSelected && (
                      <div className="absolute top-0 right-0">
                        <Badge className="bg-[#2ecc71] text-white font-bold rounded-none rounded-bl-lg px-3 py-1">
                          Selecionado
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="text-center pb-2 pt-6">
                      {planIcons[idx] || planIcons[0]}
                      <h3 className="text-xl font-bold text-[#002b5e] mt-3">
                        {plano.nome}
                      </h3>
                    </CardHeader>
                    <CardContent className="text-center space-y-3">
                      {/* Price */}
                      <div>
                        <span className="text-3xl font-extrabold text-[#003572]">
                          {formatBRL(price)}
                        </span>
                        <span className="text-gray-500 text-sm">/mês</span>
                      </div>

                      {/* Adesão */}
                      {plano.adesao != null && (
                        <p className="text-sm text-gray-600">
                          Adesão: <span className="font-semibold text-[#002b5e]">{formatBRL(plano.adesao)}</span>
                        </p>
                      )}

                      {/* Rastreador */}
                      <p className="text-sm text-gray-600">
                        Rastreador:{" "}
                        <span className={`font-semibold ${isRastreadorSim(plano) ? "text-[#2ecc71]" : "text-gray-400"}`}>
                          {isRastreadorSim(plano) ? "Sim" : "Não"}
                        </span>
                      </p>

                      {/* Franquia */}
                      {plano.franquia && (
                        <p className="text-sm text-gray-600">
                          Franquia: <span className="font-semibold text-[#002b5e]">{plano.franquia}</span>
                        </p>
                      )}

                      {/* Coberturas */}
                      {coberturas.length > 0 && (
                        <div className="text-left pt-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Coberturas</p>
                          <ul className="space-y-1">
                            {coberturas.map((c, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                <CheckCircle className="w-4 h-4 text-[#2ecc71] mt-0.5 flex-shrink-0" />
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Assistências */}
                      {assistencias.length > 0 && (
                        <div className="text-left pt-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Assistências</p>
                          <ul className="space-y-1">
                            {assistencias.map((a, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-[#7ed6f1] mt-0.5 flex-shrink-0" />
                                {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Select Button */}
                      <Button
                        className={`w-full mt-4 font-bold ${
                          isSelected
                            ? "bg-[#2ecc71] hover:bg-[#27ae60] text-white"
                            : "bg-[#2ecc71] hover:bg-[#27ae60] text-white"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPlan(idx);
                        }}
                      >
                        {isSelected ? "Plano selecionado" : "Escolher este plano"}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============ SECTION 2: Selected Plan Details ============ */}
      {(view === "details" || view === "payment") && chosen && (
        <section ref={detailsRef} className="py-10 px-4 bg-white border-t">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-[#002b5e] text-center mb-6">
              Plano Selecionado
            </h2>
            <Card className="border-2 border-[#002b5e]/20">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  {planIcons[selectedPlan!] || planIcons[0]}
                  <h3 className="text-xl font-bold text-[#002b5e]">{chosen.nome}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Mensalidade</p>
                    <p className="text-lg font-bold text-[#003572]">{formatBRL(chosen.valor_mensal)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Adesão</p>
                    <p className="text-lg font-bold text-[#003572]">{formatBRL(chosen.adesao)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Rastreador</p>
                    <p className="font-semibold">{isRastreadorSim(chosen) ? "Sim" : "Não"}</p>
                  </div>
                  {chosen.franquia && (
                    <div>
                      <p className="text-gray-500">Franquia</p>
                      <p className="font-semibold">{chosen.franquia}</p>
                    </div>
                  )}
                </div>
                <div className="text-center pt-4">
                  <Button
                    size="lg"
                    className="bg-[#2ecc71] hover:bg-[#27ae60] text-white font-bold text-lg px-8 py-6 rounded-xl shadow-lg"
                    onClick={handleProceedToPayment}
                  >
                    Prosseguir para pagamento
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* ============ SECTION 3: Payment (PIX) ============ */}
      {view === "payment" && chosen && (
        <section ref={paymentRef} className="py-10 px-4 bg-gradient-to-br from-[#002b5e] to-[#003572] text-white border-t">
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">
              Pagamento da Adesão
            </h2>
            <p className="text-center text-[#7ed6f1] mb-8">
              {chosen.nome} — Adesão: <span className="font-bold text-white">{formatBRL(chosen.adesao)}</span>
            </p>

            <Card className="bg-white text-gray-900">
              <CardContent className="p-6 space-y-6">
                {configEmpresa?.pix_chave ? (
                  <>
                    {/* QR Code */}
                    {configEmpresa.pix_qrcode_url && (
                      <div className="flex flex-col items-center gap-3">
                        <QrCode className="w-6 h-6 text-[#002b5e]" />
                        <img
                          src={configEmpresa.pix_qrcode_url}
                          alt="QR Code PIX"
                          className="w-48 h-48 object-contain border rounded-lg p-2"
                        />
                      </div>
                    )}

                    {/* PIX Key */}
                    <div className="text-center space-y-2">
                      <p className="text-sm text-gray-500">Chave PIX</p>
                      <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center justify-between gap-2">
                        <code className="text-sm font-mono text-[#002b5e] break-all">
                          {configEmpresa.pix_chave}
                        </code>
                      </div>
                      {configEmpresa.pix_nome && (
                        <p className="text-sm text-gray-600">
                          Nome: <span className="font-semibold">{configEmpresa.pix_nome}</span>
                        </p>
                      )}
                      {configEmpresa.pix_tipo && (
                        <p className="text-xs text-gray-400">
                          Tipo: {configEmpresa.pix_tipo}
                        </p>
                      )}
                    </div>

                    {/* Copy Button */}
                    <Button
                      className="w-full bg-[#002b5e] hover:bg-[#003572] text-white font-bold"
                      onClick={handleCopyPix}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {pixCopied ? "Chave copiada!" : "Copiar chave PIX"}
                    </Button>

                    {pixCopied && (
                      <p className="text-center text-sm text-[#2ecc71] font-semibold">
                        Chave PIX copiada para a área de transferência!
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6 space-y-3">
                    <Clock className="w-10 h-10 text-[#7ed6f1] mx-auto" />
                    <p className="text-gray-600 font-semibold">
                      Chave PIX será enviada em breve
                    </p>
                    <p className="text-sm text-gray-400">
                      Entre em contato com seu consultor para mais informações.
                    </p>
                  </div>
                )}

                {/* Message */}
                <div className="bg-[#2ecc71]/10 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-700 font-medium">
                    Após o pagamento, envie o comprovante pelo WhatsApp
                  </p>
                </div>

                {/* WhatsApp Button */}
                {consultorPhone && (
                  <Button
                    asChild
                    className="w-full bg-[#2ecc71] hover:bg-[#27ae60] text-white font-bold py-5"
                  >
                    <a href={whatsappConsultor} target="_blank" rel="noopener noreferrer">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Enviar comprovante pelo WhatsApp
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Footer consultant */}
            <div className="mt-8 text-center space-y-3">
              <p className="text-white/80 text-sm">
                Dúvidas? Fale com <span className="font-bold text-white">{consultor}</span>
              </p>
              {consultorPhone && (
                <Button
                  asChild
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <a href={whatsappConsultor} target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    WhatsApp do Consultor
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-[#002b5e] text-white/70 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <img
            src={LOGO_URL}
            alt="Objetivo Auto"
            className="h-8 mx-auto opacity-70"
          />
          {configEmpresa?.cnpj && (
            <p className="text-sm">CNPJ: {configEmpresa.cnpj}</p>
          )}
          <div className="flex items-center justify-center gap-4 text-sm">
            <a
              href={`tel:${PHONE_0800.replace(/\s/g, "")}`}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Phone className="w-3 h-3" />
              {PHONE_0800}
            </a>
          </div>
          <p className="text-xs text-white/40">
            Objetivo Proteção Veicular — Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}
