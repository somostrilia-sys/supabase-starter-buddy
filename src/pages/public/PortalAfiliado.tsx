import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DollarSign, TrendingUp, Clock, Users, Link2, Copy, CheckCircle,
  Eye, Wallet, ArrowUpRight, CreditCard, Landmark, Phone, Mail,
  Shield, ChevronDown, ChevronUp, ExternalLink, Share2, Loader2,
} from "lucide-react";

const LOGO_URL = "https://objetivoauto.com.br/wp-content/uploads/2025/11/IMG_1299.png";

const BANCOS = [
  "001 - Banco do Brasil","033 - Santander","104 - Caixa Econômica","237 - Bradesco",
  "341 - Itaú","077 - Inter","260 - Nubank","756 - Sicoob","748 - Sicredi",
  "212 - Banco Original","336 - C6 Bank","290 - PagBank","380 - PicPay",
  "403 - Cora","323 - Mercado Pago","364 - Gerencianet/Efí","218 - BS2","Outro",
];

interface Afiliado {
  id: string;
  nome: string;
  codigo: string;
  email: string | null;
  telefone: string | null;
  comissao_valor: number;
  leads: number;
  vendas: number;
  comissao_acumulada: number;
  saldo_disponivel: number;
  ativo: boolean;
  token_acesso: string;
  tipo_conta: string | null;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  digito: string | null;
  cpf_titular: string | null;
  nome_titular: string | null;
  chave_pix: string | null;
  dia_recebimento: number | null;
  consultor_id: string | null;
}

interface Indicacao {
  id: string;
  lead_nome: string | null;
  lead_telefone: string | null;
  status: string;
  comissao_valor: number;
  pago: boolean;
  pago_em: string | null;
  created_at: string;
}

interface Saque {
  id: string;
  valor: number;
  status: string;
  pago_em: string | null;
  created_at: string;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  novo: { label: "Novo Lead", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  em_andamento: { label: "Em Andamento", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  concluido: { label: "Venda Fechada!", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  perdido: { label: "Não Fechou", color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
};

const saqueStatusMap: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "text-amber-600 bg-amber-50" },
  aprovado: { label: "Aprovado", color: "text-blue-600 bg-blue-50" },
  pago: { label: "Pago", color: "text-emerald-600 bg-emerald-50" },
  cancelado: { label: "Cancelado", color: "text-red-600 bg-red-50" },
};

export default function PortalAfiliado() {
  const { token } = useParams<{ token: string }>();
  const [afiliado, setAfiliado] = useState<Afiliado | null>(null);
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([]);
  const [saques, setSaques] = useState<Saque[]>([]);
  const [consultorSlug, setConsultorSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<"indicacoes" | "financeiro" | "dados">("indicacoes");
  const [bankForm, setBankForm] = useState({
    tipo_conta: "corrente", banco: "", agencia: "", conta: "", digito: "",
    cpf_titular: "", nome_titular: "", chave_pix: "",
  });
  const [savingBank, setSavingBank] = useState(false);
  const [showSaque, setShowSaque] = useState(false);
  const [saqueValor, setSaqueValor] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  // Load data
  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      const { data: af } = await (supabase as any)
        .from("afiliados")
        .select("*")
        .eq("token_acesso", token)
        .maybeSingle();

      if (!af) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setAfiliado(af);
      setBankForm({
        tipo_conta: af.tipo_conta || "corrente",
        banco: af.banco || "",
        agencia: af.agencia || "",
        conta: af.conta || "",
        digito: af.digito || "",
        cpf_titular: af.cpf_titular || "",
        nome_titular: af.nome_titular || "",
        chave_pix: af.chave_pix || "",
      });

      // Load consultor slug for referral link
      if (af.consultor_id) {
        const { data: usr } = await (supabase as any)
          .from("usuarios")
          .select("slug")
          .eq("id", af.consultor_id)
          .maybeSingle();
        if (usr?.slug) setConsultorSlug(usr.slug);
      }

      // Load indicacoes
      const { data: inds } = await (supabase as any)
        .from("afiliado_indicacoes")
        .select("*")
        .eq("afiliado_id", af.id)
        .order("created_at", { ascending: false });
      setIndicacoes(inds || []);

      // Load saques
      const { data: sqs } = await (supabase as any)
        .from("afiliado_saques")
        .select("*")
        .eq("afiliado_id", af.id)
        .order("created_at", { ascending: false });
      setSaques(sqs || []);

      setLoading(false);
    })();
  }, [token]);

  const referralLink = useMemo(() => {
    if (!afiliado?.codigo) return "";
    if (consultorSlug) return `${window.location.origin}/c/${consultorSlug}?ref=${afiliado.codigo}`;
    return `${window.location.origin}/cotacao?ref=${afiliado.codigo}`;
  }, [afiliado, consultorSlug]);

  const portalLink = `${window.location.origin}/afiliado/${token}`;

  async function copyLink(text: string) {
    await navigator.clipboard.writeText(text);
    setLinkCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setLinkCopied(false), 2000);
  }

  async function salvarDadosBancarios() {
    if (!afiliado) return;
    // Validação básica
    if (bankForm.chave_pix && bankForm.chave_pix.trim().length < 5) {
      toast.error("Chave PIX inválida");
      return;
    }
    if (bankForm.cpf_titular && bankForm.cpf_titular.replace(/\D/g, "").length > 0 && bankForm.cpf_titular.replace(/\D/g, "").length < 11) {
      toast.error("CPF/CNPJ do titular inválido");
      return;
    }
    setSavingBank(true);
    const { error } = await (supabase as any)
      .from("afiliados")
      .update({
        tipo_conta: bankForm.tipo_conta,
        banco: bankForm.banco || null,
        agencia: bankForm.agencia || null,
        conta: bankForm.conta || null,
        digito: bankForm.digito || null,
        cpf_titular: bankForm.cpf_titular || null,
        nome_titular: bankForm.nome_titular || null,
        chave_pix: bankForm.chave_pix || null,
      })
      .eq("id", afiliado.id)
      .eq("token_acesso", token);
    setSavingBank(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success("Dados bancários salvos!");
  }

  async function solicitarSaque() {
    if (!afiliado) return;
    const valor = parseFloat(saqueValor);
    // Checar saques pendentes/aprovados para evitar double-spend
    const saquesEmAberto = saques
      .filter((s) => s.status === "pendente" || s.status === "aprovado")
      .reduce((s, item) => s + Number(item.valor), 0);
    const saldoReal = (afiliado.saldo_disponivel || 0) - saquesEmAberto;

    if (!valor || valor <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    if (valor > saldoReal) {
      toast.error(`Valor máximo disponível: R$ ${saldoReal.toFixed(2)} (descontando saques em aberto)`);
      return;
    }
    if (!afiliado.chave_pix && !afiliado.banco) {
      toast.error("Cadastre seus dados bancários antes de solicitar saque");
      setTab("dados");
      return;
    }
    const { error } = await (supabase as any)
      .from("afiliado_saques")
      .insert({ afiliado_id: afiliado.id, valor });
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success("Saque solicitado! Aguarde aprovação.");
    setShowSaque(false);
    setSaqueValor("");
    // Refresh saques
    const { data: sqs } = await (supabase as any)
      .from("afiliado_saques")
      .select("*")
      .eq("afiliado_id", afiliado.id)
      .order("created_at", { ascending: false });
    setSaques(sqs || []);
  }

  function shareLink() {
    if (navigator.share) {
      navigator.share({ title: "Meu link de indicação", url: referralLink });
    } else {
      copyLink(referralLink);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#002b5e] to-[#003b7d] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    );
  }

  if (notFound || !afiliado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#002b5e] to-[#003b7d] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Link inválido</h1>
          <p className="text-gray-500">Este link de acesso não é válido ou foi desativado.</p>
        </div>
      </div>
    );
  }

  const comissaoPendente = indicacoes
    .filter((i) => i.status === "concluido" && !i.pago)
    .reduce((s, i) => s + Number(i.comissao_valor || 0), 0);

  return (
    <div className="min-h-screen bg-[#f0f4f8]" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002b5e] via-[#003572] to-[#003b7d] text-white">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Logo" className="h-10 object-contain" />
            <div>
              <p className="text-xs text-white/60 uppercase tracking-widest">Portal do Afiliado</p>
              <h1 className="text-lg font-bold leading-tight">{afiliado.nome}</h1>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-white/50">Código</p>
            <p className="font-mono text-sm font-bold text-[#7ed6f1]">{afiliado.codigo}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Indicações", value: indicacoes.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Vendas Fechadas", value: afiliado.vendas || 0, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Comissão Total", value: `R$ ${Number(afiliado.comissao_acumulada || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Saldo Disponível", value: `R$ ${Number(afiliado.saldo_disponivel || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: Wallet, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                  <k.icon className={`h-5 w-5 ${k.color}`} />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">{k.label}</p>
                  <p className="text-lg font-bold text-gray-800">{k.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Referral Link Card */}
        <div className="bg-gradient-to-r from-[#002b5e] to-[#003b7d] rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="h-5 w-5 text-[#7ed6f1]" />
            <h2 className="font-bold text-sm">Seu Link de Indicação</h2>
          </div>
          <div className="bg-white/10 rounded-lg p-3 flex items-center gap-2 mb-3">
            <input
              readOnly
              value={referralLink}
              className="flex-1 bg-transparent text-sm text-white/90 outline-none font-mono truncate"
            />
            <button
              onClick={() => copyLink(referralLink)}
              className="shrink-0 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1"
            >
              {linkCopied ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {linkCopied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={shareLink}
              className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 className="h-4 w-4" /> Compartilhar
            </button>
            <button
              onClick={() => copyLink(portalLink)}
              className="bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2.5 text-xs font-medium transition-colors"
              title="Copiar link deste portal"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[11px] text-white/40 mt-3">
            Comissão: <span className="text-[#7ed6f1] font-semibold">R$ {Number(afiliado.comissao_valor || 0).toFixed(2)}</span> por venda fechada
            {afiliado.dia_recebimento && <> · Pagamento todo dia <span className="text-[#7ed6f1] font-semibold">{afiliado.dia_recebimento}</span></>}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          {([
            { key: "indicacoes", label: "Minhas Indicações", icon: Users },
            { key: "financeiro", label: "Financeiro", icon: Wallet },
            { key: "dados", label: "Dados Bancários", icon: Landmark },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-[#002b5e] text-white shadow-md"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <t.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === "indicacoes" && (
          <div className="space-y-3">
            {indicacoes.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhuma indicação ainda</p>
                <p className="text-sm text-gray-400 mt-1">Compartilhe seu link e acompanhe suas indicações aqui</p>
              </div>
            ) : (
              indicacoes.map((ind) => {
                const st = statusMap[ind.status] || statusMap.novo;
                return (
                  <div key={ind.id} className={`bg-white rounded-xl p-4 shadow-sm border ${st.bg} transition-all`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{ind.lead_nome || "Lead sem nome"}</p>
                        {ind.lead_telefone && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" /> {ind.lead_telefone}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.color} ${st.bg}`}>
                        {st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(ind.created_at).toLocaleDateString("pt-BR")}
                      </span>
                      {ind.status === "concluido" && (
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <DollarSign className="h-3 w-3" />
                          R$ {Number(ind.comissao_valor || 0).toFixed(2)}
                          {ind.pago ? (
                            <span className="ml-1 text-emerald-500">✓ Pago</span>
                          ) : (
                            <span className="ml-1 text-amber-500">Pendente</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "financeiro" && (
          <div className="space-y-4">
            {/* Resumo financeiro */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-600" /> Resumo Financeiro
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <p className="text-[11px] text-emerald-600 uppercase font-medium">Total Ganho</p>
                  <p className="text-lg font-bold text-emerald-700">
                    R$ {Number(afiliado.comissao_acumulada || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <p className="text-[11px] text-amber-600 uppercase font-medium">Pendente</p>
                  <p className="text-lg font-bold text-amber-700">
                    R$ {comissaoPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-[11px] text-blue-600 uppercase font-medium">Disponível</p>
                  <p className="text-lg font-bold text-blue-700">
                    R$ {Number(afiliado.saldo_disponivel || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              {(afiliado.saldo_disponivel || 0) > 0 && (
                <div className="mt-4">
                  {!showSaque ? (
                    <button
                      onClick={() => setShowSaque(true)}
                      className="w-full bg-[#002b5e] hover:bg-[#003572] text-white rounded-lg py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <ArrowUpRight className="h-4 w-4" /> Solicitar Saque
                    </button>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <p className="text-sm font-medium text-gray-700">Valor do saque:</p>
                      <input
                        type="number"
                        value={saqueValor}
                        onChange={(e) => setSaqueValor(e.target.value)}
                        placeholder="0.00"
                        max={afiliado.saldo_disponivel || 0}
                        step="0.01"
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#003572] focus:ring-2 focus:ring-[#003572]/10"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={solicitarSaque}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
                        >
                          Confirmar Saque
                        </button>
                        <button
                          onClick={() => { setShowSaque(false); setSaqueValor(""); }}
                          className="px-4 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Histórico de saques */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" /> Histórico de Saques
              </h3>
              {saques.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum saque solicitado</p>
              ) : (
                <div className="space-y-2">
                  {saques.map((s) => {
                    const st = saqueStatusMap[s.status] || saqueStatusMap.pendente;
                    return (
                      <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-800">R$ {Number(s.valor).toFixed(2)}</p>
                          <p className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "dados" && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Landmark className="h-5 w-5 text-blue-600" /> Dados Bancários para Recebimento
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Chave PIX (preferencial)</label>
                <input
                  value={bankForm.chave_pix}
                  onChange={(e) => setBankForm({ ...bankForm, chave_pix: e.target.value })}
                  placeholder="CPF, email, telefone ou chave aleatória"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#003572] focus:ring-2 focus:ring-[#003572]/10"
                />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 mb-3">Ou dados bancários completos:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500">Banco</label>
                    <select
                      value={bankForm.banco}
                      onChange={(e) => setBankForm({ ...bankForm, banco: e.target.value })}
                      className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#003572]"
                    >
                      <option value="">Selecione o banco</option>
                      {BANCOS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Tipo de Conta</label>
                    <select
                      value={bankForm.tipo_conta}
                      onChange={(e) => setBankForm({ ...bankForm, tipo_conta: e.target.value })}
                      className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#003572]"
                    >
                      <option value="corrente">Conta Corrente</option>
                      <option value="poupanca">Poupança</option>
                      <option value="pj">Conta PJ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Agência</label>
                    <input
                      value={bankForm.agencia}
                      onChange={(e) => setBankForm({ ...bankForm, agencia: e.target.value })}
                      placeholder="0001"
                      className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#003572] focus:ring-2 focus:ring-[#003572]/10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Conta</label>
                    <input
                      value={bankForm.conta}
                      onChange={(e) => setBankForm({ ...bankForm, conta: e.target.value })}
                      placeholder="12345"
                      className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#003572] focus:ring-2 focus:ring-[#003572]/10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Dígito</label>
                    <input
                      value={bankForm.digito}
                      onChange={(e) => setBankForm({ ...bankForm, digito: e.target.value })}
                      placeholder="0"
                      className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#003572] focus:ring-2 focus:ring-[#003572]/10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">CPF/CNPJ do Titular</label>
                    <input
                      value={bankForm.cpf_titular}
                      onChange={(e) => setBankForm({ ...bankForm, cpf_titular: e.target.value })}
                      placeholder="000.000.000-00"
                      className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#003572] focus:ring-2 focus:ring-[#003572]/10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Nome do Titular</label>
                    <input
                      value={bankForm.nome_titular}
                      onChange={(e) => setBankForm({ ...bankForm, nome_titular: e.target.value })}
                      placeholder="Nome completo"
                      className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#003572] focus:ring-2 focus:ring-[#003572]/10"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={salvarDadosBancarios}
                disabled={savingBank}
                className="w-full bg-[#002b5e] hover:bg-[#003572] disabled:bg-gray-300 text-white rounded-lg py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors mt-4"
              >
                {savingBank ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {savingBank ? "Salvando..." : "Salvar Dados Bancários"}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6">
          <img src={LOGO_URL} alt="Logo" className="h-8 mx-auto opacity-30 mb-2" />
          <p className="text-[11px] text-gray-300">Portal do Afiliado · Objetivo Auto</p>
        </div>
      </div>
    </div>
  );
}
