import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import {
  FileText, Search, Printer, Eye, Plus, Edit, Save,
  Loader2, Upload, Download, History, CheckCircle2, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// ── Mock Data ──────────────────────────────────────────────

const mockEventos = [
  { protocolo: "EVT-2025-0341", placa: "BRA2E19", associado: "Carlos Eduardo Silva", cpf: "123.456.789-00", veiculo: "Chevrolet Onix Plus 2023", chassi: "9BGKS48U0MG123456" },
  { protocolo: "EVT-2025-0298", placa: "RIO4H77", associado: "Maria Fernanda Oliveira", cpf: "987.654.321-00", veiculo: "Fiat Argo 2022", chassi: "9BD195227L0654321" },
  { protocolo: "EVT-2025-0315", placa: "SPO1C33", associado: "João Pedro Santos", cpf: "456.789.123-00", veiculo: "Hyundai HB20 2024", chassi: "9BHBG51DAUP789012" },
];

const mockBeneficiarios = [
  { nome: "Carlos Eduardo Silva", cpf: "123.456.789-00", placa: "BRA2E19", veiculo: "Chevrolet Onix Plus 2023", chassi: "9BGKS48U0MG123456" },
  { nome: "Maria Fernanda Oliveira", cpf: "987.654.321-00", placa: "RIO4H77", veiculo: "Fiat Argo 2022", chassi: "9BD195227L0654321" },
  { nome: "João Pedro Santos", cpf: "456.789.123-00", placa: "SPO1C33", veiculo: "Hyundai HB20 2024", chassi: "9BHBG51DAUP789012" },
  { nome: "Ana Carolina Ferreira", cpf: "321.654.987-00", placa: "MGA5B22", veiculo: "VW Polo 2023", chassi: "9BWAB05U8LP345678" },
  { nome: "Roberto Almeida Neto", cpf: "654.321.987-00", placa: "BSB3K11", veiculo: "Toyota Corolla 2024", chassi: "9BR53ZEC8P0901234" },
];

const termosDisponiveis = [
  { id: "cancelamento", nome: "Termo de Cancelamento" },
  { id: "retirada-rastreador", nome: "Termo de Retirada de Rastreador" },
  { id: "responsabilidade", nome: "Termo de Responsabilidade" },
];

const mockModelosTermos = [
  {
    id: 1, nome: "Termo de Cancelamento", tipo: "cancelamento", categoria: "evento",
    versao: 3, atualizadoEm: "2025-06-15", atualizadoPor: "Admin",
    conteudo: `TERMO DE CANCELAMENTO\n\nPelo presente termo, o(a) associado(a) [Nome do Associado], portador(a) do CPF [CPF], solicita o cancelamento de sua adesão à Associação de Proteção Veicular.\n\nVeículo: Placa [Placa] — Chassi [Chassi]\n\nFicam rescindidas todas as obrigações e direitos a partir desta data.\n\nData de Emissão: [Data de Emissão]\n\n_________________________________\nAssinatura do Associado`,
    marcadores: ["[Nome do Associado]", "[CPF]", "[Placa]", "[Chassi]", "[Data de Emissão]"],
    historico: [
      { versao: 3, data: "2025-06-15", usuario: "Admin", resumo: "Atualizado cláusula de rescisão" },
      { versao: 2, data: "2025-03-10", usuario: "Gerente", resumo: "Adicionado campo de chassi" },
      { versao: 1, data: "2024-11-01", usuario: "Admin", resumo: "Versão inicial" },
    ],
  },
  {
    id: 2, nome: "Termo de Retirada de Rastreador", tipo: "retirada-rastreador", categoria: "veiculo",
    versao: 2, atualizadoEm: "2025-05-20", atualizadoPor: "Gerente",
    conteudo: `TERMO DE RETIRADA DE RASTREADOR\n\nEu, [Nome do Associado], CPF [CPF], autorizo a retirada do equipamento rastreador instalado no veículo placa [Placa], chassi [Chassi].\n\nDeclaro estar ciente de que, após a retirada, o veículo não contará com rastreamento.\n\nData de Emissão: [Data de Emissão]\n\n_________________________________\nAssinatura`,
    marcadores: ["[Nome do Associado]", "[CPF]", "[Placa]", "[Chassi]", "[Data de Emissão]"],
    historico: [
      { versao: 2, data: "2025-05-20", usuario: "Gerente", resumo: "Inclusão de cláusula de ciência" },
      { versao: 1, data: "2024-12-05", usuario: "Admin", resumo: "Versão inicial" },
    ],
  },
  {
    id: 3, nome: "Termo de Responsabilidade", tipo: "responsabilidade", categoria: "associado",
    versao: 1, atualizadoEm: "2025-04-10", atualizadoPor: "Admin",
    conteudo: `TERMO DE RESPONSABILIDADE\n\nEu, [Nome do Associado], CPF [CPF], assumo total responsabilidade pelo veículo placa [Placa], chassi [Chassi], declarando que todas as informações prestadas são verdadeiras.\n\nData de Emissão: [Data de Emissão]\n\n_________________________________\nAssinatura`,
    marcadores: ["[Nome do Associado]", "[CPF]", "[Placa]", "[Chassi]", "[Data de Emissão]"],
    historico: [
      { versao: 1, data: "2025-04-10", usuario: "Admin", resumo: "Versão inicial" },
    ],
  },
];

const mockTermosEmitidos = [
  { id: 1, associado: "Carlos Eduardo Silva", cpf: "123.456.789-00", tipo: "Cancelamento", dataEmissao: "2025-07-10", placa: "BRA2E19", modelo: "Chevrolet Onix Plus 2023", usuario: "Admin" },
  { id: 2, associado: "Maria Fernanda Oliveira", cpf: "987.654.321-00", tipo: "Retirada de Rastreador", dataEmissao: "2025-07-08", placa: "RIO4H77", modelo: "Fiat Argo 2022", usuario: "Gerente" },
  { id: 3, associado: "João Pedro Santos", cpf: "456.789.123-00", tipo: "Responsabilidade", dataEmissao: "2025-07-05", placa: "SPO1C33", modelo: "Hyundai HB20 2024", usuario: "Admin" },
  { id: 4, associado: "Ana Carolina Ferreira", cpf: "321.654.987-00", tipo: "Cancelamento", dataEmissao: "2025-06-28", placa: "MGA5B22", modelo: "VW Polo 2023", usuario: "Operador" },
  { id: 5, associado: "Roberto Almeida Neto", cpf: "654.321.987-00", tipo: "Responsabilidade", dataEmissao: "2025-06-25", placa: "BSB3K11", modelo: "Toyota Corolla 2024", usuario: "Admin" },
  { id: 6, associado: "Fernanda Lima Costa", cpf: "789.123.456-00", tipo: "Retirada de Rastreador", dataEmissao: "2025-06-20", placa: "CWB7D55", modelo: "Renault Kwid 2023", usuario: "Gerente" },
  { id: 7, associado: "Lucas Martins Souza", cpf: "147.258.369-00", tipo: "Cancelamento", dataEmissao: "2025-06-15", placa: "POA8F44", modelo: "Honda City 2024", usuario: "Admin" },
  { id: 8, associado: "Patricia Rocha Lima", cpf: "258.369.147-00", tipo: "Responsabilidade", dataEmissao: "2025-06-10", placa: "REC2G88", modelo: "Jeep Renegade 2023", usuario: "Operador" },
  { id: 9, associado: "Thiago Barbosa Reis", cpf: "369.147.258-00", tipo: "Cancelamento", dataEmissao: "2025-06-05", placa: "FLN6J99", modelo: "Nissan Kicks 2024", usuario: "Gerente" },
  { id: 10, associado: "Camila Duarte Pinto", cpf: "741.852.963-00", tipo: "Retirada de Rastreador", dataEmissao: "2025-05-30", placa: "GYN1L66", modelo: "Chevrolet Tracker 2023", usuario: "Admin" },
];

const tiposTermoFiltro = ["Todos", "Cancelamento", "Retirada de Rastreador", "Responsabilidade"];

// ── Component ──────────────────────────────────────────────

export default function DocumentacaoTab() {
  const [subTab, setSubTab] = useState<"emitir" | "alterar" | "criar" | "relatorio">("emitir");

  const tabs = [
    { id: "emitir" as const, label: "Emitir Termo", icon: FileText },
    { id: "alterar" as const, label: "Alterar Termo", icon: Edit },
    { id: "criar" as const, label: "Criar Termo", icon: Plus },
    { id: "relatorio" as const, label: "Relatório de Termos", icon: Download },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[hsl(212_35%_18%)]">Documentação</h2>
        <p className="text-sm text-muted-foreground">Emissão, gestão e relatório de termos do sistema</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-[hsl(210_30%_88%)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-px ${
              subTab === t.id
                ? "border-[hsl(212_55%_40%)] text-[hsl(212_35%_18%)]"
                : "border-transparent text-muted-foreground hover:text-[hsl(212_35%_30%)]"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "emitir" && <EmitirTermoTab />}
      {subTab === "alterar" && <AlterarTermoTab />}
      {subTab === "criar" && <CriarTermoTab />}
      {subTab === "relatorio" && <RelatorioTermosTab />}
    </div>
  );
}

// ── 1) Emitir Termo ────────────────────────────────────────

function EmitirTermoTab() {
  const [buscaTipo, setBuscaTipo] = useState<"evento" | "beneficiario" | "veiculo">("evento");
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<typeof mockBeneficiarios>([]);
  const [selecionado, setSelecionado] = useState<typeof mockBeneficiarios[0] | null>(null);
  const [termoSelecionado, setTermoSelecionado] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const pesquisar = () => {
    if (!busca.trim()) return;
    const q = busca.toLowerCase();
    let results: typeof mockBeneficiarios = [];

    if (buscaTipo === "evento") {
      const evt = mockEventos.filter(e => e.protocolo.toLowerCase().includes(q) || e.placa.toLowerCase().includes(q));
      results = evt.map(e => ({ nome: e.associado, cpf: e.cpf, placa: e.placa, veiculo: e.veiculo, chassi: e.chassi }));
    } else if (buscaTipo === "beneficiario") {
      results = mockBeneficiarios.filter(b => b.nome.toLowerCase().includes(q));
    } else {
      results = mockBeneficiarios.filter(b => b.nome.toLowerCase().includes(q) || b.placa.toLowerCase().includes(q) || b.chassi.toLowerCase().includes(q));
    }
    setResultados(results);
    setSelecionado(null);
    setTermoSelecionado(null);
  };

  const gerarDocumento = () => {
    if (!selecionado || !termoSelecionado) return;
    const modelo = mockModelosTermos.find(m => m.id === termosDisponiveis.find(t => t.id === termoSelecionado)?.id || m.tipo === termoSelecionado);
    if (!modelo) return;
    setShowPreview(true);
  };

  const getPreviewContent = () => {
    if (!selecionado || !termoSelecionado) return "";
    const modelo = mockModelosTermos.find(m => m.tipo === termoSelecionado);
    if (!modelo) return "";
    return modelo.conteudo
      .replace(/\[Nome do Associado\]/g, selecionado.nome)
      .replace(/\[CPF\]/g, selecionado.cpf)
      .replace(/\[Placa\]/g, selecionado.placa)
      .replace(/\[Chassi\]/g, selecionado.chassi)
      .replace(/\[Data de Emissão\]/g, new Date().toLocaleDateString("pt-BR"));
  };

  const handleAction = (action: string, fn: () => void) => {
    setLoading(action);
    setTimeout(() => { fn(); setLoading(null); }, 900);
  };

  return (
    <div className="space-y-5">
      {/* Busca */}
      <Card className="border-[hsl(210_30%_88%)] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[hsl(212_35%_18%)]">Localizar Associado / Veículo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <Label className="text-xs">Buscar por</Label>
              <Select value={buscaTipo} onValueChange={(v: "evento" | "beneficiario" | "veiculo") => { setBuscaTipo(v); setResultados([]); setSelecionado(null); }}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="evento">Evento (Protocolo / Placa)</SelectItem>
                  <SelectItem value="beneficiario">Beneficiário (Nome)</SelectItem>
                  <SelectItem value="veiculo">Veículo (Nome / Placa / Chassi)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs">
                {buscaTipo === "evento" ? "Protocolo ou Placa" : buscaTipo === "beneficiario" ? "Nome do Beneficiário" : "Nome, Placa ou Chassi"}
              </Label>
              <Input placeholder="Digite para pesquisar..." value={busca} onChange={e => setBusca(e.target.value)} onKeyDown={e => e.key === "Enter" && pesquisar()} />
            </div>
            <Button onClick={pesquisar} className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white gap-2">
              <Search className="h-4 w-4" />Pesquisar
            </Button>
          </div>

          {/* Resultados */}
          {resultados.length > 0 && (
            <div className="border rounded-lg border-[hsl(210_30%_88%)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[hsl(210_40%_96%)]">
                    <TableHead className="text-xs">Associado</TableHead>
                    <TableHead className="text-xs">CPF</TableHead>
                    <TableHead className="text-xs">Veículo</TableHead>
                    <TableHead className="text-xs">Placa</TableHead>
                    <TableHead className="text-xs w-[100px]">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultados.map((r, i) => (
                    <TableRow key={i} className={selecionado === r ? "bg-[hsl(210_40%_94%)]" : ""}>
                      <TableCell className="text-sm font-medium">{r.nome}</TableCell>
                      <TableCell className="text-sm">{r.cpf}</TableCell>
                      <TableCell className="text-sm">{r.veiculo}</TableCell>
                      <TableCell className="text-sm font-mono">{r.placa}</TableCell>
                      <TableCell>
                        <Button size="sm" variant={selecionado === r ? "default" : "outline"} className={`h-7 text-xs ${selecionado === r ? "bg-[hsl(212_55%_40%)]" : "border-[hsl(210_30%_85%)]"}`} onClick={() => { setSelecionado(r); setTermoSelecionado(null); }}>
                          {selecionado === r ? <><CheckCircle2 className="h-3 w-3 mr-1" />Selecionado</> : "Selecionar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Termos disponíveis */}
      {selecionado && (
        <Card className="border-[hsl(210_30%_88%)] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[hsl(212_35%_18%)]">Termos Disponíveis para {selecionado.nome}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-3">
              {termosDisponiveis.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTermoSelecionado(t.id)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    termoSelecionado === t.id
                      ? "border-[hsl(212_55%_40%)] bg-[hsl(210_40%_96%)] shadow-sm"
                      : "border-[hsl(210_30%_88%)] hover:border-[hsl(210_30%_75%)]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-[hsl(212_55%_40%)]" />
                    <span className="text-sm font-medium text-[hsl(212_35%_18%)]">{t.nome}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Clique para selecionar</p>
                </button>
              ))}
            </div>

            {termoSelecionado && (
              <div className="mt-4 flex gap-2">
                <Button onClick={gerarDocumento} className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white gap-2">
                  <Eye className="h-4 w-4" />Gerar e Visualizar Termo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[hsl(212_35%_18%)]">Termo Gerado — Preview</DialogTitle></DialogHeader>
          <div className="border rounded-lg p-6 bg-white font-mono text-sm whitespace-pre-wrap leading-relaxed border-[hsl(210_30%_88%)]">
            {getPreviewContent()}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)} className="border-[hsl(210_30%_85%)]">Fechar</Button>
            <Button variant="outline" disabled={loading === "pdf"} onClick={() => handleAction("pdf", () => toast.success("PDF baixado com sucesso"))} className="gap-2 border-[hsl(210_30%_85%)]">
              {loading === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Baixar PDF
            </Button>
            <Button disabled={loading === "print"} onClick={() => handleAction("print", () => { window.print(); toast.success("Enviado para impressão"); })} className="gap-2 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white">
              {loading === "print" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── 2) Alterar Termo ───────────────────────────────────────

function AlterarTermoTab() {
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<typeof mockModelosTermos[0] | null>(null);
  const [editConteudo, setEditConteudo] = useState("");
  const [showHistorico, setShowHistorico] = useState<typeof mockModelosTermos[0] | null>(null);

  const filtered = mockModelosTermos.filter(m =>
    !busca || m.nome.toLowerCase().includes(busca.toLowerCase()) || m.tipo.toLowerCase().includes(busca.toLowerCase())
  );

  const abrirEditor = (m: typeof mockModelosTermos[0]) => {
    setEditando(m);
    setEditConteudo(m.conteudo);
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Label className="text-xs">Buscar modelo</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Nome ou tipo do termo..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="border rounded-lg border-[hsl(210_30%_88%)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(210_40%_96%)]">
              <TableHead className="text-xs">Modelo</TableHead>
              <TableHead className="text-xs">Tipo</TableHead>
              <TableHead className="text-xs">Categoria</TableHead>
              <TableHead className="text-xs">Versão</TableHead>
              <TableHead className="text-xs">Atualizado em</TableHead>
              <TableHead className="text-xs">Por</TableHead>
              <TableHead className="text-xs w-[140px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(m => (
              <TableRow key={m.id}>
                <TableCell className="text-sm font-medium">{m.nome}</TableCell>
                <TableCell><Badge variant="outline" className="border-[hsl(210_35%_70%)] text-[hsl(212_35%_30%)] bg-[hsl(210_40%_95%)] text-xs">{m.tipo}</Badge></TableCell>
                <TableCell className="text-sm capitalize">{m.categoria}</TableCell>
                <TableCell className="text-sm">v{m.versao}</TableCell>
                <TableCell className="text-sm">{new Date(m.atualizadoEm).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell className="text-sm">{m.atualizadoPor}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-[hsl(210_30%_85%)]" onClick={() => abrirEditor(m)}>
                      <Edit className="h-3 w-3" />Editar
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-[hsl(210_30%_85%)]" onClick={() => setShowHistorico(m)}>
                      <History className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Editor Dialog */}
      <Dialog open={!!editando} onOpenChange={() => setEditando(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[hsl(212_35%_18%)]">Editar Modelo — {editando?.nome}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Conteúdo do Modelo</Label>
              <Textarea className="min-h-[280px] font-mono text-sm" value={editConteudo} onChange={e => setEditConteudo(e.target.value)} />
            </div>
            <div className="p-3 bg-[hsl(210_40%_96%)] rounded-lg">
              <p className="text-xs font-semibold mb-1 text-[hsl(212_35%_18%)]">Marcadores automáticos:</p>
              <div className="flex flex-wrap gap-1.5">
                {editando?.marcadores.map(m => (
                  <Badge key={m} variant="outline" className="text-xs border-[hsl(210_35%_70%)] bg-white">{m}</Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)} className="border-[hsl(210_30%_85%)]">Cancelar</Button>
            <Button className="gap-2 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white" onClick={() => { toast.success(`Nova versão v${(editando?.versao || 0) + 1} salva com sucesso`); setEditando(null); }}>
              <Save className="h-4 w-4" />Salvar Nova Versão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Histórico Dialog */}
      <Dialog open={!!showHistorico} onOpenChange={() => setShowHistorico(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="text-[hsl(212_35%_18%)]">Histórico de Versões — {showHistorico?.nome}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {showHistorico?.historico.map(h => (
              <div key={h.versao} className="flex items-start gap-3 p-3 border rounded-lg border-[hsl(210_30%_88%)]">
                <div className="w-8 h-8 rounded-full bg-[hsl(210_40%_96%)] flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-[hsl(212_55%_40%)]">v{h.versao}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{h.resumo}</p>
                  <p className="text-xs text-muted-foreground">{new Date(h.data).toLocaleDateString("pt-BR")} — {h.usuario}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── 3) Criar Termo ─────────────────────────────────────────

function CriarTermoTab() {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const marcadoresDetectados = ["[Nome do Associado]", "[CPF]", "[Placa]", "[Chassi]", "[Data de Emissão]"];

  const handleUpload = () => {
    setLoading(true);
    setTimeout(() => { setUploaded(true); setLoading(false); toast.success("Arquivo processado com sucesso"); }, 1200);
  };

  const handleSalvar = () => {
    if (!nome || !tipo || !categoria) { toast.error("Preencha todos os campos obrigatórios"); return; }
    toast.success("Modelo de termo criado com sucesso");
    setNome(""); setTipo(""); setCategoria(""); setUploaded(false);
  };

  return (
    <div className="max-w-2xl space-y-5">
      <Card className="border-[hsl(210_30%_88%)] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[hsl(212_35%_18%)]">Novo Modelo de Termo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Nome do Termo *</Label>
              <Input placeholder="Ex: Termo de Cancelamento" value={nome} onChange={e => setNome(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Tipo de Termo *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cancelamento">Cancelamento</SelectItem>
                  <SelectItem value="responsabilidade">Responsabilidade</SelectItem>
                  <SelectItem value="retirada-rastreador">Retirada de Rastreador</SelectItem>
                  <SelectItem value="adesao">Adesão</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Categoria *</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="evento">Evento</SelectItem>
                  <SelectItem value="associado">Associado</SelectItem>
                  <SelectItem value="veiculo">Veículo</SelectItem>
                  <SelectItem value="geral">Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Upload */}
          <div>
            <Label className="text-xs">Upload do Arquivo Modelo (.doc / .docx)</Label>
            <div className="mt-1 border-2 border-dashed border-[hsl(210_30%_85%)] rounded-lg p-6 text-center hover:border-[hsl(212_55%_40%)] transition-colors cursor-pointer" onClick={handleUpload}>
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-[hsl(212_55%_40%)]" />
                  <p className="text-sm text-muted-foreground">Processando arquivo...</p>
                </div>
              ) : uploaded ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <p className="text-sm font-medium">termo_modelo.docx</p>
                  <p className="text-xs text-muted-foreground">Arquivo carregado com sucesso</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Clique para enviar ou arraste o arquivo aqui</p>
                  <p className="text-xs text-muted-foreground">Formatos aceitos: .doc, .docx</p>
                </div>
              )}
            </div>
          </div>

          {/* Marcadores detectados */}
          {uploaded && (
            <div className="p-4 bg-[hsl(210_40%_96%)] rounded-lg border border-[hsl(210_30%_88%)]">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-[hsl(212_55%_40%)]" />
                <p className="text-xs font-semibold text-[hsl(212_35%_18%)]">Marcadores identificados no modelo:</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {marcadoresDetectados.map(m => (
                  <Badge key={m} variant="outline" className="text-xs border-[hsl(210_35%_70%)] bg-white">{m}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="border-[hsl(210_30%_85%)]" onClick={() => { setNome(""); setTipo(""); setCategoria(""); setUploaded(false); }}>Limpar</Button>
            <Button className="gap-2 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white" onClick={handleSalvar}>
              <Save className="h-4 w-4" />Salvar Modelo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── 4) Relatório de Termos Emitidos ────────────────────────

function RelatorioTermosTab() {
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroUsuario, setFiltroUsuario] = useState("Todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const usuarios = ["Todos", ...Array.from(new Set(mockTermosEmitidos.map(t => t.usuario)))];

  const filtered = mockTermosEmitidos.filter(t => {
    if (filtroTipo !== "Todos" && t.tipo !== filtroTipo) return false;
    if (filtroUsuario !== "Todos" && t.usuario !== filtroUsuario) return false;
    if (busca && !t.associado.toLowerCase().includes(busca.toLowerCase()) && !t.cpf.includes(busca) && !t.placa.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const handleAction = (action: string, fn: () => void) => {
    setLoading(action);
    setTimeout(() => { fn(); setLoading(null); }, 900);
  };

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <Label className="text-xs">Tipo de Termo</Label>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>{tiposTermoFiltro.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Usuário</Label>
          <Select value={filtroUsuario} onValueChange={setFiltroUsuario}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{usuarios.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Período de</Label>
          <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-40" />
        </div>
        <div>
          <Label className="text-xs">até</Label>
          <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="w-40" />
        </div>
        <div className="flex-1 min-w-[180px]">
          <Label className="text-xs">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Nome, CPF ou placa..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>
        <Button variant="outline" className="gap-2 border-[hsl(210_30%_85%)]" disabled={loading === "excel"} onClick={() => handleAction("excel", () => toast.success("Relatório exportado para Excel"))}>
          {loading === "excel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Exportar Excel
        </Button>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg border-[hsl(210_30%_88%)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(210_40%_96%)]">
              <TableHead className="text-xs">Associado</TableHead>
              <TableHead className="text-xs">CPF</TableHead>
              <TableHead className="text-xs">Tipo de Termo</TableHead>
              <TableHead className="text-xs">Data Emissão</TableHead>
              <TableHead className="text-xs">Veículo</TableHead>
              <TableHead className="text-xs">Usuário</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(t => (
              <TableRow key={t.id}>
                <TableCell className="text-sm font-medium">{t.associado}</TableCell>
                <TableCell className="text-sm font-mono">{t.cpf}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs border-[hsl(210_35%_70%)] text-[hsl(212_35%_30%)] bg-[hsl(210_40%_95%)]">{t.tipo}</Badge>
                </TableCell>
                <TableCell className="text-sm">{new Date(t.dataEmissao).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell className="text-sm">{t.placa} — {t.modelo}</TableCell>
                <TableCell className="text-sm">{t.usuario}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum termo encontrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} termo(s) encontrado(s)</p>
    </div>
  );
}
