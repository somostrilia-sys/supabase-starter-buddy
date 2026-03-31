# PLANO MACRO FINAL — MÓDULO DE VENDAS GIA
## Ajustes e adequações minuciosas

---

## BLOCO 1 — ACEITAÇÃO DE VEÍCULOS

### 1.1 Tabelas no banco
```sql
marcas_veiculo (id, nome, logo_url, ativa)
modelos_veiculo (id, marca_id FK, nome, aceito boolean, motivo_rejeicao text)
```

### 1.2 Minha Empresa → Veículos Aceitos
- Tela com listagem de marcas (com logo/símbolo)
- Ao clicar na marca → lista modelos com toggle aceito/não aceito
- Busca por marca/modelo
- Import/export CSV
- Alterável a qualquer momento pelo admin/diretor

### 1.3 Validação no Pipeline
- Ao criar negociação ou preencher veículo na cotação:
  - Sistema verifica se marca+modelo está na lista de aceitos
  - Se **não aceito** → card gera badge de erro: "Veículo sem aceitação"
  - Bloqueia envio de cotação
  - Botão "Solicitar Liberação" → gera link pro diretor
  - Diretor clica no link → aprova ou rejeita
  - Se aprovado → libera o veículo naquele card (exceção individual)
  - Toda liberação gera histórico no card (pipeline_transicoes)

---

## BLOCO 2 — INTEGRAÇÃO FIPE REAL

### 2.1 Edge Function `consulta-fipe` (já existe)
- API parallelum: marcas → modelos → anos → valor
- Busca por placa via API (placeholder pra API paga tipo Placas.com)

### 2.2 Fluxo no CotacaoTab
- **Com placa:** digita placa → busca FIPE automático → preenche marca/modelo/ano/valor
- **Sem placa:** seleciona marca → modelo → ano → busca valor FIPE
- **Upload documento (CRLV):** OCR extrai placa → busca FIPE automático
- Valor FIPE determina qual faixa da `tabela_precos` usar → mostra planos disponíveis com valores reais

### 2.3 Validação cruzada
- Valor FIPE + tabela_precos → planos e valores
- Se veículo não tem faixa na tabela_precos → "Sem precificação definida para este veículo"
- Se veículo não aceito → bloqueia (bloco 1)

---

## BLOCO 3 — COTAÇÃO (Link + PDF)

### 3.1 Link Comparativo (sem selecionar plano)
- Página pública `/cotacao/:token`
- Mostra todos os planos disponíveis lado a lado
- Tabela comparativa: coberturas ✓/✗, valores, adesão, franquia
- Botão "Aceitar Proposta" em cada plano
- Dados do consultor (nome, WhatsApp, email)
- Dados do veículo e cliente

### 3.2 PDF Cotação (obrigatório selecionar 1 plano)
- **Pág 1:** Capa institucional (configurável pelo admin)
- **Pág 2:** Social proof + depoimentos (configurável)
- **Pág 3:** Cotação com plano selecionado
  - Logo + nº cotação + data + validade
  - Dados cliente + veículo + FIPE
  - Plano: nome, mensalidade, adesão, cota participação
  - Coberturas incluídas
  - Assistências
  - Consultor
- Download direto no navegador/celular (blob download, não apenas toast)

### 3.3 Tabela `coberturas_plano`
```sql
coberturas_plano (id, plano text, cobertura text, inclusa boolean, tipo text, valor text, ordem int)
```
- Preenchida automaticamente a partir dos dados da tabela_precos
- Admin pode editar/adicionar coberturas por plano

---

## BLOCO 4 — CARD (DealDetailModal) REDESIGN

### 4.1 Layout 2 colunas
**Conteúdo principal (esquerda ~65%):**

Abas:
1. **Atividades** — sub-tabs: Atividades / Anotações / Anexos
   - Registro automático: card criado, cotação enviada, vistoria solicitada, contrato assinado
   - Gestores/diretores veem atividades de qualquer card
   - Formulário: tipo (Ligar/WhatsApp/Email/Reunião/Visita) + quando + responsável

2. **Contato** — dados pessoais editáveis (nome, CPF, telefone, email, endereço)

3. **Cotações** — info veículo + FIPE + validação aceitação + planos com valores reais
   - Status: "cotação aceita" / "pendente" / "expirada"
   - Visualizações do cliente
   - Pagamentos (adesão, mensalidade)
   - Plano selecionado
   - Anexos (upload drag&drop)
   - Botão "Enviar cotação" (link ou PDF)

4. **Documentos** — upload CNH/CRLV com OCR automático + preenchimento

5. **Vistoria** — fotos com labels, acessórios relevantes, timeline, laudo PDF
   - Botão "Visualizar fotos" abre galeria
   - Acessórios: só relevantes (air bag, alarme, AC, vidros elétricos, etc.)
   - Gerar laudo PDF após conclusão

6. **Assinatura** — contrato + laudo de vistoria junto
   - Gerar contrato → envia link por SMS + email
   - Associado assina → recebe via dele
   - Contrato + laudo vão juntos

7. **SGA** — envio para sistema de gestão

**Sidebar direita (~35%, fixa):**
- Responsável (avatar + nome) — gestor/diretor troca consultor
- Afiliado (select) + Comissão calculada
- Stepper contratação online (visual)
- Cooperativa (select real do banco)
- Origem do lead + sub-origem
- Tags (inline com +)

**Histórico** — embaixo, filtro: Geral/Contato/Cotação/Vistoria/Assinatura/SGA
- Toda ação registrada automaticamente
- Liberações do diretor aparecem aqui

### 4.2 Scroll corrigido
- `max-h-[92vh]` com `overflow-y-auto` no ScrollArea
- Conteúdo nunca corta

---

## BLOCO 5 — FROTA

### 5.1 No card
- Botão "Adicionar Veículo" → formulário de veículo adicional
- Lista de veículos na negociação
- Cada veículo com sua cotação independente
- Upload em lote: CNH + múltiplos CRLVs de uma vez

### 5.2 Banco
```sql
negociacao_veiculos (id, negociacao_id FK, placa, chassi, marca, modelo, ano, valor_fipe, cor, combustivel, renavam, categoria, cotacao_gerada boolean, status text)
```

### 5.3 Contrato unificado
- Um contrato para toda a frota
- Lista todos os veículos no termo de adesão

---

## BLOCO 6 — CONTRATO / ASSINATURA

### 6.1 Termo de Adesão (5 páginas)
- **Pág 1:** Dados associado + veículo + agregado (gerado do card)
- **Pág 2:** Produtos do veículo (plano, coberturas, assistências, consultor)
- **Pág 3-4:** Contrato de adesão (texto configurável pelo admin)
- **Pág 5:** Assinaturas (associado + empresa) + QR verificação

### 6.2 Laudo de vistoria anexo
- Vai junto com o contrato
- Assinatura cobre ambos documentos

### 6.3 Fluxo de assinatura
1. Consultor clica "Gerar Contrato"
2. Sistema gera PDF (contrato + laudo)
3. Envia link por SMS + email automaticamente
4. Associado abre link → assina digitalmente
5. Após assinar → recebe via dele por email + download
6. Card atualiza: stage → concluido
7. Histórico registra tudo

### 6.4 Integração
- **Autentique** (API GraphQL) — token necessário nas secrets
- Alternativa: assinatura simples via aceite digital no link (sem Autentique)

---

## BLOCO 7 — LAUDO DE VISTORIA PDF

### 7.1 Estrutura
- **Pág 1:** Header (logo + "LAUDO DE VISTORIA" + data impressão)
  - Dados da vistoria (contratante, configuração, solicitante)
  - Dados do proponente (nome, CPF, telefone, email)
  - Dados do veículo (marca/modelo, ano, placa, chassi, RENAVAM, GNV, KM)
  - Observações do vistoriador
  - Acessórios relevantes (air bag, alarme, AC, vidros, travas, direção, freio ABS, sensor, controle tração, câmbio)
  - Análise: parecer (Aprovado/Reprovado) + avaliador + data

- **Pág 2+:** Fotos (uma por bloco)
  - Foto + título (Chaves, Frente, Motor, Painel/KM, Chassi, etc.)
  - Geolocalização (lat/long) + data/hora
  - Cores da empresa (configurável, padrão #1A3A5C)

### 7.2 Geração
- Automática após vistoria aprovada
- Disponível na aba Vistoria do card
- Botão "Baixar Laudo PDF"
- Vai anexo ao contrato

---

## BLOCO 8 — MINHA CONTA (Consultor)

### 8.1 Sidebar
- Minhas Vendas (dashboard pessoal)
- Conta (configurações)
- Perfil (foto, dados)
- Powerlinks (QR codes + links)
- Minhas Metas (meta vs realizado)
- Meus Afiliados (lista + indicações)

### 8.2 Powerlinks
- **Formulário de Cotação** — QR + link da landing page do consultor
- **Influencer** — variação da LP com tracking
- **Captação de Afiliados** — link pra cadastro de novos afiliados

### 8.3 Landing Page Personalizada
- Baseada no site oficial da Objetivo
- Consultor personaliza: foto, nome, WhatsApp, capa
- Formulário captura lead → cai direto pro consultor
- URL: `/lp/:slug`

### 8.4 Meus Afiliados
- Afiliados cadastrados pelo consultor
- Cada afiliado tem seus powerlinks (indicam, não vendem)
- Indicação → lead chega pro consultor
- Ranking de afiliados

### 8.5 Minhas Comissões
- Campo: valor fixo por contrato (R$) OU percentual da adesão (%)
- Cálculo automático mensal
- Dashboard: total ganho, por contrato, pendente
- Preparado pra split de pagamento futuro (campo existe)

```sql
comissoes_consultor (id, consultor_id, negociacao_id, tipo text, valor_fixo numeric, percentual numeric, valor_calculado numeric, mes_referencia text, pago boolean, pago_em timestamptz)
```

---

## BLOCO 9 — CONFIGURAÇÕES (Minha Empresa)

### 9.1 Aparência
- Logo da empresa
- Cores (primária #1A3A5C, secundária)
- Nome da empresa, CNPJ

### 9.2 Cotação
- Upload capa PDF (pág 1)
- Upload social proof (pág 2)
- Validade em dias
- Coberturas por plano (editável)

### 9.3 Contrato
- Texto jurídico editável (textarea)
- Layout de dados automático pelo sistema
- Novas empresas: só coloca texto, sistema faz o resto

### 9.4 Vistoria
- Lista de acessórios relevantes (toggle on/off)
- Cores do laudo
- Template de fotos por categoria

### 9.5 Veículos
- Marcas aceitas (com logo)
- Modelos aceitos/não aceitos por marca
- Import/export

### 9.6 Tabela de Preços
- CRUD das tabelas importadas
- Faixas FIPE × plano × valores

---

## BLOCO 10 — TABELAS SQL NECESSÁRIAS

```sql
-- Novas tabelas
marcas_veiculo (id uuid PK, nome text, logo_url text, ativa boolean DEFAULT true)
modelos_veiculo (id uuid PK, marca_id uuid FK, nome text, aceito boolean DEFAULT true, motivo_rejeicao text)
coberturas_plano (id uuid PK, plano text, cobertura text, inclusa boolean, tipo text, valor text, ordem int)
config_empresa (id uuid PK, nome text, cnpj text, logo_url text, cor_primaria text DEFAULT '#1A3A5C', cor_secundaria text, contrato_texto text, cotacao_capa_url text, cotacao_social_url text, cotacao_validade_dias int DEFAULT 7)
negociacao_veiculos (id uuid PK, negociacao_id uuid FK, placa text, chassi text, marca text, modelo text, ano int, valor_fipe numeric, cor text, combustivel text, renavam text, categoria text, cotacao_gerada boolean DEFAULT false, status text DEFAULT 'pendente')
acessorios_vistoria (id uuid PK, nome text, relevante boolean DEFAULT true, ordem int)
comissoes_consultor (id uuid PK, consultor_id uuid, negociacao_id uuid, tipo text, valor_fixo numeric, percentual numeric, valor_calculado numeric, mes_referencia text, pago boolean DEFAULT false, pago_em timestamptz)
powerlinks (id uuid PK, consultor_id uuid, tipo text, slug text UNIQUE, qrcode_url text, cliques int DEFAULT 0, created_at timestamptz DEFAULT now())

-- Já existem (criadas anteriormente)
tabela_precos, negociacoes, pipeline_transicoes, excecoes_aprovacao, cotacoes, vistorias, vistoria_fotos, vistoria_modelos_foto, documentos_ocr, pagamentos_cotacao, contratos, afiliados, indicacoes, landing_pages, tags, negociacao_tags, atividades_sugeridas, metas_vendas, usuarios (37 importados)
```

---

## BLOCO 11 — EDGE FUNCTIONS NECESSÁRIAS

| Função | Status | O que faz |
|--------|--------|-----------|
| `consulta-fipe` | Existe | Busca FIPE por marca/modelo/ano |
| `gia-gerar-pdf-cotacao` | Existe | Gera PDF cotação 3 págs |
| `gia-gerar-contrato` | Existe | Gera contrato + envia Autentique |
| `gia-vistoria-ai-analise` | Existe | Analisa fotos com IA |
| `gia-ocr-documento` | Existe | Extrai CNH/CRLV |
| `gia-conselheiro-ia` | Existe | Agenda IA com OpenAI |
| `gia-landing-page` | Existe | Landing page + captura lead |
| `gia-afiliados` | Existe | Ranking + comissões |
| `gia-gerar-laudo-vistoria` | **CRIAR** | Gera laudo PDF vistoria |
| `gia-validar-veiculo` | **CRIAR** | Verifica aceitação marca/modelo |
| `gia-gerar-qrcode` | **CRIAR** | Gera QR code para powerlinks |
| `gia-buscar-placa` | **CRIAR** | Busca FIPE por placa (API paga) |
| `gia-contratacao-online` | **CRIAR** | Fluxo completo: cotação→vistoria→assinatura→pagamento |

---

## BLOCO 12 — INTEGRAÇÕES

| Integração | Pra quê | Status |
|---|---|---|
| **FIPE (parallelum)** | Valores de veículos | Funcional |
| **API Placa** | Busca FIPE por placa | Precisa contratar (Placas.com, APIPlacas) |
| **Autentique** | Assinatura digital | Edge function existe, precisa token |
| **Resend** | Emails (contrato, cotação) | Configurar API key |
| **WhatsApp Business** | Envio links/notificações | Definir provider (Meta Business API ou Z-API) |
| **PIX (gateway)** | Pagamento online | Definir gateway (Mercado Pago, Asaas, PagBank) |
| **Split pagamento** | Comissão automática | Futuro (Stripe Connect ou Asaas split) |

---

## ORDEM DE EXECUÇÃO

| # | Bloco | Prioridade | Esforço |
|---|-------|-----------|---------|
| 1 | FIPE real no CotacaoTab | Alta | Médio |
| 2 | Tabela precos → planos reais no card | Alta | Médio |
| 3 | PDF cotação (download real) | Alta | Alto |
| 4 | Card redesign (2 colunas + sidebar) | Alta | Alto |
| 5 | Aceitação veículos | Alta | Médio |
| 6 | Laudo vistoria PDF | Média | Alto |
| 7 | Contrato (termo adesão) | Média | Alto |
| 8 | Assinatura digital (Autentique) | Média | Médio |
| 9 | Frota (multi-veículos) | Média | Médio |
| 10 | Minha Conta (powerlinks, comissões) | Média | Alto |
| 11 | Configurações empresa | Baixa | Médio |
| 12 | Contratação online (PIX) | Baixa | Alto |

---

## PENDÊNCIAS QUE DEPENDEM DO ALEX

1. **API de busca por placa** — qual provider contratar?
2. **Autentique** — token de API
3. **Gateway pagamento PIX** — qual usar? (Mercado Pago, Asaas, PagBank)
4. **WhatsApp API** — qual provider? (Meta Business, Z-API, Evolution)
5. **Tabela de veículos aceitos/não aceitos** — enviar arquivo
6. **Site oficial** da Objetivo — link ou PDF pra basear landing page
7. **Logo em alta resolução** — pra PDFs

Posso começar a implementar pelos blocos 1-5 (FIPE, preços reais, PDF, card, aceitação)?
