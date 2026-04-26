window.ClansModule = (() => {
  function createClan() {
    const p = PlayerModule.getPlayer();
    const name = UIManager.qs('clanCreateName').value.trim();
    const tag = UIManager.qs('clanCreateTag').value.trim().toUpperCase();
    const desc = UIManager.qs('clanCreateDesc').value.trim();
    if (!name) return UIManager.showToast('Введите название клана.', 'warning');
    if (p.clanId) return UIManager.showToast('Вы уже в клане.', 'warning');

    const state = LocalServer.getState();
    const clanId = `clan_${Date.now()}`;
    state.clanData.clans.push({ clanId, name, tag: tag || 'TAG', desc, leaderId: p.playerId, members: [p.playerId], messages: [] });
    p.clanId = clanId;
    PlayerModule.savePlayer();
    LocalServer.setState(state);
    renderClanScreen();
  }

  function inviteToClan(identifier) {
    const p = PlayerModule.getPlayer();
    if (!p.clanId) return UIManager.showToast('Сначала вступите в клан.', 'warning');

    const state = LocalServer.getState();
    const clan = state.clanData.clans.find((c) => c.clanId === p.clanId);
    if (!clan || clan.leaderId !== p.playerId) return UIManager.showToast('Приглашать может только лидер.', 'warning');

    const online = Object.values(state.playersOnline);
    const target = online.find((x) => x.nickname.toLowerCase() === identifier.toLowerCase() || x.friendCode.toLowerCase() === identifier.toLowerCase());
    if (!target) return UIManager.showToast('Игрок не найден.', 'warning');

    state.clanData.invites.push({ id: `ci_${Date.now()}`, clanId: clan.clanId, fromId: p.playerId, toId: target.playerId, status: 'pending' });
    LocalServer.setState(state);
    UIManager.showToast('Клановое приглашение отправлено.', 'success');
  }

  function acceptClanInvite() {
    const p = PlayerModule.getPlayer();
    const state = LocalServer.getState();
    const invite = state.clanData.invites.find((i) => i.toId === p.playerId && i.status === 'pending');
    if (!invite) return UIManager.showToast('Нет приглашений.', 'info');

    const clan = state.clanData.clans.find((c) => c.clanId === invite.clanId);
    if (!clan) return;
    clan.members.push(p.playerId);
    p.clanId = clan.clanId;
    invite.status = 'accepted';
    PlayerModule.savePlayer();
    LocalServer.setState(state);
    renderClanScreen();
  }

  function leaveClan() {
    const p = PlayerModule.getPlayer();
    if (!p.clanId) return;
    const state = LocalServer.getState();
    const clan = state.clanData.clans.find((c) => c.clanId === p.clanId);
    if (!clan) return;

    clan.members = clan.members.filter((id) => id !== p.playerId);
    if (!clan.members.length) state.clanData.clans = state.clanData.clans.filter((c) => c.clanId !== clan.clanId);
    else if (clan.leaderId === p.playerId) clan.leaderId = clan.members[0];

    p.clanId = null;
    PlayerModule.savePlayer();
    LocalServer.setState(state);
    renderClanScreen();
  }

  function sendClanMessage() {
    const p = PlayerModule.getPlayer();
    if (!p.clanId) return;
    const text = UIManager.qs('clanMessageInput').value.trim();
    if (!text) return;

    const state = LocalServer.getState();
    const clan = state.clanData.clans.find((c) => c.clanId === p.clanId);
    if (!clan) return;
    clan.messages.push({ from: p.name, text: text.slice(0, 200), time: Date.now() });
    LocalServer.setState(state);
    UIManager.qs('clanMessageInput').value = '';
    renderClanScreen();
  }

  function renderClanScreen() {
    const p = PlayerModule.getPlayer();
    const root = UIManager.qs('clanRoot');
    const state = LocalServer.getState();
    root.innerHTML = '';

    if (!p.clanId) {
      root.innerHTML = '<p>Вы не состоите в клане.</p>';
      const pending = state.clanData.invites.some((i) => i.toId === p.playerId && i.status === 'pending');
      UIManager.qs('acceptClanInviteBtn').classList.toggle('hidden', !pending);
      return;
    }

    const clan = state.clanData.clans.find((c) => c.clanId === p.clanId);
    if (!clan) return;

    root.innerHTML = `<h4>[${clan.tag}] ${clan.name}</h4><p>${clan.desc}</p><p>Лидер: ${clan.leaderId}</p><h5>Участники</h5><ul id="clanMembersList" class="list-box"></ul><h5>Клановый чат</h5><div id="clanMessages" class="chat-box"></div>`;

    const members = UIManager.qs('clanMembersList');
    clan.members.forEach((id) => {
      const online = OnlineModule.getOnlinePlayers().find((x) => x.playerId === id);
      const li = document.createElement('li');
      li.textContent = `${online?.nickname || id} ${id === clan.leaderId ? '(Лидер)' : '(Участник)'}`;
      members.append(li);
    });

    const msgBox = UIManager.qs('clanMessages');
    clan.messages.slice(-40).forEach((m) => {
      const row = document.createElement('div');
      row.className = 'chat-bubble left';
      row.innerHTML = `<header><strong>${m.from}</strong><small>${new Date(m.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</small></header><p>${m.text}</p>`;
      msgBox.append(row);
    });
  }

  return { createClan, inviteToClan, acceptClanInvite, leaveClan, renderClanScreen, sendClanMessage };
})();
