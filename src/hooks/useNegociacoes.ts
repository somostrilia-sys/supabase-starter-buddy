import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Negociacao {
  id: string;
  codigo: string;
  lead_nome: string;
  cpf_cnpj: string;
  telefone: string;
  email: string;
  veiculo_modelo: string;
  veiculo_placa: string;
  plano: string;
  valor_plano: number;
  stage: string;
  consultor: string;
  cooperativa: string;
  regional: string;
  gerente: string;
  origem: string;
  observacoes: string;
  enviado_sga: boolean;
  company_id: string;
  visualizacoes_proposta: number;
  status_icons: Record<string, boolean>;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export type PeriodoFiltro = "7d" | "30d" | "90d" | "180d" | "365d" | "todos";

const PERIODO_DIAS: Record<PeriodoFiltro, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "180d": 180,
  "365d": 365,
  "todos": 0,
};

export function useNegociacoes(companyId?: string, periodoPadrao: PeriodoFiltro = "30d") {
  const [negociacoes, setNegociacoes] = useState<Negociacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<PeriodoFiltro>(periodoPadrao);
  const [totalCount, setTotalCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const PAGE_SIZE = 1000;
      const MAX_PAGES = periodo === "todos" ? 10 : 5;
      let allData: any[] = [];

      const dias = PERIODO_DIAS[periodo];
      const dataLimite = dias > 0 ? new Date(Date.now() - dias * 86400000).toISOString() : null;

      for (let page = 0; page < MAX_PAGES; page++) {
        let q = (supabase as any)
          .from("negociacoes")
          .select("*")
          .order("created_at", { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (dataLimite) q = q.gte("created_at", dataLimite);
        if (companyId) q = q.eq("company_id", companyId);

        const { data, error } = await q;
        if (error) { console.error("[useNegociacoes] Erro:", error.message); break; }
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < PAGE_SIZE) break; // última página
      }

      console.log("[useNegociacoes]", allData.length, "negociações carregadas, periodo:", periodo);
      setNegociacoes(allData as Negociacao[]);
      setTotalCount(allData.length);
    } catch (err) {
      console.error("[useNegociacoes] Exception:", err);
    }
    setLoading(false);
  }, [companyId, periodo]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (neg: Partial<Negociacao>) => {
    const { data, error } = await (supabase as any)
      .from("negociacoes")
      .insert([neg])
      .select()
      .single();
    if (!error) {
      setNegociacoes((prev) => [data as Negociacao, ...prev]);
    }
    return { data, error };
  };

  const update = async (id: string, patch: Partial<Negociacao>) => {
    const { error } = await (supabase as any)
      .from("negociacoes")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error)
      setNegociacoes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...patch } : n))
      );
    return { error };
  };

  return { negociacoes, loading, reload: load, create, update, periodo, setPeriodo, totalCount };
}
