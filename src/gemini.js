/**
 * Integração com a API Gemini (Google AI Studio / Gemini Developer API)
 *
 * Implementação via REST usando a free tier do Gemini, preservando o backend
 * atual e evitando dependência extra no servidor.
 */

const { buildContextString } = require("./knowledge");

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_OUTPUT_TOKENS = parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS, 10) || 1024;
const API_BASE_URL = process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
const REQUEST_TIMEOUT_MS = parseInt(process.env.GEMINI_TIMEOUT_MS, 10) || 30000;

function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada — defina a variável no .env");
  }

  return apiKey;
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

function mapHistoryToGeminiContents(history, userMessage) {
  return [
    ...history.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }]
    })),
    {
      role: "user",
      parts: [{ text: userMessage }]
    }
  ];
}

function extractTextFromCandidate(candidate) {
  const parts = candidate?.content?.parts || [];

  return parts
    .filter((part) => typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

async function requestGemini(payload) {
  const apiKey = getApiKey();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const endpoint = `${API_BASE_URL}/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const apiMessage = data?.error?.message || `Gemini retornou HTTP ${response.status}`;
      const error = new Error(apiMessage);
      error.status = response.status;
      error.details = data?.error || null;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Tempo limite excedido ao consultar o Gemini.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Envia uma mensagem para o Gemini com contexto enriquecido e histórico de conversa.
 *
 * @param {Array<{role: 'user'|'assistant', content: string}>} history - Histórico de mensagens
 * @param {string} userMessage - Última mensagem do usuário
 * @param {object|null} liveData - Dados ao vivo do Firecrawl (opcional)
 * @returns {Promise<{text: string, usage: object|null, model: string}>} Resposta do agente
 */
async function chat(history, userMessage, liveData = null) {
  const knowledgeContext = buildContextString(liveData);
  const systemPrompt = `${SYSTEM_PROMPT_BASE}\n\n${knowledgeContext}`;

  const response = await requestGemini({
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: mapHistoryToGeminiContents(history, userMessage),
    generationConfig: {
      responseMimeType: "text/plain",
      maxOutputTokens: MAX_OUTPUT_TOKENS
    }
  });

  const candidate = response?.candidates?.[0];
  const text = extractTextFromCandidate(candidate);

  if (!text) {
    const finishReason = candidate?.finishReason || response?.promptFeedback?.blockReason || "unknown";
    throw new Error(`Gemini não retornou texto utilizável. Motivo: ${finishReason}`);
  }

  return {
    text,
    usage: response.usageMetadata || null,
    model: response.modelVersion || MODEL
  };
}

module.exports = {
  chat,
  MODEL
};
