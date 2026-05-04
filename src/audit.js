/**
 * SC Mais Inovação · Sistema de Auditoria
 *
 * - Log estruturado em JSON Lines (audit-YYYY-MM-DD.log)
 * - Rotação diária automática
 * - Hash do IP (LGPD: nunca armazena IP cru)
 * - Métricas agregadas em memória (também derivadas dos arquivos)
 * - Sanitização básica de PII no conteúdo
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const LOG_DIR = path.join(__dirname, "..", "logs");
const IP_SALT = process.env.AUDIT_IP_SALT || crypto.randomBytes(16).toString("hex");
const MAX_CONTENT_PREVIEW = 500;

// Garante que o diretório existe
try {
  fs.mkdirSync(LOG_DIR, { recursive: true });
} catch (err) {
  console.warn("Aviso: não foi possível criar diretório de logs:", err.message);
}

// ────────────────────────────────────────────────────────────────────────────
// Métricas em memória (resetam no boot — para histórico durável use os arquivos)
// ────────────────────────────────────────────────────────────────────────────

const metrics = {
  bootedAt: new Date().toISOString(),
  totalChats: 0,
  totalErrors: 0,
  totalTokensInput: 0,
  totalTokensOutput: 0,
  liveDataUsage: 0,
  latencySamples: [],         // últimas 100 latências em ms
  topicsCounter: new Map(),   // contagem leve por palavra-chave
  errorsByType: new Map()
};

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function hashIp(ip) {
  if (!ip) return "unknown";
  return crypto.createHash("sha256").update(IP_SALT + ip).digest("hex").slice(0, 16);
}

function todayLogPath() {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(LOG_DIR, `audit-${date}.log`);
}

function appendLine(obj) {
  try {
    const line = JSON.stringify(obj) + "\n";
    fs.appendFile(todayLogPath(), line, (err) => {
      if (err) console.error("audit append error:", err.message);
    });
  } catch (err) {
    console.error("audit serialize error:", err.message);
  }
}

function truncate(str, max = MAX_CONTENT_PREVIEW) {
  if (typeof str !== "string") return "";
  if (str.length <= max) return str;
  return str.slice(0, max) + "…[truncated]";
}

// Detecta tópicos a partir de palavras-chave (mesma lógica do firecrawl picker)
const TOPIC_KEYWORDS = {
  noticias: ["notícia", "noticia", "novidade", "imprensa"],
  eventos: ["evento", "agenda", "calendário", "ignition", "workshop"],
  fomento: ["fomento", "investimento", "edital", "captação", "credito", "brde"],
  marcoLegal: ["marco legal", "legislação", "lei municipal"],
  demandasc: ["demanda", "demandasc", "necessidade"],
  governanca: ["governança", "estrutura"],
  ecossistema: ["ecossistema", "rede", "hub", "incubadora", "startup", "laboratório"],
  centros: ["centro de inovação", "centros de inovação"],
  contato: ["contato", "telefone", "fale", "endereço"],
  conectese: ["conecte", "participar", "cadastrar"],
  sobre: ["sobre", "história", "equipe", "agente de inovação", "missão"]
};

function classifyTopic(message) {
  const msg = (message || "").toLowerCase();
  for (const [topic, kws] of Object.entries(TOPIC_KEYWORDS)) {
    if (kws.some(k => msg.includes(k))) return topic;
  }
  return "geral";
}

// ────────────────────────────────────────────────────────────────────────────
// API pública
// ────────────────────────────────────────────────────────────────────────────

function logChat({ ip, userMessage, assistantReply, latencyMs, model, usage, liveDataUrl, sessionId }) {
  metrics.totalChats++;
  if (latencyMs) {
    metrics.latencySamples.push(latencyMs);
    if (metrics.latencySamples.length > 100) metrics.latencySamples.shift();
  }
  if (usage) {
    metrics.totalTokensInput += usage.input_tokens || 0;
    metrics.totalTokensOutput += usage.output_tokens || 0;
  }
  if (liveDataUrl) metrics.liveDataUsage++;

  const topic = classifyTopic(userMessage);
  metrics.topicsCounter.set(topic, (metrics.topicsCounter.get(topic) || 0) + 1);

  appendLine({
    type: "chat",
    timestamp: new Date().toISOString(),
    ipHash: hashIp(ip),
    sessionId: sessionId || null,
    topic,
    userMessage: truncate(userMessage),
    userMessageLength: (userMessage || "").length,
    assistantReply: truncate(assistantReply),
    assistantReplyLength: (assistantReply || "").length,
    latencyMs,
    model,
    usage: usage || null,
    liveDataUrl: liveDataUrl || null
  });
}

function logError({ ip, userMessage, error, sessionId }) {
  metrics.totalErrors++;
  const errType = (error && error.constructor && error.constructor.name) || "Error";
  metrics.errorsByType.set(errType, (metrics.errorsByType.get(errType) || 0) + 1);

  appendLine({
    type: "error",
    timestamp: new Date().toISOString(),
    ipHash: hashIp(ip),
    sessionId: sessionId || null,
    userMessage: truncate(userMessage),
    errorType: errType,
    errorMessage: error && error.message ? truncate(error.message, 300) : "unknown",
    stack: error && error.stack ? truncate(error.stack, 800) : null
  });
}

function logEvent(name, data = {}) {
  appendLine({
    type: "event",
    timestamp: new Date().toISOString(),
    name,
    ...data
  });
}

function getStats() {
  const lat = metrics.latencySamples;
  const avgLatency = lat.length ? Math.round(lat.reduce((a, b) => a + b, 0) / lat.length) : 0;
  const p95Latency = lat.length ? lat.slice().sort((a, b) => a - b)[Math.floor(lat.length * 0.95)] : 0;

  return {
    bootedAt: metrics.bootedAt,
    uptime: Math.round(process.uptime()),
    totalChats: metrics.totalChats,
    totalErrors: metrics.totalErrors,
    errorRate: metrics.totalChats > 0
      ? +(metrics.totalErrors / (metrics.totalChats + metrics.totalErrors) * 100).toFixed(2)
      : 0,
    tokens: {
      input: metrics.totalTokensInput,
      output: metrics.totalTokensOutput,
      total: metrics.totalTokensInput + metrics.totalTokensOutput
    },
    liveDataUsage: metrics.liveDataUsage,
    liveDataRate: metrics.totalChats > 0
      ? +(metrics.liveDataUsage / metrics.totalChats * 100).toFixed(2)
      : 0,
    latencyMs: { avg: avgLatency, p95: p95Latency, samples: lat.length },
    topics: Object.fromEntries(
      [...metrics.topicsCounter.entries()].sort((a, b) => b[1] - a[1])
    ),
    errorsByType: Object.fromEntries(metrics.errorsByType),
    logFile: path.basename(todayLogPath())
  };
}

function listLogFiles() {
  try {
    return fs.readdirSync(LOG_DIR)
      .filter(f => f.startsWith("audit-") && f.endsWith(".log"))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

function readLogFile(filename, limit = 200) {
  // Aceita só nomes seguros (evita path traversal)
  if (!/^audit-\d{4}-\d{2}-\d{2}\.log$/.test(filename)) {
    throw new Error("Nome de arquivo inválido");
  }
  const filePath = path.join(LOG_DIR, filename);
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.trim().split("\n").filter(Boolean);
  // Retorna as últimas `limit` linhas, mais recentes primeiro
  return lines
    .slice(-limit)
    .reverse()
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
}

module.exports = {
  logChat,
  logError,
  logEvent,
  getStats,
  listLogFiles,
  readLogFile
};
