window.ChatModule = (() => {
  const KEY = 'sok_chat_v2';
  let channel = 'global';
  let lastSent = 0;

  function readMessages() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveMessages(messages) {
    localStorage.setItem(KEY, JSON.stringify(messages.slice(-300)));
  }

  function sendMessage() {
    const now = Date.now();
    if (now - lastSent < 2000) {
      UIManager.showToast('Антиспам: 1 сообщение в 2 секунды.', 'warning');
      return;
    }

    const input = UIManager.qs('chatInput');
    const text = String(input?.value || '').trim();
    if (!text) return;

    const player = PlayerModule.getPlayer();
    if (!player) return;

    const message = {
      id: crypto.randomUUID(),
      channel,
      locationId: player.locationId,
      nickname: player.nickname,
      text: text.slice(0, 220),
      ts: now
    };

    if (window.FirebaseConfig?.USE_FIREBASE) {
      // TODO: отправка в Firebase.
    } else {
      const all = readMessages();
      all.push(message);
      saveMessages(all);
    }

    lastSent = now;
    input.value = '';
    renderChat();
  }

  function setChannel(next) {
    channel = next;
    UIManager.safeSetText('chatChannelTitle', next === 'global' ? 'Общий чат' : 'Чат локации');
    document.querySelectorAll('[data-chat-channel]').forEach((btn) => btn.classList.toggle('active', btn.dataset.chatChannel === next));
    renderChat();
  }

  function renderChat() {
    const root = UIManager.qs('chatMessages');
    const player = PlayerModule.getPlayer();
    if (!root || !player) return;

    root.innerHTML = '';
    const all = readMessages();
    const list = all.filter((m) => channel === 'global' ? m.channel === 'global' : m.locationId === player.locationId);

    if (!list.length) {
      root.innerHTML = '<div class="chat-empty">Пока сообщений нет.</div>';
      return;
    }

    list.slice(-60).forEach((m) => {
      const row = document.createElement('div');
      row.className = 'chat-row';
      const time = new Date(m.ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      row.innerHTML = `<header><strong>${escape(m.nickname)}</strong><small>${time}</small></header><p>${escape(m.text)}</p>`;
      root.append(row);
    });

    root.scrollTop = root.scrollHeight;
  }

  function bind() {
    UIManager.qs('sendChatBtn')?.addEventListener('click', sendMessage);
    UIManager.qs('chatInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    document.querySelectorAll('[data-chat-channel]').forEach((btn) => {
      btn.addEventListener('click', () => setChannel(btn.dataset.chatChannel));
    });

    window.addEventListener('storage', (e) => {
      if (e.key === KEY) renderChat();
    });
  }

  function escape(str) {
    return String(str).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  return { bind, renderChat, setChannel };
})();
