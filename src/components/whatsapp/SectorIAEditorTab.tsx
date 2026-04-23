// SectorIAEditorTab — edita SOMENTE o overlay do setor (prompt técnico + tools + modelo)
// Prompt base global fica só no CollectPRO (admin master).
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseHub } from "@/integrations/hub/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Overlay {
  id: string;
  setor: string;
  versao: number;
  prompt_tecnico: string;
  tools_permitidas: string[];
  modelo: string;
  temperature: number;
  max_tokens: number;
  max_turns: number;
  threshold_fallback_humano: number;
  ativo: boolean;
}

interface Tool {
  nome: string;
  setor: string;
  descricao: string | null;
}

interface Props {
  setor: string;
  isAdmin?: boolean;
}

export function SectorIAEditorTab({ setor, isAdmin }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: overlay, isLoading } = useQuery<Overlay | null>({
    queryKey: ["sector-overlay", setor],
    queryFn: async () => {
      const { data } = await (supabaseHub as any).from("whatsapp_ia_overlay_setor")
        .select("*").eq("setor", setor).eq("ativo", true).maybeSingle();
      return data;
    },
  });

  const { data: promptBase } = useQuery({
    queryKey: ["prompt-base-readonly"],
    queryFn: async () => {
      const { data } = await (supabaseHub as any).from("whatsapp_ia_prompt_base")
        .select("versao, system_prompt").eq("ativo", true).maybeSingle();
      return data;
    },
  });

  const { data: tools = [] } = useQuery<Tool[]>({
    queryKey: ["tools-for-setor", setor],
    queryFn: async () => {
      const { data } = await (supabaseHub as any).from("whatsapp_tools_catalog")
        .select("nome, setor, descricao").eq("ativo", true)
        .or(`setor.eq.${setor},setor.eq.todos`);
      return data || [];
    },
  });

  const save = useMutation({
    mutationFn: async (o: Partial<Overlay>) => {
      if (!overlay) return;
      const { error } = await (supabaseHub as any).from("whatsapp_ia_overlay_setor").update({
        prompt_tecnico: o.prompt_tecnico ?? overlay.prompt_tecnico,
        tools_permitidas: o.tools_permitidas ?? overlay.tools_permitidas,
        modelo: o.modelo ?? overlay.modelo,
        temperature: o.temperature ?? overlay.temperature,
        max_tokens: o.max_tokens ?? overlay.max_tokens,
        max_turns: o.max_turns ?? overlay.max_turns,
        threshold_fallback_humano: o.threshold_fallback_humano ?? overlay.threshold_fallback_humano,
      }).eq("id", overlay.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sector-overlay", setor] });
      toast({ title: "Overlay salvo" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>;
  }

  if (!overlay) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Nenhum overlay ativo para o setor <strong>{setor}</strong>. Peça pro admin criar no CollectPRO.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-500" /> IA do setor {setor}
        </h3>
        <p className="text-xs text-muted-foreground">
          O prompt final = <strong>prompt base global</strong> (CollectPRO) + <strong>overlay técnico do setor</strong> (editável aqui).
        </p>
      </div>

      {/* Prompt base (readonly) */}
      {promptBase && (
        <Card className="bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center justify-between">
              <span>Prompt base (global — somente leitura)</span>
              <Badge variant="outline" className="text-[9px]">v{promptBase.versao}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-[10px] font-mono whitespace-pre-wrap line-clamp-6 text-muted-foreground">
              {promptBase.system_prompt.slice(0, 500)}...
            </pre>
            <p className="text-[10px] text-muted-foreground mt-2">
              Editado no painel admin master (CollectPRO → IA).
            </p>
          </CardContent>
        </Card>
      )}

      {/* Overlay editável */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Overlay do setor {setor}</span>
            <Badge variant="outline" className="text-[10px]">v{overlay.versao}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Prompt técnico do setor</Label>
            <Textarea
              rows={10}
              className="text-xs font-mono"
              defaultValue={overlay.prompt_tecnico}
              disabled={!isAdmin}
              onBlur={(e) => isAdmin && e.target.value !== overlay.prompt_tecnico && save.mutate({ prompt_tecnico: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Tools permitidas</Label>
            <div className="flex flex-wrap gap-1">
              {tools.map((t) => {
                const enabled = overlay.tools_permitidas?.includes(t.nome);
                return (
                  <button
                    key={t.nome}
                    disabled={!isAdmin}
                    onClick={() => {
                      if (!isAdmin) return;
                      const next = enabled
                        ? overlay.tools_permitidas.filter((x) => x !== t.nome)
                        : [...(overlay.tools_permitidas || []), t.nome];
                      save.mutate({ tools_permitidas: next });
                    }}
                    title={t.descricao || ""}
                    className={`text-[10px] px-2 py-1 rounded border ${
                      enabled
                        ? "bg-violet-500/10 border-violet-300 text-violet-700"
                        : "border-muted text-muted-foreground hover:bg-muted/30"
                    } ${!isAdmin ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {t.nome}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <Label className="text-[10px]">Modelo</Label>
              <Select
                value={overlay.modelo}
                disabled={!isAdmin}
                onValueChange={(v) => isAdmin && save.mutate({ modelo: v })}
              >
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-sonnet-4-6">Sonnet 4.6</SelectItem>
                  <SelectItem value="claude-sonnet-4-7">Sonnet 4.7</SelectItem>
                  <SelectItem value="claude-haiku-4-5">Haiku 4.5</SelectItem>
                  <SelectItem value="claude-opus-4-7">Opus 4.7</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Temp</Label>
              <Input className="h-7 text-xs" type="number" step="0.1" min="0" max="1"
                disabled={!isAdmin}
                defaultValue={overlay.temperature}
                onBlur={(e) => isAdmin && save.mutate({ temperature: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label className="text-[10px]">Max turns</Label>
              <Input className="h-7 text-xs" type="number" min="1" max="20"
                disabled={!isAdmin}
                defaultValue={overlay.max_turns}
                onBlur={(e) => isAdmin && save.mutate({ max_turns: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label className="text-[10px]">Threshold</Label>
              <Input className="h-7 text-xs" type="number" step="0.1" min="0" max="1"
                disabled={!isAdmin}
                defaultValue={overlay.threshold_fallback_humano}
                onBlur={(e) => isAdmin && save.mutate({ threshold_fallback_humano: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
