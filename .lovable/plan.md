

# Correção Módulo 1 — Vínculo Obrigatório de Associado no Cadastro de Veículo

## Problema
O cadastro de veículo não vincula associado e não salva no banco. O botão Salvar funciona apenas com mock/toast.

## Solução

### 1. Adicionar seção "Associado" como Seção 0 (antes de tudo)
No topo do formulário (antes da Seção 1 - Dados do Veículo), adicionar uma seção fixa (não accordion) com:

- **Campo de busca** com autocomplete: busca na tabela `associados` por nome ou CPF via Supabase
- **Lista de resultados** dropdown com nome, CPF e status
- **Botão "Cadastrar novo associado"** que abre um Dialog/modal inline
- **Card resumo** do associado selecionado (nome, CPF, telefone, email, status) com botão para desvincular

### 2. Modal "Cadastrar Novo Associado"
Dialog com campos: nome completo, CPF, RG, data nascimento, CEP (auto-preenche endereço), telefone/WhatsApp, email. Salva na tabela `associados` via Supabase e auto-seleciona o recém-criado.

### 3. Validação e salvamento
- Estado `associadoId: string | null` — sem associado = botão Salvar desabilitado (disabled + tooltip)
- `handleSalvar` passa a inserir na tabela `veiculos` via Supabase com `associado_id` vinculado
- Manter todas as 15 seções existentes intactas

### 4. Alterações no arquivo
Apenas `src/pages/gestao/veiculo/CadastrarVeiculo.tsx`:
- Importar `supabase`, `Dialog`, `Command` components
- Adicionar estados: `associadoId`, `associadoData`, `searchQuery`, `searchResults`, `showNovoModal`, `novoAssociadoForm`
- Adicionar bloco visual antes do Accordion
- Modificar `handleSalvar` para inserir no banco
- Desabilitar botão Salvar quando `!associadoId`

### Detalhes Técnicos
- Busca com debounce (300ms) usando `.ilike()` no Supabase para nome e CPF
- Insert na tabela `veiculos`: campos `placa`, `chassi`, `renavam`, `marca` (montadora), `modelo`, `ano` (anoFab), `cor`, `valor_fipe`, `associado_id`
- Insert na tabela `associados`: campos `nome`, `cpf`, `rg`, `data_nascimento`, `cep`, `endereco`, `telefone`, `email`
- Máscara de CPF no modal (000.000.000-00)

