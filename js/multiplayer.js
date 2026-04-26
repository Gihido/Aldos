window.MultiplayerModule = (() => {
  const KEY = 'sok_online_players';
  let cache = [];

  const npcPlayers = [
    { id: 'npc_1', nickname: 'Сэр Брум', className: 'Воин', level: 4, locationId: 'dark_forest' },
    { id: 'npc_2', nickname: 'Лира Нокс', className: 'Маг', level: 6, locationId: 'king_ruins' },
    { id: 'npc_3', nickname: 'Охотник Тар', className: 'Лучник', level: 3, locationId: 'abandoned_mine' }
  ];

  function getRaw() {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  }

  function setRaw(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function updateOnlineStatus() {
    const p = PlayerModule.getPlayer();
    const all = getRaw().filter((x) => x.id !== p.accountName);
    all.push({
      id: p.accountName,
      nickname: p.nickname,
      className: p.className,
      level: p.level,
      locationId: p.locationId,
      updatedAt: Date.now()
    });
    setRaw(all);
    removeOfflinePlayer();
    refresh();
  }

  function updatePlayerLocation(locationId) {
    if (FirebaseConfig.USE_FIREBASE) {
      // TODO: обновление локации игрока в Firebase.
    }
    updateOnlineStatus();
  }

  function listenOnlinePlayers() {
    refresh();
    window.addEventListener('storage', (e) => {
      if (e.key === KEY) refresh();
    });
  }

  function removeOfflinePlayer() {
    const now = Date.now();
    setRaw(getRaw().filter((x) => now - (x.updatedAt || 0) < 65000));
  }

  function refresh() {
    cache = [...getRaw(), ...(!FirebaseConfig.USE_FIREBASE ? npcPlayers : [])];
    renderOnlineList();
    if (window.LocationsModule) LocationsModule.updateCurrentPlayers();
  }

  function getOnlinePlayers() {
    return cache;
  }

  function renderOnlineList() {
    const list = document.getElementById('onlinePlayersList');
    if (!list) return;
    list.innerHTML = '';
    cache.forEach((p) => {
      const li = document.createElement('li');
      const loc = GameData.LOCATIONS.find((l) => l.id === p.locationId);
      li.textContent = `${p.nickname} • Lv.${p.level} • ${p.className} • ${loc ? loc.name : '—'}`;
      list.appendChild(li);
    });
  }

  return { updateOnlineStatus, updatePlayerLocation, listenOnlinePlayers, removeOfflinePlayer, getOnlinePlayers };
})();
