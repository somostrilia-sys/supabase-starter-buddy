# Plano de Correções — Auditoria Final GIA

## Respostas do Alex

| # | Bug | Decisão |
|---|-----|---------|
| 1 | Senhas diretores hardcoded | Mover para banco com hash |
| 2 | Dois sistemas RBAC | useUsuario como padrão único, deprecar usePermission |
| 3 | 15.603 concluídas sem contrato | Dados antigos, manter. Novas exigem contrato (já feito) |
| 4 | 18.273 neg sem consultor_id | Fuzzy match + manter sem ID os que não baterem |
| 5 | 57 coberturas duplicadas | Limpar + UNIQUE constraint |
| 6 | Gestor desconto >5% sem IA | Limitar campo a 5%. Acima = Pedir Liberação |
| 7 | Vistoria aprovar/reprovar | Remover botões. Só IA decide. Se negada, Pedir Liberação → Thainá/diretoria |
| 8 | Sem plano = veículo não liberado | Bloquear envio + Pedir Liberação diretor. Aprovação libera veículo permanentemente |
| 9 | Cache preços não atualiza | Recarregar preços ao mudar UF/cidade. FIPE do veículo permanece |
| 10 | Adesão hardcoded | Leves R$400, Motos R$250, Pesados R$1.000. Editável |
| 11 | CadastrarVoluntario.tsx morto | Remover |
| 12 | OpcionaisVeiculo.tsx morto | Remover |
| 13 | PlanosProtecao não salva | Corrigir pra salvar em grupos_produtos |
| 14 | Link comparativo público | Intencional (cliente acessa por WhatsApp) |
| 15 | Sem rate limit na senha | 5 tentativas + bloqueio 5min |
| 17 | 194 voluntários sem vínculo | Antigos/inativos, não mexer |
| 22 | PDF/contrato coberturas hardcoded | Puxar 100% serviços reais (coberturas, assistências, opcionais, benefícios) |
| 23 | Botão Simular Assinatura | Remover |
| 25 | Countdown localStorage explorável | Vincular ao banco (tabela cotacoes) |
| 26 | RBAC gestão + auditoria | Log de ações de usuários, visível só CEO/diretores |
| 27 | Duas tabelas preços | Conectar: tabela_precos (cheio) ↔ grupos_produtos (composição). Gestão ajusta pra igualar |

---

## Fase 1 — Segurança + RBAC (CRÍTICO)

### 1.1 Senhas para banco com hash
**Arquivos:** `ExcecaoAprovacao.tsx`, `gia-excecao-link/index.ts`
**Ações:**
1. Adicionar coluna `senha_hash` na tabela `diretores_notificacao`
2. Hash das senhas atuais com bcrypt na edge function
3. Frontend envia senha → edge function valida hash → retorna token de sessão
4. Remover `SENHAS_DIRETORES` do código fonte
5. Rate limit: 5 tentativas + bloqueio 5min (salvar tentativas no banco)

### 1.2 Unificar RBAC em useUsuario
**Arquivos:** `usePermission.ts`, `useUsuario.ts`, todos que importam usePermission
**Ações:**
1. Mover todas as permissões de `usePermission` para `useUsuario`
2. `usePermission` vira wrapper que chama `useUsuario` (retrocompatibilidade)
3. Permissões baseadas em `contexto_ia` (comercial, gestor_comercial, diretoria, administrativo, cadastro)
4. Migrar Pipeline.tsx, DealDetailModal.tsx, App.tsx para usar useUsuario direto

### 1.3 Auditoria de ações
**Arquivos:** nova tabela `audit_log`, componente `AuditLog.tsx`
**Ações:**
1. Criar tabela `audit_log` (usuario_id, acao, entidade, entidade_id, dados_antes, dados_depois, created_at)
2. Helper `logAudit(acao, entidade, id, antes, depois)` chamado em todas mutações
3. Tela de auditoria visível só pra CEO/diretor
4. Filtros por usuário, ação, período

---

## Fase 2 — Regras de Negócio Pipeline

### 2.1 Desconto limitado a 5% pra gestor
**Arquivo:** `CotacaoTab.tsx`
**Ações:**
1. `isGestor` → campo desconto aceita max 5%
2. Acima de 5% → campo disabled, mostrar "Use Pedir Liberação"
3. `isDiretor || isAdmin` → sem limite
4. `isConsultor` → campo totalmente disabled

### 2.2 Vistoria: remover botões aprovar/reprovar
**Arquivo:** `VistoriaTab.tsx`
**Ações:**
1. Remover botões "Aprovar" e "Reprovar" do frontend
2. Manter apenas: status da IA + botão "Pedir Liberação" se IA negou
3. Liberação vai pra Thainá/diretoria via ExcecaoButton
4. Validar vistoriaId antes de qualquer operação

### 2.3 Sem plano = veículo não liberado
**Arquivo:** `CotacaoTab.tsx`
**Ações:**
1. Se `precosReais.length === 0 && fipeFetched` → card "Veículo não liberado"
2. Desabilitar TODOS os botões de envio (PDF/Link/WhatsApp)
3. Mostrar ExcecaoButton tipo `veiculo_nao_liberado`
4. Quando diretor aprova → INSERT em `modelos_veiculo` com `aceito = true`
5. Recarregar e liberar envio

### 2.4 Remover Simular Assinatura
**Arquivo:** `AssinaturaTab.tsx`
**Ações:**
1. Deletar botão "Simular assinatura" e toda lógica associada
2. Conclusão SOMENTE via `gia-conferencia-final` (IA) com contrato assinado

---

## Fase 3 — Dados e Cache

### 3.1 Recarregar preços ao mudar UF/cidade
**Arquivo:** `CotacaoTab.tsx`
**Ações:**
1. No onChange de estado/cidade, chamar `carregarPrecos(valorFipe)` com nova regional
2. Limpar `precosReais` antes de recarregar (evitar flash de preço antigo)
3. Valor FIPE permanece inalterado

### 3.2 Adesão por tipo de veículo
**Arquivo:** `CotacaoTab.tsx`
**Ações:**
1. Fallback de adesão: Leves R$400, Motos R$250, Pesados R$1.000
2. Campo editável pelo consultor (já existe `valorInstalacaoEdit`, criar equivalente pra adesão)
3. Persistir na negociação

### 3.3 Fuzzy match consultor_id
**Arquivo:** SQL migration
**Ações:**
1. Match por ILIKE com primeiro+último nome
2. Match por telefone/email se disponível
3. Restantes ficam sem ID (históricos)

### 3.4 Limpar duplicatas coberturas
**Arquivo:** SQL migration
**Ações:**
1. DELETE duplicatas mantendo 1 de cada (menor id)
2. ALTER TABLE ADD CONSTRAINT unique_cobertura UNIQUE(plano, cobertura, tipo_veiculo)

### 3.5 Countdown no banco
**Arquivo:** `PlanoComparativo.tsx`, tabela `cotacoes`
**Ações:**
1. Adicionar coluna `oferta_inicio` (timestamp) na tabela `cotacoes`
2. Setar ao criar cotação: `oferta_inicio = NOW()`
3. PlanoComparativo lê do banco ao invés de localStorage
4. Timer = `oferta_inicio + 1h - agora`

---

## Fase 4 — PDF e Comparativo 100% Real

### 4.1 PDF cotação com serviços reais
**Arquivo:** `gerarPdfCotacao.ts`
**Ações:**
1. Remover `beneficiosMeta` hardcoded
2. Coberturas, assistências, benefícios vêm de `dados.coberturas` (já passado)
3. Opcionais vêm de `dados.opcionais` (já passado)
4. Usar `detalhe` do banco pra descrições

### 4.2 Contrato PDF com serviços reais
**Arquivo:** `AssinaturaTab.tsx`, `gerarContratoPdf.ts`
**Ações:**
1. Buscar coberturas_plano pelo plano + tipo_veiculo
2. Buscar opcionais selecionados da negociação
3. Listar tudo no contrato: coberturas inclusas + opcionais contratados + valores

### 4.3 Comparativo com tudo conectado
**Arquivo:** `PlanoComparativo.tsx`
**Ações:**
1. Coberturas do snapshot todos_planos (já funciona)
2. Opcionais filtrados por plano + tipo_veiculo (já funciona)
3. Garantir que snapshot inclui todos os dados ao criar cotação

---

## Fase 5 — Limpeza e Gestão

### 5.1 Remover código morto
**Arquivos:** deletar
1. `src/pages/gestao/cadastro/CadastrarVoluntario.tsx`
2. `src/pages/gestao/cadastro/OpcionaisVeiculo.tsx` (se existir)
3. Remover imports/rotas que referenciam esses arquivos

### 5.2 PlanosProtecao salvar no banco
**Arquivo:** `PlanosProtecao.tsx`
**Ações:**
1. `handleSaveEdit` → UPDATE em `grupos_produtos` e `grupo_produto_itens`
2. Adicionar/remover produtos do grupo via mutação Supabase
3. Feedback visual de salvo

### 5.3 Conectar tabela_precos ↔ grupos_produtos
**Arquivos:** SQL + Gestão UI
**Ações:**
1. Adicionar coluna `grupo_produto_id` na `tabela_precos` (FK para grupos_produtos)
2. Popular via match de nome (PLANO BASICO → Básico (Leves), etc.)
3. Gestão mostra: preço cheio (tabela_precos) vs composição (grupo_produto_itens) lado a lado
4. Opção de ajuste (acréscimo/desconto) pra igualar valor

---

## Ordem de Execução

| Ordem | Fase | Items | Estimativa |
|-------|------|-------|-----------|
| 1 | 1.1 | Senhas pro banco | Rápido |
| 2 | 1.2 | Unificar RBAC | Médio |
| 3 | 2.1 + 2.2 | Desconto 5% + vistoria sem botões | Rápido |
| 4 | 2.3 + 2.4 | Veículo não liberado + remover simular | Rápido |
| 5 | 3.1 + 3.2 | Cache preços + adesão por tipo | Rápido |
| 6 | 3.4 + 3.5 | Duplicatas + countdown banco | Rápido |
| 7 | 4.1 + 4.2 | PDF + contrato 100% real | Médio |
| 8 | 5.1 + 5.2 | Limpeza + PlanosProtecao | Rápido |
| 9 | 3.3 | Fuzzy match consultor_id | Rápido (SQL) |
| 10 | 1.3 | Auditoria de ações | Médio |
| 11 | 5.3 | Conectar tabelas preços | Médio |
