window.MainModule = (() => {
  function init() {
    setTimeout(() => UIManager.setScreen('menu'), 550);

    UIManager.bindDrawer();
    bindMenu();
    bindAuth();
    bindCreate();
    bindCommonButtons();

    InventoryModule.bind();
    ShopModule.bind();
    CombatModule.bind();
    ChatModule.bind();
    LeaderboardModule.bind();
    SettingsModule.bind();

    LocalServer.listenServerUpdate(() => {
      if (!PlayerModule.getPlayer()) return;
      OnlineModule.renderOnlineScreen();
      LocationsModule.renderPlayersInCurrentLocation();
      CombatModule.renderActiveBattles();
      ChatModule.renderChat();
      FriendsModule.renderFriendsScreen();
      ClansModule.renderClanScreen();
      LeaderboardModule.renderLeaderboard();
    });
  }

  function bindMenu() {
    UIManager.qs('newGameBtn').onclick = () => UIManager.setScreen('auth');
    UIManager.qs('continueBtn').onclick = () => {
      if (!PlayerModule.loadPlayer()) return UIManager.showToast('Сохранение не найдено.', 'warning');
      enterGame();
    };
  }

  function bindAuth() {
    UIManager.qs('registerBtn').onclick = () => {
      const res = PlayerModule.register(UIManager.qs('authLogin').value.trim(), UIManager.qs('authPassword').value.trim());
      UIManager.showToast(res.ok ? 'Аккаунт создан.' : res.message, res.ok ? 'success' : 'error');
    };

    UIManager.qs('loginBtn').onclick = () => {
      const res = PlayerModule.login(UIManager.qs('authLogin').value.trim(), UIManager.qs('authPassword').value.trim());
      if (!res.ok) return UIManager.showToast(res.message, 'error');
      const p = PlayerModule.loadPlayer();
      if (p && p.account === UIManager.qs('authLogin').value.trim()) enterGame();
      else UIManager.setScreen('create');
    };
  }

  function bindCreate() {
    const cards = UIManager.qs('classCards');
    cards.innerHTML = '';
    Object.values(GameData.CLASSES).forEach((cls) => {
      const card = document.createElement('button');
      card.className = 'class-card';
      card.dataset.cls = cls.id;
      card.innerHTML = `<h4>${cls.icon} ${cls.name}</h4><p>${cls.description}</p><small>HP ${cls.hp} • Урон ${cls.damage[0]}-${cls.damage[1]} • ${cls.feature}</small>`;
      card.onclick = () => {
        document.querySelectorAll('.class-card').forEach((x) => x.classList.remove('selected'));
        card.classList.add('selected');
      };
      cards.append(card);
    });

    UIManager.qs('createPlayerBtn').onclick = () => {
      const selected = document.querySelector('.class-card.selected');
      if (!selected) return UIManager.showToast('Выберите класс.', 'warning');
      const res = PlayerModule.createPlayer(UIManager.qs('createName').value, selected.dataset.cls);
      if (!res.ok) return UIManager.showToast(res.message, 'error');
      enterGame();
    };
  }

  function bindCommonButtons() {
    UIManager.qs('addFriendBtn').onclick = () => {
      FriendsModule.sendFriendRequestByCode(UIManager.qs('friendCodeInput').value.trim());
      UIManager.qs('friendCodeInput').value = '';
    };

    UIManager.qs('createClanBtn').onclick = ClansModule.createClan;
    UIManager.qs('inviteClanBtn').onclick = () => ClansModule.inviteToClan(UIManager.qs('clanInviteInput').value.trim());
    UIManager.qs('acceptClanInviteBtn').onclick = ClansModule.acceptClanInvite;
    UIManager.qs('leaveClanBtn').onclick = ClansModule.leaveClan;
    UIManager.qs('sendClanMsgBtn').onclick = ClansModule.sendClanMessage;
  }

  function enterGame() {
    UIManager.setScreen('game');
    UIManager.setActiveTab('location');

    OnlineModule.init();
    ChatModule.listenChat();
    UIManager.renderPlayerHeader();
    SettingsModule.apply();
    renderCharacter();
    LocationsModule.renderLocations();
    InventoryModule.renderInventory();
    ShopModule.renderShop();
    FriendsModule.renderFriendsScreen();
    ClansModule.renderClanScreen();
    CombatModule.renderActiveBattles();
    LeaderboardModule.renderLeaderboard('level');

    UIManager.showToast(window.FirebaseConfig.USE_FIREBASE ? 'Режим: Firebase (future ready)' : 'Режим: локальный кооператив', 'info');
  }

  function renderCharacter() {
    const p = PlayerModule.getPlayer();
    const s = PlayerModule.getComputedStats();
    UIManager.qs('characterInfo').innerHTML = `${p.name} • ${p.className} • Lv.${p.level}<br>FriendCode: <strong>${p.friendCode}</strong>`;

    const list = UIManager.qs('characterStats');
    list.innerHTML = `
      <li>HP: ${p.hp}/${s.maxHp}</li>
      <li>Энергия: ${p.energy}/${p.maxEnergy}</li>
      <li>Опыт: ${p.exp}/${PlayerModule.expToNextLevel()}</li>
      <li>Золото: ${p.gold}</li>
      <li>Урон: ${s.minDamage}-${s.maxDamage}</li>
      <li>Защита: ${s.defense}</li>
      <li>Победы / Поражения: ${p.wins} / ${p.losses}</li>
      <li>Оружие: ${GameData.ITEMS[p.equipment.weapon]?.name || 'Нет'}</li>
      <li>Броня: ${GameData.ITEMS[p.equipment.armor]?.name || 'Нет'}</li>
    `;
  }

  return { init, renderCharacter };
})();

MainModule.init();
