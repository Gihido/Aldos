window.PlayerModule = (() => {
  const ACCOUNT_KEY = 'sok_accounts_v3';
  const PLAYER_KEY = 'sok_player_profile_v3';

  const state = { accountName: null, player: null };

  const defaultPlayerStats = () => ({ wins: 0, losses: 0, rareItems: 0 });
  const defaultEquipment = () => ({ weapon: null, armor: null, amulet: null, ring: null });

  function getAccounts() {
    try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '{}'); } catch { return {}; }
  }

  function register(username, password) {
    if (!username || !password) return { ok: false, message: 'Введите логин и пароль.' };
    const db = getAccounts();
    if (db[username]) return { ok: false, message: 'Пользователь уже существует.' };
    db[username] = { password, createdAt: Date.now() };
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(db));
    return { ok: true };
  }

  function login(username, password) {
    const acc = getAccounts()[username];
    if (!acc || acc.password !== password) return { ok: false, message: 'Неверный логин/пароль.' };
    state.accountName = username;
    return { ok: true };
  }

  function createCharacter(nickname, classId) {
    const klass = GameData.CLASSES[classId];
    if (!klass) return { ok: false, message: 'Не выбран класс.' };

    state.player = {
      accountName: state.accountName,
      nickname: String(nickname || '').trim().slice(0, 18) || 'Герой',
      role: 'player',
      classId,
      className: klass.name,
      level: 1,
      exp: 0,
      gold: 120,
      hp: klass.baseStats.maxHp,
      maxHp: klass.baseStats.maxHp,
      energy: klass.baseStats.energy,
      maxEnergy: klass.baseStats.energy,
      minDamage: klass.baseStats.minDamage,
      maxDamage: klass.baseStats.maxDamage,
      critChance: klass.baseStats.critChance,
      defense: klass.baseStats.defense,
      inventory: ['potion_small', 'potion_small'],
      equipment: defaultEquipment(),
      locationId: 'dawn_village',
      clanId: null,
      clanRole: null,
      settings: SettingsModule?.loadSettings?.() || {},
      lastDailyChestAt: 0,
      stats: defaultPlayerStats(),
      inBattle: false,
      muteUntil: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    autosave();
    return { ok: true };
  }

  function sanitize(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const klass = GameData.CLASSES[raw.classId] || GameData.CLASSES.warrior;

    const p = {
      accountName: String(raw.accountName || state.accountName || ''),
      nickname: String(raw.nickname || 'Герой'),
      role: raw.role || 'player',
      classId: klass.id,
      className: klass.name,
      level: Math.max(1, Number(raw.level) || 1),
      exp: Math.max(0, Number(raw.exp) || 0),
      gold: Math.max(0, Number(raw.gold) || 0),
      hp: Math.max(0, Number(raw.hp) || klass.baseStats.maxHp),
      maxHp: Math.max(1, Number(raw.maxHp) || klass.baseStats.maxHp),
      energy: Math.max(0, Number(raw.energy) || klass.baseStats.energy),
      maxEnergy: Math.max(1, Number(raw.maxEnergy) || klass.baseStats.energy),
      minDamage: Math.max(1, Number(raw.minDamage) || klass.baseStats.minDamage),
      maxDamage: Math.max(1, Number(raw.maxDamage) || klass.baseStats.maxDamage),
      critChance: Math.max(0, Number(raw.critChance) || klass.baseStats.critChance),
      defense: Math.max(0, Number(raw.defense) || klass.baseStats.defense),
      inventory: Array.isArray(raw.inventory) ? raw.inventory.filter((id) => GameData.ITEMS[id]) : [],
      equipment: { ...defaultEquipment(), ...(raw.equipment || {}) },
      locationId: GameData.LOCATIONS.some((l) => l.id === raw.locationId) ? raw.locationId : 'dawn_village',
      clanId: raw.clanId || null,
      clanRole: raw.clanRole || null,
      settings: raw.settings || {},
      lastDailyChestAt: Number(raw.lastDailyChestAt) || 0,
      stats: { ...defaultPlayerStats(), ...(raw.stats || {}) },
      inBattle: !!raw.inBattle,
      muteUntil: Number(raw.muteUntil) || 0,
      createdAt: Number(raw.createdAt) || Date.now(),
      updatedAt: Date.now()
    };

    p.hp = Math.min(p.hp, p.maxHp);
    p.energy = Math.min(p.energy, p.maxEnergy);
    return p;
  }

  function loadPlayer() {
    try {
      const raw = JSON.parse(localStorage.getItem(PLAYER_KEY) || 'null');
      const p = sanitize(raw);
      if (!p) return null;
      state.player = p;
      state.accountName = p.accountName;
      return p;
    } catch {
      return null;
    }
  }

  function autosave() {
    if (!state.player) return;
    state.player.updatedAt = Date.now();
    localStorage.setItem(PLAYER_KEY, JSON.stringify(state.player));
  }

  function getPlayer() { return state.player; }

  function expToNextLevel(level = state.player.level) { return Math.max(100, level * 100); }

  function getComputedStats() {
    const p = state.player;
    if (!p) return { minDamage: 1, maxDamage: 1, defense: 0, critChance: 0, maxHp: 1 };
    const s = { minDamage: p.minDamage, maxDamage: p.maxDamage, defense: p.defense, critChance: p.critChance, maxHp: p.maxHp };
    ['weapon', 'armor', 'amulet', 'ring'].forEach((slot) => {
      const itemId = p.equipment[slot];
      const item = GameData.ITEMS[itemId];
      if (!item) return;
      s.minDamage += item.minDamageBonus || 0;
      s.maxDamage += item.maxDamageBonus || 0;
      s.defense += item.defenseBonus || 0;
      s.critChance += item.critChanceBonus || 0;
      s.maxHp += item.maxHpBonus || 0;
    });
    return s;
  }

  function changeGold(amount) {
    const p = state.player;
    p.gold = Math.max(0, p.gold + Number(amount || 0));
    autosave();
  }

  function spendGold(cost) {
    cost = Math.max(0, Number(cost) || 0);
    if (state.player.gold < cost) return false;
    state.player.gold -= cost;
    autosave();
    return true;
  }

  function addExp(amount) {
    const p = state.player;
    p.exp += Math.max(0, Number(amount || 0));
    let leveled = false;
    while (p.exp >= expToNextLevel(p.level)) {
      p.exp -= expToNextLevel(p.level);
      p.level += 1;
      p.maxHp += 15;
      p.minDamage += 3;
      p.maxDamage += 3;
      p.hp = p.maxHp;
      p.energy = p.maxEnergy;
      leveled = true;
    }
    autosave();
    return leveled;
  }

  function heal(v) { state.player.hp = Math.min(getComputedStats().maxHp, state.player.hp + Math.max(0, v)); autosave(); }
  function restoreEnergy(v) { state.player.energy = Math.min(state.player.maxEnergy, state.player.energy + Math.max(0, v)); autosave(); }

  function setLocation(locationId) {
    if (!GameData.LOCATIONS.some((l) => l.id === locationId)) return false;
    state.player.locationId = locationId;
    autosave();
    return true;
  }

  function addWin() { state.player.stats.wins += 1; autosave(); }
  function addLoss() { state.player.stats.losses += 1; autosave(); }

  function renderTopPanel() { UIManager.renderPlayerHeader(); }

  return {
    register, login, createCharacter, loadPlayer, autosave, getPlayer, expToNextLevel,
    getComputedStats, changeGold, spendGold, addExp, heal, restoreEnergy, setLocation,
    addWin, addLoss, renderTopPanel
  };
})();
