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

export function useNegociacoes(companyId?: string, periodoPadrao: PeriodoFiltro = "30d", scope?: { consultor?: string; cooperativas?: string[] }) {
  const [negociacoes, setNegociacoes] = useState<Negociacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<PeriodoFiltro>(periodoPadrao);
  const [totalCount, setTotalCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar via fetch direto pra contornar limite de 1000 do supabase-js
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const url = import.meta.env.VITE_SUPABASE_URL;
      const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const dias = PERIODO_DIAS[periodo];
      const dataLimite = dias > 0 ? new Date(Date.now() - dias * 86400000).toISOString() : null;

      const PAGE_SIZE = 1000;
      const MAX_PAGES = periodo === "todos" ? 10 : 5;
      const fields = "id,codigo,lead_nome,cpf_cnpj,telefone,email,veiculo_modelo,veiculo_placa,plano,valor_plano,stage,consultor,cooperativa,regional,gerente,origem,observacoes,enviado_sga,visualizacoes_proposta,status_icons,created_at,updated_at,chassi,renavam,ano_fabricacao,ano_modelo,cor,combustivel,cidade_circulacao,estado_circulacao,dia_vencimento,vistoria_status,vistoria_motivo,cache_fipe,cache_precos,cotacao_id,proposta_concorrente_url,desconto_aprovado_por,desconto_ia_aprovado,desconto_percentual";
      const headers = { apikey, Authorization: `Bearer ${token || apikey}` };

      // Primeira página rápida — mostra imediatamente
      const p0 = new URLSearchParams({ select: fields, order: "created_at.desc", offset: "0", limit: String(PAGE_SIZE) });
      if (dataLimite) p0.set("created_at", `gte.${dataLimite}`);
      if (companyId) p0.set("company_id", `eq.${companyId}`);
      if (scope?.consultor) p0.set("consultor", `eq.${scope.consultor}`);
      if (scope?.cooperativas && scope.cooperativas.length > 0) p0.set("cooperativa", `in.(${scope.cooperativas.join(",")})`);
      const r0 = await fetch(`${url}/rest/v1/negociacoes?${p0}`, { headers });
      const d0 = await r0.json();
      if (!Array.isArray(d0)) { setNegociacoes([]); setTotalCount(0); setLoading(false); return; }

      // Mostrar primeira página instantaneamente
      setNegociacoes(d0 as Negociacao[]);
      setTotalCount(d0.length);
      setLoading(false);

      let allData = [...d0];

      // Carregar o resto em background (sem loading spinner)
      if (d0.length === PAGE_SIZE) {
        const promises = [];
        for (let page = 1; page < MAX_PAGES; page++) {
          const px = new URLSearchParams({ select: fields, order: "created_at.desc", offset: String(page * PAGE_SIZE), limit: String(PAGE_SIZE) });
          if (dataLimite) px.set("created_at", `gte.${dataLimite}`);
          if (companyId) px.set("company_id", `eq.${companyId}`);
          if (scope?.consultor) px.set("consultor", `eq.${scope.consultor}`);
          if (scope?.cooperativas && scope.cooperativas.length > 0) px.set("cooperativa", `in.(${scope.cooperativas.join(",")})`);
          promises.push(fetch(`${url}/rest/v1/negociacoes?${px}`, { headers }).then(r => r.json()));
        }
        const results = await Promise.all(promises);
        for (const data of results) {
          if (Array.isArray(data) && data.length > 0) allData = allData.concat(data);
        }
        // Atualizar silenciosamente com todos os dados
        setNegociacoes(allData as Negociacao[]);
        setTotalCount(allData.length);
        return; // skip the final set below
      }

      console.log("[useNegociacoes]", allData.length, "negociações, periodo:", periodo);
      setNegociacoes(allData as Negociacao[]);
      setTotalCount(allData.length);
    } catch (err) {
      console.error("[useNegociacoes] Exception:", err);
    }
    setLoading(false);
  }, [companyId, periodo, scope?.consultor, scope?.cooperativas?.join(",")]);

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
