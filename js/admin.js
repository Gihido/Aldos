window.AdminModule = (() => {
  function canUseAdmin() {
    const p = PlayerModule.getPlayer();
    if (!window.FirebaseConfig?.ENABLE_ADMIN_PANEL || !p) return false;
    return p.role === 'admin' || window.FirebaseConfig.ADMIN_NAMES.includes(p.nickname);
  }

  async function logAdmin(action, payload = {}) {
    await ServerAPI.push('adminLogs', {
      admin: PlayerModule.getPlayer()?.nickname || 'unknown',
      action,
      payload,
      createdAt: Date.now()
    });
  }

  async function giveGold(targetPlayerId, amount) {
    const players = (await ServerAPI.get('players', {})) || {};
    if (!players[targetPlayerId]) return;
    players[targetPlayerId].gold = Math.max(0, (players[targetPlayerId].gold || 0) + Number(amount || 0));
    await ServerAPI.set('players', players);
    await logAdmin('giveGold', { targetPlayerId, amount });
  }

  async function giveExp(targetPlayerId, amount) {
    const players = (await ServerAPI.get('players', {})) || {};
    if (!players[targetPlayerId]) return;
    players[targetPlayerId].exp = Math.max(0, (players[targetPlayerId].exp || 0) + Number(amount || 0));
    await ServerAPI.set('players', players);
    await logAdmin('giveExp', { targetPlayerId, amount });
  }

  async function giveItem(targetPlayerId, itemId) {
    const players = (await ServerAPI.get('players', {})) || {};
    if (!players[targetPlayerId] || !GameData.ITEMS[itemId]) return;
    players[targetPlayerId].inventory = players[targetPlayerId].inventory || [];
    players[targetPlayerId].inventory.push(itemId);
    await ServerAPI.set('players', players);
    await logAdmin('giveItem', { targetPlayerId, itemId });
  }

  async function teleportPlayer(targetPlayerId, locationId) {
    const players = (await ServerAPI.get('players', {})) || {};
    if (!players[targetPlayerId]) return;
    players[targetPlayerId].locationId = locationId;
    await ServerAPI.set('players', players);
    await logAdmin('teleportPlayer', { targetPlayerId, locationId });
  }

  async function setPlayerLevel(targetPlayerId, level) {
    const players = (await ServerAPI.get('players', {})) || {};
    if (!players[targetPlayerId]) return;
    players[targetPlayerId].level = Math.max(1, Number(level) || 1);
    await ServerAPI.set('players', players);
    await logAdmin('setPlayerLevel', { targetPlayerId, level });
  }

  async function banPlayer(targetPlayerId) { await logAdmin('banPlayer', { targetPlayerId }); }
  async function unmutePlayer(targetPlayerId) { await logAdmin('unmutePlayer', { targetPlayerId }); ChatModule.unmutePlayer(targetPlayerId); }
  async function clearChat(channel) { await logAdmin('clearChat', { channel }); ChatModule.clearChat(channel); }
  async function createGlobalAnnouncement(text) { await logAdmin('createGlobalAnnouncement', { text }); OnlineModule.sendServerEvent({ type: 'announcement', text }); }
  async function toggleEvent(name, enabled) { await logAdmin('toggleEvent', { name, enabled }); ServerAPI.set(`events/${name}`, { enabled, updatedAt: Date.now() }); }

  async function viewOnlinePlayers() {
    const players = await ServerAPI.get('playersOnline', {});
    return Object.values(players || {});
  }

  async function viewAdminLogs() {
    const logs = await ServerAPI.get('adminLogs', []);
    return Array.isArray(logs) ? logs.slice(-100).reverse() : [];
  }

  async function renderAdminPanel() {
    const box = UIManager.qs('adminBox');
    if (!box) return;

    if (!canUseAdmin()) {
      box.innerHTML = '<p>Доступ запрещён.</p>';
      return;
    }

    const online = await viewOnlinePlayers();
    const logs = await viewAdminLogs();

    box.innerHTML = `
      <h4>Админ-панель</h4>
      <p>Онлайн: ${online.length}</p>
      <div id="adminActions" class="row wrap"></div>
      <div id="adminLogs" class="list-box"></div>
    `;

    const actions = UIManager.qs('adminActions');
    actions.append(UIManager.makeButton('+1000 золота себе', 'gold', async () => {
      await giveGold(OnlineModule.getCurrentUserId(), 1000);
      PlayerModule.changeGold(1000);
      UIManager.showToast('Выдано золото.', 'success');
    }));
    actions.append(UIManager.makeButton('Очистить общий чат', 'secondary', () => clearChat('global')));

    const logsBox = UIManager.qs('adminLogs');
    logs.forEach((l) => {
      const li = document.createElement('li');
      li.textContent = `${new Date(l.createdAt).toLocaleTimeString('ru-RU')} • ${l.action}`;
      logsBox.append(li);
    });
  }

  return {
    canUseAdmin,
    giveGold,
    giveExp,
    giveItem,
    teleportPlayer,
    setPlayerLevel,
    banPlayer,
    unmutePlayer,
    clearChat,
    createGlobalAnnouncement,
    toggleEvent,
    viewOnlinePlayers,
    viewAdminLogs,
    renderAdminPanel
  };
})();
