import { useUsuario } from "./useUsuario";
import { UserRole } from "./useAuth";

export function usePermission() {
  const {
    usuario,
    loading: usuarioLoading,
    isConsultor,
    isGestor,
    isDiretor,
    isAdmin,
    isCadastro,
  } = useUsuario();

  // Map contexto_ia → legacy role name for backward compat
  const role: UserRole = (() => {
    if (isAdmin) return 'admin';
    if (isDiretor) return 'diretor';
    if (isGestor) return 'gestor';
    if (isCadastro) return 'cadastro';
    return 'consultor';
  })();

  const canConcretizarVenda = ['admin', 'cadastro', 'diretor'].includes(role);
  const canLiberarCadastro = ['admin', 'diretor', 'gestor'].includes(role);
  const canEditarAposConcretizacao = ['admin', 'cadastro', 'diretor'].includes(role);
  const canAcessarFinanceiro = ['admin', 'diretor'].includes(role);
  const isAdminOrDirector = ['admin', 'diretor'].includes(role);

  return {
    role,
    profile: usuario,
    // canonical names
    canConcretizarVenda,
    canLiberarCadastro,
    canEditarAposConcretizacao,
    canAcessarFinanceiro,
    isAdmin: isAdminOrDirector,
    // spec aliases
    canConcretizar: canConcretizarVenda,
    canEditarAssociado: canEditarAposConcretizacao,
    canVerFinanceiro: canAcessarFinanceiro,
    canVerRelatorios: ['admin', 'diretor', 'gestor'].includes(role),
    canViewGestao: ['admin', 'cadastro', 'diretor'].includes(role),
    loading: usuarioLoading,
  };
}

// CONSULTOR: só vê seus leads (usuario_id = user.id)
// GESTOR: vê todos da sua unidade (unidade_id = user.unidade_id)
// ADMIN/DIRETOR: vê todos
export function useLeadScope() {
  const { role, profile } = usePermission();
  if (role === 'consultor') return { usuario_id: (profile as any)?.id };
  if (role === 'gestor') return { unidade_id: (profile as any)?.unidade_id };
  return {} as Record<string, string | undefined>;
}
