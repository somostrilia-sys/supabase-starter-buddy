import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabaseHub } from "@/integrations/hub/client";

export const SETOR = "gestao";

export interface Atendimento {
  id: string; instance_id: string; telefone: string; setor: string;
  status: "aberto"|"em_ia"|"em_humano"|"aguardando_cliente"|"resolvido"|"transferido"|"arquivado";
  atendente_nome: string|null; sistema_origem: string|null; protocolo: string|null; ultima_msg_em: string;
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
  useEffect(() => {
    const ch = supabaseHub.channel(`atend-${SETOR}`)
      .on("postgres_changes" as any,
        { event: "*", schema: "public", table: "whatsapp_atendimentos", filter: `setor=eq.${SETOR}` },
        () => qc.invalidateQueries({ queryKey: ["atendimentos", SETOR] }),
      ).subscribe();
    return () => { supabaseHub.removeChannel(ch); };
  }, [qc]);
  return query;
}

export function useAssumir() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { atendimento_id: string; atendente_nome?: string }) => {
      await (supabaseHub as any).from("whatsapp_atendimentos").update({
        status: "em_humano", atendente_nome: args.atendente_nome,
        sistema_origem: "gia", assumido_em: new Date().toISOString(),
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
