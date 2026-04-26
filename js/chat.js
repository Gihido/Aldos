window.ChatModule = (() => {
  let activeChannel = 'global';
  let lastSend = 0;

  function sendChatMessage(channel, text) {
    const p = PlayerModule.getPlayer();
    if (!p) return;
    const clean = String(text || '').trim();
    if (!clean) return;
    if (clean.length > 200) return UIManager.showToast('Сообщение слишком длинное.', 'warning');
    if (Date.now() - lastSend < 1500) return UIManager.showToast('Антиспам 1.5 сек.', 'warning');

    const state = LocalServer.getState();
    state.chatMessages[channel] = state.chatMessages[channel] || [];
    state.chatMessages[channel].push({
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      senderId: p.playerId,
      senderName: p.name,
      text: clean,
      time: Date.now(),
      type: 'player'
    });
    LocalServer.setState(state);
    lastSend = Date.now();
    clearLocalChatIfTooLarge();
  }

  function renderChat(channel = activeChannel) {
    activeChannel = channel;
    document.querySelectorAll('[data-chat-channel]').forEach((b) => b.classList.toggle('active', b.dataset.chatChannel === channel));

    const box = UIManager.qs('chatMessages');
    box.innerHTML = '';
    const me = PlayerModule.getPlayer();
    const state = LocalServer.getState();
    const messages = (state.chatMessages[channel] || []).slice(-120);

    messages.forEach((m) => {
      const bubble = document.createElement('div');
      const side = m.type === 'system' ? 'center' : (m.senderId === me.playerId ? 'right' : 'left');
      bubble.className = `chat-bubble ${side}`;
      const time = new Date(m.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      if (side === 'center') bubble.innerHTML = `<small>${m.text}</small>`;
      else bubble.innerHTML = `<header><strong>${m.senderName}</strong><small>${time}</small></header><p>${escape(m.text)}</p>`;
      box.append(bubble);
    });

    box.scrollTop = box.scrollHeight;
  }

  function listenChat() {
    LocalServer.listenServerUpdate(() => renderChat(activeChannel));
  }

  function clearLocalChatIfTooLarge() {
    const state = LocalServer.getState();
    ['global', 'location', 'friends', 'clan'].forEach((key) => {
      if ((state.chatMessages[key] || []).length > 350) {
        state.chatMessages[key] = state.chatMessages[key].slice(-250);
      }
    });
    LocalServer.setState(state);
  }

  function bind() {
    UIManager.qs('sendChatBtn').onclick = () => {
      sendChatMessage(activeChannel, UIManager.qs('chatInput').value);
      UIManager.qs('chatInput').value = '';
    };
    UIManager.qs('chatInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        sendChatMessage(activeChannel, UIManager.qs('chatInput').value);
        UIManager.qs('chatInput').value = '';
      }
    });

    document.querySelectorAll('[data-chat-channel]').forEach((b) => {
      b.onclick = () => renderChat(b.dataset.chatChannel);
    });
  }

  function escape(str) {
    return String(str).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  return { sendChatMessage, renderChat, listenChat, clearLocalChatIfTooLarge, bind };
})();
