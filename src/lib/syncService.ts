import { QueryClient } from "@tanstack/react-query";

export function invalidarTudo(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["associados"] });
  queryClient.invalidateQueries({ queryKey: ["veiculos"] });
  queryClient.invalidateQueries({ queryKey: ["contratos"] });
  queryClient.invalidateQueries({ queryKey: ["mensalidades"] });
  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["vistorias"] });
  queryClient.invalidateQueries({ queryKey: ["audit_log"] });
  queryClient.invalidateQueries({ queryKey: ["inadimplentes"] });
}
