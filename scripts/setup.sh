#!/bin/bash
set -e
echo "Aplicando migrations..."
npx supabase db push
echo "Setup concluído!"
