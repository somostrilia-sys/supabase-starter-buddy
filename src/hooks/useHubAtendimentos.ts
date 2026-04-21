import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabaseHub } from "@/integrations/hub/client";

export const SETOR = "gestao";

export type AttendanceStatus =
  | "aberto" | "em_ia" | "em_humano" | "aguardando_cliente"
  | "resolvido" | "transferido" | "arquivado";

export type AttendanceStage = "automacao" | "ia" | "humano" | "aguardando" | "resolvido";

export interface Atendimento {
  id: string; instance_id: string; telefone: string; setor: string;
  status: AttendanceStatus;
  atendente_id: string | null;
  atendente_nome: string | null;
  sistema_origem: string | null;
  associado_id: string | null;
  associado_nome: string | null;
  associado_cpf: string | null;
  veiculo_placa: string | null;
  protocolo: string | null;
  intencao: string | null;
  urgencia: string | null;
  sentimento: string | null;
  tags: string[] | null;
  notas: string | null;
  sessao_step: string | null;
  sessao_dados: Record<string, unknown> | null;
  ai_context: Record<string, unknown> | null;
  ai_runs_count: number | null;
  ai_last_run: string | null;
  fallback_motivo: string | null;
  csat_nota: number | null;
  primeira_msg_em: string;
  ultima_msg_em: string;
  assumido_em: string | null;
  resolvido_em: string | null;
  sla_primeiro_resp_seg: number | null;
  sla_resolucao_seg: number | null;
}

export function statusToStage(s: AttendanceStatus, ai_runs_count?: number | null): AttendanceStage {
  if (s === "em_ia") return "ia";
  if (s === "em_humano") return "humano";
  if (s === "aguardando_cliente") return "aguardando";
  if (s === "resolvido" || s === "arquivado") return "resolvido";
  // aberto/transferido: se ainda não rolou IA, é automação (Camada 1)
  if ((ai_runs_count ?? 0) === 0) return "automacao";
  return "ia";
}

function subscribeRealtime(qc: ReturnType<typeof useQueryClient>, channelKey: string) {
  const ch = supabaseHub.channel(channelKey)
    .on("postgres_changes" as any,
      { event: "*", schema: "public", table: "whatsapp_atendimentos", filter: `setor=eq.${SETOR}` },
      () => qc.invalidateQueries({ queryKey: ["atendimentos"] }),
    ).subscribe();
  return () => { supabaseHub.removeChannel(ch); };
}

export function useAtendimentos(status?: string[]) {
  const qc = useQueryClient();
  const query = useQuery<Atendimento[]>({
    queryKey: ["atendimentos", SETOR, status],
    queryFn: async () => {
      let q = (supabaseHub as any).from("whatsapp_atendimentos").select("*").eq("setor", SETOR)
        .order("ultima_msg_em", { ascending: false }).limit(200);
      if (status?.length) q = q.in("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Atendimento[];
    },
    staleTime: 5_000,
  });
  useEffect(() => subscribeRealtime(qc, `atend-${SETOR}-all`), [qc]);
  return query;
}

/** Atendimentos atribuídos ao usuário logado (atendente_id = userId). */
export function useMyAttendances(userId?: string | null) {
  const qc = useQueryClient();
  const query = useQuery<Atendimento[]>({
    queryKey: ["atendimentos", SETOR, "mine", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabaseHub as any)
        .from("whatsapp_atendimentos").select("*")
        .eq("setor", SETOR).eq("atendente_id", userId)
        .order("ultima_msg_em", { ascending: false }).limit(200);
      if (error) throw error;
      return (data || []) as Atendimento[];
    },
    staleTime: 5_000,
  });
  useEffect(() => subscribeRealtime(qc, `atend-${SETOR}-mine`), [qc]);
  return query;
}

/** Fila do setor: sem atendente, status aberto/em_ia/aguardando_cliente. */
export function useSectorQueue() {
  const qc = useQueryClient();
  const query = useQuery<Atendimento[]>({
    queryKey: ["atendimentos", SETOR, "queue"],
    queryFn: async () => {
      const { data, error } = await (supabaseHub as any)
        .from("whatsapp_atendimentos").select("*")
        .eq("setor", SETOR).is("atendente_id", null)
        .in("status", ["aberto", "em_ia", "aguardando_cliente"])
        .order("ultima_msg_em", { ascending: false }).limit(200);
      if (error) throw error;
      return (data || []) as Atendimento[];
    },
    staleTime: 5_000,
  });
  useEffect(() => subscribeRealtime(qc, `atend-${SETOR}-queue`), [qc]);
  return query;
}

/** Contagens agregadas do setor por estágio do funil. */
export function useAttendanceCounts() {
  return useQuery({
    queryKey: ["atendimentos", SETOR, "counts"],
    queryFn: async () => {
      const { data, error } = await (supabaseHub as any)
        .from("whatsapp_atendimentos")
        .select("status, ai_runs_count")
        .eq("setor", SETOR)
        .in("status", ["aberto", "em_ia", "em_humano", "aguardando_cliente"]);
      if (error) throw error;
      const rows = (data || []) as { status: AttendanceStatus; ai_runs_count: number | null }[];
      const c = { automacao: 0, ia: 0, humano: 0, aguardando: 0, total: 0 };
      for (const r of rows) {
        const stg = statusToStage(r.status, r.ai_runs_count);
        if (stg === "automacao") c.automacao++;
        else if (stg === "ia") c.ia++;
        else if (stg === "humano") c.humano++;
        else if (stg === "aguardando") c.aguardando++;
        c.total++;
      }
      return c;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useAssumir() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { atendimento_id: string; atendente_id?: string | null; atendente_nome?: string }) => {
      await (supabaseHub as any).from("whatsapp_atendimentos").update({
        status: "em_humano",
        atendente_id: args.atendente_id ?? null,
        atendente_nome: args.atendente_nome,
        sistema_origem: "gia",
        assumido_em: new Date().toISOString(),
      }).eq("id", args.atendimento_id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["atendimentos"] }),
  });
}

/** Marca como resolvido. */
export function useResolver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { atendimento_id: string; nota_csat?: number; motivo?: string }) => {
      await (supabaseHub as any).from("whatsapp_atendimentos").update({
        status: "resolvido",
        resolvido_em: new Date().toISOString(),
        csat_nota: args.nota_csat ?? null,
        notas: args.motivo ?? null,
      }).eq("id", args.atendimento_id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["atendimentos"] }),
  });
}

/** Libera de volta pra fila (remove atendente, volta pra IA). */
export function useDevolverFila() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { atendimento_id: string; motivo?: string }) => {
      await (supabaseHub as any).from("whatsapp_atendimentos").update({
        status: "em_ia",
        atendente_id: null,
        atendente_nome: null,
        notas: args.motivo ?? null,
      }).eq("id", args.atendimento_id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["atendimentos"] }),
  });
}

export function useTransferir() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { atendimento_id: string; para_setor: string; motivo?: string }) => {
      const { data: at } = await (supabaseHub as any).from("whatsapp_atendimentos")
        .select("setor").eq("id", args.atendimento_id).single();
      await (supabaseHub as any).from("whatsapp_atendimentos").update({
        setor: args.para_setor, status: "transferido", notas: args.motivo,
      }).eq("id", args.atendimento_id);
      await (supabaseHub as any).from("whatsapp_handoffs").insert({
        atendimento_id: args.atendimento_id, tipo: "setor_to_setor",
        de_setor: at?.setor, para_setor: args.para_setor, motivo: args.motivo,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["atendimentos"] }),
  });
}

export function useFilas() {
  return useQuery({
    queryKey: ["hub-filas"],
    queryFn: async () => {
      const { data, error } = await (supabaseHub as any).from("whatsapp_filas_setor").select("*");
      if (error) throw error;
      return data || [];
    },
    staleTime: 10_000,
  });
}
