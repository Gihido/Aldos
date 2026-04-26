window.OnlineModule = (() => {
  let currentPlayers = [];

  function init() {
    const p = PlayerModule.getPlayer();
    if (!p) return;
    LocalServer.localServerInit(p.playerId);
    LocalServer.listenServerUpdate(() => {
      LocalServer.setPlayerOnline();
      currentPlayers = LocalServer.getOnlinePlayers();
      renderOnlineScreen();
    });
  }

  function renderOnlineScreen() {
    const box = UIManager.qs('onlineList');
    if (!box) return;
    box.innerHTML = '';

    if (!currentPlayers.length) {
      box.innerHTML = '<li>Онлайн-игроков нет.</li>';
      return;
    }

    currentPlayers.forEach((p) => {
      const row = document.createElement('li');
      row.className = 'list-item';
      row.innerHTML = `<div><strong>${p.nickname}</strong> • Lv.${p.level} • ${p.className} • ${p.locationId} • ${p.status}</div>`;

      if (p.playerId !== PlayerModule.getPlayer().playerId) {
        row.append(UIManager.makeButton('Добавить в друзья', 'secondary', () => FriendsModule.sendFriendRequestByCode(p.friendCode)));
        row.append(UIManager.makeButton('Пригласить в бой', 'secondary', () => CombatModule.invitePlayerToBattle(p.playerId)));
        row.append(UIManager.makeButton('Профиль', 'gold', () => openProfile(p)));
      }
      box.append(row);
    });
  }

  function openProfile(pl) {
    UIManager.showModal(
      `Профиль: ${pl.nickname}`,
      `<p>Класс: ${pl.className}</p><p>Уровень: ${pl.level}</p><p>Локация: ${pl.locationId}</p><p>Статус: ${pl.status}</p>`,
      [{ label: 'Закрыть', type: 'secondary', onClick: UIManager.closeModal }]
    );
  }

  function getOnlinePlayers() {
    currentPlayers = LocalServer.getOnlinePlayers();
    return currentPlayers;
  }

  return { init, getOnlinePlayers, renderOnlineScreen };
})();
