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

// Componente que mostra fotos REAIS enviadas pelo lead
function FotosReaisSection({ vistoriaId }: { vistoriaId: string }) {
  const [fotos, setFotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase as any).from("vistoria_fotos").select("*").eq("vistoria_id", vistoriaId).order("created_at")
      .then(({ data }: any) => { setFotos(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [vistoriaId]);

  if (loading) return null;
  if (fotos.length === 0) return null;

  return (
    <Card className="rounded-none border-2 border-green-500/30 bg-green-500/5">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Camera className="h-4 w-4 text-green-500" />
          <span className="text-sm font-bold text-green-700 dark:text-green-400">FOTOS ENVIADAS PELO ASSOCIADO</span>
          <Badge className="bg-green-500/15 text-green-600 text-xs">{fotos.length} fotos</Badge>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {fotos.map((foto: any) => {
            const { data: urlData } = supabase.storage.from("vistoria-fotos").getPublicUrl(foto.storage_path);
            return (
              <div key={foto.id} className="relative aspect-square rounded-lg overflow-hidden border-2 border-green-500/20 group">
                <img src={urlData.publicUrl} alt={foto.tipo} className="w-full h-full object-cover" />
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface Props { deal: PipelineDeal; }

export default function VistoriaTab({ deal }: Props) {
  const { isAdmin } = usePermission();

  // Buscar vistoria real do banco
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
    }
  });

  // Buscar timeline real do pipeline_transicoes
  const { data: timelineReal } = useQuery({
    queryKey: ["vistoria_timeline", deal.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("pipeline_transicoes" as any)
        .select("*")
        .eq("negociacao_id", deal.id)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    }
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
  const [selectedFotos, setSelectedFotos] = useState<string[]>([
    "frente","traseira","lateral_esquerda","lateral_direita","interior_painel",
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

  const handleSolicitar = async () => {
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
      return;
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
      return;
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
    toast.success("Vistoria criada! Link copiado. Enviando SMS e e-mail...", { duration: 5000 });

    // Enviar SMS + Email via ClickSend
    const msgTexto = `Olá ${d.lead_nome || deal.lead_nome}! Segue o link para envio das fotos da vistoria do seu veículo ${d.veiculo_placa || deal.veiculo_placa}:\n\n${link}\n\nAbra no celular, permita câmera e localização, e envie todas as 14 fotos solicitadas.\n\nObjetivo Auto Benefícios`;
    callEdge("gia-enviar-notificacao", {
      tipo: "ambos",
      telefone: d.telefone || deal.telefone,
      email: d.email || deal.email,
      nome: d.lead_nome || deal.lead_nome,
      assunto: `Vistoria Veicular - ${d.veiculo_placa || deal.veiculo_placa}`,
      mensagem: msgTexto,
    }).then(res => {
      if (res.sms?.sucesso) toast.success("SMS enviado ao associado!");
      if (res.email?.sucesso) toast.success("E-mail enviado ao associado!");
      if (!res.sms?.sucesso && !res.email?.sucesso) toast.info("Envio automático indisponível. Use os botões abaixo.");
    }).catch(() => {});

    // Abrir WhatsApp também
    const tel = (d.telefone || deal.telefone || "").replace(/\D/g, "");
    if (tel) {
      const msg = encodeURIComponent(msgTexto);
      window.open(`https://wa.me/55${tel}?text=${msg}`, "_blank");
    }
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

          {/* Ações */}
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t-2 border-[#747474]">
            {!codigoGerado ? (
              <Button size="sm" className="rounded-none bg-[#1A3A5C] hover:bg-[#15304D] text-white" onClick={handleSolicitar}>
                <ClipboardCheck className="h-3.5 w-3.5 mr-1" />Solicitar Vistoria
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" className="rounded-none border border-gray-300" onClick={() => {
                  const tel = (deal.telefone || "").replace(/\D/g, "");
                  const link = `${window.location.origin}/vistoria/${codigo}`;
                  const msg = encodeURIComponent(`Olá ${deal.lead_nome}! Segue o link para envio das fotos da vistoria do veículo ${deal.veiculo_placa}:\n\n${link}\n\nAbra no celular, permita câmera e localização, e envie as fotos.`);
                  window.open(`https://wa.me/55${tel}?text=${msg}`, "_blank");
                  toast.success("WhatsApp aberto!");
                }}>
                  <MessageSquare className="h-3.5 w-3.5 mr-1" />Enviar WhatsApp
                </Button>
                <Button size="sm" className="rounded-none bg-[#1A3A5C] hover:bg-[#15304D] text-white" onClick={() => {
                  const link = `${window.location.origin}/vistoria/${codigo}`;
                  const msgTexto = `Olá ${deal.lead_nome}! Segue o link para envio das fotos da vistoria do veículo ${deal.veiculo_placa}:\n\n${link}\n\nAbra no celular, permita câmera e localização.\n\nObjetivo Auto Benefícios`;
                  callEdge("gia-enviar-notificacao", {
                    tipo: "ambos",
                    telefone: deal.telefone,
                    email: deal.email,
                    nome: deal.lead_nome,
                    assunto: `Vistoria Veicular - ${deal.veiculo_placa}`,
                    mensagem: msgTexto,
                  }).then(res => {
                    if (res.sms?.sucesso) toast.success("SMS enviado!");
                    if (res.email?.sucesso) toast.success("E-mail enviado!");
                    if (!res.sms?.sucesso && !res.email?.sucesso) toast.error("Falha no envio. Use WhatsApp ou copie o link.");
                  }).catch(() => toast.error("Erro no envio."));
                  toast.info("Enviando SMS + E-mail...");
                }}>
                  <Mail className="h-3.5 w-3.5 mr-1" />Enviar SMS + E-mail
                </Button>
                <Button size="sm" variant="outline" className="rounded-none border border-gray-300" onClick={() => {
                  const link = `${window.location.origin}/vistoria/${codigo}`;
                  navigator.clipboard.writeText(link);
                  toast.success("Link copiado!");
                }}>
                  <Copy className="h-3.5 w-3.5 mr-1" />Copiar Link
                </Button>
                {status === "reprovada" && (
                  <Button size="sm" variant="outline" className="rounded-none border-amber-400 text-amber-600 hover:bg-amber-50" onClick={async () => {
                    if (!vistoriaId) return;
                    toast.info("Reanalisando vistoria com critérios revisados...");
                    try {
                      const res = await callEdge("gia-vistoria-ai-analise", { vistoria_id: vistoriaId, recurso: true });
                      if (res.sucesso) {
                        if (res.aprovada) {
                          setStatus("aprovada");
                          toast.success("Vistoria APROVADA após recurso!");
                        } else {
                          toast.error(`Mantida como reprovada. Score: ${res.score}/100. ${res.motivo || ""}`);
                        }
                      } else {
                        toast.error(res.error || "Erro na reanálise");
                      }
                    } catch { toast.error("Erro ao recorrer"); }
                  }}>
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />Recorrer (IA reanalisar)
                  </Button>
                )}
                {status === "reprovada" && isAdmin && (
                  <Button size="sm" className="rounded-none bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAprovar}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />Aprovar (Exceção)
                  </Button>
                )}
                {status === "reprovada" && !isAdmin && (
                  <ExcecaoButton
                    negociacaoId={deal.id}
                    tipoDefault="vistoria_rejeitada"
                    label="Peça a um Diretor"
                    onSuccess={() => toast.success("Exceção solicitada!")}
                  />
                )}
                <Button size="sm" variant="outline" className="rounded-none border border-gray-300" onClick={async () => {
                  // Buscar fotos reais do banco
                  const { data: fotosReais } = await (supabase as any).from("vistoria_fotos").select("*").eq("vistoria_id", vistoriaId).order("created_at");
                  const fotosLaudo = (fotosReais || []).map((f: any) => {
                    const { data: urlData } = supabase.storage.from("vistoria-fotos").getPublicUrl(f.storage_path);
                    return {
                      titulo: (f.tipo || "").replace(/_/g, " "),
                      url: urlData.publicUrl,
                      lat: f.latitude || "",
                      lng: f.longitude || "",
                      data: f.captured_at ? new Date(f.captured_at).toLocaleString("pt-BR") : new Date(f.created_at).toLocaleString("pt-BR"),
                    };
                  });

                  // Buscar dados atualizados do banco
                  const { data: negAtual } = await (supabase as any).from("negociacoes").select("*").eq("id", deal.id).maybeSingle();
                  const d = negAtual || deal;

                  await gerarLaudoVistoria({
                    dataImpressao: new Date().toLocaleString("pt-BR"),
                    contratante: "OBJETIVO AUTO BENEFÍCIOS",
                    logoUrl: "https://objetivoauto.com.br/wp-content/uploads/2025/11/IMG_1299.png",
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
              </>
            )}
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
