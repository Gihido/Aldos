window.PlayerModule = (() => {
  const PLAYER_KEY = 'sok_player_profile';
  const ACCOUNT_KEY = 'sok_accounts';

  const state = {
    account: null,
    player: null
  };

  const getAccounts = () => JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '{}');
  const saveAccounts = (accounts) => localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));

  function register(username, password) {
    const accounts = getAccounts();
    if (accounts[username]) return { ok: false, message: 'Пользователь уже существует.' };
    accounts[username] = { password, createdAt: Date.now() };
    saveAccounts(accounts);
    return { ok: true };
  }

  function login(username, password) {
    const accounts = getAccounts();
    const user = accounts[username];
    if (!user || user.password !== password) return { ok: false, message: 'Неверный логин или пароль.' };
    state.account = username;
    return { ok: true };
  }

  function createCharacter(nickname, classId) {
    const klass = GameData.CLASSES[classId];
    if (!klass || !state.account) return false;
    const stats = klass.baseStats;
    state.player = {
      accountName: state.account,
      nickname,
      classId,
      className: klass.name,
      level: 1,
      exp: 0,
      gold: 120,
      locationId: 'dawn_village',
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      energy: stats.energy,
      maxEnergy: stats.energy,
      minDamage: stats.minDamage,
      maxDamage: stats.maxDamage,
      critChance: stats.critChance,
      defense: stats.defense,
      inventory: ['potion_small'],
      equipment: { weapon: null, armor: null },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    savePlayer();
    return true;
  }

  function savePlayer() {
    if (!state.player) return;
    state.player.updatedAt = Date.now();
    localStorage.setItem(PLAYER_KEY, JSON.stringify(state.player));
  }

  function loadPlayer() {
    const raw = localStorage.getItem(PLAYER_KEY);
    if (!raw) return null;
    state.player = JSON.parse(raw);
    state.account = state.player.accountName;
    return state.player;
  }

  function getPlayer() {
    return state.player;
  }

  function expToNextLevel() {
    return state.player.level * 100;
  }

  function addGold(amount) {
    state.player.gold += amount;
    savePlayer();
  }

  function spendGold(amount) {
    if (state.player.gold < amount) return false;
    state.player.gold -= amount;
    savePlayer();
    return true;
  }

  function addExp(amount) {
    const p = state.player;
    p.exp += amount;
    let leveled = false;
    while (p.exp >= p.level * 100) {
      p.exp -= p.level * 100;
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

  function heal(amount) {
    const p = state.player;
    p.hp = Math.min(p.maxHp, p.hp + amount);
    savePlayer();
  }

  function restoreAfterDefeat() {
    const p = state.player;
    p.locationId = 'dawn_village';
    p.hp = 1;
    p.energy = p.maxEnergy;
    savePlayer();
  }

  function setLocation(locationId) {
    state.player.locationId = locationId;
    savePlayer();
  }

  function getComputedStats() {
    const p = state.player;
    let stats = {
      minDamage: p.minDamage,
      maxDamage: p.maxDamage,
      critChance: p.critChance,
      defense: p.defense,
      maxHp: p.maxHp
    };
    const weapon = p.equipment.weapon ? GameData.ITEMS[p.equipment.weapon] : null;
    const armor = p.equipment.armor ? GameData.ITEMS[p.equipment.armor] : null;
    if (weapon) {
      stats.minDamage += weapon.minDamageBonus || 0;
      stats.maxDamage += weapon.maxDamageBonus || 0;
      stats.critChance += weapon.critChanceBonus || 0;
    }
    if (armor) {
      stats.defense += armor.defenseBonus || 0;
      stats.maxHp += armor.maxHpBonus || 0;
    }
    return stats;
  }

  function renderPanel() {
    const p = state.player;
    if (!p) return;
    const s = getComputedStats();
    if (p.hp > s.maxHp) p.hp = s.maxHp;
    const hpPercent = Math.max(0, Math.min(100, (p.hp / s.maxHp) * 100));
    const enPercent = Math.max(0, Math.min(100, (p.energy / p.maxEnergy) * 100));
    const xpPercent = Math.max(0, Math.min(100, (p.exp / expToNextLevel()) * 100));

    document.getElementById('playerNick').textContent = p.nickname;
    document.getElementById('playerClass').textContent = `${p.className} • Уровень ${p.level}`;
    document.getElementById('playerGold').textContent = `🪙 ${p.gold}`;
    document.getElementById('playerStats').textContent = `⚔️ ${s.minDamage}-${s.maxDamage} • 🛡️ ${s.defense} • ✨ ${(s.critChance * 100).toFixed(0)}%`;

    document.getElementById('hpLabel').textContent = `${Math.round(p.hp)} / ${Math.round(s.maxHp)}`;
    document.getElementById('energyLabel').textContent = `${Math.round(p.energy)} / ${Math.round(p.maxEnergy)}`;
    document.getElementById('xpLabel').textContent = `${Math.round(p.exp)} / ${expToNextLevel()}`;

    document.getElementById('hpFill').style.width = `${hpPercent}%`;
    document.getElementById('energyFill').style.width = `${enPercent}%`;
    document.getElementById('xpFill').style.width = `${xpPercent}%`;
  }

  return {
    register, login, createCharacter, loadPlayer, savePlayer, getPlayer,
    addGold, spendGold, addExp, heal, setLocation, getComputedStats,
    restoreAfterDefeat, expToNextLevel, renderPanel
  };
})();
