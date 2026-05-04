#!/usr/bin/env bash
# ============================================================
#  push-to-github.sh
#  Automatiza a criação de um novo repositório no GitHub
#  e faz push do projeto SC Mais Inovação Agent
#
#  Uso:
#    ./push-to-github.sh <usuario-ou-org> [nome-repo] [public|private]
#
#  Exemplos:
#    ./push-to-github.sh meu-usuario
#    ./push-to-github.sh minha-org sc-mais-inovacao-agent public
#    ./push-to-github.sh meu-usuario sc-agent private
#
#  Caminhos suportados:
#    1) GitHub CLI (gh)  — cria o repo automaticamente
#    2) Git puro          — você cria o repo manualmente no github.com
#                          e o script faz o resto
# ============================================================

set -e

# ─── Cores ────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

print_step()    { echo -e "${BLUE}▸${RESET} $1"; }
print_success() { echo -e "${GREEN}✔${RESET} $1"; }
print_warn()    { echo -e "${YELLOW}⚠${RESET} $1"; }
print_error()   { echo -e "${RED}✘${RESET} $1"; }

# ─── Argumentos ───────────────────────────────────────────────
OWNER="${1:-}"
REPO_NAME="${2:-sc-mais-inovacao-agent}"
VISIBILITY="${3:-public}"

if [ -z "$OWNER" ]; then
  echo -e "${BOLD}Uso:${RESET} $0 <usuario-ou-org> [nome-repo] [public|private]"
  echo ""
  echo "Exemplos:"
  echo "  $0 meu-usuario"
  echo "  $0 minha-org sc-mais-inovacao-agent public"
  echo "  $0 meu-usuario sc-agent private"
  exit 1
fi

if [[ "$VISIBILITY" != "public" && "$VISIBILITY" != "private" ]]; then
  print_error "Visibilidade deve ser 'public' ou 'private'"
  exit 1
fi

echo ""
echo -e "${BOLD}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║   SC Mais Inovação · Push para GitHub                      ║${RESET}"
echo -e "${BOLD}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  Owner:      ${BOLD}$OWNER${RESET}"
echo -e "  Repositório: ${BOLD}$REPO_NAME${RESET}"
echo -e "  Visibilidade: ${BOLD}$VISIBILITY${RESET}"
echo ""

# ─── Pré-flight: confere se está em um repo Git ───────────────
if [ ! -d ".git" ]; then
  print_warn "Esta pasta não é um repositório Git. Inicializando..."
  git init -b main
  git add -A
  git commit -m "feat: initial commit — agente conversacional SC Mais Inovação"
  print_success "Repositório Git inicializado"
fi

# Garante que o branch é main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  print_step "Renomeando branch atual ($CURRENT_BRANCH) para 'main'..."
  git branch -M main
fi

# Verifica se há mudanças não commitadas
if [ -n "$(git status --porcelain)" ]; then
  print_warn "Há mudanças não commitadas. Adicionando e commitando..."
  git add -A
  git commit -m "chore: ajustes finais antes do push"
  print_success "Mudanças commitadas"
fi

REPO_URL_HTTPS="https://github.com/$OWNER/$REPO_NAME.git"
REPO_URL_SSH="git@github.com:$OWNER/$REPO_NAME.git"

# ─── Caminho 1: GitHub CLI (gh) ───────────────────────────────
if command -v gh >/dev/null 2>&1; then
  print_step "GitHub CLI (gh) detectado — usando caminho automático"

  # Confere autenticação
  if ! gh auth status >/dev/null 2>&1; then
    print_warn "Você não está autenticado no GitHub CLI."
    print_step "Rodando 'gh auth login'..."
    gh auth login
  fi

  # Cria o repositório (se não existir) e faz o push
  print_step "Criando repositório $OWNER/$REPO_NAME no GitHub..."

  if gh repo view "$OWNER/$REPO_NAME" >/dev/null 2>&1; then
    print_warn "Repositório $OWNER/$REPO_NAME já existe — apenas conectando o remote"

    # Adiciona o remote se ainda não existir
    if ! git remote get-url origin >/dev/null 2>&1; then
      git remote add origin "$REPO_URL_HTTPS"
    else
      git remote set-url origin "$REPO_URL_HTTPS"
    fi

    print_step "Fazendo push para origin/main..."
    git push -u origin main
  else
    gh repo create "$OWNER/$REPO_NAME" \
      --"$VISIBILITY" \
      --source=. \
      --remote=origin \
      --push \
      --description "Agente conversacional inteligente do programa SC Mais Inovação - Governo de Santa Catarina"

    print_success "Repositório criado e código enviado!"
  fi

  echo ""
  print_success "Pronto! Acesse: ${BOLD}https://github.com/$OWNER/$REPO_NAME${RESET}"
  exit 0
fi

# ─── Caminho 2: Git puro (sem gh) ─────────────────────────────
print_warn "GitHub CLI (gh) não encontrado — caminho manual"
echo ""
echo "Para concluir, faça o seguinte:"
echo ""
echo -e "${BOLD}1.${RESET} Acesse https://github.com/new"
echo "   - Owner: $OWNER"
echo "   - Repository name: $REPO_NAME"
echo "   - Visibility: $VISIBILITY"
echo "   - ${YELLOW}NÃO${RESET} marque 'Add README', 'Add .gitignore' ou 'Add license'"
echo "   - Clique em 'Create repository'"
echo ""
echo -n "Pressione ENTER quando o repositório estiver criado no GitHub... "
read -r

# Adiciona o remote
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO_URL_HTTPS"
else
  git remote add origin "$REPO_URL_HTTPS"
fi

print_step "Remote 'origin' apontando para $REPO_URL_HTTPS"
print_step "Fazendo push para origin/main..."

if git push -u origin main; then
  echo ""
  print_success "Pronto! Acesse: ${BOLD}https://github.com/$OWNER/$REPO_NAME${RESET}"
else
  echo ""
  print_error "Falha no push. Possíveis causas:"
  echo "  - O repositório não foi criado no GitHub"
  echo "  - Suas credenciais (token PAT) não foram configuradas"
  echo ""
  echo "Para autenticar via HTTPS, gere um token em:"
  echo "  https://github.com/settings/tokens (escolha o scope 'repo')"
  echo ""
  echo "Ou use SSH:"
  echo "  git remote set-url origin $REPO_URL_SSH"
  echo "  git push -u origin main"
  exit 1
fi
