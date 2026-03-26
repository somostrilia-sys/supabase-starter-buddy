#!/bin/bash
# setup.sh — Aplica migrations no projeto Supabase via CLI

set -e

if [ -z "$SUPABASE_URL" ]; then
  echo "ERRO: SUPABASE_URL não definida. Copie .env.example para .env e preencha."
  exit 1
fi

echo "Aplicando migrations..."
npx supabase db push --db-url "$DATABASE_URL"

echo "Pronto! Projeto configurado."
