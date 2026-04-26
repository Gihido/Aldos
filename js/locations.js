window.LocationsModule = (() => {
  function renderLocations() {
    const p = PlayerModule.getPlayer();
    const root = document.getElementById('locationsList');
    root.innerHTML = '';

    GameData.LOCATIONS.forEach((loc) => {
      const locked = p.level < loc.minLevel;
      const card = document.createElement('div');
      card.className = `location-card ${locked ? 'locked' : ''}`;
      card.innerHTML = `
        <h4>${loc.icon} ${loc.name}</h4>
        <p>${loc.description}</p>
        <small>Мин. уровень: ${loc.minLevel}</small>
        <div class="location-actions"></div>
      `;
      const actions = card.querySelector('.location-actions');
      actions.appendChild(MainUI.makeButton('Перейти', locked ? 'disabled' : 'primary', () => goLocation(loc.id), locked));
      actions.appendChild(MainUI.makeButton('Искать приключение', locked ? 'disabled' : 'secondary', () => searchAdventure(loc.id), locked));
      if (ChestModule.hasChest(loc.id)) {
        actions.appendChild(MainUI.makeButton('🎁 Открыть сундук', 'gold', () => ChestModule.openChest(loc.id)));
      }
      if (loc.hasMerchant && p.locationId === loc.id) {
        actions.appendChild(MainUI.makeButton('🧙 Торговец', 'primary', () => ShopModule.open()));
      }
      root.appendChild(card);
    });

    applyBackground();
    updateCurrentPlayers();
  }

  function goLocation(locationId) {
    const p = PlayerModule.getPlayer();
    const loc = GameData.LOCATIONS.find((x) => x.id === locationId);
    if (p.level < loc.minLevel) {
      MainUI.notify('Локация недоступна по уровню.', 'warn');
      return;
    }
    PlayerModule.setLocation(locationId);
    MultiplayerModule.updatePlayerLocation(locationId);
    PlayerModule.renderPanel();
    MainUI.logEvent(`Переход: ${loc.name}`);
    MainUI.notify(`Вы прибыли в ${loc.name}`, 'info');
    renderLocations();
  }

  function searchAdventure(locationId) {
    const p = PlayerModule.getPlayer();
    if (p.locationId !== locationId) {
      MainUI.notify('Сначала перейдите в эту локацию.', 'warn');
      return;
    }
    CombatModule.startFight(locationId);
  }

  function applyBackground() {
    const p = PlayerModule.getPlayer();
    const loc = GameData.LOCATIONS.find((x) => x.id === p.locationId);
    const gameScreen = document.getElementById('gameScreen');
    gameScreen.style.background = `${loc.background}, url('') center/cover no-repeat`;
    // В url('') позже можно вставить путь к картинке фона конкретной локации.
    document.getElementById('currentLocationTitle').textContent = `${loc.icon} ${loc.name}`;
  }

  function updateCurrentPlayers() {
    const p = PlayerModule.getPlayer();
    const players = MultiplayerModule.getOnlinePlayers().filter((x) => x.locationId === p.locationId);
    const list = document.getElementById('locationPlayersList');
    list.innerHTML = '';
    players.forEach((pl) => {
      const li = document.createElement('li');
      li.textContent = `${pl.nickname} • Lv.${pl.level} • ${pl.className}`;
      list.appendChild(li);
    });
  }

  return { renderLocations, goLocation, searchAdventure, updateCurrentPlayers };
})();
