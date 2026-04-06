# Plano de Correções — Pipeline de Vendas GIA (Auditoria)

## Regras de Negócio Confirmadas
- **Consultor:** NÃO pode dar desconto, NÃO pode pedir liberação. Só preenche dados e envia cotação.
- **Gestor:** Pode acessar card do consultor, aplicar desconto até 5%, pedir liberação à IA (>5%) e escalar para diretoria.
- **IA:** Analisa automaticamente descontos >5%. Aprova ou rejeita. Se rejeita, gestor pode escalar para diretor.
- **Desconto pós-cotação:** Aberto para tentativa (não bloquear campo), mas >5% dispara análise IA automática.
- **Liberação para concluído:** Só pela IA (`gia-conferencia-final`), que confere vistoria E contrato assinado.

---

## Correção 6 — Email obrigatório + feedback
**Problema:** PDF pode ser baixado sem email. Cliente não recebe nada.
**Arquivo:** `CotacaoTab.tsx`
**Solução:**
1. Ao baixar PDF sem email, mostrar toast de aviso: "PDF baixado. Para enviar ao cliente, preencha o email na aba Associado."
2. Manter PDF liberado sem email (consultor pode imprimir).
3. Nos botões Link/WhatsApp/Email: manter validação de email obrigatório.

---

## Correção 7 — Desconto RBAC + desbloqueio pós-cotação
**Problema:** Campo de desconto bloqueado após cotação. Consultor não pode dar desconto. Gestor pode.
**Arquivos:** `CotacaoTab.tsx`, `useUsuario.ts`
**Solução:**
1. Importar `useUsuario` no CotacaoTab
2. **Consultor (`isConsultor`):** Campo de desconto 100% disabled. Sem botão Pedir Liberação. Sem ExcecaoButton. Só preenche dados e envia cotação.
3. **Gestor (`isGestor`):** Campo de desconto sempre aberto (não bloquear pós-cotação). Se >5% → análise IA automática antes de enviar. Se IA rejeita → ExcecaoButton para escalar ao diretor.
4. **Diretor/Admin:** Tudo liberado, sem análise obrigatória.
5. Remover lógica de `descontoBloqueado` por cotação enviada.
6. PedirLiberacaoButton: `disabled={isConsultor}` — consultor não vê.
7. ExcecaoButton: `disabled={isConsultor}` — consultor não vê.

---

## Correção 8 — Popular opcionais_catalogo.planos
**Problema:** Coluna `planos` vazia — todos os opcionais aparecem para todos os planos.
**Arquivo:** SQL no Supabase
**Solução:**
1. Alex precisa definir quais opcionais vão para quais planos.
2. Enquanto não definir: comportamento atual (todos aparecem para todos) é aceitável.
3. Script SQL pronto para popular quando Alex enviar a lista:
```sql
-- Exemplo:
UPDATE opcionais_catalogo SET planos = ARRAY['Básico', 'Objetivo'] WHERE nome ILIKE '%vidros nacionais%';
UPDATE opcionais_catalogo SET planos = ARRAY['Premium'] WHERE nome ILIKE '%vidros importados%';
```
**Status:** Aguardando definição do Alex.

---

## Correção 9 — normalizeCheck mais robusto
**Problema:** Match "Roubo/Furto" pode falhar com nomes diferentes.
**Arquivo:** `PlanoComparativo.tsx`
**Solução:**
1. Melhorar `normalizeCheck` para normalizar acentos (NFD) e ignorar case.
2. Split por "/" já funciona. Adicionar fuzzy: remover "a", "de", "da", "do" antes de comparar.
3. Testar com dados reais: "Danos a Terceiros" vs "Danos a terceiros (R$ 150.000)" → match pelo `includes`.

---

## Correção 10 — Som de cash não repetir
**Problema:** useEffect pode retocar som se componente remonta.
**Arquivo:** `Pipeline.tsx`
**Solução:**
1. Usar `sessionStorage` ao invés de apenas `useRef` para `concluídosProcessados`.
2. No mount, carregar IDs já processados do `sessionStorage`.
3. Quando processa novo concluído, salvar no `sessionStorage`.
4. Isso sobrevive a remounts mas reseta quando fecha a aba (sessionStorage).

---

## Correção 11 — Stages inexistentes
**Problema:** `vistoria_aprovada` e `em_contratacao` referenciados mas não existem.
**Arquivo:** `CotacaoTab.tsx` linha 221
**Solução:**
1. Manter na lista de `stagesPosCotacao` — não causa bug.
2. São stages futuros que podem ser adicionados. Deixar como está.
**Status:** Não corrigir (sem impacto).

---

## Correção 12 — Cards de aviso redundantes
**Problema:** 2 avisos parecidos quando FIPE OK mas sem plano na regional.
**Arquivo:** `CotacaoTab.tsx` linhas 832-850
**Solução:**
1. Remover o segundo card (linhas 841-850) que é redundante.
2. Manter apenas o primeiro com mensagem mais completa: "Sem precificação para este veículo nesta regional. Verifique a tabela de preços."

---

## Correção 13 — Timeline de vistoria
**Problema:** Mostra transições de stage ao invés de eventos de vistoria.
**Arquivo:** `VistoriaTab.tsx`
**Solução:**
1. Buscar eventos de `vistoria_fotos` (upload, análise IA) ao invés de `pipeline_transicoes`.
2. Mostrar: "Foto enviada: frente", "IA analisou: aprovada (score 85)", "Vistoria concluída".
3. Manter transições de stage como contexto secundário.

---

## Correção 14 — valorInstalacaoEdit persistir
**Problema:** Valor editado se perde ao trocar de aba.
**Arquivo:** `CotacaoTab.tsx`
**Solução:**
1. Ao alterar `valorInstalacaoEdit`, salvar em `negociacoes.instalacao_rastreador` via update.
2. Ao montar, ler de `deal.instalacao_rastreador` se existir.
3. Adicionar coluna `instalacao_rastreador` na tabela `negociacoes` se não existir.

---

## Correção 15 — Filtro de período default
**Problema:** Default "30d" esconde negociações antigas.
**Arquivo:** `Pipeline.tsx`
**Solução:**
1. Mudar default de "30d" para "90d".
2. Adicionar opção "Todos" no filtro de período.
3. Quando "Todos" selecionado, não filtrar por data.

---

## Correção Extra — gia-conferencia-final: adicionar verificação de contrato
**Problema:** IA confere vistoria mas NÃO confere contrato assinado.
**Arquivo:** `/home/alex/gia-objetivo/supabase/functions/gia-conferencia-final/index.ts`
**Solução:**
1. Adicionar seção 8: "CONTRATO ASSINADO (10 pontos)" após seção 7.
2. Buscar em `contratos` por `negociacao_id`.
3. Verificar `autentique_status = 'signed'` OU `autentique_signed_at IS NOT NULL`.
4. Se contrato não existe ou não assinado → pendência + score -10.
5. Ajustar score máximo total (agora 110 → threshold 88).
6. Deploy: `npx supabase functions deploy gia-conferencia-final --project-ref dxuoppekxgvdqnytftho --no-verify-jwt`

---

## Ordem de Execução

| Fase | Correção | Prioridade | Impacto |
|------|----------|-----------|---------|
| 1 | **7 (RBAC desconto)** | ALTA | Consultor dando desconto sem permissão |
| 2 | **Extra (contrato na conferência)** | ALTA | Venda concluindo sem contrato assinado |
| 3 | **10 (som cash)** | MÉDIA | UX irritante |
| 4 | **6 (email aviso)** | MÉDIA | UX |
| 5 | **12 (cards redundantes)** | BAIXA | UX |
| 6 | **9 (normalizeCheck)** | BAIXA | Edge case |
| 7 | **15 (filtro período)** | BAIXA | UX |
| 8 | **14 (instalação persistir)** | BAIXA | UX |
| 9 | **13 (timeline vistoria)** | BAIXA | UX |
| 10 | **8 (planos opcionais)** | PENDENTE | Aguarda lista do Alex |

---

## Arquivos Modificados

| Arquivo | Correções |
|---------|-----------|
| `CotacaoTab.tsx` | 6, 7, 12, 14 |
| `Pipeline.tsx` | 10, 15 |
| `PlanoComparativo.tsx` | 9 |
| `VistoriaTab.tsx` | 13 |
| `gia-conferencia-final/index.ts` | Extra (contrato) |
| SQL migration | 14 (coluna instalacao_rastreador) |
