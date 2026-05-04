/**
 * SC Mais Inovação · Frontend do Chat
 *
 * - Comunica com /api/chat
 * - Mantém histórico em memória (também persiste em sessionStorage)
 * - Renderiza markdown leve nas respostas do agente
 * - Gerencia estados: loading, online, offline
 */

(() => {
  "use strict";

  // ──────────────────────────────────────────────────────────
  // Elementos
  // ──────────────────────────────────────────────────────────
  const $scroll       = document.getElementById("chatScroll");
  const $welcome      = document.getElementById("welcome");
  const $form         = document.getElementById("composer");
  const $input        = document.getElementById("messageInput");
  const $sendBtn      = document.getElementById("sendBtn");
  const $typing       = document.getElementById("typingIndicator");
  const $statusPill   = document.getElementById("statusPill");
  const $statusText   = document.getElementById("statusText");

  // Histórico em memória (também persiste enquanto a aba existe)
  let history = loadHistory();
  let isSending = false;

  // ──────────────────────────────────────────────────────────
  // Inicialização
  // ──────────────────────────────────────────────────────────

  // Auto-resize do textarea
  $input.addEventListener("input", autosizeTextarea);

  // Enter para enviar; Shift+Enter para quebrar linha
  $input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      $form.requestSubmit();
    }
  });

  // Submit
  $form.addEventListener("submit", handleSubmit);

  // Sugestões iniciais
  document.querySelectorAll(".suggestion").forEach(btn => {
    btn.addEventListener("click", () => {
      const prompt = btn.dataset.prompt;
      $input.value = prompt;
      autosizeTextarea();
      $input.focus();
      $form.requestSubmit();
    });
  });

  // Restaura histórico (se houver)
  if (history.length > 0) {
    if ($welcome) $welcome.remove();
    history.forEach(msg => renderMessage(msg.role, msg.content, false));
    scrollToBottom();
  }

  // Healthcheck inicial
  checkHealth();
  setInterval(checkHealth, 60000);

  // Foco automático
  setTimeout(() => $input.focus(), 250);

  // ──────────────────────────────────────────────────────────
  // Funções principais
  // ──────────────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault();
    if (isSending) return;

    const text = $input.value.trim();
    if (!text) return;

    isSending = true;
    $sendBtn.disabled = true;

    // Remove o welcome se ainda existir
    if ($welcome && $welcome.parentNode) $welcome.remove();

    // Adiciona mensagem do usuário
    renderMessage("user", text);
    history.push({ role: "user", content: text });
    saveHistory();

    // Limpa input
    $input.value = "";
    autosizeTextarea();

    // Mostra typing
    showTyping(true);

    try {
      const reply = await sendToAPI(text);

      showTyping(false);
      renderMessage("assistant", reply.text, true, reply.meta);
      history.push({ role: "assistant", content: reply.text });
      saveHistory();

      setStatus("online", "online");
    } catch (err) {
      showTyping(false);
      renderMessage(
        "assistant",
        `Desculpe, tive um problema para responder agora. ${err.message ? `(${err.message})` : ""} Tente novamente em instantes.`,
        true
      );
      setStatus("offline", "offline");
    } finally {
      isSending = false;
      $sendBtn.disabled = false;
      $input.focus();
    }
  }

  async function sendToAPI(message) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        // envia só os últimos 20 turnos (sem a mensagem atual)
        history: history.slice(-20, -1)
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Erro ${res.status}`);
    }

    return { text: data.reply, meta: data.meta };
  }

  // ──────────────────────────────────────────────────────────
  // Render de mensagens
  // ──────────────────────────────────────────────────────────

  function renderMessage(role, content, animate = true, meta = null) {
    const $msg = document.createElement("div");
    $msg.className = `message ${role}`;
    if (!animate) $msg.style.animation = "none";

    const $avatar = document.createElement("div");
    $avatar.className = "message-avatar";
    $avatar.textContent = role === "user" ? "Você" : "SC+";

    const $bubble = document.createElement("div");
    $bubble.className = "message-bubble";

    if (role === "assistant") {
      $bubble.innerHTML = renderMarkdown(content);

      // Indicador de fonte ao vivo (Firecrawl)
      if (meta && meta.usedLiveData) {
        const $source = document.createElement("div");
        $source.className = "live-source";
        const urlLabel = meta.liveDataUrl
          ? meta.liveDataUrl.replace("https://www.scmaisinovacao.scti.sc.gov.br", "")
          : "site oficial";
        $source.textContent = `dados validados em tempo real · ${urlLabel}`;
        $bubble.appendChild($source);
      }
    } else {
      $bubble.textContent = content;
    }

    $msg.appendChild($avatar);
    $msg.appendChild($bubble);

    // Inserir antes do typing indicator (se estiver no DOM principal)
    $scroll.appendChild($msg);
    scrollToBottom();
  }

  /**
   * Renderizador de markdown leve, suficiente para respostas conversacionais.
   * Suporta: **bold**, *italic*, `code`, [link](url), listas com -, parágrafos,
   * cabeçalhos (### e ##), blockquote (>).
   */
  function renderMarkdown(text) {
    // Escape HTML primeiro
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const lines = html.split("\n");
    const out = [];
    let inList = false;
    let listType = null;

    const closeList = () => {
      if (inList) {
        out.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Cabeçalhos
      if (/^###\s+/.test(line)) {
        closeList();
        out.push(`<h4>${formatInline(line.replace(/^###\s+/, ""))}</h4>`);
        continue;
      }
      if (/^##\s+/.test(line)) {
        closeList();
        out.push(`<h3>${formatInline(line.replace(/^##\s+/, ""))}</h3>`);
        continue;
      }

      // Blockquote
      if (/^&gt;\s+/.test(line)) {
        closeList();
        out.push(`<blockquote>${formatInline(line.replace(/^&gt;\s+/, ""))}</blockquote>`);
        continue;
      }

      // Lista não-ordenada
      if (/^[-*]\s+/.test(line)) {
        if (!inList || listType !== "ul") {
          closeList();
          out.push("<ul>");
          inList = true;
          listType = "ul";
        }
        out.push(`<li>${formatInline(line.replace(/^[-*]\s+/, ""))}</li>`);
        continue;
      }

      // Lista ordenada
      if (/^\d+\.\s+/.test(line)) {
        if (!inList || listType !== "ol") {
          closeList();
          out.push("<ol>");
          inList = true;
          listType = "ol";
        }
        out.push(`<li>${formatInline(line.replace(/^\d+\.\s+/, ""))}</li>`);
        continue;
      }

      // Linha vazia → fim de lista, fim de parágrafo
      if (!line.trim()) {
        closeList();
        continue;
      }

      // Parágrafo normal
      closeList();
      out.push(`<p>${formatInline(line)}</p>`);
    }

    closeList();
    return out.join("\n");
  }

  function formatInline(s) {
    return s
      // Links [texto](url)
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      // URLs nuas
      .replace(/(^|\s)(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>')
      // E-mails
      .replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1">$1</a>')
      // **bold**
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      // *italic*
      .replace(/(^|[^*])\*([^*]+)\*([^*]|$)/g, "$1<em>$2</em>$3")
      // `code`
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  // ──────────────────────────────────────────────────────────
  // UI helpers
  // ──────────────────────────────────────────────────────────

  function showTyping(show) {
    if (show) {
      $typing.hidden = false;
      $scroll.appendChild($typing); // garante que fica no fim
      scrollToBottom();
    } else {
      $typing.hidden = true;
    }
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      $scroll.scrollTop = $scroll.scrollHeight;
    });
  }

  function autosizeTextarea() {
    $input.style.height = "auto";
    $input.style.height = Math.min($input.scrollHeight, 180) + "px";
  }

  function setStatus(state, label) {
    $statusPill.classList.remove("online", "offline");
    if (state) $statusPill.classList.add(state);
    $statusText.textContent = label;
  }

  // ──────────────────────────────────────────────────────────
  // Healthcheck
  // ──────────────────────────────────────────────────────────

  async function checkHealth() {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (!res.ok) throw new Error("erro");
      setStatus("online", "online");
    } catch {
      setStatus("offline", "offline");
    }
  }

  // ──────────────────────────────────────────────────────────
  // Persistência leve do histórico (sessionStorage)
  // ──────────────────────────────────────────────────────────

  function saveHistory() {
    try {
      // Limita a 30 mensagens para não estourar o storage
      const recent = history.slice(-30);
      sessionStorage.setItem("sc_mais_inovacao_history", JSON.stringify(recent));
    } catch { /* silently ignore */ }
  }

  function loadHistory() {
    try {
      const raw = sessionStorage.getItem("sc_mais_inovacao_history");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string");
    } catch {
      return [];
    }
  }
})();
