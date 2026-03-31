import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Settings, DollarSign, Globe, PieChart, AlertTriangle, Shield, Landmark, Save, Palette,
} from "lucide-react";
import { toast } from "sonner";
import { useBrand } from "@/hooks/useBrand";
import { supabase } from "@/integrations/supabase/client";

export default function ParametrosTab() {
  const { brand, updateBrand } = useBrand();
  const [loading, setLoading] = useState(true);

  // Gerais
  const [menuGestao, setMenuGestao] = useState(true);
  const [menuFinanceiro, setMenuFinanceiro] = useState(true);
  const [menuVendas, setMenuVendas] = useState(true);
  const [datasPagamento, setDatasPagamento] = useState("10,20");
  const [descontoPontualidade, setDescontoPontualidade] = useState("5");
  const [jurosAtraso, setJurosAtraso] = useState("2");
  const [exibirVencidos, setExibirVencidos] = useState(true);
  const [exibirRateioBoleto, setExibirRateioBoleto] = useState(true);
  const [alertaVencido, setAlertaVencido] = useState("email");
  const [prazoAlerta, setPrazoAlerta] = useState("5");
  const [textoInformativo, setTextoInformativo] = useState("Associação de Proteção Veicular - Documento não fiscal. Em caso de dúvidas ligue (11) 3000-0000.");
  const [fonteInformativo, setFonteInformativo] = useState("8");
  const [exigirObsBoleto, setExigirObsBoleto] = useState(true);
  // Campos obrigatórios
  const [camposCadastro, setCamposCadastro] = useState({ cpf: true, nome: true, email: false, telefone: true, cnh: false, endereco: false });
  // Financeiro
  const [bancoIntegracao, setBancoIntegracao] = useState("sicoob");
  const [layoutBoleto, setLayoutBoleto] = useState("240");
  // Area cliente
  const [portalBoletos, setPortalBoletos] = useState(true);
  const [portalVistorias, setPortalVistorias] = useState(true);
  const [portalDocumentos, setPortalDocumentos] = useState(true);
  const [portalSinistros, setPortalSinistros] = useState(false);
  // Rateio
  const [exibirDetalheRateio, setExibirDetalheRateio] = useState(true);
  const [tipoDistribuicao, setTipoDistribuicao] = useState("proporcional");
  // Eventos
  const [prazoAbertura, setPrazoAbertura] = useState("48");
  const [exigirBO, setExigirBO] = useState(true);
  const [notificarEvento, setNotificarEvento] = useState(true);
  // SPC
  const [consultaAutomatica, setConsultaAutomatica] = useState(false);
  const [scoreMinimo, setScoreMinimo] = useState("400");
  // Segurança
  const [twoFactor, setTwoFactor] = useState("opcional");
  const [maxTentativas, setMaxTentativas] = useState("5");
  const [bloqueioMinutos, setBloqueioMinutos] = useState("30");

  const toggleCampo = (campo: string) => setCamposCadastro((prev: any) => ({ ...prev, [campo]: !prev[campo] }));

  // Load configs from Supabase on mount
  useEffect(() => {
    async function loadConfigs() {
      try {
        const { data, error } = await supabase
          .from("system_configs")
          .select("key, value")
          .in("key", ["regra_revistoria_dias", "boleto_config", "mensagens_padrao", "area_associado", "exibicao"]);

        if (error) {
          console.error("Erro ao carregar configurações:", error);
          toast.error("Erro ao carregar configurações");
          setLoading(false);
          return;
        }

        if (data) {
          const configMap: Record<string, any> = {};
          data.forEach((row: any) => {
            try {
              configMap[row.key] = typeof row.value === "string" ? JSON.parse(row.value) : row.value;
            } catch {
              configMap[row.key] = row.value;
            }
          });

          // regra_revistoria_dias
          if (configMap.regra_revistoria_dias) {
            const rv = configMap.regra_revistoria_dias;
            if (rv.prazoAbertura !== undefined) setPrazoAbertura(String(rv.prazoAbertura));
            if (rv.exigirBO !== undefined) setExigirBO(rv.exigirBO);
            if (rv.notificarEvento !== undefined) setNotificarEvento(rv.notificarEvento);
            if (rv.consultaAutomatica !== undefined) setConsultaAutomatica(rv.consultaAutomatica);
            if (rv.scoreMinimo !== undefined) setScoreMinimo(String(rv.scoreMinimo));
            if (rv.twoFactor !== undefined) setTwoFactor(rv.twoFactor);
            if (rv.maxTentativas !== undefined) setMaxTentativas(String(rv.maxTentativas));
            if (rv.bloqueioMinutos !== undefined) setBloqueioMinutos(String(rv.bloqueioMinutos));
          }

          // boleto_config
          if (configMap.boleto_config) {
            const bc = configMap.boleto_config;
            if (bc.datasPagamento !== undefined) setDatasPagamento(bc.datasPagamento);
            if (bc.descontoPontualidade !== undefined) setDescontoPontualidade(String(bc.descontoPontualidade));
            if (bc.jurosAtraso !== undefined) setJurosAtraso(String(bc.jurosAtraso));
            if (bc.exibirVencidos !== undefined) setExibirVencidos(bc.exibirVencidos);
            if (bc.exibirRateioBoleto !== undefined) setExibirRateioBoleto(bc.exibirRateioBoleto);
            if (bc.alertaVencido !== undefined) setAlertaVencido(bc.alertaVencido);
            if (bc.prazoAlerta !== undefined) setPrazoAlerta(String(bc.prazoAlerta));
            if (bc.textoInformativo !== undefined) setTextoInformativo(bc.textoInformativo);
            if (bc.fonteInformativo !== undefined) setFonteInformativo(String(bc.fonteInformativo));
            if (bc.exigirObsBoleto !== undefined) setExigirObsBoleto(bc.exigirObsBoleto);
            if (bc.bancoIntegracao !== undefined) setBancoIntegracao(bc.bancoIntegracao);
            if (bc.layoutBoleto !== undefined) setLayoutBoleto(bc.layoutBoleto);
          }

          // mensagens_padrao
          if (configMap.mensagens_padrao) {
            const mp = configMap.mensagens_padrao;
            if (mp.camposCadastro !== undefined) setCamposCadastro(mp.camposCadastro);
          }

          // area_associado
          if (configMap.area_associado) {
            const aa = configMap.area_associado;
            if (aa.portalBoletos !== undefined) setPortalBoletos(aa.portalBoletos);
            if (aa.portalVistorias !== undefined) setPortalVistorias(aa.portalVistorias);
            if (aa.portalDocumentos !== undefined) setPortalDocumentos(aa.portalDocumentos);
            if (aa.portalSinistros !== undefined) setPortalSinistros(aa.portalSinistros);
          }

          // exibicao
          if (configMap.exibicao) {
            const ex = configMap.exibicao;
            if (ex.menuGestao !== undefined) setMenuGestao(ex.menuGestao);
            if (ex.menuFinanceiro !== undefined) setMenuFinanceiro(ex.menuFinanceiro);
            if (ex.menuVendas !== undefined) setMenuVendas(ex.menuVendas);
            if (ex.exibirDetalheRateio !== undefined) setExibirDetalheRateio(ex.exibirDetalheRateio);
            if (ex.tipoDistribuicao !== undefined) setTipoDistribuicao(ex.tipoDistribuicao);
          }
        }
      } catch (err) {
        console.error("Erro inesperado ao carregar configurações:", err);
      } finally {
        setLoading(false);
      }
    }

    loadConfigs();
  }, []);

  const handleSalvar = async () => {
    const now = new Date().toISOString();

    const configs = [
      {
        key: "regra_revistoria_dias",
        value: JSON.stringify({ prazoAbertura, exigirBO, notificarEvento, consultaAutomatica, scoreMinimo, twoFactor, maxTentativas, bloqueioMinutos }),
        updated_at: now,
      },
      {
        key: "boleto_config",
        value: JSON.stringify({ datasPagamento, descontoPontualidade, jurosAtraso, exibirVencidos, exibirRateioBoleto, alertaVencido, prazoAlerta, textoInformativo, fonteInformativo, exigirObsBoleto, bancoIntegracao, layoutBoleto }),
        updated_at: now,
      },
      {
        key: "mensagens_padrao",
        value: JSON.stringify({ camposCadastro }),
        updated_at: now,
      },
      {
        key: "area_associado",
        value: JSON.stringify({ portalBoletos, portalVistorias, portalDocumentos, portalSinistros }),
        updated_at: now,
      },
      {
        key: "exibicao",
        value: JSON.stringify({ menuGestao, menuFinanceiro, menuVendas, exibirDetalheRateio, tipoDistribuicao }),
        updated_at: now,
      },
    ];

    const { error } = await supabase.from("system_configs").upsert(configs, { onConflict: "key" });

    if (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações");
    } else {
      toast.success("Parâmetros salvos com sucesso!");
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Parâmetros do Sistema</h2>
          <p className="text-sm text-muted-foreground">Configurações gerais, financeiras e de segurança</p>
        </div>
        <Button onClick={handleSalvar} className="gap-1.5"><Save className="h-4 w-4" />Salvar Alterações</Button>
      </div>

      <Accordion type="multiple" defaultValue={["gerais"]} className="space-y-3">
        {/* 5.1 Gerais */}
        <AccordionItem value="gerais" className="border rounded-lg shadow-sm bg-card">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Configurações Gerais</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 space-y-5">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menus Visíveis</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[{ l: "Gestão", v: menuGestao, s: setMenuGestao }, { l: "Financeiro", v: menuFinanceiro, s: setMenuFinanceiro }, { l: "Vendas", v: menuVendas, s: setMenuVendas }].map((m) => (
                  <div key={m.l} className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm">{m.l}</span>
                    <Switch checked={m.v} onCheckedChange={m.s} />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campos Obrigatórios no Cadastro</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {Object.entries(camposCadastro).map(([campo, ativo]) => (
                  <label key={campo} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={ativo} onCheckedChange={() => toggleCampo(campo)} />
                    <span className="text-sm capitalize">{campo}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Datas de pagamento (dia do mês)</Label>
                <Input value={datasPagamento} onChange={(e) => setDatasPagamento(e.target.value)} placeholder="10, 20" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Desconto pontualidade (%)</Label>
                <Input type="number" value={descontoPontualidade} onChange={(e) => setDescontoPontualidade(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Juros após vencimento (%)</Label>
                <Input type="number" value={jurosAtraso} onChange={(e) => setJurosAtraso(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Prazo alerta boleto vencido (dias)</Label>
                <Input type="number" value={prazoAlerta} onChange={(e) => setPrazoAlerta(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">Exibir boletos vencidos</span>
                <Switch checked={exibirVencidos} onCheckedChange={setExibirVencidos} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">Exibir rateio no boleto</span>
                <Switch checked={exibirRateioBoleto} onCheckedChange={setExibirRateioBoleto} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">Exigir observação em alterações de boleto</span>
                <Switch checked={exigirObsBoleto} onCheckedChange={setExigirObsBoleto} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de alerta por boleto vencido</Label>
                <Select value={alertaVencido} onValueChange={setAlertaVencido}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="todos">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Informativo no boleto (tamanho da fonte: {fonteInformativo}pt)</Label>
              <Input type="range" min="6" max="14" value={fonteInformativo} onChange={(e) => setFonteInformativo(e.target.value)} className="h-8" />
              <Textarea value={textoInformativo} onChange={(e) => setTextoInformativo(e.target.value)} rows={2} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 5.2 Financeiro */}
        <AccordionItem value="financeiro" className="border rounded-lg shadow-sm bg-card">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-2"><Landmark className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Configurações Financeiras</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Banco para integração</Label>
                <Select value={bancoIntegracao} onValueChange={setBancoIntegracao}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sicoob">Sicoob (756)</SelectItem>
                    <SelectItem value="sicredi">Sicredi (748)</SelectItem>
                    <SelectItem value="bb">Banco do Brasil (001)</SelectItem>
                    <SelectItem value="caixa">Caixa Econômica (104)</SelectItem>
                    <SelectItem value="itau">Itaú (341)</SelectItem>
                    <SelectItem value="bradesco">Bradesco (237)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Layout de remessa</Label>
                <Select value={layoutBoleto} onValueChange={setLayoutBoleto}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="240">CNAB 240</SelectItem>
                    <SelectItem value="400">CNAB 400</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Card className="border bg-muted/30">
              <CardContent className="p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Integração bancária</p>
                <p className="text-xs">Configure os dados do convênio e cedente nas configurações do banco selecionado. Regras de geração de remessa seguem o padrão FEBRABAN.</p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* 5.3 Área do Cliente */}
        <AccordionItem value="area-cliente" className="border rounded-lg shadow-sm bg-card">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Área do Associado</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 space-y-3">
            <p className="text-xs text-muted-foreground">Funcionalidades visíveis no portal/aplicativo do associado</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { l: "Boletos e pagamentos", v: portalBoletos, s: setPortalBoletos },
                { l: "Vistorias", v: portalVistorias, s: setPortalVistorias },
                { l: "Documentos", v: portalDocumentos, s: setPortalDocumentos },
                { l: "Sinistros / Eventos", v: portalSinistros, s: setPortalSinistros },
              ].map((item) => (
                <div key={item.l} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm">{item.l}</span>
                  <Switch checked={item.v} onCheckedChange={item.s} />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 5.4 Rateio */}
        <AccordionItem value="rateio" className="border rounded-lg shadow-sm bg-card">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-2"><PieChart className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Configurações de Rateio</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Exibir detalhamento do rateio</span>
              <Switch checked={exibirDetalheRateio} onCheckedChange={setExibirDetalheRateio} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de distribuição</Label>
              <Select value={tipoDistribuicao} onValueChange={setTipoDistribuicao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="proporcional">Proporcional ao valor FIPE</SelectItem>
                  <SelectItem value="igualitario">Igualitário entre associados</SelectItem>
                  <SelectItem value="cota">Por faixa de cota</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 5.5 Eventos */}
        <AccordionItem value="eventos" className="border rounded-lg shadow-sm bg-card">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Configurações de Eventos</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 space-y-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Prazo para abertura de evento (horas)</Label>
                <Input type="number" value={prazoAbertura} onChange={(e) => setPrazoAbertura(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">Exigir Boletim de Ocorrência</span>
                <Switch checked={exigirBO} onCheckedChange={setExigirBO} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">Notificar associado por evento</span>
                <Switch checked={notificarEvento} onCheckedChange={setNotificarEvento} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 5.6 SPC/Serasa */}
        <AccordionItem value="spc" className="border rounded-lg shadow-sm bg-card">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">SPC / Serasa — Envio de Inadimplentes</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <span className="text-sm">Envio automático de inadimplentes</span>
                <p className="text-xs text-muted-foreground">Enviar associados inadimplentes automaticamente para negativação SPC/Serasa</p>
              </div>
              <Switch checked={consultaAutomatica} onCheckedChange={setConsultaAutomatica} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Dias de atraso para envio automático</Label>
              <Input type="number" value={scoreMinimo} onChange={(e) => setScoreMinimo(e.target.value)} placeholder="90" />
              <p className="text-[11px] text-muted-foreground">Após quantos dias de inadimplência o associado será enviado automaticamente</p>
            </div>
            <Card className="border bg-warning/8">
              <CardContent className="p-3 text-xs text-warning">
                Integração SPC/Serasa pendente de configuração. Configure as credenciais na aba Integrações das Ferramentas.
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* 5.7 Segurança */}
        <AccordionItem value="seguranca" className="border rounded-lg shadow-sm bg-card">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Segurança</span></div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Autenticação de dois fatores</Label>
              <Select value={twoFactor} onValueChange={setTwoFactor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="desativado">Desativado</SelectItem>
                  <SelectItem value="opcional">Opcional</SelectItem>
                  <SelectItem value="obrigatorio">Obrigatório</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Máximo de tentativas de login</Label>
                <Input type="number" value={maxTentativas} onChange={(e) => setMaxTentativas(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tempo de bloqueio (minutos)</Label>
                <Input type="number" value={bloqueioMinutos} onChange={(e) => setBloqueioMinutos(e.target.value)} />
              </div>
            </div>
            <Card className="border bg-muted/30">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-medium">Políticas de acesso por perfil</p>
                <div className="grid gap-2 text-xs">
                  {[
                    { perfil: "Administrador", acesso: "Acesso total" },
                    { perfil: "Gerente", acesso: "Gestão + Financeiro + Relatórios" },
                    { perfil: "Operador", acesso: "Cadastros + Consultas" },
                    { perfil: "Vendedor", acesso: "Módulo de Vendas" },
                    { perfil: "Vistoriador", acesso: "Vistorias + Consultas" },
                  ].map((p) => (
                    <div key={p.perfil} className="flex items-center justify-between rounded border p-2">
                      <span className="font-medium">{p.perfil}</span>
                      <Badge variant="outline" className="text-xs">{p.acesso}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
