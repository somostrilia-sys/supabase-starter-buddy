import React, { useState, useEffect } from "react";
import VistoriaFotoSelector from "@/components/VistoriaFotoSelector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PipelineDeal } from "./mockData";
import { useQuery } from "@tanstack/react-query";
import { supabase, callEdge } from "@/integrations/supabase/client";
import { gerarLaudoVistoria } from "@/lib/gerarLaudoVistoria";
import { usePermission } from "@/hooks/usePermission";
import {
  ClipboardCheck, Copy, MessageSquare, CheckCircle, XCircle,
  Clock, AlertCircle, Camera, Globe, RotateCcw, Download, Eye, Mail,
} from "lucide-react";
import ExcecaoButton from "@/components/ExcecaoButton";
import PedirLiberacaoButton from "@/components/PedirLiberacaoButton";

type VistoriaStatus = "pendente" | "em_aprovacao" | "aprovada" | "reprovada";

const statusConfig: Record<VistoriaStatus, { label: string; color: string; icon: React.ElementType }> = {
  pendente: { label: "Pendente", color: "bg-warning/10 text-warning border-warning/30", icon: Clock },
  em_aprovacao: { label: "Em Aprovação", color: "bg-primary/8 text-primary border-blue-300", icon: Eye },
  aprovada: { label: "Aprovada", color: "bg-success/10 text-success border-green-300", icon: CheckCircle },
  reprovada: { label: "Reprovada", color: "bg-destructive/8 text-destructive border-red-300", icon: XCircle },
};

interface TimelineEvent {
  data: string;
  descricao: string;
  tipo: "solicitacao" | "envio" | "analise" | "resultado" | "reenvio";
  usuario?: string;
}


const tipoIconMap: Record<string, React.ElementType> = {
  solicitacao: ClipboardCheck,
  envio: Camera,
  analise: Eye,
  resultado: AlertCircle,
  reenvio: RotateCcw,
};

const tipoColorMap: Record<string, string> = {
  solicitacao: "bg-[#1A3A5C] text-white",
  envio: "bg-emerald-500 text-white",
  analise: "bg-primary/60 text-white",
  resultado: "bg-destructive/80 text-white",
  reenvio: "bg-warning/80 text-white",
};

// 2.4 — Componente com cache React Query + thumbnails + lazy loading
// Componente de imagem lazy — só carrega quando visível
function LazyFoto({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [visible, setVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ backgroundColor: "#e5e7eb" }}>
      {visible && <img src={src} alt={alt} className="w-full h-full object-cover" />}
    </div>
  );
}

function FotosReaisSection({ vistoriaId }: { vistoriaId: string }) {
  const { data: fotos, isLoading } = useQuery({
    queryKey: ["vistoria_fotos", vistoriaId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("vistoria_fotos").select("id,tipo,storage_path,ai_aprovada").eq("vistoria_id", vistoriaId).order("created_at");
      // Gerar signed URLs (10min) — mais confiável que getPublicUrl
      return await Promise.all((data || []).map(async (foto: any) => {
        const { data: signed } = await supabase.storage.from("vistoria-fotos").createSignedUrl(foto.storage_path, 600);
        return { ...foto, thumbUrl: signed?.signedUrl || "" };
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return (
    <Card className="rounded-none border-2 border-green-500/30 bg-green-500/5">
      <CardContent className="p-5">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
  if (!fotos || fotos.length === 0) return null;

  return (
    <Card className="rounded-none border-2 border-green-500/30 bg-green-500/5">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Camera className="h-4 w-4 text-green-500" />
          <span className="text-sm font-bold text-green-700 dark:text-green-400">FOTOS ENVIADAS PELO ASSOCIADO</span>
          <Badge className="bg-green-500/15 text-green-600 text-xs">{fotos.length} fotos</Badge>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {fotos.map((foto: any) => (
            <div key={foto.id} className="relative aspect-square rounded-lg overflow-hidden border-2 border-green-500/20">
              <LazyFoto src={foto.thumbUrl} alt={foto.tipo} className="w-full h-full" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[9px] text-center py-1 font-medium">
                {(foto.tipo || "").replace(/_/g, " ")}
              </div>
              {foto.ai_aprovada === true && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              )}
              {foto.ai_aprovada === false && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <XCircle className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface Props { deal: PipelineDeal; }

export default function VistoriaTab({ deal }: Props) {
  const { isAdmin } = usePermission();

  // 2.1 — Mover card para aguardando_vistoria
  const moveToAguardandoVistoria = async () => {
    const { data: negAtual } = await supabase.from("negociacoes" as any).select("stage").eq("id", deal.id).maybeSingle();
    const stageAtual = (negAtual as any)?.stage || deal.stage;
    if (["em_negociacao", "novo_lead", "em_contato"].includes(stageAtual)) {
      await supabase.from("negociacoes").update({ stage: "aguardando_vistoria", updated_at: new Date().toISOString() } as any).eq("id", deal.id);
      await supabase.from("pipeline_transicoes").insert({
        negociacao_id: deal.id, stage_anterior: stageAtual, stage_novo: "aguardando_vistoria",
        motivo: "Vistoria enviada ao cliente", automatica: true,
      } as any);
    }
  };

  // Buscar vistoria real do banco (cache 2min)
  const { data: vistoriaReal } = useQuery({
    queryKey: ["vistoria_real", deal.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vistorias" as any)
        .select("*")
        .eq("negociacao_id", deal.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as any;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Buscar timeline (cache 2min, limit 20)
  const { data: timelineReal } = useQuery({
    queryKey: ["vistoria_timeline", deal.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("pipeline_transicoes" as any)
        .select("*")
        .eq("negociacao_id", deal.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data || []) as any[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const timeline: TimelineEvent[] = (timelineReal && timelineReal.length > 0)
    ? timelineReal.map((t: any) => ({
        data: new Date(t.created_at).toLocaleString("pt-BR"),
        descricao: `${t.stage_anterior} → ${t.stage_novo}${t.motivo ? ` — ${t.motivo}` : ""}`,
        tipo: t.automatica ? "analise" : "solicitacao",
        usuario: t.automatica ? "Sistema" : "Consultor",
      }))
    : [];

  const [codigoGerado, setCodigoGerado] = useState(!!vistoriaReal);
  const [codigo, setCodigo] = useState(vistoriaReal?.token_publico || "");
  const [vistoriaId, setVistoriaId] = useState(vistoriaReal?.id || "");
  const [status, setStatus] = useState<VistoriaStatus>(vistoriaReal?.status || "pendente");

  // Sincronizar state quando vistoriaReal carrega do banco
  React.useEffect(() => {
    if (vistoriaReal) {
      setCodigoGerado(true);
      setCodigo(vistoriaReal.token_publico || "");
      setVistoriaId(vistoriaReal.id || "");
      setStatus(vistoriaReal.status || "pendente");
    }
  }, [vistoriaReal]);
  const [prazo, setPrazo] = useState("7");
  const [iaAnalisando, setIaAnalisando] = useState(false);
  const [selectedFotos, setSelectedFotos] = useState<string[]>([
    "frente","traseira","lateral_esquerda","lateral_direita","para_brisa","interior_painel",
    "banco_dianteiro","banco_traseiro","motor_capo","porta_malas","rodas_pneus",
    "chave","chassi","quilometragem"
  ]);
  // Detectar tipo de veículo pelo modelo (reativo ao deal)
  const categoriaVistoria = React.useMemo(() => {
    const modelo = (deal.veiculo_modelo || "").toLowerCase();
    const plano = ((deal as any).plano || "").toLowerCase();
    const motos = ["cg ", "cb ", "xre", "pcx", "nmax", "factor", "fazer", "twister", "titan", "fan ", "biz", "pop ", "bros", "lander", "crosser", "tenere", "mt-", "yzf", "ninja", "z900", "duke", "bmw gs", "harley", "indian", "motocicleta", "moto"];
    const caminhoes = ["caminhao", "caminhão", "truck", "trator", "carreta", "scania", "volvo fh", "volvo fm", "mercedes actros", "mercedes atego", "mercedes axor", "iveco", "man tgx", "man tgs", "daf", "vuc", "3/4", "toco", "bi-truck", "micro-onibus", "micro onibus", "sprinter", "daily", "accelo", "constellation", "worker", "cargo", "volkswagen worker", "ford cargo", "pesado", "pesados"];
    if (motos.some(m => modelo.includes(m)) || plano.includes("moto")) return "moto";
    if (caminhoes.some(c => modelo.includes(c)) || plano.includes("pesado") || plano.includes("van")) return "caminhao";
    return "automovel";
  }, [deal.veiculo_modelo, (deal as any).plano]);

  const handleAprovar = async () => {
    if (vistoriaId) {
      await supabase.from("vistorias" as any).update({ status: "aprovada" } as any).eq("id", vistoriaId);
      await supabase.from("pipeline_transicoes").insert({
        negociacao_id: deal.id, stage_anterior: deal.stage, stage_novo: deal.stage,
        motivo: "Vistoria aprovada", automatica: false,
      } as any);
    }
    setStatus("aprovada");
    toast.success("Vistoria aprovada!");
  };

  const handleReprovar = async () => {
    if (vistoriaId) {
      await supabase.from("vistorias" as any).update({ status: "reprovada" } as any).eq("id", vistoriaId);
      await supabase.from("pipeline_transicoes").insert({
        negociacao_id: deal.id, stage_anterior: deal.stage, stage_novo: deal.stage,
        motivo: "Vistoria reprovada", automatica: false,
      } as any);
    }
    setStatus("reprovada");
    toast.error("Vistoria reprovada.");
  };

  const st = statusConfig[status];
  const StIcon = st.icon;

  const handleSolicitar = async (): Promise<string | null> => {
    // Buscar dados FRESCOS do banco (não do deal em memória que pode estar desatualizado)
    const { data: negAtual } = await supabase.from("negociacoes" as any).select("lead_nome,cpf_cnpj,telefone,email,veiculo_placa,veiculo_modelo").eq("id", deal.id).maybeSingle();
    const d = (negAtual || deal) as any;

    const faltando: string[] = [];
    if (!d.lead_nome?.trim()) faltando.push("Nome do Lead (Associado)");
    if (!d.telefone?.trim()) faltando.push("Telefone (Associado)");
    if (!d.email?.trim()) faltando.push("E-mail (Associado)");
    if (!d.veiculo_placa?.trim()) faltando.push("Placa do Veículo");
    if (!d.veiculo_modelo?.trim()) faltando.push("Modelo do Veículo");

    if (faltando.length > 0) {
      toast.error(`Complete os dados antes de solicitar vistoria:\n• ${faltando.join("\n• ")}`, { duration: 8000 });
      return null;
    }

    // Gerar token único
    const token = `VST-${Date.now().toString(36).toUpperCase()}`;

    // Criar registro real na tabela vistorias
    const { data: novaVistoria, error } = await supabase
      .from("vistorias" as any)
      .insert({
        negociacao_id: deal.id,
        token_publico: token,
        status: "pendente",
        tentativa: 1,
        placa: d.veiculo_placa || deal.veiculo_placa,
        modelo: d.veiculo_modelo || deal.veiculo_modelo,
        fotos_solicitadas: selectedFotos,
      } as any)
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar vistoria:", error);
      toast.error("Erro ao criar vistoria: " + error.message);
      return null;
    }

    // Registrar transição no pipeline
    await supabase.from("pipeline_transicoes").insert({
      negociacao_id: deal.id,
      stage_anterior: deal.stage,
      stage_novo: deal.stage,
      motivo: `Vistoria solicitada — código ${token}`,
      automatica: false,
    } as any);

    // Auto-transição para aguardando_vistoria se aplicável
    if (deal.stage === "em_negociacao") {
      await supabase.from("negociacoes").update({ stage: "aguardando_vistoria" } as any).eq("id", deal.id);
      await supabase.from("pipeline_transicoes").insert({
        negociacao_id: deal.id,
        stage_anterior: "em_negociacao",
        stage_novo: "aguardando_vistoria",
        motivo: "Vistoria solicitada automaticamente",
        automatica: true,
      } as any);
    }

    setCodigo(token);
    setVistoriaId((novaVistoria as any).id);
    setCodigoGerado(true);

    // Copiar link automaticamente
    const link = `${window.location.origin}/vistoria/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Vistoria criada! Link copiado. Use os botões para enviar ao cliente.", { duration: 5000 });

    // Não envia SMS/email/WhatsApp automaticamente — cada botão faz sua parte
    return token;
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(codigo);
    toast.success("Código copiado!");
  };

  // handleAprovar and handleReprovar defined above (with template validation)

  const lbl = "text-sm font-semibold";

  return (
    <div className="space-y-5">
      {/* Card de status principal */}
      <Card className="rounded-none border-2" style={{ borderColor: status === "aprovada" ? "#16a34a" : status === "reprovada" ? "#dc2626" : "#1A3A5C" }}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <StIcon className="h-6 w-6" style={{ color: status === "aprovada" ? "#16a34a" : status === "reprovada" ? "#dc2626" : "#1A3A5C" }} />
                <h3 className="text-lg font-bold">Vistoria da Negociação</h3>
                <Badge className={`rounded-none border ${st.color}`}>{st.label}</Badge>
              </div>

              {codigoGerado ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Código</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base">{codigo}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCopiar}><Copy className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Negociação</span>
                    <p className="font-mono text-sm">{deal.codigo}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Solicitada em</span>
                    <p className="text-sm">{vistoriaReal?.created_at ? new Date(vistoriaReal.created_at).toLocaleString("pt-BR") : "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Tentativa atual</span>
                    <p className="text-sm font-semibold">{vistoriaReal?.tentativa || 1}ª tentativa</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Veículo</span>
                    <p className="text-sm">{deal.veiculo_modelo} — {deal.veiculo_placa}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className={lbl}>Prazo Limite</Label>
                    <Select value={prazo} onValueChange={setPrazo}>
                      <SelectTrigger className="rounded-none h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[{ v: "3", l: "3 dias" }, { v: "7", l: "7 dias" }, { v: "15", l: "15 dias" }, { v: "30", l: "30 dias" }].map(o => (
                          <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma vistoria solicitada para esta negociação.</p>
              )}
            </div>
          </div>

          {/* Ações — botões SEMPRE visíveis */}
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t-2 border-[#747474]">
              <Button size="sm" variant="outline" className="rounded-none border border-gray-300" onClick={async () => {
                let cod = codigo;
                if (!codigoGerado) {
                  const token = await handleSolicitar();
                  if (!token) return;
                  cod = token;
                }
                // Fallback: se codigo vazio, buscar token do banco
                if (!cod) {
                  const { data: vst } = await (supabase as any).from("vistorias").select("token_publico").eq("negociacao_id", deal.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
                  cod = vst?.token_publico || "";
                  if (cod) setCodigo(cod);
                }
                if (!cod) { toast.error("Nenhuma vistoria encontrada. Solicite uma vistoria primeiro."); return; }
                const { data: negF } = await (supabase as any).from("negociacoes").select("telefone,lead_nome,veiculo_placa").eq("id", deal.id).maybeSingle();
                const d = negF || deal;
                const tel = (d.telefone || "").replace(/\D/g, "");
                if (!tel) { toast.error("Telefone não cadastrado. Preencha na aba Associado."); return; }
                const link = `${window.location.origin}/vistoria/${cod}`;
                const msg = encodeURIComponent(`Olá ${d.lead_nome}! Segue o link para envio das fotos da vistoria do veículo ${d.veiculo_placa}:\n\n${link}\n\nAbra no celular, permita câmera e localização, e envie as fotos.`);
                window.open(`https://wa.me/55${tel}?text=${msg}`, "_blank");
                await moveToAguardandoVistoria();
                toast.success("WhatsApp aberto!");
              }}>
                <MessageSquare className="h-3.5 w-3.5 mr-1" />Enviar WhatsApp
              </Button>
              <Button size="sm" className="rounded-none bg-[#1A3A5C] hover:bg-[#15304D] text-white" onClick={async () => {
                let cod = codigo;
                if (!codigoGerado) {
                  const token = await handleSolicitar();
                  if (!token) return;
                  cod = token;
                }
                // Fallback: se codigo vazio, buscar token do banco
                if (!cod) {
                  const { data: vst } = await (supabase as any).from("vistorias").select("token_publico").eq("negociacao_id", deal.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
                  cod = vst?.token_publico || "";
                  if (cod) setCodigo(cod);
                }
                if (!cod) { toast.error("Nenhuma vistoria encontrada. Solicite uma vistoria primeiro."); return; }
                const { data: negF } = await (supabase as any).from("negociacoes").select("telefone,email,lead_nome,veiculo_placa").eq("id", deal.id).maybeSingle();
                const d = negF || deal;
                if (!d.email) { toast.error("E-mail não cadastrado. Preencha na aba Associado."); return; }
                const link = `${window.location.origin}/vistoria/${cod}`;
                const msgEmail = `Olá ${d.lead_nome}! Segue o link para envio das fotos da vistoria do veículo ${d.veiculo_placa}:\n\n${link}\n\nAbra no celular, permita câmera e localização, e envie todas as fotos solicitadas.\n\nObjetivo Auto Benefícios`;
                toast.info("Enviando e-mail...");
                callEdge("gia-enviar-notificacao", {
                  tipo: "email",
                  email: d.email,
                  nome: d.lead_nome,
                  assunto: `Vistoria Veicular - ${d.veiculo_placa}`,
                  mensagem: msgEmail,
                }).then(res => {
                  if (res.email?.sucesso) toast.success("E-mail enviado!");
                  else toast.error(`E-mail falhou: ${res.email?.detalhes || "sem email"}`);
                }).catch(() => toast.error("Erro no envio."));
                await moveToAguardandoVistoria();
              }}>
                <Mail className="h-3.5 w-3.5 mr-1" />Enviar E-mail
              </Button>
              <Button size="sm" variant="outline" className="rounded-none border border-gray-300" onClick={async () => {
                let cod = codigo;
                if (!codigoGerado) {
                  const token = await handleSolicitar();
                  if (!token) return;
                  cod = token;
                }
                // Fallback: se codigo vazio, buscar token do banco
                if (!cod) {
                  const { data: vst } = await (supabase as any).from("vistorias").select("token_publico").eq("negociacao_id", deal.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
                  cod = vst?.token_publico || "";
                  if (cod) setCodigo(cod);
                }
                if (!cod) { toast.error("Nenhuma vistoria encontrada."); return; }
                const link = `${window.location.origin}/vistoria/${cod}`;
                navigator.clipboard.writeText(link);
                await moveToAguardandoVistoria();
                toast.success("Link copiado!");
              }}>
                <Copy className="h-3.5 w-3.5 mr-1" />Copiar Link
              </Button>
                {(status === "reprovada" || status === "em_aprovacao") && (
                  <Button size="sm" variant="outline"
                    className={`rounded-none ${iaAnalisando ? "border-blue-400 text-blue-500 animate-pulse" : "border-amber-400 text-amber-600 hover:bg-amber-50"}`}
                    disabled={iaAnalisando}
                    onClick={async () => {
                      if (!vistoriaId) return;
                      setIaAnalisando(true);
                      try {
                        const res = await callEdge("gia-vistoria-ai-analise", { vistoria_id: vistoriaId, recurso: true });
                        if (res.sucesso) {
                          if (res.aprovada) {
                            setStatus("aprovada");
                            toast.success(`✅ Vistoria APROVADA! Score: ${res.score}/100`);
                          } else {
                            setStatus("reprovada");
                            toast.error(`Reprovada. Score: ${res.score}/100. ${res.motivo || ""}`, { duration: 8000 });
                          }
                        } else {
                          toast.error(res.error || "Erro na reanálise");
                        }
                      } catch { toast.error("Erro ao recorrer"); }
                      setIaAnalisando(false);
                    }}>
                    {iaAnalisando ? (
                      <><RotateCcw className="h-3.5 w-3.5 mr-1 animate-spin" />IA Analisando...</>
                    ) : (
                      <><RotateCcw className="h-3.5 w-3.5 mr-1" />Recorrer (IA reanalisar)</>
                    )}
                  </Button>
                )}
                {status === "reprovada" && (
                  <PedirLiberacaoButton
                    negociacaoId={deal.id}
                    onSuccess={(res) => {
                      if (res?.aprovado) {
                        setStatus("aprovada");
                        toast.success("Liberação aprovada! Vistoria liberada.");
                      }
                    }}
                  />
                )}
                {status === "reprovada" && (
                  <ExcecaoButton
                    negociacaoId={deal.id}
                    tipoDefault="vistoria_rejeitada"
                    label="Solicitar Exceção"
                    onSuccess={() => toast.success("Exceção solicitada!")}
                  />
                )}
                <Button size="sm" variant="outline" className="rounded-none border border-gray-300" onClick={async () => {
                  // Buscar fotos reais do banco com signed URLs (fallback se bucket privado)
                  const { data: fotosReais } = await (supabase as any).from("vistoria_fotos").select("*").eq("vistoria_id", vistoriaId).order("created_at");
                  const fotosLaudo = await Promise.all((fotosReais || []).map(async (f: any) => {
                    const { data: urlData } = supabase.storage.from("vistoria-fotos").getPublicUrl(f.storage_path);
                    let url = urlData.publicUrl;
                    // Testar se URL funciona, senão usar signed URL
                    try {
                      const test = await fetch(url, { method: "HEAD" });
                      if (!test.ok) throw new Error("not public");
                    } catch {
                      const { data: signed } = await supabase.storage.from("vistoria-fotos").createSignedUrl(f.storage_path, 600);
                      if (signed?.signedUrl) url = signed.signedUrl;
                    }
                    return {
                      titulo: (f.tipo || "").replace(/_/g, " "),
                      url,
                      lat: f.latitude ? String(f.latitude) : "",
                      lng: f.longitude ? String(f.longitude) : "",
                      data: f.captured_at ? new Date(f.captured_at).toLocaleString("pt-BR") : new Date(f.created_at).toLocaleString("pt-BR"),
                    };
                  }));

                  // Buscar dados atualizados do banco
                  const { data: negAtual } = await (supabase as any).from("negociacoes").select("*").eq("id", deal.id).maybeSingle();
                  const d = negAtual || deal;

                  await gerarLaudoVistoria({
                    dataImpressao: new Date().toLocaleString("pt-BR"),
                    contratante: "OBJETIVO AUTO BENEFÍCIOS",
                    logoUrl: `${window.location.origin}/logo-objetivo.png`,
                    configuracao: categoriaVistoria === "automovel" ? "Carro" : categoriaVistoria === "moto" ? "Moto" : "Caminhão",
                    solicitante: d.cooperativa || deal.cooperativa || "Objetivo Auto Benefícios",
                    vistoriador: d.consultor || deal.consultor || "Sistema",
                    proponente: { nome: d.lead_nome || deal.lead_nome, cpf: d.cpf_cnpj || "", telefone: d.telefone || "", email: d.email || "" },
                    veiculo: {
                      marcaModelo: d.veiculo_modelo || deal.veiculo_modelo,
                      anoModelo: d.ano_modelo || d.ano_fabricacao || "",
                      placa: d.veiculo_placa || deal.veiculo_placa,
                      chassi: d.chassi || "",
                      renavam: d.renavam || "",
                      gnv: "Não",
                      quilometragem: "",
                      chassiRemarcado: "Não",
                    },
                    observacoes: "",
                    acessorios: ["Air Bag", "Alarme", "Ar Condicionado", "Vidros Elétricos", "Travas Elétricas", "Direção Elétrica", "Freio ABS"],
                    parecer: status === "aprovada" ? "Aprovado" : status === "reprovada" ? "Reprovado" : "Pendente",
                    avaliador: "Sistema IA",
                    dataAnalise: new Date().toLocaleString("pt-BR"),
                    fotos: fotosLaudo.length > 0 ? fotosLaudo : selectedFotos.map(f => ({ titulo: f.replace(/_/g, " "), url: "", lat: "", lng: "", data: "" })),
                  } as any);
                  toast.success("Laudo de vistoria baixado!");
                }}>
                  <Download className="h-3.5 w-3.5 mr-1" />Laudo PDF
                </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fotos REAIS enviadas pelo lead */}
      {vistoriaReal?.id && <FotosReaisSection vistoriaId={vistoriaReal.id} />}

      {/* Seleção de fotos modelo (para novas vistorias) */}
      {!vistoriaReal?.fotos_enviadas && (
        <Card className="rounded-none border-2 border-border">
          <CardContent className="p-5">
            <VistoriaFotoSelector selected={selectedFotos} onChange={setSelectedFotos} tipoVeiculo={categoriaVistoria as any} />
          </CardContent>
        </Card>
      )}

      {/* Fluxo Web info */}
      {codigoGerado && codigo && (
        <Card className="rounded-none bg-primary/50 border-blue-200">
          <CardContent className="p-4 flex items-start gap-3">
            <Globe className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Link Público da Vistoria</p>
              <p className="text-xs text-primary mt-0.5">O cliente acessa este link no celular, tira as fotos pelo navegador com GPS e timestamp obrigatórios.</p>
              <div className="flex items-center gap-2 mt-2">
                <code className="text-[11px] bg-white border px-2 py-1 font-mono text-primary">{window.location.origin}/vistoria/{codigo}</code>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/vistoria/${codigo}`); toast.success("Link copiado!"); }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline de eventos */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-[#1A3A5C] border-b-2 border-[#747474] pb-1 w-full">HISTÓRICO DA VISTORIA</legend>
        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Nenhum evento registrado</p>
        ) : (
          <div className="relative pl-6 space-y-0">
            {timeline.map((ev, i) => {
              const Icon = tipoIconMap[ev.tipo] || Clock;
              const iconColor = tipoColorMap[ev.tipo] || "bg-gray-400 text-white";
              const isLast = i === timeline.length - 1;
              return (
                <div key={i} className="relative pb-4">
                  {!isLast && <div className="absolute left-[-14px] top-6 bottom-0 w-px bg-border" />}
                  <div className={`absolute left-[-22px] top-1 h-5 w-5 rounded-full flex items-center justify-center ${iconColor}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{ev.data}</span>
                      {ev.usuario && <span className="text-[10px] text-muted-foreground">• {ev.usuario}</span>}
                    </div>
                    <p className="text-sm mt-0.5">{ev.descricao}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </fieldset>
    </div>
  );
}
