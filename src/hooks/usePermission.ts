import { useAuth, UserRole } from "./useAuth";

export function usePermission() {
  const { profile } = useAuth();
  const role: UserRole = profile?.role ?? 'consultor';

  const canConcretizarVenda = ['admin', 'cadastro', 'administrativo', 'diretor'].includes(role);
  const canLiberarCadastro = ['admin', 'supervisor', 'administrativo', 'diretor'].includes(role);
  const canEditarAposConcretizacao = ['admin', 'cadastro', 'administrativo', 'diretor'].includes(role);
  const canAcessarFinanceiro = ['admin', 'financeiro', 'administrativo', 'diretor'].includes(role);
  const isAdmin = ['admin', 'administrativo', 'diretor'].includes(role);

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
    canVerRelatorios: ['admin', 'supervisor', 'financeiro', 'administrativo', 'diretor'].includes(role),
    canViewGestao: ['admin', 'cadastro', 'administrativo', 'diretor'].includes(role),
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
