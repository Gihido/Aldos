window.ChatModule = (() => {
  const MAX_LEN = 220;
  let lastMessageAt = 0;
  let currentChannel = 'global';

  async function sendChatMessage(channel, text) {
    const p = PlayerModule.getPlayer();
    if (!p) return;
    if (Date.now() < (p.muteUntil || 0)) return UIManager.showToast('Вы в муте.', 'error');

    const clean = String(text || '').trim();
    if (!clean) return;
    if (clean.length > MAX_LEN) return UIManager.showToast('Слишком длинное сообщение.', 'warning');
    if (Date.now() - lastMessageAt < 2000) return UIManager.showToast('Антиспам: 2 сек.', 'warning');

    await ServerAPI.push(channelPath(channel), {
      playerId: OnlineModule.getCurrentUserId(),
      nickname: p.nickname,
      text: clean,
      type: 'player',
      createdAt: Date.now()
    });

    lastMessageAt = Date.now();
  }

  function channelPath(channel) {
    const locId = PlayerModule.getPlayer()?.locationId;
    if (channel === 'location') return `chat/locations/${locId}/messages`;
    if (channel === 'clan') return `chat/clan/${PlayerModule.getPlayer()?.clanId}/messages`;
    if (channel === 'system') return 'chat/system/messages';
    return 'chat/global/messages';
  }

  function listenChat(channel) {
    currentChannel = channel;
    UIManager.safeSetText('chatChannelTitle', channel === 'location' ? 'Чат локации' : channel === 'clan' ? 'Чат клана' : 'Общий чат');

    return ServerAPI.listen(channelPath(channel), (messages) => renderMessages(Array.isArray(messages) ? messages : []));
  }

  function renderMessages(messages) {
    const box = UIManager.qs('chatMessages');
    if (!box) return;
    box.innerHTML = '';

    messages.slice(-70).forEach((m) => {
      const row = document.createElement('div');
      row.className = 'chat-row';
      const time = new Date(m.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      row.innerHTML = `<header><strong>${m.nickname}</strong><small>${time}</small></header><p>${escape(m.text)}</p>`;
      box.append(row);
    });
    box.scrollTop = box.scrollHeight;
  }

  async function sendPrivateMessage(playerName, text) {
    const p = PlayerModule.getPlayer();
    const online = Object.values((await ServerAPI.get('playersOnline', {})) || {});
    const target = online.find((x) => x.nickname.toLowerCase() === String(playerName || '').toLowerCase());
    if (!target) return UIManager.showToast('Игрок не найден.', 'warning');

    await ServerAPI.push(`chat/private/${target.userId}/messages`, {
      from: p.nickname,
      text: String(text || '').trim().slice(0, MAX_LEN),
      createdAt: Date.now()
    });
  }

  async function clearChat(channel) {
    await ServerAPI.set(channelPath(channel), []);
  }

  function mutePlayer(playerId, ms = 10 * 60 * 1000) {
    const p = PlayerModule.getPlayer();
    if (playerId === OnlineModule.getCurrentUserId()) {
      p.muteUntil = Date.now() + ms;
      PlayerModule.autosave();
    }
  }

  function unmutePlayer(playerId) {
    const p = PlayerModule.getPlayer();
    if (playerId === OnlineModule.getCurrentUserId()) {
      p.muteUntil = 0;
      PlayerModule.autosave();
    }
  }

  function bind() {
    UIManager.qs('sendChatBtn')?.addEventListener('click', () => sendChatMessage(currentChannel, UIManager.qs('chatInput').value).then(() => {
      UIManager.qs('chatInput').value = '';
    }));

    document.querySelectorAll('[data-chat-channel]').forEach((btn) => {
      btn.addEventListener('click', () => listenChat(btn.dataset.chatChannel));
    });

    UIManager.qs('chatInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        sendChatMessage(currentChannel, UIManager.qs('chatInput').value);
        UIManager.qs('chatInput').value = '';
      }
    });
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  return { sendChatMessage, listenChat, sendPrivateMessage, clearChat, mutePlayer, unmutePlayer, bind };
})();
