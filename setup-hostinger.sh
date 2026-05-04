#!/usr/bin/env bash
# ============================================================
#  setup-hostinger.sh
#  Bootstrap inicial no servidor Hostinger.
#  Execute UMA VEZ via SSH após criar a aplicação Node.js no hPanel.
#
#  Uso (no terminal SSH da Hostinger):
#    curl -fsSL https://raw.githubusercontent.com/ThalesAndrades/agentescmais/main/setup-hostinger.sh | bash
#  ou:
#    bash ~/domains/agentescmais.pro/public_html/setup-hostinger.sh
# ============================================================
set -e

DOMAIN="agentescmais.pro"
REPO="https://github.com/ThalesAndrades/agentescmais.git"
APP_DIR="$HOME/domains/$DOMAIN/public_html"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   SC Mais Inovação · Bootstrap Hostinger                   ║"
echo "╚════════════════════════════════════════════════════════════╝"

# ─── 1. Clone ou update do repositório ────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  echo "▸ Repositório já existe — atualizando..."
  cd "$APP_DIR"
  git fetch origin main
  git reset --hard origin/main
else
  echo "▸ Clonando repositório em $APP_DIR..."
  mkdir -p "$(dirname "$APP_DIR")"
  rm -rf "$APP_DIR"
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# ─── 2. Instalar dependências ─────────────────────────────────
echo "▸ Instalando dependências..."
npm install --omit=dev --prefer-offline --no-audit --no-fund

# ─── 3. Garantir pasta tmp para Passenger restart ─────────────
mkdir -p tmp
touch tmp/restart.txt

# ─── 4. Configurar deploy key SSH (se não existir) ────────────
if [ ! -f "$HOME/.ssh/agentescmais_deploy" ]; then
  echo "▸ Gerando chave SSH de deploy (será usada pelo GitHub Actions)..."
  ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$HOME/.ssh/agentescmais_deploy" -N ""

  # Autoriza a chave pública para conexões SSH neste servidor
  cat "$HOME/.ssh/agentescmais_deploy.pub" >> "$HOME/.ssh/authorized_keys"
  chmod 600 "$HOME/.ssh/authorized_keys"

  echo ""
  echo "════════════════════════════════════════════════════════════"
  echo "  COPIE O CONTEÚDO ABAIXO E COLE EM:"
  echo "  GitHub → Settings → Secrets → Actions → SSH_PRIVATE_KEY"
  echo "════════════════════════════════════════════════════════════"
  cat "$HOME/.ssh/agentescmais_deploy"
  echo "════════════════════════════════════════════════════════════"
  echo ""
else
  echo "▸ Chave SSH de deploy já existe em ~/.ssh/agentescmais_deploy"
fi

# ─── 5. Mostrar dados para os outros secrets ──────────────────
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  OUTROS SECRETS PARA O GITHUB:"
echo "════════════════════════════════════════════════════════════"
echo "  SSH_HOST  = $(hostname -f 2>/dev/null || hostname)"
echo "  SSH_USER  = $(whoami)"
echo "  SSH_PORT  = ${SSH_CLIENT##* } (geralmente 65002 na Hostinger)"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "✔ Bootstrap concluído!"
echo ""
echo "Próximos passos:"
echo "  1. Configurar os 4 secrets no GitHub (instruções acima)"
echo "  2. Definir variáveis de ambiente no painel Node.js do hPanel"
echo "     (ANTHROPIC_API_KEY, FIRECRAWL_API_KEY, CLAUDE_MODEL, NODE_ENV)"
echo "  3. Iniciar a aplicação no painel Node.js (Start App)"
echo "  4. A partir do próximo push em main, o deploy é automático"
