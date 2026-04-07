import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Phone, MessageSquare, Car } from "lucide-react";

const LOGO_URL = "https://objetivoauto.com.br/wp-content/uploads/2025/11/IMG_1299.png";
const PHONE_0800 = "0800 111 3400";

function fmtBRL(v: number | null | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("pt-BR") + " " + dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ── Normalize helpers ──
function normalizeStr(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function matchCobertura(coberturas: any[], target: string): { found: boolean; detalhe?: string } {
  const t = normalizeStr(target);
  const keywords = t.split(/[\s/]+/).filter(Boolean);
  for (const c of coberturas) {
    const nome = normalizeStr(typeof c === "string" ? c : c.cobertura || c.nome || "");
    if (keywords.every(k => nome.includes(k)) || keywords.some(k => nome.includes(k) && nome.length < 40)) {
      const raw = typeof c === "object" ? (c.detalhe || c.valor || "") : "";
      const detalhe = (raw && String(raw) !== "0" && String(raw) !== "0,00" && String(raw) !== "R$ 0,00" && Number(raw) !== 0) ? String(raw) : "";
      return { found: typeof c === "object" ? c.inclusa !== false : true, detalhe };
    }
  }
  return { found: false };
}

function matchAssistencia(assistencias: any[], target: string): { found: boolean; detalhe?: string } {
  const t = normalizeStr(target);
  for (const a of assistencias) {
    const nome = normalizeStr(typeof a === "string" ? a : a.cobertura || a.nome || "");
    if (nome.includes(t) || t.includes(nome) || t.split("/").some(k => nome.includes(k.trim()))) {
      const raw = typeof a === "object" ? (a.detalhe || a.valor || "") : "";
      const detalhe = (raw && String(raw) !== "0" && String(raw) !== "0,00" && String(raw) !== "R$ 0,00" && Number(raw) !== 0) ? String(raw) : "";
      return { found: true, detalhe };
    }
  }
  return { found: false };
}

// ── Types ──
interface Plano {
  nome: string;
  valor_mensal?: number;
  adesao?: number;
  rastreador?: string | number | boolean;
  franquia?: number | string;
  tipo_franquia?: string;
  valor_franquia?: number;
  valor_fipe?: number;
  coberturas?: any[];
  assistencias?: any[];
  produtos?: string[];
  [k: string]: unknown;
}

interface Negociacao {
  lead_nome?: string;
  veiculo_modelo?: string;
  veiculo_placa?: string;
  consultor?: string;
  telefone?: string;
  email?: string;
  estado_circulacao?: string;
  cidade_circulacao?: string;
  [k: string]: unknown;
}

// ── Row definitions ──
type RowKind = "value" | "check" | "assist" | "benefit";
interface TableRow {
  label: string;
  kind: RowKind;
  getValue?: (p: Plano) => string;
  cobKey?: string;
}

const SECTION_VALORES: TableRow[] = [
  { label: "Adesão", kind: "value", getValue: (p) => fmtBRL(p.adesao) },
  {
    label: "Cota de participação", kind: "value",
    getValue: (p) => {
      if (p.tipo_franquia && p.valor_franquia != null) {
        if (p.tipo_franquia === '%') {
          const calc = p.valor_fipe ? ` (${fmtBRL(Number(p.valor_fipe) * Number(p.valor_franquia) / 100)})` : "";
          return `${p.valor_franquia}% FIPE${calc}`;
        }
        return fmtBRL(Number(p.valor_franquia));
      }
      if (p.franquia) return typeof p.franquia === "number" ? `${p.franquia}% FIPE` : String(p.franquia);
      return "";
    },
  },
  {
    label: "Rastreador", kind: "value",
    getValue: (p) => {
      if (p.rastreador == null || p.rastreador === false || p.rastreador === "Não" || p.rastreador === "nao" || p.rastreador === 0) return "";
      if (typeof p.rastreador === "number") return fmtBRL(p.rastreador);
      if (typeof p.rastreador === "string" && p.rastreador.toLowerCase() === "sim") return "Incluso";
      return String(p.rastreador);
    },
  },
];

const COBERTURA_DESCRICOES: Record<string, string> = {
  "roubo": "Indenização de 100% da tabela FIPE em caso de roubo do veículo",
  "furto": "Indenização de 100% da tabela FIPE em caso de furto do veículo",
  "colisao": "Cobertura para danos causados por colisão, capotamento ou tombamento",
  "incendio": "Proteção contra incêndio, explosão e queda de raio",
  "danos a terceiros 30": "Cobertura de até R$ 30.000 para danos materiais e corporais causados a terceiros",
  "perda total": "Indenização integral quando o reparo ultrapassa 75% do valor FIPE",
  "danos da natureza": "Cobertura para enchentes, granizo, queda de árvore e outros eventos naturais",
  "danos a terceiros 70": "Cobertura ampliada de até R$ 70.000 para danos materiais e corporais a terceiros",
  "carro reserva": "Veículo reserva por até 15 dias em caso de sinistro coberto",
  "vidros": "Cobertura de 60% para para-brisas, vidros laterais e traseiro",
};

const SECTION_COBERTURAS: TableRow[] = [
  { label: "Roubo", kind: "check", cobKey: "roubo" },
  { label: "Furto", kind: "check", cobKey: "furto" },
  { label: "Colisão", kind: "check", cobKey: "colisao" },
  { label: "Incêndio", kind: "check", cobKey: "incendio" },
  { label: "Danos a Terceiros (R$ 30.000)", kind: "check", cobKey: "danos a terceiros 30" },
  { label: "Perda Total", kind: "check", cobKey: "perda total" },
  { label: "Danos da natureza", kind: "check", cobKey: "danos da natureza" },
  { label: "Danos a Terceiros (R$ 70.000)", kind: "check", cobKey: "danos a terceiros 70" },
  { label: "Carro Reserva 15 dias", kind: "check", cobKey: "carro reserva" },
  { label: "Vidros Completos (60%)", kind: "check", cobKey: "vidros" },
];

const ASSISTENCIA_DESCRICOES: Record<string, string> = {
  "assistencia 24h": "Socorro mecânico e guincho disponível 24 horas por dia, 7 dias por semana",
};

const BENEFICIO_DESCRICOES: Record<string, string> = {
  "auxilio combustivel": "Envio de combustível ao local em caso de pane seca",
  "recarga de bateria": "Recarga ou troca de bateria no local do veículo",
  "hospedagem": "Diárias de hotel em caso de sinistro fora do domicílio",
  "retorno ao domicilio": "Transporte de retorno ao domicílio em caso de sinistro em viagem",
  "chaveiro": "Serviço de chaveiro para abertura do veículo",
  "reboque": "Serviço de reboque/guincho ilimitado em todo o território nacional",
  "troca de pneus": "Troca de pneu furado pelo estepe do próprio veículo",
};

const SECTION_ASSISTENCIA: TableRow[] = [
  { label: "Assistência 24H", kind: "assist", cobKey: "assistencia 24h" },
];

const SECTION_BENEFICIOS: TableRow[] = [
  { label: "Auxílio combustível", kind: "benefit", cobKey: "auxilio combustivel" },
  { label: "Recarga de bateria", kind: "benefit", cobKey: "recarga de bateria" },
  { label: "Hospedagem", kind: "benefit", cobKey: "hospedagem" },
  { label: "Retorno ao domicílio", kind: "benefit", cobKey: "retorno ao domicilio" },
  { label: "Chaveiro", kind: "benefit", cobKey: "chaveiro" },
  { label: "Reboque", kind: "benefit", cobKey: "reboque" },
  { label: "Troca de pneus", kind: "benefit", cobKey: "troca de pneus" },
];

// ── Component ──
export default function PlanoComparativo() {
  const { id } = useParams<{ id: string }>();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [neg, setNeg] = useState<Negociacao | null>(null);
  const [cotacao, setCotacao] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [consultorData, setConsultorData] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: cot } = await supabase.from("cotacoes" as any).select("*").eq("id", id).single();
      if (!cot) { setError("Cotação não encontrada."); setLoading(false); return; }
      setCotacao(cot);

      const todosPlanosBruto = Array.isArray((cot as any).todos_planos) ? (cot as any).todos_planos as Plano[] : [];
      // Deduplicar por nome
      const seenNames = new Set<string>();
      const todosPlanos: Plano[] = [];
      for (const p of todosPlanosBruto) {
        if (!seenNames.has(p.nome)) {
          seenNames.add(p.nome);
          todosPlanos.push(p);
        }
      }

      // Parse coberturas do snapshot
      let usouSnapshot = false;
      todosPlanos.forEach(p => {
        const snap = p.coberturas;
        if (Array.isArray(snap) && snap.length > 0 && typeof snap[0] === "object" && snap[0].cobertura) {
          const cobs: any[] = [];
          const assists: any[] = [];
          snap.forEach((c: any) => {
            if (c.tipo === "assistencia") assists.push(c);
            else cobs.push(c);
          });
          p.coberturas = cobs;
          p.assistencias = assists;
          usouSnapshot = true;
        }
      });

      // Fallback: buscar coberturas_plano
      if (!usouSnapshot) {
        const nomesPlanos = [...new Set(todosPlanos.map(p => p.nome))];
        if (nomesPlanos.length > 0) {
          const { data: cobData } = await supabase.from("coberturas_plano" as any)
            .select("*").in("plano", nomesPlanos);
          if (cobData && (cobData as any[]).length > 0) {
            const cobMap: Record<string, { coberturas: any[]; assistencias: any[] }> = {};
            (cobData as any[]).forEach(c => {
              if (!cobMap[c.plano]) cobMap[c.plano] = { coberturas: [], assistencias: [] };
              const obj = { cobertura: c.cobertura, tipo: c.tipo, inclusa: true, detalhe: c.detalhe || "" };
              if (c.tipo === "assistencia") cobMap[c.plano].assistencias.push(obj);
              else cobMap[c.plano].coberturas.push(obj);
            });
            todosPlanos.forEach(p => {
              if (cobMap[p.nome]) {
                p.coberturas = cobMap[p.nome].coberturas;
                p.assistencias = cobMap[p.nome].assistencias;
              }
            });
          }
        }
      }

      setPlanos(todosPlanos);

      if ((cot as any).negociacao_id) {
        const { data: negData } = await supabase.from("negociacoes" as any).select("*").eq("id", (cot as any).negociacao_id).single();
        if (negData) {
          setNeg(negData as any);
          if ((negData as any).consultor) {
            const { data: usr } = await supabase.from("usuarios" as any).select("nome, celular, telefone, email, avatar_url")
              .eq("nome", (negData as any).consultor).limit(1).maybeSingle();
            if (usr) setConsultorData(usr);
          }
        }
      }

      setLoading(false);
    })();
  }, [id]);

  // ── Derived data ──
  const clientName = neg?.lead_nome || "Cliente";
  const veiculo = neg?.veiculo_modelo || "—";
  const fipeValue = planos[0]?.valor_fipe;
  const cidade = (cotacao as any)?.cidade_circulacao || neg?.cidade_circulacao || "";
  const estado = (cotacao as any)?.estado_circulacao || neg?.estado_circulacao || "";
  const createdAt = (cotacao as any)?.created_at || "";
  const consultor = neg?.consultor || "Consultor";
  const consultorTel = consultorData?.celular || consultorData?.telefone || neg?.telefone || "";
  const consultorEmail = consultorData?.email || neg?.email || "";
  const consultorAvatar = consultorData?.avatar_url || "";

  const waLink = (msg: string) => {
    const tel = (consultorTel || "").replace(/\D/g, "");
    return tel ? `https://wa.me/${tel.startsWith("55") ? tel : `55${tel}`}?text=${encodeURIComponent(msg)}` : "#";
  };

  // ── Cell renderer ──
  const renderCell = (row: TableRow, plano: Plano) => {
    if (row.kind === "value") {
      const val = row.getValue?.(plano) || "";
      if (!val) return <XCircle className="w-5 h-5 text-red-400 mx-auto" />;
      return <span className="text-sm font-semibold text-gray-800">{val}</span>;
    }

    // Check/assist/benefit: search in coberturas or assistencias
    const source = row.kind === "assist" || row.kind === "benefit"
      ? [...(plano.assistencias || []), ...(plano.coberturas || [])]
      : (plano.coberturas || []);
    const match = row.kind === "assist" || row.kind === "benefit"
      ? matchAssistencia(source, row.cobKey || "")
      : matchCobertura(source, row.cobKey || "");

    if (!match.found) return <XCircle className="w-5 h-5 text-red-400 mx-auto" />;
    if (match.detalhe && match.detalhe.trim()) {
      return (
        <div className="flex flex-col items-center gap-0.5">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-[11px] text-gray-600 leading-tight text-center">{match.detalhe}</span>
        </div>
      );
    }
    return <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />;
  };

  // ── Loading / Error ──
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#2c3e50]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-white/40 border-t-white rounded-full animate-spin" />
        <p className="text-white text-lg">Carregando planos...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#2c3e50]">
      <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center shadow-xl">
        <Car className="w-16 h-16 text-[#2c3e50] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#2c3e50] mb-2">Cotacao nao encontrada</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    </div>
  );

  const sections: { title: string; rows: TableRow[] }[] = [
    { title: "Valores", rows: SECTION_VALORES },
    { title: "Coberturas", rows: SECTION_COBERTURAS },
    { title: "Assistencia 24H", rows: SECTION_ASSISTENCIA },
    { title: "Beneficios", rows: SECTION_BENEFICIOS },
  ];

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: "'Montserrat', 'Segoe UI', sans-serif" }}>
      {/* ══ HEADER ══ */}
      <header className="bg-[#2c3e50] text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <img src={LOGO_URL} alt="Objetivo" className="h-10 sm:h-12" />
          <a href={`tel:${PHONE_0800.replace(/\s/g, "")}`} className="flex items-center gap-2 text-sm font-semibold hover:text-green-300 transition-colors">
            <Phone className="w-4 h-4" />{PHONE_0800}
          </a>
        </div>
      </header>

      {/* ══ VEHICLE INFO BAR ══ */}
      <section className="bg-[#34495e] text-white py-6 sm:py-8 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-2">
          <p className="text-sm text-white/70">Ola, {clientName}! Veja os planos disponiveis para o seu veiculo:</p>
          <h1 className="text-xl sm:text-2xl font-bold">
            {veiculo}
          </h1>
          {fipeValue ? (
            <p className="text-lg sm:text-xl">
              Seu veiculo esta avaliado em <span className="font-extrabold text-green-400">{fmtBRL(fipeValue)}</span>
            </p>
          ) : null}
          {(cidade || estado) && (
            <p className="text-sm text-white/80">
              Cidade e estado de circulacao: <strong>{cidade}{estado ? `/${estado}` : ""}</strong>
            </p>
          )}
          <p className="text-[11px] text-white/50">* De acordo com a tabela FIPE atual</p>
        </div>
      </section>

      {/* ══ COMPARISON TABLE ══ */}
      {planos.length > 0 && (
        <section className="py-8 sm:py-10 px-2 sm:px-4">
          <div className="max-w-6xl mx-auto">
            <div className="overflow-x-auto rounded-xl shadow-lg">
              <table className="w-full border-collapse min-w-[600px]">

                {/* Plan name headers */}
                <thead>
                  <tr>
                    <th className="bg-[#2c3e50] text-white text-left px-4 py-4 text-sm font-bold w-[220px] min-w-[180px]">
                      Comparativo de Planos
                    </th>
                    {planos.map((p, i) => (
                      <th key={i} className="bg-[#2c3e50] text-white text-center px-3 py-4 min-w-[140px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-base sm:text-lg font-bold">{p.nome}</span>
                          <span className="text-green-400 text-xl sm:text-2xl font-extrabold">{fmtBRL(p.valor_mensal)}</span>
                          <span className="text-[11px] text-white/60 font-normal">/mes</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                  {/* Accept buttons row */}
                  <tr>
                    <th className="bg-[#344b5e] px-4 py-3" />
                    {planos.map((p, i) => (
                      <th key={i} className="bg-[#344b5e] px-3 py-3">
                        <a
                          href={waLink(`Ola ${consultor}, quero aceitar a proposta do plano ${p.nome} para meu veiculo ${veiculo}. Cotacao: ${id}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block w-full max-w-[180px] bg-green-500 hover:bg-green-600 text-white font-bold text-sm py-2.5 px-4 rounded-lg transition-colors shadow-md"
                        >
                          Aceitar Proposta
                        </a>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {sections.map((section, si) => (
                    <React.Fragment key={si}>
                      {/* Section header */}
                      <tr>
                        <td
                          colSpan={planos.length + 1}
                          className="px-4 py-2.5 bg-[#ecf0f1] text-[#2c3e50] text-xs font-bold uppercase tracking-wider border-t-2 border-[#bdc3c7]"
                        >
                          {section.title}
                        </td>
                      </tr>
                      {/* Rows */}
                      {section.rows.map((row, ri) => {
                        const descMap = row.kind === "check" ? COBERTURA_DESCRICOES
                          : row.kind === "assist" ? ASSISTENCIA_DESCRICOES
                          : row.kind === "benefit" ? BENEFICIO_DESCRICOES : {};
                        const desc = row.cobKey ? descMap[row.cobKey] : undefined;
                        return (
                        <tr
                          key={`${si}-${ri}`}
                          className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td className="px-4 py-3 border-t border-gray-200">
                            <div className="text-sm text-gray-700 font-medium">{row.label}</div>
                            {desc && <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">{desc}</div>}
                          </td>
                          {planos.map((p, pi) => (
                            <td
                              key={pi}
                              className="text-center px-3 py-3 border-t border-gray-200"
                            >
                              {renderCell(row, p)}
                            </td>
                          ))}
                        </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}

                  {/* Bottom accept buttons */}
                  <tr>
                    <td className="px-4 py-4 bg-white border-t-2 border-gray-300" />
                    {planos.map((p, i) => (
                      <td key={i} className="text-center px-3 py-4 bg-white border-t-2 border-gray-300">
                        <a
                          href={waLink(`Ola ${consultor}, quero aceitar a proposta do plano ${p.nome} para meu veiculo ${veiculo}. Cotacao: ${id}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block w-full max-w-[180px] bg-green-500 hover:bg-green-600 text-white font-bold text-sm py-3 px-4 rounded-lg transition-colors shadow-md"
                        >
                          Aceitar Proposta
                        </a>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ══ FOOTER - CONSULTOR ══ */}
      <footer className="bg-[#2c3e50] text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Consultor card */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center mb-6">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              {consultorAvatar ? (
                <img src={consultorAvatar} alt={consultor} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white/80">
                  {consultor.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="text-center sm:text-left">
              <p className="text-lg font-bold">{consultor}</p>
              {consultorEmail && <p className="text-sm text-white/70">{consultorEmail}</p>}
            </div>
            <a
              href={waLink(`Ola ${consultor}, tenho uma duvida sobre a cotacao do meu veiculo ${veiculo}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold text-sm py-3 px-6 rounded-lg transition-colors shadow-md"
            >
              <MessageSquare className="w-5 h-5" />
              WhatsApp do Consultor
            </a>
          </div>

          {/* Timestamp */}
          <div className="text-center border-t border-white/10 pt-4 space-y-2">
            {createdAt && (
              <p className="text-xs text-white/50">
                Cotacao criada em {fmtDate(createdAt)}. Valida por 1 dia.
              </p>
            )}
            <img src={LOGO_URL} alt="Objetivo" className="h-6 mx-auto opacity-40" />
            <p className="text-[10px] text-white/30">Objetivo Protecao Veicular — Todos os direitos reservados</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
