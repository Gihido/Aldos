window.MultiplayerModule = (() => {
  const KEY = 'sok_online_v2';
  let cache = [];

  const npc = [
    { id: 'npc_1', nickname: 'Сэр Брум', className: 'Воин', level: 4, locationId: 'dark_forest', online: true },
    { id: 'npc_2', nickname: 'Лира Нокс', className: 'Маг', level: 6, locationId: 'king_ruins', online: true },
    { id: 'npc_3', nickname: 'Охотник Тар', className: 'Лучник', level: 3, locationId: 'abandoned_mine', online: true }
  ];

  function readRaw() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function saveRaw(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function updateOnlineStatus() {
    const p = PlayerModule.getPlayer();
    if (!p) return;

    const list = readRaw().filter((u) => u.id !== p.accountName);
    list.push({
      id: p.accountName,
      nickname: p.nickname,
      className: p.className,
      level: p.level,
      locationId: p.locationId,
      online: true,
      updatedAt: Date.now()
    });

    saveRaw(list);
    removeOfflinePlayer();
    refresh();
  }

  function updatePlayerLocation(locationId) {
    if (window.FirebaseConfig?.USE_FIREBASE) {
      // TODO: sync location in Firebase.
    }
    updateOnlineStatus();
  }

  function removeOfflinePlayer() {
    const now = Date.now();
    saveRaw(readRaw().filter((p) => now - (p.updatedAt || 0) < 70000));
  }

  function listenOnlinePlayers() {
    refresh();
    window.addEventListener('storage', (e) => {
      if (e.key === KEY) refresh();
    });
  }

  function refresh() {
    cache = [...readRaw(), ...(window.FirebaseConfig?.USE_FIREBASE ? [] : npc)];
    renderOnlineList();
    LocationsModule.renderPlayersInLocation();
  }

  function getOnlinePlayers() {
    return cache;
  }

  function renderOnlineList() {
    const root = UIManager.qs('onlinePlayersList');
    if (!root) return;
    root.innerHTML = '';

    if (!cache.length) {
      root.innerHTML = '<li>Онлайн-игроки не найдены.</li>';
      return;
    }

    cache.forEach((p) => {
      const loc = GameData.LOCATIONS.find((l) => l.id === p.locationId);
      const li = document.createElement('li');
      li.innerHTML = `<strong>${p.nickname}</strong> • Lv.${p.level} • ${p.className} • ${loc?.name || 'Неизвестно'} • <span class="status-dot"></span> Онлайн`;
      root.append(li);
    });
  }

  return {
    updateOnlineStatus,
    updatePlayerLocation,
    listenOnlinePlayers,
    removeOfflinePlayer,
    getOnlinePlayers,
    renderOnlineList
  };
})();
