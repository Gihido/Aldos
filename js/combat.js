window.CombatModule = (() => {
  const state = { active: false, monster: null, defending: false };

  const randomBetween = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

  function pickMonsterForLocation(locationId) {
    const location = GameData.LOCATIONS.find((l) => l.id === locationId);
    const monsterId = location.monsters[Math.floor(Math.random() * location.monsters.length)];
    const template = GameData.MONSTERS[monsterId];
    return { ...template, hp: template.hp, maxHp: template.hp };
  }

  function startFight(locationId) {
    if (state.active) return;
    state.monster = pickMonsterForLocation(locationId);
    state.active = true;
    state.defending = false;
    document.getElementById('combatModal').classList.add('show');
    log(`Враг появился: ${state.monster.name}`);
    render();
  }

  function log(text) {
    const journal = document.getElementById('combatLog');
    const li = document.createElement('li');
    li.textContent = text;
    journal.prepend(li);
  }

  function computePlayerHit(multiplier = 1) {
    const stats = PlayerModule.getComputedStats();
    let damage = randomBetween(stats.minDamage, stats.maxDamage) * multiplier;
    let isCrit = Math.random() < stats.critChance;
    if (isCrit) damage *= 1.75;
    return { damage: Math.round(damage), isCrit };
  }

  function playerAction(type) {
    if (!state.active) return;
    const p = PlayerModule.getPlayer();

    if (type === 'potion') {
      const idx = p.inventory.findIndex((itemId) => GameData.ITEMS[itemId]?.type === 'potion');
      if (idx === -1) return MainUI.notify('Нет зелий в инвентаре.', 'warn');
      const potion = GameData.ITEMS[p.inventory[idx]];
      p.inventory.splice(idx, 1);
      PlayerModule.heal(potion.heal);
      log(`Вы выпили ${potion.name} (+${potion.heal} HP).`);
      PlayerModule.renderPanel();
      monsterTurn();
      return;
    }

    if (type === 'run') {
      endFight(false, true);
      return;
    }

    if (type === 'defense') {
      state.defending = true;
      log('Вы заняли оборонительную стойку.');
      monsterTurn();
      return;
    }

    const energyCost = type === 'strong' ? 18 : 8;
    if (p.energy < energyCost) {
      MainUI.notify('Недостаточно энергии.', 'warn');
      return;
    }
    p.energy -= energyCost;

    const { damage, isCrit } = computePlayerHit(type === 'strong' ? 1.45 : 1);
    state.monster.hp = Math.max(0, state.monster.hp - damage);
    animateHit(isCrit ? 'crit' : 'normal');
    log(`Вы нанесли ${damage} урона${isCrit ? ' (критический удар!)' : ''}.`);
    render();
    PlayerModule.savePlayer();
    PlayerModule.renderPanel();

    if (state.monster.hp <= 0) {
      victory();
      return;
    }
    monsterTurn();
  }

  function monsterTurn() {
    const p = PlayerModule.getPlayer();
    const stats = PlayerModule.getComputedStats();
    const raw = randomBetween(state.monster.damage[0], state.monster.damage[1]);
    const blocked = state.defending ? stats.defense * 2 : stats.defense;
    const damage = Math.max(1, raw - blocked);
    p.hp = Math.max(0, p.hp - damage);
    log(`${state.monster.name} бьёт вас на ${damage}.`);
    if (state.defending) state.defending = false;
    PlayerModule.savePlayer();
    PlayerModule.renderPanel();
    render();

    if (p.hp <= 0) defeat();
  }

  function handleLoot(monster) {
    const p = PlayerModule.getPlayer();
    monster.lootTable.forEach((loot) => {
      if (Math.random() <= loot.chance) InventoryModule.addItem(loot.itemId);
    });

    const location = GameData.LOCATIONS.find((l) => l.id === p.locationId);
    if (Math.random() <= location.chestChance) ChestModule.markChestFound(location.id);
  }

  function victory() {
    const monster = state.monster;
    const gold = randomBetween(monster.rewardGold[0], monster.rewardGold[1]);
    const exp = randomBetween(monster.rewardExp[0], monster.rewardExp[1]);

    PlayerModule.addGold(gold);
    const levelUp = PlayerModule.addExp(exp);
    handleLoot(monster);

    MainUI.notify(`Вы победили! +${gold} 🪙, +${exp} XP`, 'success');
    if (levelUp) MainUI.notify('Уровень повышен!', 'success');

    log(`Победа над ${monster.name}.`);
    PlayerModule.renderPanel();
    endFight(true, false);
  }

  function defeat() {
    PlayerModule.restoreAfterDefeat();
    MainUI.notify('Вы проиграли. Возвращение в Деревню Рассвета.', 'danger');
    endFight(false, false);
    LocationsModule.renderLocations();
    PlayerModule.renderPanel();
  }

  function endFight(won, escaped) {
    state.active = false;
    state.monster = null;
    state.defending = false;
    if (escaped) MainUI.notify('Вы сбежали из боя.', 'info');
    document.getElementById('combatModal').classList.remove('show');
    PlayerModule.savePlayer();
    MainUI.logEvent(won ? 'Бой завершён победой.' : escaped ? 'Бой завершён бегством.' : 'Бой завершён поражением.');
  }

  function render() {
    if (!state.monster) return;
    const p = PlayerModule.getPlayer();
    const ps = PlayerModule.getComputedStats();
    document.getElementById('combatEnemyName').textContent = state.monster.name;
    document.getElementById('combatEnemyHp').textContent = `${state.monster.hp} / ${state.monster.maxHp}`;
    document.getElementById('combatEnemyFill').style.width = `${(state.monster.hp / state.monster.maxHp) * 100}%`;
    document.getElementById('combatPlayerHp').textContent = `${p.hp} / ${ps.maxHp}`;
    document.getElementById('combatPlayerFill').style.width = `${(p.hp / ps.maxHp) * 100}%`;
  }

  function animateHit(type) {
    const card = document.getElementById('enemyCard');
    card.classList.remove('hit', 'crit-hit');
    void card.offsetWidth;
    card.classList.add(type === 'crit' ? 'crit-hit' : 'hit');
  }

  function bindActions() {
    document.getElementById('btnAttack').addEventListener('click', () => playerAction('attack'));
    document.getElementById('btnStrongAttack').addEventListener('click', () => playerAction('strong'));
    document.getElementById('btnDefend').addEventListener('click', () => playerAction('defense'));
    document.getElementById('btnUsePotion').addEventListener('click', () => playerAction('potion'));
    document.getElementById('btnRun').addEventListener('click', () => playerAction('run'));
  }

  return { startFight, bindActions };
})();
