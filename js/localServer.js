window.LocalServer = (() => {
  const KEY = 'sok_local_server_v1';
  const CHANNEL = 'sok_local_channel_v1';
  const HEARTBEAT_MS = 3000;
  const OFFLINE_MS = 10000;

  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;
  let listeners = new Set();
  let hbTimer = null;
  let currentPlayerId = null;

  function getState() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
      return {
        playersOnline: raw.playersOnline || {},
        activeBattles: raw.activeBattles || {},
        chatMessages: raw.chatMessages || { global: [], location: [], friends: [], clan: [] },
        friendRequests: raw.friendRequests || [],
        clanData: raw.clanData || { clans: [], invites: [] },
        battleInvites: raw.battleInvites || []
      };
    } catch {
      return { playersOnline: {}, activeBattles: {}, chatMessages: { global: [], location: [], friends: [], clan: [] }, friendRequests: [], clanData: { clans: [], invites: [] }, battleInvites: [] };
    }
  }

  function setState(next) {
    localStorage.setItem(KEY, JSON.stringify(next));
    broadcastServerUpdate();
  }

  function listenServerUpdate(callback) {
    listeners.add(callback);
    callback(getState());
    return () => listeners.delete(callback);
  }

  function notifyAll() {
    const state = getState();
    listeners.forEach((cb) => cb(state));
  }

  function broadcastServerUpdate() {
    notifyAll();
    if (channel) channel.postMessage({ type: 'server_update', at: Date.now() });
  }

  function localServerInit(playerId) {
    currentPlayerId = playerId;
    setPlayerOnline();
    if (channel) channel.onmessage = () => notifyAll();
    if (!hbTimer) hbTimer = setInterval(localServerHeartbeat, HEARTBEAT_MS);
    window.addEventListener('beforeunload', setPlayerOffline);
  }

  function localServerHeartbeat() {
    if (!currentPlayerId) return;
    const st = getState();
    const player = st.playersOnline[currentPlayerId];
    if (player) {
      player.heartbeat = Date.now();
      st.playersOnline[currentPlayerId] = player;
      setState(st);
    }
    removeOfflinePlayers();
  }

  function setPlayerOnline() {
    const p = PlayerModule.getPlayer();
    if (!p || !currentPlayerId) return;
    const st = getState();
    st.playersOnline[currentPlayerId] = {
      playerId: currentPlayerId,
      nickname: p.nickname,
      level: p.level,
      className: p.className,
      locationId: p.locationId,
      status: p.inBattle ? 'в бою' : 'в локации',
      friendCode: p.friendCode,
      heartbeat: Date.now()
    };
    setState(st);
  }

  function setPlayerOffline() {
    if (!currentPlayerId) return;
    const st = getState();
    delete st.playersOnline[currentPlayerId];
    setState(st);
  }

  function removeOfflinePlayers() {
    const st = getState();
    const now = Date.now();
    let changed = false;
    Object.entries(st.playersOnline).forEach(([id, pl]) => {
      if (now - (pl.heartbeat || 0) > OFFLINE_MS) {
        delete st.playersOnline[id];
        changed = true;
      }
    });
    if (changed) setState(st);
  }

  function getOnlinePlayers() {
    removeOfflinePlayers();
    return Object.values(getState().playersOnline);
  }

  return {
    localServerInit,
    localServerHeartbeat,
    getOnlinePlayers,
    removeOfflinePlayers,
    broadcastServerUpdate,
    listenServerUpdate,
    setPlayerOnline,
    setPlayerOffline,
    getState,
    setState
  };
})();
