#!/usr/bin/env bash
# ============================================================
#  deploy.sh — script de deploy manual no servidor Hostinger
#
#  Uso (no terminal SSH da Hostinger):
#    bash ~/domains/agentescmais.pro/public_html/deploy.sh
#
#  O fluxo automático via GitHub Actions está em
#  .github/workflows/deploy.yml e executa estes mesmos passos.
# ============================================================
set -euo pipefail

DOMAIN="${DOMAIN:-agentescmais.pro}"
APP_DIR="${APP_DIR:-$HOME/domains/$DOMAIN/public_html}"
BRANCH="${BRANCH:-main}"

echo "▸ Diretório da aplicação: $APP_DIR"
echo "▸ Branch: $BRANCH"

mkdir -p "$APP_DIR"
cd "$APP_DIR"

if [ ! -d ".git" ]; then
  echo "✗ $APP_DIR não é um repositório git. Rode setup-hostinger.sh primeiro."
  exit 1
fi

echo "▸ Sincronizando com origin/$BRANCH..."
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "▸ Instalando dependências..."
npm install --omit=dev --prefer-offline --no-audit --no-fund

echo "▸ Reiniciando Passenger..."
mkdir -p tmp
touch tmp/restart.txt

echo "✔ Deploy concluído: $(date '+%Y-%m-%d %H:%M:%S')"
