import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
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
  const { session, profile, loading } = useAuth();
  const perms = usePermission();
  const [profileTimeout, setProfileTimeout] = useState(false);

  // Profile is still loading if session exists but profile hasn't resolved yet
  const profileLoading = !loading && !!session && profile === null && !profileTimeout;
  // Wait for useUsuario to finish loading before evaluating permissions
  const permLoading = !loading && !!session && !!profile && perms.loading;
  const hasPermission = !permission || perms[permission];

  // Timeout: se profile não carrega em 3s, redireciona para login
  useEffect(() => {
    if (!loading && !!session && profile === null) {
      const timer = setTimeout(() => setProfileTimeout(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [loading, session, profile]);

  useEffect(() => {
    if (!loading && !profileLoading && session && permission && !hasPermission) {
      toast.error("Sem permissão");
    }
  }, [loading, profileLoading, session, permission, hasPermission]);

  if (loading || profileLoading || permLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session || profileTimeout) {
    return <Navigate to="/auth" replace />;
  }

  if (permission && !hasPermission) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
