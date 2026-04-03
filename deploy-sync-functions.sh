#!/bin/bash
# Deploy das Edge Functions de sincronismo entre sistemas
# GIA Supabase: dxuoppekxgvdqnytftho

PROJECT_REF="dxuoppekxgvdqnytftho"
FUNCTIONS=(
  "gia-api-associados"
  "gia-api-boletos"
  "gia-api-inadimplentes"
  "gia-atualizar-cobranca"
  "gia-receber-lead"
  "gia-sync-finance"
  "gia-sync-track"
  "collect-buscar-boletos"
  "collect-gerenciar-negativados"
)

echo "=== Deploy Sync Functions → GIA ($PROJECT_REF) ==="
echo ""

for fn in "${FUNCTIONS[@]}"; do
  echo "📦 Deploying $fn..."
  npx supabase functions deploy "$fn" --project-ref "$PROJECT_REF" --no-verify-jwt 2>&1
  if [ $? -eq 0 ]; then
    echo "  ✅ $fn deployed"
  else
    echo "  ❌ $fn FAILED"
  fi
  echo ""
done

echo "=== Done! ==="
echo ""
echo "API Keys foram geradas na migration."
echo "Para ver as keys: SELECT key_name, key_value FROM api_keys;"
