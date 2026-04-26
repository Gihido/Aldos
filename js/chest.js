window.ChestModule = (() => {
  const KEY = 'sok_chests_v2';

  function readState() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || '{}');
      return typeof data === 'object' && data ? data : {};
    } catch {
      return {};
    }
  }

  function saveState(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function hasChest(locationId) {
    const state = readState();
    return !!state[locationId] && !state[locationId].opened;
  }

  function markChestFound(locationId) {
    const state = readState();
    if (state[locationId]?.opened === false) return;
    state[locationId] = { opened: false, foundAt: Date.now() };
    saveState(state);
    UIManager.showToast('Найден сундук!', 'loot');
    LocationsModule.renderLocationsScreen();
  }

  function openChest(locationId) {
    const state = readState();
    const entry = state[locationId];
    if (!entry || entry.opened) {
      UIManager.showToast('Этот сундук уже открыт.', 'warning');
      return;
    }

    const tier = Math.random() <= 0.32 ? 'rare' : 'common';
    const table = GameData.CHESTS[tier];
    const gold = rand(table.gold[0], table.gold[1]);

    PlayerModule.changeGold(gold);

    const drops = [];
    table.itemDrops.forEach((drop) => {
      if (Math.random() <= drop.chance && InventoryModule.addItem(drop.itemId)) {
        drops.push(GameData.ITEMS[drop.itemId].name);
      }
    });

    entry.opened = true;
    entry.openedAt = Date.now();
    saveState(state);

    UIManager.qs('chestLootText').textContent = drops.length ? `+${gold} 🪙 и ${drops.join(', ')}` : `+${gold} 🪙`;
    UIManager.openModal('chestModal');
    UIManager.showToast('Сундук открыт!', 'loot');
    UIManager.pushEvent(`Сундук (${tier}) открыт.`);

    PlayerModule.renderTopPanel();
    LocationsModule.renderLocationsScreen();
    InventoryModule.renderInventory();
  }

  function bind() {
    UIManager.qs('closeChestModal')?.addEventListener('click', () => UIManager.closeModal('chestModal'));
  }

  function rand(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }

  return { bind, hasChest, markChestFound, openChest };
})();
