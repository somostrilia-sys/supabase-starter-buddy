# supabase-starter-buddy

Template Supabase para projetos do Grupo WALK.

## Como usar

1. Clone este repo
2. Copie `.env.example` para `.env` e preencha as variáveis
3. Execute `./scripts/setup.sh` para aplicar as migrations
4. Configure as Edge Functions conforme necessário

## Estrutura

- `supabase/migrations/` — Migrations SQL em ordem
- `supabase/functions/` — Edge Functions Deno
- `scripts/setup.sh` — Script de setup automático

## Projetos que usam este template

- GIA (Gestão Integrada de Associações) — Objetivo Auto Benefícios

## Tecnologias

- Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- Deno (Edge Functions)
- Row Level Security (RLS) habilitado em todas as tabelas
