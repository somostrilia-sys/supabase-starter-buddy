import { useState } from "react";
import VistoriaFotoSelector from "@/components/VistoriaFotoSelector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PipelineDeal } from "./mockData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermission } from "@/hooks/usePermission";
import {
  ClipboardCheck, Copy, Link2, MessageSquare, CheckCircle, XCircle,
  Clock, AlertCircle, Camera, Globe, RotateCcw, Download, Eye,
} from "lucide-react";

type VistoriaStatus = "pendente" | "em_aprovacao" | "aprovada" | "reprovada";

const statusConfig: Record<VistoriaStatus, { label: string; color: string; icon: React.ElementType }> = {
  pendente: { label: "Pendente", color: "bg-amber-100 text-amber-800 border-amber-300", icon: Clock },
  em_aprovacao: { label: "Em Aprovação", color: "bg-blue-100 text-blue-800 border-blue-300", icon: Eye },
  aprovada: { label: "Aprovada", color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle },
  reprovada: { label: "Reprovada", color: "bg-red-100 text-red-800 border-red-300", icon: XCircle },
};

interface TimelineEvent {
  data: string;
  descricao: string;
  tipo: "solicitacao" | "envio" | "analise" | "resultado" | "reenvio";
  usuario?: string;
}

const mockTimeline: TimelineEvent[] = [
  { data: "05/03/2026 09:15", descricao: "Vistoria solicitada pelo comercial", tipo: "solicitacao", usuario: "João Silva" },
  { data: "05/03/2026 09:16", descricao: "Código VST-2026-0042 gerado e enviado ao cliente via WhatsApp", tipo: "envio" },
  { data: "05/03/2026 14:30", descricao: "Fotos enviadas pelo cliente via App Visto", tipo: "envio", usuario: "Cliente" },
  { data: "05/03/2026 15:00", descricao: "Vistoria encaminhada para análise", tipo: "analise", usuario: "Sistema" },
  { data: "06/03/2026 10:20", descricao: "Reprovada — foto do chassi ilegível", tipo: "resultado", usuario: "Ana Pereira" },
  { data: "06/03/2026 11:00", descricao: "Solicitado reenvio das fotos do chassi e motor", tipo: "reenvio", usuario: "João Silva" },
  { data: "06/03/2026 16:45", descricao: "Novas fotos enviadas pelo cliente via link web", tipo: "envio", usuario: "Cliente" },
  { data: "07/03/2026 08:30", descricao: "Vistoria em análise (2ª tentativa)", tipo: "analise", usuario: "Sistema" },
];

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
  analise: "bg-blue-500 text-white",
  resultado: "bg-red-500 text-white",
  reenvio: "bg-amber-500 text-white",
};

interface Props { deal: PipelineDeal; }

export default function VistoriaTab({ deal }: Props) {
  const { isAdmin } = usePermission();
  const [codigoGerado, setCodigoGerado] = useState(true); // mock: já gerado
  const [codigo] = useState("VST-2026-0042");
  const [status, setStatus] = useState<VistoriaStatus>("em_aprovacao");
  const [prazo, setPrazo] = useState("7");
  const [selectedFotos, setSelectedFotos] = useState<string[]>([
    "frente","traseira","lateral_esquerda","lateral_direita","interior_painel",
    "banco_dianteiro","banco_traseiro","teto","motor_capo","porta_malas","rodas_pneus","documentos"
  ]);
  const [tentativa] = useState(2);

  // Categoria para carregar template
  const [categoriaVistoria, setCategoriaVistoria] = useState<string>("automovel");
  const [itensConcluidoIds, setItensConcluidoIds] = useState<string[]>([]);

  // Buscar template por categoria
  const { data: templateData } = useQuery({
    queryKey: ["vistoria_template", categoriaVistoria],
    enabled: !!categoriaVistoria,
    queryFn: async () => {
      const { data: cats } = await supabase
        .from("categorias_veiculo" as any)
        .select("id")
        .eq("nome", categoriaVistoria)
        .maybeSingle();
      if (!cats) return null;
      const { data: tmpl } = await supabase
        .from("vistoria_templates" as any)
        .select("id, nome_template, vistoria_itens(id, nome_item, obrigatorio)")
        .eq("categoria_id", (cats as any).id)
        .maybeSingle();
      return tmpl as { id: string; nome_template: string; vistoria_itens: { id: string; nome_item: string; obrigatorio: boolean }[] } | null;
    }
  });

  const itens = templateData?.vistoria_itens || [];
  const itensObrigatorios = itens.filter(i => i.obrigatorio);
  const itensObrigatoriosPendentes = itensObrigatorios.filter(i => !itensConcluidoIds.includes(i.id));

  const handleAprovar = () => {
    if (itensObrigatoriosPendentes.length > 0) {
      toast.error(`Conclua os ${itensObrigatoriosPendentes.length} item(s) obrigatório(s) antes de aprovar`);
      return;
    }
    setStatus("aprovada");
    toast.success("Vistoria aprovada!");
  };

  const handleReprovar = () => { setStatus("reprovada"); toast.error("Vistoria reprovada."); };

  const toggleItem = (id: string) => {
    setItensConcluidoIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const st = statusConfig[status];
  const StIcon = st.icon;

  const handleSolicitar = () => {
    setCodigoGerado(true);
    toast.success("Código de vistoria gerado e enviado ao cliente!");
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(codigo);
    toast.success("Código copiado!");
  };

  // handleAprovar and handleReprovar defined above (with template validation)

  const lbl = "text-sm font-semibold font-['Source_Serif_4']";

  return (
    <div className="space-y-5">
      {/* Card de status principal */}
      <Card className="rounded-none border-2" style={{ borderColor: status === "aprovada" ? "#16a34a" : status === "reprovada" ? "#dc2626" : "#1A3A5C" }}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <StIcon className="h-6 w-6" style={{ color: status === "aprovada" ? "#16a34a" : status === "reprovada" ? "#dc2626" : "#1A3A5C" }} />
                <h3 className="text-lg font-bold font-['Source_Serif_4']">Vistoria da Negociação</h3>
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
                    <p className="text-sm">05/03/2026 09:15</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Tentativa atual</span>
                    <p className="text-sm font-semibold">{tentativa}ª tentativa</p>
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
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
            {!codigoGerado ? (
              <Button size="sm" className="rounded-none bg-[#1A3A5C] hover:bg-[#15304D] text-white" onClick={handleSolicitar}>
                <ClipboardCheck className="h-3.5 w-3.5 mr-1" />Solicitar Vistoria
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" className="rounded-none" onClick={() => toast.success("Código reenviado via WhatsApp!")}>
                  <MessageSquare className="h-3.5 w-3.5 mr-1" />Reenviar WhatsApp
                </Button>
                <Button size="sm" variant="outline" className="rounded-none" onClick={() => toast.success("Link web copiado!")}>
                  <Globe className="h-3.5 w-3.5 mr-1" />Gerar Link Web
                </Button>
                <Button size="sm" variant="outline" className="rounded-none" onClick={() => toast.info("Solicitado reenvio de fotos ao cliente.")}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />Solicitar Reenvio
                </Button>
                {status !== "aprovada" && (
                  <>
                    <Button size="sm" className="rounded-none bg-green-600 hover:bg-green-700 text-white" onClick={handleAprovar}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />Aprovar
                    </Button>
                    <Button size="sm" variant="destructive" className="rounded-none" onClick={handleReprovar}>
                      <XCircle className="h-3.5 w-3.5 mr-1" />Reprovar
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline" className="rounded-none" onClick={() => toast.info("Gerando laudo PDF...")}>
                  <Download className="h-3.5 w-3.5 mr-1" />Laudo PDF
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Template de Vistoria por Categoria */}
      <Card className="rounded-none border-2 border-[hsl(210_30%_88%)]">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-bold font-['Source_Serif_4']">Template de Vistoria</p>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Categoria:</Label>
              <Select value={categoriaVistoria} onValueChange={setCategoriaVistoria}>
                <SelectTrigger className="rounded-none h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="automovel">Automóvel</SelectItem>
                  <SelectItem value="motocicleta">Motocicleta</SelectItem>
                  <SelectItem value="pesado">Pesado</SelectItem>
                </SelectContent>
              </Select>
              {isAdmin && (
                <Badge variant="outline" className="text-[9px] rounded-none">Admin: pode editar templates</Badge>
              )}
            </div>
          </div>
          {itens.length > 0 ? (
            <div className="space-y-1">
              {itensObrigatoriosPendentes.length > 0 && (
                <p className="text-xs text-amber-600 font-medium">{itensObrigatoriosPendentes.length} item(s) obrigatório(s) pendente(s)</p>
              )}
              {itens.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/30">
                  <Checkbox
                    checked={itensConcluidoIds.includes(item.id)}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <span className="text-sm flex-1">{item.nome_item}</span>
                  {item.obrigatorio && <Badge variant="outline" className="text-[9px] text-red-600 border-red-200 rounded-none">Obrigatório</Badge>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhum template cadastrado para esta categoria.</p>
          )}
        </CardContent>
      </Card>

      {/* Seleção de fotos */}
      <Card className="rounded-none border-2 border-[hsl(210_30%_88%)]">
        <CardContent className="p-5">
          <VistoriaFotoSelector selected={selectedFotos} onChange={setSelectedFotos} />
        </CardContent>
      </Card>

      {/* Fluxo Web info */}
      <Card className="rounded-none bg-blue-50/50 border-blue-200">
        <CardContent className="p-4 flex items-start gap-3">
          <Globe className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold font-['Source_Serif_4'] text-blue-900">Fluxo Web Alternativo</p>
            <p className="text-xs text-blue-700 mt-0.5">O cliente pode acessar o link abaixo, tirar fotos pelo navegador e submeter diretamente — sem necessidade de instalar o aplicativo.</p>
            <div className="flex items-center gap-2 mt-2">
              <code className="text-[11px] bg-white border px-2 py-1 font-mono text-blue-800">https://vistoria.objetiva.app/v/{codigo}</code>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(`https://vistoria.objetiva.app/v/${codigo}`); toast.success("Link copiado!"); }}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline de eventos */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-bold font-['Source_Serif_4'] text-[#1A3A5C] border-b pb-1 w-full">HISTÓRICO DA VISTORIA</legend>
        <div className="relative pl-6 space-y-0">
          {mockTimeline.map((ev, i) => {
            const Icon = tipoIconMap[ev.tipo] || Clock;
            const iconColor = tipoColorMap[ev.tipo] || "bg-gray-400 text-white";
            const isLast = i === mockTimeline.length - 1;
            return (
              <div key={i} className="relative pb-4">
                {/* Vertical line */}
                {!isLast && <div className="absolute left-[-14px] top-6 bottom-0 w-px bg-border" />}
                {/* Icon dot */}
                <div className={`absolute left-[-22px] top-1 h-5 w-5 rounded-full flex items-center justify-center ${iconColor}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{ev.data}</span>
                    {ev.usuario && <span className="text-[10px] text-muted-foreground">• {ev.usuario}</span>}
                  </div>
                  <p className="text-sm font-['Source_Serif_4'] mt-0.5">{ev.descricao}</p>
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
