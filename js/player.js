window.PlayerModule = (() => {
  const PLAYER_KEY = 'sok_player_v4';
  const ACCOUNT_KEY = 'sok_accounts_v4';

  const state = { account: null, player: null };

  function generateFriendCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = `RPG-${chars[Math.floor(Math.random() * chars.length)]}${chars[Math.floor(Math.random() * chars.length)]}${chars[Math.floor(Math.random() * chars.length)]}${chars[Math.floor(Math.random() * chars.length)]}`;
    } while (isFriendCodeUsed(code));
    return code;
  }

  function isFriendCodeUsed(code) {
    try {
      const all = JSON.parse(localStorage.getItem('sok_all_friend_codes') || '[]');
      return all.includes(code);
    } catch { return false; }
  }

  function markFriendCodeUsed(code) {
    const all = JSON.parse(localStorage.getItem('sok_all_friend_codes') || '[]');
    if (!all.includes(code)) {
      all.push(code);
      localStorage.setItem('sok_all_friend_codes', JSON.stringify(all));
    }
  }

  function register(login, password) {
    const acc = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '{}');
    if (!login || !password) return { ok: false, message: 'Введите логин и пароль.' };
    if (acc[login]) return { ok: false, message: 'Такой аккаунт уже есть.' };
    acc[login] = { password, createdAt: Date.now() };
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(acc));
    return { ok: true };
  }

  function login(login, password) {
    const acc = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '{}');
    if (!acc[login] || acc[login].password !== password) return { ok: false, message: 'Неверный логин/пароль.' };
    state.account = login;
    return { ok: true };
  }

  function createPlayer(name, classId) {
    const klass = GameData.CLASSES[classId];
    if (!klass) return { ok: false, message: 'Выберите класс.' };

    const friendCode = generateFriendCode();
    markFriendCodeUsed(friendCode);

    state.player = {
      account: state.account,
      playerId: state.account || `local_${Date.now()}`,
      name: String(name || '').trim().slice(0, 18) || 'Герой',
      friendCode,
      classId,
      className: klass.name,
      level: 1,
      exp: 0,
      gold: 100,
      hp: klass.hp,
      maxHp: klass.hp,
      energy: 100,
      maxEnergy: 100,
      minDamage: klass.damage[0],
      maxDamage: klass.damage[1],
      critChance: classId === 'archer' ? 0.18 : classId === 'mage' ? 0.12 : 0.08,
      defense: klass.defense,
      locationId: 'dawn_village',
      inventory: ['potion_small'],
      equipment: { weapon: null, armor: null },
      friends: [],
      clanId: null,
      inBattleId: null,
      wins: 0,
      losses: 0,
      animationsEnabled: true,
      textScale: 100,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    savePlayer();
    return { ok: true };
  }

  function sanitize(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const classData = GameData.CLASSES[raw.classId] || GameData.CLASSES.warrior;

    return {
      account: raw.account || state.account || '',
      playerId: raw.playerId || state.account || `local_${Date.now()}`,
      name: String(raw.name || 'Герой'),
      friendCode: raw.friendCode || generateFriendCode(),
      classId: classData.id,
      className: classData.name,
      level: Math.max(1, Number(raw.level) || 1),
      exp: Math.max(0, Number(raw.exp) || 0),
      gold: Math.max(0, Number(raw.gold) || 0),
      hp: Math.max(0, Number(raw.hp) || classData.hp),
      maxHp: Math.max(1, Number(raw.maxHp) || classData.hp),
      energy: Math.max(0, Number(raw.energy) || 100),
      maxEnergy: Math.max(1, Number(raw.maxEnergy) || 100),
      minDamage: Math.max(1, Number(raw.minDamage) || classData.damage[0]),
      maxDamage: Math.max(1, Number(raw.maxDamage) || classData.damage[1]),
      critChance: Math.max(0, Number(raw.critChance) || 0.1),
      defense: Math.max(0, Number(raw.defense) || classData.defense),
      locationId: GameData.LOCATIONS.some((l) => l.id === raw.locationId) ? raw.locationId : 'dawn_village',
      inventory: Array.isArray(raw.inventory) ? raw.inventory.filter((id) => GameData.ITEMS[id]) : [],
      equipment: { weapon: raw.equipment?.weapon || null, armor: raw.equipment?.armor || null },
      friends: Array.isArray(raw.friends) ? raw.friends : [],
      clanId: raw.clanId || null,
      inBattleId: raw.inBattleId || null,
      wins: Math.max(0, Number(raw.wins) || 0),
      losses: Math.max(0, Number(raw.losses) || 0),
      animationsEnabled: raw.animationsEnabled !== false,
      textScale: Math.max(85, Math.min(130, Number(raw.textScale) || 100)),
      createdAt: Number(raw.createdAt) || Date.now(),
      updatedAt: Date.now()
    };
  }

  function savePlayer() {
    if (!state.player) return;
    state.player.updatedAt = Date.now();
    localStorage.setItem(PLAYER_KEY, JSON.stringify(state.player));
  }

  function loadPlayer() {
    try {
      const raw = JSON.parse(localStorage.getItem(PLAYER_KEY) || 'null');
      const safe = sanitize(raw);
      state.player = safe;
      state.account = safe?.account || state.account;
      return safe;
    } catch { return null; }
  }

  function getPlayer() { return state.player; }

  function expToNextLevel() { return Math.max(100, state.player.level * 100); }

  function getComputedStats() {
    const p = state.player;
    if (!p) return { minDamage: 1, maxDamage: 2, defense: 0, critChance: 0, maxHp: 1 };
    const s = { minDamage: p.minDamage, maxDamage: p.maxDamage, defense: p.defense, critChance: p.critChance, maxHp: p.maxHp };
    const w = GameData.ITEMS[p.equipment.weapon];
    const a = GameData.ITEMS[p.equipment.armor];
    if (w) { s.minDamage += w.minDamageBonus || 0; s.maxDamage += w.maxDamageBonus || 0; s.critChance += w.critChanceBonus || 0; }
    if (a) { s.defense += a.defenseBonus || 0; s.maxHp += a.maxHpBonus || 0; }
    return s;
  }

  function addExp(amount) {
    const p = state.player;
    p.exp += Math.max(0, Number(amount) || 0);
    let leveled = false;
    while (p.exp >= expToNextLevel()) {
      p.exp -= expToNextLevel();
      p.level += 1;
      p.maxHp += 15;
      p.minDamage += 3;
      p.maxDamage += 3;
      p.hp = p.maxHp;
      p.energy = p.maxEnergy;
      leveled = true;
    }
    savePlayer();
    return leveled;
  }

  function changeGold(amount) { state.player.gold = Math.max(0, state.player.gold + Number(amount || 0)); savePlayer(); }
  function spendGold(cost) { cost = Math.max(0, Number(cost) || 0); if (state.player.gold < cost) return false; state.player.gold -= cost; savePlayer(); return true; }
  function heal(h) { const max = getComputedStats().maxHp; state.player.hp = Math.max(0, Math.min(max, state.player.hp + Math.max(0, h))); savePlayer(); }
  function restoreEnergy(e) { state.player.energy = Math.max(0, Math.min(state.player.maxEnergy, state.player.energy + Math.max(0, e))); savePlayer(); }

  return {
    generateFriendCode,
    createPlayer,
    savePlayer,
    loadPlayer,
    register,
    login,
    getPlayer,
    expToNextLevel,
    getComputedStats,
    addExp,
    changeGold,
    spendGold,
    heal,
    restoreEnergy
  };
})();
