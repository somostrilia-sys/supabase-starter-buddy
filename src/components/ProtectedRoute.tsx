import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { useUsuario } from "@/hooks/useUsuario";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

type PermissionKey = "canVerFinanceiro" | "canConcretizar" | "canViewGestao";

export function ProtectedRoute({
  children,
  permission,
}: {
  children: React.ReactNode;
  permission?: PermissionKey;
}) {
  const { session, loading } = useAuth();
  const { loading: usuarioLoading } = useUsuario();
  const perms = usePermission();
  const [timeout, setTimeout_] = useState(false);

  const isFullyLoaded = !loading && !usuarioLoading && !perms.loading;
  const hasPermission = !permission || perms[permission];

  // Timeout: se tudo não carrega em 10s, redireciona para login
  useEffect(() => {
    const timer = setTimeout(() => setTimeout_(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  // Redirect silencioso — sem toast (o redirect já resolve)

  // Aguarda auth + profile + usuario carregarem
  if (loading || (session && (usuarioLoading || perms.loading))) {
    if (timeout) return <Navigate to="/auth" replace />;
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (isFullyLoaded && permission && !hasPermission) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
