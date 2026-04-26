window.OnlineModule = (() => {
  const state = { userId: null, unsubLocation: null, unsubGlobal: null };

  const npcPool = [
    ['npc_1', 'Эдрик', 'Воин', 4, 'dark_forest'],
    ['npc_2', 'Мира', 'Маг', 6, 'king_ruins'],
    ['npc_3', 'Тарг', 'Лучник', 3, 'abandoned_mine'],
    ['npc_4', 'Ворн', 'Воин', 8, 'monster_lair'],
    ['npc_5', 'Селия', 'Маг', 5, 'witch_swamp'],
    ['npc_6', 'Нокс', 'Лучник', 7, 'north_fortress']
  ];

  function getCurrentUserId() {
    if (state.userId) return state.userId;
    const p = PlayerModule.getPlayer();
    state.userId = p?.accountName || `guest_${Date.now()}`;
    return state.userId;
  }

  function buildOnlineProfile() {
    const p = PlayerModule.getPlayer();
    if (!p) return null;
    return {
      userId: getCurrentUserId(),
      nickname: p.nickname,
      className: p.className,
      level: p.level,
      locationId: p.locationId,
      clanId: p.clanId || null,
      status: p.inBattle ? 'в бою' : p.isAfk ? 'AFK' : 'свободен',
      updatedAt: Date.now()
    };
  }

  async function savePlayerOnline() {
    const p = PlayerModule.getPlayer();
    if (!p) return;
    const id = getCurrentUserId();
    await ServerAPI.set(`players/${id}`, p);
    await updatePlayerOnlineStatus();
  }

  async function updatePlayerOnlineStatus() {
    const profile = buildOnlineProfile();
    if (!profile) return;
    await ServerAPI.set(`playersOnline/${profile.userId}`, profile);
    await ServerAPI.set(`locations/${profile.locationId}/players/${profile.userId}`, profile);
  }

  async function updatePlayerLocation(locationId) {
    const profile = buildOnlineProfile();
    if (!profile) return;
    const prevLoc = profile.locationId;
    profile.locationId = locationId;
    await ServerAPI.remove(`locations/${prevLoc}/players/${profile.userId}`);
    await ServerAPI.set(`locations/${locationId}/players/${profile.userId}`, profile);
    await ServerAPI.update(`playersOnline/${profile.userId}`, { locationId, updatedAt: Date.now() });
  }

  function npcProfiles() {
    return npcPool.map(([userId, nickname, className, level, locationId]) => ({
      userId, nickname, className, level, locationId,
      clanId: Math.random() > 0.65 ? 'npc_clan' : null,
      status: ['свободен', 'AFK', 'в бою'][Math.floor(Math.random() * 3)],
      updatedAt: Date.now()
    }));
  }

  function listenPlayersInLocation(locationId, callback) {
    state.unsubLocation?.();
    if (!window.FirebaseConfig?.USE_FIREBASE) {
      const current = Object.values((localStorage.getItem(`sok_srv_locations__${locationId}__players`) && JSON.parse(localStorage.getItem(`sok_srv_locations__${locationId}__players`))) || {});
      const npcs = npcProfiles().filter((n) => n.locationId === locationId);
      callback([...current, ...npcs]);
    }

    state.unsubLocation = ServerAPI.listen(`locations/${locationId}/players`, (value) => {
      const players = value ? Object.values(value) : [];
      const withNpc = window.FirebaseConfig?.USE_FIREBASE ? players : [...players, ...npcProfiles().filter((n) => n.locationId === locationId)];
      callback(withNpc);
    });

    return state.unsubLocation;
  }

  function listenGlobalOnlinePlayers(callback) {
    state.unsubGlobal?.();
    state.unsubGlobal = ServerAPI.listen('playersOnline', (value) => {
      const players = value ? Object.values(value) : [];
      callback(window.FirebaseConfig?.USE_FIREBASE ? players : [...players, ...npcProfiles()]);
    });
    return state.unsubGlobal;
  }

  function sendServerEvent(event) {
    return ServerAPI.push('serverEvents', {
      ...event,
      senderId: getCurrentUserId(),
      createdAt: Date.now()
    });
  }

  function listenServerEvents(callback) {
    return ServerAPI.listen('serverEvents', (list) => {
      callback(Array.isArray(list) ? list : []);
    });
  }

  async function disconnectPlayer() {
    const userId = getCurrentUserId();
    const p = PlayerModule.getPlayer();
    if (!p) return;
    await ServerAPI.remove(`playersOnline/${userId}`);
    await ServerAPI.remove(`locations/${p.locationId}/players/${userId}`);
  }

  async function initOnlineSystem() {
    getCurrentUserId();
    await savePlayerOnline();
    window.addEventListener('beforeunload', () => disconnectPlayer());
  }

  return {
    initOnlineSystem,
    getCurrentUserId,
    savePlayerOnline,
    updatePlayerOnlineStatus,
    updatePlayerLocation,
    listenPlayersInLocation,
    listenGlobalOnlinePlayers,
    sendServerEvent,
    listenServerEvents,
    disconnectPlayer
  };
})();
