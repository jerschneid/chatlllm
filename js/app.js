(function () {
  "use strict";

  var ASSISTANT_REPLY = "Damn, that's crazy.";
  var TYPE_DELAY_MS = 42;
  var TYPE_DELAY_REDUCED_MS = 0;

  var sidebar = document.getElementById("sidebar");
  var btnToggle = document.getElementById("btn-sidebar-toggle");
  var btnNewChat = document.getElementById("btn-new-chat");
  var emptyState = document.getElementById("empty-state");
  var chatPanel = document.getElementById("chat-panel");
  var messagesEl = document.getElementById("messages");
  var composerEmpty = document.getElementById("composer-empty");
  var composerDock = document.getElementById("composer-dock");
  var inputEmpty = document.getElementById("input-empty");
  var inputDock = document.getElementById("input-dock");

  var typingTimer = null;
  var isTyping = false;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function charDelay() {
    return prefersReducedMotion() ? TYPE_DELAY_REDUCED_MS : TYPE_DELAY_MS;
  }

  function clearTyping() {
    if (typingTimer !== null) {
      clearTimeout(typingTimer);
      typingTimer = null;
    }
    isTyping = false;
    setComposersDisabled(false);
  }

  function setComposersDisabled(disabled) {
    [composerEmpty, composerDock].forEach(function (form) {
      form.querySelector(".composer__send").disabled = disabled;
      form.querySelector(".composer__input").readOnly = disabled;
    });
  }

  function scrollMessagesToEnd() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendUserMessage(text) {
    var row = document.createElement("div");
    row.className = "message-row message-row--user";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "You");
    var bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = text;
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    scrollMessagesToEnd();
  }

  function appendAssistantShell() {
    var row = document.createElement("div");
    row.className = "message-row message-row--assistant";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "ChatLLLM");
    var bubble = document.createElement("div");
    bubble.className = "message-bubble";
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    scrollMessagesToEnd();
    return bubble;
  }

  function typeAssistantReply(bubble, fullText, index) {
    if (index >= fullText.length) {
      clearTyping();
      inputDock.focus();
      return;
    }
    bubble.textContent = fullText.slice(0, index + 1);
    scrollMessagesToEnd();
    var delay = charDelay();
    if (delay <= 0) {
      bubble.textContent = fullText;
      clearTyping();
      inputDock.focus();
      return;
    }
    typingTimer = setTimeout(function () {
      typingTimer = null;
      typeAssistantReply(bubble, fullText, index + 1);
    }, delay);
  }

  function showChatLayout() {
    emptyState.classList.add("hidden");
    chatPanel.classList.remove("hidden");
  }

  function showEmptyLayout() {
    chatPanel.classList.add("hidden");
    emptyState.classList.remove("hidden");
    messagesEl.innerHTML = "";
    inputEmpty.value = "";
    inputDock.value = "";
    inputEmpty.style.height = "";
    inputDock.style.height = "";
    inputEmpty.focus();
  }

  function activeInput() {
    return chatPanel.classList.contains("hidden") ? inputEmpty : inputDock;
  }

  function submitMessage(ev) {
    ev.preventDefault();
    if (isTyping) return;

    var input = activeInput();
    var text = input.value.replace(/\r/g, "").trim();
    if (!text) return;

    clearTyping();
    showChatLayout();

    appendUserMessage(text);
    input.value = "";
    if (input === inputEmpty) inputDock.value = "";
    else inputEmpty.value = "";

    isTyping = true;
    setComposersDisabled(true);

    var bubble = appendAssistantShell();
    typeAssistantReply(bubble, ASSISTANT_REPLY, 0);
  }

  function onNewChat() {
    clearTyping();
    showEmptyLayout();
  }

  function onSidebarToggle() {
    var collapsed = sidebar.classList.toggle("collapsed");
    btnToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    btnToggle.setAttribute("aria-label", collapsed ? "Open sidebar" : "Close sidebar");
  }

  function bindComposer(form) {
    var input = form.querySelector(".composer__input");
    form.addEventListener("submit", submitMessage);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!isTyping) form.requestSubmit();
      }
    });
    input.addEventListener("input", function () {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 200) + "px";
    });
  }

  bindComposer(composerEmpty);
  bindComposer(composerDock);

  btnNewChat.addEventListener("click", onNewChat);
  btnToggle.addEventListener("click", onSidebarToggle);

  inputEmpty.focus();
})();
