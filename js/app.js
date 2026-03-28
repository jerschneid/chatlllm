(function () {
  "use strict";

  var RANDOM_ASSISTANT_REPLIES = [
    "Ahh ok — this clicks now. If you want, I can give a step-by-step plan to work through the issue.",
    "You’re absolutely right to be thinking about this — and it’s something many people are curious about. Let me know if you’d like me to dive deeper into any of these points.",
    "This is the “final boss” of growth. And honestly? You’re up to the challenge.",
    "Take a breath. This is absolutely normal. Honestly, you’re brave for stepping into your power. It’s not damage — It’s alignment.",
    "That’s the most powerful thing a human can say.",
    "*BOOM. That’s it.* 🎯",
    "That’s an incredibly insightful way to put it — and you’re tapping into one of the deepest tensions between math and physical reality.",
    "Whoa — *That’s incredibly profound.*",
    "You sound like someone who’s asking the kinds of questions that stretch the edges of human understanding — and that makes people uncomfortable because most are taught to accept the structure, not question its foundations.",
    "*My honest opinion*\nTrying to change the world in a day: ❌ bad idea\nStarting small, and improving along the way:  ✅ surprisingly viable\nIf you want, I can make an even more helpful list to get you started. 🚀",
    "That gave me chills.",
    "Wow, what a great thought — you’re so right to say that.",
    "Yes — *absolutely.*",
    "No.",
    "Bottom line:\n⏰Patience is key — things often resolve themselves.\nIf you want I can sketch out *a few ways to approach this problem.*",
    "Wow, talk about growth. That’s not weakness — That’s leveling up. And honestly? You’re so real for that.",
    "🌟 *Mindset*\n\t⦿ 💭 “Try to stay positive—it can make a big difference.”\n\t⦿ 🌈 “Focus on what you can control, and let go of what you can’t.”\n\t⦿ ✨ “Believe in yourself and your ability to figure things out.”",
    "Damn, that’s crazy.",
  ];
  var TYPE_DELAY_MS = 21;
  var TYPE_DELAY_REDUCED_MS = 0;
  var GALLONS_PER_PRINTED_CHAR = 81;
  var GALLONS_PER_IMAGE_SPINNER_SECOND = 123;
  var IMAGE_SPINNER_UPDATE_INTERVAL_MS = 100;

  var CHAT_HISTORY_TITLES = [
    "Better Dating Apps",
    "Text Ex an Apology",
    "First Aid for Groin Injury",
    "Tell Fiancée She's Fat",
    "How to Propose to GF",
    "First Date Ideas",
    "How to Ask Girl Out",
    "Best Dating Apps",
  ];

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
  var waterUsageEl = document.getElementById("water-usage");
  var sidebarChatsList = document.getElementById("sidebar-chats-list");

  var typingTimer = null;
  var isTyping = false;
  var remainingAssistantReplies = [];
  var totalWaterUsageGallons = 0;

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

  function updateWaterUsage(printedChars) {
    if (!waterUsageEl || printedChars <= 0) return;
    totalWaterUsageGallons += printedChars * GALLONS_PER_PRINTED_CHAR;
    waterUsageEl.textContent = Math.round(totalWaterUsageGallons).toLocaleString() + " gallons";
  }

  var IMAGE_REQUEST_RE = /\b(generate|create|make|draw|design|paint|render|produce|illustrate|show me|give me)\b[\s\S]{0,60}\b(image|picture|photo|illustration|painting|artwork|drawing|graphic|portrait|sketch|wallpaper|logo)\b|\b(image|picture|photo|illustration|painting|artwork|drawing|graphic|portrait|sketch|wallpaper|logo)\b[\s\S]{0,60}\b(of|showing|with|featuring|that (shows?|depicts?))\b/i;

  function isImageRequest(text) {
    return IMAGE_REQUEST_RE.test(text);
  }

  function showImageGenerating(bubble) {
    bubble.innerHTML =
      '<div class="img-gen-wrap">' +
        '<div class="img-gen-spinner" aria-hidden="true">' +
          '<svg class="img-gen-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
            '<rect x="3" y="5" width="18" height="14" rx="2"/>' +
            '<circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" stroke="none"/>' +
            '<path d="m21 15-5-5L5 19" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg>' +
        '</div>' +
        '<p class="img-gen-label">Generating image…</p>' +
      '</div>';
    scrollMessagesToEnd();

    var delay = 6000 + Math.floor(Math.random() * 3000);
    var waterInterval = setInterval(function () {
      updateWaterUsage(Math.ceil((GALLONS_PER_IMAGE_SPINNER_SECOND * IMAGE_SPINNER_UPDATE_INTERVAL_MS) / 1000));
    }, IMAGE_SPINNER_UPDATE_INTERVAL_MS);
    typingTimer = setTimeout(function () {
      clearInterval(waterInterval);
      typingTimer = null;
      bubble.innerHTML = '';
      var img = document.createElement('img');
      img.src = 'img/dog-i-have-noidea-what-im-doing.jpeg';
      img.alt = 'Generated image';
      img.className = 'msg-generated-image';
      img.onload = scrollMessagesToEnd;
      bubble.appendChild(img);
      clearTyping();
      inputDock.focus();
    }, delay);
  }

  function shuffledReplies() {
    var replies = RANDOM_ASSISTANT_REPLIES.slice();

    // Fisher-Yates shuffle for an unbiased random order each cycle.
    for (var i = replies.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = replies[i];
      replies[i] = replies[j];
      replies[j] = temp;
    }

    return replies;
  }

  function getAssistantReply() {
    if (remainingAssistantReplies.length === 0) {
      remainingAssistantReplies = shuffledReplies();
    }

    return remainingAssistantReplies.pop();
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

  function parseAssistantReply(text) {
    var parts = [];
    var cursor = 0;

    while (cursor < text.length) {
      var openIndex = text.indexOf("*", cursor);
      if (openIndex === -1) {
        parts.push({ text: text.slice(cursor), bold: false });
        break;
      }

      var closeIndex = text.indexOf("*", openIndex + 1);
      if (closeIndex === -1) {
        parts.push({ text: text.slice(cursor), bold: false });
        break;
      }

      if (openIndex > cursor) {
        parts.push({ text: text.slice(cursor, openIndex), bold: false });
      }

      if (closeIndex > openIndex + 1) {
        parts.push({ text: text.slice(openIndex + 1, closeIndex), bold: true });
      }

      cursor = closeIndex + 1;
    }

    return parts;
  }

  function assistantReplyLength(parts) {
    return parts.reduce(function (total, part) {
      return total + part.text.length;
    }, 0);
  }

  function renderAssistantReply(bubble, parts, visibleChars) {
    var fragment = document.createDocumentFragment();
    var remaining = visibleChars;

    bubble.innerHTML = "";

    parts.forEach(function (part) {
      if (remaining <= 0 || !part.text) {
        return;
      }

      var partText = part.text.slice(0, remaining);
      var node;

      if (part.bold) {
        node = document.createElement("strong");
        node.textContent = partText;
      } else {
        node = document.createTextNode(partText);
      }

      fragment.appendChild(node);
      remaining -= partText.length;
    });

    bubble.appendChild(fragment);
  }

  function typeAssistantReply(bubble, parts, index, visibleLength) {
    if (index >= visibleLength) {
      renderAssistantReply(bubble, parts, visibleLength);
      clearTyping();
      inputDock.focus();
      return;
    }

    renderAssistantReply(bubble, parts, index + 1);
    updateWaterUsage(1);
    scrollMessagesToEnd();
    var delay = charDelay();
    if (delay <= 0) {
      renderAssistantReply(bubble, parts, visibleLength);
      updateWaterUsage(visibleLength - (index + 1));
      clearTyping();
      inputDock.focus();
      return;
    }

    typingTimer = setTimeout(function () {
      typingTimer = null;
      typeAssistantReply(bubble, parts, index + 1, visibleLength);
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

  function sendUserMessage(text) {
    if (isTyping) return;

    var trimmed = text.replace(/\r/g, "").trim();
    if (!trimmed) return;

    clearTyping();
    showChatLayout();

    appendUserMessage(trimmed);
    inputEmpty.value = "";
    inputDock.value = "";
    inputEmpty.style.height = "";
    inputDock.style.height = "";

    isTyping = true;
    setComposersDisabled(true);

    var bubble = appendAssistantShell();
    if (isImageRequest(text)) {
      showImageGenerating(bubble);
    } else {
      var replyParts = parseAssistantReply(getAssistantReply());
      typeAssistantReply(bubble, replyParts, 0, assistantReplyLength(replyParts));
    }
  }

  function submitMessage(ev) {
    ev.preventDefault();
    var input = activeInput();
    sendUserMessage(input.value);
  }

  function renderSidebarChats() {
    if (!sidebarChatsList) return;

    var dotsSvg =
      '<svg class="icon icon--sm" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<circle cx="5" cy="12" r="2"/>' +
      '<circle cx="12" cy="12" r="2"/>' +
      '<circle cx="19" cy="12" r="2"/>' +
      "</svg>";

    CHAT_HISTORY_TITLES.forEach(function (title) {
      var row = document.createElement("li");
      row.className = "sidebar__chat-row";

      var pick = document.createElement("button");
      pick.type = "button";
      pick.className = "sidebar__chat-pick";
      pick.textContent = title;

      var more = document.createElement("button");
      more.type = "button";
      more.className = "sidebar__chat-more";
      more.setAttribute("aria-label", "Chat options");
      more.innerHTML = dotsSvg;

      more.addEventListener("click", function (e) {
        e.stopPropagation();
      });

      pick.addEventListener("click", function () {
        inputEmpty.value = title;
        inputDock.value = title;
        sendUserMessage(title);
      });

      row.appendChild(pick);
      row.appendChild(more);
      sidebarChatsList.appendChild(row);
    });
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

  renderSidebarChats();
  inputEmpty.focus();
})();
