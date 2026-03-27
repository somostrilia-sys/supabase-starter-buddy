import { useAuth, UserRole } from "./useAuth";

export function usePermission() {
  const { profile } = useAuth();
  const role: UserRole = profile?.role ?? 'consultor';

  const canConcretizarVenda = ['cadastro', 'administrativo', 'diretor'].includes(role);
  const canLiberarCadastro = ['supervisor', 'administrativo', 'diretor'].includes(role);
  const canEditarAposConcretizacao = ['cadastro', 'administrativo', 'diretor'].includes(role);
  const canAcessarFinanceiro = ['financeiro', 'administrativo', 'diretor'].includes(role);
  const isAdmin = ['administrativo', 'diretor'].includes(role);

  return {
    role,
    profile,
    // canonical names
    canConcretizarVenda,
    canLiberarCadastro,
    canEditarAposConcretizacao,
    canAcessarFinanceiro,
    isAdmin,
    // spec aliases
    canConcretizar: canConcretizarVenda,
    canEditarAssociado: canEditarAposConcretizacao,
    canVerFinanceiro: canAcessarFinanceiro,
    canVerRelatorios: ['supervisor', 'financeiro', 'administrativo', 'diretor'].includes(role),
  };
}

// CONSULTOR: só vê seus leads (usuario_id = user.id)
// GESTOR: vê todos da sua unidade (unidade_id = user.unidade_id)
// ADMIN/DIRETOR: vê todos
export function useLeadScope() {
  const { role, profile } = usePermission();
  if (role === 'consultor') return { usuario_id: profile?.id };
  if (role === 'gestor') return { unidade_id: (profile as any)?.unidade_id };
  return {} as Record<string, string | undefined>;
}
