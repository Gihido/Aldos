window.CombatModule = (() => {
  const state = {
    active: false,
    monster: null,
    rewardGranted: false,
    defending: false
  };

  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

  function resetState() {
    state.active = false;
    state.monster = null;
    state.rewardGranted = false;
    state.defending = false;
  }

  function getMonster(locationId) {
    const loc = GameData.LOCATIONS.find((l) => l.id === locationId);
    if (!loc?.monsters?.length) return null;
    const template = GameData.MONSTERS[loc.monsters[Math.floor(Math.random() * loc.monsters.length)]];
    if (!template) return null;
    return { ...template, hp: template.hp, maxHp: template.hp };
  }

  function setCombatButtonsDisabled(disabled) {
    ['btnAttack', 'btnStrongAttack', 'btnDefend', 'btnUsePotion', 'btnRun'].forEach((id) => {
      const btn = UIManager.qs(id);
      if (btn) btn.disabled = disabled;
    });
  }

  function log(text) {
    const root = UIManager.qs('combatLog');
    if (!root) return;
    const li = document.createElement('li');
    li.textContent = text;
    root.prepend(li);
  }

  function render() {
    if (!state.monster) return;
    const player = PlayerModule.getPlayer();
    const stats = PlayerModule.getComputedStats();

    UIManager.safeSetText('combatMonsterName', state.monster.name);
    UIManager.updateProgressBar('combatMonsterFill', 'combatMonsterHp', state.monster.hp, state.monster.maxHp);
    UIManager.updateProgressBar('combatPlayerFill', 'combatPlayerHp', player.hp, stats.maxHp);
  }

  function animateMonsterHit(type = 'hit') {
    const card = UIManager.qs('combatMonsterCard');
    if (!card) return;
    card.classList.remove('hit', 'crit');
    void card.offsetWidth;
    card.classList.add(type);
  }

  function startCombat(locationId) {
    if (state.active) return;

    const monster = getMonster(locationId);
    if (!monster) {
      UIManager.showToast('Монстр не найден.', 'error');
      return;
    }

    state.active = true;
    state.monster = monster;
    state.rewardGranted = false;
    state.defending = false;

    UIManager.qs('combatLog').innerHTML = '';
    setCombatButtonsDisabled(false);
    UIManager.openModal('combatModal');
    log(`Появился враг: ${monster.name}`);
    render();
  }

  function spendEnergy(cost) {
    const p = PlayerModule.getPlayer();
    if (p.energy < cost) {
      UIManager.showToast('Недостаточно энергии.', 'warning');
      return false;
    }
    p.energy -= cost;
    PlayerModule.autosave();
    PlayerModule.renderTopPanel();
    return true;
  }

  function rollPlayerDamage(multiplier) {
    const stats = PlayerModule.getComputedStats();
    let dmg = rand(stats.minDamage, stats.maxDamage) * multiplier;
    const crit = Math.random() <= stats.critChance;
    if (crit) dmg *= 1.75;
    return { damage: Math.round(dmg), crit };
  }

  function actionAttack(mode) {
    if (!state.active || !state.monster) return;

    const energyCost = mode === 'strong' ? 18 : 8;
    const mult = mode === 'strong' ? 1.45 : 1;
    if (!spendEnergy(energyCost)) return;

    const { damage, crit } = rollPlayerDamage(mult);
    state.monster.hp = Math.max(0, state.monster.hp - damage);
    animateMonsterHit(crit ? 'crit' : 'hit');
    log(`Вы нанесли ${damage}${crit ? ' (Крит!)' : ''}.`);
    render();

    if (state.monster.hp <= 0) {
      finishCombat('win');
      return;
    }

    enemyTurn();
  }

  function actionDefend() {
    if (!state.active) return;
    state.defending = true;
    log('Вы готовитесь к обороне.');
    enemyTurn();
  }

  function actionPotion() {
    if (!state.active) return;
    const p = PlayerModule.getPlayer();
    const idx = p.inventory.findIndex((id) => GameData.ITEMS[id]?.type === 'potion');
    if (idx === -1) {
      UIManager.showToast('Зелий нет в инвентаре.', 'warning');
      return;
    }
    InventoryModule.renderInventory();
    const potion = GameData.ITEMS[p.inventory[idx]];
    if (potion.heal) PlayerModule.heal(potion.heal);
    if (potion.restoreEnergy) PlayerModule.restoreEnergy(potion.restoreEnergy);
    p.inventory.splice(idx, 1);
    PlayerModule.autosave();
    PlayerModule.renderTopPanel();
    log(`Вы использовали ${potion.name}.`);
    enemyTurn();
  }

  function actionRun() {
    if (!state.active) return;
    finishCombat('run');
  }

  function enemyTurn() {
    if (!state.active || !state.monster) return;

    const p = PlayerModule.getPlayer();
    const stats = PlayerModule.getComputedStats();
    const enemyRaw = rand(state.monster.damage[0], state.monster.damage[1]);
    const blocked = state.defending ? stats.defense * 2 : stats.defense;
    const damage = Math.max(1, enemyRaw - blocked);

    p.hp = Math.max(0, p.hp - damage);
    state.defending = false;

    log(`${state.monster.name} наносит ${damage} урона.`);
    PlayerModule.autosave();
    PlayerModule.renderTopPanel();
    render();

    if (p.hp <= 0) finishCombat('lose');
  }

  function grantRewards() {
    if (!state.monster || state.rewardGranted) return;
    state.rewardGranted = true;

    const m = state.monster;
    const gold = rand(m.rewardGold[0], m.rewardGold[1]);
    const exp = rand(m.rewardExp[0], m.rewardExp[1]);

    PlayerModule.changeGold(gold);
    const levelUp = PlayerModule.addExp(exp);

    const lootNames = [];
    (m.lootTable || []).forEach((drop) => {
      if (Math.random() <= drop.chance && InventoryModule.addItem(drop.itemId)) {
        lootNames.push(GameData.ITEMS[drop.itemId].name);
      }
    });

    if (Math.random() <= (LocationsModule.getCurrentLocation()?.chestChance || 0)) {
      ChestModule.markChestFound(LocationsModule.getCurrentLocation().id);
    }

    const text = `+${gold} 🪙, +${exp} XP${lootNames.length ? `, лут: ${lootNames.join(', ')}` : ''}`;
    UIManager.safeSetText('combatResultText', text);
    UIManager.openModal('combatResultModal');
    UIManager.showToast('Вы победили!', 'success');
    if (levelUp) UIManager.showToast('Уровень повышен!', 'loot');
    UIManager.pushEvent(`Победа в бою: ${text}`);
  }

  function finishCombat(result) {
    if (!state.active) return;
    setCombatButtonsDisabled(true);

    if (result === 'win') {
      log(`Победа над ${state.monster.name}.`);
      grantRewards();
    }

    if (result === 'lose') {
      PlayerModule.applyDefeatPenalty();
      UIManager.safeSetText('combatResultText', 'Вы проиграли и были возвращены в Деревню Рассвета (1 HP).');
      UIManager.openModal('combatResultModal');
      UIManager.showToast('Вы проиграли.', 'error');
      UIManager.pushEvent('Поражение в бою.');
    }

    if (result === 'run') {
      UIManager.showToast('Вы сбежали из боя.', 'info');
      UIManager.pushEvent('Бой завершён бегством.');
    }

    resetState();
    UIManager.closeModal('combatModal');
    PlayerModule.renderTopPanel();
    CharacterModule.renderCharacterScreen();
    LocationsModule.renderLocationsScreen();
  }

  function bind() {
    UIManager.qs('btnAttack')?.addEventListener('click', () => actionAttack('normal'));
    UIManager.qs('btnStrongAttack')?.addEventListener('click', () => actionAttack('strong'));
    UIManager.qs('btnDefend')?.addEventListener('click', actionDefend);
    UIManager.qs('btnUsePotion')?.addEventListener('click', actionPotion);
    UIManager.qs('btnRun')?.addEventListener('click', actionRun);
    UIManager.qs('closeCombatResult')?.addEventListener('click', () => UIManager.closeModal('combatResultModal'));
  }

  return { bind, startCombat };
})();
