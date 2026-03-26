import { useAuth, UserRole } from "./useAuth";

export function usePermission() {
  const { profile } = useAuth();
  const role: UserRole = profile?.role ?? 'consultor';

  return {
    role,
    canConcretizarVenda: ['cadastro', 'administrativo', 'diretor'].includes(role),
    canLiberarCadastro: ['supervisor', 'administrativo', 'diretor'].includes(role),
    canEditarAposConcretizacao: ['cadastro', 'administrativo', 'diretor'].includes(role),
    canAcessarFinanceiro: ['financeiro', 'administrativo', 'diretor'].includes(role),
    isAdmin: ['administrativo', 'diretor'].includes(role),
  };
}
