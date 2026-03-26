# BRIEF — GIA: Implementação Completa conforme Especificação

## Contexto
Sistema GIA (Gestão Integrada da Associação) para a Objetivo Auto e Truck.
Frontend React + Vite + TypeScript + shadcn/ui + TailwindCSS.
Backend Supabase `fdtyxpgozbftxgsljbsu`.

## MISSÃO
Implementar o sistema COMPLETO conforme a especificação funcional da Thaina.
O sistema deve funcionar de ponta a ponta, com todos os módulos integrados.

---

## 1. CONTROLE DE ACESSO (RBAC)

Perfis: `consultor`, `supervisor`, `cadastro`, `financeiro`, `administrativo`, `diretor`

Regras críticas:
- Só `cadastro` e `admin/diretor` podem concretizar venda, editar dados finais, liberar para gestão
- Após venda concretizada: bloquear edição para perfis limitados
- Botão "Liberar para Cadastro": só aparece para supervisor/admin/diretor

Implementar em `src/contexts/AuthContext.tsx` ou similar:
- Hook `usePermission(role)` retornando boolean
- HOC/guard para proteger ações por perfil

---

## 2. CRM — PIPELINE KANBAN (src/pages/vendas/)

Status do pipeline (nesta ordem):
1. `novo_lead`
2. `em_contato`
3. `proposta_enviada`
4. `em_negociacao`
5. `liberado_cadastro`
6. `concluido`
7. `perdido`

Funcionalidades:
- Board Kanban visual com cards por status
- Cadastro de leads: nome, telefone, interesse, veículo de interesse
- Histórico de interações por lead (log de atividades)
- Botão "Liberar para Cadastro" (só supervisor/admin): muda status + trava edição pelo consultor
- Drag-and-drop entre colunas (ou botões de avançar/retroceder status)
- Tudo persiste no Supabase (tabela `pipeline` ou `leads`)

---

## 3. CONCRETIZAÇÃO DE VENDA (fluxo principal)

Botão "Concretizar Venda" (só cadastro/admin):

Ao clicar, abrir modal com formulário completo e criar em transação:

### Associado
- CPF (único, validar formato)
- Nome completo
- Data de nascimento
- Telefone
- Email
- Endereço completo

### Veículo
- Placa (única, formato ABC1234 ou ABC1D23)
- Chassi (único)
- Marca/Modelo
- Ano
- Valor FIPE
- **Categoria de uso** (obrigatório): Passeio | Trabalho | Aluguel | Frota | Uso do Associado
- **Classificação de uso** (obrigatório): Rastreador Sim | Rastreador Não

### Contrato
- Plano (dropdown dos produtos cadastrados)
- Valor mensal
- Número automático (sequencial)
- Status: ativo

### Documentos (upload ou checklist)
- CNH
- CRLV
- Comprovante de residência

### Vistoria (criada automaticamente)
- Status inicial: Pendente

**Fluxo técnico:**
```typescript
// Usar transação Supabase RPC ou chamadas sequenciais com rollback manual
const { data: assoc, error: e1 } = await supabase.from('associados').insert({...}).select().single();
if (e1) throw e1;
const { data: vei, error: e2 } = await supabase.from('veiculos').insert({...associado_id: assoc.id}).select().single();
if (e2) { await supabase.from('associados').delete().eq('id', assoc.id); throw e2; }
// etc.
```

---

## 4. MÓDULO ASSOCIADOS (src/pages/Associados.tsx)

- Listagem com busca por nome (autocomplete 3 letras) e CPF
- Status: Ativo | Inadimplente | Cancelado | Suspenso
- Formulário de cadastro/edição completo
- Ver veículos vinculados
- Ver contratos e boletos
- Após salvar: invalidar query + toast de sucesso
- Campos obrigatórios com validação zod

---

## 5. MÓDULO VEÍCULOS (src/pages/Veiculos.tsx)

- Busca por placa (autocomplete) e chassi
- Campos obrigatórios: placa, chassi, categoria_uso, classificacao_uso
- Se campos vazios → bloquear submit + mensagem de erro
- Vínculo com associado (dropdown com busca)
- Listagem com filtros por categoria e classificação

---

## 6. MÓDULO FINANCEIRO (src/pages/financeiro/)

### Boletos
- Geração automática ao ativar associado
- Status: Pago | Em aberto | Vencido | Negociado
- Baixa manual (botão "Marcar como pago") e automática
- Envio por WhatsApp/Email (botão de ação)

### Cálculo proporcional (primeiro boleto)
```
valor_diario = mensalidade / 30
valor_proporcional = valor_diario × dias_restantes_no_mes
```
Aplicar automaticamente no primeiro boleto ao concretizar venda.

### Congelamento de cobrança
- Se associado tem evento tipo "indenização" ou "perda total" com status "aberto"
- → não gerar boletos, retirar do lote

### Reativação automática
- Pagamento confirmado → reativar associado se estava inadimplente

### Alertas automáticos
- 5 dias antes do vencimento: disparar notificação (WhatsApp/Email)
- Inadimplência (vencido): disparar alerta

---

## 7. MÓDULO EVENTOS/SINISTROS (src/pages/Sinistros.tsx)

Status: Aberto | Em análise | Aprovado | Negado | Finalizado

- Abertura de evento vinculado ao veículo/associado
- Impacto financeiro automático: ao abrir evento de indenização → congelar cobrança
- Ao finalizar evento → descongelar cobrança

---

## 8. VISTORIAS (src/pages/Vistorias.tsx)

Status: Pendente | Aprovada | Reprovada

- Criada automaticamente ao concretizar venda (pendente)
- Pode adicionar fotos e observações
- Mudança de status com log de auditoria

---

## 9. ALERTAS E NOTIFICAÇÕES

Tipos de alerta:
- Vencimento próximo (5 dias)
- Inadimplência
- Vistoria pendente

Implementar como notificações no sistema (badge na sidebar) + toast ao entrar na tela relevante.

---

## 10. RELATÓRIOS (src/pages/gestao/)

- Relatório de associados com filtros: status, período, unidade
- Relatório de veículos com filtros: categoria_uso, classificacao_uso (Rastreador Sim/Não)
- Relatório financeiro: boletos gerados, pagos, inadimplentes, valor total
- Relatório de eventos: por status, por período

---

## 11. AUDITORIA

Em todas as operações de insert/update críticas, registrar em tabela `audit_log`:
- `usuario_id`, `acao`, `tabela`, `registro_id`, `dados_anteriores`, `dados_novos`, `created_at`

---

## REGRAS TÉCNICAS OBRIGATÓRIAS

1. **Todo save deve ter:**
   - Loading state no botão
   - Toast de sucesso (sonner)
   - Toast de erro com mensagem do Supabase
   - `queryClient.invalidateQueries()` após sucesso

2. **Formulários:** usar react-hook-form + zod para validação

3. **Queries:** usar TanStack Query (`useQuery`) para listagens

4. **Erros silenciosos:** ZERO tolerância — todo catch deve mostrar toast

5. **Campos obrigatórios:** validação no frontend E verificar no banco

6. **Após concretizar venda:** dado deve aparecer IMEDIATAMENTE em Associados, Veículos, Contratos

---

## ORDEM DE EXECUÇÃO

1. Primeiro: corrigir formulários existentes (salvar + feedback)
2. Segundo: implementar pipeline CRM completo
3. Terceiro: implementar fluxo de concretização de venda
4. Quarto: módulo financeiro (boletos + cálculo proporcional)
5. Quinto: alertas e relatórios

---

## ENTREGÁVEIS

1. Todo código implementado e funcionando
2. `npm run build` sem erros
3. `git add -A && git commit -m "feat: implementação completa GIA conforme spec Thaina"`
4. `git push origin main`

## NOTIFICAÇÃO FINAL
Quando terminar tudo: `openclaw system event --text "GIA implementado: pipeline CRM, concretização de venda, financeiro, relatórios - tudo funcional conforme spec" --mode now`
