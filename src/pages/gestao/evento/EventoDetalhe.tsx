import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  X, Car, User, Clock, MapPin, DollarSign, FileText, Upload, Eye,
  Download, Trash2, Image, Video, File, Plus, CheckCircle2, AlertTriangle,
  MessageSquare, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import ArquivosSGA from "@/components/ArquivosSGA";

interface EventoData {
  protocolo: string;
  associado: string;
  placa: string;
  tipo: string;
  data: string;
  status: string;
  responsavel: string;
}

const statusOptions = ["Em análise", "Em reparo", "Aguardando docs", "Indenização integral", "Negado", "Reembolso", "Encerrado"];

const statusColor: Record<string, string> = {
  "Em análise": "bg-warning/10 text-warning",
  "Em reparo": "bg-primary/8 text-primary",
  "Aguardando docs": "bg-warning/10 text-warning",
  "Indenização integral": "bg-accent/8 text-accent",
  "Negado": "bg-destructive/8 text-destructive",
  "Reembolso": "bg-success/10 text-success",
  "Encerrado": "bg-muted text-muted-foreground",
};

// Mock enriched data
const mockDetalhes: Record<string, {
  descricao: string;
  local: string;
  valorEstimado: number;
  valorAprovado: number | null;
  veiculo: { marca: string; modelo: string; ano: number; fipe: number };
  associadoData: { cpf: string; telefone: string; email: string };
  timeline: { data: string; acao: string; usuario: string }[];
  observacoes: string[];
}> = {
  "EVT-2025-0341": {
    descricao: "Colisão traseira no semáforo da Av. Paulista. O veículo de trás não freou a tempo, causando danos no para-choque traseiro, lanterna esquerda e porta-malas.",
    local: "Av. Paulista, 1000 — São Paulo/SP",
    valorEstimado: 8500,
    valorAprovado: 7200,
    veiculo: { marca: "Chevrolet", modelo: "Onix Plus 2023", ano: 2023, fipe: 82500 },
    associadoData: { cpf: "123.456.789-00", telefone: "(11) 99876-5432", email: "carlos.silva@email.com" },
    timeline: [
      { data: "15/06/2025 08:30", acao: "Evento registrado", usuario: "João Mendes" },
      { data: "15/06/2025 14:00", acao: "Documentação recebida (BO, fotos)", usuario: "Ana Costa" },
      { data: "18/06/2025 10:15", acao: "Análise iniciada — perito agendado", usuario: "Pedro Lima" },
      { data: "22/06/2025 16:45", acao: "Orçamento aprovado — R$ 7.200,00", usuario: "Gerente" },
      { data: "25/06/2025 09:00", acao: "Enviado para oficina Auto Center Paulista", usuario: "João Mendes" },
      { data: "02/07/2025 11:30", acao: "Reparo em andamento — previsão 10/07", usuario: "Oficina" },
    ],
    observacoes: [
      "Cliente solicitou prioridade no reparo.",
      "Laudo pericial confirmou dano estrutural no para-choque.",
    ],
  },
};

const defaultDetalhe = {
  descricao: "Detalhes do evento serão carregados do banco de dados.",
  local: "Local não informado",
  valorEstimado: 0,
  valorAprovado: null,
  veiculo: { marca: "—", modelo: "—", ano: 0, fipe: 0 },
  associadoData: { cpf: "—", telefone: "—", email: "—" },
  timeline: [
    { data: new Date().toLocaleString("pt-BR"), acao: "Evento registrado", usuario: "Sistema" },
  ],
  observacoes: [],
};

const DOC_CATEGORIES = ["Foto do Evento", "Boletim de Ocorrência", "Laudo Pericial", "Orçamento", "Nota Fiscal", "Outro"];
const fmtBRL = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

interface Anexo {
  id: string;
  nome: string;
  tipo: string;
  mime: string;
  tamanho: number;
  preview?: string;
}

const getFileIcon = (mime: string) => {
  if (mime.startsWith("image/")) return Image;
  if (mime.startsWith("video/")) return Video;
  if (mime === "application/pdf") return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function EventoDetalhe({
  evento,
  onClose,
}: {
  evento: EventoData;
  onClose: () => void;
}) {
  const det = mockDetalhes[evento.protocolo] || defaultDetalhe;
  const [status, setStatus] = useState(evento.status);
  const [novaObs, setNovaObs] = useState("");
  const [observacoes, setObservacoes] = useState(det.observacoes);
  const [timeline, setTimeline] = useState(det.timeline);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [docCategoria, setDocCategoria] = useState("Foto do Evento");
  const [previewAnexo, setPreviewAnexo] = useState<Anexo | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Andamentos tab state
  const [novoAndamento, setNovoAndamento] = useState("");

  // Financeiro tab state
  const [valorAprovadoEdit, setValorAprovadoEdit] = useState(
    det.valorAprovado !== null ? String(det.valorAprovado) : ""
  );
  const [statusPagamento, setStatusPagamento] = useState("Pendente");

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    const entry = {
      data: new Date().toLocaleString("pt-BR"),
      acao: `Status alterado para: ${newStatus}`,
      usuario: "Usuário atual",
    };
    setTimeline(prev => [...prev, entry]);
    toast.success(`Status atualizado para "${newStatus}"`);
  };

  const addObservacao = () => {
    if (!novaObs.trim()) return;
    setObservacoes(prev => [...prev, novaObs.trim()]);
    const entry = {
      data: new Date().toLocaleString("pt-BR"),
      acao: `Observação adicionada: "${novaObs.trim().substring(0, 50)}..."`,
      usuario: "Usuário atual",
    };
    setTimeline(prev => [...prev, entry]);
    setNovaObs("");
    toast.success("Observação adicionada");
  };

  const handleEncerrar = () => {
    setStatus("Encerrado");
    const entry = {
      data: new Date().toLocaleString("pt-BR"),
      acao: "Evento encerrado",
      usuario: "Usuário atual",
    };
    setTimeline(prev => [...prev, entry]);
    toast.success("Evento encerrado com sucesso");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAnexos: Anexo[] = files.map(f => ({
      id: `${Date.now()}-${Math.random()}`,
      nome: f.name,
      tipo: docCategoria,
      mime: f.type,
      tamanho: f.size,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));
    setAnexos(prev => [...prev, ...newAnexos]);
    if (files.length > 0) toast.success(`${files.length} anexo(s) adicionado(s)`);
    e.target.value = "";
  };

  const registrarAndamento = () => {
    if (!novoAndamento.trim()) return;
    const entry = {
      data: new Date().toLocaleString("pt-BR"),
      acao: novoAndamento.trim(),
      usuario: "Você",
    };
    setTimeline(prev => [...prev, entry]);
    setNovoAndamento("");
    toast.success("Andamento registrado");
  };

  const salvarValorAprovado = () => {
    const valor = parseFloat(valorAprovadoEdit.replace(",", "."));
    if (isNaN(valor)) { toast.error("Valor inválido"); return; }
    const entry = {
      data: new Date().toLocaleString("pt-BR"),
      acao: `Valor final aprovado atualizado: ${fmtBRL(valor)}`,
      usuario: "Você",
    };
    setTimeline(prev => [...prev, entry]);
    toast.success("Valor aprovado salvo");
  };

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <span className="font-mono text-base">{evento.protocolo}</span>
              <Badge className={`text-xs ${statusColor[status] || "bg-muted text-muted-foreground"}`}>{status}</Badge>
            </DialogTitle>
          </div>
        </DialogHeader>

        <Tabs defaultValue="dados" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-5 mx-6 mt-1 shrink-0">
            <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
            <TabsTrigger value="andamentos">Andamentos</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="arquivos-sga">Arquivos SGA</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          </TabsList>

          {/* ── ABA: Dados Gerais ── */}
          <TabsContent value="dados" className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Info cards row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Evento */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />Evento</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><Badge variant="outline" className="text-xs">{evento.tipo}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Data</span><span>{new Date(evento.data).toLocaleDateString("pt-BR")}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Local</span><span className="text-right text-xs max-w-[160px] truncate" title={det.local}>{det.local}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Responsável</span><span>{evento.responsavel}</span></div>
                </CardContent>
              </Card>

              {/* Veículo */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Car className="h-3.5 w-3.5" />Veículo</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Placa</span><span className="font-mono font-semibold">{evento.placa}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Marca/Modelo</span><span>{det.veiculo.marca} {det.veiculo.modelo}</span></div>
                  {det.veiculo.ano > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Ano</span><span>{det.veiculo.ano}</span></div>}
                  {det.veiculo.fipe > 0 && <div className="flex justify-between"><span className="text-muted-foreground">FIPE</span><span className="font-semibold">{fmtBRL(det.veiculo.fipe)}</span></div>}
                </CardContent>
              </Card>

              {/* Associado */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Associado</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Nome</span><span className="font-medium">{evento.associado}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">CPF</span><span>{det.associadoData.cpf}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Telefone</span><span>{det.associadoData.telefone}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-xs truncate max-w-[150px]" title={det.associadoData.email}>{det.associadoData.email}</span></div>
                </CardContent>
              </Card>
            </div>

            {/* Descrição */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Descrição do Evento</h3>
              <p className="text-sm bg-muted/20 rounded-lg p-3 border">{det.descricao}</p>
            </div>

            {/* Atualizar Status */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Ações</h3>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="min-w-[200px]">
                  <Label className="text-xs">Atualizar Status</Label>
                  <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleEncerrar}
                  disabled={status === "Encerrado"}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Encerrar Evento
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── ABA: Andamentos ── */}
          <TabsContent value="andamentos" className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Timeline */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />Timeline do Evento
              </h3>
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-2.5 top-1 bottom-1 w-px bg-border" />
                {timeline.map((t, i) => (
                  <div key={i} className="relative">
                    <CheckCircle2 className={`absolute -left-[22px] top-0.5 h-4 w-4 ${
                      i === timeline.length - 1 ? "text-primary" : "text-muted-foreground/40"
                    }`} />
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-sm">{t.acao}</p>
                        <p className="text-[11px] text-muted-foreground">{t.data} — {t.usuario}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Observações */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />Observações
              </h3>
              {observacoes.length > 0 && (
                <div className="space-y-2 mb-3">
                  {observacoes.map((obs, i) => (
                    <div key={i} className="bg-muted/20 rounded-lg px-3 py-2 text-sm border">
                      {obs}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Textarea
                  value={novaObs}
                  onChange={e => setNovaObs(e.target.value)}
                  placeholder="Adicionar observação..."
                  rows={2}
                  className="text-sm"
                />
                <Button variant="outline" className="shrink-0 self-end" onClick={addObservacao} disabled={!novaObs.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Novo Andamento */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Registrar Novo Andamento</h3>
              <div className="space-y-2">
                <Textarea
                  value={novoAndamento}
                  onChange={e => setNovoAndamento(e.target.value)}
                  placeholder="Descreva o andamento..."
                  rows={3}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={registrarAndamento}
                  disabled={!novoAndamento.trim()}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Registrar Andamento
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── ABA: Documentos ── */}
          <TabsContent value="documentos" className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" />Anexos do Evento
              </h3>
              <div className="flex flex-wrap gap-3 mb-3 items-end">
                <div className="min-w-[160px]">
                  <Label className="text-xs">Categoria</Label>
                  <Select value={docCategoria} onValueChange={setDocCategoria}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{DOC_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.mp4" multiple className="hidden" onChange={handleFileUpload} />
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
                  <Plus className="h-3.5 w-3.5" />Adicionar Anexo
                </Button>
              </div>

              {anexos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {anexos.map(a => {
                    const FileIcon = getFileIcon(a.mime);
                    return (
                      <Card key={a.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="h-24 bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => a.preview && setPreviewAnexo(a)}>
                            {a.preview ? (
                              <img src={a.preview} alt={a.nome} className="w-full h-full object-cover" />
                            ) : (
                              <FileIcon className="h-8 w-8 text-muted-foreground/40" />
                            )}
                          </div>
                          <div className="p-2 space-y-1">
                            <p className="text-[11px] font-medium truncate" title={a.nome}>{a.nome}</p>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-[9px]">{a.tipo}</Badge>
                              <span className="text-[9px] text-muted-foreground">{formatFileSize(a.tamanho)}</span>
                            </div>
                            <div className="flex justify-end gap-0.5">
                              {a.preview && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPreviewAnexo(a)}>
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                if (a.preview) URL.revokeObjectURL(a.preview);
                                setAnexos(prev => prev.filter(x => x.id !== a.id));
                              }}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1.5" />
                  <p className="text-xs text-muted-foreground">Arraste ou clique para anexar documentos</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── ABA: Arquivos SGA ── */}
          <TabsContent value="arquivos-sga" className="flex-1 overflow-y-auto px-6 py-4">
            <ArquivosSGA protocolo={evento.protocolo} />
          </TabsContent>

          {/* ── ABA: Financeiro ── */}
          <TabsContent value="financeiro" className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Valor Estimado */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" />Valor Estimado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">
                    {det.valorEstimado > 0 ? fmtBRL(det.valorEstimado) : "Não informado"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Valor estimado no registro do evento</p>
                </CardContent>
              </Card>

              {/* Valor Aprovado */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />Valor Final Aprovado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={valorAprovadoEdit}
                      onChange={e => setValorAprovadoEdit(e.target.value)}
                      placeholder="0,00"
                      className="text-sm"
                    />
                    <Button size="sm" onClick={salvarValorAprovado}>Salvar</Button>
                  </div>
                  {valorAprovadoEdit && !isNaN(parseFloat(valorAprovadoEdit.replace(",", "."))) && (
                    <p className="text-xs text-muted-foreground">
                      {fmtBRL(parseFloat(valorAprovadoEdit.replace(",", ".")))}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Status Pagamento */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Status do Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-[240px]">
                  <Select value={statusPagamento} onValueChange={val => {
                    setStatusPagamento(val);
                    const entry = {
                      data: new Date().toLocaleString("pt-BR"),
                      acao: `Status de pagamento atualizado para: ${val}`,
                      usuario: "Você",
                    };
                    setTimeline(prev => [...prev, entry]);
                    toast.success(`Status de pagamento: ${val}`);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Pago">Pago</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Image preview */}
        {previewAnexo && (
          <Dialog open onOpenChange={() => setPreviewAnexo(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="text-sm truncate">{previewAnexo.nome}</DialogTitle>
              </DialogHeader>
              <div className="flex items-center justify-center min-h-[300px]">
                {previewAnexo.preview && (
                  <img src={previewAnexo.preview} alt={previewAnexo.nome} className="max-w-full max-h-[60vh] object-contain rounded" />
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
