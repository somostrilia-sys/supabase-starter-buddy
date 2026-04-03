/**
 * @deprecated Este componente foi substituido por DealDetailModal.
 * Mantido apenas como redirect para nao quebrar rotas existentes.
 * Veja: src/pages/vendas/pipeline/DealDetailModal.tsx
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function NegociacaoDetalhe() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/vendas/pipeline", { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Redirecionando para o Pipeline...</p>
    </div>
  );
}
