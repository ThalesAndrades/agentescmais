/**
 * Integração com Firecrawl
 * Responsável por buscar dados em tempo real do site SC Mais Inovação
 * para validar informações e enriquecer as respostas do agente.
 *
 * Doc: https://docs.firecrawl.dev/
 */

const FirecrawlApp = require("@mendable/firecrawl-js").default;

const BASE_URL = "https://www.scmaisinovacao.scti.sc.gov.br";

// Cache em memória — TTL de 30 minutos por URL
const cache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

let firecrawlClient = null;

function getClient() {
  if (firecrawlClient) return firecrawlClient;

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.warn("⚠️  FIRECRAWL_API_KEY ausente — funcionando apenas com base de conhecimento estática");
    return null;
  }

  firecrawlClient = new FirecrawlApp({ apiKey });
  return firecrawlClient;
}

/**
 * Decide qual URL do site é mais relevante para a pergunta do usuário.
 * Heurística leve baseada em palavras-chave, sem chamada extra à LLM.
 */
function pickRelevantUrl(userMessage) {
  const msg = (userMessage || "").toLowerCase();

  // Ordem importa: rotas mais específicas vêm antes das genéricas
  const map = [
    { keywords: ["notícia", "noticia", "novidade", "última", "ultima", "imprensa"], url: `${BASE_URL}/noticias.php` },
    { keywords: ["evento", "agenda", "calendário", "calendario", "ignition", "workshop"], url: `${BASE_URL}/eventos.php` },
    { keywords: ["fomento", "investimento", "edital", "captação", "captacao", "linha de crédito", "credito", "brde"], url: `${BASE_URL}/fomentos.php` },
    { keywords: ["marco legal", "legislação", "legislacao", "lei municipal", "100% marco"], url: `${BASE_URL}/marcolegal.php` },
    { keywords: ["demanda", "demandasc", "necessidade", "oportunidade municipal"], url: `${BASE_URL}/demandasc.php` },
    { keywords: ["governança", "governanca", "estrutura de governança"], url: `${BASE_URL}/governanca.php` },
    { keywords: ["centro de inovação", "centros de inovação", "centro de inovacao", "centros de inovacao", "rede de centros"], url: `${BASE_URL}/centros.php` },
    { keywords: ["escritório", "escritorio", "projeto"], url: `${BASE_URL}/escritorios.php` },
    { keywords: ["contato", "telefone", "fale", "endereço", "endereco"], url: `${BASE_URL}/contato.php` },
    { keywords: ["conecte", "participar", "cadastrar", "cadastro"], url: `${BASE_URL}/conecte-se.php` },
    { keywords: ["ecossistema", "rede", "hub", "incubadora", "startup", "laboratório", "laboratorio"], url: `${BASE_URL}/ecossistema.php` },
    { keywords: ["sobre", "história", "historia", "equipe", "agente de inovação", "agente de inovacao", "coordenação", "coordenacao", "missão", "missao", "objetivo"], url: `${BASE_URL}/sobre.php` }
  ];

  for (const entry of map) {
    if (entry.keywords.some(k => msg.includes(k))) {
      return entry.url;
    }
  }

  return null; // sem match relevante — não vale gastar chamada
}

/**
 * Busca dados de uma URL via Firecrawl, com cache.
 * Retorna `null` se a chave não estiver configurada ou se falhar.
 */
async function fetchPage(url) {
  if (!url) return null;

  const cached = cache.get(url);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return cached.data;
  }

  const client = getClient();
  if (!client) return null;

  try {
    const result = await client.scrapeUrl(url, {
      formats: ["markdown"],
      onlyMainContent: true,
      timeout: 20000
    });

    if (!result || !result.success) {
      console.error("Firecrawl returned unsuccessful result for", url);
      return null;
    }

    const data = {
      url,
      markdown: result.markdown || "",
      timestamp: new Date().toISOString()
    };

    cache.set(url, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    console.error("Erro ao consultar Firecrawl para", url, "—", err.message);
    return null;
  }
}

/**
 * Função pública: dada uma mensagem do usuário, decide se vale buscar
 * dados ao vivo e retorna o conteúdo (ou null).
 */
async function fetchRelevantContext(userMessage) {
  const url = pickRelevantUrl(userMessage);
  if (!url) return null;
  return await fetchPage(url);
}

/**
 * Pré-aquece o cache com a página inicial e a página "sobre" no boot.
 */
async function warmCache() {
  const client = getClient();
  if (!client) return;

  console.log("🔥 Pré-aquecendo cache do Firecrawl...");
  await Promise.allSettled([
    fetchPage(`${BASE_URL}/`),
    fetchPage(`${BASE_URL}/sobre.php`),
    fetchPage(`${BASE_URL}/noticias.php`)
  ]);
  console.log(`✅ Cache pré-aquecido (${cache.size} páginas)`);
}

function getCacheStats() {
  return {
    size: cache.size,
    urls: Array.from(cache.keys()),
    enabled: !!getClient()
  };
}

function clearCache() {
  const size = cache.size;
  cache.clear();
  return size;
}

module.exports = {
  fetchRelevantContext,
  fetchPage,
  warmCache,
  getCacheStats,
  clearCache,
  BASE_URL
};
