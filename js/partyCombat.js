window.PartyCombatModule = (() => {
  const state = { currentBattleId: null, invitesUnsub: null, battleUnsub: null };

  async function createBattleInvite(targetPlayerId) {
    const me = PlayerModule.getPlayer();
    if (!me) return;
    const myId = OnlineModule.getCurrentUserId();
    if (targetPlayerId === myId) return UIManager.showToast('Нельзя пригласить себя.', 'warning');

    const target = await ServerAPI.get(`playersOnline/${targetPlayerId}`, null);
    if (!target) return UIManager.showToast('Игрок офлайн.', 'error');

    await ServerAPI.push('battleInvites', {
      fromId: myId,
      fromName: me.nickname,
      toId: targetPlayerId,
      status: 'pending',
      createdAt: Date.now()
    });
    UIManager.showToast(`Приглашение отправлено ${target.nickname}.`, 'info');
  }

  async function acceptBattleInvite(inviteId) {
    const invites = (await ServerAPI.get('battleInvites', [])) || [];
    const invite = invites.find((x) => x.id === inviteId);
    if (!invite) return;
    invite.status = 'accepted';
    await ServerAPI.set('battleInvites', invites);
    await createPartyBattle([invite.fromId, invite.toId]);
  }

  async function declineBattleInvite(inviteId) {
    const invites = (await ServerAPI.get('battleInvites', [])) || [];
    const invite = invites.find((x) => x.id === inviteId);
    if (!invite) return;
    invite.status = 'declined';
    await ServerAPI.set('battleInvites', invites);
  }

  async function createPartyBattle(players) {
    const loc = LocationsModule.getCurrentLocation();
    const mons = [CombatModule.spawnMonster(loc.id), CombatModule.spawnMonster(loc.id)].filter(Boolean);
    const battleId = await ServerAPI.push('battles', {
      players,
      monsters: mons,
      turnIndex: 0,
      battleLog: ['Совместный бой начался.'],
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    state.currentBattleId = battleId;
    listenBattleRoom(battleId);
    UIManager.setScreen('battleTab');
    UIManager.showToast('Совместный бой создан.', 'success');
  }

  function listenBattleRoom(battleId) {
    state.battleUnsub?.();
    state.battleUnsub = ServerAPI.listen('battles', (list) => {
      const room = (list || []).find((b) => b.id === battleId);
      if (!room) return;
      UIManager.safeSetText('battleTurnText', `Сейчас ходит: ${room.players[room.turnIndex % room.players.length]}`);
      const log = UIManager.qs('battleLog');
      if (log) {
        log.innerHTML = '';
        room.battleLog.slice(-14).forEach((x) => {
          const li = document.createElement('li');
          li.textContent = x;
          log.prepend(li);
        });
      }
    });
  }

  async function playerBattleAction(actionType) {
    if (!state.currentBattleId) return;
    const list = (await ServerAPI.get('battles', [])) || [];
    const room = list.find((x) => x.id === state.currentBattleId);
    if (!room || room.status !== 'active') return;

    const actor = OnlineModule.getCurrentUserId();
    const expected = room.players[room.turnIndex % room.players.length];
    if (actor !== expected) return UIManager.showToast('Сейчас ход другого игрока.', 'warning');

    if (!room.monsters.length) return endPartyBattle();
    const mon = room.monsters[0];
    const dmg = actionType === 'strong' ? 22 : actionType === 'skill' ? 26 : 14;
    mon.hp = Math.max(0, mon.hp - dmg);
    room.battleLog.push(`${actor}: ${actionType} (-${dmg} HP ${mon.name})`);
    if (mon.hp <= 0) room.monsters.shift();

    room.turnIndex += 1;
    room.updatedAt = Date.now();
    if (!room.monsters.length) {
      room.status = 'finished';
      room.battleLog.push('Монстры повержены!');
    }

    await ServerAPI.set('battles', list);
    if (room.status === 'finished') {
      await splitBattleRewards(room.players);
      await endPartyBattle();
    }
  }

  async function splitBattleRewards(players) {
    const rewardGold = 100;
    const rewardExp = 120;
    if (players.includes(OnlineModule.getCurrentUserId())) {
      PlayerModule.changeGold(Math.round(rewardGold / players.length));
      const levelUp = PlayerModule.addExp(Math.round(rewardExp / players.length));
      if (levelUp) UIManager.showLevelUpPopup();
      PlayerModule.autosave();
    }
  }

  async function endPartyBattle() {
    UIManager.showToast('Совместный бой завершён.', 'success');
    state.currentBattleId = null;
    state.battleUnsub?.();
    UIManager.setScreen('locationTab');
  }

  function listenInvites() {
    const myId = OnlineModule.getCurrentUserId();
    state.invitesUnsub?.();
    state.invitesUnsub = ServerAPI.listen('battleInvites', (list) => {
      const invites = (list || []).filter((i) => i.toId === myId && i.status === 'pending');
      const box = UIManager.qs('inviteList');
      if (!box) return;
      box.innerHTML = '';
      invites.forEach((inv) => {
        const row = document.createElement('div');
        row.className = 'invite-row';
        row.innerHTML = `<span>${inv.fromName} приглашает в бой</span>`;
        row.append(UIManager.makeButton('Принять', 'gold', () => acceptBattleInvite(inv.id)));
        row.append(UIManager.makeButton('Отклонить', 'secondary', () => declineBattleInvite(inv.id)));
        box.append(row);
      });
    });
  }

  return {
    createBattleInvite,
    acceptBattleInvite,
    declineBattleInvite,
    createPartyBattle,
    listenBattleRoom,
    playerBattleAction,
    endPartyBattle,
    splitBattleRewards,
    listenInvites
  };
})();
