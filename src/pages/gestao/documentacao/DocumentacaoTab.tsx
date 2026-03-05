import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Download, Printer, Eye, Plus, Edit, Copy,
} from "lucide-react";
import { toast } from "sonner";

const mockModelos = [
  { id: 1, nome: "Termo de Adesão", tipo: "Adesão", atualizado: "2025-06-15", conteudo: `TERMO DE ADESÃO À ASSOCIAÇÃO DE PROTEÇÃO VEICULAR\n\nPelo presente instrumento, o(a) associado(a) {{NOME}}, portador(a) do CPF {{CPF}}, residente em {{ENDERECO}}, declara sua adesão voluntária à Associação de Proteção Veicular, comprometendo-se a:\n\n1. Cumprir o Estatuto Social e o Regimento Interno da Associação;\n2. Efetuar o pagamento mensal da contribuição associativa no valor de {{VALOR_MENSAL}};\n3. Manter os dados cadastrais atualizados;\n4. Comunicar imediatamente qualquer sinistro.\n\nVeículo protegido: {{MODELO}} — Placa {{PLACA}} — Ano {{ANO}}\nCota: {{COTA}} | Cooperativa: {{COOPERATIVA}}\n\nData: {{DATA}}\n\n_________________________________\nAssinatura do Associado` },
  { id: 2, nome: "Recibo de Pagamento", tipo: "Financeiro", atualizado: "2025-06-20", conteudo: `RECIBO DE PAGAMENTO\n\nRecebemos de {{NOME}}, CPF {{CPF}}, a quantia de {{VALOR}} ({{VALOR_EXTENSO}}), referente à mensalidade do período {{REFERENCIA}}.\n\nForma de pagamento: Boleto bancário\nData do pagamento: {{DATA_PAGAMENTO}}\n\nAssociação de Proteção Veicular\nCNPJ: 12.345.678/0001-90\n\nData de emissão: {{DATA}}` },
  { id: 3, nome: "Termo de Cancelamento", tipo: "Cancelamento", atualizado: "2025-05-10", conteudo: `TERMO DE CANCELAMENTO\n\nPelo presente termo, o(a) associado(a) {{NOME}}, CPF {{CPF}}, solicita o cancelamento de sua adesão à Associação de Proteção Veicular, a partir de {{DATA}}.\n\nVeículo: {{MODELO}} — Placa {{PLACA}}\nMotivo: {{MOTIVO}}\n\nFicam rescindidas todas as obrigações e direitos a partir da data acima.\n\n_________________________________\nAssinatura do Associado` },
  { id: 4, nome: "Declaração de Sinistro", tipo: "Evento", atualizado: "2025-07-01", conteudo: `DECLARAÇÃO DE SINISTRO\n\nEu, {{NOME}}, CPF {{CPF}}, declaro para os devidos fins que o veículo {{MODELO}}, placa {{PLACA}}, sofreu sinistro do tipo {{TIPO_SINISTRO}} na data de {{DATA_SINISTRO}}, no local {{LOCAL}}.\n\nDescrição dos fatos:\n{{DESCRICAO}}\n\nValor estimado do prejuízo: {{VALOR_ESTIMADO}}\nBoletim de Ocorrência nº: {{BO}}\n\n_________________________________\nAssinatura do Declarante\n\nData: {{DATA}}` },
  { id: 5, nome: "Autorização de Vistoria", tipo: "Vistoria", atualizado: "2025-06-25", conteudo: `AUTORIZAÇÃO PARA REALIZAÇÃO DE VISTORIA\n\nAutorizo a Associação de Proteção Veicular a realizar vistoria no veículo {{MODELO}}, placa {{PLACA}}, de propriedade de {{NOME}}, CPF {{CPF}}.\n\nData agendada: {{DATA_VISTORIA}}\nLocal: {{LOCAL_VISTORIA}}\n\n_________________________________\nAssinatura do Proprietário\n\nData: {{DATA}}` },
];

const tiposDoc = ["Adesão", "Financeiro", "Cancelamento", "Evento", "Vistoria"];

export default function DocumentacaoTab() {
  const [showPreview, setShowPreview] = useState<typeof mockModelos[0] | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editConteudo, setEditConteudo] = useState("");
  const [editNome, setEditNome] = useState("");
  const [editTipo, setEditTipo] = useState("Adesão");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const filtered = mockModelos.filter(m => filtroTipo === "todos" || m.tipo === filtroTipo);

  const preencherPreview = (conteudo: string) => {
    return conteudo
      .replace(/{{NOME}}/g, "Carlos Eduardo Silva")
      .replace(/{{CPF}}/g, "123.456.789-00")
      .replace(/{{ENDERECO}}/g, "Rua das Flores, 123 - São Paulo/SP")
      .replace(/{{VALOR_MENSAL}}/g, "R$ 189,90")
      .replace(/{{MODELO}}/g, "Chevrolet Onix Plus 2023")
      .replace(/{{PLACA}}/g, "BRA2E19")
      .replace(/{{ANO}}/g, "2023")
      .replace(/{{COTA}}/g, "R$ 50-70 mil")
      .replace(/{{COOPERATIVA}}/g, "Central SP")
      .replace(/{{DATA}}/g, new Date().toLocaleDateString("pt-BR"))
      .replace(/{{VALOR}}/g, "R$ 189,90")
      .replace(/{{VALOR_EXTENSO}}/g, "cento e oitenta e nove reais e noventa centavos")
      .replace(/{{REFERENCIA}}/g, "07/2025")
      .replace(/{{DATA_PAGAMENTO}}/g, "08/07/2025")
      .replace(/{{MOTIVO}}/g, "Solicitação do associado")
      .replace(/{{TIPO_SINISTRO}}/g, "Colisão")
      .replace(/{{DATA_SINISTRO}}/g, "15/06/2025")
      .replace(/{{LOCAL}}/g, "Av. Paulista, 1000 - São Paulo/SP")
      .replace(/{{DESCRICAO}}/g, "Colisão traseira no semáforo.")
      .replace(/{{VALOR_ESTIMADO}}/g, "R$ 8.500,00")
      .replace(/{{BO}}/g, "2025/123456")
      .replace(/{{DATA_VISTORIA}}/g, "20/07/2025")
      .replace(/{{LOCAL_VISTORIA}}/g, "Sede Central SP");
  };

  const handleNovoModelo = () => {
    setEditNome(""); setEditTipo("Adesão"); setEditConteudo(""); setShowEditor(true);
  };

  const handleEditar = (m: typeof mockModelos[0]) => {
    setEditNome(m.nome); setEditTipo(m.tipo); setEditConteudo(m.conteudo); setShowEditor(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold">Documentação</h2><p className="text-sm text-muted-foreground">Modelos de documentos, termos e recibos com preenchimento automático</p></div>
        <Button size="sm" onClick={handleNovoModelo}><Plus className="h-4 w-4" />Novo Modelo</Button>
      </div>

      <div className="flex gap-3 items-end">
        <div><Label className="text-xs">Tipo</Label>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{tiposDoc.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(m => (
          <Card key={m.id} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /><CardTitle className="text-base">{m.nome}</CardTitle></div>
                <Badge variant="outline">{m.tipo}</Badge>
              </div>
              <CardDescription>Atualizado em {new Date(m.atualizado).toLocaleDateString("pt-BR")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{m.conteudo.substring(0, 150)}...</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowPreview(m)}><Eye className="h-3 w-3" />Preview</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleEditar(m)}><Edit className="h-3 w-3" />Editar</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => toast.success("Documento duplicado")}><Copy className="h-3 w-3" />Duplicar</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview */}
      <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{showPreview?.nome} — Preview</DialogTitle></DialogHeader>
          {showPreview && (
            <div className="border rounded-lg p-6 bg-card font-mono text-sm whitespace-pre-wrap leading-relaxed">
              {preencherPreview(showPreview.conteudo)}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(null)}>Fechar</Button>
            <Button variant="outline" onClick={() => toast.success("Download iniciado")}><Download className="h-4 w-4" />Baixar PDF</Button>
            <Button onClick={() => toast.success("Enviado para impressão")}><Printer className="h-4 w-4" />Imprimir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editor */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editNome ? "Editar Modelo" : "Novo Modelo"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Nome do Modelo</Label><Input value={editNome} onChange={e => setEditNome(e.target.value)} /></div>
              <div><Label className="text-xs">Tipo</Label><Select value={editTipo} onValueChange={setEditTipo}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{tiposDoc.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label className="text-xs">Conteúdo (use {"{{CAMPO}}"} para campos dinâmicos)</Label><Textarea className="min-h-[300px] font-mono text-sm" value={editConteudo} onChange={e => setEditConteudo(e.target.value)} /></div>
            <div className="p-3 bg-muted rounded-lg"><p className="text-xs font-semibold mb-1">Campos disponíveis:</p><p className="text-xs text-muted-foreground">{"{{NOME}}, {{CPF}}, {{ENDERECO}}, {{VALOR_MENSAL}}, {{MODELO}}, {{PLACA}}, {{ANO}}, {{COTA}}, {{COOPERATIVA}}, {{DATA}}, {{VALOR}}, {{REFERENCIA}}, {{DATA_PAGAMENTO}}, {{MOTIVO}}, {{TIPO_SINISTRO}}, {{DATA_SINISTRO}}, {{LOCAL}}, {{DESCRICAO}}, {{VALOR_ESTIMADO}}, {{BO}}"}</p></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowEditor(false)}>Cancelar</Button><Button onClick={() => { toast.success("Modelo salvo"); setShowEditor(false); }}>Salvar Modelo</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
