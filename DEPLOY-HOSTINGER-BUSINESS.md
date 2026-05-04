# Deploy no Hostinger Business — `agentescmais.pro`

Guia passo a passo, cirúrgico, para colocar o **Agente SC Mais Inovação** no ar no domínio **agentescmais.pro** usando o plano **Business Web Hosting** da Hostinger (que suporta Node.js nativamente).

**Tempo estimado:** ~12 minutos
**Pré-requisitos:**
- Plano Business ativo na Hostinger
- Domínio `agentescmais.pro` adicionado à conta Hostinger e com DNS apontado
- Repositório GitHub: `https://github.com/thalesandrades/agentescmais`
- Chaves de API: **Anthropic** e **Firecrawl**

---

## Etapa 1 — Confirmar o domínio na Hostinger

1. Faça login em [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. No menu superior clique em **Domínios**
3. Verifique se `agentescmais.pro` aparece na lista com status **Ativo**

> Se o domínio foi registrado fora da Hostinger, vá em **Domínios → Adicionar website** e siga as instruções para apontar os nameservers para `ns1.dns-parking.com` e `ns2.dns-parking.com` (a propagação leva até 24h).

---

## Etapa 2 — Criar a aplicação Node.js

1. No menu superior clique em **Hospedagem** (ou **Sites**)
2. Encontre `agentescmais.pro` e clique em **Gerenciar**
3. No painel lateral esquerdo, role até **Avançado** e clique em **Node.js**
4. Clique no botão **+ Criar aplicação**

Preencha o formulário **exatamente assim**:

| Campo | Valor |
|---|---|
| **Versão do Node.js** | `20.x` (ou superior — evite 18 se houver opção mais nova) |
| **Modo da aplicação** | `Production` |
| **URL da aplicação** | `agentescmais.pro` (deixe vazio o subpath) |
| **Diretório raiz da aplicação** | `domains/agentescmais.pro/public_html` |
| **Arquivo de inicialização** | `server.js` |

5. Clique em **Criar**.

A Hostinger vai provisionar o ambiente. Você verá a aplicação listada com status **Stopped**. Não inicie ainda.

---

## Etapa 3 — Conectar o repositório GitHub

1. Volte ao painel do site `agentescmais.pro`
2. Em **Avançado**, clique em **GIT**
3. Clique em **+ Criar um novo repositório**

Preencha:

| Campo | Valor |
|---|---|
| **URL do repositório** | `https://github.com/thalesandrades/agentescmais.git` |
| **Branch** | `main` |
| **Caminho do repositório** | `domains/agentescmais.pro/public_html` |

> ⚠️ O **Caminho do repositório** precisa ser **idêntico** ao Diretório raiz da aplicação Node.js da etapa anterior.

4. Clique em **Criar**.

A Hostinger fará o `git clone` no diretório indicado. Aguarde a mensagem de sucesso.

> **Repositório privado?** Você precisará gerar um deploy key SSH (a Hostinger mostra a chave pública no painel — copie e cole em **Settings → Deploy keys** no seu repositório do GitHub).

---

## Etapa 4 — Configurar as variáveis de ambiente

1. Volte em **Avançado → Node.js**
2. Clique na sua aplicação para expandir
3. Role até a seção **Variáveis de ambiente**
4. Adicione cada uma das variáveis abaixo clicando em **+ Adicionar variável**:

| Nome | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (sua chave do Claude) |
| `FIRECRAWL_API_KEY` | `fc-...` (sua chave do Firecrawl) |
| `CLAUDE_MODEL` | `claude-sonnet-4-6` |
| `NODE_ENV` | `production` |

> ⚠️ **Não defina** a variável `PORT`. A Hostinger injeta a porta correta automaticamente via Phusion Passenger.

5. Clique em **Salvar**.

---

## Etapa 5 — Instalar dependências

1. Ainda no painel da aplicação Node.js
2. Clique no botão **Run NPM Install** (ou abra o terminal SSH e rode `npm install` na pasta da aplicação)
3. Aguarde o processo terminar — pode levar 1 a 3 minutos

Você deve ver algo como:

```
added 87 packages in 45s
```

---

## Etapa 6 — Iniciar a aplicação

1. Clique em **Start App** (ou **Restart**)
2. O status deve mudar para **Running** com fundo verde

Verifique os logs clicando em **View Logs**. Se tudo deu certo, você verá:

```
╔════════════════════════════════════════════════════════════╗
║   SC Mais Inovação — Agente Conversacional                 ║
╠════════════════════════════════════════════════════════════╣
║   🌐 Servidor rodando em http://localhost:XXXXX            ║
║   🤖 Modelo Claude: claude-sonnet-4-6                      ║
║   🔥 Firecrawl: ativo                                      ║
╚════════════════════════════════════════════════════════════╝
🔥 Pré-aquecendo cache do Firecrawl...
✅ Cache pré-aquecido (3 páginas)
```

---

## Etapa 7 — Ativar SSL (HTTPS)

1. No painel do site, vá em **Segurança → SSL**
2. Clique em **Instalar SSL** no domínio `agentescmais.pro`
3. Selecione **Let's Encrypt (gratuito)**
4. Aguarde 2 a 5 minutos para a emissão do certificado
5. Ative a opção **Forçar HTTPS** logo abaixo

---

## Etapa 8 — Testar

Abra no navegador: **[https://agentescmais.pro](https://agentescmais.pro)**

Você deve ver o painel de conversa com o tema verde do programa. Tente fazer uma pergunta como:

> *"Quem é o agente de inovação da minha região? Sou de Criciúma."*

Para verificar a saúde do backend:

```bash
curl https://agentescmais.pro/api/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2026-...",
  "model": "claude-sonnet-4-6",
  "firecrawl": { "size": 3, "enabled": true },
  "uptime": 42
}
```

---

## Etapa 9 — Configurar deploy contínuo (opcional, recomendado)

Para que cada `git push` na branch `main` atualize o site automaticamente:

1. Volte em **Avançado → GIT**
2. Na sua entrada de repositório, clique no ícone de cadeado/configurações
3. **Copie a URL do webhook** (fica algo como `https://webhooks.hostinger.com/...`)
4. No GitHub, vá em **Settings → Webhooks → Add webhook** do seu repositório
5. Cole a URL no campo **Payload URL**
6. **Content type:** `application/json`
7. **Which events:** `Just the push event`
8. Salve.

Pronto — toda mudança no GitHub será refletida no site após ~30 segundos.

> Após cada push, lembre-se de ir no painel Node.js e clicar em **Restart** para recarregar o processo (ou configure um `git hook` post-receive para fazer isso automaticamente — opcional).

---

## Solução de problemas

| Sintoma | Causa provável | Como resolver |
|---|---|---|
| Erro **503 Service Unavailable** | App não iniciou | Veja **View Logs** — geralmente é variável de ambiente faltando |
| Erro **502 Bad Gateway** | App crashou após iniciar | Logs vão mostrar o erro JS — corrija e Restart |
| **"ANTHROPIC_API_KEY não configurada"** | Variável não foi salva | Re-adicione no painel Node.js e Restart |
| **Site mostra 404 / "Index of /"** | Diretório raiz errado | Confira que o `Diretório raiz` aponta exatamente para onde o `git clone` baixou |
| **Mudanças no GitHub não aparecem** | Webhook não configurado, ou app não foi reiniciada | Configure webhook (Etapa 9) e/ou clique em **Restart** |
| **"Muitas mensagens em pouco tempo"** no chat | Rate limit interno (20 msgs/min/IP) | É proteção — espere 1 minuto |
| **Frontend carrega, mas chat não responde** | API do Claude/Firecrawl falhando | Veja logs e verifique se as chaves estão válidas em [console.anthropic.com](https://console.anthropic.com) e [firecrawl.dev](https://www.firecrawl.dev/) |

---

## Limites do plano Business — o que ter em mente

- **CPU:** processo Node.js compartilha CPU do servidor — para tráfego alto (>1.000 msgs/dia) considere migrar para **Cloud Hosting** ou VPS
- **Memória:** ~768MB disponíveis — suficiente para essa aplicação
- **Timeout de execução:** ~30s para requisições — o Claude responde em 3-15s, então fica tranquilo
- **Workers:** 1 worker Node.js — se precisar de mais throughput, é hora de upgrade
- **Logs:** rotacionados automaticamente — para retenção longa, use um serviço externo (ex: Papertrail, Logtail)

---

## Próximos passos

- [ ] Monitorar uso de tokens no [console.anthropic.com](https://console.anthropic.com/dashboard)
- [ ] Monitorar uso de scrapes no [firecrawl.dev](https://www.firecrawl.dev/app/usage)
- [ ] Configurar Google Analytics ou Plausible no `index.html` se quiser métricas de uso
- [ ] Customizar a base de conhecimento em `src/knowledge.js` quando o programa publicar atualizações importantes
- [ ] Considerar adicionar um botão de feedback (👍/👎) para coletar qualidade das respostas

---

**Pronto. O agente está no ar em [agentescmais.pro](https://agentescmais.pro).**
