import { useState } from "react";
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
  const [prazo, setPrazo] = useState("7");
  const [selectedFotos, setSelectedFotos] = useState<string[]>([
    "frente","traseira","lateral_esquerda","lateral_direita","interior_painel",
    "banco_dianteiro","banco_traseiro","motor_capo","porta_malas","rodas_pneus",
    "chave","chassi","quilometragem"
  ]);
  const [categoriaVistoria] = useState<string>("automovel");

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
    // Validar TODOS os dados obrigatórios antes de solicitar vistoria
    const faltando: string[] = [];
    // Associado
    if (!deal.lead_nome?.trim()) faltando.push("Nome do Lead (Associado)");
    if (!deal.cpf_cnpj?.trim()) faltando.push("CPF/CNPJ (Associado)");
    if (!deal.telefone?.trim()) faltando.push("Telefone (Associado)");
    if (!deal.email?.trim()) faltando.push("E-mail (Associado)");
    // Veículo
    if (!deal.veiculo_placa?.trim()) faltando.push("Placa do Veículo");
    if (!deal.veiculo_modelo?.trim()) faltando.push("Modelo do Veículo");
    // Circulação
    if (!deal.cidade_circulacao?.trim()) faltando.push("Cidade de Circulação");
    if (!deal.estado_circulacao?.trim()) faltando.push("Estado de Circulação");

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
        placa: deal.veiculo_placa,
        modelo: deal.veiculo_modelo,
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
    const msgTexto = `Olá ${deal.lead_nome}! Segue o link para envio das fotos da vistoria do seu veículo ${deal.veiculo_placa}:\n\n${link}\n\nAbra no celular, permita câmera e localização, e envie todas as 14 fotos solicitadas.\n\nObjetivo Auto Benefícios`;
    callEdge("gia-enviar-notificacao", {
      tipo: "ambos",
      telefone: deal.telefone,
      email: deal.email,
      nome: deal.lead_nome,
      assunto: `Vistoria Veicular - ${deal.veiculo_placa}`,
      mensagem: msgTexto,
    }).then(res => {
      if (res.sms?.sucesso) toast.success("SMS enviado ao associado!");
      if (res.email?.sucesso) toast.success("E-mail enviado ao associado!");
      if (!res.sms?.sucesso && !res.email?.sucesso) toast.info("Envio automático indisponível. Use os botões abaixo.");
    }).catch(() => {});

    // Abrir WhatsApp também
    const tel = (deal.telefone || "").replace(/\D/g, "");
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
                {status === "reprovada" && isAdmin && (
                  <Button size="sm" className="rounded-none bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAprovar}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />Aprovar (Exceção)
                  </Button>
                )}
                {status === "reprovada" && !isAdmin && (
                  <Badge variant="outline" className="rounded-none text-xs text-destructive border-red-300">
                    <AlertCircle className="h-3 w-3 mr-1" />Reprovada pela IA — solicite exceção ao diretor
                  </Badge>
                )}
                <Button size="sm" variant="outline" className="rounded-none border border-gray-300" onClick={async () => {
                  await gerarLaudoVistoria({
                    dataImpressao: new Date().toLocaleString("pt-BR"),
                    contratante: "OBJETIVO AUTO BENEFÍCIOS",
                    configuracao: categoriaVistoria === "automovel" ? "Carro" : categoriaVistoria === "motocicleta" ? "Moto" : "Caminhão",
                    solicitante: deal.cooperativa || "Objetivo Auto Benefícios",
                    vistoriador: deal.consultor || "Sistema",
                    proponente: { nome: deal.lead_nome, cpf: deal.cpf_cnpj || "", telefone: deal.telefone || "", email: deal.email || "" },
                    veiculo: {
                      marcaModelo: deal.veiculo_modelo,
                      anoModelo: "",
                      placa: deal.veiculo_placa,
                      chassi: "",
                      renavam: "",
                      gnv: "Não",
                      quilometragem: "",
                      chassiRemarcado: "Não",
                    },
                    observacoes: "",
                    acessorios: ["Air Bag", "Alarme", "Ar Condicionado", "Vidros Elétricos", "Travas Elétricas", "Direção Elétrica", "Freio ABS"],
                    parecer: status === "aprovada" ? "Aprovado" : status === "reprovada" ? "Reprovado" : "Pendente",
                    avaliador: "Sistema IA",
                    dataAnalise: new Date().toLocaleString("pt-BR"),
                    fotos: selectedFotos.map(f => ({ titulo: f.replace(/_/g, " "), url: "", lat: "", lng: "", data: new Date().toLocaleString("pt-BR") })),
                  });
                  toast.success("Laudo de vistoria baixado!");
                }}>
                  <Download className="h-3.5 w-3.5 mr-1" />Laudo PDF
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seleção de fotos */}
      <Card className="rounded-none border-2 border-border">
        <CardContent className="p-5">
          <VistoriaFotoSelector selected={selectedFotos} onChange={setSelectedFotos} />
        </CardContent>
      </Card>

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
