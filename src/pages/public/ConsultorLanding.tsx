import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase, callEdge } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  MessageSquare,
  Instagram,
  Camera,
  ChevronRight,
  ChevronLeft,
  Car,
  Shield,
  CheckCircle,
  Loader2,
  MapPin,
} from "lucide-react";

const LOGO_URL = "https://objetivoauto.com.br/wp-content/uploads/2025/11/IMG_1299.png";
const PHONE_0800 = "0800 111 3400";

function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskPlaca(raw: string): string {
  const c = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 7);
  if (c.length <= 3) return c;
  return `${c.slice(0, 3)}-${c.slice(3)}`;
}

const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
const TIPOS = ["Carro", "Moto", "Caminhao", "Van/Utilitario"];
const TIPOS_LABEL: Record<string, string> = {
  Carro: "Carro",
  Moto: "Moto",
  Caminhao: "Caminhao",
  "Van/Utilitario": "Van",
};

interface ConsultorData {
  nome: string;
  foto_capa_url: string | null;
  fotos_trabalho: string[] | null;
  bio: string | null;
  whatsapp: string | null;
  instagram: string | null;
  cooperativa: string | null;
  email: string | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function ConsultorLanding() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [consultor, setConsultor] = useState<ConsultorData | null>(null);

  // Form state - Step 1
  const [step, setStep] = useState(1);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  // Step 2
  const [tipoVeiculo, setTipoVeiculo] = useState("Carro");
  const [placa, setPlaca] = useState("");
  const [veiculo, setVeiculo] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);
  const [buscaErro, setBuscaErro] = useState("");

  // Step 3
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [taxiApp, setTaxiApp] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("usuarios" as any)
      .select("nome, foto_capa_url, fotos_trabalho, bio, whatsapp, instagram, cooperativa, email")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        setConsultor(data as ConsultorData | null);
        setLoading(false);
      });
  }, [slug]);

  // Auto-busca placa
  const buscarPlaca = async (placaVal: string) => {
    const clean = placaVal.replace(/[^A-Za-z0-9]/g, "");
    if (clean.length < 7) return;
    setBuscando(true);
    setBuscaErro("");
    try {
      const res = await callEdge("gia-buscar-placa", { acao: "placa", placa: clean });
      if (res.sucesso && res.resultado) {
        setVeiculo(res.resultado);
        const modelo = (res.resultado.modelo || "").toLowerCase();
        if (modelo.includes("moto") || res.resultado.tipo === "moto") setTipoVeiculo("Moto");
      } else {
        setBuscaErro("Placa nao encontrada. Preencha manualmente.");
      }
    } catch {
      setBuscaErro("Erro na consulta. Tente novamente.");
    }
    setBuscando(false);
  };

  const handlePlacaChange = (val: string) => {
    const masked = maskPlaca(val);
    setPlaca(masked);
    setVeiculo(null);
    setBuscaErro("");
    if (masked.replace("-", "").length === 7) buscarPlaca(masked);
  };

  const handleSubmit = async () => {
    if (!consultor) return;
    setEnviando(true);
    try {
      const { data: neg } = await supabase.from("negociacoes").insert({
        lead_nome: nome,
        telefone: telefone.replace(/\D/g, ""),
        email,
        veiculo_placa: placa.replace("-", ""),
        veiculo_modelo: veiculo ? `${veiculo.marca} ${veiculo.modelo}` : "",
        valor_plano: veiculo?.valorFipe || 0,
        stage: "novo_lead",
        consultor: consultor.nome,
        origem: "Landing Consultor",
        observacoes: taxiApp ? "Veiculo usado em taxi/aplicativo" : "",
      } as any).select().single();

      if (!neg) throw new Error("Erro ao criar negociacao");

      const vFipe = veiculo?.valorFipe || 0;
      const tipoMap: Record<string, string> = {
        Carro: "Carros e Utilitarios Pequenos",
        Moto: "Motos",
        Caminhao: "Caminhoes e Micro-Onibus",
        "Van/Utilitario": "Carros e Utilitarios Pequenos",
      };
      // Buscar regional pela cidade/estado
      const { data: regMatch } = await supabase.from("uf_regional_precos" as any)
        .select("regional_precos").eq("uf", estado).ilike("cidade", cidade || "___NONE___").limit(1).maybeSingle();
      const { data: regDefault } = !regMatch ? await supabase.from("uf_regional_precos" as any)
        .select("regional_precos").eq("uf", estado).is("cidade", null).limit(1).maybeSingle() : { data: null };
      const regionalPrecos = (regMatch as any)?.regional_precos || (regDefault as any)?.regional_precos || "";

      let precosQ = supabase.from("tabela_precos" as any)
        .select("*")
        .lte("valor_menor", vFipe)
        .gte("valor_maior", vFipe)
        .eq("tipo_veiculo", tipoMap[tipoVeiculo] || "Carros e Utilitarios Pequenos")
        .order("plano_normalizado");
      if (regionalPrecos) precosQ = precosQ.eq("regional_normalizado", regionalPrecos);

      const { data: precos } = await precosQ;

      const planos = (precos || []).map((p: any) => ({
        nome: p.plano_normalizado || p.plano,
        valor_mensal: Number(p.cota),
        adesao: Number(p.adesao || 0),
        rastreador: p.rastreador,
        franquia: p.valor_franquia ? `R$ ${p.valor_franquia}` : "",
        valor_fipe: vFipe,
      }));

      const { data: cot } = await supabase.from("cotacoes").insert({
        negociacao_id: (neg as any).id,
        todos_planos: planos.length > 0 ? planos : [{ nome: "Consultar", valor_mensal: 0 }],
        desconto_aplicado: 0,
        cidade_circulacao: cidade,
        estado_circulacao: estado,
        regional_precos: regionalPrecos,
      } as any).select().single();

      if (cot) {
        navigate(`/planos/${(cot as any).id}`);
      } else {
        setConcluido(true);
      }
    } catch (err) {
      console.error(err);
      setConcluido(true);
    }
    setEnviando(false);
  };

  const canStep2 = nome.trim().length >= 3 && telefone.replace(/\D/g, "").length >= 10;
  const canStep3 = placa.replace("-", "").length >= 7;
  const canSubmit = estado.length > 0 && cidade.trim().length > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#002b5e]">
        <Loader2 className="w-8 h-8 animate-spin text-[#7ed6f1]" />
      </div>
    );
  }

  if (!consultor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#002b5e] text-white gap-4">
        <Shield className="w-16 h-16 text-[#7ed6f1]" />
        <h1 className="text-2xl font-bold">Consultor nao encontrado</h1>
        <p className="text-white/60 text-sm">Verifique o link e tente novamente.</p>
      </div>
    );
  }

  const initials = getInitials(consultor.nome);
  const hasGallery = consultor.fotos_trabalho && consultor.fotos_trabalho.length > 0;
  const whatsappClean = consultor.whatsapp ? consultor.whatsapp.replace(/\D/g, "") : null;

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#002b5e] via-[#003572] to-[#004a9e]"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      {/* Header */}
      <header className="bg-[#001a38] border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <img src={LOGO_URL} alt="Objetivo Auto" className="h-9" />
          <a
            href={`tel:${PHONE_0800.replace(/\s/g, "")}`}
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-semibold transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            {PHONE_0800}
          </a>
        </div>
      </header>

      {/* Hero */}
      <div className="relative w-full max-w-lg mx-auto">
        {consultor.foto_capa_url ? (
          <div className="relative h-[300px] w-full overflow-hidden">
            <img
              src={consultor.foto_capa_url}
              alt={consultor.nome}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#002b5e] via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                {consultor.nome}
              </h1>
              <p className="text-[#7ed6f1] text-sm font-semibold drop-shadow">
                Consultor(a) Objetivo
                {consultor.cooperativa && (
                  <span className="text-white/60"> &bull; {consultor.cooperativa}</span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative h-[300px] w-full bg-gradient-to-br from-[#003572] to-[#002b5e] flex flex-col items-center justify-center gap-4">
            <div className="w-24 h-24 rounded-full bg-[#7ed6f1]/20 border-2 border-[#7ed6f1]/40 flex items-center justify-center">
              <span className="text-4xl font-bold text-[#7ed6f1]">{initials}</span>
            </div>
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{consultor.nome}</h1>
              <p className="text-[#7ed6f1] text-sm font-semibold">
                Consultor(a) Objetivo
                {consultor.cooperativa && (
                  <span className="text-white/60"> &bull; {consultor.cooperativa}</span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bio + Social buttons */}
      <div className="max-w-lg mx-auto px-4 pt-6 pb-4 space-y-4">
        {consultor.bio && (
          <p className="text-white/80 text-sm italic leading-relaxed text-center">
            &ldquo;{consultor.bio}&rdquo;
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          {whatsappClean && (
            <a
              href={`https://wa.me/${whatsappClean.length <= 11 ? "55" : ""}${whatsappClean}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#2ecc71] hover:bg-[#27ae60] text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors shadow-lg"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </a>
          )}
          {consultor.instagram && (
            <a
              href={`https://instagram.com/${consultor.instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors border border-white/20"
            >
              <Instagram className="w-4 h-4" />
              Instagram
            </a>
          )}
        </div>
      </div>

      {/* Gallery */}
      {hasGallery && (
        <div className="max-w-lg mx-auto px-4 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="w-4 h-4 text-[#7ed6f1]" />
            <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">
              Galeria
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(consultor.fotos_trabalho || []).slice(0, 6).map((url, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-white/5">
                <img
                  src={url}
                  alt={`Trabalho ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section divider */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#7ed6f1]/30" />
          <span className="text-[#7ed6f1] text-sm font-bold uppercase tracking-wider">
            Faca sua Cotacao
          </span>
          <div className="flex-1 h-px bg-[#7ed6f1]/30" />
        </div>
      </div>

      {/* Completed state */}
      {concluido ? (
        <div className="text-center py-16 px-4">
          <CheckCircle className="w-16 h-16 text-[#2ecc71] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Cotacao recebida!</h2>
          <p className="text-white/80">
            Em breve {consultor.nome} entrara em contato pelo WhatsApp.
          </p>
        </div>
      ) : (
        <>
          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 px-4 pb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step === s
                      ? "bg-[#2ecc71] text-white scale-110"
                      : step > s
                      ? "bg-[#2ecc71]/30 text-white"
                      : "bg-white/20 text-white/50"
                  }`}
                >
                  {step > s ? "\u2713" : s}
                </div>
                {s < 3 && (
                  <div className={`w-8 h-0.5 ${step > s ? "bg-[#2ecc71]/50" : "bg-white/20"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Form card */}
          <div className="max-w-md mx-auto px-4 pb-10">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8">
              {/* STEP 1: Dados pessoais */}
              {step === 1 && (
                <div className="space-y-5">
                  <h3 className="text-lg font-bold text-[#002b5e]">Seus dados</h3>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#002b5e]">Meu nome e:</label>
                    <input
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#177ef3] focus:outline-none transition-colors"
                      placeholder="Nome completo"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#002b5e]">
                      Informe seu e-mail:
                    </label>
                    <input
                      type="email"
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#177ef3] focus:outline-none transition-colors"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#002b5e]">
                      Informe seu WhatsApp:
                    </label>
                    <input
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#177ef3] focus:outline-none transition-colors"
                      placeholder="(11) 99999-9999"
                      value={telefone}
                      onChange={(e) => setTelefone(maskPhone(e.target.value))}
                    />
                  </div>

                  <button
                    disabled={!canStep2}
                    onClick={() => setStep(2)}
                    className={`w-full py-3.5 rounded-lg font-bold text-white text-sm flex items-center justify-center gap-2 transition-all ${
                      canStep2
                        ? "bg-[#2ecc71] hover:bg-[#27ae60] shadow-lg hover:shadow-xl"
                        : "bg-gray-300 cursor-not-allowed"
                    }`}
                  >
                    Proximo passo <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: Veiculo */}
              {step === 2 && (
                <div className="space-y-5">
                  <h3 className="text-lg font-bold text-[#002b5e]">Seu veiculo</h3>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#002b5e]">
                      Tipo de veiculo:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {TIPOS.map((t) => (
                        <button
                          key={t}
                          onClick={() => setTipoVeiculo(t)}
                          className={`py-2.5 rounded-lg text-xs font-semibold transition-all border-2 ${
                            tipoVeiculo === t
                              ? "border-[#177ef3] bg-[#177ef3]/10 text-[#177ef3]"
                              : "border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          {TIPOS_LABEL[t] || t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#002b5e]">
                      Placa do veiculo:
                    </label>
                    <div className="relative">
                      <input
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm font-mono uppercase focus:border-[#177ef3] focus:outline-none transition-colors"
                        placeholder="ABC-1D23"
                        value={placa}
                        onChange={(e) => handlePlacaChange(e.target.value)}
                      />
                      {buscando && (
                        <Loader2 className="absolute right-3 top-3.5 w-4 h-4 animate-spin text-[#177ef3]" />
                      )}
                    </div>
                  </div>

                  {veiculo && (
                    <div className="bg-[#002b5e]/5 rounded-lg p-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <Car className="w-5 h-5 text-[#177ef3]" />
                        <span className="font-bold text-[#002b5e] text-sm">
                          {veiculo.marca} {veiculo.modelo}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {veiculo.anoFabricacao}/{veiculo.anoModelo} &bull; {veiculo.cor} &bull;{" "}
                        {veiculo.combustivel}
                      </p>
                      {veiculo.valorFipe > 0 && (
                        <p className="text-xs font-semibold text-[#2ecc71]">
                          FIPE: R${" "}
                          {Number(veiculo.valorFipe).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      )}
                    </div>
                  )}
                  {buscaErro && <p className="text-xs text-red-500">{buscaErro}</p>}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 rounded-lg font-semibold text-sm text-gray-500 border-2 border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Voltar
                    </button>
                    <button
                      disabled={!canStep3}
                      onClick={() => setStep(3)}
                      className={`flex-1 py-3 rounded-lg font-bold text-white text-sm flex items-center justify-center gap-2 transition-all ${
                        canStep3
                          ? "bg-[#2ecc71] hover:bg-[#27ae60] shadow-lg"
                          : "bg-gray-300 cursor-not-allowed"
                      }`}
                    >
                      Proximo passo <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Localizacao */}
              {step === 3 && (
                <div className="space-y-5">
                  <h3 className="text-lg font-bold text-[#002b5e]">Localizacao</h3>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#002b5e]">
                      Moro no Estado:
                    </label>
                    <select
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#177ef3] focus:outline-none bg-white"
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {UFS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#002b5e]">Na cidade:</label>
                    <input
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#177ef3] focus:outline-none transition-colors"
                      placeholder="Sua cidade"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                    />
                  </div>

                  <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={taxiApp}
                      onChange={(e) => setTaxiApp(e.target.checked)}
                      className="w-5 h-5 rounded accent-[#177ef3]"
                    />
                    <span className="text-sm text-gray-700">
                      Voce usa o seu veiculo em Taxi ou Aplicativo?
                    </span>
                  </label>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-3 rounded-lg font-semibold text-sm text-gray-500 border-2 border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Voltar
                    </button>
                    <button
                      disabled={!canSubmit || enviando}
                      onClick={handleSubmit}
                      className={`flex-1 py-3.5 rounded-lg font-bold text-white text-sm flex items-center justify-center gap-2 transition-all ${
                        canSubmit && !enviando
                          ? "bg-[#2ecc71] hover:bg-[#27ae60] shadow-lg hover:shadow-xl"
                          : "bg-gray-300 cursor-not-allowed"
                      }`}
                    >
                      {enviando ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Gerando...
                        </>
                      ) : (
                        "Receber Cotacao"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              {[
                { icon: Shield, text: "Sem analise de perfil" },
                { icon: CheckCircle, text: "Cobertura completa" },
                { icon: Phone, text: "Assistencia 24h" },
                { icon: Car, text: "100% Tabela FIPE" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2.5">
                  <item.icon className="w-4 h-4 text-[#7ed6f1] flex-shrink-0" />
                  <span className="text-xs text-white font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="bg-[#001a38] border-t border-white/10 py-6 px-4">
        <div className="max-w-lg mx-auto text-center space-y-3">
          <img src={LOGO_URL} alt="Objetivo" className="h-7 mx-auto opacity-60" />
          <p className="text-white/40 text-xs">CNPJ: 58.506.161/0001-31</p>
          <div className="flex justify-center gap-4">
            <a
              href={`tel:${PHONE_0800.replace(/\s/g, "")}`}
              className="text-white/50 hover:text-white text-xs flex items-center gap-1"
            >
              <Phone className="w-3 h-3" />
              {PHONE_0800}
            </a>
            {whatsappClean && (
              <a
                href={`https://wa.me/${whatsappClean.length <= 11 ? "55" : ""}${whatsappClean}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white text-xs flex items-center gap-1"
              >
                <MessageSquare className="w-3 h-3" />
                WhatsApp
              </a>
            )}
          </div>
          <p className="text-white/30 text-[10px]">
            Objetivo Protecao Veicular — Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}
