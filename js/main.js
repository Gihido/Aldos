window.CharacterModule = (() => {
  function renderCharacterScreen() {
    const p = PlayerModule.getPlayer();
    if (!p) return;
    const s = PlayerModule.getComputedStats();
    UIManager.safeSetText('charName', p.nickname);
    UIManager.safeSetText('charClass', p.className);
    UIManager.safeSetText('charLevel', `Lv.${p.level}`);
    UIManager.safeSetText('charExp', `${p.exp}/${PlayerModule.expToNextLevel()}`);
    UIManager.safeSetText('charGold', `${p.gold} 🪙`);
    UIManager.safeSetText('charStats', `⚔️ ${s.minDamage}-${s.maxDamage} • 🛡️ ${s.defense} • ✨ ${(s.critChance * 100).toFixed(0)}%`);
    UIManager.safeSetText('eqWeapon', GameData.ITEMS[p.equipment.weapon]?.name || 'Нет');
    UIManager.safeSetText('eqArmor', GameData.ITEMS[p.equipment.armor]?.name || 'Нет');
    UIManager.safeSetText('eqAmulet', GameData.ITEMS[p.equipment.amulet]?.name || 'Нет');
    UIManager.safeSetText('eqRing', GameData.ITEMS[p.equipment.ring]?.name || 'Нет');
  }

  return { renderCharacterScreen };
})();

(function init() {
  setTimeout(() => UIManager.showScreen('menuScreen'), 700);

  bindMenu();
  bindAuth();
  bindCreateHero();
  bindBottomNav();
  bindSideActions();

  CombatModule.bind();
  InventoryModule.bind();
  LocationsModule.bind();
  ChatModule.bind();
  LeaderboardModule.bind();
  SettingsModule.bind();

  setInterval(() => {
    if (!PlayerModule.getPlayer()) return;
    OnlineModule.savePlayerOnline();
    LeaderboardModule.updateLeaderboard();
  }, 20000);

  function bindMenu() {
    UIManager.qs('newGameBtn')?.addEventListener('click', () => UIManager.showScreen('authScreen'));
    UIManager.qs('continueBtn')?.addEventListener('click', () => {
      const p = PlayerModule.loadPlayer();
      if (!p) return UIManager.showToast('Сохранение не найдено.', 'warning');
      enterGame();
    });
  }

  function bindAuth() {
    UIManager.qs('registerBtn')?.addEventListener('click', () => {
      const res = PlayerModule.register(UIManager.qs('authLogin').value.trim(), UIManager.qs('authPassword').value.trim());
      UIManager.showToast(res.ok ? 'Регистрация успешна.' : res.message, res.ok ? 'success' : 'error');
    });

    UIManager.qs('loginBtn')?.addEventListener('click', () => {
      const res = PlayerModule.login(UIManager.qs('authLogin').value.trim(), UIManager.qs('authPassword').value.trim());
      if (!res.ok) return UIManager.showToast(res.message, 'error');

      const p = PlayerModule.loadPlayer();
      if (p && p.accountName === UIManager.qs('authLogin').value.trim()) enterGame();
      else UIManager.showScreen('characterCreateScreen');
    });
  }

  function bindCreateHero() {
    const grid = UIManager.qs('classGrid');
    Object.values(GameData.CLASSES).forEach((c) => {
      const card = document.createElement('button');
      card.className = 'class-card';
      card.dataset.classId = c.id;
      card.innerHTML = `<h4>${c.icon} ${c.name}</h4>`;
      card.onclick = () => {
        document.querySelectorAll('.class-card').forEach((x) => x.classList.remove('selected'));
        card.classList.add('selected');
      };
      grid.append(card);
    });

    UIManager.qs('createCharacterBtn')?.addEventListener('click', () => {
      const selected = document.querySelector('.class-card.selected');
      if (!selected) return UIManager.showToast('Выберите класс.', 'warning');
      const res = PlayerModule.createCharacter(UIManager.qs('heroName').value, selected.dataset.classId);
      if (!res.ok) return UIManager.showToast(res.message, 'error');
      enterGame();
    });
  }

  function bindBottomNav() {
    document.querySelectorAll('.bottom-nav button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        UIManager.setActiveTab(tab);

        if (tab === 'location') LocationsModule.renderLocationsScreen();
        if (tab === 'battle') UIManager.setActiveTab('battle');
        if (tab === 'inventory') InventoryModule.renderInventory();
        if (tab === 'chat') ChatModule.listenChat('global');
        if (tab === 'clan') ClansModule.renderClanScreen();
        if (tab === 'leaderboard') LeaderboardModule.renderLeaderboard('level');
        if (tab === 'settings') SettingsModule.loadSettings();
      });
    });
  }

  function bindSideActions() {
    UIManager.qs('openOnlineBtn')?.addEventListener('click', () => UIManager.setActiveTab('online'));
    UIManager.qs('dailyChestBtn')?.addEventListener('click', () => ChestModule.openDailyChest());
    UIManager.qs('clanChestBtn')?.addEventListener('click', () => ChestModule.openClanChest());
    UIManager.qs('createClanBtn')?.addEventListener('click', () => ClansModule.createClan(UIManager.qs('clanNameInput').value, UIManager.qs('clanTagInput').value, UIManager.qs('clanDescInput').value));
    UIManager.qs('inviteClanBtn')?.addEventListener('click', () => ClansModule.invitePlayerToClan(UIManager.qs('inviteClanInput').value));
    UIManager.qs('leaveClanBtn')?.addEventListener('click', ClansModule.leaveClan);

    UIManager.qs('partyAttackBtn')?.addEventListener('click', () => PartyCombatModule.playerBattleAction('attack'));
    UIManager.qs('partyStrongBtn')?.addEventListener('click', () => PartyCombatModule.playerBattleAction('strong'));
    UIManager.qs('partyDefBtn')?.addEventListener('click', () => PartyCombatModule.playerBattleAction('defend'));
    UIManager.qs('partyPotionBtn')?.addEventListener('click', () => PartyCombatModule.playerBattleAction('potion'));
    UIManager.qs('partySkillBtn')?.addEventListener('click', () => PartyCombatModule.playerBattleAction('skill'));
    UIManager.qs('partyRunBtn')?.addEventListener('click', () => PartyCombatModule.playerBattleAction('run'));

    UIManager.qs('openAdminBtn')?.addEventListener('click', AdminModule.renderAdminPanel);
  }

  async function enterGame() {
    UIManager.showScreen('gameScreen');
    UIManager.setActiveTab('location');

    PlayerModule.renderTopPanel();
    CharacterModule.renderCharacterScreen();
    LocationsModule.renderLocationsScreen();
    InventoryModule.renderInventory();
    ShopModule.renderShop();

    await OnlineModule.initOnlineSystem();
    MultiplayerModule.listenOnline();
    PartyCombatModule.listenInvites();
    ChatModule.listenChat('global');
    LeaderboardModule.listenLeaderboard();
    LeaderboardModule.updateLeaderboard();
    RegenModule.startAutoRegen();

    UIManager.qs('openAdminBtn')?.classList.toggle('hidden', !AdminModule.canUseAdmin());
    UIManager.showToast(window.FirebaseConfig.USE_FIREBASE ? 'ONLINE_MODE активен' : 'OFFLINE_MODE активен', 'info');
  }
})();
