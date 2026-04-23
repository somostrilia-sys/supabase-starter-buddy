// SectorAutomacoesTab — lista readonly das automações do setor (operador) ou CRUD (admin/gestor)
// Reutilizável em GIA/Track/CRM Eventos — diferença é só `setor` e `isAdmin`
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseHub } from "@/integrations/hub/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Zap, ArrowRightLeft, CheckCircle, MessageSquare, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Automacao {
  id: string;
  nome: string;
  keywords: string[];
  tipo: string;
  tool: string | null;
  resposta_template: string | null;
  resposta_texto: string | null;
  prioridade: number;
  ativo: boolean;
  hits_24h: number;
  ultima_execucao: string | null;
}

const TIPO_ICON: Record<string, any> = {
  resposta_texto: MessageSquare,
  transferir_setor: ArrowRightLeft,
  acionar_ia: Bot,
  encerrar: CheckCircle,
};

interface Props {
  setor: string;
  isAdmin?: boolean;
}

export function SectorAutomacoesTab({ setor, isAdmin }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: automacoes = [], isLoading } = useQuery<Automacao[]>({
    queryKey: ["sector-automacoes", setor],
    queryFn: async () => {
      const { data, error } = await (supabaseHub as any)
        .from("whatsapp_automacoes")
        .select("id, nome, keywords, tipo, tool, resposta_template, resposta_texto, prioridade, ativo, hits_24h, ultima_execucao")
        .eq("setor", setor)
        .order("prioridade", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await (supabaseHub as any).from("whatsapp_automacoes")
        .update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sector-automacoes", setor] }),
  });

  return (
    <div className="space-y-3 p-4">
      <div>
        <h3 className="text-sm font-semibold">Automações do setor {setor}</h3>
        <p className="text-xs text-muted-foreground">
          Regras de Camada 1 (keyword → ação). Configuração completa só no CollectPRO.
          {isAdmin && " Você pode ativar/desativar aqui."}
        </p>
      </div>

      {isLoading ? (
        <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
      ) : automacoes.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">Nenhuma automação pra este setor.</p>
      ) : (
        <div className="space-y-2">
          {automacoes.map((a) => {
            const Icon = TIPO_ICON[a.tipo] || Zap;
            return (
              <Card key={a.id} className={a.ativo ? "" : "opacity-60"}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{a.nome}</p>
                        <Badge variant="outline" className="text-[10px]">prio {a.prioridade}</Badge>
                        {a.tool && (
                          <Badge variant="outline" className="text-[10px] bg-violet-500/10 text-violet-700 border-violet-300">
                            ⚙ {a.tool}
                          </Badge>
                        )}
                        {a.hits_24h > 0 && (
                          <Badge variant="secondary" className="text-[10px]">{a.hits_24h} hits 24h</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {a.keywords.slice(0, 8).map((k, i) => (
                          <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{k}</span>
                        ))}
                        {a.keywords.length > 8 && (
                          <span className="text-[10px] text-muted-foreground">+{a.keywords.length - 8}</span>
                        )}
                      </div>
                      {(a.resposta_template || a.resposta_texto) && (
                        <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2 whitespace-pre-wrap">
                          {a.resposta_template || a.resposta_texto}
                        </p>
                      )}
                    </div>
                    {isAdmin && (
                      <Switch
                        checked={a.ativo}
                        onCheckedChange={(v) => toggle.mutate({ id: a.id, ativo: v })}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
