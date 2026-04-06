import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Copy, RefreshCw, Save, Wifi, WifiOff, Loader2, Database, FileSignature, Car, Shield, Camera, Brain, CreditCard, Search } from "lucide-react";
import { toast } from "sonner";

interface Integracao {
  id: string;
  nome: string;
  ativo: boolean;
  config: Record<string, any>;
  token: string | null;
  updated_at: string | null;
}

// Definição dos campos de config por integração
const INTEGRACOES_META: Record<string, {
  descricao: string;
  icon: typeof Database;
  campos: { key: string; label: string; type: "text" | "password" | "number" | "url"; placeholder: string }[];
}> = {
  SGA: {
    descricao: "Sistema de Gestão de Associações — sync de produtos, cooperativas, boletos, veículos e associados",
    icon: Database,
    campos: [
      { key: "url_base", label: "URL Base da API", type: "url", placeholder: "https://api.sga.com.br/v1" },
      { key: "cooperativa_codigo", label: "Código da Cooperativa", type: "text", placeholder: "COOP-001" },
    ],
  },
  Autentique: {
    descricao: "Assinatura digital de contratos de adesão",
    icon: FileSignature,
    campos: [
      { key: "webhook_url", label: "URL Webhook", type: "url", placeholder: "https://..." },
    ],
  },
  FIPE: {
    descricao: "Consulta tabela FIPE para precificação de veículos",
    icon: Car,
    campos: [],
  },
  CollectPro: {
    descricao: "Cobrança e gestão de associados inadimplentes",
    icon: CreditCard,
    campos: [
      { key: "webhook_url", label: "URL Webhook", type: "url", placeholder: "https://..." },
    ],
  },
  "Consulta Placa": {
    descricao: "Busca informações do veículo por placa",
    icon: Search,
    campos: [],
  },
  "IA Vistoria": {
    descricao: "Análise automática de fotos de vistoria com inteligência artificial",
    icon: Camera,
    campos: [
      { key: "threshold_score", label: "Score Mínimo de Aprovação", type: "number", placeholder: "70" },
    ],
  },
  "IA Cotação": {
    descricao: "Análise de liberação e desconto por IA",
    icon: Brain,
    campos: [],
  },
  "Webhook Pagamentos": {
    descricao: "Recebimento de confirmações de pagamento via webhook",
    icon: Shield,
    campos: [
      { key: "webhook_url", label: "URL Webhook de Recebimento", type: "url", placeholder: "https://..." },
    ],
  },
};

export default function IntegracoesTab() {
  const queryClient = useQueryClient();
  const [editingConfigs, setEditingConfigs] = useState<Map<string, { config: Record<string, any>; token: string; ativo: boolean }>>(new Map());

  const { data: integracoes = [], isLoading } = useQuery({
    queryKey: ["integracoes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("integracoes")
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data || []) as Integracao[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: { id: string; ativo: boolean; config: Record<string, any>; token: string | null }) => {
      const { error } = await (supabase as any)
        .from("integracoes")
        .update({
          ativo: payload.ativo,
          config: payload.config,
          token: payload.token || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integracoes"] });
      toast.success("Integração salva com sucesso!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar integração"),
  });

  const getEditState = (integ: Integracao) => {
    const existing = editingConfigs.get(integ.id);
    if (existing) return existing;
    return { config: { ...integ.config }, token: integ.token || "", ativo: integ.ativo };
  };

  const updateEditState = (id: string, field: "config" | "token" | "ativo", value: any) => {
    setEditingConfigs((prev) => {
      const next = new Map(prev);
      const integ = integracoes.find((i) => i.id === id);
      if (!integ) return next;
      const current = next.get(id) || { config: { ...integ.config }, token: integ.token || "", ativo: integ.ativo };
      if (field === "config") {
        next.set(id, { ...current, config: { ...current.config, ...value } });
      } else {
        next.set(id, { ...current, [field]: value });
      }
      return next;
    });
  };

  const handleSave = (integ: Integracao) => {
    const state = getEditState(integ);
    saveMutation.mutate({
      id: integ.id,
      ativo: state.ativo,
      config: state.config,
      token: state.token || null,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando integrações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Integrações</h3>
        <p className="text-sm text-muted-foreground">Configure as integrações ativas no sistema</p>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {integracoes.map((integ) => {
          const meta = INTEGRACOES_META[integ.nome];
          const Icon = meta?.icon || Database;
          const state = getEditState(integ);
          return (
            <Card key={integ.id} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${state.ativo ? "bg-emerald-500/10" : "bg-muted"}`}>
                  <Icon className={`h-4 w-4 ${state.ativo ? "text-emerald-600" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{integ.nome}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[9px] shrink-0 ${state.ativo ? "text-emerald-600 border-emerald-300" : "text-muted-foreground"}`}
                >
                  {state.ativo ? "ON" : "OFF"}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Accordion de integrações */}
      <Accordion type="multiple" className="space-y-3">
        {integracoes.map((integ) => {
          const meta = INTEGRACOES_META[integ.nome];
          const Icon = meta?.icon || Database;
          const state = getEditState(integ);

          return (
            <AccordionItem key={integ.id} value={integ.id} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{integ.nome}</span>
                  <Badge
                    className={state.ativo
                      ? "bg-emerald-500/10 text-emerald-600 border-success/20"
                      : "bg-destructive/10 text-destructive border-red-200"
                    }
                  >
                    {state.ativo ? <><Wifi className="h-3 w-3 mr-1" /> Ativo</> : <><WifiOff className="h-3 w-3 mr-1" /> Inativo</>}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <p className="text-sm text-muted-foreground">{meta?.descricao || ""}</p>

                {/* Toggle ativo */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>Ativo</Label>
                  <Switch
                    checked={state.ativo}
                    onCheckedChange={(v) => updateEditState(integ.id, "ativo", v)}
                  />
                </div>

                {/* Token */}
                <div className="space-y-1.5">
                  <Label>Token de Acesso</Label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={state.token}
                      onChange={(e) => updateEditState(integ.id, "token", e.target.value)}
                      placeholder="Cole o token aqui"
                    />
                    {state.token && (
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(state.token)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Campos de config específicos */}
                {meta?.campos && meta.campos.length > 0 && (
                  <div className="space-y-3">
                    {meta.campos.map((campo) => (
                      <div key={campo.key} className="space-y-1.5">
                        <Label className="text-xs">{campo.label}</Label>
                        <Input
                          type={campo.type}
                          value={state.config[campo.key] ?? ""}
                          onChange={(e) => updateEditState(integ.id, "config", { [campo.key]: e.target.value })}
                          placeholder={campo.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Última atualização */}
                {integ.updated_at && (
                  <p className="text-[10px] text-muted-foreground">
                    Última atualização: {new Date(integ.updated_at).toLocaleString("pt-BR")}
                  </p>
                )}

                {/* Botões */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    onClick={() => handleSave(integ)}
                    disabled={saveMutation.isPending}
                    className="gap-2"
                  >
                    {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
