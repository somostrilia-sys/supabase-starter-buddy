import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Save, Wifi, WifiOff, Loader2, Plus, Key } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Integracao {
  id: string;
  nome: string;
  ativo: boolean;
  config: Record<string, any>;
  token: string | null;
}

const integracoesDefault: { nome: string; descricao: string; icon: string }[] = [
  { nome: "SGA (Gestao)", descricao: "Sincronizacao com sistema de gestao de associados", icon: "🔗" },
  { nome: "Power Sign", descricao: "Assinatura digital de contratos", icon: "✍️" },
  { nome: "API REST (SDR IA)", descricao: "Endpoint para agentes IA e integrações externas", icon: "🤖" },
  { nome: "WhatsApp", descricao: "Envio automatico de cotacoes e notificacoes", icon: "💬" },
  { nome: "Gateway Pagamento", descricao: "Cobranca de adesao e mensalidades", icon: "💳" },
];

export default function IntegracoesTab() {
  const [integracoes, setIntegracoes] = useState<Integracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("integracoes").select("*").order("nome");
      if (data && data.length > 0) {
        setIntegracoes(data);
      } else {
        // Seed defaults
        const seeds = integracoesDefault.map(d => ({
          nome: d.nome,
          ativo: false,
          config: { descricao: d.descricao, icon: d.icon },
          token: null,
        }));
        const { data: inserted } = await (supabase as any).from("integracoes").insert(seeds).select();
        setIntegracoes(inserted || []);
      }
      setLoading(false);
    })();
  }, []);

  async function toggleAtivo(integ: Integracao) {
    const newAtivo = !integ.ativo;
    await (supabase as any).from("integracoes").update({ ativo: newAtivo }).eq("id", integ.id);
    setIntegracoes(prev => prev.map(i => i.id === integ.id ? { ...i, ativo: newAtivo } : i));
    toast.success(`${integ.nome} ${newAtivo ? "ativada" : "desativada"}`);
  }

  async function saveToken(integ: Integracao, token: string) {
    setSaving(integ.id);
    await (supabase as any).from("integracoes").update({ token, updated_at: new Date().toISOString() }).eq("id", integ.id);
    setIntegracoes(prev => prev.map(i => i.id === integ.id ? { ...i, token } : i));
    setSaving(null);
    toast.success(`Token de ${integ.nome} salvo`);
  }

  function copyToken(token: string) {
    navigator.clipboard.writeText(token);
    toast.success("Token copiado!");
  }

  async function gerarToken(integ: Integracao) {
    const token = `gia_${crypto.randomUUID().replace(/-/g, "").slice(0, 32)}`;
    await saveToken(integ, token);
  }

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  // API SDR info
  const apiUrl = "https://dxuoppekxgvdqnytftho.supabase.co/functions/v1/gia-sdr-api";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Integracoes</h3>
        <p className="text-sm text-muted-foreground">Configure conexoes com sistemas externos</p>
      </div>

      {integracoes.map(integ => (
        <Card key={integ.id} className={integ.ativo ? "border-emerald-500/30" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{integ.config?.icon || "🔌"}</span>
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    {integ.nome}
                    {integ.ativo ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 text-[9px]"><Wifi className="h-3 w-3 mr-1" />Ativa</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px]"><WifiOff className="h-3 w-3 mr-1" />Inativa</Badge>
                    )}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{integ.config?.descricao || ""}</p>
                </div>
              </div>
              <Switch checked={integ.ativo} onCheckedChange={() => toggleAtivo(integ)} />
            </div>
          </CardHeader>
          {integ.ativo && (
            <CardContent className="space-y-3 pt-0">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Token</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="password"
                      value={integ.token || ""}
                      onChange={e => setIntegracoes(prev => prev.map(i => i.id === integ.id ? { ...i, token: e.target.value } : i))}
                      placeholder="Cole ou gere um token"
                      className="font-mono text-xs"
                    />
                    {integ.token && (
                      <Button size="sm" variant="outline" onClick={() => copyToken(integ.token!)}><Copy className="h-3.5 w-3.5" /></Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => gerarToken(integ)}><Key className="h-3.5 w-3.5 mr-1" />Gerar</Button>
                    <Button size="sm" onClick={() => saveToken(integ, integ.token || "")} disabled={saving === integ.id}>
                      {saving === integ.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* API SDR specific info */}
              {integ.nome.includes("API") && (
                <div className="p-3 rounded-lg bg-muted/30 border space-y-2">
                  <p className="text-xs font-semibold">Endpoint SDR IA</p>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] bg-muted px-2 py-1 rounded flex-1 overflow-x-auto">{apiUrl}</code>
                    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(apiUrl); toast.success("URL copiada"); }}><Copy className="h-3 w-3" /></Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Acoes: cotacao_completa, buscar_placa, listar_planos, status_negociacao</p>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
