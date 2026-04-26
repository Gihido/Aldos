window.MainUI = (() => {
  const screens = ['loadingScreen', 'menuScreen', 'authScreen', 'characterScreen', 'gameScreen'];

  function showScreen(id) {
    screens.forEach((screen) => document.getElementById(screen).classList.toggle('active', screen === id));
  }

  function notify(text, type = 'info') {
    const root = document.getElementById('notificationStack');
    const el = document.createElement('div');
    el.className = `notify ${type}`;
    el.textContent = text;
    root.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function logEvent(text) {
    const list = document.getElementById('eventLog');
    const li = document.createElement('li');
    li.textContent = `${new Date().toLocaleTimeString('ru-RU')}: ${text}`;
    list.prepend(li);
  }

  function makeButton(text, variant, onClick, disabled = false) {
    const btn = document.createElement('button');
    btn.className = `btn ${variant}`;
    btn.textContent = text;
    btn.disabled = disabled;
    btn.addEventListener('click', onClick);
    return btn;
  }

  return { showScreen, notify, logEvent, makeButton };
})();

(function initApp() {
  const START_DELAY = 900;

  setTimeout(() => {
    MainUI.showScreen('menuScreen');

    const existing = PlayerModule.loadPlayer();
    if (existing) {
      MainUI.notify(`С возвращением, ${existing.nickname}!`, 'info');
    }
  }, START_DELAY);

  bindMenu();
  bindAuth();
  bindCharacterCreation();
  bindBottomNav();

  CombatModule.bindActions();
  ChestModule.bind();
  ShopModule.bind();
  ChatModule.bind();
  InventoryModule.bindFilters();

  setInterval(() => {
    if (PlayerModule.getPlayer()) {
      MultiplayerModule.updateOnlineStatus();
      PlayerModule.savePlayer();
    }
  }, 15000);

  function bindMenu() {
    document.getElementById('btnNewGame').addEventListener('click', () => MainUI.showScreen('authScreen'));
    document.getElementById('btnContinue').addEventListener('click', () => {
      const p = PlayerModule.loadPlayer();
      if (!p) {
        MainUI.notify('Сохранение не найдено. Создайте нового героя.', 'warn');
        return MainUI.showScreen('authScreen');
      }
      enterGame();
    });
  }

  function bindAuth() {
    document.getElementById('btnRegister').addEventListener('click', () => {
      const user = document.getElementById('authUsername').value.trim();
      const pass = document.getElementById('authPassword').value.trim();
      if (!user || !pass) return MainUI.notify('Введите логин и пароль.', 'warn');
      const res = PlayerModule.register(user, pass);
      if (!res.ok) return MainUI.notify(res.message, 'danger');
      MainUI.notify('Регистрация успешна. Теперь войдите.', 'success');
    });

    document.getElementById('btnLogin').addEventListener('click', () => {
      const user = document.getElementById('authUsername').value.trim();
      const pass = document.getElementById('authPassword').value.trim();
      const res = PlayerModule.login(user, pass);
      if (!res.ok) return MainUI.notify(res.message, 'danger');

      if (PlayerModule.loadPlayer() && PlayerModule.getPlayer().accountName === user) {
        enterGame();
      } else {
        MainUI.showScreen('characterScreen');
      }
    });
  }

  function bindCharacterCreation() {
    const holder = document.getElementById('classCards');
    Object.values(GameData.CLASSES).forEach((klass) => {
      const card = document.createElement('button');
      card.className = 'class-card';
      card.dataset.classId = klass.id;
      card.innerHTML = `<h4>${klass.icon} ${klass.name}</h4><p>${klass.description}</p>`;
      card.addEventListener('click', () => {
        document.querySelectorAll('.class-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
      });
      holder.appendChild(card);
    });

    document.getElementById('btnCreateCharacter').addEventListener('click', () => {
      const nickname = document.getElementById('characterNickname').value.trim();
      const selected = document.querySelector('.class-card.selected');
      if (!nickname || !selected) return MainUI.notify('Введите ник и выберите класс.', 'warn');
      const ok = PlayerModule.createCharacter(nickname, selected.dataset.classId);
      if (!ok) return MainUI.notify('Ошибка создания персонажа.', 'danger');
      enterGame();
    });
  }

  function enterGame() {
    MainUI.showScreen('gameScreen');
    PlayerModule.renderPanel();
    LocationsModule.renderLocations();
    InventoryModule.renderInventory();
    MultiplayerModule.listenOnlinePlayers();
    MultiplayerModule.updateOnlineStatus();
    ChatModule.render();
  }

  function bindBottomNav() {
    const sections = document.querySelectorAll('.section');
    document.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        sections.forEach((s) => s.classList.toggle('active', s.id === `${tab}Section`));
        if (tab === 'chat') ChatModule.open();
        if (tab === 'shop') {
          const p = PlayerModule.getPlayer();
          const loc = GameData.LOCATIONS.find((l) => l.id === p.locationId);
          if (!loc.hasMerchant) return MainUI.notify('В этой локации нет торговца.', 'warn');
          ShopModule.open();
        }
      });
    });
  }
})();
