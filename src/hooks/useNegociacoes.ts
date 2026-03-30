import { useState, useEffect } from "react";
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
}

export function useNegociacoes(companyId?: string) {
  const [negociacoes, setNegociacoes] = useState<Negociacao[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let q = (supabase as any)
      .from("negociacoes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (companyId) q = q.eq("company_id", companyId);
    const { data } = await q;
    setNegociacoes((data as Negociacao[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

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

  return { negociacoes, loading, reload: load, create, update };
}
