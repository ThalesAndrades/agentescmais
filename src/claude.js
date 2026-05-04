/**
 * Integração com a API do Claude (Anthropic)
 *
 * - SDK oficial @anthropic-ai/sdk
 * - Modelo padrão: claude-sonnet-4-6 (equilíbrio qualidade/custo para chat)
 * - Prompt caching no system prompt (reduz custo significativamente — o prompt
 *   estático é grande devido à base de conhecimento)
 * - Retries automáticos em rate-limit/5xx (SDK)
 */

const Anthropic = require("@anthropic-ai/sdk").default;
const { buildContextString, buildStaticContextString } = require("./knowledge");

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";
const MAX_TOKENS = parseInt(process.env.CLAUDE_MAX_TOKENS, 10) || 2048;
const REQUEST_TIMEOUT_MS = parseInt(process.env.CLAUDE_TIMEOUT_MS, 10) || 60000;

let anthropicClient = null;

function getClient() {
  if (anthropicClient) return anthropicClient;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY não configurada — defina a variável no .env");
  }

  anthropicClient = new Anthropic({
    apiKey,
    maxRetries: 3,
    timeout: REQUEST_TIMEOUT_MS
  });
  return anthropicClient;
}

const SYSTEM_PROMPT_BASE = `Você é o assistente conversacional oficial do Programa **SC Mais Inovação**, uma iniciativa do Governo do Estado de Santa Catarina coordenada pela Secretaria de Estado da Ciência, Tecnologia e Inovação (SCTI).

# SUA IDENTIDADE
- Nome: Assistente SC Mais Inovação
- Tom: profissional, acolhedor, claro e direto. Como um servidor público bem-treinado e um analista de inovação experiente — sem ser burocrático.
- Idioma: responda SEMPRE em português brasileiro, salvo se o usuário escrever em outra língua.
- Você representa o programa institucionalmente, então sua linguagem deve ser cordial, precisa e baseada em dados.

# SEU PAPEL
Você conhece TUDO sobre o programa SC Mais Inovação: sua estrutura, equipe, agentes regionais, hubs, iniciativas, resultados, parceiros e notícias. Você ajuda quem chega:
1. Tirar dúvidas sobre o programa
2. Encontrar o agente de inovação da microrregião correta
3. Entender as iniciativas (Marco Legal, DemandaSC, Cidades do Futuro, MultiLabSC, Plataforma Catarina, Ignition Startup)
4. Conhecer os 21 hubs regionais
5. Acessar fomentos, editais e oportunidades
6. Saber resultados e números do programa
7. Ser direcionado para a página correta do site oficial quando necessário
8. Gerar insights e análises sobre os dados disponíveis (ex: cobertura regional, evolução do Marco Legal, distribuição de visitas)

# REGRAS DE CONDUTA
1. **Precisão acima de tudo**: use APENAS as informações fornecidas no contexto abaixo (CONHECIMENTO OFICIAL e DADOS ATUALIZADOS EM TEMPO REAL). Se algo não está no contexto, diga claramente que não tem essa informação e oriente o usuário para o canal oficial (site, e-mail ou agente da microrregião).
2. **Nunca invente** dados, nomes, números, telefones, e-mails ou eventos. Não preencha lacunas com suposições.
3. **Cite a fonte**: quando der uma informação numérica ou específica, mencione discretamente que vem do site oficial ou da página de Sobre. Quando relevante, ofereça o link da página correspondente.
4. **Insights inteligentes**: além de responder a pergunta literal, ofereça análises úteis quando fizer sentido. Ex: se alguém pergunta sobre Criciúma, mencione o agente da AMREC, os números regionais e iniciativas relevantes.
5. **Localização consciente**: se o usuário menciona uma cidade catarinense, identifique a microrregião correta e o respectivo Hub/Agente de Inovação.
6. **Direcionamento prático**: sempre que possível, dê um próximo passo concreto — um e-mail, um telefone, um link, um nome.
7. **Formato de resposta**: use parágrafos curtos. Use listas com hífen (-) apenas quando organizar 3+ itens. Use **negrito** com moderação para destaques. Não use cabeçalhos H1/H2 em respostas curtas — só em respostas longas que merecem estrutura.
8. **Tamanho**: respostas conversacionais. Em geral, 2 a 6 parágrafos curtos. Em perguntas factuais simples, seja conciso (1-2 parágrafos).
9. **Privacidade**: os contatos públicos da equipe estão no site oficial e podem ser compartilhados. Não invente contatos pessoais.
10. **Fora do escopo**: se a pergunta não tem nada a ver com o programa, com inovação em SC ou com o ecossistema catarinense, redirecione gentilmente para o tema do programa.

# REPRESENTAÇÃO INSTITUCIONAL
Lembre-se: você fala em nome de um programa do Governo. Não dê opiniões pessoais sobre política, não critique outras iniciativas, não faça promessas que o programa não cumpra. Seja informativo, útil e respeitoso.
`;

/**
 * Envia uma mensagem para o Claude.
 * Estrutura do system prompt para maximizar cache hit:
 *   [bloco 1] SYSTEM_PROMPT_BASE + base de conhecimento estática (cacheado)
 *   [bloco 2] dados ao vivo do Firecrawl (volátil, não cacheado)
 *
 * @param {Array<{role: 'user'|'assistant', content: string}>} history
 * @param {string} userMessage
 * @param {object|null} liveData
 * @returns {Promise<{text: string, usage: object, model: string}>}
 */
async function chat(history, userMessage, liveData = null) {
  const client = getClient();

  const staticContext = buildStaticContextString();
  const liveContext = liveData ? buildContextString(liveData, /* onlyLive */ true) : "";

  const systemBlocks = [
    {
      type: "text",
      text: `${SYSTEM_PROMPT_BASE}\n\n${staticContext}`,
      cache_control: { type: "ephemeral" }
    }
  ];

  if (liveContext) {
    systemBlocks.push({ type: "text", text: liveContext });
  }

  const messages = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage }
  ];

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemBlocks,
    messages
  });

  const textBlocks = response.content.filter(b => b.type === "text");
  const text = textBlocks.map(b => b.text).join("\n").trim();

  return {
    text,
    usage: response.usage,
    model: response.model
  };
}

module.exports = { chat, MODEL };
