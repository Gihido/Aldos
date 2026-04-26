window.ChatModule = (() => {
  const KEY = 'sok_chat_messages';
  let currentChannel = 'global';
  let lastSentAt = 0;

  const getMessages = () => JSON.parse(localStorage.getItem(KEY) || '[]');
  const saveMessages = (messages) => localStorage.setItem(KEY, JSON.stringify(messages.slice(-200)));

  function sendMessage() {
    const now = Date.now();
    if (now - lastSentAt < 2000) {
      MainUI.notify('Антиспам: отправка раз в 2 секунды.', 'warn');
      return;
    }
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    const p = PlayerModule.getPlayer();
    const msg = {
      id: crypto.randomUUID(),
      channel: currentChannel,
      locationId: p.locationId,
      nickname: p.nickname,
      text,
      ts: now
    };

    if (FirebaseConfig.USE_FIREBASE) {
      // TODO: отправка в Firebase Realtime Database/Firestore.
    } else {
      const messages = getMessages();
      messages.push(msg);
      saveMessages(messages);
    }

    lastSentAt = now;
    input.value = '';
    render();
  }

  function render() {
    const p = PlayerModule.getPlayer();
    const root = document.getElementById('chatMessages');
    root.innerHTML = '';

    let messages = getMessages();
    messages = messages.filter((m) => currentChannel === 'global' ? m.channel === 'global' : m.locationId === p.locationId);

    messages.slice(-40).forEach((m) => {
      const div = document.createElement('div');
      div.className = 'chat-message';
      const time = new Date(m.ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      div.innerHTML = `<strong>${m.nickname}</strong> <small>${time}</small><p>${escapeHtml(m.text)}</p>`;
      root.appendChild(div);
    });
    root.scrollTop = root.scrollHeight;
  }

  function setChannel(channel) {
    currentChannel = channel;
    document.getElementById('chatChannelLabel').textContent = channel === 'global' ? 'Общий чат' : 'Чат локации';
    render();
  }

  function open() {
    document.getElementById('chatModal').classList.add('show');
    render();
  }

  function close() {
    document.getElementById('chatModal').classList.remove('show');
  }

  function bind() {
    document.getElementById('btnSendChat').addEventListener('click', sendMessage);
    document.getElementById('closeChatModal').addEventListener('click', close);
    document.getElementById('btnGlobalChat').addEventListener('click', () => setChannel('global'));
    document.getElementById('btnLocationChat').addEventListener('click', () => setChannel('location'));
    window.addEventListener('storage', (e) => {
      if (e.key === KEY) render();
    });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  return { bind, open, render };
})();
