# BRIEF — GIA: Correções Críticas e Melhorias

## Stack
- Frontend: React + Vite + TypeScript + shadcn/ui + TailwindCSS
- Backend: Supabase (`fdtyxpgozbftxgsljbsu`)
- Estado: TanStack Query + react-hook-form + zod
- Roteamento: react-router-dom

## Supabase Config
- URL: `https://fdtyxpgozbftxgsljbsu.supabase.co`
- ANON KEY: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkdHl4cGdvemJmdHhnc2xqYnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MDI0MjIsImV4cCI6MjA4ODA3ODQyMn0.wuvqnKkF9XROICgi1yGL3NEoi7SxODSCeJfeOueQ3og`

## Objetivo
Auditar e corrigir os problemas críticos do sistema GIA (Gestão Integrada da Associação).
Analisar CADA arquivo de src/pages/ e src/components/ e identificar/corrigir os problemas abaixo.

---

## PROBLEMAS CRÍTICOS A CORRIGIR

### 1. DADOS NÃO SALVANDO (prioridade máxima)
- Verificar TODOS os formulários (Associados, Veículos, Contratos, Sinistros)
- Garantir que os botões "Salvar" chamam a API corretamente (POST/PUT para Supabase)
- Verificar se há `await supabase.from(...).insert(...)` com tratamento de erro
- Qualquer form que use apenas estado local sem persistir → corrigir para salvar no Supabase
- Padrão correto:
```typescript
const { data, error } = await supabase.from('tabela').insert(payload).select().single();
if (error) throw error;
// feedback de sucesso
```

### 2. DADOS NÃO APARECEM NAS CONSULTAS
- Verificar queries de listagem (`supabase.from(...).select(...)`)
- Verificar se após salvar há `queryClient.invalidateQueries()` para refrescar
- Verificar se há filtros escondidos que impedem exibição
- Verificar se TanStack Query está configurado corretamente (queryKey, queryFn)

### 3. BOTÕES SEM RETORNO VISUAL
- Todo botão de submit deve ter: loading state, success (toast), error (toast com mensagem)
- Usar `sonner` para toasts (já está no projeto)
- Padrão:
```typescript
const [loading, setLoading] = useState(false);
// no submit:
setLoading(true);
try {
  // operação
  toast.success("Salvo com sucesso!");
} catch (e) {
  toast.error("Erro: " + e.message);
} finally {
  setLoading(false);
}
```

### 4. MÓDULO VENDAS/CRM — Pipeline Kanban
- Verificar src/pages/vendas/
- Status do pipeline: Novo Lead → Em Contato → Proposta Enviada → Em Negociação → Liberado para Cadastro → Concluído → Perdido
- Botão "Liberar para Cadastro" deve: só aparecer para Supervisor/Admin, travar edição do consultor
- Verificar se mudança de status persiste no Supabase

### 5. CONCRETIZAÇÃO DE VENDA (fluxo crítico)
- Ao concretizar venda deve criar automaticamente em uma transação:
  1. Associado (CPF único)
  2. Veículo (placa + chassi únicos)
  3. Contrato (número automático, plano, valor, status ativo)
- Se qualquer etapa falhar → rollback (não deixar dados parciais)
- Verificar se essa lógica existe em src/pages/vendas/

### 6. MÓDULO VEÍCULOS
- Campos obrigatórios: categoria_uso (Passeio/Trabalho/Aluguel/Frota/Uso do Associado) e classificacao_uso (Rastreador Sim/Não)
- Se campo vazio → bloquear cadastro com mensagem clara
- Verificar se esses campos existem nos forms

### 7. SINCRONIZAÇÃO ENTRE MÓDULOS
- Após salvar Associado → deve aparecer imediatamente em consultas
- Após salvar Veículo → deve aparecer em listagens e relatórios
- Garantir que todas as queries consultam a tabela principal (não dados em cache stale)

---

## REGRAS DE DESENVOLVIMENTO
1. NÃO quebrar o que já funciona
2. Preservar IDs e estrutura de banco existente
3. Usar apenas as dependências já instaladas
4. TypeScript correto (sem `any` desnecessário)
5. Após CADA correção: testar se o fluxo compila (`npm run build` ou verificar erros de tipo)

---

## ENTREGÁVEIS
1. Corrigir os problemas acima em todos os arquivos relevantes
2. Fazer `git add -A && git commit -m "fix: correções críticas GIA - formulários, persistência e feedback visual"
3. `git push origin main`

## NOTIFICAÇÃO
Quando terminar: `openclaw system event --text "GIA corrigido: formulários persistindo, queries atualizando, feedback visual em todos os botões" --mode now`
