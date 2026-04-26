window.CombatModule = (() => {
  const state = { active: false, monster: null, rewardTaken: false };

  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

  function spawnMonster(locationId) {
    const loc = GameData.LOCATIONS.find((x) => x.id === locationId);
    if (!loc?.monsters?.length) return null;
    const id = loc.monsters[Math.floor(Math.random() * loc.monsters.length)];
    const m = GameData.MONSTERS[id];
    if (!m) return null;
    return { ...m, hp: m.hp, maxHp: m.hp };
  }

  function setCombatButtons(disabled) {
    ['btnAttack', 'btnStrongAttack', 'btnDefend', 'btnUsePotion', 'btnSkill', 'btnRun'].forEach((id) => {
      const el = UIManager.qs(id);
      if (el) el.disabled = disabled;
    });
  }

  function startCombat(locationId) {
    if (state.active) return UIManager.showToast('Вы уже в бою.', 'warning');

    const m = spawnMonster(locationId);
    if (!m) return UIManager.showToast('Монстр не найден.', 'error');

    const p = PlayerModule.getPlayer();
    p.inBattle = true;
    PlayerModule.autosave();

    state.active = true;
    state.monster = m;
    state.rewardTaken = false;

    UIManager.setScreen('battle');
    UIManager.safeSetText('battleMonsterName', `${m.name} (Lv.${m.level})`);
    UIManager.safeSetText('battleTurnText', `Сейчас ходит: ${p.nickname}`);
    const log = UIManager.qs('battleLog');
    if (log) log.innerHTML = '';
    setCombatButtons(false);
    render();
    logLine(`Начался бой против ${m.name}.`);
  }

  function render() {
    const p = PlayerModule.getPlayer();
    const s = PlayerModule.getComputedStats();
    const m = state.monster;
    if (!p || !m) return;

    UIManager.updateBars();
    updateBar('battlePlayerHpFill', 'battlePlayerHp', p.hp, s.maxHp);
    updateBar('battleMonsterHpFill', 'battleMonsterHp', m.hp, m.maxHp);
  }

  function updateBar(fillId, labelId, cur, max) {
    const fill = UIManager.qs(fillId);
    if (fill) fill.style.width = `${(Math.max(0, cur) / Math.max(1, max)) * 100}%`;
    UIManager.safeSetText(labelId, `${Math.max(0, Math.round(cur))} / ${Math.max(1, Math.round(max))}`);
  }

  function logLine(text) {
    const log = UIManager.qs('battleLog');
    if (!log) return;
    const li = document.createElement('li');
    li.textContent = text;
    log.prepend(li);
  }

  function useEnergy(cost) {
    const p = PlayerModule.getPlayer();
    if (p.energy < cost) {
      UIManager.showToast('Недостаточно энергии.', 'warning');
      return false;
    }
    p.energy -= cost;
    PlayerModule.autosave();
    return true;
  }

  function classSkillDamage() {
    const p = PlayerModule.getPlayer();
    const stats = PlayerModule.getComputedStats();
    if (p.classId === 'mage') return rand(stats.maxDamage, stats.maxDamage + 12);
    if (p.classId === 'archer') return rand(stats.minDamage + 8, stats.maxDamage + 6);
    return rand(stats.minDamage + 5, stats.maxDamage + 5);
  }

  function playerAction(actionType) {
    if (!state.active || !state.monster) return;

    const p = PlayerModule.getPlayer();
    const stats = PlayerModule.getComputedStats();

    if (actionType === 'run') return finish('run');

    if (actionType === 'potion') {
      const idx = p.inventory.findIndex((id) => GameData.ITEMS[id]?.type === 'potion');
      if (idx < 0) return UIManager.showToast('Нет зелий.', 'warning');
      const item = GameData.ITEMS[p.inventory[idx]];
      p.inventory.splice(idx, 1);
      if (item.heal) PlayerModule.heal(item.heal);
      if (item.restoreEnergy) PlayerModule.restoreEnergy(item.restoreEnergy);
      UIManager.animateHeal('battlePlayerCard', item.heal || item.restoreEnergy || 10);
      logLine(`Использовано ${item.name}.`);
      return enemyTurn();
    }

    if (actionType === 'defend') {
      p.isDefending = true;
      logLine('Вы приняли защитную стойку.');
      return enemyTurn();
    }

    let base = rand(stats.minDamage, stats.maxDamage);
    if (actionType === 'strong') {
      if (!useEnergy(18)) return;
      base = Math.round(base * 1.45);
    }
    if (actionType === 'skill') {
      if (!useEnergy(24)) return;
      base = classSkillDamage();
    }

    const crit = Math.random() <= stats.critChance;
    const damage = Math.max(1, base - (state.monster.defense || 0)) * (crit ? 2 : 1);
    state.monster.hp = Math.max(0, state.monster.hp - damage);
    UIManager.animateDamage('battleMonsterCard', damage, crit);
    logLine(`Вы наносите ${damage}${crit ? ' (Крит!)' : ''}.`);
    render();

    if (state.monster.hp <= 0) return finish('win');
    enemyTurn();
  }

  function enemyTurn() {
    if (!state.active || !state.monster) return;

    const p = PlayerModule.getPlayer();
    const s = PlayerModule.getComputedStats();
    let damage = rand(state.monster.damage[0], state.monster.damage[1]) - s.defense;
    if (p.isDefending) damage = Math.floor(damage * 0.5);
    p.isDefending = false;

    damage = Math.max(1, damage);
    p.hp = Math.max(0, p.hp - damage);
    UIManager.animateDamage('battlePlayerCard', damage, false);
    logLine(`${state.monster.name} наносит ${damage}.`);
    PlayerModule.autosave();
    render();

    if (p.hp <= 0) finish('lose');
  }

  function rollLoot(monster) {
    const items = [];
    const parts = [];

    (monster.lootTable || []).forEach((id) => {
      if (Math.random() <= 0.28 && InventoryModule.addItem(id)) items.push(GameData.ITEMS[id].name);
    });

    (monster.monsterParts || []).forEach((id) => {
      if (Math.random() <= 0.42 && InventoryModule.addItem(id)) parts.push(GameData.ITEMS[id].name);
    });

    (monster.rareLoot || []).forEach((id) => {
      if (Math.random() <= 0.08 && InventoryModule.addItem(id)) items.push(`⭐ ${GameData.ITEMS[id].name}`);
    });

    return { items, parts };
  }

  function finish(result) {
    if (!state.active) return;
    setCombatButtons(true);
    const p = PlayerModule.getPlayer();

    if (result === 'win' && !state.rewardTaken) {
      state.rewardTaken = true;
      const m = state.monster;
      const gold = rand(m.gold[0], m.gold[1]);
      const exp = rand(m.exp[0], m.exp[1]);
      const loot = rollLoot(m);

      PlayerModule.changeGold(gold);
      const leveled = PlayerModule.addExp(exp);
      if (leveled) UIManager.showLevelUpPopup();
      PlayerModule.addWin();

      const loc = LocationsModule.getCurrentLocation();
      if (Math.random() <= (loc?.chestChance || 0)) {
        ChestModule.generateChest(loc.id);
      }

      UIManager.showLootPopup({ gold, exp, items: [...loot.items, ...loot.parts] });
      UIManager.showToast('Вы победили!', 'success');
    }

    if (result === 'lose') {
      PlayerModule.addLoss();
      p.locationId = 'dawn_village';
      p.hp = 1;
      UIManager.showToast('Поражение. Возврат в деревню.', 'error');
    }

    if (result === 'run') {
      UIManager.showToast('Вы сбежали из боя.', 'info');
    }

    p.inBattle = false;
    PlayerModule.autosave();
    PlayerModule.renderTopPanel();
    state.active = false;
    state.monster = null;
    UIManager.setScreen('location');
    LocationsModule.renderLocationsScreen();
  }

  function bind() {
    UIManager.qs('btnAttack')?.addEventListener('click', () => playerAction('attack'));
    UIManager.qs('btnStrongAttack')?.addEventListener('click', () => playerAction('strong'));
    UIManager.qs('btnDefend')?.addEventListener('click', () => playerAction('defend'));
    UIManager.qs('btnUsePotion')?.addEventListener('click', () => playerAction('potion'));
    UIManager.qs('btnSkill')?.addEventListener('click', () => playerAction('skill'));
    UIManager.qs('btnRun')?.addEventListener('click', () => playerAction('run'));
  }

  return { bind, startCombat, spawnMonster };
})();
