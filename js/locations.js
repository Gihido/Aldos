window.LocationsModule = (() => {
  function current() {
    const p = PlayerModule.getPlayer();
    return GameData.LOCATIONS.find((l) => l.id === p.locationId) || GameData.LOCATIONS[0];
  }

  function renderLocations() {
    const p = PlayerModule.getPlayer();
    const loc = current();
    UIManager.qs('gameScreen').style.background = loc.bg;
    UIManager.qs('locationTitle').textContent = `${loc.icon} ${loc.name}`;
    UIManager.qs('locationDesc').textContent = `${loc.desc} • Рек. уровень ${loc.recLevel}`;
    UIManager.qs('merchantInfo').textContent = loc.hasMerchant ? 'Торговец доступен.' : 'Торговец недоступен.';

    const list = UIManager.qs('locationCards');
    list.innerHTML = '';
    GameData.LOCATIONS.forEach((l) => {
      const card = document.createElement('article');
      const locked = p.level < l.recLevel;
      card.className = `location-card ${locked ? 'locked' : ''}`;
      card.innerHTML = `<h4>${l.icon} ${l.name}</h4><p>${l.desc}</p><small>Рек. уровень ${l.recLevel}</small>`;
      card.append(UIManager.makeButton('Перейти', locked ? 'disabled' : 'primary', () => moveTo(l.id), locked));
      list.append(card);
    });

    renderPlayersInCurrentLocation();
  }

  function moveTo(id) {
    const p = PlayerModule.getPlayer();
    const target = GameData.LOCATIONS.find((l) => l.id === id);
    if (!target) return;
    if (p.level < target.recLevel) return UIManager.showToast('Локация закрыта по уровню.', 'warning');
    p.locationId = id;
    PlayerModule.savePlayer();
    LocalServer.setPlayerOnline();
    renderLocations();
  }

  function renderPlayersInCurrentLocation() {
    const list = UIManager.qs('locationPlayers');
    list.innerHTML = '';
    const locId = PlayerModule.getPlayer().locationId;
    const players = OnlineModule.getOnlinePlayers().filter((p) => p.locationId === locId);
    if (!players.length) {
      list.innerHTML = '<li>Никого рядом.</li>';
      return;
    }

    players.forEach((pl) => {
      const li = document.createElement('li');
      li.innerHTML = `<div><strong>${pl.nickname}</strong> • Lv.${pl.level} • ${pl.className} • ${pl.status}</div>`;
      if (pl.playerId !== PlayerModule.getPlayer().playerId) {
        li.append(UIManager.makeButton('В бой', 'secondary', () => CombatModule.invitePlayerToBattle(pl.playerId)));
      }
      list.append(li);
    });
  }

  function bind() {
    UIManager.qs('startAdventureBtn').onclick = () => CombatModule.startBattle(PlayerModule.getPlayer().locationId);
    UIManager.qs('openChestBtn').onclick = () => ChestModule.openChest();
  }

  return { current, renderLocations, bind, renderPlayersInCurrentLocation };
})();
