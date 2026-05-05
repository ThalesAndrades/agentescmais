/**
 * SC Mais Inovação — Servidor Principal
 * Backend Express que orquestra o agente conversacional.
 *
 * Endpoints:
 *   GET  /                  → Painel de conversa (frontend estático)
 *   POST /api/chat          → Recebe mensagem do usuário, devolve resposta do agente
 *   GET  /api/health        → Healthcheck (status, provider, modelo, cache)
 *   POST /api/refresh-cache → Re-aquece o cache do Firecrawl (protegido por ADMIN_TOKEN)
 *   GET  /api/audit/*       → Métricas e logs (protegido por ADMIN_TOKEN)
 */

require("dotenv").config();

const express = require("express");
const path = require("path");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const { chat } = require("./src/gemini");
const firecrawl = require("./src/firecrawl");
const audit = require("./src/audit");

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ────────────────────────────────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────────────────────────────────

// Trust proxy (Hostinger / NGINX em frente)
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(compression());
app.use(express.json({ limit: "256kb" }));

// Cabeçalhos de segurança básicos (sem helmet para manter dependências enxutas).
// CSP permite o próprio domínio + Google Fonts (usado no front).
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join("; ")
  );
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: NODE_ENV === "production" ? "1h" : 0,
    etag: true
  })
);

// Rate limit no /api/chat — evita abuso da API do Gemini
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.CHAT_RATE_LIMIT, 10) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Muitas mensagens em pouco tempo. Aguarde alguns instantes e tente novamente."
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Rotas públicas
// ────────────────────────────────────────────────────────────────────────────

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    provider: "gemini",
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    firecrawl: firecrawl.getCacheStats(),
    uptime: Math.round(process.uptime()),
    chats: audit.getStats().totalChats,
    env: NODE_ENV
  });
});

app.post("/api/chat", chatLimiter, async (req, res) => {
  const startedAt = Date.now();
  const ip = req.ip;
  const sessionId = sanitizeSessionId(req.headers["x-session-id"]);
  const { message, history } = req.body || {};

  try {
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Mensagem vazia ou inválida." });
    }

    if (message.length > 4000) {
      return res.status(400).json({ error: "Mensagem muito longa (limite 4000 caracteres)." });
    }

    const sanitizedHistory = (Array.isArray(history) ? history : [])
      .slice(-20)
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map(m => ({ role: m.role, content: m.content.substring(0, 4000) }));

    const liveData = await firecrawl.fetchRelevantContext(message);
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

    const msg = typeof err?.message === "string" ? err.message : "";
    const isApiKeyError = msg.includes("API_KEY") || msg.includes("GEMINI_API_KEY");
    const isOverloaded = err.status === 529 || err.status === 503;
    const isRateLimited = err.status === 429;

    let userMsg = "Tive um problema ao processar sua mensagem. Tente novamente em instantes.";
    if (isApiKeyError) userMsg = "Configuração do servidor incompleta. Avise o administrador.";
    else if (isOverloaded) userMsg = "Estou recebendo muitas mensagens agora. Tente novamente em alguns segundos.";
    else if (isRateLimited) userMsg = "Limite temporário atingido. Aguarde alguns instantes e tente novamente.";

    res.status(isApiKeyError ? 500 : isRateLimited ? 429 : 503).json({ error: userMsg });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Endpoints administrativos (sempre protegidos por ADMIN_TOKEN)
// ────────────────────────────────────────────────────────────────────────────

function requireAdmin(req, res, next) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) {
    return res.status(503).json({ error: "ADMIN_TOKEN não configurado no servidor." });
  }
  const provided = req.headers["x-admin-token"] || req.query.token;
  if (!provided || !timingSafeEquals(provided, token)) {
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

app.post("/api/refresh-cache", requireAdmin, async (req, res) => {
  const before = firecrawl.getCacheStats();
  firecrawl.clearCache();
  firecrawl.warmCache().catch(err => console.error("warmCache:", err.message));
  res.json({ ok: true, previousCacheSize: before.size });
});

// ────────────────────────────────────────────────────────────────────────────
// 404 explícito para /api/*; SPA fallback para o restante
// ────────────────────────────────────────────────────────────────────────────

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Endpoint não encontrado." });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function sanitizeSessionId(value) {
  if (!value || typeof value !== "string") return null;
  // Mantém só caracteres seguros e limita o tamanho
  const cleaned = value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return cleaned || null;
}

function timingSafeEquals(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

// ────────────────────────────────────────────────────────────────────────────
// Inicialização
// ────────────────────────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const fcStatus = process.env.FIRECRAWL_API_KEY ? "ativo" : "inativo (chave ausente)";
  console.log("");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   SC Mais Inovação — Agente Conversacional                 ║");
  console.log("╠════════════════════════════════════════════════════════════╣");
  console.log(`║   🌐 Porta: ${String(PORT).padEnd(46)} ║`);
  console.log(`║   🤖 Modelo: ${model.padEnd(45)} ║`);
  console.log(`║   🔥 Firecrawl: ${fcStatus.padEnd(42)} ║`);
  console.log(`║   ⚙️  Ambiente: ${NODE_ENV.padEnd(43)} ║`);
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("");

  firecrawl.warmCache().catch(err => {
    console.warn("Aviso: warmCache falhou —", err.message);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Shutdown gracioso (importante para Passenger / Hostinger restart sem 502)
// ────────────────────────────────────────────────────────────────────────────

function shutdown(signal) {
  console.log(`\n${signal} recebido — encerrando servidor...`);
  server.close(err => {
    if (err) {
      console.error("Erro ao fechar servidor:", err);
      process.exit(1);
    }
    console.log("Servidor encerrado.");
    process.exit(0);
  });
  // Forçar saída se não fechar em 10s
  setTimeout(() => {
    console.error("Timeout no shutdown — forçando saída.");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", reason => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", err => {
  console.error("Uncaught Exception:", err);
});
