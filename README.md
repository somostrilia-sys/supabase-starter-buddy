# supabase-starter-buddy

Template Supabase reutilizável para projetos do Grupo WALK.

## Como usar

1. Clone este repo
2. Copie `.env.example` para `.env` e preencha suas credenciais
3. Execute `scripts/setup.sh` para aplicar as migrations
4. Configure seu projeto Supabase conforme necessário

## Estrutura

```
supabase-starter-buddy/
├── README.md
├── supabase/
│   ├── migrations/
│   │   ├── 00001_init.sql       # Schema base GIA
│   │   └── 00002_rls_policies.sql
│   └── functions/
│       └── health-check/
│           └── index.ts
├── .env.example
└── scripts/
    └── setup.sh
```

## Projetos usando este template

- **GIA** (Gestão Integrada de Associações) — CRM da Objetivo Auto Benefícios
  - Ref: `dxuoppekxgvdqnytftho`
  - URL: https://dxuoppekxgvdqnytftho.supabase.co

## Módulos GIA

1. Dashboard / Home
2. Cadastro de Associados + Veículos
3. Pipeline Comercial
4. Cotação (com integração FIPE)
5. Vistorias (com fotos por parte do veículo)
6. Minha Empresa + Módulo de Usuários (4 grupos de permissão)
7. Relatório de Boletos
8. Atividades
9. Produtos e Benefícios

## Grupos de permissão

| Grupo | Descrição |
|-------|-----------|
| admin | Acesso total |
| gerente | Acesso operacional + relatórios |
| operacional | Cadastros e operações |
| consultor | Somente leitura |
