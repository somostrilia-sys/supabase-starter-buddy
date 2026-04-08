import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ContextoIA = "comercial" | "gestor_comercial" | "diretoria" | "administrativo" | "cadastro";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  funcao: string;
  grupo_permissao: string;
  contexto_ia: ContextoIA;
  cooperativa: string | null;
  unidade_id: string | null;
  ativo: boolean;
  slug: string | null;
  auth_id: string | null;
}

export interface UseUsuarioReturn {
  usuario: Usuario | null;
  loading: boolean;
  contexto: ContextoIA;
  cooperativas: string[];
  isConsultor: boolean;
  isGestor: boolean;
  isDiretor: boolean;
  isCEO: boolean;
  isAdmin: boolean;
  isCadastro: boolean;
  // Permissions
  canConfigMetas: boolean;
  canImportLeads: boolean;
  canViewTags: boolean;
  canViewMinhaEmpresa: boolean;
  canViewAllData: boolean;
}

export function useUsuario(): UseUsuarioReturn {
  const { profile, loading: authLoading } = useAuth();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Enquanto auth/profile ainda estiver carregando, mantém loading=true
    if (authLoading) {
      return;
    }

    if (!profile?.user_id) {
      setUsuario(null);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("usuarios")
        .select("id, nome, email, funcao, grupo_permissao, contexto_ia, cooperativa, unidade_id, ativo, slug, auth_id")
        .eq("auth_id", profile.user_id)
        .maybeSingle();

      if (data) {
        setUsuario({
          ...data,
          contexto_ia: data.contexto_ia || "comercial",
        });
      }
      setLoading(false);
    })();
  }, [profile?.user_id, authLoading]);

  return useMemo(() => {
    const contexto: ContextoIA = usuario?.contexto_ia || "comercial";
    const cooperativas = usuario?.cooperativa
      ? usuario.cooperativa.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

    const isConsultor = contexto === "comercial";
    const isGestor = contexto === "gestor_comercial";
    const isDiretor = contexto === "diretoria";
    const isAdmin = contexto === "administrativo";
    const isCadastro = contexto === "cadastro";
    const isCEO = isDiretor && (usuario?.funcao === "Administrador Master" || usuario?.grupo_permissao === "Diretor");

    return {
      usuario,
      loading,
      contexto,
      cooperativas,
      isConsultor,
      isGestor,
      isDiretor,
      isCEO,
      isAdmin,
      isCadastro,
      canConfigMetas: isGestor || isDiretor || isAdmin,
      canImportLeads: isGestor || isDiretor || isAdmin,
      canViewTags: isDiretor || isAdmin,
      canViewMinhaEmpresa: isDiretor || isAdmin,
      canViewAllData: isDiretor || isAdmin,
    };
  }, [usuario, loading]);
}
