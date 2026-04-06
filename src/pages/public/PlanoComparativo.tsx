import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield, ShieldCheck, ShieldPlus, CheckCircle, XCircle,
  Phone, MessageSquare, QrCode, Copy, ChevronRight, Car, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const LOGO_URL = "https://objetivoauto.com.br/wp-content/uploads/2025/11/IMG_1299.png";
const PHONE_0800 = "0800 111 3400";

function fmtBRL(v: number | null | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// All possible coberturas/assistências to compare across plans
const TODAS_COBERTURAS = [
  "Roubo/Furto", "Colisão", "Incêndio", "Perda Total",
  "Vidros", "Danos a Terceiros", "Danos da Natureza",
  "Carro Reserva",
];
const TODAS_ASSISTENCIAS = [
  "Assistência 24H/Guincho", "Auxílio combustível", "Recarga de bateria",
  "Hospedagem", "Retorno ao domicílio", "Chaveiro", "Troca de pneus",
];

// Extrair detalhe numérico de nomes de produtos SGA (ex: "DANOS A TERCEIROS 70 MIL" → "70 mil")
function extractDetail(produtoNome: string): string {
  // Padrões comuns: "70 MIL", "500KM", "15 DIAS", "60%", etc.
  const m = produtoNome.match(/(\d+[\.,]?\d*)\s*(MIL|KM|DIAS|%)/i);
  if (m) return `${m[1]} ${m[2].toLowerCase()}`.replace("mil", "mil");
  return "";
}

// Match nome do produto SGA com a categoria comparativa
function matchCoberturaDetail(produtos: string[], target: string): string {
  const t = target.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const p of produtos) {
    const pn = p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (pn.includes(t.split("/")[0]) || t.split("/").some(tt => pn.includes(tt))) {
      const detail = extractDetail(p);
      return detail || "✓";
    }
  }
  return "";
}

function normalizeCheck(items: string[], target: string): boolean {
  const targets = target.toLowerCase().split("/");
  return items.some(i => {
    const il = i.toLowerCase();
    return targets.some(t => il.includes(t) || t.includes(il));
  });
}

interface Plano { nome: string; valor_mensal?: number; adesao?: number; rastreador?: string | boolean; franquia?: string; valor_fipe?: number; coberturas?: string[]; assistencias?: string[]; [k: string]: unknown; }
interface Negociacao { lead_nome?: string; veiculo_modelo?: string; veiculo_placa?: string; consultor?: string; telefone?: string; email?: string; [k: string]: unknown; }

export default function PlanoComparativo() {
  const { id } = useParams<{ id: string }>();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [neg, setNeg] = useState<Negociacao | null>(null);
  const [configEmpresa, setConfigEmpresa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [consultorData, setConsultorData] = useState<any>(null);

  const payRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: cot } = await supabase.from("cotacoes" as any).select("*").eq("id", id).single();
      if (!cot) { setError("Cotação não encontrada."); setLoading(false); return; }

      const todosPlanosBruto = Array.isArray((cot as any).todos_planos) ? (cot as any).todos_planos as Plano[] : [];
      // Deduplicar por nome de plano (pode vir duplicado de tabela_precos por regional/faixa FIPE)
      const seenNames = new Set<string>();
      const todosPlanos: Plano[] = [];
      for (const p of todosPlanosBruto) {
        if (!seenNames.has(p.nome)) {
          seenNames.add(p.nome);
          todosPlanos.push(p);
        }
      }

      // Buscar coberturas de cada plano do banco
      const nomesPlanos = [...new Set(todosPlanos.map(p => p.nome))];
      if (nomesPlanos.length > 0) {
        const { data: cobData } = await supabase.from("coberturas_plano" as any)
          .select("*").in("plano", nomesPlanos);
        if (cobData && (cobData as any[]).length > 0) {
          const cobMap: Record<string, { coberturas: string[]; assistencias: string[] }> = {};
          (cobData as any[]).forEach(c => {
            if (!cobMap[c.plano]) cobMap[c.plano] = { coberturas: [], assistencias: [] };
            if (c.tipo === "cobertura") cobMap[c.plano].coberturas.push(c.cobertura);
            else cobMap[c.plano].assistencias.push(c.cobertura);
          });
          todosPlanos.forEach(p => {
            if (cobMap[p.nome]) {
              p.coberturas = cobMap[p.nome].coberturas;
              p.assistencias = cobMap[p.nome].assistencias;
            }
          });
        }
      }

      // Fallback: se nenhum plano tem coberturas, aplicar defaults baseado no nome
      const defaultCob: Record<string, { coberturas: string[]; assistencias: string[] }> = {
        "Básico": {
          coberturas: ["Roubo", "Furto"],
          assistencias: ["Assistência 24H", "Auxílio combustível", "Recarga de bateria", "Hospedagem", "Retorno ao domicílio", "Chaveiro", "Reboque", "Troca de pneus"],
        },
        "Completo": {
          coberturas: ["Roubo", "Furto", "Colisão", "Incêndio", "Perda Total", "Vidros Completos", "Danos a Terceiros", "Carro Reserva"],
          assistencias: ["Assistência 24H", "Auxílio combustível", "Recarga de bateria", "Hospedagem", "Retorno ao domicílio", "Chaveiro", "Reboque", "Troca de pneus"],
        },
        "Objetivo": {
          coberturas: ["Roubo", "Furto", "Colisão", "Incêndio", "Perda Total", "Vidros Completos", "Danos a Terceiros", "Danos da Natureza", "Carro Reserva"],
          assistencias: ["Assistência 24H", "Auxílio combustível", "Recarga de bateria", "Hospedagem", "Retorno ao domicílio", "Chaveiro", "Reboque", "Troca de pneus"],
        },
        "Premium": {
          coberturas: ["Roubo", "Furto", "Colisão", "Incêndio", "Perda Total", "Vidros Completos", "Danos a Terceiros", "Danos da Natureza", "Carro Reserva"],
          assistencias: ["Assistência 24H", "Auxílio combustível", "Recarga de bateria", "Hospedagem", "Retorno ao domicílio", "Chaveiro", "Reboque", "Troca de pneus"],
        },
      };
      todosPlanos.forEach(p => {
        if (!p.coberturas || p.coberturas.length === 0) {
          const def = defaultCob[p.nome] || defaultCob["Completo"];
          p.coberturas = def.coberturas;
          p.assistencias = def.assistencias;
        }
      });

      setPlanos(todosPlanos);

      if ((cot as any).negociacao_id) {
        const { data: negData } = await supabase.from("negociacoes" as any).select("*").eq("id", (cot as any).negociacao_id).single();
        if (negData) {
          setNeg(negData as any);
          // Buscar dados do consultor (whatsapp pessoal)
          if ((negData as any).consultor) {
            const { data: usr } = await supabase.from("usuarios" as any).select("nome, whatsapp, telefone, email")
              .eq("nome", (negData as any).consultor).limit(1).maybeSingle();
            if (usr) setConsultorData(usr);
          }
        }
      }

      const { data: cfg } = await supabase.from("config_empresa" as any).select("*").limit(1).maybeSingle();
      if (cfg) setConfigEmpresa(cfg);

      setLoading(false);
    })();
  }, [id]);

  const clientName = neg?.lead_nome || "Cliente";
  const veiculo = neg?.veiculo_modelo || "—";
  const placa = neg?.veiculo_placa || "—";
  const consultor = neg?.consultor || "Consultor";
  const consultorTel = consultorData?.whatsapp || consultorData?.telefone || neg?.telefone || "";
  const fipeValue = planos[0]?.valor_fipe;

  const waConsultor = (msg: string) => {
    const tel = consultorTel.replace(/\D/g, "");
    return tel ? `https://wa.me/${tel.startsWith("55") ? tel : `55${tel}`}?text=${encodeURIComponent(msg)}` : "#";
  };

  const handleSelect = (idx: number) => {
    setSelected(idx);
    setShowPayment(false);
  };

  const handlePay = () => {
    setShowPayment(true);
    setTimeout(() => payRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const copyPix = async () => {
    if (!configEmpresa?.pix_chave) return;
    await navigator.clipboard.writeText(configEmpresa.pix_chave).catch(() => {});
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#002b5e] to-[#003572]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#7ed6f1] border-t-transparent rounded-full animate-spin" />
        <p className="text-white text-lg">Carregando planos...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#002b5e] to-[#003572]">
      <Card className="max-w-md mx-4"><CardContent className="p-8 text-center">
        <Shield className="w-16 h-16 text-[#7ed6f1] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#002b5e] mb-2">Cotação não encontrada</h2>
        <p className="text-gray-600">{error}</p>
      </CardContent></Card>
    </div>
  );

  const chosen = selected !== null ? planos[selected] : null;
  const icons = [
    <Shield key={0} className="w-6 h-6" />,
    <ShieldCheck key={1} className="w-6 h-6" />,
    <ShieldPlus key={2} className="w-6 h-6" />,
  ];

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Header */}
      <header className="bg-[#002b5e] text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <img src={LOGO_URL} alt="Objetivo" className="h-10 sm:h-12" />
          <a href={`tel:${PHONE_0800.replace(/\s/g, "")}`} className="flex items-center gap-2 text-sm font-semibold hover:text-[#7ed6f1]">
            <Phone className="w-4 h-4" />{PHONE_0800}
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#002b5e] via-[#003572] to-[#004a9e] text-white py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-xl sm:text-3xl font-bold mb-1">Olá {clientName}!</h1>
          <p className="text-[#7ed6f1] text-sm sm:text-lg mb-6">Compare os planos e escolha o melhor para você</p>
          <div className="inline-flex items-center gap-3 bg-white/10 rounded-xl px-5 py-3 border border-white/20">
            <Car className="w-6 h-6 text-[#7ed6f1]" />
            <div className="text-left">
              <p className="font-bold text-sm sm:text-base">{veiculo}</p>
              <p className="text-xs text-white/70">Placa: {placa}{fipeValue ? ` | FIPE: ${fmtBRL(fipeValue)}` : ""}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TABELA COMPARATIVA ═══ */}
      {planos.length > 0 && (
        <section className="py-8 sm:py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-[#002b5e] text-center mb-6">Comparativo de Planos</h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header row with plan names */}
                <thead>
                  <tr>
                    <th className="text-left px-4 py-4 bg-[#002b5e] text-white text-sm font-bold w-1/4">Benefício</th>
                    {planos.map((p, i) => (
                      <th key={i} className={`text-center px-3 py-4 text-sm font-bold ${
                        selected === i ? "bg-[#2ecc71] text-white" : "bg-[#002b5e] text-white"
                      }`}>
                        <div className="flex flex-col items-center gap-1">
                          {icons[i] || icons[0]}
                          <span>{p.nome}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Preço */}
                  <tr className="bg-[#002b5e]/5">
                    <td className="px-4 py-3 text-sm font-bold text-[#002b5e]">Mensalidade</td>
                    {planos.map((p, i) => (
                      <td key={i} className="text-center px-3 py-3">
                        <span className="text-lg sm:text-xl font-extrabold text-[#003572]">{fmtBRL(p.valor_mensal)}</span>
                        <span className="text-xs text-gray-400">/mês</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-sm font-semibold text-gray-700 border-t">Adesão</td>
                    {planos.map((p, i) => (
                      <td key={i} className="text-center px-3 py-2.5 text-sm font-semibold text-[#002b5e] border-t">{fmtBRL(p.adesao)}</td>
                    ))}
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2.5 text-sm font-semibold text-gray-700 border-t">Rastreador</td>
                    {planos.map((p, i) => {
                      const sim = typeof p.rastreador === "string" ? p.rastreador.toLowerCase() === "sim" : !!p.rastreador;
                      return (
                        <td key={i} className="text-center px-3 py-2.5 border-t">
                          {sim ? <CheckCircle className="w-5 h-5 text-[#2ecc71] mx-auto" /> : <span className="text-gray-400 text-sm">—</span>}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Separator: Coberturas */}
                  <tr>
                    <td colSpan={planos.length + 1} className="px-4 py-2 bg-[#002b5e]/10 text-xs font-bold text-[#002b5e] uppercase tracking-wider border-t-2 border-[#002b5e]/20">
                      Coberturas
                    </td>
                  </tr>
                  {TODAS_COBERTURAS.map((cob, ci) => (
                    <tr key={`c-${ci}`} className={ci % 2 === 0 ? "" : "bg-gray-50/50"}>
                      <td className="px-4 py-2 text-sm text-gray-700 border-t border-gray-100">{cob}</td>
                      {planos.map((p, i) => {
                        const has = normalizeCheck(p.coberturas || [], cob);
                        const detail = matchCoberturaDetail(p.coberturas || [], cob);
                        return (
                          <td key={i} className="text-center px-3 py-2 border-t border-gray-100">
                            {has ? (
                              detail && detail !== "✓" ? (
                                <span className="text-sm font-semibold text-[#003572]">{detail}</span>
                              ) : (
                                <CheckCircle className="w-5 h-5 text-[#2ecc71] mx-auto" />
                              )
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Separator: Assistências */}
                  <tr>
                    <td colSpan={planos.length + 1} className="px-4 py-2 bg-[#002b5e]/10 text-xs font-bold text-[#002b5e] uppercase tracking-wider border-t-2 border-[#002b5e]/20">
                      Assistências 24h
                    </td>
                  </tr>
                  {TODAS_ASSISTENCIAS.map((ass, ai) => (
                    <tr key={`a-${ai}`} className={ai % 2 === 0 ? "" : "bg-gray-50/50"}>
                      <td className="px-4 py-2 text-sm text-gray-700 border-t border-gray-100">{ass}</td>
                      {planos.map((p, i) => {
                        const has = normalizeCheck(p.assistencias || [], ass);
                        const detail = matchCoberturaDetail(p.assistencias || [], ass);
                        return (
                          <td key={i} className="text-center px-3 py-2 border-t border-gray-100">
                            {has ? (
                              detail && detail !== "✓" ? (
                                <span className="text-sm font-semibold text-[#003572]">{detail}</span>
                              ) : (
                                <CheckCircle className="w-5 h-5 text-[#2ecc71] mx-auto" />
                              )
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Botões de seleção */}
                  <tr>
                    <td className="px-4 py-4 border-t-2 border-[#002b5e]/20" />
                    {planos.map((_, i) => (
                      <td key={i} className="text-center px-3 py-4 border-t-2 border-[#002b5e]/20">
                        <button
                          onClick={() => handleSelect(i)}
                          className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                            selected === i
                              ? "bg-[#2ecc71] text-white shadow-lg"
                              : "bg-[#002b5e] text-white hover:bg-[#003572]"
                          }`}
                        >
                          {selected === i ? "✓ Selecionado" : "Contratar"}
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ═══ PLANO SELECIONADO + PIX ═══ */}
      {chosen && !showPayment && (
        <section className="py-8 px-4 bg-white border-t">
          <div className="max-w-lg mx-auto text-center space-y-4">
            <h2 className="text-xl font-bold text-[#002b5e]">Plano {chosen.nome} selecionado</h2>
            <div className="flex justify-center gap-6 text-sm">
              <div><p className="text-gray-500">Mensalidade</p><p className="text-xl font-bold text-[#003572]">{fmtBRL(chosen.valor_mensal)}</p></div>
              <div><p className="text-gray-500">Adesão</p><p className="text-xl font-bold text-[#003572]">{fmtBRL(chosen.adesao)}</p></div>
            </div>
            <Button size="lg" className="bg-[#2ecc71] hover:bg-[#27ae60] text-white font-bold text-lg px-10 py-6 rounded-xl shadow-xl" onClick={handlePay}>
              Prosseguir para pagamento <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>
      )}

      {/* ═══ PAGAMENTO PIX ═══ */}
      {showPayment && chosen && (
        <section ref={payRef} className="py-10 px-4 bg-gradient-to-br from-[#002b5e] to-[#003572] text-white">
          <div className="max-w-lg mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Pagamento da Adesão</h2>
              <p className="text-[#7ed6f1] mt-1">{chosen.nome} — <span className="font-bold text-white">{fmtBRL(chosen.adesao)}</span></p>
            </div>

            <Card className="bg-white text-gray-900">
              <CardContent className="p-6 space-y-5">
                {configEmpresa?.pix_chave ? (
                  <>
                    {configEmpresa.pix_qrcode_url && (
                      <div className="flex justify-center">
                        <img src={configEmpresa.pix_qrcode_url} alt="QR Code PIX" className="w-48 h-48 border rounded-lg p-2" />
                      </div>
                    )}
                    <div className="text-center space-y-2">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Chave PIX ({configEmpresa.pix_tipo || "CNPJ"})</p>
                      <div className="bg-gray-100 rounded-lg px-4 py-3">
                        <code className="text-sm font-mono text-[#002b5e] break-all">{configEmpresa.pix_chave}</code>
                      </div>
                      {configEmpresa.pix_nome && <p className="text-sm">Favorecido: <strong>{configEmpresa.pix_nome}</strong></p>}
                    </div>
                    <Button className="w-full bg-[#002b5e] hover:bg-[#003572] text-white font-bold" onClick={copyPix}>
                      <Copy className="w-4 h-4 mr-2" />{pixCopied ? "Chave copiada!" : "Copiar chave PIX"}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Clock className="w-10 h-10 text-[#7ed6f1] mx-auto mb-3" />
                    <p className="font-semibold text-gray-600">Chave PIX será enviada em breve</p>
                    <p className="text-sm text-gray-400">Entre em contato com seu consultor.</p>
                  </div>
                )}

                <div className="bg-[#2ecc71]/10 rounded-lg p-4 text-center">
                  <p className="text-sm font-medium text-gray-700">Após o pagamento, envie o comprovante pelo WhatsApp</p>
                </div>

                <Button asChild className="w-full bg-[#2ecc71] hover:bg-[#27ae60] text-white font-bold py-5 text-base">
                  <a href={waConsultor(`Olá ${consultor}, segue o comprovante de pagamento da adesão - Plano ${chosen.nome}`)} target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="w-5 h-5 mr-2" />Enviar comprovante via WhatsApp
                  </a>
                </Button>
              </CardContent>
            </Card>

            <div className="text-center space-y-2">
              <p className="text-white/70 text-sm">Seu consultor: <strong className="text-white">{consultor}</strong></p>
              <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <a href={waConsultor(`Olá ${consultor}, tenho uma dúvida sobre a cotação`)} target="_blank" rel="noopener noreferrer">
                  <MessageSquare className="w-4 h-4 mr-2" />WhatsApp do Consultor
                </a>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-[#002b5e] text-white/60 py-6 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-2">
          <img src={LOGO_URL} alt="Objetivo" className="h-7 mx-auto opacity-60" />
          {configEmpresa?.cnpj && <p className="text-xs">CNPJ: {configEmpresa.cnpj}</p>}
          <p className="text-[10px] text-white/30">Objetivo Proteção Veicular — Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
}
