window.CharacterModule = (() => {
  function renderCharacterScreen() {
    const p = PlayerModule.getPlayer();
    if (!p) return;
    const stats = PlayerModule.getComputedStats();

    UIManager.safeSetText('charName', p.nickname);
    UIManager.safeSetText('charClass', p.className);
    UIManager.safeSetText('charLevel', `Lv.${p.level}`);
    UIManager.safeSetText('charExp', `${p.exp} / ${PlayerModule.expToNextLevel()}`);
    UIManager.safeSetText('charGold', `${p.gold} 🪙`);
    UIManager.safeSetText('charStats', `⚔️ ${stats.minDamage}-${stats.maxDamage} • 🛡️ ${stats.defense} • ✨ ${(stats.critChance * 100).toFixed(0)}%`);

    UIManager.safeSetText('eqWeapon', PlayerModule.getEquippedItem('weapon')?.name || 'Нет');
    UIManager.safeSetText('eqArmor', PlayerModule.getEquippedItem('armor')?.name || 'Нет');
    UIManager.safeSetText('eqAmulet', PlayerModule.getEquippedItem('amulet')?.name || 'Нет');
    UIManager.safeSetText('eqRing', PlayerModule.getEquippedItem('ring')?.name || 'Нет');
  }

  function quickHeal() {
    const p = PlayerModule.getPlayer();
    if (!p) return;
    const idx = p.inventory.findIndex((id) => GameData.ITEMS[id]?.type === 'potion' && GameData.ITEMS[id]?.heal);
    if (idx === -1) {
      UIManager.showToast('Нет зелья HP.', 'warning');
      return;
    }

    const potion = GameData.ITEMS[p.inventory[idx]];
    p.inventory.splice(idx, 1);
    PlayerModule.heal(potion.heal || 0);
    PlayerModule.renderTopPanel();
    InventoryModule.renderInventory();
    renderCharacterScreen();
    UIManager.showToast(`Использовано ${potion.name}.`, 'success');
  }

  return { renderCharacterScreen, quickHeal };
})();

(function bootstrap() {
  setTimeout(() => UIManager.showScreen('menuScreen'), 850);

  bindMenu();
  bindAuth();
  bindCharacterCreate();
  bindGameNavigation();

  LocationsModule.bind();
  CombatModule.bind();
  ChatModule.bind();
  InventoryModule.bind();
  ChestModule.bind();

  setInterval(() => {
    if (PlayerModule.getPlayer()) {
      MultiplayerModule.updateOnlineStatus();
      PlayerModule.autosave();
    }
  }, 15000);

  function bindMenu() {
    UIManager.qs('newGameBtn')?.addEventListener('click', () => UIManager.showScreen('authScreen'));
    UIManager.qs('continueBtn')?.addEventListener('click', () => {
      const player = PlayerModule.loadPlayer();
      if (!player) {
        UIManager.showToast('Сохранение не найдено. Начните новую игру.', 'warning');
        UIManager.showScreen('authScreen');
        return;
      }
      enterGame();
    });
  }

  function bindAuth() {
    UIManager.qs('registerBtn')?.addEventListener('click', () => {
      const login = UIManager.qs('authLogin')?.value?.trim();
      const pass = UIManager.qs('authPassword')?.value?.trim();
      const result = PlayerModule.register(login, pass);
      UIManager.showToast(result.ok ? 'Регистрация успешна.' : result.message, result.ok ? 'success' : 'error');
    });

    UIManager.qs('loginBtn')?.addEventListener('click', () => {
      const login = UIManager.qs('authLogin')?.value?.trim();
      const pass = UIManager.qs('authPassword')?.value?.trim();
      const result = PlayerModule.login(login, pass);
      if (!result.ok) {
        UIManager.showToast(result.message, 'error');
        return;
      }

      const saved = PlayerModule.loadPlayer();
      if (saved && saved.accountName === login) {
        enterGame();
      } else {
        UIManager.showScreen('characterCreateScreen');
      }
    });
  }

  function bindCharacterCreate() {
    const classGrid = UIManager.qs('classGrid');
    Object.values(GameData.CLASSES).forEach((klass) => {
      const card = document.createElement('button');
      card.className = 'class-card';
      card.dataset.classId = klass.id;
      card.innerHTML = `<h4>${klass.icon} ${klass.name}</h4><p>${klass.description}</p>`;
      card.addEventListener('click', () => {
        document.querySelectorAll('.class-card').forEach((x) => x.classList.remove('selected'));
        card.classList.add('selected');
      });
      classGrid?.append(card);
    });

    UIManager.qs('createCharacterBtn')?.addEventListener('click', () => {
      const nickname = UIManager.qs('heroName')?.value?.trim();
      const selected = document.querySelector('.class-card.selected');
      if (!selected) {
        UIManager.showToast('Выберите класс.', 'warning');
        return;
      }
      const result = PlayerModule.createCharacter(nickname, selected.dataset.classId);
      if (!result.ok) {
        UIManager.showToast(result.message, 'error');
        return;
      }
      enterGame();
    });
  }

  function bindGameNavigation() {
    document.querySelectorAll('.bottom-nav button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        UIManager.setActiveTab(tab);

        if (tab === 'location') LocationsModule.renderLocationsScreen();
        if (tab === 'character') CharacterModule.renderCharacterScreen();
        if (tab === 'inventory') InventoryModule.renderInventory();
        if (tab === 'chat') ChatModule.renderChat();
        if (tab === 'shop') ShopModule.renderShop();
      });
    });

    UIManager.qs('healBtn')?.addEventListener('click', CharacterModule.quickHeal);
    UIManager.qs('openOnlineBtn')?.addEventListener('click', () => {
      UIManager.setActiveTab('online');
      MultiplayerModule.renderOnlineList();
    });
    UIManager.qs('openSettingsBtn')?.addEventListener('click', () => UIManager.setActiveTab('settings'));

    UIManager.qs('backFromOnline')?.addEventListener('click', () => UIManager.setActiveTab('character'));
    UIManager.qs('backFromSettings')?.addEventListener('click', () => UIManager.setActiveTab('character'));
  }

  function enterGame() {
    const p = PlayerModule.loadPlayer();
    if (!p) {
      PlayerModule.recoverCorruptedSave();
    }

    UIManager.showScreen('gameScreen');
    UIManager.setActiveTab('location');

    PlayerModule.renderTopPanel();
    CharacterModule.renderCharacterScreen();
    LocationsModule.renderLocationsScreen();
    InventoryModule.renderInventory();
    ShopModule.renderShop();
    ChatModule.setChannel('global');
    ChatModule.renderChat();

    MultiplayerModule.listenOnlinePlayers();
    MultiplayerModule.updateOnlineStatus();

    UIManager.showToast('Добро пожаловать в Тени Старого Королевства!', 'info');
  }
})();
