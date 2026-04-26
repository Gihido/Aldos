window.MultiplayerModule = (() => {
  let onlinePlayers = [];
  let unsub = null;

  function listenOnline() {
    unsub?.();
    unsub = OnlineModule.listenGlobalOnlinePlayers((players) => {
      onlinePlayers = players;
      renderOnlineList();
    });
  }

  function getOnlinePlayers() {
    return onlinePlayers;
  }

  function renderOnlineList() {
    const list = UIManager.qs('onlinePlayersList');
    if (!list) return;
    list.innerHTML = '';

    if (!onlinePlayers.length) {
      list.innerHTML = '<li>Онлайн пуст.</li>';
      return;
    }

    onlinePlayers.forEach((p) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${p.nickname}</strong> • Lv.${p.level} • ${p.className} • ${p.locationId} • ${p.status}`;
      list.append(li);
    });
  }

  function updatePlayerLocation(locationId) {
    return OnlineModule.updatePlayerLocation(locationId);
  }

  return { listenOnline, getOnlinePlayers, renderOnlineList, updatePlayerLocation };
})();
