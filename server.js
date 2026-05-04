/**
 * SC Mais Inovação — Servidor Principal
 * Backend Express que orquestra o agente conversacional.
 *
 * Endpoints:
 *   GET  /                  → Painel de conversa (frontend estático)
 *   POST /api/chat          → Recebe mensagem do usuário, devolve resposta do agente
 *   GET  /api/health        → Healthcheck (status, modelo, cache)
 *   POST /api/refresh-cache → Limpa o cache do Firecrawl (pode ser protegido)
 */

require("dotenv").config();

const express = require("express");
const path = require("path");
const rateLimit = require("express-rate-limit");

const { chat } = require("./src/claude");
const firecrawl = require("./src/firecrawl");
const audit = require("./src/audit");

const app = express();
const PORT = process.env.PORT || 3000;

// ────────────────────────────────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────────────────────────────────

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Trust proxy (Hostinger / NGINX em frente)
app.set("trust proxy", 1);

// Rate limit no /api/chat — evita abuso da API do Claude
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20,             // 20 mensagens por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Muitas mensagens em pouco tempo. Aguarde alguns instantes e tente novamente."
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Rotas
// ────────────────────────────────────────────────────────────────────────────

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
    firecrawl: firecrawl.getCacheStats(),
    uptime: process.uptime(),
    chats: audit.getStats().totalChats
  });
});

app.post("/api/chat", chatLimiter, async (req, res) => {
  const startedAt = Date.now();
  const ip = req.ip;
  const sessionId = req.headers["x-session-id"] || null;
  const { message, history } = req.body || {};

  try {
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Mensagem vazia ou inválida." });
    }

    if (message.length > 4000) {
      return res.status(400).json({ error: "Mensagem muito longa (limite 4000 caracteres)." });
    }

    // Sanitiza histórico (mantém só os últimos 20 turnos para controlar contexto)
    const sanitizedHistory = (Array.isArray(history) ? history : [])
      .slice(-20)
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map(m => ({ role: m.role, content: m.content.substring(0, 4000) }));

    // Busca dados ao vivo no site (opcional, com cache)
    const liveData = await firecrawl.fetchRelevantContext(message);

    // Conversa com o Claude
    const response = await chat(sanitizedHistory, message.trim(), liveData);

    const latencyMs = Date.now() - startedAt;

    audit.logChat({
      ip,
      sessionId,
      userMessage: message,
      assistantReply: response.text,
      latencyMs,
      model: response.model,
      usage: response.usage,
      liveDataUrl: liveData ? liveData.url : null
    });

    res.json({
      reply: response.text,
      meta: {
        model: response.model,
        usedLiveData: !!liveData,
        liveDataUrl: liveData ? liveData.url : null,
        latencyMs
      }
    });
  } catch (err) {
    console.error("Erro no /api/chat:", err);
    audit.logError({ ip, sessionId, userMessage: message, error: err });

    // Mensagem amigável sem expor stack trace
    const isApiKeyError = err.message && err.message.includes("API_KEY");
    res.status(500).json({
      error: isApiKeyError
        ? "Configuração do servidor incompleta. Avise o administrador."
        : "Tive um problema ao processar sua mensagem. Tente novamente em instantes."
    });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Endpoints de auditoria (protegidos por ADMIN_TOKEN)
// ────────────────────────────────────────────────────────────────────────────

function requireAdmin(req, res, next) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) {
    return res.status(503).json({ error: "ADMIN_TOKEN não configurado no servidor." });
  }
  const provided = req.headers["x-admin-token"] || req.query.token;
  if (provided !== token) {
    return res.status(401).json({ error: "Não autorizado." });
  }
  next();
}

app.get("/api/audit/stats", requireAdmin, (req, res) => {
  res.json(audit.getStats());
});

app.get("/api/audit/logs", requireAdmin, (req, res) => {
  res.json({ files: audit.listLogFiles() });
});

app.get("/api/audit/logs/:file", requireAdmin, (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 1000);
    const entries = audit.readLogFile(req.params.file, limit);
    res.json({ file: req.params.file, count: entries.length, entries });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/refresh-cache", (req, res) => {
  // Proteção simples por token, se configurado
  const token = process.env.ADMIN_TOKEN;
  if (token) {
    const provided = req.headers["x-admin-token"];
    if (provided !== token) {
      return res.status(401).json({ error: "Não autorizado." });
    }
  }

  // Limpa o cache forçando re-fetch
  const stats = firecrawl.getCacheStats();
  // Como o cache é interno ao módulo, expomos via uma função de reset:
  // (Para simplicidade, basta esperar TTL — mas aqui forçamos warmup)
  firecrawl.warmCache().catch(err => console.error("Erro no warmCache:", err));

  res.json({ ok: true, previousCacheSize: stats.size });
});

// Fallback — qualquer rota não-API serve o index.html (SPA-friendly)
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Endpoint não encontrado." });
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ────────────────────────────────────────────────────────────────────────────
// Inicialização
// ────────────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log("");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   SC Mais Inovação — Agente Conversacional                 ║");
  console.log("╠════════════════════════════════════════════════════════════╣");
  console.log(`║   🌐 Servidor rodando em http://localhost:${PORT}              ║`);
  console.log(`║   🤖 Modelo Claude: ${(process.env.CLAUDE_MODEL || "claude-sonnet-4-6").padEnd(38)} ║`);
  console.log(`║   🔥 Firecrawl: ${(process.env.FIRECRAWL_API_KEY ? "ativo" : "inativo (chave ausente)").padEnd(43)} ║`);
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("");

  // Pré-aquece cache em background (não bloqueia o boot)
  firecrawl.warmCache().catch(err => {
    console.warn("Aviso: warmCache falhou —", err.message);
  });
});

// Tratamento de exceções não-capturadas
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
