window.FriendsModule = (() => {
  function sendFriendRequestByCode(code) {
    const me = PlayerModule.getPlayer();
    const state = LocalServer.getState();
    const target = Object.values(state.playersOnline).find((p) => p.friendCode === String(code || '').trim());

    if (!target) return UIManager.showToast('Код не найден онлайн.', 'warning');
    if (target.playerId === me.playerId) return UIManager.showToast('Нельзя добавить себя.', 'warning');
    if (me.friends.includes(target.playerId)) return UIManager.showToast('Уже в друзьях.', 'info');

    const requestId = `fr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    state.friendRequests.push({ requestId, fromId: me.playerId, fromName: me.name, toId: target.playerId, status: 'pending', createdAt: Date.now() });
    LocalServer.setState(state);
    UIManager.showToast('Заявка отправлена.', 'success');
  }

  function acceptFriendRequest(requestId) {
    const me = PlayerModule.getPlayer();
    const state = LocalServer.getState();
    const req = state.friendRequests.find((r) => r.requestId === requestId && r.toId === me.playerId && r.status === 'pending');
    if (!req) return;

    req.status = 'accepted';
    if (!me.friends.includes(req.fromId)) me.friends.push(req.fromId);

    const raw = JSON.parse(localStorage.getItem('sok_player_v4') || '{}');
    if (raw.playerId === req.fromId) {
      raw.friends = Array.isArray(raw.friends) ? raw.friends : [];
      if (!raw.friends.includes(me.playerId)) raw.friends.push(me.playerId);
      localStorage.setItem('sok_player_v4', JSON.stringify(raw));
    }

    PlayerModule.savePlayer();
    LocalServer.setState(state);
    renderFriendsScreen();
  }

  function declineFriendRequest(requestId) {
    const me = PlayerModule.getPlayer();
    const state = LocalServer.getState();
    const req = state.friendRequests.find((r) => r.requestId === requestId && r.toId === me.playerId);
    if (!req) return;
    req.status = 'declined';
    LocalServer.setState(state);
    renderFriendsScreen();
  }

  function removeFriend(friendId) {
    const me = PlayerModule.getPlayer();
    me.friends = me.friends.filter((id) => id !== friendId);
    PlayerModule.savePlayer();
    renderFriendsScreen();
  }

  function copyFriendCode() {
    const code = PlayerModule.getPlayer().friendCode;
    navigator.clipboard?.writeText(code);
    UIManager.showToast('Код друга скопирован.', 'success');
  }

  function renderFriendsScreen() {
    const me = PlayerModule.getPlayer();
    UIManager.qs('myFriendCode').textContent = me.friendCode;

    const state = LocalServer.getState();
    const incoming = state.friendRequests.filter((r) => r.toId === me.playerId && r.status === 'pending');
    const outgoing = state.friendRequests.filter((r) => r.fromId === me.playerId && r.status === 'pending');

    const incomingBox = UIManager.qs('incomingRequests');
    const outgoingBox = UIManager.qs('outgoingRequests');
    const friendsBox = UIManager.qs('friendsList');
    incomingBox.innerHTML = '';
    outgoingBox.innerHTML = '';
    friendsBox.innerHTML = '';

    incoming.forEach((r) => {
      const row = document.createElement('li');
      row.textContent = `${r.fromName} хочет добавить в друзья`;
      row.append(UIManager.makeButton('Принять', 'gold', () => acceptFriendRequest(r.requestId)));
      row.append(UIManager.makeButton('Отклонить', 'secondary', () => declineFriendRequest(r.requestId)));
      incomingBox.append(row);
    });

    outgoing.forEach((r) => {
      const row = document.createElement('li');
      row.textContent = `Ожидает: ${r.toId}`;
      outgoingBox.append(row);
    });

    me.friends.forEach((id) => {
      const online = OnlineModule.getOnlinePlayers().find((p) => p.playerId === id);
      const row = document.createElement('li');
      row.innerHTML = `<div><strong>${online?.nickname || id}</strong> • ${online ? 'онлайн' : 'офлайн'} • ${online?.locationId || '—'}</div>`;
      row.append(UIManager.makeButton('Написать', 'secondary', () => UIManager.setActiveTab('chat')));
      if (online) row.append(UIManager.makeButton('В бой', 'secondary', () => CombatModule.invitePlayerToBattle(id)));
      row.append(UIManager.makeButton('Удалить', 'danger', () => removeFriend(id)));
      friendsBox.append(row);
    });
  }

  return {
    sendFriendRequestByCode,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    renderFriendsScreen,
    copyFriendCode
  };
})();
