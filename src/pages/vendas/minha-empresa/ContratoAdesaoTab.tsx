import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bold, Italic, Underline, Save } from "lucide-react";

const camposDinamicos = [
  "{nome_associado}",
  "{cpf}",
  "{endereco}",
  "{veiculo_modelo}",
  "{veiculo_placa}",
  "{plano_nome}",
  "{valor_adesao}",
  "{valor_mensalidade}",
  "{data_atual}",
];

const defaultContrato = `CONTRATO DE ADESÃO À ASSOCIAÇÃO DE PROTEÇÃO VEICULAR

Pelo presente instrumento, {nome_associado}, portador(a) do CPF {cpf}, residente em {endereco}, doravante denominado(a) ASSOCIADO(A), vem por meio deste formalizar sua adesão ao plano {plano_nome} de proteção veicular.

VEÍCULO PROTEGIDO:
Modelo: {veiculo_modelo}
Placa: {veiculo_placa}

VALORES:
Adesão: R$ {valor_adesao}
Mensalidade: R$ {valor_mensalidade}

Data: {data_atual}

O ASSOCIADO declara ter lido e concordado com todas as cláusulas do regulamento interno da associação.`;

export default function ContratoAdesaoTab() {
  const [tituloContrato, setTituloContrato] = useState("Contrato de Adesão");
  const [conteudo, setConteudo] = useState(defaultContrato);
  const [observacoes, setObservacoes] = useState("");
  const [envioAutomatico, setEnvioAutomatico] = useState(true);
  const [powerSignHabilitado, setPowerSignHabilitado] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState("simples");
  const [envioMultiplo, setEnvioMultiplo] = useState(false);
  const [tokenPowerSign, setTokenPowerSign] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const inserirCampo = (campo: string) => {
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newText = conteudo.substring(0, start) + campo + conteudo.substring(end);
      setConteudo(newText);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + campo.length, start + campo.length);
      }, 0);
    } else {
      setConteudo(conteudo + campo);
    }
  };

  const wrapSelection = (tag: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = conteudo.substring(start, end);
    if (selected) {
      const wrapped = `<${tag}>${selected}</${tag}>`;
      setConteudo(conteudo.substring(0, start) + wrapped + conteudo.substring(end));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Contrato de Adesão</h3>
        <p className="text-sm text-muted-foreground">Configure o modelo de contrato de adesão</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Editor */}
        <div className="lg:col-span-3 space-y-4">
          <div>
            <Label>Título do Contrato</Label>
            <Input value={tituloContrato} onChange={e => setTituloContrato(e.target.value)} />
          </div>

          <Card>
            <CardContent className="p-0">
              {/* Toolbar */}
              <div className="flex items-center gap-1 p-2 border-b">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => wrapSelection("b")}><Bold className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => wrapSelection("i")}><Italic className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => wrapSelection("u")}><Underline className="h-4 w-4" /></Button>
              </div>
              <Textarea
                ref={textareaRef}
                value={conteudo}
                onChange={e => setConteudo(e.target.value)}
                rows={18}
                className="border-0 rounded-none focus-visible:ring-0 resize-none font-mono text-sm"
              />
            </CardContent>
          </Card>

          <div>
            <Label>Observações (editável pelo consultor)</Label>
            <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3} placeholder="Observações adicionais..." />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg border">
            <Switch checked={envioAutomatico} onCheckedChange={setEnvioAutomatico} />
            <Label>Envio automático por email ao concretizar venda</Label>
          </div>

          {/* Power Sign */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Power Sign</CardTitle>
                <Switch checked={powerSignHabilitado} onCheckedChange={setPowerSignHabilitado} />
              </div>
            </CardHeader>
            {powerSignHabilitado && (
              <CardContent className="space-y-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simples">Documento Simples</SelectItem>
                      <SelectItem value="envelope">Envelope</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg border">
                  <Switch checked={envioMultiplo} onCheckedChange={setEnvioMultiplo} />
                  <Label>Envio múltiplo mesmo contrato</Label>
                </div>
                <div>
                  <Label>Token Power Sign</Label>
                  <Input type="password" value={tokenPowerSign} onChange={e => setTokenPowerSign(e.target.value)} placeholder="Cole o token aqui" />
                </div>
              </CardContent>
            )}
          </Card>

          <Button className="gap-2"><Save className="h-4 w-4" /> Salvar Contrato</Button>
        </div>

        {/* Sidebar - Campos Dinâmicos */}
        <div>
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Campos Dinâmicos</CardTitle>
              <p className="text-xs text-muted-foreground">Clique para inserir no editor</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {camposDinamicos.map(campo => (
                <button
                  key={campo}
                  onClick={() => inserirCampo(campo)}
                  className="w-full text-left"
                >
                  <Badge variant="outline" className="w-full justify-start cursor-pointer hover:bg-accent transition-colors py-1.5 text-xs font-mono">
                    {campo}
                  </Badge>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
