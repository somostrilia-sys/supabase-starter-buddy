import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PipelineDeal, planos } from "./mockData";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/hooks/useAuth";
import { useUsuario } from "@/hooks/useUsuario";
import AssociadoTab from "./AssociadoTab";
import CotacaoTab from "./CotacaoTab";
import DocumentosTab from "./DocumentosTab";
import VistoriaTab from "./VistoriaTab";
import AssinaturaTab from "./AssinaturaTab";
import FinanceiroNegociacaoTab from "./FinanceiroNegociacaoTab";
import TagsInline from "@/components/TagsInline";
import PedirLiberacaoButton from "@/components/PedirLiberacaoButton";
import { supabase, callEdge } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FileText, User, Car, ClipboardCheck, Activity, PenTool, Wallet,
  Mail, MessageSquare, Plus, Send, Image, Archive, Paperclip, CheckCircle,
} from "lucide-react";

interface Props {
  deal: PipelineDeal;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onUpdate?: () => void;
}

const MOTIVOS_ARQUIVAR = ["Teste", "Erro de cadastro", "Cancelamento pelo cliente", "Duplicidade", "Sem interesse", "Outro"];

export default function DealDetailModal({ deal, open, onOpenChange, onUpdate }: Props) {
  const { isConsultor } = useUsuario();
  const isConcluido = deal.stage === "concluido";
  const bloqueado = isConsultor && isConcluido;
  const [activeTab, setActiveTab] = useState("cotacao");
  const [historicoReal, setHistoricoReal] = useState<any[]>([]);
  const [showArquivar, setShowArquivar] = useState(false);
  const [motivoArquivar, setMotivoArquivar] = useState("");
  const [showTransferir, setShowTransferir] = useState(false);
  const [consultorDestino, setConsultorDestino] = useState("");
  const [consultoresTransf, setConsultoresTransf] = useState<string[]>([]);
  const { isAdmin } = usePermission();
  const { profile } = useAuth();
  const [percentualAdesao, setPercentualAdesao] = React.useState<number | null>(null);

  // Buscar percentual_adesao do consultor
  React.useEffect(() => {
    if (!deal.consultor) return;
    supabase.from("usuarios" as any).select("percentual_adesao").eq("nome", deal.consultor).maybeSingle()
      .then(({ data }: any) => { if (data) setPercentualAdesao(data.percentual_adesao ?? 100); });
  }, [deal.consultor]);

  // OCR auto-fill state
  const [dadosCnh, setDadosCnh] = useState<Record<string, any> | null>(null);

  const handleCnhExtraida = useCallback(async (dados: Record<string, any>) => {
    setDadosCnh(dados);
    // CNH → preenche APENAS dados do ASSOCIADO
    const update: any = {};
    if (dados.nome) update.lead_nome = dados.nome;
    if (dados.cpf) update.cpf_cnpj = dados.cpf;
    if (dados.data_nascimento) update.data_nascimento = dados.data_nascimento;
    if (dados.rg) update.rg = dados.rg;
    if (dados.numero_registro) update.cnh = dados.numero_registro;
    if (dados.categoria) update.cnh_categoria = dados.categoria;
    if (dados.validade) update.cnh_validade = dados.validade;
    if (Object.keys(update).length > 0) {
      await supabase.from("negociacoes").update(update as any).eq("id", deal.id);
    }
    onUpdate?.();
  }, [deal.id, onUpdate]);

  const handleCrlvExtraida = useCallback(async (dados: Record<string, any>) => {
    // CRLV → preenche APENAS dados do VEÍCULO
    const update: any = {};
    if (dados.placa) update.veiculo_placa = dados.placa;
    if (dados.marca_modelo) update.veiculo_modelo = dados.marca_modelo;
    if (dados.chassi) update.chassi = dados.chassi;
    if (dados.renavam) update.renavam = dados.renavam;
    if (dados.ano_fabricacao) update.ano_fabricacao = dados.ano_fabricacao;
    if (dados.ano_modelo) update.ano_modelo = dados.ano_modelo;
    if (dados.cor) update.cor = dados.cor;
    if (dados.combustivel) update.combustivel = dados.combustivel;
    if (dados.municipio) update.cidade_circulacao = dados.municipio;
    if (dados.uf) update.estado_circulacao = dados.uf;
    if (Object.keys(update).length > 0) {
      await supabase.from("negociacoes").update(update as any).eq("id", deal.id);
    }
    // Auto-cotação se cidade foi preenchida via CRLV e deal é LuxSales VoIP
    if (dados.municipio && !deal.cidade_circulacao && deal.origem === "LuxSales VoIP") {
      callEdge("gia-auto-cotacao", { negociacao_id: deal.id })
        .then((res: any) => {
          if (res.success) {
            toast.success(`Cotação automática gerada! Plano: R$ ${res.valor_plano?.toFixed(2).replace(".", ",")}`);
          }
        })
        .catch((e) => { console.error("Erro na cotação automática:", e); toast.error("Erro ao gerar cotação automática"); });
    }
    onUpdate?.();
  }, [deal.id, deal.cidade_circulacao, deal.origem, onUpdate]);

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

  // Carregar consultores para transferência
  React.useEffect(() => {
    if (!showTransferir) return;
    const funcao = (profile as any)?.funcao || "";
    const coopUsuario = (profile as any)?.cooperativa || "";

    supabase.from("usuarios").select("nome, cooperativa").eq("status", "ativo").order("nome")
      .then(({ data }) => {
        let lista = (data || []).map((u: any) => u.nome).filter(Boolean);
        if (!isAdmin && !funcao.toLowerCase().includes("diretor")) {
          const minhasCoops = coopUsuario.split(",").map((c: string) => c.trim().toLowerCase());
          lista = (data || []).filter((u: any) => {
            const uCoops = (u.cooperativa || "").split(",").map((c: string) => c.trim().toLowerCase());
            return uCoops.some((c: string) => minhasCoops.some((mc: string) => c.includes(mc) || mc.includes(c)));
          }).map((u: any) => u.nome);
        }
        setConsultoresTransf(lista.filter((n: string) => n !== deal.consultor));
      });
  }, [showTransferir]);

  async function handleTransferir() {
    if (!consultorDestino) { toast.error("Selecione o consultor destino"); return; }
    await supabase.from("negociacoes").update({ consultor: consultorDestino } as any).eq("id", deal.id);
    await supabase.from("pipeline_transicoes").insert({
      negociacao_id: deal.id, stage_anterior: deal.stage, stage_novo: deal.stage,
      motivo: `Transferido de ${deal.consultor} para ${consultorDestino}`,
      automatica: false,
    } as any);
    toast.success(`Negociação transferida para ${consultorDestino}`);
    setShowTransferir(false);
    setConsultorDestino("");
    onUpdate?.();
  }

  const tabs = [
    { v: "cotacao", l: "Cotação", i: FileText },
    { v: "associado", l: "Associado", i: User },
    { v: "veiculo", l: "Veículo", i: Car },
    { v: "documentos", l: "Documentos", i: Paperclip },
    { v: "vistoria", l: "Vistoria", i: ClipboardCheck },
    { v: "assinatura", l: "Assinatura", i: PenTool },
    { v: "financeiro", l: "Financeiro", i: Wallet },
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

        {deal.stage === "concluido" && (
          <div className="px-6 py-2 bg-green-600 text-white text-center text-sm font-semibold flex items-center justify-center gap-2">
            <CheckCircle className="h-4 w-4" /> Negociação concluída — dados migrados para o módulo Gestão. Edição bloqueada.
          </div>
        )}

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
              <AssociadoTab deal={deal} dadosCnh={dadosCnh} />
            </TabsContent>

            {/* TAB 3 - Veículo (dados reais da placa) */}
            <TabsContent value="veiculo" className="mt-0 space-y-4">
              <VeiculoTabInline deal={deal} />
              <div className="border-t-2 border-[#747474] pt-4 space-y-3">
                <h4 className="text-sm font-semibold">Envio para Sistemas</h4>
                <div className="flex gap-2">
                  <PedirLiberacaoButton negociacaoId={deal.id} consultorId={(deal as any).consultor_id} onSuccess={() => onUpdate?.()} />
                  <Button size="sm" variant="outline" className="rounded-none"><MessageSquare className="h-3.5 w-3.5 mr-1" />WhatsApp</Button>
                  <Button size="sm" variant="outline" className="rounded-none"><Mail className="h-3.5 w-3.5 mr-1" />E-mail</Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB - Documentos OCR */}
            <TabsContent value="documentos" className="mt-0">
              <DocumentosTab
                negociacaoId={deal.id}
                onCnhExtraida={handleCnhExtraida}
                onCrlvExtraida={handleCrlvExtraida}
              />
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

            {/* TAB - Atividades */}
            <TabsContent value="atividades" className="mt-0 space-y-4">
              <Button size="sm" className="rounded-none"><Plus className="h-3.5 w-3.5 mr-1" />Nova Atividade</Button>
              {historicoReal.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma atividade registrada</p>
              ) : (
                <div className="space-y-3">
                  {historicoReal.map((a: any, i: number) => {
                    const desc = `${a.stage_anterior || "—"} → ${a.stage_novo}${a.motivo ? ` — ${a.motivo}` : ""}`;
                    const data = a.created_at;
                    const usuario = a.automatica ? "Sistema" : "Consultor";
                    const tipo = a.automatica ? "Auto" : "Manual";
                    return (
                      <div key={a.id || i} className="flex gap-3 items-start">
                        <div className="mt-1 w-8 h-8 bg-primary/10 flex items-center justify-center shrink-0">
                          <Activity className="h-4 w-4 text-primary" />
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
              )}
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight truncate">{deal.consultor || "Não atribuído"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{deal.cooperativa}</p>
                </div>
              </div>
              {showTransferir ? (
                <div className="space-y-2 mt-2 p-2 border rounded bg-muted/30">
                  <Select value={consultorDestino} onValueChange={setConsultorDestino}>
                    <SelectTrigger className="h-8 text-xs rounded-none"><SelectValue placeholder="Selecione consultor" /></SelectTrigger>
                    <SelectContent>{consultoresTransf.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    <Button size="sm" className="rounded-none text-xs h-7 flex-1 bg-[#1A3A5C]" onClick={handleTransferir}>Transferir</Button>
                    <Button size="sm" variant="ghost" className="rounded-none text-xs h-7" onClick={() => setShowTransferir(false)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="ghost" className="rounded-none text-[10px] h-6 mt-1 text-muted-foreground hover:text-foreground w-full" onClick={() => setShowTransferir(true)}>
                  Transferir negociação
                </Button>
              )}
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
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                <div>
                  <span className="text-[10px] text-muted-foreground">Adesão</span>
                  <p className="text-sm font-semibold text-primary">{percentualAdesao != null ? `${percentualAdesao}%` : "—"}</p>
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
  const [negData, setNegData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  // Carregar dados salvos da negociação (OCR + manual)
  React.useEffect(() => {
    if (!deal.id || deal.id.startsWith("p")) return;
    supabase.from("negociacoes" as any).select("*").eq("id", deal.id).single()
      .then(({ data }) => { if (data) setNegData(data); });
  }, [deal.id]);

  // Buscar dados da API pela placa
  React.useEffect(() => {
    const placa = (deal.veiculo_placa || "").replace(/[^A-Z0-9]/gi, "");
    if (placa.length >= 7) {
      setLoading(true);
      callEdge("gia-buscar-placa", { acao: "placa", placa }).then(res => {
        if (res.sucesso && res.resultado) setVeiculo(res.resultado);
        setLoading(false);
      }).catch((e) => { console.error("Erro ao buscar placa:", e); setLoading(false); });
    }
  }, [deal.veiculo_placa]);

  const n = negData || {};
  const v = veiculo || {};
  // Prioridade: dados salvos (OCR) > dados da API > vazio
  const campos = [
    ["Marca", n.veiculo_modelo?.split("/")[0]?.split(" ")[0] || v.marca || ""],
    ["Modelo", n.veiculo_modelo || v.modelo || deal.veiculo_modelo || ""],
    ["Ano Fabricação", n.ano_fabricacao || v.anoFabricacao || ""],
    ["Ano Modelo", n.ano_modelo || v.anoModelo || ""],
    ["Cor", n.cor || v.cor || ""],
    ["Combustível", n.combustivel || v.combustivel || ""],
    ["Chassi", n.chassi || v.chassi || ""],
    ["RENAVAM", n.renavam || v.renavam || ""],
    ["Cód. FIPE", v.codFipe || ""],
    ["Valor FIPE", v.valorFipe ? `R$ ${Number(v.valorFipe).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : ""],
    ["Situação", v.situacao || ""],
    ["Município", n.cidade_circulacao || v.municipio || ""],
    ["UF", n.estado_circulacao || v.uf || ""],
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Placa</Label>
          <Input className="rounded-none border border-gray-300" value={deal.veiculo_placa || ""} readOnly />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo Veículo</Label>
          <Input className="rounded-none border border-gray-300" value={v.submodelo ? "Automóvel" : "—"} readOnly />
        </div>
        {loading && <p className="text-xs text-muted-foreground col-span-2">Buscando dados do veículo...</p>}
        {campos.map(([label, val]) => (
          <div key={label} className="space-y-1.5">
            <Label>{label}</Label>
            <Input className="rounded-none border border-gray-300" value={val} readOnly />
          </div>
        ))}
      </div>
    </div>
  );
}
