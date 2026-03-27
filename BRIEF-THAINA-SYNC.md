# BRIEF GIA — Spec Thaina v2 (26/03/2026)

## PRIORIDADES DESTE BRIEF

### 1. SINCRONIZAÇÃO GLOBAL (crítico)
Após qualquer INSERT/UPDATE em qualquer tabela:
- `queryClient.invalidateQueries` com as queryKeys relacionadas
- Padrão: salvar associado → invalidar ["associados", "veiculos", "contratos", "financeiro", "relatorios"]

Implementar em TODOS os forms que ainda usam dados mock:
- Substitua qualquer array hardcoded por `useQuery` do Supabase
- Joins obrigatórios: associados ↔ veiculos ↔ contratos

### 2. AUDITORIA GLOBAL (tabela auditoria_logs)
Tabela já existe como `audit_log`. Usar ela.
Campos: entidade, entidade_id, associado_id, campo_alterado, valor_antigo, valor_novo, usuario_id, origem_modulo, created_at

Função helper (src/lib/auditoria.ts):
```ts
export async function registrarAuditoria(supabase, params: {
  entidade: string;
  entidade_id: string;
  associado_id?: string;
  campo_alterado: string;
  valor_antigo: any;
  valor_novo: any;
  origem_modulo: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("audit_log").insert({
    ...params,
    usuario_id: user?.id,
    dados_anteriores: { valor: params.valor_antigo },
    dados_novos: { valor: params.valor_novo },
    acao: `UPDATE_${params.entidade.toUpperCase()}`,
    tabela: params.entidade,
    registro_id: params.entidade_id,
  });
}
```

Chamar em TODOS os UPDATE/INSERT importantes (associado, veículo, contrato, financeiro, vistoria, evento).

### 3. RELATÓRIO DE ALTERAÇÕES (src/pages/gestao/associado/RelatorioAlteracoes.tsx)
- Ler o arquivo atual
- Garantir que busca de `audit_log` com JOIN profiles
- Filtros: período, usuário, entidade, associado_id, origem_modulo
- Colunas: Data/Hora | Associado | Entidade | Campo | DE | PARA | Usuário | Módulo
- Paginação: 50 registros por página

### 4. BOLETO AVULSO (src/pages/financeiro-module/boletos/BoletosTab.tsx)
Adicionar botão "Gerar Boleto Avulso" no topo da tela.
Modal ao clicar:
- Select "Associado" (busca ILIKE, 3 letras, JOIN com veiculos+contratos)
- Ao selecionar: auto-preenche veículo vinculado, contrato ativo, valor do plano
- Campos editáveis: valor (editável), descrição, data_vencimento
- Adicionais: taxa_administrativa (checkbox + valor), produtos_adicionais (textarea)
- Botão "Gerar": INSERT em mensalidades com tipo="avulso" + audit_log
- Não alterar nada do layout existente

### 5. DASHBOARD INADIMPLÊNCIA + REVISTORIA
Arquivo: src/pages/gestao/dashboard/DashboardTab.tsx ou src/pages/Dashboard.tsx

Novo widget "Inadimplência +5 dias / Pendentes de Revistoria":
```ts
// Query:
const { data } = useQuery({
  queryKey: ["inadimplentes"],
  queryFn: async () => {
    const { data } = await supabase
      .from("mensalidades")
      .select("*, contratos(associado_id, associados(id, nome, revistoria_status))")
      .eq("status", "em_aberto")
      .lt("vencimento", subDays(new Date(), 5).toISOString().split("T")[0]);
    return data;
  }
});
```

Ao clicar no widget: modal/drawer com lista:
- Nome | Código | Qtd boletos abertos | Dias atraso | Status revistoria
- Ao clicar no associado: drawer lateral com dados completos + boletos + histórico

Regra: associado SÓ sai da lista quando revistoria_status = "realizada"
(não remove ao pagar boleto)

### 6. CAMPO revistoria_status em associados
Adicionar na tela do associado (AlterarAssociado.tsx):
- Campo revistoria_status: "pendente" (default) | "realizada"
- Botões: "✅ Marcar Revistoria Feita" / "⏳ Marcar Pendente"
- Ao clicar: UPDATE associados SET revistoria_status + registrarAuditoria

### 7. REGRA DE SINCRONIZAÇÃO (src/lib/syncService.ts — criar)
```ts
// Após salvar qualquer entidade:
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
```
Chamar `invalidarTudo()` após qualquer operação de escrita importante.
