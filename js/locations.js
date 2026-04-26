window.LocationsModule = (() => {
  function getCurrentLocation() {
    const player = PlayerModule.getPlayer();
    return GameData.LOCATIONS.find((l) => l.id === player?.locationId) || GameData.LOCATIONS[0];
  }

  function applyLocationTheme() {
    const loc = getCurrentLocation();
    const root = UIManager.qs('gameScreen');
    if (!root || !loc) return;

    const bg = loc.image ? `${loc.background}, url('${loc.image}') center/cover no-repeat` : loc.background;
    root.style.background = bg;

    UIManager.safeSetText('currentLocationName', `${loc.icon} ${loc.name}`);
    UIManager.safeSetText('currentLocationDesc', loc.description);
  }

  function renderCurrentLocationCard() {
    const loc = getCurrentLocation();
    const player = PlayerModule.getPlayer();
    if (!loc || !player) return;

    UIManager.safeSetText('currentLocationLevel', `Требование: Lv.${loc.minLevel}`);

    const merchantHint = UIManager.qs('merchantHint');
    if (merchantHint) {
      merchantHint.textContent = loc.hasMerchant ? '🧙 Торговец доступен в этой локации.' : '🧙 Торговца в этой локации нет.';
    }

    const chestBtn = UIManager.qs('openChestBtn');
    if (chestBtn) chestBtn.classList.toggle('hidden', !ChestModule.hasChest(loc.id));
  }

  function renderLocationList() {
    const player = PlayerModule.getPlayer();
    const root = UIManager.qs('locationsGrid');
    if (!root || !player) return;

    root.innerHTML = '';

    GameData.LOCATIONS.forEach((loc) => {
      const locked = player.level < loc.minLevel;
      const card = document.createElement('article');
      card.className = `location-card ${locked ? 'locked' : ''}`;

      card.innerHTML = `
        <div class="loc-head">
          <h4>${loc.icon} ${loc.name}</h4>
          <span>${locked ? `🔒 Lv.${loc.minLevel}` : 'Открыта'}</span>
        </div>
        <p>${loc.description}</p>
      `;

      const btn = UIManager.makeButton(locked ? `Нужно Lv.${loc.minLevel}` : 'Перейти', locked ? 'disabled' : 'primary', () => goToLocation(loc.id), locked);
      card.append(btn);
      root.append(card);
    });
  }

  function goToLocation(locationId) {
    const player = PlayerModule.getPlayer();
    const location = GameData.LOCATIONS.find((l) => l.id === locationId);
    if (!player || !location) return;

    if (player.level < location.minLevel) {
      UIManager.showToast('Локация недоступна.', 'warning');
      return;
    }

    if (PlayerModule.setLocation(locationId)) {
      MultiplayerModule.updatePlayerLocation(locationId);
      PlayerModule.renderTopPanel();
      renderLocationsScreen();
      UIManager.pushEvent(`Переход: ${location.name}`);
      UIManager.showToast(`Вы прибыли: ${location.name}`, 'info');
    }
  }

  function searchAdventure() {
    const loc = getCurrentLocation();
    if (!loc) return;
    CombatModule.startCombat(loc.id);
  }

  function renderPlayersInLocation() {
    const loc = getCurrentLocation();
    const root = UIManager.qs('playersInLocation');
    if (!root || !loc) return;

    root.innerHTML = '';
    const players = MultiplayerModule.getOnlinePlayers().filter((p) => p.locationId === loc.id);
    if (!players.length) {
      root.innerHTML = '<li>Пока никого рядом.</li>';
      return;
    }

    players.forEach((p) => {
      const li = document.createElement('li');
      li.textContent = `${p.nickname} • Lv.${p.level} • ${p.className}`;
      root.append(li);
    });
  }

  function renderLocationsScreen() {
    applyLocationTheme();
    renderCurrentLocationCard();
    renderLocationList();
    renderPlayersInLocation();
  }

  function bind() {
    UIManager.qs('searchAdventureBtn')?.addEventListener('click', searchAdventure);
    UIManager.qs('openChestBtn')?.addEventListener('click', () => {
      const loc = getCurrentLocation();
      if (loc) ChestModule.openChest(loc.id);
    });
  }

  return { bind, getCurrentLocation, renderLocationsScreen, renderPlayersInLocation };
})();
