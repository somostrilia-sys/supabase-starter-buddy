import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PipelineDeal, mockActivities, planos } from "./mockData";
import AssociadoTab from "./AssociadoTab";
import CotacaoTab from "./CotacaoTab";
import VistoriaTab from "./VistoriaTab";
import AssinaturaTab from "./AssinaturaTab";
import FinanceiroNegociacaoTab from "./FinanceiroNegociacaoTab";
import TagsInline from "@/components/TagsInline";
import DocumentoUpload from "@/components/DocumentoUpload";
import { supabase, callEdge } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FileText, User, Car, ClipboardCheck, Send, Activity, PenTool, Wallet,
  Phone, Mail, MessageSquare, Video, Plus, Download, CheckCircle, XCircle,
  Clock, Image, Archive,
} from "lucide-react";

interface Props {
  deal: PipelineDeal;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onUpdate?: () => void;
}

const tipoIcons: Record<string, React.ElementType> = { "Ligação": Phone, Email: Mail, WhatsApp: MessageSquare, Reunião: Video, Visita: User };

const mockGestaoHistory = [
  { campo: "Associado", status: "Enviado", data: "01/03/2026 14:30", erro: null },
  { campo: "Veículo", status: "Erro", data: "01/03/2026 14:31", erro: "Placa não encontrada" },
  { campo: "Financeiro", status: "Pendente", data: "—", erro: null },
];

const MOTIVOS_ARQUIVAR = ["Teste", "Erro de cadastro", "Cancelamento pelo cliente", "Duplicidade", "Sem interesse", "Outro"];

export default function DealDetailModal({ deal, open, onOpenChange, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState("cotacao");
  const [historicoReal, setHistoricoReal] = useState<any[]>([]);
  const [showArquivar, setShowArquivar] = useState(false);
  const [motivoArquivar, setMotivoArquivar] = useState("");

  async function handleArquivar() {
    if (!motivoArquivar) { toast("Selecione um motivo"); return; }
    await supabase.from("negociacoes").update({ stage: "perdido" } as any).eq("id", deal.id);
    await supabase.from("pipeline_transicoes").insert({
      negociacao_id: deal.id, stage_anterior: deal.stage, stage_novo: "perdido",
      motivo: `Arquivado: ${motivoArquivar}`, automatica: false,
    } as any);
    toast.success("Card arquivado");
    setShowArquivar(false);
    onUpdate?.();
    onOpenChange(false);
  }

  React.useEffect(() => {
    if (!deal.id || deal.id.startsWith("p")) return;
    supabase.from("pipeline_transicoes" as any).select("*").eq("negociacao_id", deal.id)
      .order("created_at", { ascending: false }).then(({ data }) => setHistoricoReal(data || []));
  }, [deal.id]);

  const tabs = [
    { v: "cotacao", l: "Cotação", i: FileText },
    { v: "associado", l: "Associado", i: User },
    { v: "veiculo", l: "Veículo", i: Car },
    { v: "documentos", l: "Documentos", i: Image },
    { v: "vistoria", l: "Vistoria", i: ClipboardCheck },
    { v: "assinatura", l: "Assinatura", i: PenTool },
    { v: "financeiro", l: "Financeiro", i: Wallet },
    { v: "sga", l: "Gestão", i: Send },
    { v: "atividades", l: "Atividades", i: Activity },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] p-0 gap-0 flex flex-col rounded-none">
        {/* Header com nome e código */}
        <DialogHeader className="px-6 pt-5 pb-3 border-b" style={{ backgroundColor: "#1A3A5C" }}>
          <DialogTitle className="flex items-center gap-3 text-white flex-wrap">
            <span>{deal.lead_nome}</span>
            <Badge variant="outline" className="text-[10px] font-mono border-white/30 text-white/80 rounded-none">{deal.codigo}</Badge>
            <Badge variant="outline" className="text-xs border-white/30 text-white/80 rounded-none">{deal.veiculo_modelo}</Badge>
            <Badge className="text-[10px] font-mono bg-white/15 text-white rounded-none">{deal.veiculo_placa}</Badge>
            <Button size="sm" variant="ghost" className="ml-auto text-white/60 hover:text-white hover:bg-white/10 text-xs rounded-none h-7" onClick={() => setShowArquivar(!showArquivar)}>
              <Archive className="h-3 w-3 mr-1" />Arquivar
            </Button>
          </DialogTitle>
        </DialogHeader>

        {showArquivar && (
          <div className="px-6 py-3 bg-destructive/10 border-b flex items-center gap-3">
            <span className="text-sm font-semibold text-destructive">Arquivar negociação:</span>
            <Select value={motivoArquivar} onValueChange={setMotivoArquivar}>
              <SelectTrigger className="w-48 h-8 text-xs rounded-none"><SelectValue placeholder="Motivo" /></SelectTrigger>
              <SelectContent>{MOTIVOS_ARQUIVAR.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" variant="destructive" className="rounded-none text-xs h-8" onClick={handleArquivar}>Confirmar</Button>
            <Button size="sm" variant="ghost" className="rounded-none text-xs h-8" onClick={() => setShowArquivar(false)}>Cancelar</Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-3 justify-start flex-wrap gap-1">
            {tabs.map(t => (
              <TabsTrigger key={t.v} value={t.v} className="text-xs gap-1.5">
                <t.i className="h-3.5 w-3.5" />{t.l}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 flex overflow-hidden" style={{ maxHeight: 'calc(92vh - 140px)' }}>
          <ScrollArea className="flex-1 px-6 py-4 overflow-y-auto">
            {/* TAB 1 - Cotação */}
            <TabsContent value="cotacao" className="mt-0">
              <CotacaoTab deal={deal} />
            </TabsContent>
            <TabsContent value="associado" className="mt-0">
              <AssociadoTab deal={deal} />
            </TabsContent>

            {/* TAB 3 - Veículo (dados reais da placa) */}
            <TabsContent value="veiculo" className="mt-0 space-y-4">
              <VeiculoTabInline deal={deal} />
              <div className="border-t-2 border-[#747474] pt-4 space-y-3">
                <h4 className="text-sm font-semibold">Envio para Sistemas</h4>
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-none bg-[#1A3A5C] hover:bg-[#15304D] text-white"><Send className="h-3.5 w-3.5 mr-1" />Enviar para Gestão</Button>
                  <Button size="sm" variant="outline" className="rounded-none"><MessageSquare className="h-3.5 w-3.5 mr-1" />WhatsApp</Button>
                  <Button size="sm" variant="outline" className="rounded-none"><Mail className="h-3.5 w-3.5 mr-1" />E-mail</Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB - Documentos OCR */}
            <TabsContent value="documentos" className="mt-0 space-y-3">
              <p className="text-xs text-muted-foreground">Anexe CNH e CRLV para preenchimento automático dos dados do associado e veículo.</p>
              <DocumentoUpload negociacaoId={deal.id} tipo="cnh" onDadosExtraidos={async (dados) => {
                await supabase.from("negociacoes").update({
                  lead_nome: dados.nome || deal.lead_nome,
                  cpf_cnpj: dados.cpf || deal.cpf_cnpj,
                } as any).eq("id", deal.id);
                toast.success("Dados do associado preenchidos automaticamente");
              }} />
              <DocumentoUpload negociacaoId={deal.id} tipo="crlv" onDadosExtraidos={async (dados) => {
                await supabase.from("negociacoes").update({
                  veiculo_placa: dados.placa || deal.veiculo_placa,
                  veiculo_modelo: dados.modelo || deal.veiculo_modelo,
                } as any).eq("id", deal.id);
                toast.success("Dados do veículo preenchidos automaticamente");
              }} />
            </TabsContent>

            {/* TAB - Vistoria */}
            <TabsContent value="vistoria" className="mt-0">
              <VistoriaTab deal={deal} />
            </TabsContent>

            {/* TAB 5 - Assinatura */}
            <TabsContent value="assinatura" className="mt-0">
              <AssinaturaTab deal={deal} />
            </TabsContent>

            {/* TAB 6 - Financeiro */}
            <TabsContent value="financeiro" className="mt-0">
              <FinanceiroNegociacaoTab deal={deal} />
            </TabsContent>

            {/* TAB 7 - SGA */}
            <TabsContent value="sga" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="">Regional Gestão</Label>
                  <Select defaultValue={deal.regional}><SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                    <SelectContent>{["SP Capital", "Interior SP", "RJ", "MG"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="">Cooperativa Gestão</Label>
                  <Select defaultValue={deal.cooperativa}><SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                    <SelectContent>{["Coop Norte", "Coop Sul", "Coop Leste"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="">Conta Bancária</Label>
                  <Select><SelectTrigger className="rounded-none"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent><SelectItem value="bb">Banco do Brasil - CC 12345-6</SelectItem><SelectItem value="itau">Itaú - CC 78901-2</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="">Vencimento Mensalidade</Label>
                  <Select><SelectTrigger className="rounded-none"><SelectValue placeholder="Dia" /></SelectTrigger>
                    <SelectContent>{[5,10,15,20,25].map(d => <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="">Forma Pagamento</Label>
                  <Select><SelectTrigger className="rounded-none"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent><SelectItem value="boleto">Boleto</SelectItem><SelectItem value="cartao">Cartão</SelectItem><SelectItem value="pix">PIX</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="rounded-none bg-[#1A3A5C] hover:bg-[#15304D] text-white"><Send className="h-3.5 w-3.5 mr-1" />Enviar para Gestão</Button>
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs">Campo</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Data/Hora</TableHead>
                  <TableHead className="text-xs">Erro</TableHead>
                  <TableHead className="text-xs">Ação</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {mockGestaoHistory.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{h.campo}</TableCell>
                      <TableCell><Badge variant={h.status === "Enviado" ? "default" : h.status === "Erro" ? "destructive" : "outline"} className="text-[10px] rounded-none">{h.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{h.data}</TableCell>
                      <TableCell className="text-xs text-destructive">{h.erro || "—"}</TableCell>
                      <TableCell>{h.status === "Erro" && <Button size="sm" variant="ghost" className="text-xs h-7 rounded-none">Reenviar</Button>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* TAB 6 - Atividades */}
            <TabsContent value="atividades" className="mt-0 space-y-4">
              <Button size="sm" className="rounded-none"><Plus className="h-3.5 w-3.5 mr-1" />Nova Atividade</Button>
              <div className="space-y-3">
                {(historicoReal.length > 0 ? historicoReal : mockActivities).map((a: any, i: number) => {
                  const isReal = !!a.stage_novo;
                  const Icon = isReal ? Activity : (tipoIcons[a.tipo] || Activity);
                  const desc = isReal ? `${a.stage_anterior || "—"} → ${a.stage_novo}${a.motivo ? ` — ${a.motivo}` : ""}` : a.descricao;
                  const data = isReal ? a.created_at : a.data;
                  const usuario = isReal ? (a.automatica ? "Sistema" : "Consultor") : a.usuario;
                  const tipo = isReal ? (a.automatica ? "Auto" : "Manual") : a.tipo;
                  return (
                    <div key={a.id || i} className="flex gap-3 items-start">
                      <div className="mt-1 w-8 h-8 bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 border-b-2 border-[#747474] pb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] rounded-none">{tipo}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(data).toLocaleDateString("pt-BR")} {new Date(data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="text-sm mt-1">{desc}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">por {usuario}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </ScrollArea>

          {/* SIDEBAR DIREITA */}
          <div className="w-64 shrink-0 border-l bg-muted/20 p-4 space-y-4 overflow-y-auto">
            {/* Responsável */}
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Responsável</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1A3A5C] flex items-center justify-center text-white text-xs font-bold">
                  {(deal.consultor || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">{deal.consultor || "Não atribuído"}</p>
                  <p className="text-[10px] text-muted-foreground">{deal.cooperativa}</p>
                </div>
              </div>
            </div>

            {/* Afiliado */}
            <div className="space-y-1 border-t pt-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-[10px] text-muted-foreground">Afiliado(a)</span>
                  <p className="text-sm">Nenhum</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-success" />
                <div>
                  <span className="text-[10px] text-muted-foreground">Comissão</span>
                  <p className="text-sm font-semibold text-success">R$ 0,00</p>
                </div>
              </div>
            </div>

            {/* Stepper contratação */}
            <div className="space-y-1 border-t pt-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Contratação online</span>
              <div className="flex gap-1 mt-1">
                {["cotacao", "vistoria", "assinatura", "boleto", "sga"].map((step, i) => {
                  const stageOrder = ["novo_lead", "em_contato", "em_negociacao", "aguardando_vistoria", "liberado_cadastro", "concluido"];
                  const currentIdx = stageOrder.indexOf(deal.stage);
                  const filled = i <= Math.max(0, currentIdx - 1);
                  return <div key={step} className={`h-2 flex-1 rounded-sm ${filled ? "bg-warning" : "bg-border"}`} title={step} />;
                })}
              </div>
            </div>

            {/* Cooperativa */}
            <div className="space-y-1 border-t pt-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cooperativa</span>
              <p className="text-sm">{deal.cooperativa || "Não definida"}</p>
            </div>

            {/* Origem */}
            <div className="space-y-1 border-t pt-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Origem do lead</span>
              <p className="text-sm">{deal.origem || "Manual"}</p>
            </div>

            {/* Tags */}
            <div className="space-y-1 border-t pt-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tags</span>
              <TagsInline negociacaoId={deal.id} />
            </div>
          </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function VeiculoTabInline({ deal }: { deal: PipelineDeal }) {
  const [veiculo, setVeiculo] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const placa = (deal.veiculo_placa || "").replace(/[^A-Z0-9]/gi, "");
    if (placa.length >= 7) {
      setLoading(true);
      callEdge("gia-buscar-placa", { acao: "placa", placa }).then(res => {
        if (res.sucesso && res.resultado) setVeiculo(res.resultado);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [deal.veiculo_placa]);

  const v = veiculo || {};
  const campos = [
    ["Marca", v.marca || ""],
    ["Modelo", v.modelo || deal.veiculo_modelo || ""],
    ["Ano Fabricação", v.anoFabricacao || ""],
    ["Ano Modelo", v.anoModelo || ""],
    ["Cor", v.cor || ""],
    ["Combustível", v.combustivel || ""],
    ["Chassi", v.chassi || ""],
    ["RENAVAM", v.renavam || ""],
    ["Cód. FIPE", v.codFipe || ""],
    ["Valor FIPE", v.valorFipe ? `R$ ${Number(v.valorFipe).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : ""],
    ["Situação", v.situacao || ""],
    ["Município", v.municipio || ""],
    ["UF", v.uf || ""],
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Placa</Label>
          <Input className="rounded-none" value={deal.veiculo_placa || ""} readOnly />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo Veículo</Label>
          <Input className="rounded-none" value={v.submodelo ? "Automóvel" : "—"} readOnly />
        </div>
        {loading && <p className="text-xs text-muted-foreground col-span-2">Buscando dados do veículo...</p>}
        {campos.map(([label, val]) => (
          <div key={label} className="space-y-1.5">
            <Label>{label}</Label>
            <Input className="rounded-none" value={val} readOnly />
          </div>
        ))}
      </div>
    </div>
  );
}
