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

// CONSULTOR: só vê seus leads (consultor = nome do usuario)
// GESTOR: vê todos da sua cooperativa (cooperativa IN cooperativas do usuario)
// ADMIN/DIRETOR: vê todos
export function useLeadScope(): { scope: { consultor?: string; cooperativas?: string[] } | undefined; scopeReady: boolean } {
  const { usuario, isConsultor, isGestor, canViewAllData, cooperativas, loading } = useUsuario();
  if (loading) return { scope: undefined, scopeReady: false };
  if (canViewAllData) return { scope: undefined, scopeReady: true };
  if (isGestor && cooperativas.length > 0) return { scope: { cooperativas }, scopeReady: true };
  if (isConsultor && usuario?.nome) return { scope: { consultor: usuario.nome }, scopeReady: true };
  return { scope: undefined, scopeReady: true };
}
