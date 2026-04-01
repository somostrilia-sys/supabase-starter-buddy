import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, callEdge } from "@/integrations/supabase/client";
import { CheckCircle, Loader2, ChevronRight, ChevronLeft, Car, Shield, Phone, MessageSquare } from "lucide-react";

const LOGO_URL = "https://objetivoauto.com.br/wp-content/uploads/2025/11/IMG_1299.png";
const PHONE_0800 = "0800 111 3400";
const WHATSAPP = "5511915395063";

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
const TIPOS = ["Carro", "Moto", "Caminhão", "Van/Utilitário"];

export default function CotacaoFormPublica() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1
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
        // Auto-detectar tipo
        const modelo = (res.resultado.modelo || "").toLowerCase();
        if (modelo.includes("moto") || res.resultado.tipo === "moto") setTipoVeiculo("Moto");
      } else {
        setBuscaErro("Placa não encontrada. Preencha manualmente.");
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
    setEnviando(true);
    try {
      // Criar negociação
      const { data: neg } = await supabase.from("negociacoes").insert({
        lead_nome: nome,
        telefone: telefone.replace(/\D/g, ""),
        email,
        veiculo_placa: placa.replace("-", ""),
        veiculo_modelo: veiculo ? `${veiculo.marca} ${veiculo.modelo}` : "",
        valor_plano: veiculo?.valorFipe || 0,
        stage: "novo_lead",
        origem: "Site Objetivo",
        observacoes: taxiApp ? "Veículo usado em táxi/aplicativo" : "",
      } as any).select().single();

      if (!neg) throw new Error("Erro ao criar negociação");

      // Buscar preços
      const vFipe = veiculo?.valorFipe || 0;
      const tipoMap: Record<string, string> = {
        "Carro": "Carros e Utilitários Pequenos",
        "Moto": "Motos",
        "Caminhão": "Caminhões e Micro-Ônibus",
        "Van/Utilitário": "Carros e Utilitários Pequenos",
      };
      const { data: precos } = await supabase.from("tabela_precos" as any)
        .select("*")
        .lte("valor_menor", vFipe)
        .gte("valor_maior", vFipe)
        .eq("tipo_veiculo", tipoMap[tipoVeiculo] || "Carros e Utilitários Pequenos")
        .order("plano_normalizado");

      const planos = (precos || []).map((p: any) => ({
        nome: p.plano_normalizado || p.plano,
        valor_mensal: Number(p.cota),
        adesao: Number(p.adesao || 0),
        rastreador: p.rastreador,
        franquia: p.valor_franquia ? `R$ ${p.valor_franquia}` : "",
        valor_fipe: vFipe,
      }));

      // Criar cotação
      const { data: cot } = await supabase.from("cotacoes").insert({
        negociacao_id: (neg as any).id,
        todos_planos: planos.length > 0 ? planos : [{ nome: "Consultar", valor_mensal: 0 }],
        desconto_aplicado: 0,
      } as any).select().single();

      if (cot) {
        navigate(`/cotacao/${(cot as any).id}`);
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
  const canSubmit = estado.length > 0;

  if (concluido) {
    return (
      <Page>
        <div className="text-center py-20 px-4">
          <CheckCircle className="w-16 h-16 text-[#2ecc71] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Cotação recebida!</h2>
          <p className="text-white/80">Em breve um consultor entrará em contato pelo WhatsApp.</p>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      {/* Hero text */}
      <div className="text-center pt-8 pb-4 px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Proteção Veicular</h1>
        <h2 className="text-xl sm:text-2xl font-bold text-[#7ed6f1]">com Tecnologia</h2>
        <p className="text-white/70 mt-2 text-sm">Faça sua cotação em segundos</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 px-4 pb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step === s ? "bg-[#2ecc71] text-white scale-110" : step > s ? "bg-[#2ecc71]/30 text-white" : "bg-white/20 text-white/50"
            }`}>{step > s ? "✓" : s}</div>
            {s < 3 && <div className={`w-8 h-0.5 ${step > s ? "bg-[#2ecc71]/50" : "bg-white/20"}`} />}
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
                <label className="text-sm font-semibold text-[#002b5e]">Meu nome é:</label>
                <input
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#177ef3] focus:outline-none transition-colors"
                  placeholder="Nome completo"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#002b5e]">Informe seu e-mail:</label>
                <input
                  type="email"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#177ef3] focus:outline-none transition-colors"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#002b5e]">Informe seu WhatsApp:</label>
                <input
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#177ef3] focus:outline-none transition-colors"
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={e => setTelefone(maskPhone(e.target.value))}
                />
              </div>

              <button
                disabled={!canStep2}
                onClick={() => setStep(2)}
                className={`w-full py-3.5 rounded-lg font-bold text-white text-sm flex items-center justify-center gap-2 transition-all ${
                  canStep2 ? "bg-[#2ecc71] hover:bg-[#27ae60] shadow-lg hover:shadow-xl" : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                Próximo passo <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Veículo */}
          {step === 2 && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-[#002b5e]">Seu veículo</h3>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#002b5e]">Tipo de veículo:</label>
                <div className="grid grid-cols-4 gap-2">
                  {TIPOS.map(t => (
                    <button
                      key={t}
                      onClick={() => setTipoVeiculo(t)}
                      className={`py-2.5 rounded-lg text-xs font-semibold transition-all border-2 ${
                        tipoVeiculo === t
                          ? "border-[#177ef3] bg-[#177ef3]/10 text-[#177ef3]"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#002b5e]">Placa do veículo:</label>
                <div className="relative">
                  <input
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm font-mono uppercase focus:border-[#177ef3] focus:outline-none transition-colors"
                    placeholder="ABC-1D23"
                    value={placa}
                    onChange={e => handlePlacaChange(e.target.value)}
                  />
                  {buscando && <Loader2 className="absolute right-3 top-3.5 w-4 h-4 animate-spin text-[#177ef3]" />}
                </div>
              </div>

              {/* Resultado da busca */}
              {veiculo && (
                <div className="bg-[#002b5e]/5 rounded-lg p-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-[#177ef3]" />
                    <span className="font-bold text-[#002b5e] text-sm">{veiculo.marca} {veiculo.modelo}</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {veiculo.anoFabricacao}/{veiculo.anoModelo} • {veiculo.cor} • {veiculo.combustivel}
                  </p>
                  {veiculo.valorFipe > 0 && (
                    <p className="text-xs font-semibold text-[#2ecc71]">
                      FIPE: R$ {Number(veiculo.valorFipe).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
                    canStep3 ? "bg-[#2ecc71] hover:bg-[#27ae60] shadow-lg" : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  Próximo passo <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Localização */}
          {step === 3 && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-[#002b5e]">Localização</h3>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#002b5e]">Moro no Estado:</label>
                <select
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#177ef3] focus:outline-none bg-white"
                  value={estado}
                  onChange={e => setEstado(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {UFS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#002b5e]">Na cidade:</label>
                <input
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#177ef3] focus:outline-none transition-colors"
                  placeholder="Sua cidade"
                  value={cidade}
                  onChange={e => setCidade(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={taxiApp}
                  onChange={e => setTaxiApp(e.target.checked)}
                  className="w-5 h-5 rounded accent-[#177ef3]"
                />
                <span className="text-sm text-gray-700">Você usa o seu veículo em Táxi ou Aplicativo?</span>
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
                    canSubmit && !enviando ? "bg-[#2ecc71] hover:bg-[#27ae60] shadow-lg hover:shadow-xl" : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  {enviando ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</> : "Receber Cotação"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {[
            { icon: Shield, text: "Sem análise de perfil" },
            { icon: CheckCircle, text: "Cobertura completa" },
            { icon: Phone, text: "Assistência 24h" },
            { icon: Car, text: "100% Tabela FIPE" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2.5">
              <item.icon className="w-4 h-4 text-[#7ed6f1] flex-shrink-0" />
              <span className="text-xs text-white font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}

// Layout wrapper
function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002b5e] via-[#003572] to-[#004a9e]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Header */}
      <header className="bg-[#001a38] border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <img src={LOGO_URL} alt="Objetivo Auto" className="h-9" />
          <a href={`tel:${PHONE_0800.replace(/\s/g, "")}`} className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-semibold transition-colors">
            <Phone className="w-3.5 h-3.5" />
            {PHONE_0800}
          </a>
        </div>
      </header>

      {children}

      {/* Footer */}
      <footer className="bg-[#001a38] border-t border-white/10 py-6 px-4">
        <div className="max-w-lg mx-auto text-center space-y-3">
          <img src={LOGO_URL} alt="Objetivo" className="h-7 mx-auto opacity-60" />
          <p className="text-white/40 text-xs">CNPJ: 58.506.161/0001-31</p>
          <div className="flex justify-center gap-4">
            <a href={`tel:${PHONE_0800.replace(/\s/g, "")}`} className="text-white/50 hover:text-white text-xs flex items-center gap-1">
              <Phone className="w-3 h-3" />{PHONE_0800}
            </a>
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white text-xs flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />WhatsApp
            </a>
          </div>
          <p className="text-white/30 text-[10px]">Objetivo Proteção Veicular — Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
}
