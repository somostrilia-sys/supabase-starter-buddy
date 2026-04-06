import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase, callEdge } from "@/integrations/supabase/client";
import {
  Phone, MessageSquare, Instagram, Camera, ChevronRight, ChevronLeft,
  Car, Shield, CheckCircle, Loader2, MapPin, Star, Zap, ChevronDown,
  Clock, Users, Wrench, FileText, Smartphone, Heart,
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
const TIPOS_LABEL: Record<string, string> = { Carro: "Carro", Moto: "Moto", Caminhao: "Caminhão", "Van/Utilitario": "Van" };

interface ConsultorData {
  nome: string;
  foto_capa_url: string | null;
  fotos_trabalho: string[] | null;
  fotos_fundo: string[] | null;
  bio: string | null;
  whatsapp: string | null;
  instagram: string | null;
  funcao: string | null;
  cooperativa: string | null;
  email: string | null;
  frase_destaque: string | null;
}

function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

/* ─── Inject global styles ─── */
const STYLE_ID = "cl-styles-v2";
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
    @keyframes cl-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
    @keyframes cl-fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
    @keyframes cl-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(126,214,241,0.4)} 50%{box-shadow:0 0 0 12px rgba(126,214,241,0)} }
    .cl-float { animation: cl-float 4s ease-in-out infinite; }
    .cl-fadeUp { animation: cl-fadeUp 0.7s ease-out both; }
    .cl-fadeUp-1 { animation: cl-fadeUp 0.7s ease-out 0.15s both; }
    .cl-fadeUp-2 { animation: cl-fadeUp 0.7s ease-out 0.3s both; }
    .cl-fadeUp-3 { animation: cl-fadeUp 0.7s ease-out 0.45s both; }
    .cl-pulse { animation: cl-pulse 2s ease-in-out infinite; }
    .cl-section-blue { background: linear-gradient(90deg, #002b5e 0%, #003572 50%, #003b7d 100%); }
    .cl-section-white { background: #ffffff; }
    .cl-card-glass { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 15px; padding: 30px; transition: all 0.3s ease; }
    .cl-card-glass:hover { background: rgba(255,255,255,0.08); border-color: rgba(126,214,241,0.3); transform: translateY(-5px); }
    .cl-form-card { background: #fff; padding: 35px; border-top: 5px solid #003572; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,43,94,0.25); }
    .cl-input { width:100%; border:1.5px solid #ddd; border-radius:8px; padding:12px 16px; font-size:14px; font-family:'Montserrat',sans-serif; transition:all 0.3s; outline:none; background:#fff; color:#333; }
    .cl-input:focus { border-color:#7ed6f1; box-shadow:0 0 0 3px rgba(126,214,241,0.15); }
    .cl-input::placeholder { color:#999; }
    .cl-select { width:100%; border:1.5px solid #ddd; border-radius:8px; padding:12px 16px; font-size:14px; font-family:'Montserrat',sans-serif; transition:all 0.3s; outline:none; background:#fff; color:#333; appearance:auto; }
    .cl-select:focus { border-color:#7ed6f1; box-shadow:0 0 0 3px rgba(126,214,241,0.15); }
    .cl-btn-cta { display:inline-flex; align-items:center; justify-content:center; gap:8px; background:#fff; color:#002b5e; padding:14px 40px; border-radius:50px; font-weight:800; font-size:14px; border:none; cursor:pointer; font-family:'Montserrat',sans-serif; transition:all 0.3s; text-transform:uppercase; letter-spacing:1px; }
    .cl-btn-cta:hover { background:#7ed6f1; color:#002b5e; transform:translateY(-3px); box-shadow:0 8px 25px rgba(0,0,0,0.2); }
    .cl-btn-green { display:flex; align-items:center; justify-content:center; gap:8px; background:linear-gradient(135deg,#2ecc71,#27ae60); color:#fff; padding:14px; border-radius:8px; font-weight:700; font-size:14px; border:none; cursor:pointer; font-family:'Montserrat',sans-serif; transition:all 0.3s; width:100%; box-shadow:0 4px 15px rgba(46,204,113,0.3); }
    .cl-btn-green:hover:not(:disabled) { box-shadow:0 6px 25px rgba(46,204,113,0.5); transform:translateY(-2px); }
    .cl-btn-green:disabled { background:#ccc; box-shadow:none; cursor:not-allowed; }
    .cl-btn-back { flex:1; padding:12px; border-radius:8px; font-weight:600; font-size:14px; color:#666; display:flex; align-items:center; justify-content:center; gap:4px; border:2px solid #e5e7eb; background:#fff; cursor:pointer; font-family:'Montserrat',sans-serif; transition:all 0.2s; }
    .cl-btn-back:hover { background:#f5f5f5; }
    .cl-cover-strip { position:absolute; top:0; height:100%; object-fit:cover; }
    .cl-faq-item { border:1px solid #e0e0e0; border-radius:10px; overflow:hidden; transition:all 0.3s; }
    .cl-faq-item.active { border-color:#7ed6f1; background:rgba(126,214,241,0.05); }
    .cl-faq-q { display:flex; justify-content:space-between; align-items:center; padding:18px 20px; cursor:pointer; font-weight:600; font-size:15px; color:#002b5e; }
    .cl-faq-a { max-height:0; overflow:hidden; transition:max-height 0.4s ease, padding 0.3s; padding:0 20px; }
    .cl-faq-item.active .cl-faq-a { max-height:300px; padding:0 20px 18px; }
    .cl-faq-item.active .cl-faq-icon { transform:rotate(180deg); }
    .cl-faq-icon { transition:transform 0.3s; }
    .cl-heading-bar { position:relative; padding-left:20px; }
    .cl-heading-bar::before { content:''; position:absolute; left:0; top:0; width:4px; height:100%; background:#7ed6f1; border-radius:2px; }
  `;
  document.head.appendChild(s);
}

export default function ConsultorLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [consultor, setConsultor] = useState<ConsultorData | null>(null);

  const [step, setStep] = useState(1);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipoVeiculo, setTipoVeiculo] = useState("Carro");
  const [placa, setPlaca] = useState("");
  const [veiculo, setVeiculo] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);
  const [buscaErro, setBuscaErro] = useState("");
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [taxiApp, setTaxiApp] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [cidadesOptions, setCidadesOptions] = useState<string[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    if (!estado) { setCidadesOptions([]); setCidade(""); return; }
    supabase.from("municipios" as any).select("nome").eq("uf", estado).order("nome")
      .then(({ data }) => setCidadesOptions((data || []).map((d: any) => d.nome)));
    setCidade("");
  }, [estado]);

  useEffect(() => {
    if (!slug) return;
    supabase.from("usuarios" as any)
      .select("nome, foto_capa_url, fotos_trabalho, fotos_fundo, bio, whatsapp, instagram, funcao, cooperativa, email, frase_destaque")
      .eq("slug", slug).maybeSingle()
      .then(({ data }) => { setConsultor(data as ConsultorData | null); setLoading(false); });
  }, [slug]);

  const buscarPlaca = async (placaVal: string) => {
    const clean = placaVal.replace(/[^A-Za-z0-9]/g, "");
    if (clean.length < 7) return;
    setBuscando(true); setBuscaErro("");
    try {
      const res = await callEdge("gia-buscar-placa", { acao: "placa", placa: clean });
      if (res.sucesso && res.resultado) {
        setVeiculo(res.resultado);
        const modelo = (res.resultado.modelo || "").toLowerCase();
        if (modelo.includes("moto") || res.resultado.tipo === "moto") setTipoVeiculo("Moto");
      } else { setBuscaErro("Placa não encontrada. Preencha manualmente."); }
    } catch { setBuscaErro("Erro na consulta. Tente novamente."); }
    setBuscando(false);
  };

  const handlePlacaChange = (val: string) => {
    const masked = maskPlaca(val); setPlaca(masked); setVeiculo(null); setBuscaErro("");
    if (masked.replace("-", "").length === 7) buscarPlaca(masked);
  };

  const handleSubmit = async () => {
    if (!consultor) return;
    setEnviando(true);
    try {
      // Edge function pipeline (non-blocking)
      try {
        await callEdge("gia-consultor-page", {
          acao: "capturar_lead_cotacao", slug,
          dados: { nome, telefone: telefone.replace(/\D/g, ""), email, veiculo: veiculo ? `${veiculo.marca} ${veiculo.modelo}` : "", estado, cidade_circulacao: cidade },
        });
      } catch { /* fallback below */ }

      const negPayload: Record<string, unknown> = {
        lead_nome: nome, telefone: telefone.replace(/\D/g, ""), email,
        veiculo_placa: placa.replace("-", ""),
        veiculo_modelo: veiculo ? `${veiculo.marca} ${veiculo.modelo}` : "",
        valor_plano: veiculo?.valorFipe || 0, stage: "novo_lead",
        consultor: consultor.nome, origem: refCode ? "Afiliado" : "Landing Consultor",
        observacoes: taxiApp ? "Veículo usado em táxi/aplicativo" : "",
      };
      if (refCode) negPayload.afiliado_codigo = refCode;
      const { data: neg } = await supabase.from("negociacoes").insert(negPayload as any).select().single();

      // Vincular indicação ao afiliado
      if (refCode && neg) {
        try {
          const { data: afData } = await (supabase as any)
            .from("afiliados").select("id, comissao_valor").eq("codigo", refCode).eq("ativo", true).maybeSingle();
          if (afData) {
            const { error: indErr } = await (supabase as any).from("afiliado_indicacoes").insert({
              afiliado_id: afData.id, negociacao_id: (neg as any).id,
              lead_nome: nome, lead_telefone: telefone.replace(/\D/g, ""),
              lead_email: email || null,
              status: "novo", comissao_valor: afData.comissao_valor,
            });
            if (!indErr) {
              await (supabase as any).rpc("increment_afiliado_leads", { af_id: afData.id });
            }
          }
        } catch { /* não bloqueia o fluxo principal */ }
      }

      if (!neg) throw new Error("Erro ao criar negociação");

      const vFipe = veiculo?.valorFipe || 0;
      const tipoMap: Record<string, string> = { Carro: "Carros e Utilitários Pequenos", Moto: "Motos", Caminhao: "Caminhões e Micro-Ônibus", "Van/Utilitario": "Carros e Utilitários Pequenos" };
      const { data: regMatch } = await supabase.from("uf_regional_precos" as any).select("regional_precos").eq("uf", estado).ilike("cidade", cidade || "___NONE___").limit(1).maybeSingle();
      const { data: regDefault } = !regMatch ? await supabase.from("uf_regional_precos" as any).select("regional_precos").eq("uf", estado).is("cidade", null).limit(1).maybeSingle() : { data: null };
      const regionalPrecos = (regMatch as any)?.regional_precos || (regDefault as any)?.regional_precos || "";
      let precosQ = supabase.from("tabela_precos" as any).select("*").lte("valor_menor", vFipe).gte("valor_maior", vFipe).eq("tipo_veiculo", tipoMap[tipoVeiculo] || "Carros e Utilitários Pequenos").order("plano_normalizado");
      if (regionalPrecos) precosQ = precosQ.eq("regional_normalizado", regionalPrecos);
      const { data: precos } = await precosQ;
      const planos = (precos || []).map((p: any) => ({ nome: p.plano_normalizado || p.plano, valor_mensal: Number(p.cota), adesao: Number(p.adesao || 0), rastreador: p.rastreador, franquia: p.valor_franquia ? `R$ ${p.valor_franquia}` : "", valor_fipe: vFipe }));
      const { data: cot } = await supabase.from("cotacoes").insert({ negociacao_id: (neg as any).id, todos_planos: planos.length > 0 ? planos : [{ nome: "Consultar", valor_mensal: 0 }], desconto_aplicado: 0, cidade_circulacao: cidade, estado_circulacao: estado, regional_precos: regionalPrecos } as any).select().single();
      if (cot) { navigate(`/planos/${(cot as any).id}`); } else { setConcluido(true); }
    } catch (err) { console.error(err); setConcluido(true); }
    setEnviando(false);
  };

  const canStep2 = nome.trim().length >= 3 && telefone.replace(/\D/g, "").length >= 10;
  const canStep3 = placa.replace("-", "").length >= 7;
  const canSubmit = estado.length > 0 && cidade.trim().length > 0;

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#002b5e" }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#7ed6f1" }} />
    </div>
  );

  if (!consultor) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#002b5e", color: "#fff", gap: 16 }}>
      <Shield style={{ width: 64, height: 64, color: "#7ed6f1" }} />
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Consultor não encontrado</h1>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Verifique o link e tente novamente.</p>
    </div>
  );

  const initials = getInitials(consultor.nome);
  const hasGallery = consultor.fotos_trabalho && consultor.fotos_trabalho.length > 0;
  const whatsappClean = consultor.whatsapp ? consultor.whatsapp.replace(/\D/g, "") : null;
  const heroFotos = (consultor.fotos_fundo || []).filter(Boolean).slice(0, 4);
  const frase = consultor.frase_destaque || null;
  const waLink = whatsappClean ? `https://wa.me/${whatsappClean.length <= 11 ? "55" : ""}${whatsappClean}` : null;

  // Mapear funcao do banco pra label simplificado
  const funcaoRaw = (consultor.funcao || "").toLowerCase();
  const cargoLabel = funcaoRaw.includes("diretor") ? "Diretor(a)" : funcaoRaw.includes("gestor") || funcaoRaw.includes("gerente") || funcaoRaw.includes("administrador") ? "Gestor(a)" : "Consultor(a)";

  const faqs = [
    { q: "Qual a diferença entre Proteção Veicular e Seguro?", a: "A proteção veicular é oferecida por associações e cooperativas, com custos mais acessíveis e sem análise de perfil. Diferente do seguro tradicional, não há recusa por idade do veículo ou perfil do condutor." },
    { q: "Precisa de análise de crédito ou perfil?", a: "Não! Sem consulta ao SPC/Serasa. Qualquer pessoa pode aderir, independente de restrições cadastrais." },
    { q: "A cobertura é 100% da Tabela FIPE?", a: "Sim, em caso de perda total, roubo ou furto, o valor de indenização é 100% da Tabela FIPE vigente." },
    { q: "Como funciona a assistência 24h?", a: "Você conta com guincho, chaveiro, troca de pneus e socorro mecânico 24 horas por dia, em todo o território nacional." },
  ];

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", overflowX: "hidden" }}>

      {/* ══════════ HEADER ══════════ */}
      <header style={{ background: "#001a38", borderBottom: "1px solid rgba(255,255,255,0.1)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <img src={LOGO_URL} alt="Objetivo Auto" style={{ height: 38 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a href={`tel:${PHONE_0800.replace(/\s/g, "")}`} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
              <Phone style={{ width: 14, height: 14 }} /> {PHONE_0800}
            </a>
            <button onClick={scrollToForm} className="cl-btn-cta cl-pulse" style={{ padding: "10px 28px", fontSize: 12 }}>
              Fazer Cotação
            </button>
          </div>
        </div>
      </header>

      {/* ══════════ HERO: COVER + TEXT + AVATAR ══════════ */}
      <section className="cl-section-blue" style={{ position: "relative", overflow: "hidden", minHeight: 480 }}>
        {/* 4 vertical photos behind everything */}
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          {[0, 1, 2, 3].map((idx) => {
            const photo = heroFotos[idx] || null;
            return photo ? (
              <img key={idx} src={photo} alt="" style={{ width: "25%", height: "100%", objectFit: "cover", opacity: 0.5, filter: "brightness(0.6)" }} />
            ) : (
              <div key={idx} style={{ width: "25%", height: "100%", background: idx % 2 === 0 ? "rgba(0,53,114,0.5)" : "rgba(0,43,94,0.3)" }} />
            );
          })}
        </div>
        {/* Overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,43,94,0.6) 0%, rgba(0,43,94,0.85) 60%, #002b5e 100%)" }} />

        <div style={{ position: "relative", zIndex: 10, maxWidth: 1200, margin: "0 auto", padding: "80px 20px 60px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 40 }}>
          {/* Left: Text */}
          <div style={{ flex: "1 1 400px" }} className="cl-fadeUp">
            <span style={{ display: "inline-block", textTransform: "uppercase", color: "#7ed6f1", fontSize: 13, fontWeight: 700, letterSpacing: 3, marginBottom: 12 }}>
              {cargoLabel} Objetivo
            </span>
            <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 16 }}>
              {consultor.nome}
            </h1>
            {frase && (
              <p style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)", color: "rgba(255,255,255,0.85)", lineHeight: 1.7, marginBottom: 24, fontStyle: "italic", maxWidth: 500 }}>
                "{frase}"
              </p>
            )}
            {!frase && consultor.bio && (
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 24, maxWidth: 500 }}>
                {consultor.bio}
              </p>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#2ecc71", color: "#fff", padding: "12px 28px", borderRadius: 50, fontWeight: 700, fontSize: 14, textDecoration: "none", transition: "all 0.3s", boxShadow: "0 4px 15px rgba(46,204,113,0.3)" }}>
                  <MessageSquare style={{ width: 18, height: 18 }} /> WhatsApp
                </a>
              )}
              {consultor.instagram && (
                <a href={`https://instagram.com/${consultor.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", color: "#fff", padding: "12px 28px", borderRadius: 50, fontWeight: 600, fontSize: 14, textDecoration: "none", border: "1px solid rgba(255,255,255,0.2)", transition: "all 0.3s" }}>
                  <Instagram style={{ width: 18, height: 18 }} /> Instagram
                </a>
              )}
              <button onClick={scrollToForm} className="cl-btn-cta" style={{ padding: "12px 32px" }}>
                Fazer Cotação
              </button>
            </div>
          </div>

          {/* Right: Avatar floating card */}
          <div style={{ flex: "0 0 auto", display: "flex", justifyContent: "center" }} className="cl-fadeUp-1">
            <div className="cl-float" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(126,214,241,0.1))", borderRadius: 20, padding: 6, border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              {consultor.foto_capa_url ? (
                <img src={consultor.foto_capa_url} alt={consultor.nome} style={{ width: 220, height: 280, objectFit: "cover", borderRadius: 16 }} />
              ) : (
                <div style={{ width: 220, height: 280, borderRadius: 16, background: "linear-gradient(135deg, #003572, #004a9e)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(126,214,241,0.2)", border: "2px solid rgba(126,214,241,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 32, fontWeight: 700, color: "#7ed6f1" }}>{initials}</span>
                  </div>
                  <span style={{ color: "#7ed6f1", fontSize: 14, fontWeight: 600 }}>{cargoLabel}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FORM SECTION (blue bg, 2 cols: info left + form right) ══════════ */}
      <section className="cl-section-blue" ref={formRef} style={{ borderTop: "1px solid rgba(126,214,241,0.1)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 20px", display: "flex", flexWrap: "wrap", gap: 40, alignItems: "flex-start" }}>

          {/* Left: info */}
          <div style={{ flex: "1 1 340px" }} className="cl-fadeUp-2">
            <div className="cl-heading-bar">
              <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, color: "#fff", marginBottom: 16 }}>
                Faça já a simulação do seu plano de proteção veicular
              </h2>
            </div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>
              Preencha o formulário ao lado e receba sua cotação personalizada em instantes. Sem compromisso, sem análise de perfil.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { icon: Shield, text: "Sem análise de perfil ou SPC/Serasa" },
                { icon: CheckCircle, text: "100% Tabela FIPE garantido" },
                { icon: Clock, text: "Assistência 24h em todo o Brasil" },
                { icon: Car, text: "Carro reserva em caso de sinistro" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(126,214,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <item.icon style={{ width: 18, height: 18, color: "#7ed6f1" }} />
                  </div>
                  <span style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Form card */}
          <div style={{ flex: "1 1 380px", maxWidth: 460 }} className="cl-fadeUp-3">
            {concluido ? (
              <div className="cl-form-card" style={{ textAlign: "center" }}>
                <CheckCircle style={{ width: 56, height: 56, color: "#2ecc71", margin: "0 auto 16px" }} />
                <h3 style={{ fontSize: 22, fontWeight: 700, color: "#002b5e", marginBottom: 8 }}>Cotação recebida!</h3>
                <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>Em breve {consultor.nome} entrará em contato{waLink ? " pelo WhatsApp" : ""}.</p>
                {waLink && (
                  <a href={`${waLink}?text=${encodeURIComponent(`Olá ${consultor.nome}, acabei de fazer uma cotação pelo seu link!`)}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#2ecc71", color: "#fff", padding: "12px 24px", borderRadius: 50, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                    <MessageSquare style={{ width: 16, height: 16 }} /> Falar no WhatsApp
                  </a>
                )}
              </div>
            ) : (
              <div className="cl-form-card">
                {/* Steps */}
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
                  {[1, 2, 3].map((s) => (
                    <React.Fragment key={s}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, transition: "all 0.3s", ...(step === s ? { background: "#003572", color: "#fff", boxShadow: "0 4px 12px rgba(0,53,114,0.3)" } : step > s ? { background: "rgba(0,53,114,0.15)", color: "#003572" } : { background: "#f0f0f0", color: "#999" }) }}>
                        {step > s ? "✓" : s}
                      </div>
                      {s < 3 && <div style={{ width: 30, height: 2, alignSelf: "center", background: step > s ? "rgba(0,53,114,0.3)" : "#e5e7eb", borderRadius: 2 }} />}
                    </React.Fragment>
                  ))}
                </div>

                {/* Step 1 */}
                {step === 1 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#002b5e" }}>Seus dados</h3>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "#002b5e", display: "block", marginBottom: 6 }}>Nome completo:</label>
                      <input className="cl-input" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "#002b5e", display: "block", marginBottom: 6 }}>E-mail:</label>
                      <input type="email" className="cl-input" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "#002b5e", display: "block", marginBottom: 6 }}>WhatsApp:</label>
                      <input className="cl-input" placeholder="(11) 99999-9999" value={telefone} onChange={(e) => setTelefone(maskPhone(e.target.value))} />
                    </div>
                    <button disabled={!canStep2} onClick={() => setStep(2)} className="cl-btn-green">
                      Próximo passo <ChevronRight style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#002b5e" }}>Seu veículo</h3>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "#002b5e", display: "block", marginBottom: 6 }}>Tipo:</label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                        {TIPOS.map((t) => (
                          <button key={t} onClick={() => setTipoVeiculo(t)} style={{ padding: "10px 4px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "2px solid", borderColor: tipoVeiculo === t ? "#003572" : "#ddd", background: tipoVeiculo === t ? "rgba(0,53,114,0.08)" : "#fff", color: tipoVeiculo === t ? "#003572" : "#888", cursor: "pointer", fontFamily: "'Montserrat',sans-serif", transition: "all 0.2s" }}>
                            {TIPOS_LABEL[t] || t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "#002b5e", display: "block", marginBottom: 6 }}>Placa:</label>
                      <div style={{ position: "relative" }}>
                        <input className="cl-input" style={{ fontFamily: "'Courier New',monospace", textTransform: "uppercase" }} placeholder="ABC-1D23" value={placa} onChange={(e) => handlePlacaChange(e.target.value)} />
                        {buscando && <Loader2 style={{ position: "absolute", right: 12, top: 14, width: 16, height: 16, color: "#7ed6f1" }} className="animate-spin" />}
                      </div>
                    </div>
                    {veiculo && (
                      <div style={{ background: "rgba(0,53,114,0.04)", borderRadius: 10, padding: 16, border: "1px solid rgba(126,214,241,0.2)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <Car style={{ width: 18, height: 18, color: "#003572" }} />
                          <span style={{ fontWeight: 700, color: "#002b5e", fontSize: 14 }}>{veiculo.marca} {veiculo.modelo}</span>
                        </div>
                        <p style={{ fontSize: 12, color: "#666" }}>{veiculo.anoFabricacao}/{veiculo.anoModelo} • {veiculo.cor} • {veiculo.combustivel}</p>
                        {veiculo.valorFipe > 0 && (
                          <p style={{ fontSize: 12, fontWeight: 600, color: "#2ecc71", marginTop: 4 }}>FIPE: R$ {Number(veiculo.valorFipe).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                        )}
                      </div>
                    )}
                    {buscaErro && <p style={{ fontSize: 12, color: "#e74c3c" }}>{buscaErro}</p>}
                    <div style={{ display: "flex", gap: 12 }}>
                      <button onClick={() => setStep(1)} className="cl-btn-back"><ChevronLeft style={{ width: 16, height: 16 }} /> Voltar</button>
                      <button disabled={!canStep3} onClick={() => setStep(3)} className="cl-btn-green" style={{ flex: 1 }}>Próximo <ChevronRight style={{ width: 16, height: 16 }} /></button>
                    </div>
                  </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#002b5e" }}>Localização</h3>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "#002b5e", display: "block", marginBottom: 6 }}>Estado:</label>
                      <select className="cl-select" value={estado} onChange={(e) => setEstado(e.target.value)}>
                        <option value="">Selecione</option>
                        {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "#002b5e", display: "block", marginBottom: 6 }}>Cidade:</label>
                      <select className="cl-select" value={cidade} onChange={(e) => setCidade(e.target.value)}>
                        <option value="">Selecione a cidade</option>
                        {cidadesOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 8, border: "1.5px solid #ddd", cursor: "pointer" }}>
                      <input type="checkbox" checked={taxiApp} onChange={(e) => setTaxiApp(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#003572" }} />
                      <span style={{ fontSize: 13, color: "#444" }}>Usa o veículo em Táxi ou Aplicativo?</span>
                    </label>
                    <div style={{ display: "flex", gap: 12 }}>
                      <button onClick={() => setStep(2)} className="cl-btn-back"><ChevronLeft style={{ width: 16, height: 16 }} /> Voltar</button>
                      <button disabled={!canSubmit || enviando} onClick={handleSubmit} className="cl-btn-green" style={{ flex: 1 }}>
                        {enviando ? <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> Gerando...</> : <>Receber Cotação</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════ BIO + FRASE (white section) ══════════ */}
      {(frase || consultor.bio) && (
        <section className="cl-section-white" style={{ padding: "60px 20px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
            {frase && consultor.bio && (
              <>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: "#002b5e", marginBottom: 16 }}>Sobre {consultor.nome.split(" ")[0]}</h2>
                <p style={{ fontSize: 16, color: "#555", lineHeight: 1.8 }}>{consultor.bio}</p>
              </>
            )}
          </div>
        </section>
      )}

      {/* ══════════ BENEFITS (blue section, 3 col grid) ══════════ */}
      <section className="cl-section-blue" style={{ padding: "80px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, color: "#fff", marginBottom: 48 }}>
            Por que escolher a <span style={{ color: "#7ed6f1" }}>Objetivo</span>?
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {[
              { icon: Shield, title: "Sem Análise de Perfil", desc: "Não consultamos SPC ou Serasa. Qualquer pessoa pode aderir." },
              { icon: Car, title: "100% Tabela FIPE", desc: "Indenização integral pela tabela FIPE em caso de perda total." },
              { icon: Clock, title: "Assistência 24h", desc: "Guincho, chaveiro, troca de pneu e socorro mecânico, 24h por dia." },
              { icon: Wrench, title: "Carro Reserva", desc: "Veículo reserva disponível enquanto o seu estiver em reparo." },
              { icon: FileText, title: "Sem Burocracia", desc: "Processo simplificado e 100% digital. Adira em poucos minutos." },
              { icon: Heart, title: "Proteção Completa", desc: "Cobertura contra colisão, roubo, furto e fenômenos da natureza." },
            ].map((item, i) => (
              <div key={i} className="cl-card-glass" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(126,214,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <item.icon style={{ width: 22, height: 22, color: "#7ed6f1" }} />
                </div>
                <div>
                  <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{item.title}</h3>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ GALLERY (white section) ══════════ */}
      {hasGallery && (
        <section className="cl-section-white" style={{ padding: "60px 20px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: 800, color: "#002b5e", marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Camera style={{ width: 22, height: 22, color: "#003572" }} /> Galeria de {consultor.nome.split(" ")[0]}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
              {(consultor.fotos_trabalho || []).slice(0, 6).map((url, i) => (
                <div key={i} style={{ aspectRatio: "1", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
                  <img src={url} alt={`Trabalho ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }} onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.08)")} onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ FAQ (white section) ══════════ */}
      <section className="cl-section-white" style={{ padding: "60px 20px", borderTop: "1px solid #eee" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: 800, color: "#002b5e", marginBottom: 32 }}>
            Perguntas Frequentes
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqs.map((faq, i) => (
              <div key={i} className={`cl-faq-item ${openFaq === i ? "active" : ""}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="cl-faq-q">
                  {faq.q}
                  <ChevronDown className="cl-faq-icon" style={{ width: 18, height: 18, color: "#003572", flexShrink: 0 }} />
                </div>
                <div className="cl-faq-a">
                  <p style={{ fontSize: 14, color: "#555", lineHeight: 1.7 }}>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA FINAL (blue) ══════════ */}
      <section className="cl-section-blue" style={{ padding: "60px 20px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)", fontWeight: 800, color: "#fff", marginBottom: 16 }}>
            Proteja seu veículo agora mesmo
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, marginBottom: 24 }}>
            Faça sua cotação gratuita e descubra o melhor plano para você.
          </p>
          <button onClick={scrollToForm} className="cl-btn-cta cl-pulse" style={{ fontSize: 15, padding: "16px 48px" }}>
            Quero Minha Cotação
          </button>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{ background: "#001a38", borderTop: "1px solid rgba(255,255,255,0.1)", padding: "32px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <img src={LOGO_URL} alt="Objetivo" style={{ height: 30, opacity: 0.5, marginBottom: 16 }} />
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginBottom: 12 }}>CNPJ: 58.506.161/0001-31</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 12 }}>
            <a href={`tel:${PHONE_0800.replace(/\s/g, "")}`} style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
              <Phone style={{ width: 12, height: 12 }} /> {PHONE_0800}
            </a>
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                <MessageSquare style={{ width: 12, height: 12 }} /> WhatsApp
              </a>
            )}
          </div>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>
            Objetivo Proteção Veicular — Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}
