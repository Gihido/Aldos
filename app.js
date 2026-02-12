const CONFIG_KEY = 'aldos_config';
const PLAYERS_KEY = 'aldos_players_db';

const DEFAULT_CONFIG = {
  locations: {
    'Главная': {
      title: '📍 Главная локация',
      description: 'Сердце Альдоса: здесь можно подготовиться и отправиться в путь.',
      scene: '🏰',
      loot_pile: { items: [] },
      buttons: [
        { text: '🌲 Перелесок', is_transition: true, target_location: 'Перелесок' },
        { text: '🎒 Открыть сундук', is_transition: false, action: 'chest' }
      ]
    },
    'Перелесок': {
      title: '🌿 Перелесок',
      description: 'Туманная чаща с запахом мокрой травы. Здесь бродит волк.',
      scene: '🌲',
      monster: { name: 'Волк', hp: 10, hp_max: 10, mp: 5, mp_max: 5, min_dmg: 2, max_dmg: 4, icon: '🐺', respawn_time: 15 },
      loot_pile: { items: [] },
      buttons: [
        { text: '🏚️ Развалины', is_transition: true, target_location: 'Развалины' },
        { text: '🕳️ Пещера', is_transition: true, target_location: 'Пещера' }
      ]
    },
    'Развалины': {
      title: '🏚️ Развалины',
      description: 'Следы древней цивилизации. Тихо, но тревожно.',
      scene: '🏚️',
      loot_pile: { items: [] },
      buttons: [{ text: '↩️ Назад в Перелесок', is_transition: true, target_location: 'Перелесок' }]
    },
    'Пещера': {
      title: '🕳️ Пещера',
      description: 'Влажные стены и эхом отзывающиеся шаги.',
      scene: '🪨',
      loot_pile: { items: [] },
      buttons: [{ text: '↩️ Назад в Перелесок', is_transition: true, target_location: 'Перелесок' }]
    }
  }
};

const nowIso = () => new Date().toISOString();
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

const hashPassword = async (password) => {
  const enc = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

class PlayersDB {
  constructor() {
    this.players = this.loadAllPlayers();
  }

  loadAllPlayers() {
    const raw = localStorage.getItem(PLAYERS_KEY);
    if (!raw) return { players: {}, metadata: { created: nowIso(), last_update: nowIso() } };
    try {
      return JSON.parse(raw);
    } catch {
      return { players: {}, metadata: { created: nowIso(), last_update: nowIso() } };
    }
  }

  saveAllPlayers() {
    this.players.metadata.last_update = nowIso();
    this.players.metadata.total_players = Object.keys(this.players.players).length;
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(this.players));
  }

  playerExists(username) { return !!this.players.players[username]; }
  getPlayer(username) { return this.players.players[username] || null; }
  getAllPlayers() { return Object.keys(this.players.players); }

  registerPlayer(username, playerData) {
    if (this.playerExists(username)) return false;
    playerData.metadata = {
      created: nowIso(),
      last_login: nowIso(),
      is_banned: false,
      ban_reason: '',
      is_admin: ['admin', 'gihido'].includes(username.toLowerCase())
    };
    playerData.level ||= 1;
    playerData.experience ??= 0;
    this.players.players[username] = playerData;
    this.saveAllPlayers();
    return true;
  }

  updatePlayer(username, playerData) {
    if (!this.playerExists(username)) return false;
    const oldMeta = this.players.players[username].metadata || {};
    playerData.metadata = { ...oldMeta, last_login: nowIso() };
    this.players.players[username] = playerData;
    this.saveAllPlayers();
    return true;
  }

  banPlayer(username, reason = 'Нарушение правил') {
    const p = this.getPlayer(username);
    if (!p) return false;
    p.metadata ??= {};
    p.metadata.is_banned = true;
    p.metadata.ban_reason = reason;
    this.saveAllPlayers();
    return true;
  }

  unbanPlayer(username) {
    const p = this.getPlayer(username);
    if (!p) return false;
    p.metadata ??= {};
    p.metadata.is_banned = false;
    p.metadata.ban_reason = '';
    this.saveAllPlayers();
    return true;
  }

  isBanned(username) { return !!this.getPlayer(username)?.metadata?.is_banned; }
  getBanReason(username) { return this.getPlayer(username)?.metadata?.ban_reason || ''; }
  isAdmin(username) { return !!this.getPlayer(username)?.metadata?.is_admin || ['admin', 'gihido'].includes(username.toLowerCase()); }

  deletePlayer(username) {
    if (!this.playerExists(username)) return false;
    delete this.players.players[username];
    this.saveAllPlayers();
    return true;
  }
}

class Ability {
  constructor(id, name, icon, classReq, cooldown, manaCost, effectType, value) {
    Object.assign(this, { id, name, icon, classReq, cooldown, manaCost, effectType, value, currentCooldown: 0 });
  }
  canUse(playerMp, playerClass) {
    return playerClass === this.classReq && playerMp >= this.manaCost && this.currentCooldown === 0;
  }
  use() { this.currentCooldown = this.cooldown; }
  updateCooldown() { this.currentCooldown = Math.max(0, this.currentCooldown - 1); }
}

class LootItem {
  constructor(name, type, minQty = 1, maxQty = 1, dropChance = 50) {
    Object.assign(this, { name, type, minQty, maxQty, dropChance });
  }
  generate() { return { name: this.name, type: this.type, qty: rnd(this.minQty, this.maxQty) }; }
}

class Monster {
  constructor(data) {
    this.id = data.id || `m_${Date.now()}_${rnd(1000, 9999)}`;
    Object.assign(this, data);
    this.is_alive = data.is_alive ?? true;
    this.stunned_turns = data.stunned_turns ?? 0;
    this.respawn_at = data.respawn_at || null;
    this.loot_table = data.loot_table || [
      new LootItem('Шкура волка', 'ресурс', 1, 2, 70),
      new LootItem('Клык волка', 'ресурс', 1, 1, 35)
    ];
    this.exp_reward = data.exp_reward ?? Math.floor(this.hp_max / 2 + this.max_dmg * 2);
  }
  takeDamage(dmg) {
    this.hp = Math.max(0, this.hp - dmg);
    if (this.hp === 0) {
      this.is_alive = false;
      this.respawn_at = Date.now() + this.respawn_time * 1000;
    }
    return this.is_alive;
  }
  attack() { return rnd(this.min_dmg, this.max_dmg); }
  generateLoot() {
    return this.loot_table
      .filter((item) => rnd(1, 100) <= item.dropChance)
      .map((item) => item.generate());
  }
  maybeRespawn() {
    if (!this.is_alive && this.respawn_at && Date.now() >= this.respawn_at) {
      this.hp = this.hp_max;
      this.mp = this.mp_max;
      this.is_alive = true;
      this.stunned_turns = 0;
      this.respawn_at = null;
      return true;
    }
    return false;
  }
}

class RPGApp {
  constructor() {
    this.db = new PlayersDB();
    this.config = this.loadConfig();
    this.currentUser = null;
    this.player = null;
    this.monsters = {};
    this.eventLog = [];
    this.abilities = [
      new Ability('slash', 'Сильный удар', '🗡️', 'Воин', 2, 3, 'damage', 6),
      new Ability('fire', 'Огненный шар', '🔥', 'Маг', 2, 4, 'damage', 8),
      new Ability('stun', 'Оглушение', '💫', 'Разбойник', 3, 3, 'stun', 1)
    ];

    this.bindUI();
    this.renderAuth();
    setInterval(() => this.tick(), 1000);
  }

  loadConfig() {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return structuredClone(DEFAULT_CONFIG);
    try { return JSON.parse(raw); } catch { return structuredClone(DEFAULT_CONFIG); }
  }

  saveConfig() {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
  }

  bindUI() {
    const byId = (id) => document.getElementById(id);
    byId('registerBtn').onclick = () => this.register();
    byId('loginBtn').onclick = () => this.login();
    byId('logoutBtn').onclick = () => this.logout();
    byId('saveBtn').onclick = () => this.savePlayer();
    byId('attackBtn').onclick = () => this.playerAttack();
    byId('defendBtn').onclick = () => this.playerDefend();
    byId('abilityBtn').onclick = () => this.useAbility();
    byId('pickupBtn').onclick = () => this.pickupAllLoot();
    byId('banBtn').onclick = () => this.adminBan();
    byId('unbanBtn').onclick = () => this.adminUnban();
    byId('deletePlayerBtn').onclick = () => this.adminDeletePlayer();
  }

  log(message) {
    this.eventLog.unshift(`${new Date().toLocaleTimeString()} — ${message}`);
    this.eventLog = this.eventLog.slice(0, 120);
    document.getElementById('eventLog').innerHTML = this.eventLog.map((e) => `<li>${e}</li>`).join('');
  }

  async register() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (!username || !password) return this.log('Введите логин и пароль.');

    const ok = this.db.registerPlayer(username, {
      password_hash: await hashPassword(password),
      class: document.getElementById('classSelect').value,
      gender: document.getElementById('genderSelect').value,
      level: 1,
      experience: 0,
      hp: 30,
      hp_max: 30,
      mp: 10,
      mp_max: 10,
      min_dmg: 2,
      max_dmg: 5,
      location: 'Главная',
      inventory: [],
      defense_active: false
    });

    this.log(ok ? `Герой ${username} создан.` : 'Такой логин уже существует.');
    this.refreshAdminPlayers();
  }

  async login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const player = this.db.getPlayer(username);

    if (!player) return this.log('Игрок не найден.');
    if (this.db.isBanned(username)) return this.log(`Аккаунт заблокирован: ${this.db.getBanReason(username)}`);

    const inputHash = await hashPassword(password);
    if (player.password_hash !== inputHash) return this.log('Неверный пароль.');

    this.currentUser = username;
    this.player = structuredClone(player);
    this.ensureMonsterInstances();
    this.renderGame();
    this.log(`Добро пожаловать, ${username}.`);
  }

  logout() {
    this.savePlayer();
    this.currentUser = null;
    this.player = null;
    this.renderAuth();
  }

  savePlayer() {
    if (!this.currentUser || !this.player) return;
    this.db.updatePlayer(this.currentUser, this.player);
    this.saveConfig();
    this.log('Прогресс сохранён.');
  }

  ensureMonsterInstances() {
    for (const [loc, cfg] of Object.entries(this.config.locations)) {
      if (cfg.monster && !this.monsters[loc]) this.monsters[loc] = new Monster(cfg.monster);
    }
  }

  playerAttack() {
    const mon = this.monsters[this.player.location];
    if (!mon || !mon.is_alive) return this.log('В этой локации нет врага для атаки.');

    const dmg = rnd(this.player.min_dmg, this.player.max_dmg);
    mon.takeDamage(dmg);
    this.log(`Вы наносите ${dmg} урона (${mon.name}).`);

    if (!mon.is_alive) return this.onMonsterKilled(mon);

    this.monsterTurn(mon);
    this.renderGame();
  }

  playerDefend() {
    this.player.defense_active = true;
    this.log('Вы входите в защитную стойку.');
    this.monsterTurn(this.monsters[this.player.location]);
    this.renderGame();
  }

  useAbility() {
    const ability = this.abilities.find((a) => a.id === document.getElementById('abilitySelect').value);
    const mon = this.monsters[this.player.location];
    if (!ability || !mon || !mon.is_alive) return this.log('Умение нельзя применить сейчас.');
    if (!ability.canUse(this.player.mp, this.player.class)) return this.log('Недостаточно маны или умение на перезарядке.');

    this.player.mp -= ability.manaCost;
    ability.use();

    if (ability.effectType === 'damage') {
      mon.takeDamage(ability.value);
      this.log(`${ability.icon} ${ability.name} наносит ${ability.value} урона.`);
      if (!mon.is_alive) return this.onMonsterKilled(mon);
    }

    if (ability.effectType === 'stun') {
      mon.stunned_turns = ability.value;
      this.log(`${ability.icon} ${mon.name} оглушён на ${ability.value} ход.`);
    }

    this.monsterTurn(mon);
    this.renderGame();
  }

  monsterTurn(mon) {
    if (!mon?.is_alive) return;

    if (mon.stunned_turns > 0) {
      mon.stunned_turns -= 1;
      this.log(`${mon.name} пропускает ход (оглушение).`);
      return;
    }

    let dmg = mon.attack();
    if (this.player.defense_active) {
      dmg = Math.max(0, Math.floor(dmg / 2));
      this.player.defense_active = false;
    }

    this.player.hp = Math.max(0, this.player.hp - dmg);
    this.log(`${mon.name} наносит вам ${dmg} урона.`);

    if (this.player.hp === 0) {
      this.log('☠️ Вы пали в бою, но были спасены у городских ворот.');
      this.player.hp = this.player.hp_max;
      this.player.mp = Math.min(this.player.mp_max, this.player.mp + 3);
      this.player.location = 'Главная';
    }

    this.abilities.forEach((a) => a.updateCooldown());
  }

  onMonsterKilled(mon) {
    const exp = mon.exp_reward;
    this.player.experience += exp;
    this.log(`⚰️ ${mon.name} повержен. +${exp} опыта.`);

    const loot = mon.generateLoot();
    this.config.locations[this.player.location].loot_pile.items.push(...loot);
    if (loot.length > 0) this.log(`Добыча: ${loot.map((i) => `${i.name} x${i.qty}`).join(', ')}`);

    this.player.mp = Math.min(this.player.mp_max, this.player.mp + 2);
    this.handleLevelUp();
    this.renderGame();
  }

  handleLevelUp() {
    let expNeeded = this.player.level * 20;
    while (this.player.experience >= expNeeded) {
      this.player.experience -= expNeeded;
      this.player.level += 1;
      this.player.hp_max += 5;
      this.player.mp_max += 2;
      this.player.min_dmg += 1;
      this.player.max_dmg += 1;
      this.player.hp = this.player.hp_max;
      this.player.mp = this.player.mp_max;
      this.log(`✨ Новый уровень: ${this.player.level}. Характеристики увеличены.`);
      expNeeded = this.player.level * 20;
    }
  }

  pickupAllLoot() {
    const pile = this.config.locations[this.player.location].loot_pile;
    if (!pile.items.length) return this.log('Здесь нет лута.');

    this.player.inventory.push(...pile.items);
    this.log(`Собрано предметов: ${pile.items.length}.`);
    pile.items = [];
    this.renderGame();
  }

  moveTo(location) {
    this.player.location = location;
    this.player.mp = Math.min(this.player.mp_max, this.player.mp + 1);
    this.log(`Переход в локацию: ${location}. (+1 MP)`);
    this.renderGame();
  }

  openChest() {
    const chestLoot = [
      { name: 'Зелье лечения', type: 'расходник', qty: 1 },
      { name: 'Серебряная монета', type: 'валюта', qty: rnd(2, 8) }
    ];
    const reward = chestLoot[rnd(0, chestLoot.length - 1)];
    this.config.locations[this.player.location].loot_pile.items.push(reward);
    this.log(`Сундук найден: ${reward.name} x${reward.qty}.`);
    this.renderGame();
  }

  adminBan() {
    if (!this.db.isAdmin(this.currentUser)) return;
    const u = document.getElementById('adminPlayerSelect').value;
    this.db.banPlayer(u, document.getElementById('banReason').value || 'Нарушение правил');
    this.log(`Игрок ${u} заблокирован.`);
  }

  adminUnban() {
    if (!this.db.isAdmin(this.currentUser)) return;
    const u = document.getElementById('adminPlayerSelect').value;
    this.db.unbanPlayer(u);
    this.log(`Игрок ${u} разблокирован.`);
  }

  adminDeletePlayer() {
    if (!this.db.isAdmin(this.currentUser)) return;
    const u = document.getElementById('adminPlayerSelect').value;
    if (u === this.currentUser) return this.log('Нельзя удалить собственный аккаунт.');
    this.db.deletePlayer(u);
    this.refreshAdminPlayers();
    this.log(`Игрок ${u} удалён.`);
  }

  refreshAdminPlayers() {
    document.getElementById('adminPlayerSelect').innerHTML = this.db.getAllPlayers().map((u) => `<option>${u}</option>`).join('');
  }

  tick() {
    if (!this.player) return;
    for (const mon of Object.values(this.monsters)) {
      if (mon.maybeRespawn()) this.log(`♻️ ${mon.name} снова появился в локации.`);
    }
    this.renderMonster();
  }

  renderAuth() {
    document.getElementById('authCard').classList.remove('hidden');
    document.getElementById('gameUI').classList.add('hidden');
  }

  renderHud() {
    const expNeeded = this.player.level * 20;
    const hpPct = Math.round((this.player.hp / this.player.hp_max) * 100);
    const mpPct = Math.round((this.player.mp / this.player.mp_max) * 100);
    const expPct = Math.min(100, Math.round((this.player.experience / expNeeded) * 100));

    document.getElementById('playerLine').textContent = `Игрок: ${this.currentUser}`;
    document.getElementById('classChip').textContent = `Класс: ${this.player.class}`;
    document.getElementById('locationChip').textContent = `Локация: ${this.player.location}`;
    document.getElementById('levelChip').textContent = `Уровень: ${this.player.level}`;

    document.getElementById('hpFill').style.width = `${hpPct}%`;
    document.getElementById('mpFill').style.width = `${mpPct}%`;
    document.getElementById('expFill').style.width = `${expPct}%`;

    document.getElementById('hpText').textContent = `${this.player.hp}/${this.player.hp_max}`;
    document.getElementById('mpText').textContent = `${this.player.mp}/${this.player.mp_max}`;
    document.getElementById('expText').textContent = `${this.player.experience}/${expNeeded}`;
  }

  renderGame() {
    document.getElementById('authCard').classList.add('hidden');
    document.getElementById('gameUI').classList.remove('hidden');

    const loc = this.config.locations[this.player.location];
    document.getElementById('locationTitle').textContent = loc.title;
    document.getElementById('locationDescr').textContent = loc.description || '';
    document.getElementById('sceneArt').textContent = loc.scene || '🌌';

    document.getElementById('locationButtons').innerHTML = loc.buttons
      .map((b, idx) => `<button class="btn" data-idx="${idx}">${b.text}</button>`)
      .join('');

    document.querySelectorAll('#locationButtons button').forEach((btn) => {
      btn.onclick = () => {
        const buttonCfg = loc.buttons[Number(btn.dataset.idx)];
        if (buttonCfg.is_transition) this.moveTo(buttonCfg.target_location);
        else if (buttonCfg.action === 'chest') this.openChest();
      };
    });

    document.getElementById('inventoryList').innerHTML = this.player.inventory.length
      ? this.player.inventory.map((i) => `<li>${i.name} x${i.qty}</li>`).join('')
      : '<li>Пусто</li>';

    document.getElementById('lootList').innerHTML = loc.loot_pile.items.length
      ? loc.loot_pile.items.map((i) => `<li>${i.name} x${i.qty}</li>`).join('')
      : '<li>Пусто</li>';

    document.getElementById('abilitySelect').innerHTML = this.abilities
      .map((a) => `<option value="${a.id}">${a.icon} ${a.name} | Мана ${a.manaCost} | КД ${a.currentCooldown}</option>`)
      .join('');

    const adminVisible = this.db.isAdmin(this.currentUser);
    document.getElementById('adminPanel').classList.toggle('hidden', !adminVisible);
    if (adminVisible) this.refreshAdminPlayers();

    this.renderHud();
    this.renderMonster();
  }

  renderMonster() {
    if (!this.player) return;
    const mon = this.monsters[this.player.location];
    const box = document.getElementById('monsterBox');
    if (!mon) {
      box.innerHTML = 'В этой локации нет монстров.';
      return;
    }
    if (mon.is_alive) {
      box.innerHTML = `${mon.icon} <b>${mon.name}</b><br>HP ${mon.hp}/${mon.hp_max}`;
    } else {
      const seconds = Math.max(0, Math.ceil((mon.respawn_at - Date.now()) / 1000));
      box.innerHTML = `Монстр повержен. Возрождение через ${seconds}с.`;
    }
  }
}

new RPGApp();
