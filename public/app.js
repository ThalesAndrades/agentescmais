/**
 * SC Mais Inovação · Frontend do chat
 *
 * - Fluxo enxuto sem frameworks
 * - Onboarding com quick actions e estado persistido em sessionStorage
 * - Feedback imediato para percepção de velocidade
 * - Markdown leve e seguro para respostas conversacionais
 */

(() => {
  "use strict";

  const STORAGE_KEY = "sc_mais_inovacao_history";
  const PHASES = [
    { title: "Recebido", text: "Entendendo sua pergunta e contexto…" },
    { title: "Buscando contexto", text: "Consultando informações do programa…" },
    { title: "Organizando resposta", text: "Estruturando uma resposta clara e objetiva…" }
  ];

  const $scroll = document.getElementById("chatScroll");
  const $welcome = document.getElementById("welcome");
  const $form = document.getElementById("composer");
  const $input = document.getElementById("messageInput");
  const $sendBtn = document.getElementById("sendBtn");
  const $typing = document.getElementById("typingIndicator");
  const $typingTitle = document.getElementById("typingTitle");
  const $typingText = document.getElementById("typingText");
  const $statusPill = document.getElementById("statusPill");
  const $statusText = document.getElementById("statusText");
  const $inputMeta = document.getElementById("inputMeta");
  const $composerState = document.getElementById("composerState");
  const $clearChatBtn = document.getElementById("clearChatBtn");

  let history = loadHistory();
  let isSending = false;
  let typingInterval = null;

  init();

  function init() {
    bindEvents();
    restoreConversation();
    updateInputMeta();
    autosizeTextarea();
    checkHealth();
    setInterval(checkHealth, 60000);
    window.addEventListener("online", () => setStatus("online", "online"));
    window.addEventListener("offline", () => setStatus("offline", "offline"));
    setTimeout(() => $input.focus(), 180);
  }

  function bindEvents() {
    $input.addEventListener("input", () => {
      autosizeTextarea();
      updateInputMeta();
      syncComposerState();
    });

    $input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        $form.requestSubmit();
      }
    });

    $form.addEventListener("submit", handleSubmit);

    document.querySelectorAll(".js-prompt").forEach((button) => {
      button.addEventListener("click", () => {
        const prompt = button.dataset.prompt;
        if (!prompt) return;
        fillAndSubmit(prompt);
      });
    });

    $clearChatBtn.addEventListener("click", clearConversation);
  }

  function restoreConversation() {
    if (!history.length) {
      syncWelcomeVisibility();
      return;
    }

    history.forEach((message) => renderMessage(message.role, message.content, { animate: false }));
    syncWelcomeVisibility();
    scrollToBottom();
    $composerState.textContent = "Conversa restaurada. Continue de onde parou.";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSending) return;

    const text = $input.value.trim();
    if (!text) return;

    isSending = true;
    setSendingState(true);
    syncWelcomeVisibility(true);

    renderMessage("user", text);
    history.push({ role: "user", content: text });
    saveHistory();

    $input.value = "";
    autosizeTextarea();
    updateInputMeta();
    $composerState.textContent = "Pergunta enviada. Preparando resposta…";

    showTyping(true);

    try {
      const reply = await sendToAPI(text);
      showTyping(false);
      renderMessage("assistant", reply.text, { meta: reply.meta });
      history.push({ role: "assistant", content: reply.text });
      saveHistory();
      setStatus("online", "online");
      $composerState.textContent = "Resposta concluída. Você pode aprofundar ou fazer uma nova pergunta.";
    } catch (error) {
      showTyping(false);
      renderMessage(
        "assistant",
        `Desculpe, tive um problema para responder agora.${error?.message ? ` (${error.message})` : ""} Tente novamente em instantes.`
      );
      setStatus("offline", "offline");
      $composerState.textContent = "Falha temporária. Ajuste a pergunta ou tente novamente.";
    } finally {
      isSending = false;
      setSendingState(false);
      updateInputMeta();
      $input.focus();
    }
  }

  async function sendToAPI(message) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: history.slice(-21, -1)
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Erro ${res.status}`);
    }

    return {
      text: data.reply || "Não recebi conteúdo da API.",
      meta: data.meta || null
    };
  }

  function renderMessage(role, content, options = {}) {
    const { animate = true, meta = null } = options;
    const $message = document.createElement("article");
    const $avatar = document.createElement("div");
    const $bubble = document.createElement("div");
    const $meta = document.createElement("div");

    $message.className = `message ${role}`;
    if (!animate) {
      $message.style.animation = "none";
    }

    $avatar.className = "message-avatar";
    $avatar.textContent = role === "user" ? "Você" : "SC+";

    $bubble.className = "message-bubble";
    $meta.className = "message-meta";
    $meta.textContent = `${role === "user" ? "Pergunta" : "Assistente"} · ${formatTime(new Date())}`;

    if (role === "assistant") {
      $bubble.innerHTML = `<div class="message-meta">${$meta.textContent}</div>${renderMarkdown(content)}`;

      if (meta && meta.usedLiveData) {
        const $source = document.createElement("div");
        const urlLabel = meta.liveDataUrl
          ? meta.liveDataUrl.replace("https://www.scmaisinovacao.scti.sc.gov.br", "") || "site oficial"
          : "site oficial";

        $source.className = "live-source";
        $source.textContent = `dados validados em tempo real · ${urlLabel}`;
        $bubble.appendChild($source);
      }
    } else {
      $bubble.innerHTML = `<div class="message-meta">${$meta.textContent}</div><p>${escapeHTML(content)}</p>`;
    }

    $message.appendChild($avatar);
    $message.appendChild($bubble);
    $scroll.appendChild($message);
    scrollToBottom();
  }

  function renderMarkdown(text) {
    const html = escapeHTML(text);
    const lines = html.split("\n");
    const out = [];
    let listType = null;

    const closeList = () => {
      if (listType) {
        out.push(`</${listType}>`);
        listType = null;
      }
    };

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();

      if (!line.trim()) {
        closeList();
        continue;
      }

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

      if (/^&gt;\s+/.test(line)) {
        closeList();
        out.push(`<blockquote>${formatInline(line.replace(/^&gt;\s+/, ""))}</blockquote>`);
        continue;
      }

      if (/^[-*]\s+/.test(line)) {
        if (listType !== "ul") {
          closeList();
          listType = "ul";
          out.push("<ul>");
        }
        out.push(`<li>${formatInline(line.replace(/^[-*]\s+/, ""))}</li>`);
        continue;
      }

      if (/^\d+\.\s+/.test(line)) {
        if (listType !== "ol") {
          closeList();
          listType = "ol";
          out.push("<ol>");
        }
        out.push(`<li>${formatInline(line.replace(/^\d+\.\s+/, ""))}</li>`);
        continue;
      }

      closeList();
      out.push(`<p>${formatInline(line)}</p>`);
    }

    closeList();
    return out.join("\n");
  }

  function formatInline(text) {
    return text
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/(^|\s)(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>')
      .replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*([^*]|$)/g, "$1<em>$2</em>$3")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function showTyping(show) {
    clearTypingCycle();

    if (!show) {
      $typing.hidden = true;
      return;
    }

    let phaseIndex = 0;
    $typing.hidden = false;
    updateTypingPhase(PHASES[phaseIndex]);

    typingInterval = window.setInterval(() => {
      phaseIndex = (phaseIndex + 1) % PHASES.length;
      updateTypingPhase(PHASES[phaseIndex]);
    }, 1400);
  }

  function updateTypingPhase(phase) {
    $typingTitle.textContent = phase.title;
    $typingText.textContent = phase.text;
  }

  function clearTypingCycle() {
    if (typingInterval) {
      clearInterval(typingInterval);
      typingInterval = null;
    }
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      $scroll.scrollTop = $scroll.scrollHeight;
    });
  }

  function autosizeTextarea() {
    $input.style.height = "auto";
    $input.style.height = `${Math.min($input.scrollHeight, 180)}px`;
  }

  function updateInputMeta() {
    $inputMeta.textContent = `${$input.value.length} / ${$input.maxLength}`;
  }

  function syncComposerState() {
    if (isSending) return;

    const length = $input.value.trim().length;

    if (!length) {
      $composerState.textContent = history.length
        ? "Continue a conversa com uma nova pergunta objetiva."
        : "Pronto para responder com base nas informações do programa.";
      return;
    }

    $composerState.textContent = length < 50
      ? "Dica: inclua sua região, iniciativa ou período para ganhar precisão."
      : "Pergunta detalhada detectada. A resposta tende a vir mais contextualizada.";
  }

  function setSendingState(sending) {
    $sendBtn.disabled = sending;
    $input.disabled = sending;

    if (sending) {
      $statusText.textContent = "respondendo…";
      return;
    }

    $input.disabled = false;
    syncComposerState();
  }

  function setStatus(state, label) {
    $statusPill.classList.remove("online", "offline");
    if (state) $statusPill.classList.add(state);
    $statusText.textContent = label;
  }

  function syncWelcomeVisibility(forceHide = false) {
    const shouldHide = forceHide || history.length > 0;
    if (!$welcome) return;
    $welcome.classList.toggle("is-hidden", shouldHide);
  }

  function fillAndSubmit(prompt) {
    $input.value = prompt;
    autosizeTextarea();
    updateInputMeta();
    syncComposerState();
    $input.focus();
    $form.requestSubmit();
  }

  function clearConversation() {
    history = [];
    saveHistory();
    clearTypingCycle();
    $typing.hidden = true;
    $scroll.innerHTML = "";
    syncWelcomeVisibility(false);
    $input.value = "";
    autosizeTextarea();
    updateInputMeta();
    $composerState.textContent = "Nova conversa iniciada. Escolha um atalho ou faça sua pergunta.";
    $input.focus();
  }

  async function checkHealth() {
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      if (!response.ok) throw new Error("offline");
      setStatus("online", "online");
    } catch {
      setStatus("offline", "offline");
    }
  }

  function saveHistory() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-30)));
    } catch {
      /* ignore storage failures */
    }
  }

  function loadHistory() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed.filter((item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string"
      );
    } catch {
      return [];
    }
  }

  function formatTime(date) {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }
})();
