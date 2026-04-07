import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ConfigData {
  validadeCotacao: string;
  prazoBoleto: string;
  maxParcelas: string;
  habImplementos: boolean;
  integAppVisto: boolean;
  bloquearPlacaDup: boolean;
  esconderOpcionais: boolean;
  envioLaudo: boolean;
  trocaTitularidade: boolean;
  limiteVistoria: string;
  selecaoConta: boolean;
  termoAdesao: string;
  termoRastreador: string;
  termoCotacao: string;
  textoCotacao: string;
  textoConfirmacao: string;
  textoComprovante: string;
  textoWhatsApp: string;
}

const defaults: ConfigData = {
  validadeCotacao: "30",
  prazoBoleto: "5",
  maxParcelas: "12",
  habImplementos: false,
  integAppVisto: false,
  bloquearPlacaDup: true,
  esconderOpcionais: false,
  envioLaudo: true,
  trocaTitularidade: false,
  limiteVistoria: "7",
  selecaoConta: false,
  termoAdesao: "Adesao",
  termoRastreador: "Rastreador",
  termoCotacao: "Cotacao",
  textoCotacao: "Prezado(a), segue sua cotacao de protecao veicular conforme solicitado.",
  textoConfirmacao: "Pagamento confirmado! Seu veiculo esta protegido.",
  textoComprovante: "Comprovante de pagamento realizado com sucesso.",
  textoWhatsApp: "Ola %{clientName}! Sua cotacao para o %{vehicleModel} esta pronta. Acesse: %{link}",
};

export default function PersonalizacaoTab() {
  const [subTab, setSubTab] = useState("configuracoes");
  const [config, setConfig] = useState<ConfigData>({ ...defaults });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("personalizacao").select("valor").eq("chave", "config").maybeSingle();
      if (data?.valor) setConfig({ ...defaults, ...data.valor });
    })();
  }, []);

  const update = <K extends keyof ConfigData>(key: K, value: ConfigData[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const saveConfig = async () => {
    setSaving(true);
    await (supabase as any).from("personalizacao").upsert({ chave: "config", valor: config, updated_at: new Date().toISOString() }, { onConflict: "chave" });
    setSaving(false);
    toast.success("Configuracoes salvas");
  };

  const saveNomenclaturas = async () => {
    setSaving(true);
    await (supabase as any).from("personalizacao").upsert({ chave: "config", valor: config, updated_at: new Date().toISOString() }, { onConflict: "chave" });
    setSaving(false);
    toast.success("Nomenclaturas salvas");
  };

  const toggleItems: { label: string; key: keyof ConfigData }[] = [
    { label: "Habilitar Implementos na Cotacao", key: "habImplementos" },
    { label: "Integracao App Visto", key: "integAppVisto" },
    { label: "Bloquear Placa Duplicada", key: "bloquearPlacaDup" },
    { label: "Esconder Valor Serviços", key: "esconderOpcionais" },
    { label: "Envio Automatico Laudo Vistoria", key: "envioLaudo" },
    { label: "Troca Titularidade Cotacao", key: "trocaTitularidade" },
    { label: "Selecao Conta Bancaria no envio Gestao", key: "selecaoConta" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Personalizacao</h3>
        <p className="text-sm text-muted-foreground">Configure parametros e nomenclaturas da empresa</p>
      </div>

<Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList>
          <TabsTrigger value="configuracoes">Configuracoes</TabsTrigger>
          <TabsTrigger value="nomenclaturas">Nomenclaturas</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracoes" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Validade da Cotacao (dias)</Label>
                  <Input
                    type="number"
                    value={config.validadeCotacao}
                    onChange={(e) => update("validadeCotacao", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Prazo Vencimento Boleto (dias)</Label>
                  <Input
                    type="number"
                    value={config.prazoBoleto}
                    onChange={(e) => update("prazoBoleto", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max. Parcelas Cartao</Label>
                  <Input
                    type="number"
                    value={config.maxParcelas}
                    onChange={(e) => update("maxParcelas", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {toggleItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <Label className="cursor-pointer">{item.label}</Label>
                    <Switch
                      checked={config[item.key] as boolean}
                      onCheckedChange={(v) => update(item.key, v)}
                    />
                  </div>
                ))}
              </div>
              <div className="w-48">
                <Label>Data Limite Vistoria (dias)</Label>
                <Input
                  type="number"
                  value={config.limiteVistoria}
                  onChange={(e) => update("limiteVistoria", e.target.value)}
                />
              </div>
              <Button className="gap-2" onClick={saveConfig}>
                <Save className="h-4 w-4" /> Salvar Configuracoes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nomenclaturas" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Termo para Adesao</Label>
                  <Input
                    value={config.termoAdesao}
                    onChange={(e) => update("termoAdesao", e.target.value)}
                    placeholder="Ex: Adesao, Taxa de Entrada"
                  />
                </div>
                <div>
                  <Label>Termo para Rastreador</Label>
                  <Input
                    value={config.termoRastreador}
                    onChange={(e) => update("termoRastreador", e.target.value)}
                    placeholder="Ex: Rastreador, Dispositivo"
                  />
                </div>
                <div>
                  <Label>Termo para Cotacao</Label>
                  <Input
                    value={config.termoCotacao}
                    onChange={(e) => update("termoCotacao", e.target.value)}
                    placeholder="Ex: Cotacao, Proposta"
                  />
                </div>
              </div>
              <div>
                <Label>Texto Cotacao</Label>
                <Textarea
                  value={config.textoCotacao}
                  onChange={(e) => update("textoCotacao", e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Texto Confirmacao Pagamento</Label>
                <Textarea
                  value={config.textoConfirmacao}
                  onChange={(e) => update("textoConfirmacao", e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Texto Comprovante Pagamento</Label>
                <Textarea
                  value={config.textoComprovante}
                  onChange={(e) => update("textoComprovante", e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Texto WhatsApp</Label>
                <Textarea
                  value={config.textoWhatsApp}
                  onChange={(e) => update("textoWhatsApp", e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tags disponiveis: %&#123;clientName&#125;, %&#123;vehicleModel&#125;, %&#123;link&#125;
                </p>
              </div>
              <Button className="gap-2" onClick={saveNomenclaturas}>
                <Save className="h-4 w-4" /> Salvar Nomenclaturas
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
