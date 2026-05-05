# SC Mais Inovação · Assistente Conversacional Inteligente

Agente conversacional oficial do programa **[SC Mais Inovação](https://www.scmaisinovacao.scti.sc.gov.br/)**, do Governo do Estado de Santa Catarina. Responde perguntas e gera insights sobre todo o conteúdo do site oficial — equipe, hubs regionais, agentes de inovação, iniciativas, resultados e parceiros.

Construído com:
- 🤖 **[Gemini API](https://ai.google.dev/gemini-api/docs)** (Google AI Studio / free tier) para a inteligência conversacional
- 🔥 **[Firecrawl](https://www.firecrawl.dev/)** para validação e captura de dados em tempo real do site
- ⚡ **Node.js + Express** no backend
- 🎨 **HTML/CSS/JS puro** no frontend (sem frameworks pesados)

---

## ✨ Funcionalidades

- Painel de conversa único, focado e responsivo (desktop e mobile)
- Conhecimento profundo, pré-carregado, sobre todo o programa
- **Prompt caching automático** no Claude — reduz custo das chamadas repetidas em ~90% no system prompt grande
- Validação em tempo real via Firecrawl quando a pergunta envolve dados dinâmicos (notícias, eventos, fomentos, etc.)
- Histórico de conversa preservado durante a sessão (com botão "Limpar conversa")
- Rate limiting embutido (20 mensagens por minuto por IP, configurável via `CHAT_RATE_LIMIT`)
- Healthcheck e cache pré-aquecido no boot
- Markdown leve renderizado nas respostas (negrito, listas, links, e-mails clicáveis)
- Cabeçalhos de segurança (CSP, X-Frame-Options, HSTS), compressão gzip e shutdown gracioso
- Auditoria estruturada em JSON Lines (LGPD-friendly: IPs hasheados com salt)
- Deploy automático na Hostinger via GitHub Actions com healthcheck pós-deploy

---

## 📁 Estrutura do projeto

```
sc-mais-inovacao-agent/
├── server.js                 # Servidor Express principal
├── package.json              # Dependências e scripts
├── .env.example              # Modelo de variáveis de ambiente
├── .gitignore
├── README.md
│
├── src/
│   ├── gemini.js             # Integração com a API Gemini (free tier)
│   ├── firecrawl.js          # Integração com Firecrawl (cache, fetch)
│   └── knowledge.js          # Base de conhecimento estática do programa
│
└── public/
    ├── index.html            # Painel de conversa
    ├── styles.css            # Identidade visual SC
    └── app.js                # Lógica do chat no cliente
```

---

## 🚀 Rodando localmente

### 1. Pré-requisitos
- **Node.js 18+** ([baixar](https://nodejs.org/))
- Chave de API do **Gemini** ([criar no Google AI Studio](https://aistudio.google.com/app/apikey))
- Chave de API do **Firecrawl** ([criar](https://www.firecrawl.dev/app/api-keys))

### 2. Instalação

```bash
git clone <URL_DO_SEU_REPO>
cd sc-mais-inovacao-agent
npm install
```

### 3. Configuração

Copie o arquivo de exemplo e preencha as chaves:

```bash
cp .env.example .env
```

Edite `.env`:

```env
GEMINI_API_KEY=AIza-sua-chave-aqui
GEMINI_MODEL=gemini-2.5-flash
FIRECRAWL_API_KEY=fc-sua-chave-aqui
PORT=3000
```

### 4. Iniciar

```bash
npm start
```

Acesse: **http://localhost:3000**

Para desenvolvimento com auto-reload:

```bash
npm run dev
```

---

## 🐙 Subindo para o GitHub (primeira vez)

Este projeto já vem com um script que automatiza a criação do repositório no GitHub e o push do código.

### Caminho rápido (recomendado): GitHub CLI

Se você tem o **[GitHub CLI](https://cli.github.com/)** (`gh`) instalado:

```bash
# Torna o script executável (apenas na primeira vez)
chmod +x push-to-github.sh

# Cria o repo público no seu usuário
./push-to-github.sh seu-usuario-github

# Ou crie privado em uma organização
./push-to-github.sh sua-org sc-mais-inovacao-agent private
```

O script faz tudo: autentica (se necessário), cria o repositório no GitHub, conecta o `remote origin` e faz `git push`.

### Caminho manual (sem GitHub CLI)

1. Acesse [github.com/new](https://github.com/new)
2. Crie um repositório com o nome desejado (ex: `sc-mais-inovacao-agent`)
3. **NÃO** marque "Add README", "Add .gitignore" ou "Add license" — o projeto já tem
4. Rode os comandos abaixo na pasta do projeto:

```bash
git init -b main                    # se ainda não foi inicializado
git add -A
git commit -m "feat: initial commit"
git remote add origin https://github.com/SEU-USUARIO/sc-mais-inovacao-agent.git
git push -u origin main
```

> **Autenticação:** o GitHub não aceita mais senha pura via HTTPS. Use um **Personal Access Token** ([gerar aqui](https://github.com/settings/tokens) com escopo `repo`) ou configure SSH.

---

## ☁️ Deploy no Hostinger (via Git)

> 🎯 **Guia específico para plano Business + domínio próprio:** veja **[DEPLOY-HOSTINGER-BUSINESS.md](./DEPLOY-HOSTINGER-BUSINESS.md)** — passo a passo cirúrgico (~12 minutos) com cada clique detalhado, configuração de SSL, webhook de auto-deploy e troubleshooting.

A Hostinger oferece hospedagem para Node.js com integração Git nos planos **Business**, **Cloud Startup**, **Cloud Professional**, **Cloud Enterprise** e **VPS**. O fluxo abaixo cobre o caminho mais comum.

### Passo 1 — Criar/abrir um plano que suporte Node.js

A Hostinger oferece Node.js nos planos **Cloud Startup**, **Cloud Professional**, **Cloud Enterprise** e **VPS**. Confirme que seu plano suporta antes de prosseguir.

### Passo 2 — Subir o código para um repositório Git

Em qualquer provedor (GitHub, GitLab, Bitbucket):

```bash
git init
git add .
git commit -m "feat: agente conversacional SC Mais Inovação"
git branch -M main
git remote add origin git@github.com:seu-usuario/sc-mais-inovacao-agent.git
git push -u origin main
```

### Passo 3 — Configurar a aplicação Node.js no painel da Hostinger

1. Acesse o **hPanel** → **Avançado** → **Node.js** (ou **Sites** → **Gerenciar** → **Avançado** → **Node.js**)
2. Clique em **Criar aplicação**
3. Preencha:
   - **Versão Node.js:** 18 ou superior
   - **Modo:** Production
   - **URL da aplicação:** seu domínio ou subdomínio
   - **Diretório raiz:** `/home/USUARIO/sc-mais-inovacao` (ou o caminho que preferir)
   - **Arquivo de inicialização:** `server.js`

### Passo 4 — Conectar o Git

1. No mesmo painel **hPanel** → **Avançado** → **GIT**
2. Clique em **Criar um novo repositório**
3. Cole a URL HTTPS do seu repositório e o branch `main`
4. Defina o caminho de instalação igual ao **Diretório raiz** definido no passo 3
5. Confirme — a Hostinger fará o `git clone` automaticamente

> **Dica:** ative o **Auto-Deployment via Webhook** se o seu provedor Git suportar — assim cada `git push` atualiza o servidor.

### Passo 5 — Variáveis de ambiente

No painel **Node.js** da Hostinger, vá em **Variáveis de Ambiente** e adicione:

| Variável | Valor |
|---|---|
| `GEMINI_API_KEY` | sua chave do Gemini via Google AI Studio |
| `FIRECRAWL_API_KEY` | sua chave do Firecrawl |
| `GEMINI_MODEL` | `gemini-2.5-flash` (opcional) |
| `ADMIN_TOKEN` | um token aleatório (opcional) |

> **NÃO** suba o arquivo `.env` para o Git. Ele já está no `.gitignore`.

### Passo 6 — Instalar dependências e iniciar

No painel Node.js da Hostinger:

1. Clique em **Run NPM Install**
2. Clique em **Restart** (ou **Start App**)
3. Verifique os logs em **View Logs**

Se tudo estiver certo, você verá:

```
╔════════════════════════════════════════════════════════════╗
║   SC Mais Inovação — Agente Conversacional                 ║
╠════════════════════════════════════════════════════════════╣
║   🌐 Servidor rodando em http://localhost:3000             ║
║   🤖 Modelo Gemini: gemini-2.5-flash                       ║
║   🔥 Firecrawl: ativo                                       ║
╚════════════════════════════════════════════════════════════╝
```

### Passo 7 — Domínio e SSL

A Hostinger expõe a aplicação Node.js no domínio que você configurou. Ative o SSL gratuito (Let's Encrypt) em **SSL** → **Instalar SSL**.

---

## 🛠️ Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `GET`  | `/`                          | Painel de conversa (HTML) |
| `POST` | `/api/chat`                  | Envia mensagem; recebe resposta do agente |
| `GET`  | `/api/health`                | Status do servidor (modelo, cache, uptime) |
| `POST` | `/api/refresh-cache`         | Limpa e re-aquece o cache do Firecrawl (**requer `ADMIN_TOKEN`**) |
| `GET`  | `/api/audit/stats`           | Métricas agregadas (**requer `ADMIN_TOKEN`**) |
| `GET`  | `/api/audit/logs`            | Lista arquivos de log (**requer `ADMIN_TOKEN`**) |
| `GET`  | `/api/audit/logs/:file`      | Conteúdo de um arquivo de log (**requer `ADMIN_TOKEN`**) |

### Exemplo de requisição

```bash
curl -X POST https://seu-dominio.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Quem é o agente de inovação da AMREC?",
    "history": []
  }'
```

Resposta:

```json
{
  "reply": "O agente de inovação da AMREC (microrregião de Criciúma) é a **Laís Machado da Silva**...",
  "meta": {
    "model": "gemini-2.5-flash",
    "usedLiveData": false,
    "liveDataUrl": null
  }
}
```

---

## 🔄 Como o Firecrawl é usado

O Firecrawl **não** é chamado em toda mensagem — isso seria caro e desnecessário. A heurística é:

1. A mensagem do usuário é analisada por palavras-chave (notícia, evento, fomento, marco legal, etc.)
2. Se houver match com uma página dinâmica do site, a página é buscada via Firecrawl com cache de 30 minutos
3. O conteúdo bruto é injetado no contexto do Gemini como "DADOS ATUALIZADOS EM TEMPO REAL"
4. O Gemini valida e cita esses dados, garantindo respostas alinhadas ao site oficial

Páginas pré-aquecidas no boot:
- `/` (home)
- `/sobre.php`
- `/noticias.php`

---

## 🔒 Segurança

- Variáveis sensíveis (chaves de API) ficam apenas no `.env` ou nas variáveis de ambiente da Hostinger — **nunca** no código
- Rate limit: 20 mensagens/minuto por IP
- Limite de 4000 caracteres por mensagem
- Limite de 20 turnos no histórico enviado ao modelo
- O endpoint `/api/refresh-cache` aceita header `x-admin-token` (se configurado em `ADMIN_TOKEN`)

---

## 📝 Customização

### Mudar o modelo do Gemini

Edite a variável `GEMINI_MODEL` no `.env`:

- `gemini-2.5-flash` — equilíbrio recomendado para qualidade e free tier
- `gemini-2.0-flash` — alternativa leve e geralmente compatível com free tier
- Outros modelos Gemini podem exigir disponibilidade regional ou limites diferentes

### Atualizar a base de conhecimento

A base estática vive em `src/knowledge.js`. Sempre que o programa publicar grandes mudanças (novos agentes, novos números), edite esse arquivo. Para dados dinâmicos (notícias, eventos), o Firecrawl cuida sozinho.

### Ajustar o tom do agente

O `SYSTEM_PROMPT_BASE` em `src/gemini.js` define identidade, tom e regras de conduta. Edite com cuidado.

### Personalizar identidade visual

`public/styles.css` — variáveis CSS no topo do arquivo (`:root`):

```css
--sc-green-deep: #0a3d2c;   /* verde institucional principal */
--sc-lime: #c9f263;          /* acento de inovação */
```

---

## 🧪 Solução de problemas

| Problema | Solução |
|---|---|
| Status fica "offline" | Verifique se o servidor iniciou e se a porta está exposta |
| Erro "GEMINI_API_KEY não configurada" | Confirme `.env` ou variáveis de ambiente da Hostinger |
| Firecrawl mostra "inativo" | A chave do Firecrawl não foi configurada — agente roda só com base estática |
| Respostas genéricas | Verifique se a base de conhecimento (`knowledge.js`) está sendo carregada corretamente |
| Mensagem "Muitas mensagens em pouco tempo" | Rate limit ativado — espere 1 minuto |

---

## 📜 Licença

MIT — uso livre para iniciativas alinhadas ao programa SC Mais Inovação.

---

## 🤝 Créditos

- **Programa SC Mais Inovação** — Governo do Estado de Santa Catarina
- **Secretaria de Estado da Ciência, Tecnologia e Inovação (SCTI)**
- Conteúdo institucional: [scmaisinovacao.scti.sc.gov.br](https://www.scmaisinovacao.scti.sc.gov.br/)

> Programa lançado em 21 de outubro de 2024 com o objetivo de transformar Santa Catarina em um grande polo tecnológico, conectando governo, iniciativa privada, academia e sociedade civil organizada.
