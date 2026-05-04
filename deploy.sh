#!/usr/bin/env bash
# ============================================================
#  deploy.sh — executado pelo GitHub Actions no servidor
#  Pode também ser rodado manualmente via SSH:
#    ssh usuario@host 'bash ~/domains/agentescmais.pro/public_html/deploy.sh'
# ============================================================
set -e

APP_DIR="$HOME/domains/agentescmais.pro/public_html"

echo "▸ Entrando em $APP_DIR"
cd "$APP_DIR"

echo "▸ Sincronizando com origin/main..."
git fetch origin main
git reset --hard origin/main

echo "▸ Instalando dependências..."
npm install --omit=dev --prefer-offline

echo "▸ Reiniciando Passenger..."
mkdir -p tmp
touch tmp/restart.txt

echo "✔ Deploy concluído: $(date '+%Y-%m-%d %H:%M:%S')"
