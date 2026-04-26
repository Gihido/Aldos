window.CombatModule = (() => {
  let currentBattleId = null;

  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

  function createActiveBattle(locationId, invitedPlayerId = null) {
    const p = PlayerModule.getPlayer();
    if (p.inBattleId) return UIManager.showToast('Вы уже в бою.', 'warning');

    const loc = GameData.LOCATIONS.find((l) => l.id === locationId);
    if (!loc?.monsters?.length) return UIManager.showToast('В этой локации нет монстров.', 'warning');
    const m = GameData.MONSTERS[loc.monsters[Math.floor(Math.random() * loc.monsters.length)]];

    const state = LocalServer.getState();
    const battleId = `battle_${Date.now()}`;
    state.activeBattles[battleId] = {
      battleId,
      locationId,
      monster: { ...m, currentHp: m.hp },
      participants: [p.playerId, ...(invitedPlayerId ? [invitedPlayerId] : [])],
      status: 'active',
      log: [`${p.name} начал бой.`],
      rewardsGiven: false,
      createdAt: Date.now()
    };

    p.inBattleId = battleId;
    p.hp = Math.max(1, p.hp);
    PlayerModule.savePlayer();
    LocalServer.setState(state);
    openBattleView(battleId);
  }

  function getActiveBattles() {
    return Object.values(LocalServer.getState().activeBattles || {});
  }

  function renderActiveBattles() {
    const box = UIManager.qs('activeBattlesList');
    box.innerHTML = '';
    const battles = getActiveBattles();
    if (!battles.length) {
      box.innerHTML = '<li>Активных боёв нет.</li>';
      return;
    }

    battles.forEach((b) => {
      const li = document.createElement('li');
      li.innerHTML = `<div><strong>${b.monster.name}</strong> • ${b.locationId} • HP ${b.monster.currentHp}/${b.monster.hp} • участников: ${b.participants.length} • ${b.status}</div>`;
      li.append(UIManager.makeButton('Присоединиться', 'gold', () => joinBattle(b.battleId), b.status !== 'active'));
      box.append(li);
    });
  }

  function startBattle(locationId) {
    createActiveBattle(locationId);
  }

  function invitePlayerToBattle(targetPlayerId) {
    const me = PlayerModule.getPlayer();
    if (targetPlayerId === me.playerId) return UIManager.showToast('Нельзя пригласить себя.', 'warning');
    const target = OnlineModule.getOnlinePlayers().find((p) => p.playerId === targetPlayerId);
    if (!target) return UIManager.showToast('Игрок офлайн.', 'warning');
    createActiveBattle(me.locationId, targetPlayerId);
  }

  function openBattleView(battleId) {
    currentBattleId = battleId;
    UIManager.setActiveTab('activeBattles');
    renderBattleView();
  }

  function joinBattle(battleId) {
    const p = PlayerModule.getPlayer();
    if (p.inBattleId) return UIManager.showToast('Сначала завершите текущий бой.', 'warning');

    const state = LocalServer.getState();
    const b = state.activeBattles[battleId];
    if (!b || b.status !== 'active') return UIManager.showToast('Бой недоступен.', 'warning');

    if (!b.participants.includes(p.playerId)) b.participants.push(p.playerId);
    p.inBattleId = battleId;
    PlayerModule.savePlayer();
    LocalServer.setState(state);
    openBattleView(battleId);
  }

  function leaveBattle() {
    const p = PlayerModule.getPlayer();
    if (!p.inBattleId) return;
    const state = LocalServer.getState();
    const b = state.activeBattles[p.inBattleId];
    if (b) {
      b.participants = b.participants.filter((id) => id !== p.playerId);
      b.log.push(`${p.name} покинул бой.`);
      if (!b.participants.length || b.status !== 'active') delete state.activeBattles[b.battleId];
    }
    p.inBattleId = null;
    p.hp = Math.max(1, p.hp);
    PlayerModule.savePlayer();
    LocalServer.setState(state);
    renderActiveBattles();
  }

  function playerAttack(type) {
    const p = PlayerModule.getPlayer();
    const state = LocalServer.getState();
    const b = state.activeBattles[p.inBattleId];
    if (!b || b.status !== 'active') return;
    if (b.monster.currentHp <= 0) return;

    let dmg = rand(PlayerModule.getComputedStats().minDamage, PlayerModule.getComputedStats().maxDamage);
    if (type === 'strong') dmg = Math.round(dmg * 1.45);
    if (type === 'defense') { p.defending = true; dmg = 0; }
    if (type === 'potion') {
      const idx = p.inventory.findIndex((id) => GameData.ITEMS[id]?.type === 'potion');
      if (idx >= 0) {
        const pot = GameData.ITEMS[p.inventory[idx]];
        p.inventory.splice(idx, 1);
        PlayerModule.heal(pot.heal || 0);
        b.log.push(`${p.name} использует ${pot.name}.`);
      }
      LocalServer.setState(state);
      return renderBattleView();
    }

    if (dmg > 0) {
      const real = Math.max(1, dmg - b.monster.defense);
      b.monster.currentHp = Math.max(0, b.monster.currentHp - real);
      b.log.push(`${p.name} наносит ${real} урона.`);
      UIManager.animateDamage('battleMonsterCard', real, Math.random() < 0.2);
    }

    if (b.monster.currentHp <= 0) return finishBattle();
    monsterTurn();
    PlayerModule.savePlayer();
    LocalServer.setState(state);
    renderBattleView();
  }

  function monsterTurn() {
    const p = PlayerModule.getPlayer();
    const state = LocalServer.getState();
    const b = state.activeBattles[p.inBattleId];
    if (!b || b.status !== 'active') return;

    b.participants.forEach((participantId) => {
      if (participantId !== p.playerId) return;
      let damage = rand(b.monster.damage[0], b.monster.damage[1]) - PlayerModule.getComputedStats().defense;
      if (p.defending) damage = Math.floor(damage * 0.5);
      p.defending = false;
      damage = Math.max(1, damage);
      p.hp = Math.max(0, p.hp - damage);
      b.log.push(`${b.monster.name} наносит ${damage} игроку ${p.name}.`);
      UIManager.animateDamage('battlePlayerCard', damage);
      if (p.hp <= 0) {
        p.hp = 1;
        p.losses += 1;
        leaveBattle();
      }
    });
  }

  function finishBattle() {
    const p = PlayerModule.getPlayer();
    const state = LocalServer.getState();
    const b = state.activeBattles[p.inBattleId];
    if (!b || b.status !== 'active') return;

    b.status = 'finished';
    b.log.push('Монстр побеждён.');
    giveBattleRewards();
    delete state.activeBattles[b.battleId];
    p.inBattleId = null;
    PlayerModule.savePlayer();
    LocalServer.setState(state);
    renderActiveBattles();
  }

  function giveBattleRewards() {
    const p = PlayerModule.getPlayer();
    const state = LocalServer.getState();
    const b = state.activeBattles[p.inBattleId];
    if (!b || b.rewardsGiven) return;

    b.rewardsGiven = true;
    const members = Math.max(1, b.participants.length);
    const gold = Math.round(rand(b.monster.gold[0], b.monster.gold[1]) / members);
    const exp = Math.round(rand(b.monster.exp[0], b.monster.exp[1]) / members);

    PlayerModule.changeGold(gold);
    const levelUp = PlayerModule.addExp(exp);
    if (levelUp) UIManager.showModal('Уровень повышен!', '<p>Ваш герой стал сильнее.</p>', [{ label: 'Ок', type: 'gold', onClick: UIManager.closeModal }]);

    const loot = [];
    b.monster.lootTable.forEach((id) => {
      if (Math.random() < 0.25 && InventoryModule.addItem(id)) loot.push(GameData.ITEMS[id].name);
    });
    b.monster.rareLoot.forEach((id) => {
      if (Math.random() < 0.08 && InventoryModule.addItem(id)) loot.push(`⭐ ${GameData.ITEMS[id].name}`);
    });

    p.wins += 1;
    PlayerModule.savePlayer();
    UIManager.showModal('Добыча', `<p>+${gold} 🪙, +${exp} XP</p><p>${loot.join(', ') || 'Без предметов'}</p>`, [{ label: 'Забрать', type: 'gold', onClick: UIManager.closeModal }]);
  }

  function renderBattleView() {
    const p = PlayerModule.getPlayer();
    const battle = LocalServer.getState().activeBattles[p.inBattleId || currentBattleId];
    const panel = UIManager.qs('battlePanel');
    if (!battle) {
      panel.innerHTML = '<p>Вы не в бою.</p>';
      return;
    }

    panel.innerHTML = `
      <h4>${battle.monster.name}</h4>
      <div class="battle-cards">
        <article id="battlePlayerCard" class="battle-card"><strong>${p.name}</strong><div class="bar hp"><i id="battlePlayerFill"></i></div><small id="battlePlayerHp"></small></article>
        <article id="battleMonsterCard" class="battle-card"><strong>${battle.monster.name}</strong><div class="bar enemy"><i id="battleMonsterFill"></i></div><small id="battleMonsterHp"></small></article>
      </div>
      <div class="row wrap">
        <button id="battleAttackBtn" class="btn primary">Атака</button>
        <button id="battleStrongBtn" class="btn gold">Сильный удар</button>
        <button id="battleDefBtn" class="btn secondary">Защита</button>
        <button id="battlePotionBtn" class="btn secondary">Зелье</button>
        <button id="battleLeaveBtn" class="btn danger">Сбежать</button>
      </div>
      <ul id="battleLog" class="list-box"></ul>
    `;

    setHpBars(p, battle.monster);
    const log = UIManager.qs('battleLog');
    battle.log.slice(-20).forEach((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      log.prepend(li);
    });

    UIManager.qs('battleAttackBtn').onclick = () => playerAttack('attack');
    UIManager.qs('battleStrongBtn').onclick = () => playerAttack('strong');
    UIManager.qs('battleDefBtn').onclick = () => playerAttack('defense');
    UIManager.qs('battlePotionBtn').onclick = () => playerAttack('potion');
    UIManager.qs('battleLeaveBtn').onclick = leaveBattle;
  }

  function setHpBars(player, monster) {
    UIManager.qs('battlePlayerFill').style.width = `${(player.hp / Math.max(1, PlayerModule.getComputedStats().maxHp)) * 100}%`;
    UIManager.qs('battlePlayerHp').textContent = `${player.hp} / ${PlayerModule.getComputedStats().maxHp}`;
    UIManager.qs('battleMonsterFill').style.width = `${(monster.currentHp / monster.hp) * 100}%`;
    UIManager.qs('battleMonsterHp').textContent = `${monster.currentHp} / ${monster.hp}`;
  }

  function bind() {
    LocalServer.listenServerUpdate(() => {
      renderActiveBattles();
      renderBattleView();
    });
  }

  return {
    startBattle,
    openBattleView,
    joinBattle,
    leaveBattle,
    playerAttack,
    monsterTurn,
    finishBattle,
    giveBattleRewards,
    renderBattleView,
    createActiveBattle,
    getActiveBattles,
    renderActiveBattles,
    invitePlayerToBattle,
    bind
  };
})();
