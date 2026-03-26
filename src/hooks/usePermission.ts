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
