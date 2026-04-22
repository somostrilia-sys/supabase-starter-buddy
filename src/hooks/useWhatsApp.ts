// Hooks WhatsApp — Hub Central (compartilhado com CollectPro e outros sistemas)
// Setor padrão: "gestao" (GIA Módulo Gestão)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { supabaseHub, HUB_FN_URL, HUB_ANON } from "@/integrations/hub/client";
import type {
  WhatsAppInstance,
  WhatsAppTemplate,
  WhatsAppMessage,
  WhatsAppConversation,
} from "@/types/whatsapp";

export const SETOR_GIA = "gestao";

// Helper: chamar edge do Hub
async function callHubEdge(path: string, body?: any) {
  const res = await fetch(`${HUB_FN_URL}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${HUB_ANON}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

// ─── Instâncias ──────────────────────────────────────────────────────
// Lê da view pública `whatsapp_instances_public` (sem tokens, acessível via anon).
export function useWhatsAppInstances() {
  return useQuery<WhatsAppInstance[]>({
    queryKey: ["hub-whatsapp-instances"],
    queryFn: async () => {
      const { data, error } = await (supabaseHub as any)
        .from("whatsapp_instances_public")
        .select("id, nome, tipo, status, telefone, is_default_central")
        .order("is_default_central", { ascending: false });
      if (error) throw error;
      return (data || []) as WhatsAppInstance[];
    },
    staleTime: 30_000,
  });
}

export function useSaveInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<WhatsAppInstance> & { id?: string }) => {
      const { id, ...rest } = payload;
      if (id) {
        const { error } = await (supabaseHub as any).from("whatsapp_instances").update(rest).eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await (supabaseHub as any).from("whatsapp_instances").insert(rest).select().single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hub-whatsapp-instances"] }),
  });
}

export function useDeleteInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabaseHub as any).from("whatsapp_instances").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hub-whatsapp-instances"] }),
  });
}

export function useConnectInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (instance_id: string) => callHubEdge("whatsapp-instance-connect", { instance_id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hub-whatsapp-instances"] }),
  });
}

export function useRefreshStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (instance_id: string) => callHubEdge("whatsapp-instance-status", { instance_id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hub-whatsapp-instances"] }),
  });
}

// ─── Templates ───────────────────────────────────────────────────────
export function useWhatsAppTemplates(categoria?: string) {
  return useQuery<WhatsAppTemplate[]>({
    queryKey: ["hub-whatsapp-templates", categoria],
    queryFn: async () => {
      let q = (supabaseHub as any).from("whatsapp_templates").select("*").eq("ativo", true);
      if (categoria) q = q.eq("categoria", categoria);
      const { data, error } = await q.order("nome");
      if (error) throw error;
      return (data || []) as WhatsAppTemplate[];
    },
  });
}

// ─── Conversas ───────────────────────────────────────────────────────
export function useConversations(instanceId: string | null) {
  return useQuery<WhatsAppConversation[]>({
    queryKey: ["hub-whatsapp-conversations", instanceId],
    queryFn: async () => {
      if (!instanceId) return [];
      const { data, error } = await (supabaseHub as any)
        .from("whatsapp_conversations")
        .select("*")
        .eq("instance_id", instanceId)
        .order("ultima_mensagem_em", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as WhatsAppConversation[];
    },
    enabled: !!instanceId,
    staleTime: 5_000,
  });
}

// ─── Mensagens ───────────────────────────────────────────────────────
export function useMessages(instanceId: string | null, telefone: string | null) {
  const qc = useQueryClient();
  const query = useQuery<WhatsAppMessage[]>({
    queryKey: ["hub-whatsapp-messages", instanceId, telefone],
    queryFn: async () => {
      if (!instanceId || !telefone) return [];
      const { data, error } = await (supabaseHub as any)
        .from("whatsapp_messages")
        .select("*")
        .eq("instance_id", instanceId)
        .eq("telefone", telefone)
        .order("criado_em", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data || []) as WhatsAppMessage[];
    },
    enabled: !!instanceId && !!telefone,
  });

  useEffect(() => {
    if (!instanceId || !telefone) return;
    const ch = supabaseHub
      .channel(`hub-wa-msgs-${instanceId}-${telefone}`)
      .on("postgres_changes" as any,
        { event: "*", schema: "public", table: "whatsapp_messages", filter: `instance_id=eq.${instanceId}` },
        (payload: any) => {
          const row = payload.new || payload.old;
          if (row?.telefone === telefone) {
            qc.invalidateQueries({ queryKey: ["hub-whatsapp-messages", instanceId, telefone] });
            qc.invalidateQueries({ queryKey: ["hub-whatsapp-conversations", instanceId] });
          }
        },
      )
      .subscribe();
    return () => { supabaseHub.removeChannel(ch); };
  }, [instanceId, telefone, qc]);

  return query;
}

export function useInstancesRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabaseHub.channel("hub-wa-instances")
      .on("postgres_changes" as any,
        { event: "*", schema: "public", table: "whatsapp_instances" },
        () => qc.invalidateQueries({ queryKey: ["hub-whatsapp-instances"] }),
      ).subscribe();
    return () => { supabaseHub.removeChannel(ch); };
  }, [qc]);
}

// ─── Envio ───────────────────────────────────────────────────────────
export interface SendPayload {
  telefone?: string;
  associado_id?: string;
  instance_id?: string;
  template_id?: string;
  texto?: string;
  variaveis?: Record<string, any>;
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SendPayload) => callHubEdge("whatsapp-send", payload),
    onSuccess: (_, vars) => {
      if (vars.instance_id && vars.telefone) {
        qc.invalidateQueries({ queryKey: ["hub-whatsapp-messages", vars.instance_id, vars.telefone] });
      }
      qc.invalidateQueries({ queryKey: ["hub-whatsapp-conversations"] });
    },
  });
}

export function useWebhookUrls() {
  return useMemo(() => ({
    uazapi: `${HUB_FN_URL}/whatsapp-webhook-uazapi`,
    meta: `${HUB_FN_URL}/whatsapp-webhook-meta`,
  }), []);
}
