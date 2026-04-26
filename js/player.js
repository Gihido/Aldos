window.PlayerModule = (() => {
  const ACCOUNT_KEY = 'sok_accounts_v2';
  const PLAYER_KEY = 'sok_player_profile_v2';

  const state = { accountName: null, player: null };

  const defaultEquipment = () => ({ weapon: null, armor: null, amulet: null, ring: null });

  function getAccounts() {
    try {
      const parsed = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '{}');
      return typeof parsed === 'object' && parsed ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveAccounts(data) {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(data));
  }

  function register(username, password) {
    if (!username || !password) return { ok: false, message: 'Введите логин и пароль.' };
    const accounts = getAccounts();
    if (accounts[username]) return { ok: false, message: 'Такой пользователь уже существует.' };
    accounts[username] = { password, createdAt: Date.now() };
    saveAccounts(accounts);
    return { ok: true };
  }

  function login(username, password) {
    const accounts = getAccounts();
    const user = accounts[username];
    if (!user || user.password !== password) return { ok: false, message: 'Неверный логин или пароль.' };
    state.accountName = username;
    return { ok: true };
  }

  function makeNewCharacter(nickname, classId) {
    const klass = GameData.CLASSES[classId];
    if (!klass || !state.accountName) return null;
    const base = klass.baseStats;

    return {
      accountName: state.accountName,
      nickname,
      classId,
      className: klass.name,
      level: 1,
      exp: 0,
      gold: 120,
      locationId: 'dawn_village',
      hp: base.maxHp,
      maxHp: base.maxHp,
      energy: base.energy,
      maxEnergy: base.energy,
      minDamage: base.minDamage,
      maxDamage: base.maxDamage,
      critChance: base.critChance,
      defense: base.defense,
      inventory: ['potion_small', 'potion_small'],
      equipment: defaultEquipment(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  function createCharacter(nickname, classId) {
    const cleanName = String(nickname || '').trim().slice(0, 18);
    if (!cleanName) return { ok: false, message: 'Введите ник персонажа.' };
    const character = makeNewCharacter(cleanName, classId);
    if (!character) return { ok: false, message: 'Не удалось создать персонажа.' };
    state.player = character;
    savePlayer();
    return { ok: true };
  }

  function sanitizePlayer(raw) {
    if (!raw || typeof raw !== 'object') return null;

    const klass = GameData.CLASSES[raw.classId] || GameData.CLASSES.warrior;
    const p = {
      accountName: String(raw.accountName || state.accountName || ''),
      nickname: String(raw.nickname || 'Странник'),
      classId: klass.id,
      className: klass.name,
      level: Math.max(1, Number(raw.level) || 1),
      exp: Math.max(0, Number(raw.exp) || 0),
      gold: Math.max(0, Number(raw.gold) || 0),
      locationId: GameData.LOCATIONS.some((l) => l.id === raw.locationId) ? raw.locationId : 'dawn_village',
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
      const safe = sanitizePlayer(raw);
      if (!safe) return null;
      state.player = safe;
      state.accountName = safe.accountName;
      return state.player;
    } catch {
      return null;
    }
  }

  function savePlayer() {
    if (!state.player) return;
    state.player.updatedAt = Date.now();
    localStorage.setItem(PLAYER_KEY, JSON.stringify(state.player));
  }

  function recoverCorruptedSave() {
    if (!state.accountName) return;
    const fallback = makeNewCharacter('Новый Герой', 'warrior');
    state.player = fallback;
    savePlayer();
    UIManager.showToast('Сохранение повреждено. Создан новый герой.', 'warning');
  }

  function getPlayer() {
    return state.player;
  }

  function expToNextLevel(level = state.player.level) {
    return Math.max(100, level * 100);
  }

  function autosave() {
    savePlayer();
  }

  function changeGold(amount) {
    const p = state.player;
    p.gold = Math.max(0, p.gold + amount);
    autosave();
  }

  function spendGold(amount) {
    const cost = Math.max(0, Number(amount) || 0);
    if (state.player.gold < cost) return false;
    state.player.gold -= cost;
    autosave();
    return true;
  }

  function addExp(amount) {
    const p = state.player;
    p.exp += Math.max(0, Number(amount) || 0);
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

  function heal(amount) {
    const p = state.player;
    p.hp = Math.min(getComputedStats().maxHp, p.hp + Math.max(0, Number(amount) || 0));
    autosave();
  }

  function restoreEnergy(amount) {
    const p = state.player;
    p.energy = Math.min(p.maxEnergy, p.energy + Math.max(0, Number(amount) || 0));
    autosave();
  }

  function applyDefeatPenalty() {
    const p = state.player;
    p.locationId = 'dawn_village';
    p.hp = 1;
    p.energy = p.maxEnergy;
    autosave();
  }

  function setLocation(locationId) {
    if (!GameData.LOCATIONS.some((l) => l.id === locationId)) return false;
    state.player.locationId = locationId;
    autosave();
    return true;
  }

  function getEquippedItem(slot) {
    const id = state.player?.equipment?.[slot];
    return id ? GameData.ITEMS[id] : null;
  }

  function getComputedStats() {
    const p = state.player;
    if (!p) return { minDamage: 1, maxDamage: 1, critChance: 0, defense: 0, maxHp: 1 };

    const stats = {
      minDamage: p.minDamage,
      maxDamage: p.maxDamage,
      critChance: p.critChance,
      defense: p.defense,
      maxHp: p.maxHp
    };

    ['weapon', 'armor', 'amulet', 'ring'].forEach((slot) => {
      const it = getEquippedItem(slot);
      if (!it) return;
      stats.minDamage += it.minDamageBonus || 0;
      stats.maxDamage += it.maxDamageBonus || 0;
      stats.critChance += it.critChanceBonus || 0;
      stats.defense += it.defenseBonus || 0;
      stats.maxHp += it.maxHpBonus || 0;
    });

    stats.minDamage = Math.max(1, stats.minDamage);
    stats.maxDamage = Math.max(stats.minDamage, stats.maxDamage);
    stats.critChance = Math.max(0, stats.critChance);
    stats.defense = Math.max(0, stats.defense);
    stats.maxHp = Math.max(1, stats.maxHp);
    return stats;
  }

  function renderTopPanel() {
    const p = state.player;
    if (!p) return;

    const stats = getComputedStats();
    p.hp = Math.max(0, Math.min(p.hp, stats.maxHp));
    p.energy = Math.max(0, Math.min(p.energy, p.maxEnergy));

    UIManager.safeSetText('topNick', p.nickname);
    UIManager.safeSetText('topClassLevel', `${p.className} • Lv.${p.level}`);
    UIManager.safeSetText('topGold', `🪙 ${p.gold}`);

    UIManager.updateProgressBar('hpFill', 'hpLabel', p.hp, stats.maxHp);
    UIManager.updateProgressBar('energyFill', 'energyLabel', p.energy, p.maxEnergy);
    UIManager.updateProgressBar('xpFill', 'xpLabel', p.exp, expToNextLevel());
  }

  return {
    register,
    login,
    createCharacter,
    loadPlayer,
    savePlayer,
    recoverCorruptedSave,
    getPlayer,
    getComputedStats,
    getEquippedItem,
    expToNextLevel,
    autosave,
    changeGold,
    spendGold,
    addExp,
    heal,
    restoreEnergy,
    applyDefeatPenalty,
    setLocation,
    renderTopPanel
  };
})();
