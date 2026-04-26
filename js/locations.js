window.LocationsModule = (() => {
  let locationPlayers = [];
  let unsub = null;

  function getCurrentLocation() {
    const p = PlayerModule.getPlayer();
    return GameData.LOCATIONS.find((l) => l.id === p?.locationId) || GameData.LOCATIONS[0];
  }

  function renderLocationsScreen() {
    const p = PlayerModule.getPlayer();
    const loc = getCurrentLocation();
    if (!p || !loc) return;

    UIManager.safeSetText('currentLocationName', `${loc.icon} ${loc.name}`);
    UIManager.safeSetText('currentLocationDesc', loc.description);
    UIManager.safeSetText('currentLocationLevel', `Требуемый уровень: ${loc.minLevel}`);
    UIManager.safeSetText('merchantHint', loc.hasMerchant ? '🧙 Торговец доступен.' : 'Торговца нет.');
    UIManager.qs('openChestBtn')?.classList.toggle('hidden', !ChestModule.hasChest(loc.id));

    const root = UIManager.qs('locationsGrid');
    root.innerHTML = '';
    GameData.LOCATIONS.forEach((l) => {
      const locked = p.level < l.minLevel;
      const card = document.createElement('article');
      card.className = `location-card ${locked ? 'locked' : ''}`;
      card.innerHTML = `<div class="loc-head"><h4>${l.icon} ${l.name}</h4><span>${locked ? `🔒 Lv.${l.minLevel}` : 'Открыта'}</span></div><p>${l.description}</p>`;
      card.append(UIManager.makeButton('Перейти', locked ? 'disabled' : 'primary', () => goLocation(l.id), locked));
      root.append(card);
    });

    listenLocationPlayers();
  }

  function goLocation(locationId) {
    const p = PlayerModule.getPlayer();
    const loc = GameData.LOCATIONS.find((x) => x.id === locationId);
    if (!p || !loc) return;
    if (p.level < loc.minLevel) return UIManager.showToast('Локация недоступна.', 'warning');

    const prev = p.locationId;
    if (!PlayerModule.setLocation(locationId)) return;
    OnlineModule.updatePlayerLocation(locationId, prev);
    PlayerModule.renderTopPanel();
    renderLocationsScreen();
    UIManager.showToast(`Переход в ${loc.name}`, 'info');
  }

  function searchAdventure() {
    CombatModule.startCombat(getCurrentLocation().id);
  }

  function renderPlayersInCurrentLocation() {
    const list = UIManager.qs('playersInLocation');
    if (!list) return;
    list.innerHTML = '';

    if (!locationPlayers.length) {
      list.innerHTML = '<li>В локации никого нет.</li>';
      return;
    }

    locationPlayers.forEach((pl) => {
      const row = document.createElement('li');
      row.className = 'player-row';
      row.innerHTML = `<div><strong>${pl.nickname}</strong> • Lv.${pl.level} • ${pl.className} • ${pl.clanId || 'без клана'} • ${pl.status}</div>`;
      if (pl.userId !== OnlineModule.getCurrentUserId()) {
        row.append(UIManager.makeButton('В бой', 'secondary', () => invitePlayerToBattle(pl.userId)));
        row.append(UIManager.makeButton('В клан', 'secondary', () => ClansModule.invitePlayerToClan(pl.nickname)));
        row.append(UIManager.makeButton('Профиль', 'gold', () => openPlayerProfile(pl.userId)));
      }
      list.append(row);
    });
  }

  function invitePlayerToBattle(targetPlayerId) {
    PartyCombatModule.createBattleInvite(targetPlayerId);
  }

  async function openPlayerProfile(playerId) {
    const online = await ServerAPI.get(`playersOnline/${playerId}`, null);
    if (!online) return UIManager.showToast('Профиль недоступен.', 'warning');
    UIManager.showModal(
      `Профиль: ${online.nickname}`,
      `<p>Класс: ${online.className}</p><p>Уровень: ${online.level}</p><p>Клан: ${online.clanId || '—'}</p><p>Статус: ${online.status}</p>`,
      [{ label: 'Закрыть', type: 'secondary', onClick: UIManager.closeModal }]
    );
  }

  function listenLocationPlayers() {
    unsub?.();
    const loc = getCurrentLocation();
    unsub = OnlineModule.listenPlayersInLocation(loc.id, (players) => {
      locationPlayers = players;
      renderPlayersInCurrentLocation();
    });
  }

  function bind() {
    UIManager.qs('searchAdventureBtn')?.addEventListener('click', searchAdventure);
    UIManager.qs('openChestBtn')?.addEventListener('click', () => ChestModule.openChest(`loc_${getCurrentLocation().id}`));
  }

  return {
    getCurrentLocation,
    renderLocationsScreen,
    renderPlayersInCurrentLocation,
    invitePlayerToBattle,
    openPlayerProfile,
    listenLocationPlayers,
    bind
  };
})();
