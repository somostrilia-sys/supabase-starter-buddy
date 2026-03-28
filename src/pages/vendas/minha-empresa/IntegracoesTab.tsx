import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Copy, ExternalLink, RefreshCw, Save, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

const regionaisOpcoes = ["São Paulo Capital", "Interior SP", "Regional Sul", "Regional Nordeste"];
const cooperativasOpcoes = ["Coop Central SP", "Coop ABC Paulista", "Coop Campinas", "Coop Curitiba"];
const camposApi = ["CPF Vendedor", "Nome Associado", "Placa", "Modelo", "Plano", "Valor Adesão", "Valor Mensalidade"];

export default function IntegracoesTab() {
  // Gestão
  const [tokenGestao, setTokenGestao] = useState("sk_gestao_live_a1b2c3d4e5f6");
  const [gestaoRegionais, setGestaoRegionais] = useState<string[]>(["São Paulo Capital", "Interior SP"]);
  const [gestaoCooperativas, setGestaoCooperativas] = useState<string[]>(["Coop Central SP"]);
  const [gestaoFormaPagamento, setGestaoFormaPagamento] = useState(true);
  const [gestaoVencimento, setGestaoVencimento] = useState(true);
  const [gestaoContaBancaria, setGestaoContaBancaria] = useState(false);
  const [gestaoConectado, setGestaoConectado] = useState(true);

  // Power Sign
  const [tokenPowerSign, setTokenPowerSign] = useState("ps_token_x9y8z7");
  const [psTipoDoc, setPsTipoDoc] = useState("documento");
  const [psEnvioMultiplo, setPsEnvioMultiplo] = useState(false);
  const [psConectado, setPsConectado] = useState(true);

  // API REST
  const [apiToken] = useState("api_rest_f1e10329c68a4fab_live_token_2025");

  const toggleList = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência");
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Integrações</h3>
        <p className="text-sm text-muted-foreground">Configure as integrações com sistemas externos</p>
      </div>

      <Accordion type="multiple" defaultValue={["gestao"]} className="space-y-3">
        {/* Gestão */}
        <AccordionItem value="gestao" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <span className="font-semibold">Gestão - Sistema de Gestão</span>
              <Badge className={gestaoConectado ? "bg-emerald-500/10 text-emerald-600 border-success/20" : "bg-destructive/10 text-destructive border-red-200"}>
                {gestaoConectado ? <><Wifi className="h-3 w-3 mr-1" /> Conectado</> : <><WifiOff className="h-3 w-3 mr-1" /> Desconectado</>}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div>
              <Label>Token Gestão</Label>
              <Input type="password" value={tokenGestao} onChange={e => setTokenGestao(e.target.value)} />
            </div>
            <div>
              <Label className="mb-2 block">Regionais Habilitadas</Label>
              <div className="grid grid-cols-2 gap-2">
                {regionaisOpcoes.map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <Checkbox checked={gestaoRegionais.includes(r)} onCheckedChange={() => toggleList(gestaoRegionais, setGestaoRegionais, r)} />
                    <span className="text-sm">{r}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Cooperativas Habilitadas</Label>
              <div className="grid grid-cols-2 gap-2">
                {cooperativasOpcoes.map(c => (
                  <div key={c} className="flex items-center gap-2">
                    <Checkbox checked={gestaoCooperativas.includes(c)} onCheckedChange={() => toggleList(gestaoCooperativas, setGestaoCooperativas, c)} />
                    <span className="text-sm">{c}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Campos Obrigatórios</Label>
              <div className="space-y-2">
                {[
                  { label: "Forma de Pagamento", value: gestaoFormaPagamento, set: setGestaoFormaPagamento },
                  { label: "Vencimento Mensalidade", value: gestaoVencimento, set: setGestaoVencimento },
                  { label: "Conta Bancária", value: gestaoContaBancaria, set: setGestaoContaBancaria },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <Checkbox checked={item.value} onCheckedChange={(v) => item.set(!!v)} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => toast.success("Conexão Gestão testada com sucesso!")} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Testar Conexão
              </Button>
              <Button className="gap-2"><Save className="h-4 w-4" /> Salvar</Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Power Sign */}
        <AccordionItem value="powersign" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <span className="font-semibold">Power Sign - Assinatura Digital</span>
              <Badge className={psConectado ? "bg-emerald-500/10 text-emerald-600 border-success/20" : "bg-destructive/10 text-destructive border-red-200"}>
                {psConectado ? <><Wifi className="h-3 w-3 mr-1" /> Conectado</> : <><WifiOff className="h-3 w-3 mr-1" /> Desconectado</>}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div>
              <Label>Token Power Sign</Label>
              <Input type="password" value={tokenPowerSign} onChange={e => setTokenPowerSign(e.target.value)} />
            </div>
            <div>
              <Label>Tipo Documento</Label>
              <Select value={psTipoDoc} onValueChange={setPsTipoDoc}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="documento">Documento</SelectItem>
                  <SelectItem value="envelope">Envelope</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg border">
              <Switch checked={psEnvioMultiplo} onCheckedChange={setPsEnvioMultiplo} />
              <Label>Envio múltiplo</Label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => toast.success("Power Sign testado com sucesso!")} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Testar
              </Button>
              <Button className="gap-2"><Save className="h-4 w-4" /> Salvar</Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* API REST */}
        <AccordionItem value="api" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <span className="font-semibold">API REST</span>
              <Badge variant="outline">Disponível</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div>
              <Label>Token de Acesso</Label>
              <div className="flex gap-2">
                <Input readOnly value={apiToken} className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(apiToken)}><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
            <Button variant="outline" onClick={() => toast.info("Novo token gerado!")} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Gerar Novo Token
            </Button>
            <div>
              <Label className="mb-2 block">Campos Disponíveis</Label>
              <div className="flex flex-wrap gap-2">
                {camposApi.map(c => (
                  <Badge key={c} variant="secondary">{c}</Badge>
                ))}
              </div>
            </div>
            <Button variant="link" className="gap-2 p-0 h-auto">
              <ExternalLink className="h-4 w-4" /> Documentação Completa
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
