import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PipelineDeal } from "./mockData";
import { supabase, callEdge } from "@/integrations/supabase/client";
import { gerarContratoPdf } from "@/lib/gerarContratoPdf";
import {
  PenTool, Mail, MessageSquare, FileText, CheckCircle, Clock,
  Eye, Send, AlertTriangle, Copy, ExternalLink, RotateCcw,
} from "lucide-react";

type AssinaturaStatus = "pendente" | "enviado" | "visualizado" | "assinado" | "expirado";

const statusConfig: Record<AssinaturaStatus, { label: string; color: string; icon: React.ElementType }> = {
  pendente: { label: "Pendente", color: "bg-gray-100 text-gray-700 border-gray-300", icon: Clock },
  enviado: { label: "Enviado", color: "bg-primary/8 text-primary border-blue-300", icon: Send },
  visualizado: { label: "Visualizado", color: "bg-warning/10 text-warning border-warning/30", icon: Eye },
  assinado: { label: "Assinado", color: "bg-success/10 text-success border-green-300", icon: CheckCircle },
  expirado: { label: "Expirado", color: "bg-destructive/8 text-destructive border-red-300", icon: AlertTriangle },
};

interface MockDocumento {
  id: string;
  nome: string;
  tipo: string;
  geradoEm: string;
}

const mockDocumentos: MockDocumento[] = [
  { id: "doc-1", nome: "Proposta de Adesão — Plano Completo", tipo: "Proposta", geradoEm: "05/03/2026 10:00" },
  { id: "doc-2", nome: "Contrato de Proteção Veicular", tipo: "Contrato", geradoEm: "05/03/2026 10:05" },
  { id: "doc-3", nome: "Termo de Adesão ao Regulamento", tipo: "Termo", geradoEm: "05/03/2026 10:05" },
];

interface TimelineEvent {
  data: string;
  descricao: string;
  tipo: "criacao" | "envio" | "visualizacao" | "assinatura" | "expiracao" | "reenvio";
}

const mockTimeline: TimelineEvent[] = [
  { data: "05/03/2026 10:10", descricao: "Documento de proposta selecionado para assinatura via Autentic", tipo: "criacao" },
  { data: "05/03/2026 10:12", descricao: "Envelope enviado ao cliente via e-mail (carlos.silva@email.com)", tipo: "envio" },
  { data: "05/03/2026 10:13", descricao: "Link de assinatura enviado via WhatsApp (11) 98000-0000", tipo: "envio" },
  { data: "05/03/2026 14:20", descricao: "Documento visualizado pelo signatário", tipo: "visualizacao" },
  { data: "06/03/2026 09:00", descricao: "Lembrete automático enviado por e-mail", tipo: "reenvio" },
  { data: "07/03/2026 08:45", descricao: "Aguardando assinatura — 2 dias restantes", tipo: "visualizacao" },
];

const tipoIcons: Record<string, React.ElementType> = {
  criacao: FileText, envio: Send, visualizacao: Eye,
  assinatura: CheckCircle, expiracao: AlertTriangle, reenvio: RotateCcw,
};
const tipoCores: Record<string, string> = {
  criacao: "bg-[#1A3A5C] text-white", envio: "bg-primary/60 text-white",
  visualizacao: "bg-warning/80 text-white", assinatura: "bg-success/80 text-white",
  expiracao: "bg-destructive/80 text-white", reenvio: "bg-primary/60 text-white",
};

interface Props { deal: PipelineDeal; }

export default function AssinaturaTab({ deal }: Props) {
  const [status, setStatus] = useState<AssinaturaStatus>("visualizado");
  const [docSelecionado, setDocSelecionado] = useState("doc-1");
  const [enviado, setEnviado] = useState(true);

  const st = statusConfig[status];
  const StIcon = st.icon;
  const doc = mockDocumentos.find(d => d.id === docSelecionado)!;

  const [linkAssinatura, setLinkAssinatura] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);

  const handleEnviar = async (canal: "email" | "whatsapp" | "ambos") => {
    setGerando(true);
    // Gerar PDF do contrato
    const pdfBlob = gerarContratoPdf({
      empresa: { nome: "Objetivo Auto Benefícios", cnpj: "58.506.161/0001-31" },
      associado: { nome: deal.lead_nome, cpf: deal.cpf_cnpj || "", rg: "", cnh: "", sexo: "", nascimento: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", cep: "", email: deal.email || "", celular: deal.telefone || "" },
      veiculo: { placa: deal.veiculo_placa, modelo: deal.veiculo_modelo, marca: "", anoFab: "", anoModelo: "", cor: "", combustivel: "", chassi: "", renavam: "", codFipe: "", valorFipe: deal.valor_plano || 0, valorProtegido: deal.valor_plano || 0, diaVencimento: "10", veiculoTrabalho: "Não" },
      plano: { nome: deal.plano || "Completo", valorMensal: deal.valor_plano || 0, adesao: 400, participacao: "5% FIPE" },
      produtos: ["Roubo", "Furto", "Colisão", "Incêndio", "Perda Total", "Assistência 24H", "Reboque", "Chaveiro", "Hospedagem"],
      consultor: { nome: deal.consultor || "", celular: "", email: "" },
    });

    // Converter blob pra base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const result = await callEdge("gia-gerar-contrato", { negociacao_id: deal.id, canal, pdf_base64: base64, telefone_associado: deal.telefone });
      setGerando(false);
      setEnviado(true);
      setStatus("enviado");
      if (result.sucesso === false) {
        toast.error(result.error || "Erro ao gerar contrato");
      } else {
        if (result.link_assinatura) setLinkAssinatura(result.link_assinatura);
        const msg = canal === "ambos" ? "e-mail e WhatsApp" : canal === "email" ? "e-mail" : "WhatsApp";
        toast.success(`Contrato enviado para assinatura via ${msg}!`);
      }
    };
    reader.readAsDataURL(pdfBlob);
  };

  const handleBaixarContrato = () => {
    const blob = gerarContratoPdf({
      empresa: { nome: "Objetivo Auto Benefícios", cnpj: "58.506.161/0001-31" },
      associado: { nome: deal.lead_nome, cpf: deal.cpf_cnpj || "", rg: "", cnh: "", sexo: "", nascimento: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", cep: "", email: deal.email || "", celular: deal.telefone || "" },
      veiculo: { placa: deal.veiculo_placa, modelo: deal.veiculo_modelo, marca: "", anoFab: "", anoModelo: "", cor: "", combustivel: "", chassi: "", renavam: "", codFipe: "", valorFipe: deal.valor_plano || 0, valorProtegido: deal.valor_plano || 0, diaVencimento: "10", veiculoTrabalho: "Não" },
      plano: { nome: deal.plano || "Completo", valorMensal: deal.valor_plano || 0, adesao: 400, participacao: "5% FIPE" },
      produtos: ["Roubo", "Furto", "Colisão", "Incêndio", "Perda Total", "Assistência 24H", "Reboque", "Chaveiro", "Hospedagem"],
      consultor: { nome: deal.consultor || "", celular: "", email: "" },
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Contrato-${deal.lead_nome.replace(/\s/g, "_")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Contrato baixado!");
  };

  const handleSimularAssinatura = async () => {
    setStatus("assinado");
    // Auto-transição: liberado_cadastro → concluido
    if (deal.stage === "liberado_cadastro") {
      await supabase.from("negociacoes").update({ stage: "concluido" } as any).eq("id", deal.id);
      await supabase.from("pipeline_transicoes").insert({
        negociacao_id: deal.id,
        stage_anterior: "liberado_cadastro",
        stage_novo: "concluido",
        motivo: "Contrato assinado",
        automatica: true,
      } as any);
    }
    toast.success("Assinatura confirmada! Negociação concluída.", { duration: 5000 });
  };

  const lbl = "text-sm font-semibold";

  return (
    <div className="space-y-5">
      {/* Card de status principal */}
      <Card className="rounded-none border-2" style={{ borderColor: status === "assinado" ? "#16a34a" : status === "expirado" ? "#dc2626" : "#1A3A5C" }}>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: status === "assinado" ? "#dcfce7" : status === "expirado" ? "#fef2f2" : "#e0e7ff" }}>
              <StIcon className="h-5 w-5" style={{ color: status === "assinado" ? "#16a34a" : status === "expirado" ? "#dc2626" : "#1A3A5C" }} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Assinatura Digital</h3>
              <p className="text-xs text-muted-foreground">Integração Autentic</p>
            </div>
            <Badge className={`rounded-none border ml-auto text-xs ${st.color}`}>{st.label}</Badge>
          </div>

          {enviado && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Envelope ID</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs">AUT-2026-{deal.codigo.split("-").pop()}</span>
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => { navigator.clipboard.writeText(`AUT-2026-${deal.codigo.split("-").pop()}`); toast.success("ID copiado!"); }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Negociação</span>
                <p className="font-mono text-xs">{deal.codigo}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Signatário</span>
                <p>{deal.lead_nome}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Validade</span>
                <p>12/03/2026 (7 dias)</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documento selecionado */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-[#1A3A5C] border-b-2 border-[#747474] pb-1 w-full">DOCUMENTO PARA ASSINATURA</legend>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className={lbl}>Documento</Label>
            <Select value={docSelecionado} onValueChange={setDocSelecionado}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>
                {mockDocumentos.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    <span className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" />{d.nome}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Tipo</Label>
            <div className="flex items-center h-10">
              <Badge variant="outline" className="rounded-none">{doc.tipo}</Badge>
              <span className="text-xs text-muted-foreground ml-2">Gerado em {doc.geradoEm}</span>
            </div>
          </div>
        </div>

        {/* Pré-visualização */}
        <Card className="rounded-none bg-muted/30 border-dashed">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">{doc.nome}</p>
                <p className="text-xs text-muted-foreground">PDF • 2 páginas • 145 KB</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="rounded-none" onClick={() => toast.info("Abrindo pré-visualização...")}>
              <ExternalLink className="h-3.5 w-3.5 mr-1" />Visualizar
            </Button>
          </CardContent>
        </Card>
      </fieldset>

      {/* Botões de envio */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-[#1A3A5C] border-b-2 border-[#747474] pb-1 w-full">ENVIAR PARA ASSINATURA</legend>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="rounded-none" onClick={handleBaixarContrato}>
            <FileText className="h-3.5 w-3.5 mr-1" />Baixar Contrato PDF
          </Button>
          <Button size="sm" variant="outline" className="rounded-none" onClick={() => handleEnviar("email")} disabled={gerando}>
            <Mail className="h-3.5 w-3.5 mr-1" />{gerando ? "Gerando..." : "Enviar por E-mail"}
          </Button>
          <Button size="sm" className="rounded-none bg-success hover:bg-success/90 text-white" onClick={() => handleEnviar("whatsapp")} disabled={gerando}>
            <MessageSquare className="h-3.5 w-3.5 mr-1" />{gerando ? "Gerando..." : "Enviar por WhatsApp"}
          </Button>
          <Button size="sm" className="rounded-none bg-[#1A3A5C] hover:bg-[#15304D] text-white" onClick={() => handleEnviar("ambos")} disabled={gerando}>
            <Send className="h-3.5 w-3.5 mr-1" />{gerando ? "Gerando..." : "Enviar E-mail + WhatsApp"}
          </Button>
        </div>
        {linkAssinatura && (
          <div className="bg-primary/5 border border-blue-200 rounded p-3 mt-2">
            <p className="text-xs font-semibold text-[#1A3A5C]">Link de Assinatura Digital (Autentique):</p>
            <code className="text-[10px] text-primary break-all">{linkAssinatura}</code>
            <div className="flex gap-2 mt-1">
              <Button size="sm" variant="ghost" className="text-xs h-6 rounded-none" onClick={() => { navigator.clipboard.writeText(linkAssinatura); toast.success("Link copiado!"); }}>
                <Copy className="h-3 w-3 mr-1" />Copiar
              </Button>
              <Button size="sm" variant="ghost" className="text-xs h-6 rounded-none" onClick={() => window.open(linkAssinatura, "_blank")}>
                <ExternalLink className="h-3 w-3 mr-1" />Abrir
              </Button>
            </div>
          </div>
        )}
        {status !== "assinado" && enviado && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" className="rounded-none" onClick={() => { setStatus("enviado"); toast.info("Lembrete reenviado!"); }}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />Reenviar Lembrete
            </Button>
            <Button size="sm" variant="ghost" className="rounded-none text-xs text-success border border-green-200" onClick={handleSimularAssinatura}>
              <PenTool className="h-3.5 w-3.5 mr-1" />Simular Assinatura (demo)
            </Button>
          </div>
        )}
        {status === "assinado" && (
          <Card className="rounded-none bg-success/8 border-green-200">
            <CardContent className="p-3 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-success shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-900">Documento assinado com sucesso!</p>
                <p className="text-xs text-success">Negociação movida automaticamente para "Vendas Concretizadas".</p>
              </div>
            </CardContent>
          </Card>
        )}
      </fieldset>

      {/* Timeline */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-[#1A3A5C] border-b-2 border-[#747474] pb-1 w-full">HISTÓRICO DA ASSINATURA</legend>
        <div className="relative pl-6 space-y-0">
          {mockTimeline.map((ev, i) => {
            const Icon = tipoIcons[ev.tipo] || Clock;
            const iconColor = tipoCores[ev.tipo] || "bg-gray-400 text-white";
            const isLast = i === mockTimeline.length - 1;
            return (
              <div key={i} className="relative pb-4">
                {!isLast && <div className="absolute left-[-14px] top-6 bottom-0 w-px bg-border" />}
                <div className={`absolute left-[-22px] top-1 h-5 w-5 rounded-full flex items-center justify-center ${iconColor}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div>
                  <span className="text-xs font-mono text-muted-foreground">{ev.data}</span>
                  <p className="text-sm mt-0.5">{ev.descricao}</p>
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
