

# Correção de Bugs GIA — Plano de Implementação

## BUG #1 — Contadores zerados no Dashboard
**Status**: Já corrigido. O `Dashboard.tsx` (linhas 185-230) já faz queries reais ao Supabase com `count: "exact"` para associados, veículos e sinistros. O problema é que as tabelas estão vazias. **Nenhuma alteração necessária** — os contadores funcionam corretamente e refletirão dados reais quando houver registros.

## BUG #2 — Formulário de cadastro não limpa após salvar
**Arquivo**: `src/pages/gestao/associado/CadastrarAssociado.tsx`
- O `handleSalvar` (linha 255) é apenas mock (toast sem insert no Supabase e sem reset)
- **Correção**: Após o toast de sucesso, chamar `handleLimpar()` para resetar o form
- **Adicionar**: Antes de salvar, verificar CPF duplicado via `supabase.from("associados").select("id").eq("cpf", cpfLimpo).maybeSingle()` — se existir, exibir toast de erro
- **Adicionar**: Insert real no Supabase na tabela `associados` (nome, cpf, rg, data_nascimento, cep, endereco, telefone, email, etc.)

**Nota**: O `CadastrarVeiculo.tsx` já limpa o form após salvar (linha 302: `handleLimpar()`) — sem alteração necessária lá.

## BUG #3 — Botão Visualizar nas Landing Pages
**Arquivo**: `src/pages/vendas/LandingPages.tsx`
- O botão Eye (linha 106) não tem onClick
- **Correção**: Adicionar estado `previewConsultor` e um `Dialog` modal que mostra preview mockado da landing page do consultor selecionado (nome, foto placeholder, URL, métricas, preview visual)

## BUG #4 — Campo Profissão não preenchido pelo Carregar Exemplo
**Arquivo**: `src/pages/gestao/associado/CadastrarAssociado.tsx`
- O `mockPreenchido1` (linha 116) já tem `profissao: "Engenheiro Civil"` 
- O campo usa `SelectWithAdd` com options: `["Engenheiro", "Médico", ...]` — o valor "Engenheiro Civil" não está na lista de options, então o Select não consegue exibir
- **Correção**: Mudar o mock para `profissao: "Engenheiro"` (que existe na lista) OU adicionar "Engenheiro Civil" e "Empresário" à lista de options do SelectWithAdd

## BUG #5 — Aba Calendário visível sem implementação
**Arquivos**: `src/components/ModuleLayout.tsx` (linha 42), `src/components/AppSidebar.tsx` (linha 53)
- **Correção**: Remover a entrada `{ title: "Calendário", ... }` de ambos os arrays
- Manter a rota no App.tsx (para não quebrar links diretos) mas remover dos menus de navegação

## MELHORIA #6 — Banner de dados de demonstração
**Arquivos**: `src/pages/financeiro-module/FinanceiroModule.tsx`, `src/pages/vendas/DashboardVendas.tsx`, e outros módulos de vendas com dados hardcoded
- **Correção**: Criar um componente `DemoBanner` reutilizável (card amarelo/warning com ícone ⚠️ e texto "Dados de demonstração — módulo em desenvolvimento")
- Inserir no topo do `FinanceiroModule` e das telas de vendas que usam dados mock

## MELHORIA #7 — Aba Documentação cortada
**Arquivo**: `src/pages/gestao/GestaoModule.tsx`
- O tab nav (linha 126-153) já usa `ScrollArea` com `ScrollBar orientation="horizontal"` — o scroll horizontal já está implementado
- O problema é que o `ScrollBar` pode estar invisível ou o overflow não está óbvio
- **Correção**: Adicionar um indicador visual de overflow (fade/gradient nas bordas) e garantir que o ScrollBar esteja visível com estilo customizado

## Resumo de Arquivos a Alterar

| Arquivo | Bugs |
|---------|------|
| `src/pages/gestao/associado/CadastrarAssociado.tsx` | #2, #4 |
| `src/pages/vendas/LandingPages.tsx` | #3 |
| `src/components/ModuleLayout.tsx` | #5 |
| `src/components/AppSidebar.tsx` | #5 |
| `src/pages/financeiro-module/FinanceiroModule.tsx` | #6 |
| `src/pages/vendas/DashboardVendas.tsx` | #6 |
| `src/pages/gestao/GestaoModule.tsx` | #7 |
| Novo: `src/components/DemoBanner.tsx` | #6 |

