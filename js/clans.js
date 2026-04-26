window.ClansModule = (() => {
  const roles = ['Участник', 'Офицер', 'Заместитель', 'Лидер'];

  async function createClan(name, tag, description) {
    const p = PlayerModule.getPlayer();
    if (!p) return;
    if (!name?.trim()) return UIManager.showToast('Введите название клана.', 'warning');

    const clanId = await ServerAPI.push('clans', {
      name: name.trim(),
      tag: (tag || 'TAG').trim().slice(0, 5).toUpperCase(),
      description: (description || '').trim(),
      ownerId: OnlineModule.getCurrentUserId(),
      members: {
        [OnlineModule.getCurrentUserId()]: { role: 'Лидер', nickname: p.nickname }
      },
      level: 1,
      exp: 0,
      createdAt: Date.now()
    });

    p.clanId = clanId;
    p.clanRole = 'Лидер';
    PlayerModule.autosave();
    UIManager.showToast('Клан создан.', 'success');
    renderClanScreen();
  }

  async function invitePlayerToClan(playerName) {
    const p = PlayerModule.getPlayer();
    if (!p?.clanId) return UIManager.showToast('Вы не в клане.', 'warning');
    if (!['Лидер', 'Заместитель', 'Офицер'].includes(p.clanRole)) return UIManager.showToast('Недостаточно прав.', 'error');

    const online = Object.values((await ServerAPI.get('playersOnline', {})) || {});
    const target = online.find((u) => u.nickname.toLowerCase() === String(playerName || '').toLowerCase());
    if (!target) return UIManager.showToast('Игрок не найден онлайн.', 'error');
    if (target.userId === OnlineModule.getCurrentUserId()) return UIManager.showToast('Нельзя пригласить себя.', 'warning');

    await ServerAPI.push('clanInvites', {
      clanId: p.clanId,
      fromId: OnlineModule.getCurrentUserId(),
      toId: target.userId,
      status: 'pending',
      createdAt: Date.now()
    });

    UIManager.showToast('Приглашение в клан отправлено.', 'success');
  }

  async function acceptClanInvite(inviteId) {
    const invites = (await ServerAPI.get('clanInvites', [])) || [];
    const inv = invites.find((x) => x.id === inviteId);
    if (!inv) return;

    const clans = (await ServerAPI.get('clans', [])) || [];
    const clan = clans.find((x) => x.id === inv.clanId);
    if (!clan) return;

    const p = PlayerModule.getPlayer();
    clan.members[OnlineModule.getCurrentUserId()] = { role: 'Участник', nickname: p.nickname };
    p.clanId = clan.id;
    p.clanRole = 'Участник';
    inv.status = 'accepted';

    await ServerAPI.set('clans', clans);
    await ServerAPI.set('clanInvites', invites);
    PlayerModule.autosave();
    renderClanScreen();
  }

  async function declineClanInvite(inviteId) {
    const invites = (await ServerAPI.get('clanInvites', [])) || [];
    const inv = invites.find((x) => x.id === inviteId);
    if (!inv) return;
    inv.status = 'declined';
    await ServerAPI.set('clanInvites', invites);
  }

  async function leaveClan() {
    const p = PlayerModule.getPlayer();
    if (!p?.clanId) return;
    const clans = (await ServerAPI.get('clans', [])) || [];
    const clan = clans.find((x) => x.id === p.clanId);
    if (!clan) return;

    delete clan.members[OnlineModule.getCurrentUserId()];
    p.clanId = null;
    p.clanRole = null;
    await ServerAPI.set('clans', clans);
    PlayerModule.autosave();
    renderClanScreen();
  }

  async function kickClanMember(playerId) {
    await changeMemberRole(playerId, null, true);
  }

  async function promoteClanMember(playerId) {
    await changeRoleStep(playerId, +1);
  }

  async function demoteClanMember(playerId) {
    await changeRoleStep(playerId, -1);
  }

  async function changeRoleStep(playerId, delta) {
    const p = PlayerModule.getPlayer();
    const clans = (await ServerAPI.get('clans', [])) || [];
    const clan = clans.find((x) => x.id === p?.clanId);
    if (!clan || p.clanRole !== 'Лидер') return;

    const member = clan.members[playerId];
    if (!member || member.role === 'Лидер') return;
    const idx = Math.max(0, Math.min(roles.length - 1, roles.indexOf(member.role) + delta));
    member.role = roles[idx];

    await ServerAPI.set('clans', clans);
    renderClanScreen();
  }

  async function changeMemberRole(playerId, role, remove = false) {
    const p = PlayerModule.getPlayer();
    const clans = (await ServerAPI.get('clans', [])) || [];
    const clan = clans.find((x) => x.id === p?.clanId);
    if (!clan || p.clanRole !== 'Лидер') return;
    if (remove) delete clan.members[playerId];
    else clan.members[playerId].role = role;
    await ServerAPI.set('clans', clans);
    renderClanScreen();
  }

  async function sendClanChatMessage() {
    const p = PlayerModule.getPlayer();
    if (!p?.clanId) return;
    const input = UIManager.qs('clanChatInput');
    const text = String(input?.value || '').trim().slice(0, 180);
    if (!text) return;

    await ServerAPI.push(`chat/clan/${p.clanId}/messages`, {
      nickname: p.nickname,
      text,
      createdAt: Date.now()
    });
    input.value = '';
    renderClanScreen();
  }

  async function renderClanScreen() {
    const p = PlayerModule.getPlayer();
    const root = UIManager.qs('clanBox');
    if (!root) return;

    if (!p?.clanId) {
      root.innerHTML = '<p>Вы не состоите в клане.</p>';
      return;
    }

    const clans = (await ServerAPI.get('clans', [])) || [];
    const clan = clans.find((x) => x.id === p.clanId);
    if (!clan) {
      root.innerHTML = '<p>Клан не найден.</p>';
      return;
    }

    const members = Object.entries(clan.members || {});
    root.innerHTML = `
      <h4>[${clan.tag}] ${clan.name}</h4>
      <p>${clan.description}</p>
      <p>Уровень клана: ${clan.level} • XP: ${clan.exp}</p>
      <div id="clanMembers"></div>
      <div class="chat-input-row"><input id="clanChatInput" placeholder="Сообщение клану" /><button id="sendClanChatBtn" class="btn gold">Отправить</button></div>
      <div id="clanChatBox" class="chat-box"></div>
    `;

    const membersBox = UIManager.qs('clanMembers');
    members.forEach(([id, m]) => {
      const row = document.createElement('div');
      row.className = 'list-row';
      row.innerHTML = `<span>${m.nickname} — ${m.role}</span>`;
      if (p.clanRole === 'Лидер' && id !== OnlineModule.getCurrentUserId()) {
        row.append(UIManager.makeButton('↑', 'secondary', () => promoteClanMember(id)));
        row.append(UIManager.makeButton('↓', 'secondary', () => demoteClanMember(id)));
        row.append(UIManager.makeButton('Kick', 'danger', () => kickClanMember(id)));
      }
      membersBox.append(row);
    });

    const msgs = (await ServerAPI.get(`chat/clan/${p.clanId}/messages`, [])) || [];
    const chat = UIManager.qs('clanChatBox');
    msgs.slice(-30).forEach((m) => {
      const div = document.createElement('div');
      div.className = 'chat-row';
      div.innerHTML = `<header><strong>${m.nickname}</strong><small>${new Date(m.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</small></header><p>${m.text}</p>`;
      chat.append(div);
    });

    UIManager.qs('sendClanChatBtn')?.addEventListener('click', sendClanChatMessage);
  }

  return {
    createClan,
    invitePlayerToClan,
    acceptClanInvite,
    declineClanInvite,
    leaveClan,
    kickClanMember,
    promoteClanMember,
    demoteClanMember,
    renderClanScreen,
    sendClanChatMessage
  };
})();
